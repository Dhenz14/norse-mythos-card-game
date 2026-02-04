/**
 * Comprehensive fix for neutralSpellsAndTech.ts syntax errors
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
const filePath = 'client/src/game/data/neutralSpellsAndTech.ts';

async function fixFile() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Rewrite the problematic card definition entirely
    // This is safer than trying to fix specific syntax issues
    const problemPattern = /heroClass: "neutral",\s*class: "Neutral",\s*battlecry[\s\S]*?collectible: true\s*\}/g;
    
    const replacement = `heroClass: "neutral",
      class: "Neutral",
      battlecry: {
        type: "mind_control_random",
        condition: "opponent_minions_4",
        requiresTarget: false
      },
      collectible: true
  }`;
    
    const fixedContent = content.replace(problemPattern, replacement);
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Fixed neutralSpellsAndTech.ts with comprehensive replacement');
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