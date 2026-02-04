/**
 * Rush and Lifesteal cards for Hearthstone clone
 * Rush allows minions to attack other minions on the turn they're played
 * Lifesteal restores Health equal to the damage dealt
 */
import { CardData } from '../types';

export const   rushCards: CardData[] = [
  {
      id: 17001,

      name: "Militia Commander",
      manaCost: 4,

      attack: 2,
      health: 5,

      description: "Rush.   Battlecry: Gain +3 Attack this turn.",
    rarity: "rare",
      type: "minion",

      keywords: ["rush", "battlecry"],
                  battlecry: {
        type: "buff",
        buffAttack: 3,

        targetType: "none",
        requiresTarget: false,

        // The buff would only last for one turn, handled in game logic
        buffHealth: 1

         },
      collectible: true,
      class: "Neutral"
},
  {
  id: 17002,
  
  name: "Swift Messenger",
  manaCost: 4,
  
  attack: 2,
  health: 6,
  
  description: "Rush. Each turn this is in your hand, swap its Attack and Health.",
  rarity: "common",
  
  type: "minion",
  keywords: ["rush"],
  
  // The swap effect would be handled in the game logic
  class: "Neutral",
      collectible: true
  },
  {
  id: 17003,
  
  name: "Rabid Worgen",
  manaCost: 3,
  
  attack: 3,
  health: 3,
  
  description: "Rush",
  rarity: "common",
  
  type: "minion",
  keywords: ["rush"],
      class: "Neutral",
      collectible: true
  },
];

export const   lifestealCards: CardData[] = [
  {
      id: 17101,

      name: "Spirit Lash",
      manaCost: 2,

      description: "Lifesteal. Deal 1 damage to all minions.",
      rarity: "common",

      type: "spell",
      keywords: ["lifesteal"],

      spellEffect: {
        type: "aoe_damage",

        value: 1,
      targetType: "all_minions",

      requiresTarget: false
    },
      class: "Neutral",
      collectible: true},
  {
      id: 17102,

      name: "Drain Soul",
      manaCost: 2,

      description: "Lifesteal. Deal 2 damage to a minion.",
      rarity: "common",

      type: "spell",
      keywords: ["lifesteal"],

      heroClass: "warlock",
      class: "Warlock",
      spellEffect: {
        type: "damage",
      value: 2,

      targetType: "any_minion",
      requiresTarget: true

       },
      collectible: true},
  {
  id: 17103,
  
  name: "Vicious Scalehide",
  manaCost: 2,
  
  attack: 1,
  health: 3,
  
  description: "Lifesteal, Rush",
  rarity: "common",
  
  type: "minion",
  keywords: ["lifesteal", "rush"],
      class: "Neutral",
      collectible: true
  },
  {
  id: 17104,
  
  name: "Bloodworm",
  manaCost: 5,
  
  attack: 4,
  health: 4,
  
  description: "Lifesteal",
  rarity: "common",
  
  type: "minion",
  keywords: ["lifesteal"],
      class: "Neutral",
      collectible: true
  },
];

// Cards with both Rush and Lifesteal
export const   combinedCards: CardData[] = [
   // Cards that have both keywords are already included above
];

// Export all rush and lifesteal cards
export const   allRushLifestealCards: CardData[] = [
   ...rushCards,
  ...lifestealCards,
  ...combinedCards
];

export default allRushLifestealCards;