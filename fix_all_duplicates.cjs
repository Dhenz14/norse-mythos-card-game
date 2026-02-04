/**
 * A comprehensive card file fixer script
 * 
 * This script handles multiple issues in the card definition files:
 * 1. Removes duplicate collectible properties
 * 2. Ensures correct indentation of nested objects
 * 3. Adds missing commas between properties
 * 4. Ensures each card has a collectible property at the root level
 */

const fs = require('fs');
const path = require('path');

// Configuration - can be expanded as needed
const CONFIG = {
  targetFiles: [
    './client/src/game/data/neutralMinions.ts',
    './client/src/game/data/spellCards.ts',
    './client/src/game/data/legendaryCards.ts',
    './client/src/game/data/discoverPools.ts'
  ],
  propertyIndentation: 2,
  objectIndentation: 4,
  makeBackups: true
};

// Process each file
CONFIG.targetFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File ${filePath} does not exist, skipping.`);
    return;
  }

  try {
    console.log(`Processing ${filePath}...`);
    
    // Create backup
    if (CONFIG.makeBackups) {
      const backupPath = `${filePath}.bak.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`  Created backup at ${backupPath}`);
    }
    
    // Read content
    let content = fs.readFileSync(filePath, 'utf8');

    // Phase 1: Remove duplicate collectible properties
    console.log('  Fixing duplicate collectible properties...');
    
    // First, remove collectible from inside property objects
    content = content.replace(/(\s+(?:requiresTarget|targetType|value|summonCardId|specificManaCost|specificRace|condition|discoveryType|cardType):[ \t](?:[^,]+),?)[ \t]*collectible:[ \t]*(?:true|false)/g, '$1');
    
    // Find card objects with multiple collectible properties
    let cardMatches = Array.from(content.matchAll(/({[\s\S]*?collectible:[ \t]*(?:true|false)[\s\S]*?collectible:[ \t]*(?:true|false)[\s\S]*?})/g));
    
    for (const match of cardMatches) {
      const cardText = match[1];
      console.log(`  Found card with duplicate collectible property`);
      
      // Keep only the last collectible property
      let fixedCard = cardText.replace(/(collectible:[ \t]*(?:true|false))([\s\S]*?)(collectible:[ \t]*(?:true|false))/g, 
        (_, firstProp, between, lastProp) => {
          // If the first property is inside an object (like battlecry), keep the object structure
          if (between.includes('},')) {
            return between + lastProp;
          }
          return lastProp;
        });
      
      content = content.replace(cardText, fixedCard);
    }
    
    // Phase 2: Fix indentation and commas
    console.log('  Fixing indentation and commas...');
    
    // Fix missing commas in nested objects
    content = content.replace(/(\s+(?:\w+):[ \t]*(?:"[^"]*"|[^,{}\n]+))\s*\n(\s+\w+)/g, '$1,\n$2');
    
    // Fix indentation in nested object closures
    const indentSpace = ' '.repeat(CONFIG.objectIndentation);
    content = content.replace(/(\s+\w+:[ \t]*{[\s\S]*?)\n[ \t]*}\s*(?=,)/g, (match, objectStart) => {
      // Ensure the closing brace has correct indentation
      return `${objectStart}\n${indentSpace}}`;
    });
    
    // Phase 3: Ensure all cards have collectible property if they don't have it already
    console.log('  Ensuring all cards have collectible property...');
    
    // Add collectible: true to cards missing it
    content = content.replace(/({[\s\S]*?type:[ \t]*"(?:minion|spell|weapon)"[\s\S]*?)(?!\s*collectible:)([\s\S]*?})/g, (match, cardStart, cardEnd) => {
      // Only add if the card doesn't already have collectible somewhere
      if (!match.includes('collectible:')) {
        const collProperty = `\n  collectible: true`;
        // Insert before the closing brace
        return cardStart + cardEnd.replace(/}$/, `${collProperty}\n}`);
      }
      return match;
    });
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(`  Updated ${filePath}`);
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Card file fixing complete!');