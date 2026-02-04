/**
 * Special effect neutral cards for Hearthstone clone
 * Cards with unique mechanics like conditional effects, transformations, etc.
 */
import { CardData } from '../types';

/**
 * Collection of neutral cards with special effects and unique mechanics
 */
export const specialEffectNeutrals: CardData[] = [{
        id: 32003,

        name: "Jeweled Scarab",
        manaCost: 2,

        attack: 1,
        health: 1,

        type: "minion",
        rarity: "common",

        description: "Battlecry: Discover a 3-Cost card.",
      keywords: ["battlecry", "discover"],
        heroClass: "neutral", class: "Neutral",

        race: "beast",
        battlecry: {
        type: "discover",
      value: 3, // Cost of cards to discover
        requiresTarget: false

         },
        collectible: true
 },

{
        id: 32004,

        name: "Kabal Courier",
        manaCost: 3,

        attack: 2,
        health: 2,

        type: "minion",
        rarity: "rare",

        description: "Battlecry: Discover a Mage, Priest, or Warlock card.",
      keywords: ["battlecry", "discover"],
        heroClass: "neutral", class: "Neutral",

        battlecry: {
        type: "discover_triclass",

        classes: ["mage", "priest", "warlock"],
        requiresTarget: false

         },
        collectible: true
 },

{
        id: 32005,

        name: "Youthful Brewmaster",
        manaCost: 2,

        attack: 3,
        health: 2,

        type: "minion",
        rarity: "common",

        description: "Battlecry: Return a friendly minion from the battlefield to your hand.",
        keywords: ["battlecry"],

        heroClass: "neutral", class: "Neutral",
        battlecry: {
        type: "return",


          requiresTarget: true,

        targetType: "friendly_minion"
    },
        collectible: true
 },

{
        id: 32006,

        name: "Ancient Brewmaster",
        manaCost: 4,

        attack: 5,
        health: 4,

        type: "minion",
        rarity: "common",

        description: "Battlecry: Return a friendly minion from the battlefield to your hand.",
        keywords: ["battlecry"],

        heroClass: "neutral", class: "Neutral",
        battlecry: {
        type: "return",


          requiresTarget: true,

        targetType: "friendly_minion"
    },
        collectible: true
 },

{
        id: 32007,

        name: "Elise the Trailblazer",
        manaCost: 5,

        attack: 5,
        health: 5,

        type: "minion",
        rarity: "legendary",

        description: "Battlecry: Shuffle a sealed Un'Goro pack into your deck.",
        keywords: ["battlecry"],

        heroClass: "neutral", class: "Neutral",
        battlecry: {
        type: "shuffle_special",
        cardName: "Un'Goro Pack",

        requiresTarget: false
    },
        collectible: true
 },

{
        id: 32011,

        name: "Dirty Rat",
        manaCost: 2,

        attack: 2,
        health: 6,

        type: "minion",
        rarity: "epic",

        description: "Taunt.   Battlecry: Your opponent summons a random minion from their hand.",
    keywords: ["taunt", "battlecry"],
        heroClass: "neutral", class: "Neutral",

        battlecry: {
        type: "opponent_summon_from_hand",

          requiresTarget: false
    },
        collectible: true
 },

{
        id: 32013,

        name: "Bomb Squad",
        manaCost: 5,

        attack: 2,
        health: 2,

        type: "minion",
        rarity: "rare",

        description: "Battlecry: Deal 5 damage to an enemy minion.   Deathrattle: Deal 5 damage to your hero.",
    keywords: ["battlecry", "deathrattle"],
        heroClass: "neutral", class: "Neutral",

        battlecry: {
        type: "damage",

        value: 5,
        requiresTarget: true,

        targetType: "enemy_minion"
    },
      deathrattle: {
        type: "damage",
        value: 5,

        targetType: "friendly_hero"
    }
 }];

// Already exported as a named export, no need for default export