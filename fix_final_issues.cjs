/**
 * Final Targeted Fixes for Remaining Card Issues
 * 
 * This script applies precise fixes to the final 3 files with issues:
 * 1. oldGodsCards.ts - missing closing brace
 * 2. neutralSpellsAndTech.ts - trailing commas and brace issues
 * 3. coldlightTestData.ts - brace issues
 */

const fs = require('fs');
const path = require('path');

// Utility functions
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Fix oldGodsCards.ts
async function fixOldGodsCards() {
  const filePath = './client/src/game/data/oldGodsCards.ts';
  
  try {
    log(`Processing ${path.basename(filePath)}...`);
    
    // Read the file
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Make a backup
    await fs.promises.writeFile(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Find the last location before export const
    const lines = content.split('\n');
    let fixedLines = [...lines];
    
    // Find each export const declaration
    let addedBraces = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('export const') && i > 0) {
        // Check the line before for a closing brace
        const prevLine = lines[i-1].trim();
        if (!prevLine.endsWith('}') && !prevLine.endsWith('};')) {
          // We need to add a closing brace
          fixedLines.splice(i, 0, '  }');
          addedBraces++;
          i++; // Skip ahead since we inserted a line
        }
      }
    }
    
    // Check the end of the file as well
    const lastLine = fixedLines[fixedLines.length - 1].trim();
    if (!lastLine.endsWith('}') && !lastLine.endsWith('};')) {
      fixedLines.push('  }');
      addedBraces++;
    }
    
    // Write the fixed content
    const fixedContent = fixedLines.join('\n');
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log(`Added ${addedBraces} missing closing braces to ${path.basename(filePath)}`);
    return { filePath, addedBraces };
  } catch (error) {
    log(`Error fixing ${path.basename(filePath)}: ${error.message}`, 'error');
    return { filePath, error: error.message };
  }
}

// Fix neutralSpellsAndTech.ts
async function fixNeutralSpellsAndTech() {
  const filePath = './client/src/game/data/neutralSpellsAndTech.ts';
  
  try {
    log(`Processing ${path.basename(filePath)}...`);
    
    // Read the file
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Make a backup
    await fs.promises.writeFile(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // First fix all trailing commas
    let fixedContent = content.replace(/,(\s*)\}/g, '$1}');
    
    // Fix brace followed by brace
    fixedContent = fixedContent.replace(/}(\s*){/g, '},\n  {');
    
    // Then fix any unbalanced braces
    const lines = fixedContent.split('\n');
    let fixedLines = [...lines];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for patterns where braces might be missing
      if (line.includes('collectible:') && i < lines.length - 1 && lines[i+1].trim().startsWith('{')) {
        // Add a closing brace
        fixedLines.splice(i+1, 0, '  }');
        log(`Added missing closing brace after collectible property`);
        i++; // Skip ahead
      }
    }
    
    // Write the fixed content
    fixedContent = fixedLines.join('\n');
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log(`Fixed trailing commas and brace issues in ${path.basename(filePath)}`);
    return { filePath, success: true };
  } catch (error) {
    log(`Error fixing ${path.basename(filePath)}: ${error.message}`, 'error');
    return { filePath, success: false, error: error.message };
  }
}

// Fix coldlightTestData.ts
async function fixColdlightTestData() {
  const filePath = './client/src/game/data/coldlightTestData.ts';
  
  try {
    log(`Processing ${path.basename(filePath)}...`);
    
    // Read the file
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Make a backup
    await fs.promises.writeFile(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Fix brace followed by brace without comma
    let fixedContent = content.replace(/}(\s*){/g, '},\n  {');
    
    // Write the fixed content
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log(`Fixed brace issues in ${path.basename(filePath)}`);
    return { filePath, success: true };
  } catch (error) {
    log(`Error fixing ${path.basename(filePath)}: ${error.message}`, 'error');
    return { filePath, success: false, error: error.message };
  }
}

// Main function
async function main() {
  try {
    log('Applying final targeted fixes to remaining card files...');
    
    // Fix each file
    const oldGodsResult = await fixOldGodsCards();
    const neutralResult = await fixNeutralSpellsAndTech();
    const coldlightResult = await fixColdlightTestData();
    
    // Print summary
    log('\nSummary:');
    log(`oldGodsCards.ts: ${oldGodsResult.error ? 'FAILED' : 'SUCCESS'}`);
    log(`neutralSpellsAndTech.ts: ${neutralResult.error ? 'FAILED' : 'SUCCESS'}`);
    log(`coldlightTestData.ts: ${coldlightResult.error ? 'FAILED' : 'SUCCESS'}`);
    
    const successCount = [oldGodsResult, neutralResult, coldlightResult].filter(r => !r.error).length;
    log(`Successfully fixed ${successCount} of 3 files`);
    
    return { success: true };
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the main function
main();