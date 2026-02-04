/**
 * Fix Extra Braces
 * 
 * This script finds and removes any extra closing braces in the cards.ts file
 * that are causing syntax errors.
 */

const fs = require('fs');

function fixExtraBraces(filePath) {
  console.log(`Fixing extra braces in ${filePath}`);
  
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace patterns of double closing braces
    content = content.replace(/},\s*\n\s*},/g, '},');
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath} successfully`);
    
  } catch (error) {
    console.error(`Error fixing braces in ${filePath}:`, error.message);
  }
}

// Main function
function main() {
  fixExtraBraces('client/src/game/data/cards.ts');
}

// Run the script
main();