import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { usePeerStore } from '../stores/peerStore';
import { useGameStore } from '../stores/gameStore';
import { GameState } from '../types';
import { verifyDeckOwnership } from '../../data/blockchain/deckVerification';
import { sha256Hash } from '../../data/blockchain/hashUtils';
import { verifyDeck as verifyDeckOnServer } from '../../data/chainAPI';
import { hiveSync } from '../../data/HiveSync';
import type { PackagedMatchResult } from '../../data/blockchain/types';
import { createSeededRng, seededShuffle } from '../utils/seededRng';
import { startNewTranscript, getActiveTranscript, clearTranscript } from '../../data/blockchain/transcriptBuilder';
import type { GameMove } from '../../data/blockchain/signedMove';
import { getWasmHash, isWasmAvailable, loadWasmEngine } from '../engine/wasmLoader';
import { computeStateHash } from '../engine/engineBridge';

declare const __BUILD_HASH__: string;

/**
 * Flip the game state so the client sees themselves as 'player' and the host as 'opponent'.
 * The host always stores state from its own perspective (host=player, client=opponent).
 * Without this flip the client would see their own cards at the top under "opponent".
 */
function flipGameState(state: GameState): GameState {
	return {
		...state,
		players: {
			player: state.players.opponent,
			opponent: state.players.player,
		},
		currentTurn: state.currentTurn === 'player' ? 'opponent' : 'player',
		winner: state.winner === 'player' ? 'opponent' : state.winner === 'opponent' ? 'player' : state.winner,
		fatigueCount: state.fatigueCount ? {
			player: state.fatigueCount.opponent ?? 0,
			opponent: state.fatigueCount.player ?? 0,
		} : state.fatigueCount,
		mulligan: state.mulligan ? {
			...state.mulligan,
			playerReady: (state.mulligan as any).opponentReady ?? false,
			opponentReady: (state.mulligan as any).playerReady ?? false,
		} : state.mulligan,
	};
}

/**
 * Translate a target ID from the client's flipped perspective back to the host's perspective.
 * e.g. the client sees the host's hero as 'opponent-hero', but the host calls it 'player-hero'.
 */
function translateTargetForHost(targetId: string | undefined): string | undefined {
	if (targetId === 'opponent-hero') return 'player-hero';
	if (targetId === 'player-hero') return 'opponent-hero';
	return targetId;
}

