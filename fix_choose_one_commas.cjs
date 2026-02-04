/**
 * A specialized script to fix commas in chooseOneOptions arrays.
 */
const fs = require('fs');

function fixFile(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all occurrences of "chooseOneOptions: [," with "chooseOneOptions: ["
    const fixedContent = content.replace(/chooseOneOptions: \[,/g, 'chooseOneOptions: [');
    
    // Write back the fixed content
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`  Updated ${filePath}`);
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Run the fix on the additionalClassMinions.ts file
fixFile('./client/src/game/data/additionalClassMinions.ts');