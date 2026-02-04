import { CardData } from '../../../../types';

// Token Cards - Non-Collectible
// These cards are summoned or created by other cards and cannot be collected

// ============================================
// NEUTRAL TOKENS
// ============================================
const neutralTokens: CardData[] = [
  {
    id: 5034,
    name: 'Mechanical Construct',
    description: '',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 2,
    health: 1,
    race: 'Automaton',
    class: 'Neutral',
    collectible: false
  },
  {
    id: 5053,
    name: 'Sea Sprite Scout',
    description: '',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    race: 'Naga',
    class: 'Neutral',
    collectible: false
  },
  {
    id: 5058,
    name: 'Apprentice Mage',
    description: '',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    class: 'Neutral',
    collectible: false
  },
  {
    id: 5071,
    name: 'Restoration Golem',
    description: 'At the end of your turn, restore 6 Health to a damaged character.',
    flavorText: 'A healing automaton from the divine forge.',
    type: 'minion',
    rarity: 'legendary',
    manaCost: 1,
    attack: 0,
    health: 3,
    race: 'Automaton',
    class: 'Neutral',
    collectible: false
  },
  {
    id: 5072,
    name: 'Transformed Fowl',
    description: '',
    flavorText: 'It used to be something else before the magic hit it.',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    race: 'Beast',
    class: 'Neutral',
    collectible: false
  },
  {
    id: 3100,
    name: 'Shield of the Colossus',
    description: "Part of Colossus of the Moon. Taunt. Divine Shield. Can't attack.",
    type: 'minion',
    rarity: 'legendary',
    manaCost: 4,
    attack: 0,
    health: 5,
    class: 'Neutral',
    keywords: ['taunt', 'divine_shield'],
    collectible: false
  },
  {
    id: 30057,
    name: 'Mechanical Dragonling',
    description: '',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 2,
    health: 1,
    race: 'Automaton',
    class: 'Neutral',
    collectible: false
  },
  {
    id: 30059,
    name: 'Boar',
    description: 'Charge',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    race: 'Beast',
    class: 'Neutral',
    keywords: ['charge'],
    collectible: false
  },
  {
    id: 30084,
    name: 'Spark',
    description: 'Rush',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    race: 'Elemental',
    class: 'Neutral',
    keywords: ['rush'],
    collectible: false
  },
  {
    id: 30076,
    name: 'Goblin Bomb',
    description: 'Deathrattle: Deal 2 damage to the enemy hero.',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 0,
    health: 2,
    race: 'Automaton',
    class: 'Neutral',
    keywords: ['deathrattle'],
    collectible: false,
    deathrattle: {
      type: 'deal_damage',
      targetType: 'enemy_hero',
      value: 2
    }
  },
  {
    id: 30092,
    name: 'Free Agent',
    description: 'Taunt',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 0,
    health: 3,
    class: 'Neutral',
    keywords: ['taunt'],
    collectible: false
  },
  {
    id: 30109,
    name: 'Raptor of Midgard',
    description: '',
    type: 'minion',
    rarity: 'common',
    manaCost: 3,
    attack: 4,
    health: 3,
    race: 'Beast',
    class: 'Neutral',
    collectible: false
  },
  {
    id: 40112,
    name: 'Damaged Golem',
    description: '',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 2,
    health: 1,
    race: 'Automaton',
    class: 'Neutral',
    collectible: false
  },
  {
    id: 40114,
    name: 'Baine Bloodhoof',
    description: '',
    type: 'minion',
    rarity: 'legendary',
    manaCost: 4,
    attack: 4,
    health: 5,
    class: 'Neutral',
    collectible: false
  },
  {
    id: 40115,
    name: 'Slime',
    description: 'Taunt',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 2,
    class: 'Neutral',
    keywords: ['taunt'],
    collectible: false
  },
  {
    id: 40116,
    name: 'Mechanical Dragon',
    description: '',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 2,
    health: 2,
    race: 'Automaton',
    class: 'Neutral',
    collectible: false
  },
  {
    id: 40121,
    name: 'Faceless Destroyer',
    description: '',
    type: 'minion',
    rarity: 'epic',
    manaCost: 5,
    attack: 5,
    health: 5,
    class: 'Neutral',
    collectible: false
  }
];

