/**
 * Script to fix syntax issues in colossalCards.ts
 * 
 * This script addresses the following issues:
 * 1. Remove leading commas in array declarations
 * 2. Fix duplicate/dangling commas
 * 3. Fix malformed class properties
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixColossalCardsFile() {
  const filePath = './client/src/game/data/colossalCards.ts';
  
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the arrays with leading commas
    content = content.replace(/export const\s+colossalMinionCards: CardData\[\] = \[,/g, 'export const colossalMinionCards: CardData[] = [');
    content = content.replace(/export const\s+colossalPartCards: CardData\[\] = \[,/g, 'export const colossalPartCards: CardData[] = [');
    
    // Fix the double commas in properties
    content = content.replace(/,\s*,\s*class:/g, ', class:');
    
    // Fix other class property issues
    content = content.replace(/keywords: \[\],\s*\s*,\s*class: "Neutral"/g, 'keywords: [],\n  class: "Neutral"');
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Fixed colossalCards.ts successfully`);
    
  } catch (error) {
    log(`Failed to fix colossalCards.ts: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run the function
fixColossalCardsFile();