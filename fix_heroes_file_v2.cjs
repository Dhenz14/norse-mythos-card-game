/**
 * Improved script to fix all syntax issues in the heroes.ts file
 * This script creates a completely new file with correct syntax
 */

const fs = require('fs');
const path = require('path');

// Path to the heroes.ts file
const filePath = path.join(__dirname, 'client', 'src', 'game', 'data', 'heroes.ts');
const backupPath = path.join(__dirname, 'client', 'src', 'game', 'data', 'heroes.ts.backup');

// Main function to process the file
function main() {
  try {
    console.log(`Reading file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Create a backup first
    fs.writeFileSync(backupPath, fileContent, 'utf8');
    console.log(`Created backup at: ${backupPath}`);
    
    // Use regex to replace all problematic type annotations
    let fixedContent = fileContent;
    
    // 1. Remove the type annotations from heroPowers
    fixedContent = fixedContent.replace(/heroPowers: HeroPower\[\] = \[/g, 'heroPowers: [');
    
    // 2. Remove the type annotations from alternateHeroes
    fixedContent = fixedContent.replace(/alternateHeroes: AlternateHero\[\] = \[/g, 'alternateHeroes: [');
    
    // Write back to the file
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log('Successfully fixed syntax issues in heroes.ts');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Execute the script
main();