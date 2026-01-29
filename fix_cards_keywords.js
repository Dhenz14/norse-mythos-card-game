/**
 * Script to fix missing commas between keywords and collectible properties
 */
const fs = require('fs');
const path = require('path');

// Path to the cards.ts file
const filePath = 'client/src/game/data/cards.ts';

// Log function
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Run the fix
async function fixKeywordsCollectible() {
  try {
    log('Reading cards.ts...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create a backup
    await fs.promises.writeFile(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Replace all instances of the pattern with the fix
    const fixedContent = content.replace(/keywords: \[([^\]]*)\]collectible:/g, 'keywords: [$1],\n      collectible:');
    
    // Write the fixed content back to the file
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Fixed missing commas between keywords and collectible properties');
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the function
fixKeywordsCollectible();