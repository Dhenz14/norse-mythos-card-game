/**
 * Highlander Cards Collection
 * 
 * This file contains the implementation of Highlander cards like Kazakus, Reno the Wanderer,
 * and other cards that require a deck with no duplicates to activate their effects.
 * 
 * Highlander cards have powerful effects but require deck-building restrictions: * - No duplicate cards in your deck,
 * - Named after the "There can be only one" rule from Highlander
 * - Introduced in the League of Explorers and expanded in Mean Streets of Gadgetzan
 */

import { CardData } from '../types';

// Core Highlander Cards
export const   coreHighlanderCards: CardData[] = [{

      type: "kazakus_potion",


        requiresTarget: false,

      targetType: "none",
      condition: "no_duplicates_in_deck"collectible: true, class: "Neutral" 

       },

{
      id: 70003,

      name: "Athena Inkweaver",
      manaCost: 7,

      attack: 5,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If your deck has no duplicates, the next spell you cast this turn costs (0).",
      keywords: ["battlecry"],

      heroClass: "mage", class: "Mage",
      battlecry: {
        type: "conditional_next_spell_costs_zero",


        requiresTarget: false,

      targetType: "none",
      condition: "no_duplicates_in_deck"

       }collectible: true
      },

{
      id: 70004,

      name: "Prometheus Chained",
      manaCost: 5,

      attack: 5,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If your deck has no duplicates, your Hero Power costs (0) this game.",
      keywords: ["battlecry"],

      heroClass: "priest", class: "Priest",
      battlecry: {
        type: "conditional_free_hero_power",


        requiresTarget: false,

      targetType: "none",
      condition: "no_duplicates_in_deck"

       }collectible: true
      },

{
      id: 70005,

      name: "Prometheus Unshackled",
      manaCost: 9,

      attack: 7,
      health: 9,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If your deck has no duplicates, summon all demons from your hand.",
      keywords: ["battlecry"],

      heroClass: "warlock", class: "Warlock",
      battlecry: {
        type: "conditional_summon_hand_demons",


        requiresTarget: false,

      targetType: "none",
      condition: "no_duplicates_in_deck"

       }
      }
  collectible: true];

// Mean Streets of Gadgetzan Kabal Potions (for Kazakus)
export const   kazakusPotions: CardData[] = [,
   // 1-Cost Potions
      {
  id: 70101,
  
  name: "Potion of the Gods (1-Cost)",
  manaCost: 1,
  
  type: "spell",
  rarity: "epic",
  
  description: "Custom potion created by Kazakus.",
  keywords: [],
  
  heroClass: "neutral", // Token card
  multiClassCard: ["mage", "priest", "warlock"]
  , class: "Neutral",
      collectible: false
  }
// 5-Cost Potions
      {
  id: 70105,
  
  name: "Potion of the Gods (5-Cost)",
  manaCost: 5,
  
  type: "spell",
  rarity: "epic",
  
  description: "Custom potion created by Kazakus.",
  keywords: [],
  
  heroClass: "neutral", // Token card
  multiClassCard: ["mage", "priest", "warlock"]
  , class: "Neutral",
      collectible: false
  }
// 10-Cost Potions
      {
  id: 70110,
  
  name: "Potion of the Gods (10-Cost)",
  manaCost: 10,
  
  type: "spell",
  rarity: "epic",
  
  description: "Custom potion created by Kazakus.",
  keywords: [],
  
  heroClass: "neutral", // Token card
  multiClassCard: ["mage", "priest", "warlock"]
  , class: "Neutral",
      collectible: false
  }
];

// Combine all Highlander cards
export const   highlanderCards: CardData[] = [,
   ...coreHighlanderCards,
  ...kazakusPotions
];

// Export the collection
export default highlanderCards;