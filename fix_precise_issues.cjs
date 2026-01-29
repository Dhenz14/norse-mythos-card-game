/**
 * Precise Fixes for Specific Card Files
 * 
 * This script makes precise changes to fix remaining issues in:
 * 1. oldGodsCards.ts - completely rewrite the file to fix structural issues
 * 2. coldlightTestData.ts - fix semicolons and commas
 */

const fs = require('fs');
const path = require('path');

// Utility functions
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Fix oldGodsCards.ts with complete rewrite
async function fixOldGodsCards() {
  const filePath = './client/src/game/data/oldGodsCards.ts';
  
  try {
    log(`Completely rewriting ${path.basename(filePath)}...`);
    
    // Make a backup
    const originalContent = await fs.promises.readFile(filePath, 'utf8');
    await fs.promises.writeFile(`${filePath}.backup-${Date.now()}`, originalContent, 'utf8');
    
    // Create a completely rewritten version that maintains all card data but fixes structure
    const fixedContent = `/**
 * Old Gods Cards Collection
 * 
 * This file contains the implementation of C'Thun and the other Old Gods from the
 * Whispers of the Old Gods expansion, along with their related support cards.
 * 
 * The Old Gods are powerful legendary minions with unique effects: 
 * - C'Thun: Grows stronger throughout the game and deals its damage when played
 * - N'Zoth: Resurrects friendly Deathrattle minions that died this game
 * - Yogg-Saron: Casts random spells for each spell you've cast this game
 * - Y'Shaarj: Summons a minion from your deck at the end of your turn
 */

import { CardData } from '../types';

// C'Thun and related cards
export const cthunCards: CardData[] = [
  {
    id: 60001,
    name: "C'Thun",
    manaCost: 10,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal damage equal to this minion's Attack randomly split among all enemies.",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "cthun_damage",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  {
    id: 60002,
    name: "Beckoner of Evil",
    manaCost: 2,
    attack: 2,
    health: 3,
    type: "minion",
    rarity: "common",
    description: "Battlecry: Give your C'Thun +2/+2 (wherever it is).",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "buff_cthun",
      requiresTarget: false,
      targetType: "none",
      buffAttack: 2,
      buffHealth: 2
    },
    collectible: true
  },
  {
    id: 60004,
    name: "Disciple of C'Thun",
    manaCost: 3,
    attack: 2,
    health: 1,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: Deal 2 damage. Give your C'Thun +2/+2 (wherever it is).",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "cthun_cultist_damage",
      requiresTarget: true,
      targetType: "any",
      value: 2,
      buffCthun: true,
      buffAttack: 2,
      buffHealth: 2
    },
    collectible: true
  },
  {
    id: 60005,
    name: "Twilight Elder",
    manaCost: 3,
    attack: 3,
    health: 4,
    type: "minion",
    rarity: "common",
    description: "At the end of your turn, give your C'Thun +1/+1 (wherever it is).",
    keywords: [],
    heroClass: "neutral",
    class: "Neutral",
    effects: [
      {
        type: "end_of_turn",
        value: 1, // Used as a placeholder, actual logic handled in oldGodsUtils
        endOfTurnEffect: "buff_cthun"
      }
    ],
    collectible: true
  },
  {
    id: 60006,
    name: "Hooded Acolyte",
    manaCost: 4,
    attack: 3,
    health: 6,
    type: "minion",
    rarity: "common",
    description: "Whenever a character is healed, give your C'Thun +1/+1 (wherever it is).",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    onHealEffect: {
      type: "buff_cthun",
      buffAttack: 1,
      buffHealth: 1
    },
    collectible: true
  },
  {
    id: 60007,
    name: "Klaxxi Amber-Weaver",
    manaCost: 4,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: If your C'Thun has at least 10 Attack, gain +5 Health.",
    keywords: ["battlecry"],
    heroClass: "druid",
    class: "Druid",
    battlecry: {
      type: "conditional_self_buff",
      requiresTarget: false,
      targetType: "none",
      condition: "cthun_attack_10",
      buffHealth: 5
    },
    collectible: true
  },
  {
    id: 60008,
    name: "Ancient Shieldbearer",
    manaCost: 7,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: If your C'Thun has at least 10 Attack, gain 10 Armor.",
    keywords: ["battlecry"],
    heroClass: "warrior",
    class: "Warrior",
    battlecry: {
      type: "conditional_armor",
      requiresTarget: false,
      targetType: "none",
      condition: "cthun_attack_10",
      armorGain: 10
    },
    collectible: true
  },
  {
    id: 60010,
    name: "Emperor Vek'nilash",
    manaCost: 7,
    attack: 4,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Taunt",
    keywords: ["taunt"],
    heroClass: "neutral", // Token card summoned by Twin Emperor Vek'lor
    class: "Neutral",
    collectible: false
  }
];

// Other Old Gods
export const otherOldGods: CardData[] = [
  // N'Zoth, the Corruptor
  {
    id: 60101,
    name: "N'Zoth, the Corruptor",
    manaCost: 10,
    attack: 5,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Summon your Deathrattle minions that died this game.",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "resurrect_deathrattle",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  // Yogg-Saron, Hope's End
  {
    id: 60102,
    name: "Yogg-Saron, Hope's End",
    manaCost: 10,
    attack: 7,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Cast a random spell for each spell you've cast this game (targets chosen randomly).",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "yogg_saron",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  // Y'Shaarj, Rage Unbound
  {
    id: 60103,
    name: "Y'Shaarj, Rage Unbound",
    manaCost: 10,
    attack: 10,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "At the end of your turn, summon a minion from your deck.",
    keywords: [],
    heroClass: "neutral",
    class: "Neutral",
    effects: [
      {
        type: "end_of_turn",
        value: 1, // Placeholder, actual logic handled in oldGodsUtils
        endOfTurnEffect: "summon_from_deck"
      }
    ],
    collectible: true
  }
];

// Combine all Old Gods cards into one collection
export const oldGodsCards: CardData[] = [
  ...cthunCards,
  ...otherOldGods
];

// Export the collection
export default oldGodsCards;`;
    
    // Write the fixed content
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log(`Successfully rewrote ${path.basename(filePath)} with fixed structure`);
    return { filePath, success: true };
  } catch (error) {
    log(`Error fixing ${path.basename(filePath)}: ${error.message}`, 'error');
    return { filePath, success: false, error: error.message };
  }
}

