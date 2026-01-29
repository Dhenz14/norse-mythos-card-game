/**
 * Class-specific cards for Hearthstone clone
 * Each class has unique abilities and card synergies
 * 
 * IMPORTANT: This file is being migrated to use the Card Builder API
 * New cards should be added using the builder pattern in class-specific files (e.g., cardSets/hunterCards.ts)
 */
import { CardData } from '../types';
import warlockCards from './warlockCards';
import selfDamageCards from './selfDamageCards';
import druidCards from './druidCards';
import rogueCards from './rogueCards';
// Import the register functions from the card builder modules
import { registerHunterCards } from './cardSets/hunterCards';
import { registerPaladinCards } from './cardSets/paladinCards';
import { registerRogueCards as registerNewRogueCards } from './cardSets/rogueCards';
import { registerPriestCards } from './cardSets/priestCards';
import { registerShamanCards } from './cardSets/shamanCards';
import { registerWarriorCards } from './cardSets/warriorCards';

// LEGACY HUNTER CLASS CARDS - Being migrated to Card Builder pattern
export const hunterCards: CardData[] = [
  {
      id: 7001,

      name: "Unleash the Bound-Beast",
      manaCost: 3,

      description: "For each enemy minion, summon a 1/1 Howling Scavenger of Hel with Charge.",
      rarity: "common",

      type: "spell",
      keywords: [],

      spellEffect: {
        type: "summon",

        targetType: "none", 
      summonCardId: 7501 // Scavenger token
       },
      collectible: true,
      class: "Hunter"
},
  {
  id: 7002,
  
  name: "Great-Beast's Call",
  manaCost: 3,
  
  description: "Summon a random Great-Beast companion.",
  rarity: "common",
  type: "spell",
  
  keywords: [],
    spellEffect: {
  type: "summon",
  value: 1,
  
  targetType: "none",
  // Will randomly select from companion tokens
  summonCardId: 7003
  
  
  },
      class: "Hunter",
      collectible: true
  },
  {
  id: 7003,
  
  name: "Eagle-Eye Longbow",
  manaCost: 3,
  
  attack: 3,
  durability: 2,
  
  description: "Whenever a friendly Secret is revealed, gain +1 Durability.",
  rarity: "rare",
  
  type: "weapon",
  keywords: [],
      class: "Hunter",
      collectible: true
  },
  {
  id: 7005,
  
  name: "Lethal Precision",
  manaCost: 3,
  
  description: "Destroy a random enemy minion.",
  rarity: "common",
  
  type: "spell",
  keywords: [],
  
    spellEffect: {
  type: "damage",
  
  targetType: "enemy_minion",
  value: 99999, // Effectively destruction
  
  },
      class: "Hunter",
      collectible: true
  }

];

// PALADIN CLASS CARDS
export const paladinCards: CardData[] = [
  {
      id: 8002,

      name: "Sacred Ground",
      manaCost: 4,

      description: "Deal 2 damage to all enemies.",
      rarity: "common",

      type: "spell",
      keywords: [],

      spellEffect: {
        type: "aoe_damage",

        value: 2,
      targetType: "all_enemy_minions"

       },
      class: "Paladin",
      collectible: true},
  {
  id: 8003,
  
  name: "Sun-Forged Blade",
  manaCost: 4,
  
  attack: 4,
  durability: 2,
  
  description: "Whenever your hero attacks, restore 2 Health to it.",
  rarity: "common",
  
  type: "weapon",
  keywords: [],
      class: "Paladin",
      collectible: true
  },
  {
      id: 8004,

      name: "Sovereign's Blessing",
      manaCost: 4,

      description: "Give a minion +4/+4.",
      rarity: "common",

      type: "spell",
      keywords: [],

      spellEffect: {
        type: "buff",

        buffAttack: 4,
      buffHealth: 4,

      requiresTarget: true,
      targetType: "friendly_minion"

       },
      class: "Paladin",
      collectible: true},
  {
      id: 8005,

      name: "Primal Equity",
      manaCost: 2,

      description: "Change the Health of ALL minions to 1.",
      rarity: "rare",

      type: "spell",
      keywords: [],

      spellEffect: {
        type: "buff",

        targetType: "all_minions"
      // Special handling required for this effect
    },
      class: "Paladin",
      collectible: true}

];

// TOKEN CARDS FOR CLASS ABILITIES
export const classTokens: CardData[] = [
  {
  id: 7502,
  
  name: "Howling Scavenger of Hel",
  manaCost: 2,
  
  attack: 2,
  health: 2,
  
  description: "Summoned by Nemean Lion's deathrattle.",
  rarity: "common",
  
  type: "minion",
  keywords: [],
      class: "Hunter",
      collectible: true
  },
  {
  id: 7503,
  
  name: "Ironwood Grizzly",
  manaCost: 3,
  
  attack: 4,
  health: 4,
  
  description: "Taunt. Summoned by Great-Beast's Call.",
  rarity: "common",
  
  type: "minion",
  keywords: ["taunt"],
      class: "Hunter",
      collectible: true
  },
  {
  id: 7504,
  
  name: "Muspelheim Razorback",
  manaCost: 3,
  
  attack: 4,
  health: 2,
  
  description: "Charge. Summoned by Great-Beast's Call.",
  rarity: "common",
  
  type: "minion",
  keywords: ["charge"],
      class: "Hunter",
      collectible: true
  },
  {
  id: 7505,
  
  name: "Storm-Winged Stallion",
  manaCost: 3,
  
  attack: 2,
  health: 4,
  
  description: "Your other minions have +1 Attack. Summoned by Great-Beast's Call.",
  rarity: "common",
  
  type: "minion",
  keywords: [],
      class: "Hunter",
      collectible: true
  },
// Paladin tokens
  {
  id: 8501,
  
  name: "World-Render's Edge",
  manaCost: 5,
  
  attack: 5,
  durability: 3,
  
  description: "Legendary weapon wielded by the champion of justice.",
  rarity: "legendary",
  
  type: "weapon",
  keywords: [],
      class: "Paladin",
      collectible: true
  },
  {
  id: 8502,
  
  name: "Valhalla Aspirant",
  manaCost: 1,
  
  attack: 1,
  health: 1,
  
  description: "Summoned by the Hero Power.",
  rarity: "common",
  
  type: "minion",
  keywords: [],
      class: "Paladin",
      collectible: false
  }

];

// Export all class cards
export const allClassCards: CardData[] = [
  ...hunterCards, 
  ...paladinCards, 
  ...warlockCards, 
  ...selfDamageCards, 
  ...druidCards,
  ...rogueCards,
  ...classTokens
];