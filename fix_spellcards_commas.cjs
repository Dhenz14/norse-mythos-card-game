/**
 * Script to fix missing commas in spellCards.ts file
 */

const fs = require('fs');
const path = require('path');

function fixSpellCardsFile() {
  const filePath = path.join('client', 'src', 'game', 'data', 'spellCards.ts');
  
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regex for finding card objects without commas
    const regex = /}(\s*)\{/g;
    
    // Replace with comma
    const newContent = content.replace(regex, '},\n  {');
    
    // Also fix any instances of "sometext}//"
    const commentRegex = /}(\s*)\/\//g;
    const fixedContent = newContent.replace(commentRegex, '},\n  //');
    
    // Write updated content back to file
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log('Successfully fixed missing commas in spellCards.ts');
    
    return true;
  } catch (error) {
    console.error('Error updating spellCards.ts:', error);
    return false;
  }
}

// Run the script
console.log('Starting fix for spellCards.ts...');
const result = fixSpellCardsFile();
console.log('Done!', result ? 'Successfully updated file.' : 'Failed to update file.');