/**
 * Fix additionalSpellCards.ts
 * 
 * This script fixes the pattern of "},{" to properly format card objects
 * with correct indentation and array structure.
 */

const fs = require('fs');

// The file to fix
const filePath = 'client/src/game/data/additionalSpellCards.ts';

// Read the file
const fileContent = fs.readFileSync(filePath, 'utf8');

// Step 1: Fix the "},{" pattern to have proper line breaks and indentation
let fixed = fileContent.replace(/},\s*\n\s*},{/g, '},\n  {');

// Step 2: Ensure cards have consistent indentation
// Find all card properties and ensure they have proper indentation
const properties = [
  'id', 'name', 'manaCost', 'type', 'rarity', 'description', 
  'keywords', 'heroClass', 'class', 'collectible', 'spellEffect'
];

for (const prop of properties) {
  // Find property at beginning of line followed by a colon, ensuring it has proper indentation
  const regex = new RegExp(`^(\\s*)${prop}:`, 'gm');
  fixed = fixed.replace(regex, '      ' + prop + ':');
}

// Step 3: Fix spellEffect object indentation
// This requires careful handling because spellEffect contains nested properties
let lines = fixed.split('\n');
let inSpellEffect = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect entering a spellEffect block
  if (line.includes('spellEffect: {')) {
    inSpellEffect = true;
    continue;
  }
  
  // Detect leaving a spellEffect block
  if (inSpellEffect && line.trim() === '},') {
    inSpellEffect = false;
    continue;
  }
  
  // If we're in a spellEffect block, ensure properties have proper indentation
  if (inSpellEffect && line.trim().length > 0) {
    // Extract the property name
    const propertyMatch = line.match(/^\s*(\w+):/);
    if (propertyMatch) {
      const prop = propertyMatch[1];
      // Replace the line with properly indented property
      lines[i] = line.replace(/^\s*(\w+):/, '        ' + prop + ':');
    }
  }
}

// Rejoin the lines
fixed = lines.join('\n');

// Step 4: Ensure array brackets have proper indentation
// Fix the opening array bracket
fixed = fixed.replace(
  /export const additionalSpellCards: CardData\[\] = \[\s*\n\s*{/m, 
  'export const additionalSpellCards: CardData[] = [\n  {'
);

// Fix the closing array bracket
fixed = fixed.replace(/\n\s*\]\;/m, '\n];');

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixed);

console.log('Successfully fixed additionalSpellCards.ts');