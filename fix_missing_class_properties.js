/**
 * Script to add missing class properties to card definitions.
 * 
 * Many cards in the database are missing the 'class' property which causes issues with filtering
 * and classification. This script analyzes card ID ranges and other characteristics 
 * to determine the appropriate class for each card.
 * 
 * Card ID ranges and classification rules:
 * 1. 1000-1999: Basic cards (Neutral)
 * 2. 2000-2999: Basic class cards (based on a numerical offset)
 * 3. 3000-3999: Special neutral cards
 * 4. 4000-4999: Expansion neutrals
 * 5. 5000-8999: Class cards (pattern needed)
 * 6. 9000-9999: Tokens (generally Neutral, but could be class-specific)
 * 7. 10000+: Special class cards (class determined by ID ranges)
 * 
 * Usage:
 * ```
 * node fix_missing_class_properties.js [--dry-run] [--verbose]
 * ```
 * 
 * Options:
 * --dry-run: Only show what would be changed without actually updating files
 * --verbose: Show detailed information about each card being processed
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Define command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

// Class ID mapping (maps ID ranges to specific classes)
const CLASS_RANGES = [
  { min: 10000, max: 19999, class: 'Warrior' },
  { min: 20000, max: 29999, class: 'Shaman' },
  { min: 30000, max: 39999, class: 'Rogue' },
  { min: 40000, max: 49999, class: 'Paladin' },
  { min: 50000, max: 59999, class: 'Hunter' },
  { min: 60000, max: 69999, class: 'Druid' },
  { min: 70000, max: 79999, class: 'Warlock' },
  { min: 80000, max: 89999, class: 'Mage' },
  { min: 90000, max: 99999, class: 'Priest' }
];

// Specialized token mapping for specific token ID ranges
const TOKEN_RANGES = [
  // Based on the ID patterns observed earlier
  { min: 9000, max: 9099, class: 'Neutral' },
  { min: 9100, max: 9199, class: 'Warrior' },
  { min: 9200, max: 9299, class: 'Shaman' },
  { min: 9300, max: 9399, class: 'Rogue' },
  { min: 9400, max: 9499, class: 'Paladin' },
  { min: 9500, max: 9599, class: 'Hunter' },
  { min: 9600, max: 9699, class: 'Druid' },
  { min: 9700, max: 9799, class: 'Warlock' },
  { min: 9800, max: 9899, class: 'Mage' },
  { min: 9900, max: 9999, class: 'Priest' }
];

// Get appropriate class for a card based on its ID
function getClassForCard(card) {
  // If card already has a class, return it
  if (card.class) {
    return card.class;
  }

  const id = card.id;
  
  // Check class ID ranges for class cards
  for (const range of CLASS_RANGES) {
    if (id >= range.min && id <= range.max) {
      return range.class;
    }
  }
  
  // Check token ranges for tokens
  for (const range of TOKEN_RANGES) {
    if (id >= range.min && id <= range.max) {
      return range.class;
    }
  }
  
  // Handle special ID ranges
  if (id >= 1000 && id <= 1999) {
    return 'Neutral'; // Basic neutral cards
  }
  
  if (id >= 3000 && id <= 3999) {
    return 'Neutral'; // Special neutral cards
  }
  
  if (id >= 4000 && id <= 4999) {
    return 'Neutral'; // Expansion neutral cards
  }
  
  // For everything else, default to Neutral
  return 'Neutral';
}

// Process a single file
function processFile(filePath) {
  if (isVerbose) {
    console.log(`Processing file: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let fileUpdated = false;
  
  // Improved regex patterns for card objects
  // This needs to be more flexible to handle the multiline formatting in the files
  const cardPattern = /{(?:\s*?[\r\n]\s*?)?[^{]*?"id":[^}]*?}/gs;
  
  // For debugging
  const cardCount = (content.match(cardPattern) || []).length;
  if (isVerbose && cardCount > 0) {
    console.log(`  Found ${cardCount} potential card objects`);
  }
  
  // Match cards with heroClass but no class property
  const hasHeroClassPattern = /{(?:[^}]*?[\r\n][^}]*?)*?"heroClass":\s*"([^"]*?)"[^}]*?}/gs;
  const heroClassMatches = [...content.matchAll(hasHeroClassPattern)];
  
  if (isVerbose && heroClassMatches.length > 0) {
    console.log(`  Found ${heroClassMatches.length} cards with heroClass property`);
  }
  
  let modifiedContent = content;
  let updateCount = 0;
  
  // Process cards with heroClass but no class
  for (const match of heroClassMatches) {
    const cardStr = match[0];
    const heroClass = match[1];
    
    // Skip if card already has a class property
    if (cardStr.includes('"class":')) continue;
    
    // Extract card ID
    const idMatch = cardStr.match(/"id":\s*(\d+)/);
    if (!idMatch) continue;
    
    const cardId = parseInt(idMatch[1], 10);
    
    let classValue;
    
    // Convert heroClass to appropriate class format (first letter capitalized)
    if (heroClass === 'neutral') {
      classValue = 'Neutral';
    } else {
      classValue = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
    }
    
    try {
      // Create the new card string with the class property
      // We'll insert it right after the heroClass property for consistency
      const updatedCardStr = cardStr.replace(/"heroClass":\s*"([^"]*?)"/, `"heroClass": "$1", "class": "${classValue}"`);
      
      // Replace the card in the content (only replace the first occurrence)
      modifiedContent = modifiedContent.replace(cardStr, updatedCardStr);
      
      // Verify the replacement happened
      if (modifiedContent !== content) {
        fileUpdated = true;
        updateCount++;
        
        if (isVerbose) {
          console.log(`  - Card ${cardId}: Adding class "${classValue}" (from heroClass "${heroClass}")`);
        }
      }
    } catch (error) {
      console.error(`  Error updating card ${cardId}:`, error.message);
    }
  }
  
  // Handle cards with neither class nor heroClass
  if (updateCount === 0) {
    // Match all objects with an ID but no class or heroClass
    const noClassPattern = /{(?!(?:[^}]*?[\r\n][^}]*?)*?"class":)(?!(?:[^}]*?[\r\n][^}]*?)*?"heroClass":)[^{]*?"id":\s*(\d+)[^}]*?}/gs;
    
    const noClassMatches = [...content.matchAll(noClassPattern)];
    if (isVerbose && noClassMatches.length > 0) {
      console.log(`  Found ${noClassMatches.length} cards with neither class nor heroClass property`);
    }
    
    // Process each card object
    for (const match of noClassMatches) {
      const cardStr = match[0];
      const cardId = parseInt(match[1], 10);
      
      // Create a simple object to pass to getClassForCard
      const card = { id: cardId };
      const classToAdd = getClassForCard(card);
      
      try {
        // Create the new card string with the class property
        // We'll insert it right after the id property for consistency
        const updatedCardStr = cardStr.replace(/"id":\s*\d+/, `$&, "class": "${classToAdd}"`);
        
        // Replace the card in the content (only replace the first occurrence)
        modifiedContent = modifiedContent.replace(cardStr, updatedCardStr);
        
        // Verify the replacement happened
        if (modifiedContent !== content) {
          fileUpdated = true;
          updateCount++;
          
          if (isVerbose) {
            console.log(`  - Card ${cardId}: Adding class property "${classToAdd}" (no heroClass found)`);
          }
        }
      } catch (error) {
        console.error(`  Error updating card ${cardId}:`, error.message);
      }
    }
  }
  
  // Only write to file if changes were made and not in dry run mode
  if (fileUpdated && !isDryRun) {
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    console.log(`Updated ${updateCount} cards in ${filePath}`);
  } else if (fileUpdated && isDryRun) {
    console.log(`Would update ${updateCount} cards in ${filePath} (dry run)`);
  } else if (isVerbose) {
    console.log(`  No updates needed for ${filePath}`);
  }
  
  return updateCount;
}

// Find all card definition files
async function findCardFiles() {
  // More targeted approach: Focus on specific data files that likely contain card definitions
  const cardFiles = await glob('client/src/game/data/**/*.{ts,js}');
  
  // Also check card-related files that might contain collectible cards
  const additionalFiles = await glob('client/src/game/data/card*/**/*.{ts,js}');
  
  return [...cardFiles, ...additionalFiles];
}

// Main execution
async function main() {
  console.log('--- Card Class Property Fixer ---');
  if (isDryRun) {
    console.log('Running in dry-run mode (no changes will be made)');
  }
  
  const cardFiles = await findCardFiles();
  console.log(`Found ${cardFiles.length} potential card files to process`);
  
  let totalUpdated = 0;
  
  for (const file of cardFiles) {
    try {
      const updateCount = processFile(file);
      totalUpdated += updateCount;
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  }
  
  console.log('--- Summary ---');
  if (isDryRun) {
    console.log(`Would update ${totalUpdated} cards in total (dry run)`);
  } else {
    console.log(`Updated ${totalUpdated} cards in total`);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Error executing script:', error);
  process.exit(1);
});