/**
 * Comprehensive SpellCards fixer script
 * 
 * This script addresses the core issues in the spellCards.ts file structure,
 * ensuring it has a proper export array declaration and consistent array item syntax.
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
    
    // Step 1: Ensure the file starts with a proper export declaration
    const hasExportDeclaration = content.trim().startsWith('export const');
    
    if (!hasExportDeclaration) {
      // Wrap the entire content in a proper export declaration
      content = `export const spellCards = [\n${content.trim()}\n];\n`;
    }
    
    // Step 2: Fix missing commas between properties within card objects
    // This regex looks for property patterns with missing commas
    content = content.replace(/("[^"]+"|true|false|[0-9]+)\s*\n\s*([a-zA-Z]+):/g, '$1,\n  $2:');
    
    // Step 3: Fix missing commas between array items
    content = content.replace(/}\s*\n\s*{/g, '},\n{');
    
    // Step 4: Fix double closing braces
    content = content.replace(/}}\s*,/g, '}\n  },');
    content = content.replace(/}}\s*$/g, '}\n  }\n];');
    
    // Step 5: Fix extra closing braces
    content = content.replace(/},\s*\n\s*},/g, '},');
    
    // Step 6: Ensure consistent indentation
    content = content.replace(/^\s*{/gm, '  {');
    content = content.replace(/^\s*}/gm, '  }');
    
    // Step 7: Ensure the file ends with a proper array closing bracket
    if (!content.trim().endsWith('];')) {
      content = content.trim() + '\n];\n';
    }
    
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