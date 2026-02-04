/**
 * Cards with discover mechanics
 */
import { CardData } from '../types';

export const discoverCards: CardData[] = [
  // Spell discover
  {
    id: 5001,
    name: 'Magic Mapping',
    description: 'Discover a spell.',
    manaCost: 1,
    type: 'spell',
    rarity: 'common',
    keywords: ['discover'],
    spellEffect: {
      type: 'discover',
      requiresTarget: false,
      discoveryType: 'spell',
      value: 1,
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  // Minion discover
  {
    id: 5002,
    name: 'Curious Excavator',
    description: 'Battlecry: Discover a Dragon.',
    manaCost: 3,
    type: 'minion',
    rarity: 'rare',
    attack: 2,
    health: 3,
    keywords: ['battlecry', 'discover'],
    race: 'none',
    battlecry: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'dragon',
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  // Secret discover
  {
    id: 5003,
    name: 'Mage Secrets',
    description: 'Discover a Secret.',
    manaCost: 2,
    type: 'spell',
    rarity: 'common',
    keywords: ['discover'],
    spellEffect: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'secret',
      value: 1,
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  // Weapon discover
  {
    id: 5004,
    name: 'Weapon Smith',
    description: 'Battlecry: Discover a Weapon.',
    manaCost: 4,
    type: 'minion',
    rarity: 'common',
    attack: 3,
    health: 3,
    keywords: ['battlecry', 'discover'],
    race: 'none',
    battlecry: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'weapon',
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  // Minion type discover
  {
    id: 5005,
    name: 'Beast Finder',
    description: 'Battlecry: Discover a Beast.',
    manaCost: 2,
    type: 'minion',
    rarity: 'common',
    attack: 2,
    health: 2,
    keywords: ['battlecry', 'discover'],
    race: 'none',
    battlecry: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'beast',
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  // Keyword discover
  {
    id: 5006,
    name: 'Shield Bearer',
    description: 'Battlecry: Discover a minion with Taunt.',
    manaCost: 3,
    type: 'minion',
    rarity: 'common',
    attack: 1,
    health: 4,
    keywords: ['battlecry', 'discover', 'taunt'],
    race: 'none',
    battlecry: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'taunt',
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  // Mana cost discovery
  {
    id: 5007,
    name: 'Mana Shifter',
    description: 'Discover a 1-Cost card.',
    manaCost: 1,
    type: 'spell',
    rarity: 'common',
    keywords: ['discover'],
    spellEffect: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'one_cost',
      value: 1,
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  // Advanced discovery
  {
    id: 5008,
    name: 'Master Searcher',
    description: 'Discover a Legendary minion.',
    manaCost: 5,
    type: 'spell',
    rarity: 'epic',
    keywords: ['discover'],
    spellEffect: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'legendary',
      value: 1,
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  // Cheap discovery
  {
    id: 5009,
    name: 'Academic Research',
    description: 'Discover a spell. It costs (2) less.',
    manaCost: 3,
    type: 'spell',
    rarity: 'rare',
    keywords: ['discover'],
    spellEffect: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'spell',
      value: 1,
      targetType: 'none',
      manaDiscount: 2  // The discovered card costs 2 less
    },
    collectible: true,
    class: "Neutral"
  },
  // Triple discovery (discover 3 cards)
  {
    id: 5010,
    name: 'Master Collector',
    description: 'Discover 3 different cards.',
    manaCost: 8,
    type: 'spell',
    rarity: 'legendary',
    keywords: ['discover'],
    spellEffect: {
      type: 'discover',
      requiresTarget: false,
      discoveryType: 'any',
      discoveryCount: 3,  // Discover 3 cards instead of 1
      value: 3,
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  // New discover cards
  {
    id: 5011,
    name: 'Primordial Glyph',
    description: 'Discover a spell. Reduce its cost by (2).',
    manaCost: 2,
    type: 'spell',
    rarity: 'epic',
    keywords: ['discover'],
    heroClass: 'mage',
    class: "Mage",
    spellEffect: {
      type: 'discover',
      requiresTarget: false,
      discoveryType: 'spell',
      manaDiscount: 2,
      targetType: 'none'
    },
    collectible: true
  },
  {
    id: 5012,
    name: 'Shadow Visions',
    description: 'Discover a copy of a spell in your deck.',
    manaCost: 2,
    type: 'spell',
    rarity: 'epic',
    keywords: ['discover'],
    heroClass: 'priest',
    class: "Priest",
    spellEffect: {
      type: 'discover',
      requiresTarget: false,
      discoveryType: 'spell',
      targetType: 'none'
    },
    collectible: true
  },
  {
    id: 5013,
    name: 'Stonehill Defender',
    description: 'Taunt. Battlecry: Discover a Taunt minion.',
    manaCost: 3,
    type: 'minion',
    attack: 1,
    health: 4,
    rarity: 'rare',
    keywords: ['taunt', 'battlecry', 'discover'],
    battlecry: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'taunt',
      targetType: 'none'
    },
    collectible: true,
    class: "Neutral"
  },
  {
    id: 5014,
    name: 'Drakonid Operative',
    description: 'Battlecry: If you are holding a Dragon, Discover a copy of a card in your opponent\'s deck.',
    manaCost: 5,
    type: 'minion',
    attack: 5,
    health: 6,
    rarity: 'rare',
    race: 'dragon',
    keywords: ['battlecry', 'discover'],
    heroClass: 'priest',
    class: "Priest",
    battlecry: {
      type: 'discover',
      requiresTarget: false,
      targetType: 'none',
      discoveryType: 'any'
    },
    collectible: true
  },
  {
    id: 5015,
    name: 'Dark Discovery',
    description: 'Discover a Demon.',
    manaCost: 3,
    type: 'spell',
    rarity: 'common',
    keywords: ['discover'],
    heroClass: 'warlock',
    class: "Warlock",
    spellEffect: {
      type: 'discover',
      requiresTarget: false,
      discoveryPoolId: 'demon',
      targetType: 'none'
    },
    collectible: true
  },
  {
    id: 5016,
    name: 'Arcanologist',
    description: 'Battlecry: Draw a Secret from your deck.',
    manaCost: 2,
    type: 'minion',
    attack: 2,
    health: 3,
    rarity: 'common',
    keywords: ['battlecry'],
    heroClass: 'mage',
    class: "Mage",
    battlecry: {
      type: 'draw',
      value: 1,
      requiresTarget: false,
      targetType: 'none',
      // Special handling to draw secrets in game logic
      conditionalTarget: 'secret'
    },
    collectible: true
  }
];

// Export a function to get discover cards by ID
export function getDiscoverCardById(id: number): CardData | undefined {
  return discoverCards.find(card => card.id === id);
}