/**
 * Script to fix broken description strings in neutralMinions.ts
 */
const fs = require('fs');

const filePath = './client/src/game/data/neutralMinions.ts';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

console.log(`Processing ${filePath}...`);

// Create backup
const backupPath = `${filePath}.backup.${Date.now()}`;
const content = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(backupPath, content);

// Fix broken Battlecry descriptions with more robust pattern matching
let fixedContent = content.replace(
  /description: "(.*?)Battlecr,\s*\n\s*y: ([^"]+)"/g,
  'description: "$1Battlecry: $2"'
);

// Fix broken Deathrattle descriptions with more robust pattern matching
fixedContent = fixedContent.replace(
  /description: "(.*?)Deathrattl,\s*\n\s*e: ([^"]+)"/g,
  'description: "$1Deathrattle: $2"'
);

// Ensure consistent indentation
fixedContent = fixedContent.replace(
  /\n\s{12}(\w+):/g, 
  '\n    $1:'
);

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent);
console.log(`Successfully fixed ${filePath}`);