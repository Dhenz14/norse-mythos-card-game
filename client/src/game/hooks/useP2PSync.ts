import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { usePeerStore } from '../stores/peerStore';
import { useGameStore } from '../stores/gameStore';
import { GameState } from '../types';
import { verifyDeckOwnership } from '../../data/blockchain/deckVerification';
import { sha256Hash } from '../../data/blockchain/hashUtils';
import { hiveSync } from '../../data/HiveSync';
import type { PackagedMatchResult } from '../../data/blockchain/types';
import { createSeededRng, seededShuffle } from '../utils/seededRng';

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
	| { type: 'result_reject'; reason: string };

const RESULT_SIGN_TIMEOUT_MS = 30_000;

export function useP2PSync() {
	const { connection, connectionState, isHost, send } = usePeerStore();
	const gameStore = useGameStore();
	const lastSyncRef = useRef<number>(0);
	const isProcessingRef = useRef(false);
	const initSentRef = useRef(false);

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
	useEffect(() => {
		if (!connection || connectionState !== 'connected') {
			mySaltRef.current = null;
			theirCommitmentRef.current = null;
			seedResolvedRef.current = false;
			return;
		}

		const salt = generateSalt();
		mySaltRef.current = salt;

		sha256Hash(salt).then(commitment => {
			send({ type: 'seed_commit', commitment });
		});
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

		const handleMessage = async (data: P2PMessage) => {
			if (isProcessingRef.current) return;
			isProcessingRef.current = true;

			try {
				switch (data.type) {
					case 'seed_commit':
						theirCommitmentRef.current = data.commitment;
						// Now reveal our salt (we already sent our commitment)
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

						// Verify commitment
						const expectedCommitment = await sha256Hash(theirSalt);
						if (expectedCommitment !== theirCommitment) {
							console.error('[useP2PSync] Seed commitment mismatch — possible cheating');
							toast.error('Seed verification failed. Disconnecting.', { duration: 5000 });
							usePeerStore.getState().disconnect();
							break;
						}

						// Derive joint seed — sort by peerId for determinism
						const myPeerId = usePeerStore.getState().myPeerId ?? '';
						const remotePeerId = usePeerStore.getState().remotePeerId ?? '';
						const mySalt = mySaltRef.current ?? '';
						const [first, second] = myPeerId < remotePeerId
							? [mySalt, theirSalt]
							: [theirSalt, mySalt];
						const matchSeed = await sha256Hash(first + second);

						useGameStore.setState({ matchSeed });
						seedResolvedRef.current = true;

						// Host: re-shuffle both decks with the agreed seed, then send init
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
							gameStore.playCard(data.cardId, translateTargetForHost(data.targetId), data.targetType);
							setTimeout(() => syncGameState(), 50);
						}
						break;

					case 'attack':
						if (isHost) {
							gameStore.attackWithCard(data.attackerId, translateTargetForHost(data.defenderId) ?? data.defenderId);
							setTimeout(() => syncGameState(), 50);
						}
						break;

					case 'endTurn':
						if (isHost) {
							gameStore.endTurn();
							setTimeout(() => syncGameState(), 50);
						}
						break;

					case 'useHeroPower':
						if (isHost) {
							gameStore.useHeroPower(translateTargetForHost(data.targetId));
							setTimeout(() => syncGameState(), 50);
						}
						break;

					case 'gameState':
						if (!isHost) {
							const flipped = flipGameState(data.gameState);
							const currentState = useGameStore.getState().gameState;
							if (JSON.stringify(currentState) !== JSON.stringify(flipped)) {
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

					case 'deck_verify':
						verifyDeckOwnership(
							data.hiveAccount,
							data.nftIds.map(id => ({ nft_id: id })),
						).then(result => {
							if (!result.valid) {
								toast.warning(`Opponent deck verification failed`, {
									description: `${result.invalidCards.length} card(s) not owned by ${data.hiveAccount}. Match may be invalid.`,
									duration: 8000,
								});
							}
						}).catch(() => { /* IndexedDB unavailable in dev mode — skip */ });
						break;

					case 'result_propose': {
						// Client receives a match result proposal from the host
						const gs = useGameStore.getState().gameState;
						const myWinner = gs?.winner;

						// Flip perspective: client sees 'player' as winner, but host's result
						// uses the host perspective where host=player, client=opponent
						const expectedHostWinner = myWinner === 'player' ? 'opponent' : 'player';
						const proposedWinner = data.result.winner.username;
						const hostUsername = data.result.matchType === 'ranked'
							? (expectedHostWinner === 'player' ? data.result.winner.username : data.result.loser.username)
							: proposedWinner;

						// Basic check: the result agrees on who won
						const clientUsername = hiveSync.getUsername();
						const iAmWinner = myWinner === 'player';
						const resultSaysIWon = data.result.winner.username === clientUsername;
						const resultSaysILost = data.result.loser.username === clientUsername;

						if ((iAmWinner && resultSaysIWon) || (!iAmWinner && resultSaysILost)) {
							// Result agrees with our view — counter-sign
							try {
								const sig = await hiveSync.signResultHash(data.hash);
								send({ type: 'result_countersign', counterpartySig: sig });
							} catch {
								// Keychain unavailable or user rejected — send reject
								send({ type: 'result_reject', reason: 'signing_failed' });
							}
						} else if (!clientUsername) {
							// No Hive account (dev mode) — accept anyway
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
			} catch (err) {
				console.error('[useP2PSync] Error processing message:', err);
			} finally {
				isProcessingRef.current = false;
			}
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

	const wrappedPlayCard = useCallback((cardId: string, targetId?: string, targetType?: 'minion' | 'hero') => {
		if (connectionState === 'connected' && !isHost) {
			send({ type: 'playCard', cardId, targetId: translateTargetForHost(targetId), targetType });
		} else {
			gameStore.playCard(cardId, targetId, targetType);
			if (isHost) setTimeout(() => syncGameState(), 50);
		}
	}, [connectionState, isHost, send, gameStore, syncGameState]);

	const wrappedAttack = useCallback((attackerId: string, defenderId: string) => {
		if (connectionState === 'connected' && !isHost) {
			send({ type: 'attack', attackerId, defenderId: translateTargetForHost(defenderId) ?? defenderId });
		} else {
			gameStore.attackWithCard(attackerId, defenderId);
			if (isHost) setTimeout(() => syncGameState(), 50);
		}
	}, [connectionState, isHost, send, gameStore, syncGameState]);

	const wrappedEndTurn = useCallback(() => {
		if (connectionState === 'connected' && !isHost) {
			send({ type: 'endTurn' });
		} else {
			gameStore.endTurn();
			if (isHost) setTimeout(() => syncGameState(), 50);
		}
	}, [connectionState, isHost, send, gameStore, syncGameState]);

	const wrappedUseHeroPower = useCallback((targetId?: string) => {
		if (connectionState === 'connected' && !isHost) {
			send({ type: 'useHeroPower', targetId: translateTargetForHost(targetId) });
		} else {
			gameStore.useHeroPower(targetId);
			if (isHost) setTimeout(() => syncGameState(), 50);
		}
	}, [connectionState, isHost, send, gameStore, syncGameState]);

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
