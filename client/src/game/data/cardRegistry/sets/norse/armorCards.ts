import { ArmorCardData } from '../../../../types';

const norseArmorCards: ArmorCardData[] = [
	// ============================================
	// NEUTRAL ARMOR (Available to all heroes)
	// ============================================
	{
		id: 29810, name: 'Iron Helm', manaCost: 2, type: 'armor', rarity: 'common',
		heroClass: 'neutral', armorSlot: 'helm', armorValue: 1, collectible: true,
		description: '+1 Armor. Your first spell each turn costs (1) less.',
		armorPassive: { type: 'spell_cost_reduction', value: 1 },
		categories: ['norse_armor']
	},
	{
		id: 29811, name: 'Chainmail Vest', manaCost: 3, type: 'armor', rarity: 'common',
		heroClass: 'neutral', armorSlot: 'chest', armorValue: 2, collectible: true,
		description: '+2 Armor. Reduce AoE damage taken by 1.',
		armorPassive: { type: 'aoe_damage_reduction', value: 1 },
		categories: ['norse_armor']
	},
	{
		id: 29812, name: 'Leather Greaves', manaCost: 2, type: 'armor', rarity: 'common',
		heroClass: 'neutral', armorSlot: 'greaves', armorValue: 1, collectible: true,
		description: '+1 Armor. Spell Damage +1.',
		armorPassive: { type: 'spell_power', value: 1 },
		categories: ['norse_armor']
	},
	{
		id: 29813, name: 'Runic Circlet', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'neutral', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. Status effects on your hero last 1 less turn.',
		armorPassive: { type: 'status_resistance', value: 1 },
		categories: ['norse_armor']
	},
	{
		id: 29814, name: 'Reinforced Plate', manaCost: 4, type: 'armor', rarity: 'rare',
		heroClass: 'neutral', armorSlot: 'chest', armorValue: 3, collectible: true,
		description: '+3 Armor. Reduce AoE damage taken by 1.',
		armorPassive: { type: 'aoe_damage_reduction', value: 1 },
		categories: ['norse_armor']
	},
	{
		id: 29815, name: 'Traveler\'s Boots', manaCost: 2, type: 'armor', rarity: 'common',
		heroClass: 'neutral', armorSlot: 'greaves', armorValue: 1, collectible: true,
		description: '+1 Armor. When a minion dies, gain 1 Mana next turn.',
		armorPassive: { type: 'on_death_mana', value: 1 },
		categories: ['norse_armor']
	},
	{
		id: 29816, name: 'Dwarf-Forged Helm', manaCost: 3, type: 'armor', rarity: 'epic',
		heroClass: 'neutral', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. Your hero gains +1 Attack while damaged.',
		armorPassive: { type: 'attack_while_damaged', value: 1 },
		categories: ['norse_armor']
	},
	{
		id: 29817, name: 'Mithril Breastplate', manaCost: 4, type: 'armor', rarity: 'epic',
		heroClass: 'neutral', armorSlot: 'chest', armorValue: 3, collectible: true,
		description: '+3 Armor. Overkill damage to minions also hits the enemy hero.',
		armorPassive: { type: 'overkill_to_hero' },
		categories: ['norse_armor']
	},
	{
		id: 29818, name: 'Valkyrie Sabatons', manaCost: 3, type: 'armor', rarity: 'epic',
		heroClass: 'neutral', armorSlot: 'greaves', armorValue: 2, collectible: true,
		description: '+2 Armor. First minion summoned each turn gets +1/+1.',
		armorPassive: { type: 'first_summon_buff', value: 1 },
		categories: ['norse_armor']
	},
	{
		id: 29819, name: 'Asgardian Warhelm', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'neutral', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. Spell Damage +1.',
		armorPassive: { type: 'spell_power', value: 1 },
		categories: ['norse_armor']
	},

	// ============================================
	// STORMCALLER SET (Zeus — Mage)
	// ============================================
	{
		id: 29820, name: 'Stormcaller Crown', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'mage', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. Spell Damage +1.',
		setId: 'stormcaller',
		armorPassive: { type: 'spell_power', value: 1 },
		categories: ['norse_armor', 'stormcaller_set']
	},
	{
		id: 29821, name: 'Stormcaller Robes', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'mage', armorSlot: 'chest', armorValue: 2, collectible: true,
		description: '+2 Armor. Your first spell each turn costs (1) less.',
		setId: 'stormcaller',
		armorPassive: { type: 'spell_cost_reduction', value: 1 },
		categories: ['norse_armor', 'stormcaller_set']
	},
	{
		id: 29822, name: 'Stormcaller Treads', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'mage', armorSlot: 'greaves', armorValue: 1, collectible: true,
		description: '+1 Armor. Spell Damage +1.',
		setId: 'stormcaller',
		armorPassive: { type: 'spell_power', value: 1 },
		categories: ['norse_armor', 'stormcaller_set']
	},

	// ============================================
	// VALHALLA SET (Odin — Mage)
	// ============================================
	{
		id: 29823, name: 'Valhalla Visor', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'mage', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. Your first spell each turn costs (1) less.',
		setId: 'valhalla',
		armorPassive: { type: 'spell_cost_reduction', value: 1 },
		categories: ['norse_armor', 'valhalla_set']
	},
	{
		id: 29824, name: 'Valhalla Mantle', manaCost: 4, type: 'armor', rarity: 'epic',
		heroClass: 'mage', armorSlot: 'chest', armorValue: 3, collectible: true,
		description: '+3 Armor. Reduce AoE damage taken by 1.',
		setId: 'valhalla',
		armorPassive: { type: 'aoe_damage_reduction', value: 1 },
		categories: ['norse_armor', 'valhalla_set']
	},
	{
		id: 29825, name: 'Valhalla Sandals', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'mage', armorSlot: 'greaves', armorValue: 1, collectible: true,
		description: '+1 Armor. Spell Damage +1.',
		setId: 'valhalla',
		armorPassive: { type: 'spell_power', value: 1 },
		categories: ['norse_armor', 'valhalla_set']
	},

	// ============================================
	// BERSERKER SET (Ares — Warrior)
	// ============================================
	{
		id: 29826, name: 'Berserker Helm', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'warrior', armorSlot: 'helm', armorValue: 1, collectible: true,
		description: '+1 Armor. Your hero gains +1 Attack while damaged.',
		setId: 'berserker',
		armorPassive: { type: 'attack_while_damaged', value: 1 },
		categories: ['norse_armor', 'berserker_set']
	},
	{
		id: 29827, name: 'Berserker Warplate', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'warrior', armorSlot: 'chest', armorValue: 2, collectible: true,
		description: '+2 Armor. Overkill damage to minions also hits the enemy hero.',
		setId: 'berserker',
		armorPassive: { type: 'overkill_to_hero' },
		categories: ['norse_armor', 'berserker_set']
	},
	{
		id: 29828, name: 'Berserker Greaves', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'warrior', armorSlot: 'greaves', armorValue: 1, collectible: true,
		description: '+1 Armor. Your hero gains +1 Attack while damaged.',
		setId: 'berserker',
		armorPassive: { type: 'attack_while_damaged', value: 1 },
		categories: ['norse_armor', 'berserker_set']
	},

	// ============================================
	// THUNDERGUARD SET (Thor — Warrior)
	// ============================================
	{
		id: 29829, name: 'Thunderguard Helm', manaCost: 3, type: 'armor', rarity: 'epic',
		heroClass: 'warrior', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. Your hero gains +1 Attack while damaged.',
		setId: 'thunderguard',
		armorPassive: { type: 'attack_while_damaged', value: 1 },
		categories: ['norse_armor', 'thunderguard_set']
	},
	{
		id: 29830, name: 'Thunderguard Plate', manaCost: 4, type: 'armor', rarity: 'epic',
		heroClass: 'warrior', armorSlot: 'chest', armorValue: 3, collectible: true,
		description: '+3 Armor. Reduce AoE damage taken by 1.',
		setId: 'thunderguard',
		armorPassive: { type: 'aoe_damage_reduction', value: 1 },
		categories: ['norse_armor', 'thunderguard_set']
	},
	{
		id: 29831, name: 'Thunderguard Boots', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'warrior', armorSlot: 'greaves', armorValue: 1, collectible: true,
		description: '+1 Armor. Overkill damage to minions also hits the enemy hero.',
		setId: 'thunderguard',
		armorPassive: { type: 'overkill_to_hero' },
		categories: ['norse_armor', 'thunderguard_set']
	},

	// ============================================
	// SPECTRAL SET (Hades — Warlock)
	// ============================================
	{
		id: 29832, name: 'Spectral Crown', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'warlock', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. When a minion dies, gain 1 Mana next turn.',
		setId: 'spectral',
		armorPassive: { type: 'on_death_mana', value: 1 },
		categories: ['norse_armor', 'spectral_set']
	},
	{
		id: 29833, name: 'Spectral Shroud', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'warlock', armorSlot: 'chest', armorValue: 2, collectible: true,
		description: '+2 Armor. Reduce AoE damage taken by 1.',
		setId: 'spectral',
		armorPassive: { type: 'aoe_damage_reduction', value: 1 },
		categories: ['norse_armor', 'spectral_set']
	},
	{
		id: 29834, name: 'Spectral Greaves', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'warlock', armorSlot: 'greaves', armorValue: 2, collectible: true,
		description: '+2 Armor. When a minion dies, gain 1 Mana next turn.',
		setId: 'spectral',
		armorPassive: { type: 'on_death_mana', value: 1 },
		categories: ['norse_armor', 'spectral_set']
	},

	// ============================================
	// ABYSSAL SET (Poseidon — Shaman)
	// ============================================
	{
		id: 29835, name: 'Abyssal Crown', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'shaman', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. Freeze effects last +1 turn.',
		setId: 'abyssal',
		armorPassive: { type: 'freeze_extend', value: 1 },
		categories: ['norse_armor', 'abyssal_set']
	},
	{
		id: 29836, name: 'Abyssal Mail', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'shaman', armorSlot: 'chest', armorValue: 2, collectible: true,
		description: '+2 Armor. Spell Damage +1.',
		setId: 'abyssal',
		armorPassive: { type: 'spell_power', value: 1 },
		categories: ['norse_armor', 'abyssal_set']
	},
	{
		id: 29837, name: 'Tidecaller Greaves', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'shaman', armorSlot: 'greaves', armorValue: 2, collectible: true,
		description: '+2 Armor. Freeze effects last +1 turn.',
		setId: 'abyssal',
		armorPassive: { type: 'freeze_extend', value: 1 },
		categories: ['norse_armor', 'abyssal_set']
	},

	// ============================================
	// AEGIS SET (Athena — Paladin)
	// ============================================
	{
		id: 29838, name: 'Aegis Helm', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'paladin', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. First minion summoned each turn gets +1/+1.',
		setId: 'aegis',
		armorPassive: { type: 'first_summon_buff', value: 1 },
		categories: ['norse_armor', 'aegis_set']
	},
	{
		id: 29839, name: 'Aegis Breastplate', manaCost: 4, type: 'armor', rarity: 'epic',
		heroClass: 'paladin', armorSlot: 'chest', armorValue: 3, collectible: true,
		description: '+3 Armor. Reduce AoE damage taken by 1.',
		setId: 'aegis',
		armorPassive: { type: 'aoe_damage_reduction', value: 1 },
		categories: ['norse_armor', 'aegis_set']
	},
	{
		id: 29840, name: 'Aegis Greaves', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'paladin', armorSlot: 'greaves', armorValue: 2, collectible: true,
		description: '+2 Armor. Spell Damage +1.',
		setId: 'aegis',
		armorPassive: { type: 'spell_power', value: 1 },
		categories: ['norse_armor', 'aegis_set']
	},

	// ============================================
	// VANIR SET (Freya — Priest)
	// ============================================
	{
		id: 29841, name: 'Vanir Circlet', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'priest', armorSlot: 'helm', armorValue: 1, collectible: true,
		description: '+1 Armor. First minion summoned each turn gets +1/+1.',
		setId: 'vanir',
		armorPassive: { type: 'first_summon_buff', value: 1 },
		categories: ['norse_armor', 'vanir_set']
	},
	{
		id: 29842, name: 'Enchanted Vestment', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'priest', armorSlot: 'chest', armorValue: 2, collectible: true,
		description: '+2 Armor. Your healing effects restore 1 additional Health.',
		setId: 'vanir',
		armorPassive: { type: 'lifesteal_percent', value: 1 },
		categories: ['norse_armor', 'vanir_set']
	},
	{
		id: 29843, name: 'Vanir Sandals', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'priest', armorSlot: 'greaves', armorValue: 1, collectible: true,
		description: '+1 Armor. First minion summoned each turn gets +1/+1.',
		setId: 'vanir',
		armorPassive: { type: 'first_summon_buff', value: 1 },
		categories: ['norse_armor', 'vanir_set']
	},

	// ============================================
	// SHADOW SET (Loki — Rogue)
	// ============================================
	{
		id: 29844, name: 'Mask of Mirrors', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'rogue', armorSlot: 'helm', armorValue: 1, collectible: true,
		description: '+1 Armor. Illusions gain Rush.',
		setId: 'shadow',
		armorPassive: { type: 'illusion_rush' },
		categories: ['norse_armor', 'shadow_set']
	},
	{
		id: 29845, name: 'Shadow Cloak', manaCost: 3, type: 'armor', rarity: 'rare',
		heroClass: 'rogue', armorSlot: 'chest', armorValue: 2, collectible: true,
		description: '+2 Armor. Your first spell each turn costs (1) less.',
		setId: 'shadow',
		armorPassive: { type: 'spell_cost_reduction', value: 1 },
		categories: ['norse_armor', 'shadow_set']
	},
	{
		id: 29846, name: 'Shadow Greaves', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'rogue', armorSlot: 'greaves', armorValue: 1, collectible: true,
		description: '+1 Armor. First minion summoned each turn gets +1/+1.',
		setId: 'shadow',
		armorPassive: { type: 'first_summon_buff', value: 1 },
		categories: ['norse_armor', 'shadow_set']
	},

	// ============================================
	// OATHKEEPER SET (Tyr — Paladin)
	// ============================================
	{
		id: 29847, name: 'Oathkeeper Helm', manaCost: 3, type: 'armor', rarity: 'epic',
		heroClass: 'paladin', armorSlot: 'helm', armorValue: 2, collectible: true,
		description: '+2 Armor. Your hero gains +1 Attack while damaged.',
		setId: 'oathkeeper',
		armorPassive: { type: 'attack_while_damaged', value: 1 },
		categories: ['norse_armor', 'oathkeeper_set']
	},
	{
		id: 29848, name: 'Oathkeeper Plate', manaCost: 4, type: 'armor', rarity: 'epic',
		heroClass: 'paladin', armorSlot: 'chest', armorValue: 3, collectible: true,
		description: '+3 Armor. Reduce AoE damage taken by 1.',
		setId: 'oathkeeper',
		armorPassive: { type: 'aoe_damage_reduction', value: 1 },
		categories: ['norse_armor', 'oathkeeper_set']
	},
	{
		id: 29849, name: 'Oathkeeper Greaves', manaCost: 2, type: 'armor', rarity: 'rare',
		heroClass: 'paladin', armorSlot: 'greaves', armorValue: 2, collectible: true,
		description: '+2 Armor. Status effects on your hero last 1 less turn.',
		setId: 'oathkeeper',
		armorPassive: { type: 'status_resistance', value: 1 },
		categories: ['norse_armor', 'oathkeeper_set']
	},
];

export default norseArmorCards;
