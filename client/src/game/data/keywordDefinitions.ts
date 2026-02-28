export interface KeywordDefinition {
	name: string;
	description: string;
	icon: string;
}

export const KEYWORD_DEFINITIONS: Record<string, KeywordDefinition> = {
	taunt: {
		name: 'Taunt',
		description: 'Enemies must attack this minion before others.',
		icon: 'shield',
	},
	charge: {
		name: 'Charge',
		description: 'Can attack immediately when played.',
		icon: 'zap',
	},
	rush: {
		name: 'Rush',
		description: 'Can attack minions immediately, but not the hero.',
		icon: 'move',
	},
	divine_shield: {
		name: 'Divine Shield',
		description: 'Absorbs the first hit of damage dealt to this minion.',
		icon: 'circle',
	},
	windfury: {
		name: 'Windfury',
		description: 'Can attack twice each turn.',
		icon: 'wind',
	},
	lifesteal: {
		name: 'Lifesteal',
		description: 'Damage dealt by this minion heals your hero.',
		icon: 'heart',
	},
	poisonous: {
		name: 'Poisonous',
		description: 'Destroys any minion damaged by this.',
		icon: 'skull',
	},
	stealth: {
		name: 'Stealth',
		description: 'Cannot be targeted until it attacks.',
		icon: 'eye-off',
	},
	freeze: {
		name: 'Freeze',
		description: 'Frozen characters cannot attack next turn.',
		icon: 'snowflake',
	},
	silence: {
		name: 'Silence',
		description: 'Removes all card text and enchantments.',
		icon: 'volume-x',
	},
	battlecry: {
		name: 'Battlecry',
		description: 'Triggers when played from your hand.',
		icon: 'sword',
	},
	deathrattle: {
		name: 'Deathrattle',
		description: 'Triggers when this minion dies.',
		icon: 'x-circle',
	},
	spell_damage: {
		name: 'Spell Damage',
		description: 'Your spell cards deal extra damage.',
		icon: 'flame',
	},
	overload: {
		name: 'Overload',
		description: 'Locks some mana crystals next turn.',
		icon: 'lock',
	},
	reborn: {
		name: 'Reborn',
		description: 'Returns to life with 1 Health the first time it dies.',
		icon: 'refresh-cw',
	},
	elusive: {
		name: 'Elusive',
		description: 'Cannot be targeted by spells or hero powers.',
		icon: 'shield-off',
	},
	inspire: {
		name: 'Inspire',
		description: 'Triggers when you use your Hero Power.',
		icon: 'star',
	},
	combo: {
		name: 'Combo',
		description: 'Bonus effect if you played another card first this turn.',
		icon: 'layers',
	},
	discover: {
		name: 'Discover',
		description: 'Choose one of three cards to add to your hand.',
		icon: 'search',
	},
	adapt: {
		name: 'Adapt',
		description: 'Choose one of three bonuses for this minion.',
		icon: 'plus-circle',
	},
	echo: {
		name: 'Echo',
		description: 'Can be played again this turn (cost remains the same).',
		icon: 'copy',
	},
	magnetic: {
		name: 'Magnetic',
		description: 'Can attach to a Mech to give it stats and text.',
		icon: 'link',
	},
	overkill: {
		name: 'Overkill',
		description: 'Triggers when dealing excess lethal damage.',
		icon: 'target',
	},
	frenzy: {
		name: 'Frenzy',
		description: 'Triggers the first time this minion survives damage.',
		icon: 'alert-triangle',
	},
	corrupt: {
		name: 'Corrupt',
		description: 'Upgrades in hand when you play a higher-cost card.',
		icon: 'trending-up',
	},
	dormant: {
		name: 'Dormant',
		description: 'Spends turns asleep before awakening.',
		icon: 'moon',
	},
	immune: {
		name: 'Immune',
		description: 'Cannot be damaged or targeted.',
		icon: 'shield',
	},
	mega_windfury: {
		name: 'Mega-Windfury',
		description: 'Can attack four times each turn.',
		icon: 'wind',
	},
	colossal: {
		name: 'Colossal',
		description: 'Summons additional appendage minions when played.',
		icon: 'maximize',
	},
};

export function getKeywordDefinition(keyword: string): KeywordDefinition | null {
	const key = keyword.toLowerCase().replace(/[\s-]/g, '_');
	return KEYWORD_DEFINITIONS[key] || null;
}

export function getAllKeywords(): KeywordDefinition[] {
	return Object.values(KEYWORD_DEFINITIONS);
}
