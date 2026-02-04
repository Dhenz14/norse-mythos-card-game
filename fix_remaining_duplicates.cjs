/**
 * Script to fix remaining duplicate cards in the codebase
 * This script will analyze all card files and remove duplicate collectible properties
 */

const fs = require('fs');

// Files to process
const files = [
  './client/src/game/data/neutralMinions.ts',
  './client/src/game/data/spellCards.ts',
  './client/src/game/data/legendaryCards.ts',
  './client/src/game/data/discoverPools.ts'
];

// Process each file
files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`Processing ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Create backup
  const backupPath = `${filePath}.backup.${Date.now()}`;
  fs.writeFileSync(backupPath, content);
  
  // Step 1: Remove collectible properties inside nested objects
  let modifiedContent = content;
  
  // Fix collectible properties inside battlecry, deathrattle or other objects
  const nestedPropRegex = /(\s+(?:battlecry|deathrattle):\s*{[^}]+)collectible:\s*(true|false)([^}]+})/g;
  modifiedContent = modifiedContent.replace(nestedPropRegex, '$1$3');
  
  // Fix badly placed collectible after another property without comma
  const badPlacementRegex = /(\s+(?:requiresTarget|targetType|value|summonCardId|specificManaCost|specificRace|condition|discoveryType|cardType):\s*[^,\n]+)\s+collectible:/g;
  modifiedContent = modifiedContent.replace(badPlacementRegex, '$1,\n    collectible:');
  
  // Step 2: Remove duplicate collectible properties at the card level
  const cardRegex = /{[^{]*?collectible:\s*(true|false).*?collectible:\s*(true|false)[^}]*?}/gs;
  const matches = Array.from(modifiedContent.matchAll(cardRegex));
  
  if (matches.length > 0) {
    console.log(`  Found ${matches.length} cards with duplicate collectible properties`);
    
    matches.forEach(match => {
      const cardText = match[0];
      // Keep only the last collectible property at the card level
      const fixedCard = cardText.replace(/collectible:\s*(true|false)(.*?)collectible:\s*(true|false)/gs, 
        (_, val1, between, val2) => {
          // If there's a closing brace between the properties, it's in different objects
          if (between.includes('}')) {
            // Keep both, but ensure they're properly separated
            return `collectible: ${val1}${between}collectible: ${val2}`;
          }
          // Otherwise, keep only the second one
          return `collectible: ${val2}`;
        });
      
      modifiedContent = modifiedContent.replace(cardText, fixedCard);
    });
  }
  
  // Step 3: Fix missing commas between properties
  const missingCommaRegex = /(\s+\w+:\s*(?:"[^"]*"|[^,\n{]+))\n(\s+\w+:)/g;
  modifiedContent = modifiedContent.replace(missingCommaRegex, '$1,\n$2');
  
  // Write changes back to file
  fs.writeFileSync(filePath, modifiedContent);
  console.log(`  Updated ${filePath}`);
});

console.log('Completed processing all files.');