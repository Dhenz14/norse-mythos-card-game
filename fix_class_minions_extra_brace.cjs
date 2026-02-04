/**
 * Fix for extra closing brace in classMinions.ts
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

async function fixExtraBrace() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Fix the extra closing brace
    const fixedContent = content.replace(
      '  collectible: true\n}\n},',
      '  collectible: true\n},'
    );
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Applied fix for extra closing brace in classMinions.ts');
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the fix
fixExtraBrace()
  .then(result => {
    if (result.success) {
      log('Successfully fixed issue');
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });