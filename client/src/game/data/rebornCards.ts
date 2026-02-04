/**
 * Reborn cards for Hearthstone clone
 * Reborn is a keyword from the Saviors of Uldum expansion
 * When a minion with Reborn dies, it returns to life with 1 Health
 */
import { CardData } from '../types';

/**
 * Collection of cards with the Reborn mechanic
 * These minions return to life with 1 Health the first time they die
 */
export const   rebornCards: CardData[] = [{
      id: 19020,

      name: "Coldlight Seer",
      manaCost: 3,

      attack: 2,
      health: 3,

      type: "minion",
      rarity: "common",

      description: "Battlecry: Give your other Murlocs +2 Health.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      race: "naga",

                  battlecry: {
        type: "buff",

        buffAttack: 0,
      buffHealth: 2,

      requiresTarget: false,
      targetType: "none",

      cardType: "murloc"
    },
      collectible: true,
      class: "Neutral"
},
  {
  id: 19021,
  
  name: "Sea Sprite Caller",
  manaCost: 1,
  
  attack: 1,
  health: 2,
  
  type: "minion",
  rarity: "rare",
  
  description: "Whenever you summon a Murloc, gain +1 Attack.",
  keywords: [],
  
  heroClass: "neutral", race: "naga",
      class: "Neutral",
      collectible: true
  },
  {
  id: 19001,
  
  name: "Murmy",
  manaCost: 1,
  
  attack: 1,
  health: 1,
  
  type: "minion",
  rarity: "common",
  
  description: "Reborn",
  keywords: ["reborn"],
  
  heroClass: "neutral", race: "naga",
      class: "Neutral",
      collectible: true
  },
  {
      id: 19002,

      name: "Grandmummy",
      manaCost: 2,

      attack: 1,
      health: 2,

      type: "minion",
      rarity: "rare",

      description: "Reborn.   Deathrattle: Give a random friendly minion +1/+1.",
    keywords: ["reborn", "deathrattle"],
      heroClass: "priest",
      class: "Priest",

      deathrattle: {
        type: "buff",

        buffAttack: 1,
      buffHealth: 1,

      targetType: "all_friendly"
    },
      collectible: true
      },
  {
  id: 19003,
  
  name: "Temple Berserker",
  manaCost: 2,
  
  attack: 1,
  health: 2,
  
  type: "minion",
  rarity: "common",
  
  description: "Reborn. Has +2 Attack while damaged.",
  keywords: ["reborn"],
  
  heroClass: "warrior", // Enrage effect handled in game logic
  
  class: "Warrior",
      collectible: true
  },
  {
  id: 19004,
  
  name: "Ancestral Guardian",
  manaCost: 4,
  
  attack: 4,
  health: 2,
  
  type: "minion",
  rarity: "common",
  
  description: "Lifesteal, Reborn",
  keywords: ["lifesteal", "reborn"],
  heroClass: "paladin",
      class: "Paladin",
      collectible: true
  },
  {
  id: 19005,
  
  name: "Wrapped Golem",
  manaCost: 7,
  
  attack: 7,
  health: 5,
  
  type: "minion",
  rarity: "rare",
  
  description: "Reborn. At the end of your turn, summon a 1/1 Scarab with Taunt.",
  keywords: ["reborn"],
  
  heroClass: "neutral", // End of turn effect handled in game logic
  
  class: "Neutral",
      collectible: true
  },
  {
      id: 19006,

      name: "Kharj Sandtongue",
      manaCost: 3,

      attack: 2,
      health: 2,

      type: "minion",
      rarity: "legendary",

      description: "Reborn. Battlecry and   Deathrattle: Give a random friendly minion +3 Attack.",
    keywords: ["reborn", "battlecry", "deathrattle"],
      heroClass: "neutral",
      class: "Neutral",

                  battlecry: {
        type: "buff",

        buffAttack: 3,
      buffHealth: 0,

      targetType: "friendly_minion",
      requiresTarget: false,

      isRandom: true
    },
      deathrattle: {
        type: "buff",
      buffAttack: 3,

      buffHealth: 0,
      targetType: "all_friendly"

       }
    },
  {
  id: 19007,
  
  name: "Restless Mummy",
  manaCost: 4,
  
  attack: 3,
  health: 2,
  
  type: "minion",
  rarity: "common",
  
  description: "Rush, Reborn",
  keywords: ["rush", "reborn"],
  heroClass: "warrior",
      class: "Warrior",
      collectible: true
  },
  {
  id: 19008,
  
  name: "Bone Wraith",
  manaCost: 4,
  
  attack: 2,
  health: 5,
  
  type: "minion",
  rarity: "common",
  
  description: "Taunt, Reborn",
  keywords: ["taunt", "reborn"],
  heroClass: "neutral",
      class: "Neutral",
      collectible: true
  }
];

// Function to get a specific reborn card by ID
export function getRebornCardById(id: number): CardData | undefined {
  return rebornCards.find(card => card.id === id);
}

// Export the reborn cards
export default rebornCards;