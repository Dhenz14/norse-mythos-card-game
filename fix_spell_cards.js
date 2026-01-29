/**
 * Specialized script to fix syntax issues in spellCards.ts
 * This script focuses on fixing the syntax errors in line 26-29
 */

const fs = require('fs');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixSpellCards() {
  const filePath = './client/src/game/data/spellCards.ts';
  
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix the specific issue with missing commas between cards
    content = content.replace(/}(\s*)collectible:\s*true(\s*)\{/g, '},\n  collectible: true,\n{');
    
    // Additionally, fix any other issues with collectible property
    content = content.replace(/(\s*)collectible:\s*true(\s*)\{/g, '$1collectible: true,\n{');
    
    // Fix trailing commas in arrays
    content = content.replace(/,(\s*\])/g, '$1');
    
    // Make sure there are commas between card objects
    content = content.replace(/}(\s*){/g, '},\n$1{');
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Fixed issues in ${filePath}`);
  } catch (error) {
    log(`Failed to process ${filePath}: ${error.message}`, 'error');
  }
}

// Run the fix
fixSpellCards();