/**
 * SpellCards Parser and Fixer
 * 
 * This script focuses specifically on parsing and fixing the spellCards.ts file
 * by identifying structural issues and correcting them
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Create a backup of the original file
function createBackup(filePath) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  log(`Created backup at ${backupPath}`);
  return backupPath;
}

// Main function to parse and fix the spellCards file
function fixSpellCardsFile() {
  const filePath = './client/src/game/data/spellCards.ts';
  
  try {
    // Create backup before making changes
    createBackup(filePath);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // First fix: Make sure collectible is inside the card objects, not after
    content = content.replace(/}},\s*\n\s*collectible:/g, '}\n  },\n  collectible:');
    content = content.replace(/}\s*},\s*\n\s*collectible:/g, '}\n  },\n  collectible:');
    
    // Second fix: Fix empty card objects 
    content = content.replace(/}, {(\s*\n\s*)?}, {/g, '}, {');
    
    // Third fix: Fix any double closing braces without collectible
    content = content.replace(/}}\s*,\s*(\n\s*{)/g, '}\n  },\n$1');
    content = content.replace(/}},\s*$/g, '}\n  }\n];');
    
    // Fourth fix: Fix missing commas between properties
    content = content.replace(/"\s*\n\s*([a-zA-Z]+):/g, '",\n  $1:');
    
    // Fifth fix: Fix missing commas between cards
    content = content.replace(/}\s*\n\s*{/g, '},\n{');
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    log('Fixed spellCards.ts file');
    
    return { success: true };
  } catch (error) {
    log(`Error fixing spellCards.ts: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Run the fixer
const result = fixSpellCardsFile();
if (result.success) {
  log('Successfully processed spellCards.ts');
} else {
  log(`Failed to fix spellCards.ts: ${result.error}`, 'error');
}