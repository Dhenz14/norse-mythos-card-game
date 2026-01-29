/**
 * Fix All Syntax Errors
 * 
 * This script scans for all potential syntax errors caused by duplicate closures
 * and fixes them by removing extra closing braces.
 */

const fs = require('fs');

// Files that need fixing
const filesToFix = [
  'client/src/game/data/cards.ts',
  'client/src/game/data/mechanicCards.ts',
  'client/src/game/data/additionalClassMinions.ts'
];

function fixSyntaxErrors(filePath) {
  console.log(`Fixing syntax errors in ${filePath}`);
  
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace pattern of double closing braces with single closing brace
    // This regex matches a closing brace, any whitespace, and another closing brace
    const regex = /\},\s*\n\s*\},/g;
    const originalLength = content.length;
    
    // Replace all occurrences
    content = content.replace(regex, '},');
    
    // Check if any replacements were made
    const newLength = content.length;
    const replacementsCount = (originalLength - newLength) / 4; // Approximate count
    
    if (replacementsCount > 0) {
      console.log(`Made approximately ${replacementsCount} replacements in ${filePath}`);
      
      // Write the fixed content back to the file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath} successfully`);
    } else {
      console.log(`No syntax errors found in ${filePath}`);
    }
    
  } catch (error) {
    console.error(`Error fixing syntax errors in ${filePath}:`, error.message);
  }
}

// Main function
function main() {
  filesToFix.forEach(filePath => {
    fixSyntaxErrors(filePath);
  });
  
  console.log('Syntax error fixing complete');
}

// Run the script
main();