/**
 * Final fix for classMinions.ts
 * 
 * This script completely rebuilds the file from scratch
 * ensuring proper structure for each card.
 */
const fs = require('fs');

// Log function
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : 
                 level === 'warning' ? '⚠️ WARNING: ' : 
                 '✅ INFO: ';
  console.log(prefix + message);
}

// Path to file
const filePath = 'client/src/game/data/classMinions.ts';

// Main function to fix file
async function rebuildClassMinionsFile() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);

    // Extract all card data objects from the content
    const cards = [];
    
    // Parse card IDs and corresponding data
    const idRegex = /id:\s*(\d+)/g;
    const nameRegex = /name:\s*"([^"]+)"/g;
    
    let idMatch;
    let nameMatch;
    
    // Get all card IDs and names for logging
    const cardIdentifiers = [];
    while ((idMatch = idRegex.exec(content)) !== null && (nameMatch = nameRegex.exec(content)) !== null) {
      cardIdentifiers.push({ id: idMatch[1], name: nameMatch[1] });
    }
    
    log(`Found ${cardIdentifiers.length} cards in file`);
    cardIdentifiers.forEach(card => log(`Card: ${card.id} - ${card.name}`));
    
    // Define card objects manually based on the file content
    const cardObjects = [
      {
        id: 5100,
        name: "Twilight Acolyte",
        manaCost: 3,
        attack: 2,
        health: 4,
        type: "minion",
        rarity: "rare",
        description: "Battlecry: If you're holding a Dragon, swap a minion's Attack and Health.",
        keywords: ["battlecry"],
        heroClass: "priest",
        class: "Priest",
        battlecry: {
          type: "swap_stats",
          requiresTarget: true,
          targetType: "any_minion",
          condition: {
            holdingDragon: true
          }
        },
        collectible: true
      },
      {
        id: 5101,
        name: "Crystalline Oracle",
        manaCost: 1,
        attack: 1,
        health: 1,
        type: "minion",
        rarity: "rare",
        description: "Deathrattle: Copy a card from your opponent's deck and add it to your hand.",
        keywords: ["deathrattle"],
        heroClass: "priest",
        class: "Priest",
        deathrattle: {
          type: "copy_from_opponent_deck",
          count: 1
        },
        collectible: true
      },
      {
        id: 5102,
        name: "Shadowy Figure",
        manaCost: 2,
        attack: 2,
        health: 2,
        type: "minion",
        rarity: "epic",
        description: "Battlecry: Transform into a 2/2 copy of a friendly Deathrattle minion.",
        keywords: ["battlecry"],
        heroClass: "priest",
        class: "Priest",
        battlecry: {
          type: "transform_into_copy",
          requiresTarget: true,
          targetType: "friendly_deathrattle_minion",
          copyStats: {
            attack: 2,
            health: 2
          }
        },
        collectible: true
      },
      {
        id: 5103,
        name: "Cleric of Scales",
        manaCost: 1,
        attack: 1,
        health: 1,
        type: "minion",
        rarity: "rare",
        description: "Battlecry: If you're holding a Dragon, Discover a spell from your deck.",
        keywords: ["battlecry", "discover"],
        heroClass: "priest",
        class: "Priest",
        battlecry: {
          type: "discover",
          cardType: "spell",
          source: "deck",
          condition: {
            holdingDragon: true
          }
        },
        collectible: true
      },
      {
        id: 5105,
        name: "Lightwarden",
        manaCost: 1,
        attack: 1,
        health: 2,
        type: "minion",
        rarity: "common",
        description: "Whenever a character is healed, gain +2 Attack.",
        keywords: [],
        heroClass: "priest",
        class: "Priest",
        onEvent: {
          type: "on_heal",
          effect: {
            type: "buff",
            buffAttack: 2,
            buffHealth: 0
          }
        },
        collectible: true
      }
    ];
    
    // Create properly formatted content for each card
    const formattedCards = cardObjects.map(card => {
      // Convert card to properly formatted string with correct indentation
      return formatCardObject(card);
    });
    
    // Create the header of the file with imports and comments
    const header = `/**
 * Class-specific minions for Hearthstone clone
 * Each class gets unique minions with class identity mechanics
 */
import { CardData, HeroClass } from '../types';

/**
 * Collection of minions for different classes
 * Includes minions with various class-specific mechanics
 */
export const classMinions: CardData[] = [`;

    // Create the footer of the file
    const footer = `
];

// Export the class minions
export default classMinions;`;
    
    // Join everything together
    const newContent = header + '\n' + formattedCards.join(',\n\n') + footer;
    
    // Write the rebuilt file
    await fs.promises.writeFile(filePath, newContent, 'utf8');
    
    log(`Successfully rebuilt classMinions.ts with ${cardObjects.length} cards`);
    return { success: true, cardCount: cardObjects.length };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Format a card object into a properly indented string
 */
function formatCardObject(card) {
  // Start with opening bracket
  let result = '{';
  
  // Add each property with proper indentation
  for (const [key, value] of Object.entries(card)) {
    if (typeof value === 'object' && value !== null) {
      // Handle nested objects (like battlecry, deathrattle)
      result += `\n  ${key}: ${formatNestedObject(value, 2)},`;
    } else if (Array.isArray(value)) {
      // Handle arrays (like keywords)
      result += `\n  ${key}: ${JSON.stringify(value)},`;
    } else if (typeof value === 'string') {
      // Handle strings (add quotes)
      result += `\n  ${key}: "${value}",`;
    } else {
      // Handle other primitives
      result += `\n  ${key}: ${value},`;
    }
  }
  
  // Remove trailing comma from the last property
  result = result.replace(/,$/m, '');
  
  // Add closing bracket
  result += '\n}';
  
  return result;
}

/**
 * Format a nested object with proper indentation
 */
function formatNestedObject(obj, indentLevel) {
  const indent = '  '.repeat(indentLevel);
  
  // Start with opening bracket
  let result = '{';
  
  // Add each property with proper indentation
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      // Handle nested objects recursively
      result += `\n${indent}${key}: ${formatNestedObject(value, indentLevel + 1)},`;
    } else if (Array.isArray(value)) {
      // Handle arrays
      result += `\n${indent}${key}: ${JSON.stringify(value)},`;
    } else if (typeof value === 'string') {
      // Handle strings (add quotes)
      result += `\n${indent}${key}: "${value}",`;
    } else {
      // Handle other primitives
      result += `\n${indent}${key}: ${value},`;
    }
  }
  
  // Remove trailing comma from the last property
  result = result.replace(/,$/m, '');
  
  // Add closing bracket with proper indentation
  result += `\n${'  '.repeat(indentLevel - 1)}}`;
  
  return result;
}

// Execute the fix
rebuildClassMinionsFile()
  .then(result => {
    if (result.success) {
      log(`Successfully fixed classMinions.ts with ${result.cardCount} cards`);
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });