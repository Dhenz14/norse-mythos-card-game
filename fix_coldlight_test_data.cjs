/**
 * Script to fix coldlightTestData.ts file
 * 
 * This script fixes specific syntax errors in the test data file that has
 * excessive commas in object declarations.
 */

const fs = require('fs');

const filePath = 'client/src/game/data/coldlightTestData.ts';

try {
  console.log(`Fixing ${filePath}...`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix extra commas after object declarations
  content = content.replace(/export const\s+\w+:\s*CardData\s*=\s*\{,/g, 'export const $1: CardData = {');
  
  // Fix specific instances of comma issues
  content = content.replace(/battlecry: \{,/g, 'battlecry: {');
  content = content.replace(/buffs: \{,/g, 'buffs: {');
  
  // Clean up extra whitespace and indentation
  content = content.replace(/^\s{3,}/gm, '  ');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content);
  console.log(`Successfully fixed ${filePath}`);
} catch (err) {
  console.error(`Error processing ${filePath}:`, err);
}