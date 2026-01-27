/**
 * Recruit cards for Hearthstone clone
 * Recruit mechanic pulls a minion directly from the deck into the battlefield
 */
import { CardData } from '../types';

export const recruitCards: CardData[] = [
  {
      id: 18001,

      name: "Silver Vanguard",
      manaCost: 7,

      attack: 5,
      health: 4,

      description: "Deathrattle: Recruit an 8-Cost minion.",
      rarity: "common",

      type: "minion",
      keywords: ["deathrattle"],

      deathrattle: {
        type: "summon",

        targetType: "none",
      // The actual summoning would filter for 8-cost minions in the game logic
        summonCardId: 18002

         },
      collectible: true,
      class: "Neutral"
},
  {
  id: 18002,
  
  name: "Gather Your Party",
  manaCost: 6,
  
  description: "Recruit a minion.",
  rarity: "rare",
  
  type: "spell",
  keywords: ["recruit"],
  
    spellEffect: {
  type: "summon",
  
  targetType: "none",
  requiresTarget: false,
  
  // The actual summoning would pull random minion from deck in game logic
  summonCardId: 18003,
  
  value: 1
  
  },
      class: "Neutral",
      collectible: true
  },
  {
  id: 18004,
  
  name: "Guild Recruiter",
  manaCost: 5,
  
  attack: 2,
  health: 4,
  
  description: "Battlecry: Recruit a minion that costs (4) or less.",
  rarity: "common",
  
  type: "minion",
  keywords: ["battlecry", "recruit"],
                battlecry: {
  type: "summon",
  
  
  requiresTarget: false,
  
  targetType: "none",
  // The actual summoning would filter for minions costing 4 or less
  summonCardId: 18005
  
  
  },
      collectible: true,
  class: "Neutral"
  },
  {
  id: 18005,
  
  name: "Oaken Summons",
  manaCost: 4,
  
  description: "Gain 6 Armor. Recruit a minion that costs (4) or less.",
  rarity: "common",
  
  type: "spell",
  keywords: ["recruit"],
  
    spellEffect: {
  type: "heal", // Using heal effect for gain armor (will be handled specially)
  value: 6,
  
  targetType: "friendly_hero",
  requiresTarget: false
  
  // The recruit portion would be handled in game logic separately
  
  },
      class: "Neutral",
      collectible: true
  },
  {
  id: 18006,
  
  name: "Possessed Lackey",
  manaCost: 6,
  
  attack: 2,
  health: 2,
  
  description: "Deathrattle: Recruit a Demon.",
  rarity: "rare",
  
  type: "minion",
  keywords: ["deathrattle", "recruit"],
    deathrattle: {
  type: "summon",
  targetType: "none",
  
  // Would filter for Demon minions in game logic
  summonCardId: 18007
  
  
  },
      collectible: true,
  class: "Neutral"
  },
  {
  id: 18007,
  
  name: "Call to Arms",
  manaCost: 5,
  
  description: "Recruit 3 minions that cost (2) or less.",
  rarity: "epic",
  
  type: "spell",
  keywords: ["recruit"],
  
    spellEffect: {
  type: "summon",
  
  targetType: "none",
  requiresTarget: false,
  
  // Would summon 3 minions costing 2 or less
  summonCardId: 18008,
  
  value: 1
  
  },
      class: "Neutral",
      collectible: true
  },
  {
  id: 18008,
  
  name: "To My Side!",
  manaCost: 6,
  
  description: "Summon a Beast of Valhalla, or 2 if your deck has no minions.",
  rarity: "epic",
  
  type: "spell",
  keywords: ["recruit"],
  
    spellEffect: {
  type: "summon",
  
  targetType: "none",
  requiresTarget: false,
  
  summonCardId: 18009, // Beast of Valhalla token
  // The conditional second summon would be handled in game logic
  value: 1
  
  
  },
      class: "Neutral",
      collectible: true
  }
];

export default recruitCards;