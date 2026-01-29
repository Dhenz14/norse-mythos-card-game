/**
 * Simple targeted fixes for classMinions.ts
 * 
 * This script makes minimal changes to fix specific syntax errors:
 * 1. Missing commas between card objects
 * 2. Misplaced collectible properties
 * 3. Ensures proper closing of effect objects
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

async function fixFile() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);

    // Apply targeted fixes
    let fixedContent = content;
    
    // 1. Fix missing commas between card objects
    // This replaces "}\n{" or "} {" with "},\n{"
    fixedContent = fixedContent.replace(/}(\s*)\{/g, '},\n{');
    
    // 2. Fix misplaced collectible after frenzyEffect closing brace
    fixedContent = fixedContent.replace(/triggered: false,?\s*collectible: true/g, 
                                         'triggered: false\n  },\n  collectible: true');
    
    // 3. Add missing commas after collectible property
    fixedContent = fixedContent.replace(/collectible: true(\s*)\}/g, 'collectible: true\n}');
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Applied targeted fixes to classMinions.ts');
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