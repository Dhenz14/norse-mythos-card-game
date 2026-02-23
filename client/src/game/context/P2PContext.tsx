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
	const gsPlayCard = useGameStore(s => s.playCard);
	const gsAttackWithCard = useGameStore(s => s.attackWithCard);
	const gsEndTurn = useGameStore(s => s.endTurn);
	const gsUseHeroPower = useGameStore(s => s.useHeroPower);
	const gameState = useGameStore(s => s.gameState);

	const actions: P2PActions = {
		playCard: p2pSync.isConnected ? p2pSync.playCard : gsPlayCard,
		attackWithCard: p2pSync.isConnected ? p2pSync.attackWithCard : gsAttackWithCard,
		endTurn: p2pSync.isConnected ? p2pSync.endTurn : gsEndTurn,
		useHeroPower: p2pSync.isConnected ? p2pSync.useHeroPower : gsUseHeroPower,
		gameState,
		isConnected: p2pSync.isConnected,
		isHost: p2pSync.isHost,
	};

	return <P2PContext.Provider value={actions}>{children}</P2PContext.Provider>;
};

export const useP2PActions = () => {
	const context = useContext(P2PContext);
	const gsPlayCard = useGameStore(s => s.playCard);
	const gsAttackWithCard = useGameStore(s => s.attackWithCard);
	const gsEndTurn = useGameStore(s => s.endTurn);
	const gsUseHeroPower = useGameStore(s => s.useHeroPower);
	const gsGameState = useGameStore(s => s.gameState);
	if (!context) {
		return {
			playCard: gsPlayCard,
			attackWithCard: gsAttackWithCard,
			endTurn: gsEndTurn,
			useHeroPower: gsUseHeroPower,
			gameState: gsGameState,
			isConnected: false,
			isHost: false,
		};
	}
	return context;
};
