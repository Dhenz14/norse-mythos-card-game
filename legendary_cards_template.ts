import { CardData } from '../types';

/**
 * Collection of legendary cards
 * Powerful unique cards with game-changing effects
 */
export const legendaryCards: CardData[] = [
  {
    id: 20003,
    name: "Baron Geddon",
    manaCost: 7,
    attack: 7,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "At the end of your turn, deal 2 damage to ALL other characters.",
    keywords: [],
    heroClass: "neutral",
    race: "elemental",
    collectible: true,
    class: "Neutral"
  },
  {
    id: 20005,
    name: "Grommash Hellscream",
    manaCost: 8,
    attack: 4,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Charge. Battlecry: If this minion is damaged, gain +6 Attack.",
    keywords: ["charge", "battlecry"],
    heroClass: "warrior",
    class: "Warrior",
    battlecry: {
      type: "buff",
      requiresTarget: false,
      targetType: "none",
      buffAttack: 6,
      buffHealth: 0,
      isBasedOnStats: true
    },
    collectible: true
  }
];

// Export the legendary cards
export default legendaryCards;