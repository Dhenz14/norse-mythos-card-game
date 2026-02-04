/**
 * Script to fix stray commas in card files
 */
const fs = require('fs');

// Files to process
const files = [
  './client/src/game/data/neutralMinions.ts',
  './client/src/game/data/spellCards.ts',
  './client/src/game/data/legendaryCards.ts',
  './client/src/game/data/discoverPools.ts'
];

// Process each file
files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`Processing ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Create backup
  const backupPath = `${filePath}.backup.${Date.now()}`;
  fs.writeFileSync(backupPath, content);
  
  // Fix stray commas
  let modifiedContent = content;
  
  // Fix stray commas before battlecry/deathrattle
  modifiedContent = modifiedContent.replace(/,\s*?(battlecry|deathrattle):/g, '\n    $1:');

  // Fix stray commas at end of a property section
  modifiedContent = modifiedContent.replace(/,(\s*?\n\s*?})/g, '$1');
  
  // Fix lone commas on their own line
  modifiedContent = modifiedContent.replace(/\n\s*,\s*\n/g, '\n');
  
  // Write changes back to file
  fs.writeFileSync(filePath, modifiedContent);
  console.log(`  Updated ${filePath}`);
});

console.log('Completed fixing stray commas in all files.');