/**
 * Simple fix for discover pools
 */
const fs = require('fs');

const filePath = './client/src/game/data/discoverPools.ts';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

console.log(`Processing ${filePath}...`);

// Create backup
const backupPath = `${filePath}.backup.${Date.now()}`;
const content = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(backupPath, content);

// Fix indentation issues
let fixedContent = content
  // Fix indentation for 2 spaces
  .replace(/\n\s{12}(\w+):/g, '\n  $1:')
  // Fix indentation for nested blocks
  .replace(/\n\s{6}(\w+:)/g, '\n    $1')
  // Fix trailing commas on object properties
  .replace(/(\w+):\s*(.*),\s*\}/g, '$1: $2}')
  // Fix the filter functions that need explicit boolean returns
  .replace(/(filter: \(card\) =>)([^=]*)(keyword\.toLowerCase\(\) === '\w+'\))\s*\}/g, '$1$2$3 as boolean}')
  // Add 'as boolean' to filter expressions
  .replace(/(=> card.keywords.*?toLowerCase\(\) === .*?)\)\s*\}/g, '$1) as boolean}');

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent);
console.log(`Successfully fixed ${filePath}`);