function generateSalt(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

let moveCounter = 0;

function recordMove(action: string, payload: Record<string, unknown>, playerId: string): void {
	const transcript = getActiveTranscript();
	if (!transcript) return;
	const move: GameMove = {
		moveNumber: moveCounter++,
		action,
		payload,
		playerId,
		timestamp: Date.now(),
	};
	transcript.addMove(move);
}

export type P2PMessage =
	| { type: 'init'; gameState: GameState; isHost: boolean }
	| { type: 'playCard'; cardId: string; targetId?: string; targetType?: 'minion' | 'hero' }
	| { type: 'attack'; attackerId: string; defenderId: string }
	| { type: 'endTurn' }
	| { type: 'useHeroPower'; targetId?: string }
	| { type: 'gameState'; gameState: GameState }
	| { type: 'opponentDisconnected' }
	| { type: 'ping' }
	| { type: 'pong' }
	| { type: 'deck_verify'; hiveAccount: string; nftIds: string[] }
	| { type: 'seed_commit'; commitment: string }
	| { type: 'seed_reveal'; salt: string }
	| { type: 'result_propose'; result: PackagedMatchResult; hash: string; broadcasterSig: string }
	| { type: 'result_countersign'; counterpartySig: string }
	| { type: 'result_reject'; reason: string }
	| { type: 'version_check'; buildHash: string }
	| { type: 'wasm_hash_check'; wasmHash: string }
	| { type: 'hash_check'; stateHash: string; turnNumber: number }
	| { type: 'hash_mismatch'; turnNumber: number; myHash: string };

const RESULT_SIGN_TIMEOUT_MS = 30_000;

export function useP2PSync() {
	const { connection, connectionState, isHost, send } = usePeerStore();
	const gameStore = useGameStore();
	const lastSyncRef = useRef<number>(0);
	const messageQueueRef = useRef<P2PMessage[]>([]);
	const isProcessingRef = useRef(false);
	const initSentRef = useRef(false);
	const pendingSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Commit-reveal seed exchange state
	const mySaltRef = useRef<string | null>(null);
	const theirCommitmentRef = useRef<string | null>(null);
	const seedResolvedRef = useRef(false);

	// Dual-sig result state
	const pendingResultRef = useRef<{
		result: PackagedMatchResult;
		hash: string;
		broadcasterSig: string;
		resolve: (sigs: { broadcaster: string; counterparty: string }) => void;
		reject: (err: Error) => void;
	} | null>(null);

	// Seed exchange: generate salt and send commitment when connection opens
	// Also send version_check and start a new transcript
	useEffect(() => {
		if (!connection || connectionState !== 'connected') {
			mySaltRef.current = null;
			theirCommitmentRef.current = null;
			seedResolvedRef.current = false;
			clearTranscript();
			moveCounter = 0;
			return;
		}

		loadWasmEngine().then(() => {
			const wasmHash = getWasmHash();
			send({ type: 'wasm_hash_check', wasmHash });
		});

		const salt = generateSalt();
		mySaltRef.current = salt;

		sha256Hash(salt).then(commitment => {
			send({ type: 'seed_commit', commitment });
		});

		const hash = typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 'dev';
		send({ type: 'version_check', buildHash: hash });

		startNewTranscript();
	}, [connection, connectionState, send]);

	// Host sends init AFTER seed exchange completes (replaces old 200ms timer)
	useEffect(() => {
		if (!connection || !isHost || connectionState !== 'connected') {
			initSentRef.current = false;
			return;
		}
		if (initSentRef.current) return;
		if (!seedResolvedRef.current) return;

		initSentRef.current = true;
		const currentState = useGameStore.getState().gameState;
		if (currentState) {
			send({ type: 'init', gameState: currentState, isHost: true });
		}
	}, [connection, isHost, connectionState, send]);

	// Detect when connection closes and notify the player
	useEffect(() => {
		if (!connection) return;

		const handleClose = () => {
			console.warn('[useP2PSync] Connection to opponent closed');
			toast.error('Opponent disconnected from the game.', {
				duration: 8000,
				description: 'The connection was lost. You may need to start a new game.',
			});
		};

		connection.on('close', handleClose);
		return () => {
			connection.off('close', handleClose);
		};
	}, [connection]);

	useEffect(() => {
		if (!connection || connectionState !== 'connected') return;

		const processMessage = async (data: P2PMessage) => {
			switch (data.type) {
				case 'version_check': {
					const myHash = typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 'dev';
					if (data.buildHash !== myHash && data.buildHash !== 'dev' && myHash !== 'dev') {
						toast.warning('Client version mismatch', {
							description: `Your build: ${myHash.slice(0, 7)}, opponent: ${data.buildHash.slice(0, 7)}. Results may differ.`,
							duration: 8000,
						});
					}
					break;
				}

				case 'wasm_hash_check': {
					const myWasmHash = getWasmHash();
					const theirWasmHash = data.wasmHash;
					if (theirWasmHash !== myWasmHash && theirWasmHash !== 'dev' && myWasmHash !== 'dev' && theirWasmHash !== 'unavailable' && myWasmHash !== 'unavailable') {
						toast.error('WASM engine mismatch — ranked play blocked', {
							description: `Your engine: ${myWasmHash.slice(0, 12)}…, opponent: ${theirWasmHash.slice(0, 12)}…`,
							duration: 10000,
						});
					}
					break;
				}

				case 'hash_check': {
					const gs = useGameStore.getState().gameState;
					if (!gs || !isWasmAvailable()) break;
					const myHash = await computeStateHash(gs);
					if (myHash !== data.stateHash) {
						console.error(`[useP2PSync] State hash mismatch at turn ${data.turnNumber}: local=${myHash.slice(0, 16)}, remote=${data.stateHash.slice(0, 16)}`);
						send({ type: 'hash_mismatch', turnNumber: data.turnNumber, myHash });
						toast.error('State verification failed', {
							description: 'Game state diverged from opponent. Possible cheating detected.',
							duration: 8000,
						});
					}
					break;
				}

				case 'hash_mismatch':
					console.error(`[useP2PSync] Opponent reports hash mismatch at turn ${data.turnNumber}: theirHash=${data.myHash.slice(0, 16)}`);
					toast.error('State verification failed', {
						description: 'Opponent detected state divergence. Game integrity compromised.',
						duration: 8000,
					});
					break;

				case 'seed_commit':
					theirCommitmentRef.current = data.commitment;
					if (mySaltRef.current) {
						send({ type: 'seed_reveal', salt: mySaltRef.current });
					}
					break;

				case 'seed_reveal': {
					const theirSalt = data.salt;
					const theirCommitment = theirCommitmentRef.current;
					if (!theirCommitment) {
						console.warn('[useP2PSync] Received seed_reveal before seed_commit');
						break;
					}

					const expectedCommitment = await sha256Hash(theirSalt);
					if (expectedCommitment !== theirCommitment) {
						console.error('[useP2PSync] Seed commitment mismatch — possible cheating');
						toast.error('Seed verification failed. Disconnecting.', { duration: 5000 });
						usePeerStore.getState().disconnect();
						break;
					}

					const myPeerId = usePeerStore.getState().myPeerId ?? '';
					const remotePeerId = usePeerStore.getState().remotePeerId ?? '';
					const mySalt = mySaltRef.current ?? '';
					const [first, second] = myPeerId < remotePeerId
						? [mySalt, theirSalt]
						: [theirSalt, mySalt];
					const matchSeed = await sha256Hash(first + second);

					useGameStore.setState({ matchSeed });
					seedResolvedRef.current = true;

					if (isHost) {
						const rng = createSeededRng(matchSeed);
						const gs = useGameStore.getState().gameState;
						if (gs) {
							const reshuffled = {
								...gs,
								players: {
									player: { ...gs.players.player, deck: seededShuffle(gs.players.player.deck, rng) },
									opponent: { ...gs.players.opponent, deck: seededShuffle(gs.players.opponent.deck, rng) },
								},
							};
							useGameStore.setState({ gameState: reshuffled });
						}

						initSentRef.current = true;
						const updatedState = useGameStore.getState().gameState;
						if (updatedState) {
							send({ type: 'init', gameState: updatedState, isHost: true });
						}
					}
					break;
				}

				case 'init':
					if (!isHost) {
						useGameStore.setState({ gameState: flipGameState(data.gameState) });
					}
					break;

				case 'playCard':
					if (isHost) {
						const gs = useGameStore.getState().gameState;
						if (gs.currentTurn !== 'opponent' || gs.gamePhase === 'game_over') break;
						recordMove('playCard', { cardId: data.cardId, targetId: data.targetId, targetType: data.targetType }, 'opponent');
						gameStore.playCard(data.cardId, translateTargetForHost(data.targetId), data.targetType);
						debouncedSync();
					}
					break;

				case 'attack':
					if (isHost) {
						const gs = useGameStore.getState().gameState;
						if (gs.currentTurn !== 'opponent' || gs.gamePhase === 'game_over') break;
						recordMove('attack', { attackerId: data.attackerId, defenderId: data.defenderId }, 'opponent');
						gameStore.attackWithCard(data.attackerId, translateTargetForHost(data.defenderId) ?? data.defenderId);
						debouncedSync();
					}
					break;

				case 'endTurn':
					if (isHost) {
						const gs = useGameStore.getState().gameState;
						if (gs.currentTurn !== 'opponent' || gs.gamePhase === 'game_over') break;
						recordMove('endTurn', {}, 'opponent');
						gameStore.endTurn();
						debouncedSync();
					}
					break;

				case 'useHeroPower':
					if (isHost) {
						const gs = useGameStore.getState().gameState;
						if (gs.currentTurn !== 'opponent' || gs.gamePhase === 'game_over') break;
						recordMove('useHeroPower', { targetId: data.targetId }, 'opponent');
						gameStore.useHeroPower(translateTargetForHost(data.targetId));
						debouncedSync();
					}
					break;

				case 'gameState':
					if (!isHost) {
						const flipped = flipGameState(data.gameState);
						const currentState = useGameStore.getState().gameState;
						const changed = !currentState ||
							currentState.turnNumber !== flipped.turnNumber ||
							currentState.gamePhase !== flipped.gamePhase ||
							currentState.currentTurn !== flipped.currentTurn ||
							currentState.players?.player?.heroHealth !== flipped.players?.player?.heroHealth ||
							currentState.players?.opponent?.heroHealth !== flipped.players?.opponent?.heroHealth ||
							currentState.players?.player?.mana?.current !== flipped.players?.player?.mana?.current ||
							currentState.players?.player?.hand?.length !== flipped.players?.player?.hand?.length ||
							currentState.players?.player?.battlefield?.length !== flipped.players?.player?.battlefield?.length ||
							currentState.players?.opponent?.battlefield?.length !== flipped.players?.opponent?.battlefield?.length;
						if (changed) {
							useGameStore.setState({ gameState: flipped });
						}
					}
					break;

				case 'opponentDisconnected':
					console.warn('[useP2PSync] Opponent disconnected from game');
					toast.error('Opponent disconnected.', { duration: 8000 });
					break;

				case 'ping':
					send({ type: 'pong' });
					break;

				case 'deck_verify': {
					let checkedCount = 0;
					verifyDeckOwnership(
						data.hiveAccount,
						data.nftIds.map(id => ({ nft_id: id })),
					).then(result => {
						checkedCount++;
						if (!result.valid) {
							toast.error(`Opponent deck verification failed`, {
								description: `${result.invalidCards.length} card(s) not owned by ${data.hiveAccount}. Disconnecting.`,
								duration: 5000,
							});
							if (checkedCount > 0) {
								setTimeout(() => usePeerStore.getState().disconnect(), 2000);
							}
						}
					}).catch(() => { /* IndexedDB unavailable in dev mode — skip */ });

					if (data.hiveAccount && data.nftIds.length > 0) {
						const cardIds = data.nftIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
						if (cardIds.length > 0) {
							verifyDeckOnServer(data.hiveAccount, cardIds)
								.then(sv => {
									checkedCount++;
									if (!sv.verified) {
										toast.error('Server deck verification failed', {
											description: `${sv.missing.length} card(s) not found on-chain for ${data.hiveAccount}. Disconnecting.`,
											duration: 5000,
										});
										if (checkedCount > 0) {
											setTimeout(() => usePeerStore.getState().disconnect(), 2000);
										}
									}
								})
								.catch(() => { /* Chain indexer unavailable — skip */ });
						}
					}
					break;
				}

				case 'result_propose': {
					if (!data.result || !data.hash || typeof data.hash !== 'string' ||
						!data.result.winner?.username || !data.result.loser?.username) {
						send({ type: 'result_reject', reason: 'malformed_proposal' });
						break;
					}
					const gs = useGameStore.getState().gameState;
					const myWinner = gs?.winner;

					const expectedHostWinner = myWinner === 'player' ? 'opponent' : 'player';
					const proposedWinner = data.result.winner.username;
					const hostUsername = data.result.matchType === 'ranked'
						? (expectedHostWinner === 'player' ? data.result.winner.username : data.result.loser.username)
						: proposedWinner;

					const clientUsername = hiveSync.getUsername();
					const iAmWinner = myWinner === 'player';
					const resultSaysIWon = data.result.winner.username === clientUsername;
					const resultSaysILost = data.result.loser.username === clientUsername;

					if ((iAmWinner && resultSaysIWon) || (!iAmWinner && resultSaysILost)) {
						try {
							const sig = await hiveSync.signResultHash(data.hash);
							send({ type: 'result_countersign', counterpartySig: sig });
						} catch {
							send({ type: 'result_reject', reason: 'signing_failed' });
						}
					} else if (!clientUsername) {
						send({ type: 'result_reject', reason: 'no_hive_account' });
					} else {
						send({ type: 'result_reject', reason: 'winner_mismatch' });
					}
					break;
				}

				case 'result_countersign': {
					const pending = pendingResultRef.current;
					if (pending) {
						pending.resolve({
							broadcaster: pending.broadcasterSig,
							counterparty: data.counterpartySig,
						});
						pendingResultRef.current = null;
					}
					break;
				}

				case 'result_reject': {
					const pending = pendingResultRef.current;
					if (pending) {
						pending.reject(new Error(`Result rejected: ${data.reason}`));
						pendingResultRef.current = null;
					}
					break;
				}

				default:
					console.warn('[useP2PSync] Unknown message type:', (data as any).type);
			}
		};

		const processQueue = async () => {
			if (isProcessingRef.current) return;
			isProcessingRef.current = true;
			try {
				while (messageQueueRef.current.length > 0) {
					const msg = messageQueueRef.current.shift()!;
					await processMessage(msg);
				}
			} catch (err) {
				console.error('[useP2PSync] Error processing message:', err);
			} finally {
				isProcessingRef.current = false;
			}
		};

		const handleMessage = (data: P2PMessage) => {
			messageQueueRef.current.push(data);
			processQueue();
		};

		const handleMessageWrapper = (data: unknown) => handleMessage(data as P2PMessage);
		connection.on('data', handleMessageWrapper);

		return () => {
			connection.off('data', handleMessageWrapper);
		};
	}, [connection, connectionState, isHost, send, gameStore]);

	const syncGameState = useCallback(() => {
		if (connectionState !== 'connected' || !isHost) return;
		const now = Date.now();
		if (now - lastSyncRef.current < 100) return;
		lastSyncRef.current = now;
		const currentState = useGameStore.getState().gameState;
		send({ type: 'gameState', gameState: currentState });
	}, [connectionState, isHost, send]);

	const debouncedSync = useCallback(() => {
		if (pendingSyncRef.current) clearTimeout(pendingSyncRef.current);
		pendingSyncRef.current = setTimeout(() => {
			syncGameState();
			pendingSyncRef.current = null;
		}, 25);
	}, [syncGameState]);

	const wrappedPlayCard = useCallback((cardId: string, targetId?: string, targetType?: 'minion' | 'hero') => {
		if (connectionState === 'connected' && !isHost) {
			recordMove('playCard', { cardId, targetId, targetType }, 'player');
			send({ type: 'playCard', cardId, targetId: translateTargetForHost(targetId), targetType });
		} else {
			recordMove('playCard', { cardId, targetId, targetType }, 'player');
			gameStore.playCard(cardId, targetId, targetType);
			if (isHost) debouncedSync();
		}
	}, [connectionState, isHost, send, gameStore, debouncedSync]);

	const wrappedAttack = useCallback((attackerId: string, defenderId: string) => {
		if (connectionState === 'connected' && !isHost) {
			recordMove('attack', { attackerId, defenderId }, 'player');
			send({ type: 'attack', attackerId, defenderId: translateTargetForHost(defenderId) ?? defenderId });
		} else {
			recordMove('attack', { attackerId, defenderId }, 'player');
			gameStore.attackWithCard(attackerId, defenderId);
			if (isHost) debouncedSync();
		}
	}, [connectionState, isHost, send, gameStore, debouncedSync]);

	const wrappedEndTurn = useCallback(() => {
		if (connectionState === 'connected' && !isHost) {
			recordMove('endTurn', {}, 'player');
			send({ type: 'endTurn' });
		} else {
			recordMove('endTurn', {}, 'player');
			gameStore.endTurn();
			if (isHost) debouncedSync();
		}
	}, [connectionState, isHost, send, gameStore, debouncedSync]);

	const wrappedUseHeroPower = useCallback((targetId?: string) => {
		if (connectionState === 'connected' && !isHost) {
			recordMove('useHeroPower', { targetId }, 'player');
			send({ type: 'useHeroPower', targetId: translateTargetForHost(targetId) });
		} else {
			recordMove('useHeroPower', { targetId }, 'player');
			gameStore.useHeroPower(targetId);
			if (isHost) debouncedSync();
		}
	}, [connectionState, isHost, send, gameStore, debouncedSync]);

	// Host broadcasts state every 500ms as heartbeat sync
	useEffect(() => {
		if (connectionState !== 'connected' || !isHost) return;
		const interval = setInterval(() => {
			syncGameState();
		}, 500);
		return () => clearInterval(interval);
	}, [connectionState, isHost, syncGameState]);

	// Client pings host every 10s to keep the connection alive
	useEffect(() => {
		if (connectionState !== 'connected' || isHost) return;
		const interval = setInterval(() => {
			send({ type: 'ping' });
		}, 10_000);
		return () => clearInterval(interval);
	}, [connectionState, isHost, send]);

	// Host sends state hash check every 2s for anti-cheat verification
	useEffect(() => {
		if (connectionState !== 'connected' || !isHost || !isWasmAvailable()) return;
		const interval = setInterval(async () => {
			const gs = useGameStore.getState().gameState;
			if (!gs || gs.gamePhase === 'game_over') return;
			const stateHash = await computeStateHash(gs);
			send({ type: 'hash_check', stateHash, turnNumber: gs.turnNumber });
		}, 2000);
		return () => clearInterval(interval);
	}, [connectionState, isHost, send]);

	// Send our deck's NFT IDs to the opponent for ownership verification
	const sendDeckVerification = useCallback((hiveAccount: string, nftIds: string[]) => {
		if (connectionState === 'connected') {
			send({ type: 'deck_verify', hiveAccount, nftIds });
		}
	}, [connectionState, send]);

	/**
	 * Propose a match result to the opponent for dual-signature verification.
	 * Returns the signatures object if the opponent counter-signs within 30s,
	 * or null if they reject/timeout (single-sig fallback).
	 */
	const proposeResult = useCallback(async (
		result: PackagedMatchResult,
		hash: string,
		broadcasterSig: string,
	): Promise<{ broadcaster: string; counterparty: string } | null> => {
		if (connectionState !== 'connected') return null;

		return new Promise((resolve) => {
			pendingResultRef.current = {
				result,
				hash,
				broadcasterSig,
				resolve: (sigs) => resolve(sigs),
				reject: () => resolve(null),
			};

			send({ type: 'result_propose', result, hash, broadcasterSig });

			// 30s timeout — fall back to single-sig
			setTimeout(() => {
				if (pendingResultRef.current) {
					pendingResultRef.current = null;
					resolve(null);
				}
			}, RESULT_SIGN_TIMEOUT_MS);
		});
	}, [connectionState, send]);

	return {
		syncGameState,
		playCard: wrappedPlayCard,
		attackWithCard: wrappedAttack,
		endTurn: wrappedEndTurn,
		useHeroPower: wrappedUseHeroPower,
		sendDeckVerification,
		proposeResult,
		isConnected: connectionState === 'connected',
		isHost,
	};
}
