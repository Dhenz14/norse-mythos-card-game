/**
 * starterSet.ts — New Player Starter Card Distribution
 *
 * Each player receives 45 base cards matched to their default heroes:
 * - 10 Mage cards (for Erik Flameheart)
 * - 10 Warrior cards (for Ragnar Ironside)
 * - 10 Priest cards (for Brynhild)
 * - 10 Rogue cards (for Sigurd)
 * - 5 King neutral cards (for Leif)
 *
 * Base cards are infinite supply — they don't count toward the 3.3M NFT cap.
 * Power level: slightly below common, with "value gems" to keep decks competitive.
 */

import { getCardById } from './cardManagement/cardRegistry';
import type { CardData } from '../types';
import { BASE_CARD_IDS_BY_CLASS } from './cardRegistry/sets/core/neutrals/baseCards';

// Hero class → card IDs mapping (matches getDefaultArmySelection heroes)
const CLASS_CARD_SETS: Record<string, number[]> = {
	Mage: BASE_CARD_IDS_BY_CLASS.Mage,       // Erik Flameheart (Queen)
	Warrior: BASE_CARD_IDS_BY_CLASS.Warrior,  // Ragnar Ironside (Rook)
	Priest: BASE_CARD_IDS_BY_CLASS.Priest,    // Brynhild (Bishop)
	Rogue: BASE_CARD_IDS_BY_CLASS.Rogue,      // Sigurd (Knight)
};

// King neutral cards (Leif the Wayfinder)
const KING_CARD_IDS = BASE_CARD_IDS_BY_CLASS.Neutral.slice(0, 5); // IDs 140-144

/**
 * Get the 45 starter cards for a new player.
 * 10 per class (Mage, Warrior, Priest, Rogue) + 5 king neutrals.
 */
export function getStarterCards(): CardData[] {
	const cards: CardData[] = [];

	// Add all 4 class sets (10 each)
	for (const classIds of Object.values(CLASS_CARD_SETS)) {
		for (const id of classIds) {
			const card = getCardById(id);
			if (card) cards.push(card);
		}
	}

	// Add king neutral cards (5)
	for (const id of KING_CARD_IDS) {
		const card = getCardById(id);
		if (card) cards.push(card);
	}

	return cards;
}

/**
 * Get class-specific base cards for a given hero class.
 * Used when giving bonus cards for a specific hero.
 */
export function getBaseCardsByClass(heroClass: string): CardData[] {
	const ids = CLASS_CARD_SETS[heroClass] ?? [];
	return ids.map(id => getCardById(id)).filter(Boolean) as CardData[];
}

/**
 * Get random neutral base cards from the shared pool.
 * Guarantees at least 20% minions.
 */
export function getRandomNeutralBaseCards(count: number): CardData[] {
	const allNeutralIds = BASE_CARD_IDS_BY_CLASS.Neutral.slice(5); // Skip king cards (140-144)
	const shuffled = [...allNeutralIds].sort(() => Math.random() - 0.5);
	const cards: CardData[] = [];

	for (const id of shuffled) {
		if (cards.length >= count) break;
		const card = getCardById(id);
		if (card) cards.push(card);
	}

	// Ensure 20% minion floor
	const minions = cards.filter(c => c.type === 'minion');
	const minMinionCount = Math.ceil(count * 0.2);
	if (minions.length < minMinionCount) {
		const minionIds = allNeutralIds.filter(id => {
			const c = getCardById(id);
			return c?.type === 'minion' && !cards.some(existing => existing.id === id);
		});
		const shuffledMinions = minionIds.sort(() => Math.random() - 0.5);
		let needed = minMinionCount - minions.length;
		for (const id of shuffledMinions) {
			if (needed <= 0) break;
			const card = getCardById(id);
			if (card) {
				// Replace a spell with this minion
				const spellIdx = cards.findIndex(c => c.type === 'spell');
				if (spellIdx >= 0) cards[spellIdx] = card;
				needed--;
			}
		}
	}

	return cards;
}

export const STARTER_PACK_NAME = 'Birthright of the Norns';
export const STARTER_CARD_COUNT = 45;
