/**
 * Import Existing Cards Script
 * 
 * This script imports cards from the existing card files into the new card management system.
 * It reads the current card files, converts them to the new format, and generates card set files.
 * 
 * Usage: node import_existing_cards.cjs [--dry-run] [--verbose] [--file <filepath>]
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  files: []
};

// Extract specific files to process
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && i + 1 < args.length) {
    options.files.push(args[i + 1]);
    i++;
  }
}

// Helper function to format a card using the builder pattern
function formatCardBuilder(card) {
  let lines = [];
  
  lines.push(`  createCard()`);
  lines.push(`    .id(${card.id})`);
  lines.push(`    .name("${card.name.replace(/"/g, '\\"')}")`);
  lines.push(`    .manaCost(${card.manaCost})`);
  
  if (card.attack !== undefined) {
    lines.push(`    .attack(${card.attack})`);
  }
  
  if (card.health !== undefined) {
    lines.push(`    .health(${card.health})`);
  }
  
  if (card.durability !== undefined) {
    lines.push(`    .durability(${card.durability})`);
  }
  
  if (card.description) {
    lines.push(`    .description("${card.description.replace(/"/g, '\\"')}")`);
  }
  
  lines.push(`    .rarity("${card.rarity}")`);
  lines.push(`    .type("${card.type}")`);
  
  if (card.heroClass) {
    lines.push(`    .heroClass("${card.heroClass}")`);
  }
  
  if (card.race) {
    lines.push(`    .race("${card.race}")`);
  }
  
  if (card.tribe) {
    lines.push(`    .tribe("${card.tribe}")`);
  }
  
  if (card.keywords && Array.isArray(card.keywords)) {
    for (const keyword of card.keywords) {
      lines.push(`    .addKeyword("${keyword}")`);
    }
  }
  
  if (card.set) {
    lines.push(`    .set("${card.set}")`);
  }
  
  // Category based on filename
  const fileCategory = filename.replace(/\.ts$/, '').toLowerCase();
  lines.push(`    .addCategory("${fileCategory}")`);
  
  // Handle collectible flag explicitly
  if (card.collectible === false) {
    lines.push(`    .collectible(false)`);
  }
  
  // Add battlecry effect if present
  if (card.battlecry) {
    lines.push(`    .battlecry(${JSON.stringify(card.battlecry, null, 6).replace(/"/g, '')
      .replace(/^{\s*/m, '{')
      .replace(/\s*}$/m, '}')
      .replace(/^      /gm, '')
    })`);
  }
  
  // Add deathrattle effect if present
  if (card.deathrattle) {
    lines.push(`    .deathrattle(${JSON.stringify(card.deathrattle, null, 6).replace(/"/g, '')
      .replace(/^{\s*/m, '{')
      .replace(/\s*}$/m, '}')
      .replace(/^      /gm, '')
    })`);
  }
  
  // Add spell effect if present and card is a spell
  if (card.type === 'spell' && card.spellEffect) {
    lines.push(`    .spellEffect(${JSON.stringify(card.spellEffect, null, 6).replace(/"/g, '')
      .replace(/^{\s*/m, '{')
      .replace(/\s*}$/m, '}')
      .replace(/^      /gm, '')
    })`);
  }
  
  lines.push(`    .build();`);
  
  return lines.join('\n');
}

// Find card files
async function findCardFiles() {
  if (options.files.length > 0) {
    return options.files;
  }
  
  const cardFilesPattern = path.join('client', 'src', 'game', 'data', '*.ts');
  return glob.sync(cardFilesPattern);
}

// Determine output file name based on input file
function getOutputFileName(inputFile) {
  const baseName = path.basename(inputFile, '.ts');
  return `${baseName}Set.ts`;
}

// Process a card file
function processCardFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);
  
  // Extract the array variable name using regex
  const arrayMatch = content.match(/export const\s+([^:]+)\s*:/);
  const arrayName = arrayMatch ? arrayMatch[1].trim() : 'cards';
  
  // Extract cards using a simplistic approach
  const cardMatches = content.match(/{[^{}]*(?:{[^{}]*}[^{}]*)*}/g) || [];
  
  if (cardMatches.length === 0) {
    console.log(`No cards found in ${filePath}`);
    return null;
  }
  
  // Parse each card
  const parsedCards = [];
  
  for (const cardMatch of cardMatches) {
    try {
      // Convert the match to valid JSON
      const jsonString = cardMatch
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Quote keys
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*,/g, ','); // Fix double commas
      
      const card = JSON.parse(jsonString);
      
      // Only include cards with a valid ID
      if (card.id) {
        parsedCards.push(card);
      }
    } catch (error) {
      if (options.verbose) {
        console.error(`Error parsing card in ${filePath}:`, error);
      }
    }
  }
  
  console.log(`Found ${parsedCards.length} cards in ${filePath}`);
  
  if (parsedCards.length === 0) {
    return null;
  }
  
  // Generate function name from file name
  const functionName = `register${
    filename.charAt(0).toUpperCase() + 
    filename.slice(1, -3).replace(/([A-Z])/g, ' $1').trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }`;
  
  // Generate output content
  const outputContent = `/**
 * ${functionName}
 * 
 * Cards imported from ${filename}
 * This file was automatically generated by the import_existing_cards.cjs script.
 */
import { createCard } from '../cardManagement';

/**
 * Register cards from ${filename}
 */
export function ${functionName}(): void {
  console.log('Registering cards from ${filename}...');

${parsedCards.map(card => formatCardBuilder(card)).join('\n\n')}
  
  console.log('Registered ${parsedCards.length} cards from ${filename}');
}`;

  return {
    outputFile: path.join('client', 'src', 'game', 'data', 'cardSets', getOutputFileName(filePath)),
    content: outputContent,
    cardCount: parsedCards.length
  };
}

// Write the output to a file
function writeOutputFile(outputFile, content) {
  if (options.dryRun) {
    console.log(`Would write to ${outputFile} (dry run)`);
    return;
  }
  
  // Ensure the directory exists
  const dir = path.dirname(outputFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, content);
  console.log(`Wrote ${outputFile}`);
}

// Create an index file for the card sets
function createCardSetsIndex(cardSetFiles) {
  const imports = cardSetFiles.map(file => {
    const baseName = path.basename(file, '.ts');
    const functionName = `register${
      baseName.charAt(0).toUpperCase() + 
      baseName.slice(1, -3).replace(/([A-Z])/g, ' $1').trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    }`;
    return `import { ${functionName} } from './${baseName}';`;
  }).join('\n');
  
  const functionCalls = cardSetFiles.map(file => {
    const baseName = path.basename(file, '.ts');
    const functionName = `register${
      baseName.charAt(0).toUpperCase() + 
      baseName.slice(1, -3).replace(/([A-Z])/g, ' $1').trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    }`;
    return `  ${functionName}();`;
  }).join('\n');
  
  const content = `/**
 * Card Sets Index
 * 
 * This file imports and registers all card sets.
 * It was automatically generated by the import_existing_cards.cjs script.
 */
${imports}

/**
 * Register all card sets
 */
export function registerAllCardSets(): void {
  console.log('Registering all card sets...');
  
${functionCalls}
  
  console.log('All card sets registered successfully.');
}`;
  
  const outputFile = path.join('client', 'src', 'game', 'data', 'cardSets', 'index.ts');
  
  if (options.dryRun) {
    console.log(`Would write index to ${outputFile} (dry run)`);
    return;
  }
  
  fs.writeFileSync(outputFile, content);
  console.log(`Wrote index file: ${outputFile}`);
}

// Main function
async function main() {
  console.log('Import Existing Cards Script');
  console.log('============================');
  
  if (options.dryRun) {
    console.log('Running in dry-run mode (no files will be written)');
  }
  
  const cardFiles = await findCardFiles();
  console.log(`Found ${cardFiles.length} card files to process`);
  
  const results = [];
  const cardSetFiles = [];
  
  for (const file of cardFiles) {
    const result = processCardFile(file);
    
    if (result) {
      results.push(result);
      writeOutputFile(result.outputFile, result.content);
      cardSetFiles.push(path.basename(result.outputFile));
    }
  }
  
  // Create index file
  createCardSetsIndex(cardSetFiles);
  
  // Print summary
  console.log('\nSummary:');
  console.log(`Processed ${cardFiles.length} files`);
  console.log(`Created ${results.length} card set files`);
  console.log(`Total cards imported: ${results.reduce((sum, r) => sum + r.cardCount, 0)}`);
  
  if (options.dryRun) {
    console.log('\nThis was a dry run. No files were actually written.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Error executing script:', error);
  process.exit(1);
});