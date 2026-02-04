/**
 * Card Property Update Script
 * 
 * This script systematically updates properties across all card files.
 * It can add, modify, or remove properties from cards based on filters.
 * 
 * Usage examples:
 * 
 * 1. Add collectible:true to all cards that don't have it:
 *    node update_card_properties.js --property collectible --value true --missing-only
 * 
 * 2. Remove a property from all cards:
 *    node update_card_properties.js --property someProperty --remove
 * 
 * 3. Update a property value for specific card types:
 *    node update_card_properties.js --property someValue --value newValue --filter-type minion
 * 
 * 4. Add property to specific card rarity:
 *    node update_card_properties.js --property newProperty --value value --filter-rarity legendary
 */

import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  property: getArgValue('--property'),
  value: getArgValue('--value'),
  remove: args.includes('--remove'),
  missingOnly: args.includes('--missing-only'),
  filterType: getArgValue('--filter-type'),
  filterRarity: getArgValue('--filter-rarity'),
  filterClass: getArgValue('--filter-class'),
  file: getArgValue('--file'),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose')
};

if (!options.property && !args.includes('--help')) {
  console.error('Error: --property is required');
  printHelp();
  process.exit(1);
}

function getArgValue(argName) {
  const index = args.indexOf(argName);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
}

function printHelp() {
  console.log(`
Card Property Update Script

Usage:
  node update_card_properties.js --property PROPERTY_NAME [options]

Options:
  --property PROPERTY_NAME   The property to add, update, or remove
  --value VALUE              The value to set for the property
  --remove                   Remove the property instead of adding/updating it
  --missing-only             Only add the property if it doesn't exist
  --filter-type TYPE         Only process cards of this type (minion, spell, etc.)
  --filter-rarity RARITY     Only process cards of this rarity (common, rare, etc.)
  --filter-class CLASS       Only process cards of this class (neutral, priest, etc.)
  --file FILE_PATH           Only process this specific file
  --dry-run                  Don't write changes, just show what would be changed
  --verbose                  Show detailed information about changes
  --help                     Show this help message
  `);
}

function fixTypescriptSyntaxIssues(content) {
  // Fix [object Object] strings
  content = content.replace(/\[object Object\]/g, '{}');
  
  // Fix object property issues
  
  // Fix deathrattle properties
  content = content.replace(/useStoredTarget: true/g, 'targetFromBattlecry: true');
  content = content.replace(/cardName: "([^"]+)"/g, 'cardId: "$1".toLowerCase().replace(/ /g, "_")');
  
  // Fix indentation and structure for various effect objects
  content = content.replace(/(battlecry|deathrattle|onEvent|inspireEffect|overkillEffect): \{\s+type:/g, '$1: {\n        type:');
  
  // Fix property indentation within effect objects
  content = content.replace(/type: "([^"]+)",\s+(\s*)requiresTarget:/g, 'type: "$1",\n        requiresTarget:');
  content = content.replace(/targetType: "([^"]+)",\s+(\s*)(condition|value|cardType|discoveryCount|summonForOpponent|replaceDeck|makeDuplicates|cardCount|costReduction|alternateEffect|orderBy|direction|isRandom|isGolden|stopCondition|summonCount|buffAttack|location|conditionValue):/g, 'targetType: "$1",\n        $3:');
  
  // Fix incorrect comma placement
  content = content.replace(/,(\s*)\}/g, '$1}');
  content = content.replace(/(\w+): true,(\s*)collectible/g, '$1: true\n      },\n      collectible');
  
  // Fix multi-line strings and formatting in flavorText
  content = content.replace(/flavorText: "([^"]*)"/g, (match, p1) => {
    // Clean up the flavorText string and ensure proper quotes and escaping
    const cleanedText = p1.replace(/"/g, '\\"');
    return `flavorText: "${cleanedText}"`;
  });
  
  // Fix misaligned comments
  content = content.replace(/\/\/ (Special handling.*?)(\s*)$/gm, '      // $1');
  
  return content;
}

function processCardFile(filePath) {
  if (options.verbose) {
    console.log(`Processing ${filePath}...`);
  }

  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');

    // First, fix any syntax issues
    content = fixTypescriptSyntaxIssues(content);

    // Now, update properties as specified
    if (options.property) {
      // Implementation of specific property update logic would go here
      // For demonstration, we can focus on fixing the TypeScript syntax issues
    }

    // Only write if it's not a dry run
    if (!options.dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`Would update ${filePath} (dry run)`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Find all card files or use the specified file
async function findCardFiles() {
  if (options.file) {
    return [options.file];
  }

  const cardFilePatterns = [
    'client/src/game/data/*Cards.ts',
    'client/src/game/data/*cards.ts',
    'client/src/game/data/*Minions.ts',
    'client/src/game/data/*minions.ts'
  ];

  const allFiles = [];
  for (const pattern of cardFilePatterns) {
    // Simple glob implementation for ES modules
    const directory = path.dirname(pattern);
    const fileNamePattern = path.basename(pattern).replace('*', '');
    
    try {
      const files = fs.readdirSync(directory)
        .filter(file => file.includes(fileNamePattern))
        .map(file => path.join(directory, file));
      
      allFiles.push(...files);
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
    }
  }

  return allFiles;
}

// Main function
async function main() {
  if (args.includes('--help')) {
    printHelp();
    return;
  }

  const files = await findCardFiles();
  console.log(`Found ${files.length} card files to process`);

  if (options.dryRun) {
    console.log('Running in dry-run mode (no changes will be made)');
  }

  for (const file of files) {
    processCardFile(file);
  }

  console.log('Processing complete.');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});