/**
 * Pet Tokens
 *
 * Non-collectible tokens summoned by pet abilities.
 *
 * ID Range: 9200-9249
 */
import { CardData } from '../../../../../types';

export const petTokens: CardData[] = [
	{
		id: 9200,
		name: 'Golden Piglet',
		manaCost: 1,
		description: 'Summoned by Golden Boar.',
		flavorText: 'It oinks with divine fervor.',
		type: 'minion',
		rarity: 'common',
		class: 'Neutral',
		attack: 1,
		health: 1,
		race: 'Beast',
		keywords: [],
		set: 'core',
		collectible: false
	},
	{
		id: 9201,
		name: 'Coral Shard',
		manaCost: 1,
		description: 'Summoned by Reef Trickster.',
		flavorText: 'A fragment of living reef.',
		type: 'minion',
		rarity: 'common',
		class: 'Neutral',
		attack: 1,
		health: 1,
		keywords: [],
		set: 'core',
		collectible: false
	},
	{
		id: 9202,
		name: 'Vine',
		manaCost: 0,
		description: 'Summoned by Vine Sprite.',
		flavorText: 'It reaches toward the light.',
		type: 'minion',
		rarity: 'common',
		class: 'Neutral',
		attack: 0,
		health: 2,
		keywords: ['taunt'],
		set: 'core',
		collectible: false
	},
	{
		id: 9203,
		name: 'Forest Shade',
		manaCost: 2,
		description: 'Summoned by Forest Phantom.',
		flavorText: 'A whisper among the leaves.',
		type: 'minion',
		rarity: 'common',
		class: 'Neutral',
		attack: 2,
		health: 2,
		keywords: ['stealth'],
		set: 'core',
		collectible: false
	},
	{
		id: 9204,
		name: 'Draugr',
		manaCost: 2,
		description: 'Summoned by Draugr Lord.',
		flavorText: 'The restless dead serve their lord.',
		type: 'minion',
		rarity: 'common',
		class: 'Neutral',
		attack: 2,
		health: 2,
		keywords: [],
		set: 'core',
		collectible: false
	}
];
