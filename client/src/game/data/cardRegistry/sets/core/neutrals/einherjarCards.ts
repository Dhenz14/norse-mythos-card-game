/**
 * Einherjar Cards
 *
 * Minions with the Einherjar keyword that shuffle a stronger copy
 * into your deck when they die. Norse warriors who fight, die, and
 * rise again in Valhalla — stronger each time. Max 3 returns.
 *
 * ID Range: 30201-30206
 */
import { CardData } from '../../../../../types';

export const einherjarCards: CardData[] = [
	{
		id: 30201,
		name: 'Einherjar Recruit',
		manaCost: 1,
		attack: 1,
		health: 1,
		description: 'Einherjar',
		flavorText: 'He fell in battle once. He will fall again — and return stronger.',
		type: 'minion',
		rarity: 'common',
		class: 'Neutral',
		keywords: ['einherjar'],
		set: 'core',
		collectible: true
	},
	{
		id: 30202,
		name: 'Einherjar Veteran',
		manaCost: 3,
		attack: 2,
		health: 3,
		description: 'Taunt. Einherjar',
		flavorText: 'A thousand deaths have taught him where to stand.',
		type: 'minion',
		rarity: 'common',
		class: 'Warrior',
		keywords: ['einherjar', 'taunt'],
		set: 'core',
		collectible: true
	},
	{
		id: 30203,
		name: 'Einherjar Skald',
		manaCost: 2,
		attack: 2,
		health: 2,
		description: 'Einherjar. Battlecry: Draw a card.',
		flavorText: 'His songs outlive every body he inhabits.',
		type: 'minion',
		rarity: 'rare',
		class: 'Neutral',
		keywords: ['einherjar', 'battlecry'],
		battlecry: {
			type: 'draw',
			value: 1,
			targetType: 'none'
		},
		set: 'core',
		collectible: true
	},
	{
		id: 30204,
		name: 'Einherjar Champion',
		manaCost: 5,
		attack: 4,
		health: 4,
		description: 'Divine Shield. Einherjar',
		flavorText: 'Odin himself blessed this warrior with light that persists beyond death.',
		type: 'minion',
		rarity: 'epic',
		class: 'Paladin',
		keywords: ['einherjar', 'divine_shield'],
		set: 'core',
		collectible: true
	},
	{
		id: 30205,
		name: 'Einherjar Berserker',
		manaCost: 4,
		attack: 5,
		health: 2,
		description: 'Rush. Einherjar',
		flavorText: 'Each return from Valhalla sharpens his fury.',
		type: 'minion',
		rarity: 'rare',
		class: 'Berserker',
		keywords: ['einherjar', 'rush'],
		set: 'core',
		collectible: true
	},
	{
		id: 30206,
		name: "Valhalla's Chosen",
		manaCost: 7,
		attack: 6,
		health: 6,
		description: 'Einherjar. Battlecry: Summon all friendly Einherjar that died this game.',
		flavorText: 'The gates of Valhalla open wide, and the fallen march once more.',
		type: 'minion',
		rarity: 'mythic',
		class: 'Neutral',
		keywords: ['einherjar', 'battlecry'],
		battlecry: {
			type: 'summon_dead_einherjar'
		},
		set: 'core',
		collectible: true
	}
];
