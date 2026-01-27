/**
 * Adapt mechanism cards for Hearthstone clone
 * Adapt allows players to choose one of three adaptations to enhance a minion
 */
import { CardData } from '../types';

// Define the adaptation options that can be chosen
export const adaptationOptions: CardData[] = [
  {
    id: 16001,
    name: "Crackling Shield",
    manaCost: 0,
    description: "Give a friendly minion Divine Shield (prevents the next damage it takes)",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
      // This would grant Divine Shield in the game logic
    },
    collectible: true,
    class: "Neutral"
  },
  {
    id: 16002,
    name: "Flaming Claws",
    manaCost: 0,
    description: "Give a friendly minion +3 Attack",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      buffAttack: 3,
      targetType: "friendly_minion",
      requiresTarget: true
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16003,
    name: "Living Spores",
    manaCost: 0,
    description: "Give a friendly minion 'Deathrattle: Summon two 1/1 Plants'",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
      // This would add the Deathrattle effect in game logic
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16004,
    name: "Lightning Speed",
    manaCost: 0,
    description: "Give a friendly minion Windfury (can attack twice per turn)",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
      // This would grant Windfury in the game logic
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16005,
    name: "Massive",
    manaCost: 0,
    description: "Give a friendly minion Taunt (must be attacked first)",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
      // This would grant Taunt in the game logic
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16006,
    name: "Poison Spit",
    manaCost: 0,
    description: "Give a friendly minion Poisonous (kills any minion it damages)",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
      // This would grant Poisonous in the game logic
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16007,
    name: "Rocky Carapace",
    manaCost: 0,
    description: "Give a friendly minion +3 Health",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      buffHealth: 3,
      targetType: "friendly_minion",
      requiresTarget: true
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16008,
    name: "Shrouding Mist",
    manaCost: 0,
    description: "Stealth until your next turn",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
      // This would grant temporary Stealth in the game logic
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16009,
    name: "Volcanic Might",
    manaCost: 0,
    description: "Give a friendly minion +1/+1",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      buffAttack: 1,
      buffHealth: 1,
      targetType: "friendly_minion",
      requiresTarget: true
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16010,
    name: "Liquid Membrane",
    manaCost: 0,
    description: "Can't be targeted by spells or Hero Powers",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
      // This would grant Elusive in the game logic
    },
    class: "Neutral",
    collectible: true
  }
];

// Cards that offer the Adapt mechanic
export const adaptCards: CardData[] = [
  {
    id: 16101,
    name: "Verdant Longneck",
    manaCost: 5,
    attack: 5,
    health: 4,
    description: "Battlecry: Adapt.",
    rarity: "common",
    type: "minion",
    keywords: ["battlecry", "adapt"],
    battlecry: {
      type: "transform", // This would trigger the adapt selection
      requiresTarget: false,
      targetType: "none"
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16102,
    name: "Elder Longneck",
    manaCost: 3,
    attack: 3,
    health: 1,
    description: "Battlecry: If you're holding a minion with 5 or more Attack, Adapt.",
    rarity: "common",
    type: "minion",
    keywords: ["battlecry", "adapt"],
    battlecry: {
      type: "transform", // This would trigger the adapt selection with a condition
      requiresTarget: false,
      targetType: "none"
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16103,
    name: "Volcanosaur",
    manaCost: 7,
    attack: 5,
    health: 6,
    description: "Battlecry: Adapt, then Adapt.",
    rarity: "rare",
    type: "minion",
    keywords: ["battlecry", "adapt"],
    battlecry: {
      type: "transform", // This would trigger the adapt selection twice
      requiresTarget: false,
      targetType: "none"
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16104,
    name: "Ravenous Pterrordax",
    manaCost: 4,
    attack: 4,
    health: 4,
    description: "Battlecry: Destroy a friendly minion to Adapt twice.",
    rarity: "common",
    type: "minion",
    keywords: ["battlecry", "adapt"],
    battlecry: {
      type: "transform", // This would trigger the adapt selection with a sacrifice
      requiresTarget: true,
      targetType: "friendly_minion"
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 16105,
    name: "Adapt",
    manaCost: 1,
    description: "Adapt a friendly minion.",
    rarity: "common",
    type: "spell",
    keywords: ["adapt"],
    spellEffect: {
      type: "transform", // This would trigger the adapt selection
      targetType: "friendly_minion",
      requiresTarget: true
    },
    class: "Neutral",
    collectible: true
  }
];

// Plant token for Living Spores
export const adaptTokens: CardData[] = [
  {
    id: 16201,
    name: "Plant",
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "Summoned by Living Spores.",
    rarity: "common",
    type: "minion",
    keywords: [],
    class: "Neutral",
    collectible: false
  }
];

// Export all adapt-related cards
export const allAdaptCards: CardData[] = [
  ...adaptationOptions,
  ...adaptCards,
  ...adaptTokens
];

export default allAdaptCards;