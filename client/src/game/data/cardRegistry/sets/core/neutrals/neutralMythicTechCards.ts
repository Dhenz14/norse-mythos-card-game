import { CardData } from '../../../../../types';

export const neutralMythicTechCards: CardData[] = [
	{
		id: 31001,
		name: 'Mimir, the Rememberer',
		manaCost: 4,
		attack: 3,
		health: 6,
		description: 'Battlecry: Draw a card for each Norse mechanic keyword you control (Blood Price, Einherjar, Prophecy, Ragnarok Chain).',
		flavorText: 'The severed head of the wise god still whispers truths that shake the Nine Realms.',
		type: 'minion',
		rarity: 'epic',
		class: 'Neutral',
		keywords: ['battlecry'],
		battlecry: {
			type: 'conditional_draw',
			value: 1,
			targetType: 'none',
			requiresTarget: false
		},
		set: 'core',
		collectible: true
	},
	{
		id: 31002,
		name: 'Hoenir, the Silence-Bringer',
		manaCost: 5,
		attack: 4,
		health: 5,
		description: 'Battlecry: Silence all enemy minions. They can\'t gain keywords until your next turn.',
		flavorText: 'The silent god speaks only once — and all other voices fall to nothing.',
		type: 'minion',
		rarity: 'epic',
		class: 'Neutral',
		keywords: ['battlecry'],
		battlecry: {
			type: 'transform_and_silence',
			targetType: 'all_enemy_minions',
			requiresTarget: false
		},
		set: 'core',
		collectible: true
	},
	{
		id: 31003,
		name: 'Forseti, Judge of Asgard',
		manaCost: 6,
		attack: 4,
		health: 7,
		description: 'Battlecry: Both players draw 3 cards. Your cards cost (1) less.',
		flavorText: 'In his hall Glitnir, all disputes end with fairness — though Forseti always tips the scales slightly.',
		type: 'minion',
		rarity: 'mythic',
		class: 'Neutral',
		keywords: ['battlecry'],
		battlecry: {
			type: 'draw',
			value: 3,
			targetType: 'both_players',
			requiresTarget: false
		},
		set: 'core',
		collectible: true
	},
	{
		id: 31004,
		name: 'Kvasir, Blood of Wisdom',
		manaCost: 3,
		attack: 3,
		health: 3,
		description: 'Battlecry: Foresee a spell from any class. It costs (2) less.',
		flavorText: 'Born from the mingled spit of the gods, his blood became the mead of poetry.',
		type: 'minion',
		rarity: 'epic',
		class: 'Neutral',
		keywords: ['battlecry'],
		battlecry: {
			type: 'discover',
			discoveryType: 'any_spell',
			requiresTarget: false
		},
		set: 'core',
		collectible: true
	},
	{
		id: 31005,
		name: 'Lodur, the Ember-Giver',
		manaCost: 4,
		attack: 2,
		health: 6,
		description: 'At the end of your turn, give a random friendly minion +2/+2.',
		flavorText: 'He gave humanity blood and warmth — why not his allies too?',
		type: 'minion',
		rarity: 'epic',
		class: 'Neutral',
		set: 'core',
		collectible: true
	},
	{
		id: 31006,
		name: 'Vili, the Willbreaker',
		manaCost: 7,
		attack: 5,
		health: 6,
		description: 'Battlecry: Destroy all enemy minions with 2 or less Attack.',
		flavorText: 'Brother to Odin, he crushes the weak so the strong may fall to his kin.',
		type: 'minion',
		rarity: 'epic',
		class: 'Neutral',
		keywords: ['battlecry'],
		battlecry: {
			type: 'conditional_damage',
			value: 99,
			targetType: 'enemy_minions_by_attack',
			requiresTarget: false
		},
		set: 'core',
		collectible: true
	},
	{
		id: 31007,
		name: 'Bragi, Skald of the Gods',
		manaCost: 5,
		attack: 3,
		health: 5,
		description: 'Your spells cost (1) less. Battlecry: Add a random spell from each class to your hand.',
		flavorText: 'His songs echo across all Nine Realms, carrying the magic of every tradition.',
		type: 'minion',
		rarity: 'mythic',
		class: 'Neutral',
		keywords: ['battlecry'],
		battlecry: {
			type: 'add_card',
			targetType: 'random_class_spells',
			requiresTarget: false
		},
		set: 'core',
		collectible: true
	},
	{
		id: 31008,
		name: 'Ull, the Oath-Ring',
		manaCost: 2,
		attack: 2,
		health: 3,
		description: 'Divine Shield. Battlecry: The next spell cast on this minion triggers twice.',
		flavorText: 'Swear upon Ull\'s ring and your oath becomes unbreakable — as does your shield.',
		type: 'minion',
		rarity: 'epic',
		class: 'Neutral',
		keywords: ['divine_shield', 'battlecry'],
		battlecry: {
			type: 'grant_persistent_effect',
			targetType: 'self',
			requiresTarget: false
		},
		set: 'core',
		collectible: true
	}
];
