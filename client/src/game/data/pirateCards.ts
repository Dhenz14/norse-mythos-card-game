/**
 * Pirate synergy cards for Norse mythology TCG
 * Includes cards that interact with the Pirate tribe
 */
import { CardData } from '../types';

export const pirateCards: CardData[] = [
  {
    id: 80003,
    name: "Ægir's Marauder",
    manaCost: 2,
    attack: 2,
    health: 3,
    description: "Battlecry: Gain Attack equal to the Attack of your weapon.",
    type: "minion",
    rarity: "common",
    heroClass: "neutral",
    class: "Neutral",
    tribe: "pirate",
    keywords: ["battlecry"],
    battlecry: {
      type: "weapon_attack_buff",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  {
    id: 80004,
    name: "Ægir's Corsair",
    manaCost: 1,
    attack: 1,
    health: 2,
    description: "Battlecry: Remove 1 Durability from your opponent's weapon.",
    type: "minion",
    rarity: "rare",
    heroClass: "neutral",
    class: "Neutral",
    tribe: "pirate",
    keywords: ["battlecry"],
    battlecry: {
      type: "weapon_durability_damage",
      value: 1,
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  }
];

// Export for use in the game
export default pirateCards;