// ============================================
// HUNTER TOKENS
// ============================================
// Note: Hound (7501), Misha (7503), Huffer (7504), Leokk (7505) are defined in hunter.ts
const hunterTokens: CardData[] = [
  {
    id: 7510,
    name: 'Bjorn, the Sacred Bear',
    description: 'Taunt',
    flavorText: 'A mighty bear blessed by the gods of the forest.',
    type: 'minion',
    rarity: 'common',
    manaCost: 3,
    attack: 4,
    health: 4,
    race: 'Beast',
    class: 'Hunter',
    keywords: ['taunt'],
    collectible: false
  },
  {
    id: 7511,
    name: "Sleipnir's Kin",
    description: 'Your other minions have +1 Attack.',
    flavorText: "Descended from Odin's eight-legged steed.",
    type: 'minion',
    rarity: 'common',
    manaCost: 3,
    attack: 2,
    health: 4,
    race: 'Beast',
    class: 'Hunter',
    collectible: false,
    aura: {
      type: 'buff_attack',
      value: 1,
      targetType: 'other_friendly_minions'
    }
  },
  {
    id: 7512,
    name: 'Serpent of Midgard',
    description: '',
    flavorText: 'A tiny spawn of the great World Serpent.',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    race: 'Beast',
    class: 'Hunter',
    collectible: false
  }
];

// ============================================
// PALADIN TOKENS
// ============================================
// Note: Ashbringer (8501), Silver Hand Recruit (8502) are defined in paladin.ts
const paladinTokens: CardData[] = [
  {
    id: 8503,
    name: 'Temple Guardian',
    description: '',
    flavorText: 'Sacred protectors of the divine temples.',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 2,
    health: 1,
    class: 'Paladin',
    collectible: false
  },
  {
    id: 8504,
    name: 'Acolyte of Valhalla',
    description: '',
    flavorText: 'Training to become an Einherjar.',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    class: 'Paladin',
    collectible: false
  },
  {
    id: 8505,
    name: 'Rider of Famine',
    description: '',
    type: 'minion',
    rarity: 'legendary',
    manaCost: 2,
    attack: 2,
    health: 2,
    class: 'Paladin',
    collectible: false
  },
  {
    id: 8506,
    name: 'Rider of Pestilence',
    description: '',
    type: 'minion',
    rarity: 'legendary',
    manaCost: 2,
    attack: 2,
    health: 2,
    class: 'Paladin',
    collectible: false
  },
  {
    id: 8507,
    name: 'Rider of War',
    description: '',
    type: 'minion',
    rarity: 'legendary',
    manaCost: 2,
    attack: 2,
    health: 2,
    class: 'Paladin',
    collectible: false
  },
  {
    id: 8508,
    name: 'Rider of Death',
    description: '',
    type: 'minion',
    rarity: 'legendary',
    manaCost: 2,
    attack: 2,
    health: 2,
    class: 'Paladin',
    collectible: false
  }
];

// ============================================
// SHAMAN TOKENS
// ============================================
// Note: Spirit Wolf (5253), Frog (5251), Vashj Prime (5252) are defined in shaman.ts
const shamanTokens: CardData[] = [
  {
    id: 3101,
    name: 'Hand of Poseidon',
    description: 'Part of Neptulon the Tidehunter. After this attacks, add a random Elemental to your hand.',
    type: 'minion',
    rarity: 'legendary',
    manaCost: 4,
    attack: 4,
    health: 2,
    class: 'Shaman',
    race: 'Elemental',
    collectible: false
  },
];

// ============================================
// DRUID TOKENS
// ============================================
// Note: All druid tokens (Treant, Panther, etc.) are defined in druid.ts
const druidTokens: CardData[] = [];

// ============================================
// WARLOCK TOKENS
// ============================================
// Note: All warlock tokens (Infernal, Imp, Soul Remnant, etc.) are defined in warlock.ts
const warlockTokens: CardData[] = [];

// ============================================
// MAGE TOKENS
// ============================================
// Note: Mirror Image (32031) is defined in mage.ts
const mageTokens: CardData[] = [
  {
    id: 32032,
    name: 'Spellbender',
    description: '',
    type: 'minion',
    rarity: 'epic',
    manaCost: 0,
    attack: 1,
    health: 3,
    class: 'Mage',
    collectible: false
  },
  {
    id: 31025,
    name: 'Frog',
    description: '',
    type: 'minion',
    rarity: 'common',
    manaCost: 0,
    attack: 0,
    health: 1,
    race: 'Beast',
    class: 'Mage',
    collectible: false
  }
];

