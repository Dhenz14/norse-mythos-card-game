/**
 * Script to fix syntax issues in the heroes.ts file
 * This script will fix all the comma issues in the arrays and improve formatting
 */

const fs = require('fs');
const path = require('path');

// Path to the heroes.ts file
const filePath = path.join(__dirname, 'client', 'src', 'game', 'data', 'heroes.ts');

// Function to fix array syntax with commas at the beginning
function fixArrayCommas(content) {
  // Replace all occurrences of arrays with leading commas
  // Pattern: array opening bracket followed by comma and newline
  const withoutLeadingCommas = content.replace(/\[\s*,\s*\n/g, '[\n');
  return withoutLeadingCommas;
}

// Main function to process the file
function main() {
  try {
    console.log(`Reading file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Fix the array syntax issues
    const fixedContent = fixArrayCommas(fileContent);
    
    // Write back to the file
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log('Successfully fixed array syntax issues in heroes.ts');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Execute the script
main();