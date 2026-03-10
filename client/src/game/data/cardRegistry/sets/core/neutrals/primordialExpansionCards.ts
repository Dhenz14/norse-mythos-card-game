/**
 * Primordial Expansion Cards
 *
 * New minions and spells introducing two novel mechanics:
 * - Submerge: Card enters play face-down/untargetable for N turns, then surfaces with a powerful effect
 * - Coil: Locks an enemy minion's attack to 0 while the Coil source lives
 *
 * Also includes Bestla's token cards for her Primordial Lineage battlecry.
 *
 * ID Range: 40001, 40100-40115 (minions/spells), 9060-9063 (tokens)
 */

import { CardData } from '../../../../../types';

export const primordialExpansionCards: CardData[] = [

	// ==================== BESTLA TOKENS (non-collectible) ====================

	{
		id: 9060,
		name: 'Odin-Spark',
		manaCost: 1,
		attack: 1,
		health: 1,
		type: 'minion',
		rarity: 'basic',
		class: 'neutral',
		race: 'Titan',
		description: 'Spell Damage +1. If Vili-Spark and Ve-Spark survive until your next turn, merge into Aesir Ascendant.',
		keywords: ['spell_damage'],
		collectible: false,
		flavorText: 'A spark of the All-Father, not yet kindled into wisdom.',
	},
	{
		id: 9061,
		name: 'Vili-Spark',
		manaCost: 1,
		attack: 1,
		health: 1,
		type: 'minion',
		rarity: 'basic',
		class: 'neutral',
		race: 'Titan',
		description: 'Taunt. If Odin-Spark and Ve-Spark survive until your next turn, merge into Aesir Ascendant.',
		keywords: ['taunt'],
		collectible: false,
		flavorText: 'A spark of willpower, waiting to become a god.',
	},
	{
		id: 9062,
		name: 'Ve-Spark',
		manaCost: 1,
		attack: 1,
		health: 1,
		type: 'minion',
		rarity: 'basic',
		class: 'neutral',
		race: 'Titan',
		description: 'Adjacent minions have +1 Attack. If Odin-Spark and Vili-Spark survive until your next turn, merge into Aesir Ascendant.',
		keywords: ['aura'],
		collectible: false,
		flavorText: 'A spark of sanctity, trembling on the edge of creation.',
	},
	{
		id: 9063,
		name: 'Aesir Ascendant',
		manaCost: 6,
		attack: 6,
		health: 6,
		type: 'minion',
		rarity: 'basic',
		class: 'neutral',
		race: 'Titan',
		description: 'Taunt. Spell Damage +1. Adjacent minions have +1 Attack.',
		keywords: ['taunt', 'spell_damage', 'aura'],
		collectible: false,
		flavorText: 'Three sparks became one flame, and the world trembled at the birth of the gods.',
	},

	// ==================== BESTLA — PRIMORDIAL LINEAGE ====================

	{
		id: 40001,
		name: 'Bestla, Primordial Frost-Mother',
		manaCost: 7,
		attack: 4,
		health: 6,
		type: 'minion',
		rarity: 'mythic',
		class: 'neutral',
		race: 'Titan',
		description: 'Battlecry: Summon Odin-Spark (Spell Damage +1), Vili-Spark (Taunt), and Ve-Spark (+1 Attack aura). If all three survive until your next turn, merge them into a 6/6 Aesir Ascendant.',
		keywords: ['battlecry'],
		battlecry: { type: 'summon_token', summonCardId: 9060, count: 1, additionalSummons: [9061, 9062] },
		collectible: true,
		flavorText: 'Daughter of Bolthorn, wife of Borr, mother of Odin. Without her blood, the Aesir would never have been born and the world would remain unmade. (Gylfaginning 6)',
	},

	// ==================== KRAKEN — SUBMERGE MECHANIC ====================

	{
		id: 40100,
		name: 'Kraken of Ginnungagap',
		manaCost: 8,
		attack: 8,
		health: 8,
		type: 'minion',
		rarity: 'mythic',
		class: 'neutral',
		race: 'Beast',
		description: 'Battlecry: Submerge for 2 turns (untargetable, can\'t attack). When it surfaces, deal 8 damage to all enemies.',
		keywords: ['battlecry'],
		battlecry: { type: 'submerge', value: 2, surfaceEffect: 'damage_all_enemies', surfaceDamage: 8 },
		collectible: true,
		flavorText: 'In the void between creation and nothing, something stirs. It has waited since before the frost and the fire, patient as the abyss itself. When it rises, the sea remembers fear.',
	},
	{
		id: 40101,
		name: 'Kraken Spawn',
		manaCost: 3,
		attack: 2,
		health: 3,
		type: 'minion',
		rarity: 'rare',
		class: 'neutral',
		race: 'Beast',
		description: 'Battlecry: Submerge for 1 turn. When it surfaces, gain +2/+2.',
		keywords: ['battlecry'],
		battlecry: { type: 'submerge', value: 1, surfaceEffect: 'buff_self', surfaceDamage: 0 },
		collectible: true,
		flavorText: 'The fishermen of Midgard know the signs: a shadow beneath the hull, then silence, then screaming.',
	},
	{
		id: 40102,
		name: 'Depths of the Void',
		manaCost: 4,
		type: 'spell',
		rarity: 'epic',
		class: 'neutral',
		description: 'Submerge a friendly minion for 1 turn. When it surfaces, give it +3/+3.',
		spellEffect: { type: 'submerge_friendly', value: 1, buffAttack: 3, buffHealth: 3 },
		collectible: true,
		flavorText: 'Ginnungagap gives nothing freely. But what it returns, it returns changed.',
	},
	{
		id: 40103,
		name: 'Ginnungagap\'s Hunger',
		manaCost: 2,
		type: 'spell',
		rarity: 'rare',
		class: 'neutral',
		description: 'Deal 5 damage to a Submerged minion. (The only way to hit them before they surface.)',
		spellEffect: { type: 'damage_submerged', value: 5 },
		collectible: true,
		flavorText: 'Even the void has a hunger. Even the abyss has teeth.',
	},

	// ==================== LINDWORM — COIL MECHANIC ====================

	{
		id: 40110,
		name: 'Lindworm, Wingless Terror',
		manaCost: 5,
		attack: 3,
		health: 5,
		type: 'minion',
		rarity: 'epic',
		class: 'neutral',
		race: 'Dragon',
		description: 'Battlecry: Coil an enemy minion (set its Attack to 0, it can\'t attack while this lives). Deathrattle: Free the coiled minion.',
		keywords: ['battlecry', 'deathrattle'],
		battlecry: { type: 'coil_enemy', targetType: 'enemy_minion' },
		deathrattle: { type: 'uncoil' },
		collectible: true,
		flavorText: 'The lindworm has no wings, no fire, no hoard. It needs none. It wraps its prey in coils of iron muscle and waits. The sagas say killing one requires not a sword but a shirt soaked in lye — cunning, not strength.',
	},
	{
		id: 40111,
		name: 'Young Lindworm',
		manaCost: 2,
		attack: 1,
		health: 3,
		type: 'minion',
		rarity: 'common',
		class: 'neutral',
		race: 'Dragon',
		description: 'Battlecry: Coil an enemy minion with 2 or less Attack.',
		keywords: ['battlecry'],
		battlecry: { type: 'coil_enemy', targetType: 'enemy_minion', maxAttack: 2 },
		collectible: true,
		flavorText: 'Small enough to mistake for a common serpent. That mistake is usually fatal.',
	},

	// ==================== HERMOD SUPPORT CARD ====================

	{
		id: 40115,
		name: 'Gjoll Bridge-Keeper',
		manaCost: 4,
		attack: 3,
		health: 4,
		type: 'minion',
		rarity: 'rare',
		class: 'neutral',
		race: 'Undead',
		description: 'Deathrattle: Return a random friendly minion that died this game to your hand.',
		keywords: ['deathrattle'],
		deathrattle: { type: 'resurrect_to_hand', value: 1 },
		collectible: true,
		flavorText: 'Modgud guards the bridge over the river Gjoll. She counts the dead who pass, and sometimes — rarely — lets one return.',
	},
];
