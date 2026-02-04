/**
 * Fix Trailing Commas in Card Files
 * 
 * This script specifically addresses the trailing commas issue found in multiple files
 */

const fs = require('fs');
const path = require('path');

// Utility functions
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Problem files with trailing commas
const FILES_TO_FIX = [
  './client/src/game/data/oldGodsCards.ts',
  './client/src/game/data/neutralSpellsAndTech.ts',
  './client/src/game/data/newSpellCards.ts',
  './client/src/game/data/outcastCards.ts',
  './client/src/game/data/overloadCards.ts',
  './client/src/game/data/questCards.ts',
  './client/src/game/data/coldlightTestData.ts'
];

// Fix trailing commas
function fixTrailingCommas(content) {
  // Replace trailing commas in objects
  content = content.replace(/,(\s*)\}/g, '$1}');
  
  // Replace trailing commas in arrays
  content = content.replace(/,(\s*)\]/g, '$1]');
  
  return content;
}

// Fix a single file
async function fixFile(filePath) {
  try {
    log(`Processing ${path.basename(filePath)}...`);
    
    // Read the file
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Make a backup
    await fs.promises.writeFile(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Fix trailing commas
    const fixedContent = fixTrailingCommas(content);
    
    // Count how many replacements were made
    const trailingCommasBefore = (content.match(/,(\s*)\}/g) || []).length + (content.match(/,(\s*)\]/g) || []).length;
    const trailingCommasAfter = (fixedContent.match(/,(\s*)\}/g) || []).length + (fixedContent.match(/,(\s*)\]/g) || []).length;
    const replacements = trailingCommasBefore - trailingCommasAfter;
    
    // Write the fixed content
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log(`Fixed ${replacements} trailing commas in ${path.basename(filePath)}`);
    return { filePath, replacements };
  } catch (error) {
    log(`Error fixing ${path.basename(filePath)}: ${error.message}`, 'error');
    return { filePath, error: error.message };
  }
}

// Main function
async function main() {
  try {
    log('Fixing trailing commas in card files...');
    
    const results = [];
    
    for (const filePath of FILES_TO_FIX) {
      const result = await fixFile(filePath);
      results.push(result);
    }
    
    // Print summary
    log('\nSummary:');
    const totalReplacements = results.reduce((sum, result) => sum + (result.replacements || 0), 0);
    const successCount = results.filter(r => !r.error).length;
    
    log(`Fixed ${totalReplacements} trailing commas across ${successCount} files`);
    
    if (successCount < FILES_TO_FIX.length) {
      log(`Failed to process ${FILES_TO_FIX.length - successCount} files:`, 'warning');
      for (const result of results.filter(r => r.error)) {
        log(`- ${path.basename(result.filePath)}: ${result.error}`, 'warning');
      }
    }
    
    return { success: true, totalReplacements, results };
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the main function
main();