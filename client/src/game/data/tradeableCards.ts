/**
 * Tradeable cards for Hearthstone clone
 * Tradeable cards can be swapped back into your deck for 1 mana to draw a new card
 */
import { CardData } from '../types';

export const tradeableCards: CardData[] = [
  {
    id: 12001,
    name: "Rustrot Viper",
    manaCost: 3,
    attack: 3,
    health: 4,
    description: "Tradeable. Battlecry: Destroy your opponent's weapon.",
    rarity: "rare",
    type: "minion",
    keywords: ["tradeable", "battlecry"],
    class: "Neutral",
    collectible: true,
    battlecry: {
      type: "transform", // This would destroy the opponent's weapon
      requiresTarget: false,
      targetType: "none"
    },
    tradeableInfo: {
      tradeCost: 1
    }
  },
  {
    id: 12002,
    name: "Heavy Plate",
    manaCost: 3,
    description: "Tradeable. Give a minion +3 Health and Taunt.",
    rarity: "common",
    type: "spell",
    keywords: ["tradeable"],
    class: "Neutral",
    collectible: true,
    spellEffect: {
      type: "buff",
      buffHealth: 3,
      targetType: "friendly_minion",
      requiresTarget: true
      // Taunt would be granted in game logic
    },
    tradeableInfo: {
      tradeCost: 1
    }
  },
  {
    id: 12003,
    name: "Entrapped Sorceress",
    manaCost: 3,
    attack: 3,
    health: 4,
    description: "Tradeable. Spell Damage +1",
    rarity: "rare",
    type: "minion",
    keywords: ["tradeable", "spell_damage"],
    class: "Neutral",
    collectible: true,
    tradeableInfo: {
      tradeCost: 1
    }
  },
  {
    id: 12004,
    name: "Guild Trader",
    manaCost: 2,
    attack: 2,
    health: 3,
    description: "Tradeable. Battlecry: Reduce the Cost of a random card in your hand by (2).",
    rarity: "common",
    type: "minion",
    keywords: ["tradeable", "battlecry"],
    class: "Neutral",
    collectible: true,
    battlecry: {
      type: "transform", // This would reduce cost in the game logic
      requiresTarget: false,
      targetType: "none"
    },
    tradeableInfo: {
      tradeCost: 1
    }
  },
  {
    id: 12005,
    name: "Stockades Guard",
    manaCost: 4,
    attack: 2,
    health: 6,
    description: "Tradeable. Taunt",
    rarity: "common",
    type: "minion",
    keywords: ["tradeable", "taunt"],
    class: "Neutral",
    collectible: true,
    tradeableInfo: {
      tradeCost: 1
    }
  }
];

export default tradeableCards;
