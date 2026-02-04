/**
 * Comprehensive script to fix structure issues in legendaryCards.ts
 */
const fs = require('fs');

// Log function
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : 
                 level === 'warning' ? '⚠️ WARNING: ' : 
                 '✅ INFO: ';
  console.log(prefix + message);
}

// Path to file
const filePath = 'client/src/game/data/legendaryCards.ts';

// A more comprehensive fix function 
async function fixFile() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Split the content by card objects
    let cards = content.split(/}\s*,\s*\{/g);
    
    // Fix each card individually
    for (let i = 0; i < cards.length; i++) {
      // Check if we need to handle the collectible property in nested objects
      if (cards[i].includes('}collectible:')) {
        cards[i] = cards[i].replace(/}(\s*)collectible:/, '},\n    collectible:');
      }
    }
    
    // Rejoin the cards array
    let fixedContent = cards.join('},\n\n{');
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Fixed structure issues in legendaryCards.ts');
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the fix
fixFile()
  .then(result => {
    if (result.success) {
      log('Successfully fixed issues');
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });