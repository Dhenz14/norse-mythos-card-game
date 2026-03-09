import { getCardById } from './cardManagement/cardRegistry';
import type { CardData } from '../types';

export const STARTER_CARD_IDS: number[] = [
	// === Basic Vanillas (3) — free tutorial cards ===
	1900, // Niflheim Hatchling (1 mana 1/2)
	1901, // Midgard Footman (2 mana 2/3)
	1902, // Asgard Recruit (2 mana 3/2)

	// === 1-Mana Commons (3) ===
	1001, // Sea Sprite Raider (2/1 Naga)
	5107, // Young Hippogriff (1/2 Windfury Beast)
	5051, // Sea Sprite Oracle (1/1 Naga aura)

	// === 2-Mana Commons (5) ===
	1002, // Fenris Cub (3/2 Beast)
	1003, // Midgard Serpent Spawn (2/3 Beast)
	5044, // Sentinel of Helheim (2/2 Taunt)
	5052, // Sea Sprite Hunter (2/1 Battlecry Naga)
	31901, // Eir's Disciple (1/3 Lifesteal)

	// === 3-Mana Commons (5) ===
	1029, // Shadow Panther of Hades (4/2 Stealth Beast)
	1030, // Crusader of Baldur (3/1 Divine Shield)
	1031, // Seer of the Norns (2/3 Windfury)
	5046, // Armored Bear of Thor (3/3 Taunt Beast)
	29970, // Volva of the Realms (3/3 Battlecry Heal)

	// === 4-Mana Commons (4) ===
	1008, // Einherjar Guardian (3/5 Taunt)
	5032, // Guardian of Alfheim (3/3 Divine Shield)
	5040, // Cyclops Guardian (1/7 Taunt)
	5047, // Swamp Turtle of Midgard (2/7 Beast)

	// === 5-Mana Commons (3) ===
	5048, // Mercenary of Sparta (5/4 Taunt)
	5049, // Marsh Stalker (3/6 Taunt)
	5050, // Spiteful Smith of Svartalfheim (4/6 Enrage)

	// === 6-Mana Commons (2) ===
	5035, // Harpy of the Storm (4/5 Windfury)
	5062, // Glacial Jotunn (5/5 Freeze Elemental)
];

export function getStarterCards(): CardData[] {
	const cards: CardData[] = [];
	for (const id of STARTER_CARD_IDS) {
		const card = getCardById(id);
		if (card) cards.push(card);
	}
	return cards;
}

export const STARTER_PACK_NAME = 'Birthright of the Norns';
export const STARTER_CARD_COUNT = STARTER_CARD_IDS.length;
