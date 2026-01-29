/**
 * A targeted script to fix missing commas between keywords arrays and collectible properties
 * 
 * This script addresses a common syntax error where keywords arrays are missing a
 * comma before the collectible property throughout cards.ts file
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

// Main function to fix the missing commas
async function fixKeywordsCommas() {
  try {
    log('Reading cards.ts file...');
    const content = await fs.promises.readFile(cardsFile, 'utf8');
    
    // Create a backup of the original file
    const backupPath = `${cardsFile}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Replace all occurrences of keywords arrays without commas
    // This regex pattern looks for keywords array closing bracket immediately followed by collectible
    const fixedContent = content.replace(/keywords: \[([^\]]*)\]collectible:/g, (match) => {
      return match.replace(']collectible:', '],\n      collectible:');
    });
    
    // Write the fixed content back to the file
    await fs.promises.writeFile(cardsFile, fixedContent, 'utf8');
    
    // Count how many replacements were made
    const originalMatches = (content.match(/keywords: \[([^\]]*)\]collectible:/g) || []).length;
    const remainingMatches = (fixedContent.match(/keywords: \[([^\]]*)\]collectible:/g) || []).length;
    
    log(`Fixed ${originalMatches - remainingMatches} missing commas in ${cardsFile}`);
    
    return {
      success: true,
      fixedCount: originalMatches - remainingMatches
    };
  } catch (error) {
    log(`Failed to fix keywords commas: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute the function
fixKeywordsCommas()
  .then(result => {
    if (result.success) {
      log(`Successfully fixed ${result.fixedCount} missing commas`);
    } else {
      log(`Failed to fix keywords commas: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });