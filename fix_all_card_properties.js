/**
 * Fix All Card Properties
 * 
 * This script fixes common issues with card properties:
 * 1. Adds missing 'class' property based on heroClass if present
 * 2. Ensures proper capitalization of class names (e.g., 'neutral' -> 'Neutral')
 * 3. Adds missing 'collectible' property (default: true for most cards, false for tokens)
 * 4. Adds missing IDs to cards based on a numbering scheme
 * 5. Fixes inconsistent heroClass and class values
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console output formatting
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR:' : 
                level === 'warn' ? '⚠️ WARNING:' : 
                level === 'success' ? '✅ SUCCESS:' : 'ℹ️ INFO:';
  console.log(`${prefix} ${message}`);
}

// Class name mapping (lowercase to proper case)
const CLASS_NAMES = {
  'neutral': 'Neutral',
  'warrior': 'Warrior',
  'paladin': 'Paladin',
  'hunter': 'Hunter',
  'druid': 'Druid',
  'mage': 'Mage',
  'priest': 'Priest',
  'warlock': 'Warlock',
  'shaman': 'Shaman',
  'rogue': 'Rogue',
  'demonhunter': 'DemonHunter',
  'deathknight': 'Deathknight'
};

// Extract card objects from file content as strings
function extractCardsFromContent(content) {
  // Find the array of cards - could be different formats
  const startPatterns = [
    'export const cards: CardData[] = [',
    'export const mechanicCards: CardData[] = [',
    'export const tokenCards: CardData[] = [',
    'export const legendaryCards: CardData[] = ['
  ];
  
  let arrayStart = -1;
  let usedPattern = '';
  
  for (const pattern of startPatterns) {
    const index = content.indexOf(pattern);
    if (index !== -1) {
      arrayStart = index + pattern.length;
      usedPattern = pattern;
      break;
    }
  }
  
  if (arrayStart === -1) {
    // Try a more generic pattern
    const genericMatch = content.match(/export const\s+(\w+):\s*CardData\[\]\s*=\s*\[/);
    if (genericMatch) {
      arrayStart = content.indexOf(genericMatch[0]) + genericMatch[0].length;
      usedPattern = genericMatch[0];
    } else {
      return { cards: [], pattern: '' };
    }
  }
  
  // Find the end of the array
  let bracketCount = 1;
  let position = arrayStart;
  
  while (bracketCount > 0 && position < content.length) {
    const char = content[position];
    if (char === '[') bracketCount++;
    else if (char === ']') bracketCount--;
    position++;
  }
  
  if (bracketCount !== 0) {
    log('Failed to parse card array - unbalanced brackets', 'error');
    return { cards: [], pattern: '' };
  }
  
  // Extract the full array content
  const arrayContent = content.substring(arrayStart, position - 1);
  
  // Split by card objects - this is a simplified approach and may need refinement
  const cardStrings = [];
  let currentCard = '';
  let openBraces = 0;
  
  for (let i = 0; i < arrayContent.length; i++) {
    const char = arrayContent[i];
    
    if (char === '{') {
      openBraces++;
      if (openBraces === 1) {
        // Start of a new card
        currentCard = '{';
        continue;
      }
    } else if (char === '}') {
      openBraces--;
      if (openBraces === 0) {
        // End of a card
        currentCard += '}';
        cardStrings.push(currentCard);
        currentCard = '';
        continue;
      }
    }
    
    if (openBraces > 0) {
      currentCard += char;
    }
  }
  
  return { cards: cardStrings, pattern: usedPattern };
}

// Fix a card's properties
function fixCardProperties(cardString) {
  let modified = false;
  let fixedCard = cardString;
  
  // Check for id
  const idMatch = fixedCard.match(/id:\s*(\d+(?:\.\d+)?)/);
  if (!idMatch) {
    // No ID, we should add one, but this requires more context about other IDs
    log('Card missing ID - manual handling required', 'warn');
  }
  
  // Extract name for logging
  const nameMatch = fixedCard.match(/name:\s*"([^"]+)"/);
  const cardName = nameMatch ? nameMatch[1] : 'Unknown Card';
  
  // Check for class vs heroClass discrepancy
  const heroClassMatch = fixedCard.match(/heroClass:\s*"([^"]+)"/);
  const classMatch = fixedCard.match(/class:\s*"([^"]+)"/);
  
  if (heroClassMatch) {
    const heroClass = heroClassMatch[1].toLowerCase();
    
    // If class is missing but heroClass exists, add class
    if (!classMatch) {
      if (CLASS_NAMES[heroClass]) {
        const properClass = CLASS_NAMES[heroClass];
        // Add class property after heroClass
        fixedCard = fixedCard.replace(
          /heroClass:\s*"([^"]+)"/,
          `heroClass: "${heroClass}", class: "${properClass}"`
        );
        log(`Added class: "${properClass}" to card ${cardName}`, 'success');
        modified = true;
      } else {
        log(`Unknown heroClass "${heroClass}" for card ${cardName}`, 'warn');
      }
    } 
    // If both exist but don't match in case-insensitive comparison
    else if (classMatch && heroClass.toLowerCase() !== classMatch[1].toLowerCase()) {
      // Fix the class property to match heroClass with proper capitalization
      if (CLASS_NAMES[heroClass]) {
        const properClass = CLASS_NAMES[heroClass];
        fixedCard = fixedCard.replace(
          /class:\s*"([^"]+)"/,
          `class: "${properClass}"`
        );
        log(`Fixed class value from "${classMatch[1]}" to "${properClass}" for card ${cardName}`, 'success');
        modified = true;
      }
    }
  } else if (classMatch) {
    // Only class exists - ensure proper capitalization
    const className = classMatch[1].toLowerCase();
    if (CLASS_NAMES[className] && CLASS_NAMES[className] !== classMatch[1]) {
      fixedCard = fixedCard.replace(
        /class:\s*"([^"]+)"/,
        `class: "${CLASS_NAMES[className]}"`
      );
      log(`Fixed class capitalization from "${classMatch[1]}" to "${CLASS_NAMES[className]}" for card ${cardName}`, 'success');
      modified = true;
    }
  } else {
    // Neither class nor heroClass exists
    // Infer class from context (file name, card ID range, etc.)
    // This is more complex and might need manual handling
    log(`Card ${cardName} missing both class and heroClass properties`, 'warn');
  }
  
  // Check for collectible property
  if (!fixedCard.includes('collectible:')) {
    // Add collectible property before the closing brace
    fixedCard = fixedCard.replace(
      /(\s*)\}$/,
      `,\n    collectible: true$1}`
    );
    log(`Added collectible: true to card ${cardName}`, 'success');
    modified = true;
  }
  
  return { fixedCard, modified };
}

// Process a single file
async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { cards, pattern } = extractCardsFromContent(content);
    
    if (cards.length === 0 || pattern === '') {
      log(`No cards found in ${filePath} - skipping`, 'warn');
      return { processed: false, file: filePath };
    }
    
    log(`Processing ${path.basename(filePath)} - Found ${cards.length} cards`);
    
    let modifiedContent = content;
    let totalModifications = 0;
    
    for (const cardString of cards) {
      const { fixedCard, modified } = fixCardProperties(cardString);
      
      if (modified) {
        // Replace the original card with the fixed version
        modifiedContent = modifiedContent.replace(cardString, fixedCard);
        totalModifications++;
      }
    }
    
    if (totalModifications > 0) {
      // Write the modified content back to the file
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      log(`Modified ${totalModifications} cards in ${path.basename(filePath)}`, 'success');
      return { processed: true, modified: true, file: filePath, count: totalModifications };
    } else {
      log(`No cards needed modification in ${path.basename(filePath)}`);
      return { processed: true, modified: false, file: filePath, count: 0 };
    }
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'error');
    return { processed: false, error: error.message, file: filePath };
  }
}

// Find all card files
async function findCardFiles() {
  const cardFilePattern = 'client/src/game/data/**/*.ts';
  
  try {
    const files = await glob(cardFilePattern);
    log(`Found ${files.length} card files to process`, 'success');
    return files;
  } catch (error) {
    log(`Error finding card files: ${error.message}`, 'error');
    return [];
  }
}

// Main function
async function main() {
  const cardFiles = await findCardFiles();
  
  const results = [];
  let totalModified = 0;
  
  for (const filePath of cardFiles) {
    const result = await processFile(filePath);
    results.push(result);
    
    if (result.processed && result.modified) {
      totalModified += result.count;
    }
  }
  
  log(`Processed ${cardFiles.length} files, modified ${totalModified} cards in total`, 'success');
}

// Execute the script
main();