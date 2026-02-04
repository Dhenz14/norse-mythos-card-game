/**
 * Script to fix indentation issues in neutralSpellsAndTech.ts
 */
const fs = require('fs');
const path = require('path');

// Log function
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : 
                 level === 'warning' ? '⚠️ WARNING: ' : 
                 '✅ INFO: ';
  console.log(prefix + message);
}

// Path to file
const filePath = 'client/src/game/data/neutralSpellsAndTech.ts';

async function fixFile() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Fix the indentation issues around lines 267-275
    let fixedContent = content.replace(
      /      heroClass: "neutral",\n      class: "Neutral",\n                              battlecry: {/g, 
      `      heroClass: "neutral",
      class: "Neutral",
      battlecry: {`
    );
    
    // Fix the collectible property indentation
    fixedContent = fixedContent.replace(
      /    },\n      collectible: true/g,
      `    },
      collectible: true`
    );
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Fixed indentation issues in neutralSpellsAndTech.ts');
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