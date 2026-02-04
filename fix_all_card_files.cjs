/**
 * Comprehensive Card File Fixer
 * 
 * This script applies fixes to all card files in the game:
 * 1. Fixes missing commas between properties
 * 2. Removes trailing commas
 * 3. Ensures brace balance
 * 4. Fixes braces without commas between them
 * 
 * Usage:
 * ```
 * node fix_all_card_files.cjs
 * ```
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Utility functions
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Find all card files in the project
async function findCardFiles() {
  try {
    const files = await glob('./client/src/game/data/*.ts');
    return files;
  } catch (error) {
    throw new Error(`Error finding card files: ${error.message}`);
  }
}

// Fix common syntax issues in card files
function fixSyntaxIssues(content, fileName) {
  // Skip special treatment for certain files we've already fixed
  const skipSpecialCheck = [
    'oldGodsCards.ts', 
    'neutralSpellsAndTech.ts', 
    'newSpellCards.ts',
    'outcastCards.ts',
    'overloadCards.ts',
    'questCards.ts',
    'coldlightTestData.ts',
    'spellCards.ts'
  ].includes(fileName);
  
  if (skipSpecialCheck) {
    return content; // Return as-is, these are already fixed
  }
  
  // Check if the file is using export const format
  const isExportConstFile = content.includes('export const') && 
                           !content.includes('export default') &&
                           !content.includes('CardData[]');
  
  let fixedContent = content;
  
  // 1. Fix missing commas between properties
  fixedContent = fixedContent.replace(/([a-zA-Z]+):\s*("[^"]*"|'[^']*'|[0-9]+|true|false|\[[^\]]*\]|{[^}]*})\s+([a-zA-Z]+):/g, 
    '$1: $2,\n      $3:');
  
  // 2. Fix trailing commas
  fixedContent = fixedContent.replace(/,(\s*)\}/g, '$1}');
  
  // 3. Fix braces without commas between them
  fixedContent = fixedContent.replace(/}(\s*){/g, '},\n  {');
  
  // 4. Fix brace imbalance
  const openBraces = (fixedContent.match(/{/g) || []).length;
  const closeBraces = (fixedContent.match(/}/g) || []).length;
  
  if (openBraces > closeBraces) {
    // Missing closing braces
    const missingCloseBraces = openBraces - closeBraces;
    log(`${fileName}: Found ${missingCloseBraces} missing closing braces, attempting to fix...`);
    
    // Try to identify where braces are missing
    const lines = fixedContent.split('\n');
    
    // Check for patterns that indicate where a closing brace might be missing
    for (let i = 0; i < lines.length && (fixedContent.match(/}/g) || []).length < openBraces; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
      
      // Look for pattern like collectible: true followed immediately by a new card or export
      if (line.includes('collectible:') && 
          (nextLine.trim().startsWith('{') || nextLine.trim().startsWith('export'))) {
        lines[i] = `${line}\n  }`;
        log(`${fileName}: Added missing closing brace after line: ${line}`);
      }
    }
    
    fixedContent = lines.join('\n');
  } else if (closeBraces > openBraces) {
    // Too many closing braces
    const extraCloseBraces = closeBraces - openBraces;
    log(`${fileName}: Found ${extraCloseBraces} extra closing braces, attempting to fix...`);
    
    // This is more complex to fix automatically
    // For simplicity, we'll just log it for manual review
    log(`${fileName}: Please review manually - too many closing braces`, 'warning');
  }
  
  return fixedContent;
}

// Process a single file
async function processFile(filePath) {
  const fileName = path.basename(filePath);
  
  try {
    log(`Processing ${fileName}...`);
    
    // Read file content
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    await fs.promises.writeFile(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Fix syntax issues
    const fixedContent = fixSyntaxIssues(content, fileName);
    
    // Write fixed content
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log(`Fixed syntax issues in ${fileName}`);
    return { fileName, fixed: true };
  } catch (error) {
    log(`Error processing ${fileName}: ${error.message}`, 'error');
    return { fileName, fixed: false, error: error.message };
  }
}

// Main function
async function main() {
  try {
    log('Starting comprehensive card file fixer...');
    
    // Find all card files
    const files = await findCardFiles();
    log(`Found ${files.length} card files to process`);
    
    const results = [];
    
    // Process each file
    for (const filePath of files) {
      const result = await processFile(filePath);
      results.push(result);
    }
    
    // Print summary
    log('\nSummary:');
    const fixedCount = results.filter(r => r.fixed).length;
    log(`Successfully processed ${fixedCount} of ${files.length} files`);
    
    if (fixedCount !== files.length) {
      log(`${files.length - fixedCount} files had errors:`, 'warning');
      for (const result of results.filter(r => !r.fixed)) {
        log(`- ${result.fileName}: ${result.error}`, 'warning');
      }
    }
    
    log('\nNext steps:');
    log('1. Run check_all_card_files.cjs to verify fixes');
    log('2. Create targeted fixes for any remaining issues');
    
    return { 
      success: true,
      fixedFiles: fixedCount,
      totalFiles: files.length,
      results 
    };
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the main function
main();