// ============================================
// ROGUE TOKENS
// ============================================
// Note: Wicked Knife (12301), Defias Bandit (12501) are defined in rogue.ts
const rogueTokens: CardData[] = [];

// ============================================
// DEATHKNIGHT TOKENS
// ============================================
// Note: Skeleton (3019) is defined in deathknight.ts
const deathknightTokens: CardData[] = [
  {
    id: 3020,
    name: 'Draugr Bones',
    description: '',
    flavorText: 'Remains of a fallen Norse warrior.',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    race: 'Undead',
    class: 'Deathknight',
    collectible: false
  }
];

// ============================================
// NECROMANCER TOKENS
// ============================================
// Note: Skeleton (4900), Zombie (4901) are defined in necromancer.ts
const necromancerTokens: CardData[] = [];

// ============================================
// DEMONHUNTER TOKENS
// ============================================
// Note: Demonic Blast (9114), Illidari Initiate (9117) are defined in demonhunter.ts
const demonhunterTokens: CardData[] = [
  {
    id: 9118,
    name: 'Hunter of Artemis',
    description: '',
    flavorText: 'Swift hunters devoted to the moon goddess.',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    class: 'Demonhunter',
    collectible: false
  }
];

// ============================================
// WARRIOR TOKENS
// ============================================
const warriorTokens: CardData[] = [
  {
    id: 15014,
    name: 'Shade of Hades',
    description: '',
    flavorText: 'A wandering soul from the underworld.',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 2,
    health: 1,
    class: 'Warrior',
    collectible: false
  },
  {
    id: 15017,
    name: 'Fury of Ares',
    description: 'Rush',
    flavorText: "War god's blessing grants swift vengeance.",
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 2,
    health: 1,
    class: 'Warrior',
    keywords: ['rush'],
    collectible: false
  },
  {
    id: 15018,
    name: 'Muspel Infernal',
    description: '',
    flavorText: 'Demon from the fire realm of Muspelheim.',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    race: 'Titan',
    class: 'Warrior',
    collectible: false
  },
  {
    id: 30101,
    name: 'Hound',
    description: 'Charge',
    type: 'minion',
    rarity: 'common',
    manaCost: 1,
    attack: 1,
    health: 1,
    race: 'Beast',
    class: 'Warrior',
    keywords: ['charge'],
    collectible: false
  }
];

// ============================================
// NORSE MYTHOLOGY TOKENS
// ============================================
const norseMythologyTokens: CardData[] = [
  {
    id: 20621,
    name: "Jormungandr's Coil",
    manaCost: 2,
    attack: 0,
    health: 5,
    description: 'At the end of your turn, deal 1 damage to all enemy minions.',
    flavorText: 'Each coil tightens, bringing inevitable doom closer.',
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    endOfTurn: {
      type: 'damage',
      value: 1,
      targetType: 'enemy_minions'
    },
    categories: ['norse_mythology', 'token'],
    collectible: false
  },
  {
    id: 4310,
    name: 'Shadow Hound',
    manaCost: 2,
    attack: 2,
    health: 2,
    description: 'Taunt',
    flavorText: "Bound to serve the guardian of Hel's gates.",
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    race: 'beast',
    keywords: ['taunt'],
    categories: ['norse_mythology', 'token'],
    collectible: false
  },
  {
    id: 4311,
    name: 'Shadow Wolf',
    manaCost: 2,
    attack: 2,
    health: 2,
    description: 'Stealth',
    flavorText: 'A wolf born of shadow, loyal to the Alpha.',
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    race: 'beast',
    keywords: ['stealth'],
    categories: ['norse_mythology', 'token'],
    collectible: false
  },
  {
    id: 4312,
    name: 'Shadow Wolf',
    manaCost: 3,
    attack: 3,
    health: 3,
    description: 'Stealth',
    flavorText: 'Emerges from the darkness to claim the weak.',
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    race: 'beast',
    keywords: ['stealth'],
    categories: ['norse_mythology', 'token'],
    collectible: false
  },
  {
    id: 4313,
    name: 'Shadow Pup',
    manaCost: 1,
    attack: 1,
    health: 1,
    description: 'Stealth',
    flavorText: 'A tiny predator, eager to grow into a wolf.',
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    race: 'beast',
    keywords: ['stealth'],
    categories: ['norse_mythology', 'token'],
    collectible: false
  },
  {
    id: 4340,
    name: "Ginnungagap's Fury",
    manaCost: 0,
    attack: 0,
    health: 3,
    description: 'At the end of each turn, deal 2 damage to ALL characters.',
    flavorText: 'The raw fury of Ginnungagap, the primordial void from which all Norse creation emerged.',
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    endOfTurn: {
      type: 'damage',
      value: 2,
      targetType: 'all_characters'
    },
    categories: ['norse_mythology', 'token'],
    collectible: false
  },
  {
    id: 4361,
    name: "Glóð's Spark",
    manaCost: 2,
    attack: 2,
    health: 2,
    description: 'A small sprite of pure flame.',
    flavorText: 'A spark from Glóð, the Norse goddess of embers and glowing coals.',
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    categories: ['norse_mythology', 'fire_legendary', 'token'],
    collectible: false
  },
  {
    id: 4377,
    name: "Yggdrasil's Tendril",
    manaCost: 1,
    attack: 1,
    health: 3,
    description: 'Taunt',
    flavorText: 'A living root of the World Tree.',
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    keywords: ['taunt'],
    categories: ['norse_mythology', 'earth_legendary', 'token'],
    collectible: false
  },
  {
    id: 4385,
    name: "Rán's Thrall",
    manaCost: 2,
    attack: 2,
    health: 3,
    description: 'Deathrattle: Freeze a random enemy.',
    flavorText: "A soul captured by Rán's net, forever bound to serve the goddess of the drowned.",
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    deathrattle: {
      type: 'freeze_random',
      targetType: 'random_enemy_minion'
    },
    categories: ['norse_mythology', 'water_legendary', 'token'],
    collectible: false
  },
  {
    id: 4418,
    name: 'Charging Goat',
    manaCost: 2,
    attack: 2,
    health: 2,
    description: 'Charge',
    flavorText: "A loyal companion to Thor's mighty goats.",
    rarity: 'common',
    type: 'minion',
    class: 'Neutral',
    heroClass: 'neutral',
    race: 'beast',
    keywords: ['charge'],
    categories: ['norse_mythology', 'lightning_legendary', 'token'],
    collectible: false
  }
];

// ============================================
// EFFECT TOKENS (Created by game effects)
// ============================================
// Note: 9004 (Dire Cat Form) is defined in druid.ts
// Note: 9008 (Battlescar Watcher) is defined in neutrals/index.ts
const effectTokens: CardData[] = [
  {
    id: 20612,
    name: 'Fenrir, the Worldbreaker',
    description: 'Charge. Rush. Can attack twice each turn.',
    type: 'minion',
    rarity: 'legendary',
    manaCost: 10,
    attack: 10,
    health: 10,
    race: 'Beast',
    class: 'Neutral',
    keywords: ['charge', 'rush', 'mega_windfury'],
    collectible: false
  },
  {
    id: 70101,
    name: 'Kazakus Potion (1-Cost)',
    description: 'A custom potion created by Kazakus.',
    type: 'spell',
    rarity: 'legendary',
    manaCost: 1,
    class: 'Neutral',
    collectible: false
  },
  {
    id: 70105,
    name: 'Kazakus Potion (5-Cost)',
    description: 'A custom potion created by Kazakus.',
    type: 'spell',
    rarity: 'legendary',
    manaCost: 5,
    class: 'Neutral',
    collectible: false
  },
  {
    id: 70110,
    name: 'Kazakus Potion (10-Cost)',
    description: 'A custom potion created by Kazakus.',
    type: 'spell',
    rarity: 'legendary',
    manaCost: 10,
    class: 'Neutral',
    collectible: false
  }
];

// ============================================
// EXPORT ALL TOKEN CARDS
// ============================================
export const tokenCards: CardData[] = [
  ...neutralTokens,
  ...hunterTokens,
  ...paladinTokens,
  ...shamanTokens,
  ...druidTokens,
  ...warlockTokens,
  ...mageTokens,
  ...rogueTokens,
  ...deathknightTokens,
  ...necromancerTokens,
  ...demonhunterTokens,
  ...warriorTokens,
  ...norseMythologyTokens,
  ...effectTokens
];

export default tokenCards;
