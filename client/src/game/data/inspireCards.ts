/**
 * Inspire cards for Hearthstone clone
 * Inspire effects trigger whenever you use your Hero Power
 */
import { CardData } from '../types';

export const inspireCards: CardData[] = [
  {
    id: 13001,
    name: "Tournament Medic",
    manaCost: 4,
    attack: 1,
    health: 8,
    description: "Inspire: Restore 2 Health to your hero.",
    rarity: "common",
    type: "minion",
    keywords: ["inspire"],
    class: "Neutral",
    collectible: true,
    inspireEffect: {
      type: "heal",
      value: 2,
      targetType: "friendly_hero",
      targetRequired: false
    }
  },
  {
    id: 13002,
    name: "Hanuman's Champion",
    manaCost: 5,
    attack: 4,
    health: 3,
    description: "Inspire: Give your other minions +1/+1.",
    rarity: "common",
    type: "minion",
    keywords: ["inspire"],
    class: "Neutral",
    collectible: true,
    inspireEffect: {
      type: "buff",
      buffAttack: 1,
      buffHealth: 1,
      targetType: "all_friendly_minions",
      targetRequired: false
    }
  },
  {
    id: 13003,
    name: "Kodorider",
    manaCost: 6,
    attack: 3,
    health: 5,
    description: "Inspire: Summon a 3/5 War Kodo.",
    rarity: "epic",
    type: "minion",
    keywords: ["inspire"],
    class: "Neutral",
    collectible: true,
    inspireEffect: {
      type: "summon",
      summonCardId: 13501, // ID of War Kodo token
      targetRequired: false
    }
  },
  {
    id: 13004,
    name: "Berserker Combatant",
    manaCost: 4,
    attack: 5,
    health: 4,
    description: "Inspire: Give your hero +2 Attack this turn.",
    rarity: "rare",
    type: "minion",
    keywords: ["inspire"],
    class: "Neutral",
    collectible: true,
    inspireEffect: {
      type: "buff",
      buffAttack: 2,
      targetType: "friendly_hero",
      targetRequired: false
    }
  },
  {
    id: 13005,
    name: "Nexus-Champion Saraad",
    manaCost: 5,
    attack: 4,
    health: 5,
    description: "Inspire: Add a random spell to your hand.",
    rarity: "legendary",
    type: "minion",
    keywords: ["inspire"],
    class: "Neutral",
    collectible: true,
    inspireEffect: {
      type: "draw", // Special drawing from outside the deck
      value: 1,
      targetRequired: false
    }
  }
];

// Tokens for inspire effects
export const inspireTokens: CardData[] = [
  {
    id: 13501,
    name: "War Kodo",
    manaCost: 5,
    attack: 3,
    health: 5,
    description: "Summoned by Kodorider's Inspire effect.",
    rarity: "common",
    type: "minion",
    keywords: [], 
    class: "Neutral",
    collectible: false
  }
];

// Export all inspire-related cards
export const allInspireCards: CardData[] = [...inspireCards, ...inspireTokens];

export default allInspireCards;