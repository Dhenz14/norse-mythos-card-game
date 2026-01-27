/**
 * Corrupt mechanic cards for Hearthstone clone
 * Corrupt cards transform when you play a higher-cost card
 */
import { CardData } from '../types';

// Base corrupt cards with their corrupted versions
export const corruptCards: CardData[] = [
  // Paladin
  {
    id: 20001,
    name: "Redscale Dragontamer",
    manaCost: 2,
    attack: 1,
    health: 3,
    description: "Corrupt: Gain +1/+1 and Divine Shield.",
    rarity: "rare",
    type: "minion",
    keywords: ["corrupt"],
    corruptState: {
      isCorruptible: true,
      isCorrupted: false,
      corruptedVersion: {
        id: 20001.1, // Using decimal to indicate corrupted version
        name: "Redscale Dragontamer",
        manaCost: 2,
        attack: 2,
        health: 4,
        description: "Corrupted",
        rarity: "rare",
        type: "minion",
        keywords: ["divine_shield"]
      }
    },
    collectible: true,
    class: "Neutral"
  },
  // Warlock
  {
    id: 20002,
    name: "Altar of Fire",
    manaCost: 1,
    description: "Remove the top 3 cards from each deck. Corrupt: Remove 3 more.",
    rarity: "rare",
    type: "spell",
    keywords: ["corrupt"],
    spellEffect: {
      type: "transform", // Special effect to burn cards
      value: 3,
      targetType: "none",
      requiresTarget: false
    },
    collectible: true,
    class: "Neutral",
    corruptState: {
      isCorruptible: true,
      isCorrupted: false,
      corruptedVersion: {
        id: 20002.1,
        name: "Altar of Fire",
        manaCost: 1,
        description: "Corrupted. Remove the top 6 cards from each deck.",
        rarity: "rare",
        type: "spell",
        keywords: [],
        spellEffect: {
          type: "transform", // Special effect to burn cards
          value: 6,
          targetType: "none",
          requiresTarget: false
        }
      }
    }
  },
  // Mage
  {
    id: 20003,
    name: "Imprisoned Phoenix",
    manaCost: 2,
    attack: 2,
    health: 2,
    description: "Dormant for 2 turns. Spell Damage +2. Corrupt: Spell Damage +3.",
    rarity: "rare",
    type: "minion",
    keywords: ["dormant", "corrupt"],
    dormantTurns: 2,
    spellPower: 2,
    corruptState: {
      isCorruptible: true,
      isCorrupted: false,
      corruptedVersion: {
        id: 20003.1,
        name: "Imprisoned Phoenix",
        manaCost: 2,
        attack: 2,
        health: 2,
        description: "Corrupted. Dormant for 2 turns. Spell Damage +3.",
        rarity: "rare",
        type: "minion",
        keywords: ["dormant"],
        dormantTurns: 2,
        spellPower: 3
      }
    },
    collectible: true,
    class: "Neutral"
  },
  // Druid
  {
    id: 20005,
    name: "Dreaming Drake",
    manaCost: 3,
    attack: 3,
    health: 4,
    description: "Taunt. Corrupt: +2/+2.",
    rarity: "common",
    type: "minion",
    keywords: ["taunt", "corrupt"],
    corruptState: {
      isCorruptible: true,
      isCorrupted: false,
      corruptedVersion: {
        id: 20005.1,
        name: "Dreaming Drake",
        manaCost: 3,
        attack: 5,
        health: 6,
        description: "Corrupted. Taunt.",
        rarity: "common",
        type: "minion",
        keywords: ["taunt"]
      }
    },
    collectible: true,
    class: "Neutral"
  },
  // Rogue
  {
    id: 20006,
    name: "Nitroboost Poison",
    manaCost: 1,
    description: "Give a minion +2 Attack. Corrupt: And your weapon.",
    rarity: "common",
    type: "spell",
    keywords: ["corrupt"],
    spellEffect: {
      type: "buff",
      buffAttack: 2,
      targetType: "friendly_minion",
      requiresTarget: true
    },
    collectible: true,
    class: "Neutral",
    corruptState: {
      isCorruptible: true,
      isCorrupted: false,
      corruptedVersion: {
        id: 20006.1,
        name: "Nitroboost Poison",
        manaCost: 1,
        description: "Corrupted. Give a minion and your weapon +2 Attack.",
        rarity: "common",
        type: "spell",
        keywords: [],
        spellEffect: {
          type: "buff",
          buffAttack: 2,
          targetType: "friendly_minion_and_weapon",
          requiresTarget: true
        }
      }
    }
  },
  // Hunter
  {
    id: 20007,
    name: "Felfire Deadeye",
    manaCost: 2,
    attack: 2,
    health: 3,
    description: "Your Hero Power costs (1) less. Corrupt: And costs (0) on your next turn.",
    rarity: "rare",
    type: "minion",
    keywords: ["corrupt"],
    corruptState: {
      isCorruptible: true,
      isCorrupted: false,
      corruptedVersion: {
        id: 20007.1,
        name: "Felfire Deadeye",
        manaCost: 2,
        attack: 2,
        health: 3,
        description: "Corrupted. Your Hero Power costs (1) less and costs (0) on your next turn.",
        rarity: "rare",
        type: "minion",
        keywords: []
        // Special effect for hero power cost reduction handled in game logic
      }
    },
    collectible: true,
    class: "Neutral"
  },
  // Warrior
  {
    id: 20010,
    name: "Sword Eater",
    manaCost: 4,
    attack: 2,
    health: 5,
    description: "Taunt. Battlecry: Equip a 3/2 Sword. Corrupt: A 5/2 Sword.",
    rarity: "rare",
    type: "minion",
    keywords: ["taunt", "battlecry", "corrupt"],
    battlecry: {
      type: "summon",
      summonCardId: 20011, // ID of the 3/2 Sword
      targetType: "none",
      requiresTarget: false
    },
    corruptState: {
      isCorruptible: true,
      isCorrupted: false,
      corruptedVersion: {
        id: 20010.1,
        name: "Sword Eater",
        manaCost: 4,
        attack: 2,
        health: 5,
        description: "Corrupted. Taunt. Battlecry: Equip a 5/2 Sword.",
        rarity: "rare",
        type: "minion",
        keywords: ["taunt", "battlecry"],
        battlecry: {
          type: "summon",
          summonCardId: 20012, // ID of the 5/2 Sword
          targetType: "none",
          requiresTarget: false
        }
      }
    },
    collectible: true,
    class: "Neutral"
  },
  // Weapon for Sword Eater
  {
    id: 20011,
    name: "Thornmantle Sword",
    manaCost: 3,
    attack: 3,
    durability: 2,
    description: "Summoned by Sword Eater.",
    rarity: "common",
    type: "weapon",
    keywords: [],
    class: "Neutral",
    collectible: false
  }
];

// Export all corrupt cards
export default corruptCards;