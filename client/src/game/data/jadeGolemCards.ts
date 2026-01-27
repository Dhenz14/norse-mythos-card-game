/**
 * Yggdrasil Golem mechanic cards for Hearthstone clone
 * The Yggdrasil Golem mechanic summons increasingly larger golems for each one summoned this game
 */
import { CardData } from '../types';

// Define the jade golem cards that can generate jade golems
export const jadeGolemCards: CardData[] = [
  {
    id: 85001001,
    name: "Summon Yggdrasil Golem",
    manaCost: 0,
    description: "Summon a Yggdrasil Golem.",
    type: "spell",
    effects: [{ type: "summon_jade_golem" }],
    collectible: true,
    class: "Neutral"
  },
  {
    id: 85001002,
    name: "Shuffle 3 Copies",
    manaCost: 0,
    description: "Shuffle 3 copies of this card into your deck.",
    type: "spell",
    effects: [{ type: "shuffle_copies", count: 3, targetCardId: 85001 }],
    class: "Neutral",
    collectible: true
  },
  {
    id: 85002,
    name: "Yggdrasil Blossom",
    manaCost: 3,
    description: "Summon a Yggdrasil Golem. Gain an empty Mana Crystal.",
    type: "spell",
    rarity: "common",
    heroClass: "druid",
    class: "Druid",
    keywords: ["jade_golem"],
    effects: [
      { type: "summon_jade_golem" },
      { type: "gain_mana_crystal", value: 1, full: false }
    ],
    collectible: true
  },
  {
    id: 85003,
    name: "Jade Lightning",
    manaCost: 4,
    description: "Deal 4 damage. Summon a Yggdrasil Golem.",
    type: "spell",
    rarity: "common",
    heroClass: "shaman",
    class: "Shaman",
    keywords: ["jade_golem"],
    effects: [
      { type: "damage", value: 4, requiresTarget: true },
      { type: "summon_jade_golem" }
    ],
    collectible: true
  },
  {
    id: 85004,
    name: "Jade Claws",
    manaCost: 2,
    attack: 2,
    durability: 2,
    description: "Battlecry: Summon a Yggdrasil Golem. Overload: (1)",
    type: "weapon",
    rarity: "rare",
    heroClass: "shaman",
    class: "Shaman",
    keywords: ["jade_golem", "overload", "battlecry"],
    overload: 1,
    battlecry: {
      type: "summon_jade_golem",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  {
    id: 85005,
    name: "Jade Swarmer",
    manaCost: 2,
    attack: 1,
    health: 1,
    description: "Stealth. Deathrattle: Summon a Yggdrasil Golem.",
    type: "minion",
    rarity: "common",
    heroClass: "rogue",
    class: "Rogue",
    keywords: ["stealth", "deathrattle", "jade_golem"],
    deathrattle: {
      type: "summon_jade_golem"
    },
    collectible: true
  }
];

// Yggdrasil Golem token cards (not directly collectible)
export const jadeGolemTokens: CardData[] = [
  // Yggdrasil Golem 1/1
  {
    id: 85101,
    name: "Yggdrasil Golem",
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "Summoned by Yggdrasil Golem effects. Grows larger with each Yggdrasil Golem summoned.",
    type: "minion",
    rarity: "common",
    heroClass: "neutral",
    class: "Neutral",
    keywords: [],
    collectible: false,
    jadeGolemStats: {
      attack: 1,
      health: 1,
      number: 1
    }
  }
  // Additional sizes would be defined similarly
  // For brevity, we're only including a few examples, but in a full implementation
  // you would have entries for all sizes from 1/1 to potentially 30/30
];

// Export for use in the game
export default { jadeGolemCards, jadeGolemTokens };
