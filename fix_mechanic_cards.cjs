/**
 * Fix for mechanicCards.ts
 * 
 * This script looks for structure issues in the mechanicCards.ts file
 * Specifically targeting the error around the SI:7 Agent card and Void Caller
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
const filePath = 'client/src/game/data/mechanicCards.ts';

async function fixMechanicCards() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Find the SI:7 Agent card and the issue with the collectible property
    const fixedContent = content.replace(
      /\{\s*id:\s*40028,[\s\S]*?collectible:\s*true\s*\},\s*\{/,
      (match) => {
        // This regex captures the SI:7 Agent card content up to the beginning of the next card
        // We need to fix the placement of collectible property and ensure proper closing
        return match.replace(
          /collectible:\s*true\s*\},\s*\{/,
          'collectible: true\n  }\n},\n{'
        );
      }
    );
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Fixed mechanicCards.ts - corrected SI:7 Agent card structure');
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the fix
fixMechanicCards()
  .then(result => {
    if (result.success) {
      log('Successfully fixed mechanicCards.ts');
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });