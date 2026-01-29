/**
 * Fix spellEffect closing braces in additionalSpellCards.ts
 * 
 * This script specifically fixes the closing brace indentation of spellEffect objects
 */

const fs = require('fs');

// The file to fix
const filePath = 'client/src/game/data/additionalSpellCards.ts';

// Read the file
const fileContent = fs.readFileSync(filePath, 'utf8');

// Fix the indentation of closing braces for spellEffect objects
let fixed = fileContent.replace(/^(\s*)(\w+):\s*([^{]*),\n\s*},/gm, (match, indent, prop, value) => {
  return `${indent}${prop}: ${value},\n${indent}},`;
});

// Fix specifically the spellEffect object closing braces
fixed = fixed.replace(/(\n\s+)},(\n\s+collectible:)/g, '$1      },$2');

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixed);

console.log('Successfully fixed spellEffect closing braces');