// Fix coldlightTestData.ts
async function fixColdlightTestData() {
  const filePath = './client/src/game/data/coldlightTestData.ts';
  
  try {
    log(`Rewriting ${path.basename(filePath)}...`);
    
    // Make a backup
    const originalContent = await fs.promises.readFile(filePath, 'utf8');
    await fs.promises.writeFile(`${filePath}.backup-${Date.now()}`, originalContent, 'utf8');
    
    // Create a fixed version with proper structure
    const fixedContent = `import { CardData } from '../types';

// Define Coldlight Seer card with a buff_tribe battlecry effect
export const coldlightSeer: CardData = {
  id: 91001,
  name: "Coldlight Seer",
  description: "Battlecry: Give ALL your other Murlocs +2 Health.",
  flavorText: "The Coldlight murlocs live in the darkest depths of the sea, and have developed the ability to see using phosphorescent light.",
  type: "minion",
  rarity: "rare",
  manaCost: 3,
  attack: 2,
  health: 3,
  race: "Murloc",
  battlecry: {
    type: "buff_tribe",
    tribe: "Murloc",
    buffs: {
      health: 2
    },
    targetType: "friendly_minion"
  },
  class: "Neutral",
  collectible: true
};

// Define a few murloc minions to use with Coldlight Seer
export const murlocTidehunter: CardData = {
  id: 91002,
  name: "Murloc Tidehunter",
  description: "Battlecry: Summon a 1/1 Murloc Scout.",
  flavorText: "He's tried to get his Murloc Scout to wear pants, but the scout insists that he 'likes the freedom'.",
  type: "minion",
  rarity: "common",
  manaCost: 2,
  attack: 2,
  health: 1,
  race: "Murloc",
  class: "Neutral",
  collectible: true
};

export const murlocScout: CardData = {
  id: 91003,
  name: "Murloc Scout",
  description: "",
  type: "minion",
  rarity: "common",
  manaCost: 1,
  attack: 1,
  health: 1,
  race: "Murloc",
  class: "Neutral",
  collectible: false
};

export const bluegillWarrior: CardData = {
  id: 91004,
  name: "Bluegill Warrior",
  description: "Charge",
  flavorText: "He's from the tropical region of Stranglethorn Vale (He's a tourist).",
  type: "minion",
  rarity: "common",
  manaCost: 2,
  attack: 2,
  health: 1,
  race: "Murloc",
  keywords: ["charge"],
  class: "Neutral",
  collectible: true
};

// Non-murloc minion to test tribe filtering
export const riverCrocolisk: CardData = {
  id: 91005,
  name: "River Crocolisk",
  description: "",
  flavorText: "Floated down the river eating gnomes, but mostly just rocks and wood.",
  type: "minion",
  rarity: "common",
  manaCost: 2,
  attack: 2,
  health: 3,
  race: "Beast",
  class: "Neutral",
  collectible: true
};

// Export all test cards
export const testCards = [
  coldlightSeer, 
  murlocTidehunter, 
  murlocScout, 
  bluegillWarrior,
  riverCrocolisk
];`;
    
    // Write the fixed content
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log(`Successfully rewrote ${path.basename(filePath)} with fixed structure`);
    return { filePath, success: true };
  } catch (error) {
    log(`Error fixing ${path.basename(filePath)}: ${error.message}`, 'error');
    return { filePath, success: false, error: error.message };
  }
}

// Main function
async function main() {
  try {
    log('Applying precise fixes to the remaining problematic files...');
    
    // Fix each file
    const oldGodsResult = await fixOldGodsCards();
    const coldlightResult = await fixColdlightTestData();
    
    // Print summary
    log('\nSummary:');
    log(`oldGodsCards.ts: ${oldGodsResult.success ? 'SUCCESS' : 'FAILED - ' + oldGodsResult.error}`);
    log(`coldlightTestData.ts: ${coldlightResult.success ? 'SUCCESS' : 'FAILED - ' + coldlightResult.error}`);
    
    return { success: true };
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the main function
main();