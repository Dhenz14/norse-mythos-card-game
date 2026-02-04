/**
 * Script to fix missing commas in classCards.ts
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
const filePath = 'client/src/game/data/classCards.ts';

async function fixFile() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Fix missing comma after spellEffect closing brace
    let fixedContent = content.replace(
      /summonCardId: 7501 \/\/ Hound token\s*\n\s*}\s*\n\s*collectible: true/g,
      `summonCardId: 7501 // Hound token
       },
      collectible: true`
    );
    
    // Fix other missing commas
    fixedContent = fixedContent.replace(/}\s*\n\s*collectible: true/g, `},\n      collectible: true`);
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Fixed missing commas in classCards.ts');
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