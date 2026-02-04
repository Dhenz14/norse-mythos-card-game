/**
 * Script to fix coldlightTestData.ts file
 * 
 * This script specifically fixes syntax errors in the coldlightTestData.ts file,
 * including removing extra commas and ensuring proper property formatting.
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixColdlightFile() {
  const filePath = './client/src/game/data/coldlightTestData.ts';
  
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the coldlight seer card's battlecry with class property
    content = content.replace(
      /buffs: \{\s*health: 2\s*\s*,\s*class: "Neutral"\}/g, 
      'buffs: {\n      health: 2\n    }'
    );
    
    // Fix murloc cards with dangling commas and incorrect class/collectible properties
    [
      'murlocTidehunter', 
      'murlocScout', 
      'bluegillWarrior', 
      'riverCrocolisk'
    ].forEach(cardName => {
      // Use a regex that matches the card's race and everything until the next property
      const regex = new RegExp(`(${cardName}[\\s\\S]+?race: "[^"]+"),\\s*,\\s*\\s*,\\s*class: "Neutral"\\s*,\\s*collectible: (true|false)`, 'g');
      
      // Replace with correctly formatted properties
      content = content.replace(regex, (match, prefix, collectible) => {
        return `${prefix},\n  class: "Neutral",\n  collectible: ${collectible}`;
      });

      // Fix cards with keywords that have a different structure
      const keywordsRegex = new RegExp(`(${cardName}[\\s\\S]+?keywords: \\[[^\\]]+\\]),\\s*,\\s*\\s*,\\s*class: "Neutral"\\s*,\\s*collectible: (true|false)`, 'g');
      
      content = content.replace(keywordsRegex, (match, prefix, collectible) => {
        return `${prefix},\n  class: "Neutral",\n  collectible: ${collectible}`;
      });
    });
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Fixed coldlightTestData.ts successfully`);
    
  } catch (error) {
    log(`Failed to fix coldlightTestData.ts: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run the function
fixColdlightFile();