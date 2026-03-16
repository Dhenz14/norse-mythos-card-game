import { create } from 'zustand';
import { createCardInstance } from '../utils/cards/cardUtils';
import { debug } from '../config/debugConfig';
import { MAX_HAND_SIZE } from '../constants/gameConstants';
import type { GameState } from '../types';

const MAX_POKER_REWARD_RETRIES = 10;

interface PokerRewardStore {
	retries: number;
	grantPokerHandRewards: (gameState: GameState) => GameState | null;
	shouldDeferForDiscovery: (gameState: GameState) => boolean;
	resetRetries: () => void;
	incrementRetries: () => number;
	isMaxRetries: () => boolean;
}

export const usePokerRewardStore = create<PokerRewardStore>()((set, get) => ({
	retries: 0,

	grantPokerHandRewards: (gameState: GameState): GameState | null => {
		if (gameState?.mulligan?.active) {
			debug.log('[PokerRewards] Blocked: card game mulligan still active');
			return null;
		}

		set({ retries: 0 });

		try {
			debug.log('[PokerRewards] Granting poker hand rewards - card draw and +1 mana crystal');

			const player = gameState.players.player;
			const opponent = gameState.players.opponent;

			const MAX_MANA = 10;

			const newPlayerHand = [...player.hand];
			const newPlayerDeck = [...player.deck];

			if (newPlayerDeck.length > 0 && newPlayerHand.length < MAX_HAND_SIZE) {
				const drawnCardData = newPlayerDeck.pop()!;
				const cardInstance = createCardInstance(drawnCardData);
				newPlayerHand.push(cardInstance);
				debug.log(`[PokerRewards] Player drew card: ${cardInstance.card.name}`);
			}

			const newOpponentHand = [...opponent.hand];
			const newOpponentDeck = [...opponent.deck];

			if (newOpponentDeck.length > 0 && newOpponentHand.length < MAX_HAND_SIZE) {
				const drawnCardData = newOpponentDeck.pop()!;
				const cardInstance = createCardInstance(drawnCardData);
				newOpponentHand.push(cardInstance);
				debug.log(`[PokerRewards] Opponent drew card: ${cardInstance.card.name}`);
			}

			const newPlayerMax = Math.min(player.mana.max + 1, MAX_MANA);
			const newOpponentMax = Math.min(opponent.mana.max + 1, MAX_MANA);

			const playerOverloaded = player.mana.overloaded || 0;
			const opponentOverloaded = opponent.mana.overloaded || 0;

			const newPlayerMana = {
				...player.mana,
				max: newPlayerMax,
				current: Math.max(0, newPlayerMax - playerOverloaded),
				overloaded: playerOverloaded,
				pendingOverload: player.mana.pendingOverload || 0
			};

			const newOpponentMana = {
				...opponent.mana,
				max: newOpponentMax,
				current: Math.max(0, newOpponentMax - opponentOverloaded),
				overloaded: opponentOverloaded,
				pendingOverload: opponent.mana.pendingOverload || 0
			};

			debug.log(`[PokerRewards] Player mana: ${player.mana.max} → ${newPlayerMana.max} (${newPlayerMana.current} available, ${playerOverloaded} overloaded)`);
			debug.log(`[PokerRewards] Opponent mana: ${opponent.mana.max} → ${newOpponentMana.max} (${newOpponentMana.current} available, ${opponentOverloaded} overloaded)`);

			const clearSummoningSickness = (battlefield: typeof player.battlefield) =>
				battlefield.map(m => m.isSummoningSick
					? { ...m, isSummoningSick: false, canAttack: !m.isFrozen, attacksPerformed: 0 }
					: { ...m, attacksPerformed: 0 }
				);

			const newState: GameState = {
				...gameState,
				players: {
					...gameState.players,
					player: {
						...player,
						hand: newPlayerHand,
						deck: newPlayerDeck,
						mana: newPlayerMana,
						battlefield: clearSummoningSickness(player.battlefield)
					},
					opponent: {
						...opponent,
						hand: newOpponentHand,
						deck: newOpponentDeck,
						mana: newOpponentMana,
						battlefield: clearSummoningSickness(opponent.battlefield)
					}
				}
			};

			debug.log(`[PokerRewards] Card draw and mana grant complete`);
			return newState;
		} catch (error) {
			debug.error('[PokerRewards] Error granting rewards:', error);
			return null;
		}
	},

	shouldDeferForDiscovery: (gameState: GameState): boolean => {
		if (!gameState?.discovery?.active) return false;
		const { retries } = get();
		if (retries >= MAX_POKER_REWARD_RETRIES) {
			debug.error('[PokerRewards] Max retries reached while waiting for discovery — granting anyway');
			set({ retries: 0 });
			return false;
		}
		set({ retries: retries + 1 });
		debug.combat(`[PokerRewards] Deferred: discovery active, retry ${retries + 1}/${MAX_POKER_REWARD_RETRIES}`);
		return true;
	},

	resetRetries: () => set({ retries: 0 }),

	incrementRetries: (): number => {
		const next = get().retries + 1;
		set({ retries: next });
		return next;
	},

	isMaxRetries: (): boolean => {
		return get().retries >= MAX_POKER_REWARD_RETRIES;
	},
}));
