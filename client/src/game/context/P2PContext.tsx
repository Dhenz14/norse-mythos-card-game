import React, { createContext, useContext, ReactNode } from 'react';
import { useP2PSync } from '../hooks/useP2PSync';
import { useGameStore } from '../stores/gameStore';
import { GameState } from '../types';

interface P2PActions {
	playCard: (cardId: string, targetId?: string, targetType?: 'minion' | 'hero') => void;
	attackWithCard: (attackerId: string, defenderId: string) => void;
	endTurn: () => void;
	useHeroPower: (targetId?: string) => void;
	gameState: GameState | null;
	isConnected: boolean;
	isHost: boolean;
}

const P2PContext = createContext<P2PActions | null>(null);

export const P2PProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const p2pSync = useP2PSync();
	const gameStore = useGameStore();

	const actions: P2PActions = {
		playCard: p2pSync.isConnected ? p2pSync.playCard : gameStore.playCard,
		attackWithCard: p2pSync.isConnected ? p2pSync.attackWithCard : gameStore.attackWithCard,
		endTurn: p2pSync.isConnected ? p2pSync.endTurn : gameStore.endTurn,
		useHeroPower: p2pSync.isConnected ? p2pSync.useHeroPower : gameStore.useHeroPower,
		gameState: gameStore.gameState,
		isConnected: p2pSync.isConnected,
		isHost: p2pSync.isHost,
	};

	return <P2PContext.Provider value={actions}>{children}</P2PContext.Provider>;
};

export const useP2PActions = () => {
	const context = useContext(P2PContext);
	if (!context) {
		const gameStore = useGameStore();
		return {
			playCard: gameStore.playCard,
			attackWithCard: gameStore.attackWithCard,
			endTurn: gameStore.endTurn,
			useHeroPower: gameStore.useHeroPower,
			gameState: gameStore.gameState,
			isConnected: false,
			isHost: false,
		};
	}
	return context;
};
