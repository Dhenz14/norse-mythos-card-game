/**
 * Fix Remaining Syntax Issues in Card Files
 * 
 * This script fixes:
 * 1. Unmatched braces 
 * 2. Missing commas between properties
 * 3. Braces without commas between them
 */

const fs = require('fs');
const path = require('path');

// Utility functions
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Problem files with specific issues
const FILES_TO_FIX = [
  {
    path: './client/src/game/data/oldGodsCards.ts',
    issues: ['unmatched_braces']
  },
  {
    path: './client/src/game/data/neutralSpellsAndTech.ts',
    issues: ['unmatched_braces', 'missing_commas']
  },
  {
    path: './client/src/game/data/coldlightTestData.ts',
    issues: ['missing_commas', 'brace_comma']
  }
];

// Fix syntax issues
function fixSyntaxIssues(content, issues) {
  let fixedContent = content;
  
  // Fix missing commas between properties
  if (issues.includes('missing_commas')) {
    fixedContent = fixedContent.replace(/([a-zA-Z]+):\s*("[^"]*"|'[^']*'|[0-9]+|true|false|\[[^\]]*\]|{[^}]*})\s+([a-zA-Z]+):/g, 
      '$1: $2,\n      $3:');
  }
  
  // Fix braces without commas
  if (issues.includes('brace_comma')) {
    fixedContent = fixedContent.replace(/}(\s*){/g, '},\n  {');
  }
  
  // Balance unmatched braces
  if (issues.includes('unmatched_braces')) {
    // First analyze the brace balance
    const openBraces = (fixedContent.match(/{/g) || []).length;
    const closeBraces = (fixedContent.match(/}/g) || []).length;
    
    if (openBraces > closeBraces) {
      // Missing closing braces
      const missingCloseBraces = openBraces - closeBraces;
      
      log(`Found ${missingCloseBraces} missing closing braces, attempting to fix...`);
      
      // Try to identify where braces are missing
      const lines = fixedContent.split('\n');
      
      // Check for patterns that indicate where a closing brace might be missing
      for (let i = 0; i < lines.length && closeBraces < openBraces; i++) {
        const line = lines[i];
        const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
        
        // Look for pattern like collectible: true followed immediately by a new card
        if (line.includes('collectible:') && (nextLine.trim().startsWith('{') || nextLine.trim().startsWith('export'))) {
          lines[i] = `${line}\n  }`;
          log(`Added missing closing brace after line: ${line}`);
        }
      }
      
      fixedContent = lines.join('\n');
    }
  }
  
  return fixedContent;
}

// Fix a single file
async function fixFile(fileInfo) {
  try {
    log(`Processing ${path.basename(fileInfo.path)}...`);
    
    // Read the file
    const content = await fs.promises.readFile(fileInfo.path, 'utf8');
    
    // Make a backup
    await fs.promises.writeFile(`${fileInfo.path}.backup-${Date.now()}`, content, 'utf8');
    
    // Fix syntax issues
    const fixedContent = fixSyntaxIssues(content, fileInfo.issues);
    
    // Write the fixed content
    await fs.promises.writeFile(fileInfo.path, fixedContent, 'utf8');
    
    log(`Fixed syntax issues in ${path.basename(fileInfo.path)}`);
    return { filePath: fileInfo.path, success: true };
  } catch (error) {
    log(`Error fixing ${path.basename(fileInfo.path)}: ${error.message}`, 'error');
    return { filePath: fileInfo.path, success: false, error: error.message };
  }
}

// Main function
async function main() {
  try {
    log('Fixing remaining syntax issues in card files...');
    
    const results = [];
    
    for (const fileInfo of FILES_TO_FIX) {
      const result = await fixFile(fileInfo);
      results.push(result);
    }
    
    // Print summary
    log('\nSummary:');
    const successCount = results.filter(r => r.success).length;
    
    log(`Successfully fixed syntax issues in ${successCount} of ${FILES_TO_FIX.length} files`);
    
    if (successCount < FILES_TO_FIX.length) {
      log(`Failed to process ${FILES_TO_FIX.length - successCount} files:`, 'warning');
      for (const result of results.filter(r => !r.success)) {
        log(`- ${path.basename(result.filePath)}: ${result.error}`, 'warning');
      }
    }
    
    return { success: true, results };
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the main function
main();