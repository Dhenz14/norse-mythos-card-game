/**
 * Fix for duplicate collectible property in classMinions.ts
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
const filePath = 'client/src/game/data/classMinions.ts';

async function fixDuplicateCollectible() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Fix the duplicate collectible property
    const fixedContent = content
      // Fix the specific issue at the end of the file
      .replace(/collectible: true\n},\n  collectible: true\n}/, 'collectible: true\n}')
      // Fix the export structure
      .replace(/}\n\n\/\/ Export the class minions\nexport default classMinions;/, '}];\n\n// Export the class minions\nexport default classMinions;');
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Applied fix for duplicate collectible property in classMinions.ts');
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the fix
fixDuplicateCollectible()
  .then(result => {
    if (result.success) {
      log('Successfully fixed duplicate collectible issue');
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });