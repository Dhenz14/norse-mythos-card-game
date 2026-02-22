import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { usePeerStore } from '../stores/peerStore';
import { useGameStore } from '../stores/gameStore';
import { GameState } from '../types';

export type P2PMessage =
	| { type: 'init'; gameState: GameState; isHost: boolean }
	| { type: 'playCard'; cardId: string; targetId?: string; targetType?: 'minion' | 'hero' }
	| { type: 'attack'; attackerId: string; defenderId: string }
	| { type: 'endTurn' }
	| { type: 'useHeroPower'; targetId?: string }
	| { type: 'gameState'; gameState: GameState }
	| { type: 'opponentDisconnected' }
	| { type: 'ping' }
	| { type: 'pong' };

export function useP2PSync() {
	const { connection, connectionState, isHost, send } = usePeerStore();
	const gameStore = useGameStore();
	const lastSyncRef = useRef<number>(0);
	const isProcessingRef = useRef(false);
	const initSentRef = useRef(false);

	// When host's data connection opens, send authoritative game state to client
	useEffect(() => {
		if (!connection || !isHost || connectionState !== 'connected') {
			initSentRef.current = false;
			return;
		}
		if (initSentRef.current) return;
		initSentRef.current = true;

		// Small delay so the client's data listener is registered before init arrives
		const timer = setTimeout(() => {
			const currentState = useGameStore.getState().gameState;
			if (currentState) {
				send({ type: 'init', gameState: currentState, isHost: true });
			}
		}, 200);

		return () => clearTimeout(timer);
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

		const handleMessage = (data: P2PMessage) => {
			if (isProcessingRef.current) return;
			isProcessingRef.current = true;

			try {
				switch (data.type) {
					case 'init':
						// Client receives the host's authoritative game state and syncs to it
						if (!isHost) {
							useGameStore.setState({ gameState: data.gameState });
						}
						break;

					case 'playCard':
						if (isHost) {
							gameStore.playCard(data.cardId, data.targetId, data.targetType);
							setTimeout(() => syncGameState(), 50);
						}
						break;

					case 'attack':
						if (isHost) {
							gameStore.attackWithCard(data.attackerId, data.defenderId);
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
							gameStore.useHeroPower(data.targetId);
							setTimeout(() => syncGameState(), 50);
						}
						break;

					case 'gameState':
						if (!isHost) {
							const currentState = useGameStore.getState().gameState;
							if (JSON.stringify(currentState) !== JSON.stringify(data.gameState)) {
								useGameStore.setState({ gameState: data.gameState });
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
			send({ type: 'playCard', cardId, targetId, targetType });
		} else {
			gameStore.playCard(cardId, targetId, targetType);
			if (isHost) setTimeout(() => syncGameState(), 50);
		}
	}, [connectionState, isHost, send, gameStore, syncGameState]);

	const wrappedAttack = useCallback((attackerId: string, defenderId: string) => {
		if (connectionState === 'connected' && !isHost) {
			send({ type: 'attack', attackerId, defenderId });
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
			send({ type: 'useHeroPower', targetId });
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

	return {
		syncGameState,
		playCard: wrappedPlayCard,
		attackWithCard: wrappedAttack,
		endTurn: wrappedEndTurn,
		useHeroPower: wrappedUseHeroPower,
		isConnected: connectionState === 'connected',
		isHost,
	};
}
