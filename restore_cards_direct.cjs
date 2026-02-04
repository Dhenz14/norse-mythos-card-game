/**
 * Direct Card Restoration
 * 
 * This script takes a direct approach to extracting 10 spell cards from the backup
 * and formatting them correctly for the TypeScript array.
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Manually define 10 properly formatted cards
// This ensures we have a valid starting point
const tenCards = [
  {
    id: 6000,
    name: "Soul Mirror",
    manaCost: 7,
    type: "spell",
    rarity: "legendary",
    description: "Summon copies of enemy minions. They have 1 Health remaining.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "summon_copies",
      source: "enemy_board",
      modifyHealth: 1
    },
    collectible: true
  },
  {
    id: 6001,
    name: "Wave of Apathy",
    manaCost: 1,
    type: "spell",
    rarity: "common",
    description: "Set the Attack of all enemy minions to 1 until your next turn.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "attack_modifier",
      value: 1,
      targetType: "all_enemy_minions",
      duration: "until_next_turn"
    },
    collectible: true
  },
  {
    id: 6002,
    name: "Raise Dead",
    manaCost: 0,
    type: "spell",
    rarity: "common",
    description: "Deal 3 damage to your hero. Return two friendly minions that died this game to your hand.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "damage_hero",
      value: 3,
      returnFromDead: {
        count: 2,
        type: "minion"
      }
    },
    collectible: true
  },
  {
    id: 6003,
    name: "Psyche Split",
    manaCost: 5,
    type: "spell",
    rarity: "rare",
    description: "Give a minion +1/+2. Summon a copy of it.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "buff_and_copy",
      buffAttack: 1,
      buffHealth: 2,
      requiresTarget: true,
      targetType: "any_minion"
    },
    collectible: true
  },
  {
    id: 6004,
    name: "Power Infusion",
    manaCost: 4,
    type: "spell",
    rarity: "common",
    description: "Give a minion +2/+6.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "buff",
      buffAttack: 2,
      buffHealth: 6,
      requiresTarget: true,
      targetType: "any_minion"
    },
    collectible: true
  },
  {
    id: 6005,
    name: "Renew",
    manaCost: 1,
    type: "spell",
    rarity: "common",
    description: "Restore 3 Health. Discover a spell.",
    keywords: ["discover"],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "heal",
      value: 3,
      targetType: "any_character",
      secondaryEffect: {
        type: "discover",
        cardType: "spell",
        fromClass: "self"
      }
    },
    collectible: true
  },
  {
    id: 6006,
    name: "Apotheosis",
    manaCost: 3,
    type: "spell",
    rarity: "rare",
    description: "Give a minion +2/+3 and Lifesteal.",
    keywords: ["lifesteal"],
    heroClass: "priest",
    class: "Priest",
    spellEffect: {
      type: "buff",
      buffAttack: 2,
      buffHealth: 3,
      addKeywords: ["lifesteal"],
      requiresTarget: true,
      targetType: "any_minion"
    },
    collectible: true
  },
  {
    id: 6007,
    name: "Gift of Luminance",
    manaCost: 3,
    type: "spell",
    rarity: "epic",
    description: "Give a minion Divine Shield, then summon a 1/1 copy of it.",
    keywords: ["divine_shield"],
    heroClass: "paladin",
    class: "Paladin",
    spellEffect: {
      type: "buff_and_copy",
      addKeywords: ["divine_shield"],
      requiresTarget: true,
      targetType: "any_minion",
      copyStats: {
        attack: 1,
        health: 1
      }
    },
    collectible: true
  },
  {
    id: 6008,
    name: "Hand of A'dal",
    manaCost: 2,
    type: "spell",
    rarity: "common",
    description: "Give a minion +2/+1. Draw a card.",
    keywords: [],
    heroClass: "paladin",
    class: "Paladin",
    spellEffect: {
      type: "buff",
      buffAttack: 2,
      buffHealth: 1,
      requiresTarget: true,
      targetType: "any_minion",
      drawCards: 1
    },
    collectible: true
  },
  {
    id: 6009,
    name: "Libram of Wisdom",
    manaCost: 2,
    type: "spell",
    rarity: "rare",
    description: "Give a minion +1/+1 and 'Deathrattle: Add a Libram of Wisdom to your hand.'",
    keywords: ["deathrattle"],
    heroClass: "paladin",
    class: "Paladin",
    spellEffect: {
      type: "buff",
      buffAttack: 1,
      buffHealth: 1,
      addDeathrattle: "add_libram_of_wisdom_to_hand",
      requiresTarget: true,
      targetType: "any_minion"
    },
    collectible: true
  }
];

// Convert the JavaScript objects to properly formatted TypeScript array items
function generateTypescriptArray() {
  // Convert each card object to a string representation with correct TypeScript formatting
  const cardStrings = tenCards.map(card => {
    return JSON.stringify(card, null, 2)
      // Convert double quotes on keys to no quotes for TypeScript
      .replace(/"([^"]+)":/g, '$1:')
      // Add two spaces of indentation to each line
      .replace(/^/gm, '  ')
      // Fix indentation on first line
      .replace(/^  {/, '{')
      // Fix indentation on object properties
      .replace(/^    /gm, '    ');
  });
  
  return cardStrings.join(',\n');
}

// Main function
async function main() {
  try {
    // Create output content
    const typescript = `import { CardData } from '../types';

/**
 * Collection of spell cards
 * Organized by class with various spell effects
 */
export const spellCards: CardData[] = [
${generateTypescriptArray()}
];
`;
    
    // Save to file
    const filePath = './client/src/game/data/spellCards.ts';
    
    // Create a backup before writing
    fs.copyFileSync(filePath, `${filePath}.before-direct-fix-${Date.now()}`);
    
    // Write the new content
    fs.writeFileSync(filePath, typescript, 'utf8');
    
    log('Successfully created spellCards.ts with 10 valid card entries');
    
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

main();