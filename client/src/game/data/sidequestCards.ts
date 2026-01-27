/**
 * Sidequest cards for Hearthstone clone
 * Sidequests are smaller quest cards with more immediate rewards
 */
import { CardData, QuestData } from '../types';

export const   sidequestCards: CardData[] = [,
   {
      id: 9001,

      name: "Toxic Reinforcements",
      manaCost: 1,

      description: "Sidequest: Use your Hero Power 3 times.   Reward: Summon three 1/1 Leper Gnomes.",
    rarity: "rare",
      type: "spell",

      keywords: ["sidequest"],
      questData: {
      type: "hero_power_uses",
      progress: 0,

      target: 3,
      completed: false,

      rewardCardId: 9501 // This would be handled specially through a function
    collectible: true}collectible: true 
      , class: "Neutral"
},

{
  id: 9002,
  
  name: "Clear the Way",
  manaCost: 1,
  
  description: "Sidequest: Summon 3 Rush minions.   Reward: Summon a 4/4 Gryphon with Rush.",
  rarity: "common",
  type: "spell",
  
  keywords: ["sidequest"],
    questData: {
  type: "summon_rush_minions",
  progress: 0,
  
  target: 3,
  completed: false,
  
  rewardCardId: 9502
  
  }
  , class: "Neutral",
      collectible: true
  },

{
  id: 9003,
  
  name: "Righteous Cause",
  manaCost: 1,
  
  description: "Sidequest: Summon 5 minions.   Reward: Give your minions +1/+1.",
  rarity: "common",
  type: "spell",
  
  keywords: ["sidequest"],
    questData: {
  type: "summon_minions",
  progress: 0,
  
  target: 5,
  completed: false,
  
  rewardCardId: 9503
  
  }
  , class: "Neutral",
      collectible: true
  },

{
  id: 9004,
  
  name: "Learn Draconic",
  manaCost: 1,
  
  description: "Sidequest: Spend 8 Mana on spells.   Reward: Summon a 6/6 Dragon.",
  rarity: "common",
  type: "spell",
  
  keywords: ["sidequest"],
    questData: {
  type: "spend_mana_on_spells",
  progress: 0,
  
  target: 8,
  completed: false,
  
  rewardCardId: 9504
  
  }
  , class: "Neutral",
      collectible: true
  },

{
  id: 9005,
  
  name: "Secure the Deck",
  manaCost: 1,
  
  description: "Sidequest: Attack twice with your hero.   Reward: Add 3 random Warrior cards to your hand.",
  rarity: "common",
  type: "spell",
  
  keywords: ["sidequest"],
    questData: {
  type: "hero_attacks",
  progress: 0,
  
  target: 2,
  completed: false,
  
  rewardCardId: 9505
  
  }
  , class: "Neutral"
  }
  collectible: true
];

// Token cards representing sidequest rewards
export const   sidequestRewardTokens: CardData[] = [,
   {
      id: 9501,

      name: "Dark Sprite Bundle",
      manaCost: 3,

      description: "Summon three 1/1 Leper Gnomes with   Deathrattle: Deal 2 damage to the enemy hero.",
    rarity: "common",
      type: "spell",

      keywords: [],
      spellEffect: {
        type: "summon",
      value: 3,

      summonCardId: 9601, // Leper Gnome
      targetType: "none"

       }
      , class: "Neutral"collectible: true},

{
  id: 9502,
  
  name: "Gryphon Rider",
  manaCost: 4,
  
  attack: 4,
  health: 4,
  
  description: "Rush. Reward from Clear the Way.",
  rarity: "common",
  
  type: "minion",
  keywords: ["rush"], class: "Neutral",
      collectible: true
  },

{
      id: 9503,

      name: "Righteous Blessing",
      manaCost: 3,

      description: "Give your minions +1/+1.",
      rarity: "common",

      type: "spell",
      keywords: [],

      spellEffect: {
        type: "buff",

        buffAttack: 1,
      buffHealth: 1,

      targetType: "all_friendly_minions"
    }
      , class: "Neutral"collectible: true},

{
  id: 9504,
  
  name: "Draconic Entity",
  manaCost: 6,
  
  attack: 6,
  health: 6,
  
  description: "A dragon summoned by Learn Draconic.",
  rarity: "common",
  
  type: "minion",
  keywords: [], class: "Neutral",
      collectible: true
  },

{
      id: 9505,

      name: "Warrior's Arsenal",
      manaCost: 3,

      description: "Add 3 random Warrior cards to your hand.",
      rarity: "common",

      type: "spell",
      keywords: ["discover"],

      spellEffect: {
        type: "discover",

        value: 3,
      targetType: "none",

      discoveryClass: "warrior",
      discoveryCount: 3

       }
      , class: "Neutral"}
  collectible: true
];

// Tokens needed for sidequest rewards 
export const   sidequestSecondaryTokens: CardData[] = [,
   {
      id: 9601,

      name: "Dark Sprite",
      manaCost: 1,

      attack: 1,
      health: 1,

      description: "Deathrattle: Deal 2 damage to the enemy hero.",
      rarity: "common",

      type: "minion",
      keywords: ["deathrattle"],

      deathrattle: {
        type: "damage",

        value: 2,
      targetType: "enemy_hero"

       }
      , class: "Neutral"}
];

// Export all sidequest-related cards
export const   allSidequestCards: CardData[] = [,
   ...sidequestCards, 
  ...sidequestRewardTokens, 
  ...sidequestSecondaryTokens
];