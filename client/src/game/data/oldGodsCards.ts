/**
 * Old Gods Cards Collection
 * 
 * This file contains the implementation of C'Thun and the other Old Gods from the
 * Whispers of the Old Gods expansion, along with their related support cards.
 * 
 * The Old Gods are powerful legendary minions with unique effects: 
 * - C'Thun: Grows stronger throughout the game and deals its damage when played
 * - N'Zoth: Resurrects friendly Deathrattle minions that died this game
 * - Yogg-Saron: Casts random spells for each spell you've cast this game
 * - Y'Shaarj: Summons a minion from your deck at the end of your turn
 */

import { CardData } from '../types';

// C'Thun and related cards
export const cthunCards: CardData[] = [
  {
    id: 60001,
    name: "C'Thun",
    manaCost: 10,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal damage equal to this minion's Attack randomly split among all enemies.",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "cthun_damage",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  {
    id: 60002,
    name: "Beckoner of Evil",
    manaCost: 2,
    attack: 2,
    health: 3,
    type: "minion",
    rarity: "common",
    description: "Battlecry: Give your C'Thun +2/+2 (wherever it is).",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "buff_cthun",
      requiresTarget: false,
      targetType: "none",
      buffAttack: 2,
      buffHealth: 2
    },
    collectible: true
  },
  {
    id: 60004,
    name: "Disciple of C'Thun",
    manaCost: 3,
    attack: 2,
    health: 1,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: Deal 2 damage. Give your C'Thun +2/+2 (wherever it is).",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "cthun_cultist_damage",
      requiresTarget: true,
      targetType: "any",
      value: 2,
      buffCthun: true,
      buffAttack: 2,
      buffHealth: 2
    },
    collectible: true
  },
  {
    id: 60005,
    name: "Twilight Elder",
    manaCost: 3,
    attack: 3,
    health: 4,
    type: "minion",
    rarity: "common",
    description: "At the end of your turn, give your C'Thun +1/+1 (wherever it is).",
    keywords: [],
    heroClass: "neutral",
    class: "Neutral",
    effects: [
      {
        type: "end_of_turn",
        value: 1, // Used as a placeholder, actual logic handled in oldGodsUtils
        endOfTurnEffect: "buff_cthun"
      }
    ],
    collectible: true
  },
  {
    id: 60006,
    name: "Hooded Acolyte",
    manaCost: 4,
    attack: 3,
    health: 6,
    type: "minion",
    rarity: "common",
    description: "Whenever a character is healed, give your C'Thun +1/+1 (wherever it is).",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    onHealEffect: {
      type: "buff_cthun",
      buffAttack: 1,
      buffHealth: 1
    },
    collectible: true
  },
  {
    id: 60007,
    name: "Dwarf Amber-Weaver",
    manaCost: 4,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: If your C'Thun has at least 10 Attack, gain +5 Health.",
    keywords: ["battlecry"],
    heroClass: "druid",
    class: "Druid",
    battlecry: {
      type: "conditional_self_buff",
      requiresTarget: false,
      targetType: "none",
      condition: "cthun_attack_10",
      buffHealth: 5
    },
    collectible: true
  },
  {
    id: 60008,
    name: "Jötun Shieldbearer",
    manaCost: 7,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: If your C'Thun has at least 10 Attack, gain 10 Armor.",
    keywords: ["battlecry"],
    heroClass: "warrior",
    class: "Warrior",
    battlecry: {
      type: "conditional_armor",
      requiresTarget: false,
      targetType: "none",
      condition: "cthun_attack_10",
      armorGain: 10
    },
    collectible: true
  },
  {
    id: 60010,
    name: "Emperor Vek'nilash",
    manaCost: 7,
    attack: 4,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Taunt",
    keywords: ["taunt"],
    heroClass: "neutral", // Token card summoned by Twin Emperor Vek'lor
    class: "Neutral",
    collectible: false
  }
];

// Other Old Gods
export const otherOldGods: CardData[] = [
  // N'Zoth, the Corruptor
  {
    id: 60101,
    name: "N'Zoth, the Corruptor",
    manaCost: 10,
    attack: 5,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Summon your Deathrattle minions that died this game.",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "resurrect_deathrattle",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  // Yogg-Saron, Hope's End
  {
    id: 60102,
    name: "Yogg-Saron, Hope's End",
    manaCost: 10,
    attack: 7,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Cast a random spell for each spell you've cast this game (targets chosen randomly).",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "yogg_saron",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  // Y'Shaarj, Rage Unbound
  {
    id: 60103,
    name: "Y'Shaarj, Rage Unbound",
    manaCost: 10,
    attack: 10,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "At the end of your turn, summon a minion from your deck.",
    keywords: [],
    heroClass: "neutral",
    class: "Neutral",
    effects: [
      {
        type: "end_of_turn",
        value: 1, // Placeholder, actual logic handled in oldGodsUtils
        endOfTurnEffect: "summon_from_deck"
      }
    ],
    collectible: true
  }
];

// Combine all Old Gods cards into one collection
export const oldGodsCards: CardData[] = [
  ...cthunCards,
  ...otherOldGods
];

// Export the collection
export default oldGodsCards;