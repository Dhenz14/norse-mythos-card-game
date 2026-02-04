/**
 * A comprehensive script to fix common syntax issues in the cards.ts file
 * 
 * This script addresses several types of common syntax errors:
 * 1. Missing commas after array brackets
 * 2. Semicolons used where commas should be
 * 3. Improper indentation in nested objects
 */
const fs = require('fs');
const path = require('path');

// Function to log results with colors
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : 
                 level === 'warning' ? '⚠️ WARNING: ' : 
                 '✅ INFO: ';
  console.log(prefix + message);
}

// Path to the cards.ts file
const cardsFile = 'client/src/game/data/cards.ts';

// Main function to fix the various syntax issues
async function fixCardSyntaxIssues() {
  try {
    log('Reading cards.ts file...');
    const content = await fs.promises.readFile(cardsFile, 'utf8');
    
    // Create a backup of the original file
    const backupPath = `${cardsFile}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Fix 1: Replace semicolons with commas where they shouldn't be used
    let fixedContent = content.replace(/(\w+): \[([^\]]*)\];/g, '$1: [$2],');
    
    // Fix 2: Fix any other instances of grantKeywords arrays missing commas
    fixedContent = fixedContent.replace(/grantKeywords: \[([^\]]*)\](\s*\w)/g, 'grantKeywords: [$1],\n      $2');
    
    // Fix 3: Fix indentation within nested objects
    fixedContent = fixedContent.replace(/(\s+)value: (\d+),(\s+)(\w)/g, '$1value: $2,\n$1$4');
    
    // Fix 4: Fix missing commas after chooseOneOptions arrays
    fixedContent = fixedContent.replace(/(\s+)\];(\s+)}/g, '$1],\n$2}');
    
    // Write the fixed content back to the file
    await fs.promises.writeFile(cardsFile, fixedContent, 'utf8');
    
    log(`Fixed multiple syntax issues in ${cardsFile}`);
    
    return {
      success: true
    };
  } catch (error) {
    log(`Failed to fix card syntax issues: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute the function
fixCardSyntaxIssues()
  .then(result => {
    if (result.success) {
      log('Successfully fixed multiple syntax issues');
    } else {
      log(`Failed to fix syntax issues: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });