/**
 * Fix missing commas between card properties
 * 
 * This script addresses the issues where card properties are missing commas,
 * which causes syntax errors when trying to parse the JavaScript objects.
 */

const fs = require('fs');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixMissingCommas(fileName) {
  try {
    const filePath = `./client/src/game/data/${fileName}`;
    log(`Processing ${filePath}`);
    
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix properties missing commas (property followed by another property on next line)
    content = content.replace(/(\w+):\s+("[^"]*"|'[^']*'|\[[^\]]*\]|\d+|\w+)\s*\n\s*(\w+):/g, '$1: $2,\n  $3:');
    
    // Fix missing commas between card objects
    content = content.replace(/}(\s*){/g, '},\n$1{');
    
    // Make sure collectible property has a comma after it when followed by a new card
    content = content.replace(/(collectible:\s*true)\s*\n\s*{/g, '$1,\n{');
    
    // Save changes
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Fixed issues in ${filePath}`);
    
    return true;
  } catch (error) {
    log(`Error processing ${fileName}: ${error.message}`, 'error');
    return false;
  }
}

// Process spellCards.ts specifically
let success = fixMissingCommas('spellCards.ts');

// We'll also check a few other files that might have similar issues
const additionalFiles = [
  'coldlightTestData.ts',
  'colossalCards.ts',
  'tradeableCards.ts',
  'frenzyCards.ts'
];

for (const file of additionalFiles) {
  success = fixMissingCommas(file) && success;
}

log(`Script completed ${success ? 'successfully' : 'with some errors'}`);