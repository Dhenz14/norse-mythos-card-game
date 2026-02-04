/**
 * Magnetic cards for Hearthstone clone
 * Magnetic is a keyword from The Boomsday Project expansion
 * Magnetic allows a minion to be attached to a Mech, adding its stats and effects
 */
import { CardData } from '../types';

/**
 * Collection of cards with the Magnetic mechanic
 * These minions can be attached to a Mech, combining their stats and effects
 */
export const magneticCards: CardData[] = [
  {
    id: 20001,
    name: "Summon Microbots",
    type: "spell",
    manaCost: 2,
    rarity: "common",
    description: "Summon two 1/1 Microbots.",
    keywords: [],
    heroClass: "neutral",
    class: "Neutral",
    collectible: true,
    spellEffect: {
      type: "summon",
      summonCardId: 20002, // Microbot
      value: 2,
      targetType: "none"
    }
  },
  {
    id: 20002,
    name: "Microbot",
    manaCost: 1,
    attack: 1,
    health: 1,
    type: "minion",
    rarity: "common",
    description: "Summoned by Summon Microbots.",
    keywords: [],
    heroClass: "neutral", 
    race: "automaton", 
    class: "Neutral",
    collectible: true
  },
  {
    id: 20004,
    name: "Wargear",
    manaCost: 5,
    attack: 5,
    health: 5,
    type: "minion",
    rarity: "common",
    description: "Magnetic",
    keywords: ["magnetic"],
    heroClass: "neutral", 
    race: "automaton", 
    class: "Neutral",
    collectible: true
  },
  {
    id: 20005,
    name: "Skaterbot",
    manaCost: 1,
    attack: 1,
    health: 1,
    type: "minion",
    rarity: "common",
    description: "Magnetic, Rush",
    keywords: ["magnetic", "rush"],
    heroClass: "neutral", 
    race: "automaton", 
    class: "Neutral",
    collectible: true
  },
  {
    id: 20006,
    name: "Replicating Menace",
    manaCost: 4,
    attack: 3,
    health: 1,
    type: "minion",
    rarity: "rare",
    description: "Magnetic, Deathrattle: Summon three 1/1 Microbots.",
    keywords: ["magnetic", "deathrattle"],
    heroClass: "neutral", 
    class: "Neutral",
    race: "automaton",
    deathrattle: {
      type: "summon",
      summonCardId: 20002, // Microbot
      value: 3,
      targetType: "none"
    },
    collectible: true
  },
  {
    id: 20007,
    name: "Missile Launcher",
    manaCost: 6,
    attack: 4,
    health: 4,
    type: "minion",
    rarity: "rare",
    description: "Magnetic, At the end of your turn, deal 1 damage to all other characters.",
    keywords: ["magnetic"],
    heroClass: "neutral", 
    class: "Neutral",
    race: "automaton",
    effects: [
      {
        type: "end_of_turn",
        value: 1 // Damage value
      }
    ],
    collectible: true
  },
  {
    id: 20008,
    name: "Glow-Tron",
    manaCost: 1,
    attack: 1,
    health: 3,
    type: "minion",
    rarity: "common",
    description: "Magnetic",
    keywords: ["magnetic"],
    heroClass: "paladin", 
    race: "automaton", 
    class: "Paladin",
    collectible: true
  },
  {
    id: 20009,
    name: "Beryllium Nullifier",
    manaCost: 7,
    attack: 3,
    health: 8,
    type: "minion",
    rarity: "epic",
    description: "Magnetic, Can't be targeted by spells or Hero Powers.",
    keywords: ["magnetic", "elusive"],
    heroClass: "warrior", 
    race: "automaton", 
    class: "Warrior",
    collectible: true
  },
  {
    id: 20010,
    name: "Spider Bomb",
    manaCost: 3,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "rare",
    description: "Magnetic, Deathrattle: Deal 100 damage to a random enemy minion.",
    keywords: ["magnetic", "deathrattle"],
    heroClass: "hunter", 
    class: "Hunter",
    race: "automaton",
    deathrattle: {
      type: "damage",
      value: 100, // High damage to ensure destruction
      targetType: "random_enemy_minion"
    },
    collectible: true
  }
];

// Function to get a specific magnetic card by ID
export function getMagneticCardById(id: number): CardData | undefined {
  return magneticCards.find(card => card.id === id);
}

// Export the magnetic cards
export default magneticCards;