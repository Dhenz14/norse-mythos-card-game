/**
 * Fix card closing braces in additionalSpellCards.ts
 * 
 * This script specifically fixes the indentation of closing braces for card objects
 */

const fs = require('fs');

// The file to fix
const filePath = 'client/src/game/data/additionalSpellCards.ts';

// Read the file
const fileContent = fs.readFileSync(filePath, 'utf8');

// Fix the card closing braces - should have 2 spaces of indentation
let fixed = fileContent.replace(/^(\s*)collectible: (true|false)\n(\s*)}/gm, (match, indent, value, closingIndent) => {
  return `${indent}collectible: ${value}\n  }`;
});

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixed);

console.log('Successfully fixed card closing braces');