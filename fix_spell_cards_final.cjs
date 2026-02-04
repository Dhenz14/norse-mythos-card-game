/**
 * Final SpellCards fix focused on export structure
 * 
 * This script specifically addresses the issue with double export declarations
 * and improper import placement in the spellCards.ts file.
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Create a backup of the original file
function createBackup(filePath) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  fs.copyFileSync(filePath, backupPath);
  log(`Created backup at ${backupPath}`);
  return backupPath;
}

// Main function to fix the spellCards file structure
function fixSpellCardsFileStructure() {
  const filePath = './client/src/game/data/spellCards.ts';
  
  try {
    // Create backup before making changes
    createBackup(filePath);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Step 1: Extract properly formatted import at the top
    if (content.includes('import { CardData } from')) {
      const importLine = 'import { CardData } from \'../types\';\n\n';
      // Remove any existing import lines
      content = content.replace(/import \{ CardData \} from '[^']+';/g, '');
      // Add import at the top
      content = importLine + content;
    }
    
    // Step 2: Fix duplicate export declarations
    // Check if there are multiple export declarations
    if ((content.match(/export const spellCards/g) || []).length > 1) {
      // Remove all export declarations
      content = content.replace(/export const spellCards(\s*=\s*\[|\s*:\s*CardData\[\]\s*=\s*\[)/g, '');
      // Add a single correct export declaration
      content = content.replace(/^\s*\[/m, 'export const spellCards: CardData[] = [');
    }
    
    // Step 3: Remove any comments in the middle of the array
    content = content.replace(/\/\*\*[\s\S]*?\*\/\s*\n\s*\{/g, '  {');
    
    // Step 4: Fix common syntax errors within array elements
    content = content.replace(/("\w+"):\s*("[^"]*"|true|false|\d+|\[[^\]]*\])(,)?\s*\n\s*([a-zA-Z]+):/g, '$1: $2,\n  $4:');
    
    // Step 5: Fix empty object patterns
    content = content.replace(/}, {(\s*\n\s*)?}, {/g, '}, {');
    
    // Step 6: Fix closing bracket of array
    content = content.replace(/\s*\]\s*;?\s*\]\s*;?\s*$/, '\n];\n');
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    log('Fixed spellCards.ts file structure');
    
    return { success: true };
  } catch (error) {
    log(`Error fixing spellCards.ts structure: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Run the fixer
const result = fixSpellCardsFileStructure();
if (result.success) {
  log('Successfully restructured spellCards.ts');
} else {
  log(`Failed to fix spellCards.ts structure: ${result.error}`, 'error');
}