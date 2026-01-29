/**
 * Script to fix nested object indentation in card files
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
  
  // Fix deathrattle/battlecry object indentation
  let modifiedContent = content;
  
  // Find nested objects with inconsistent indentation
  modifiedContent = modifiedContent.replace(
    /(type|value|targetType|specificRace|requiresTarget|condition):\s*([^,\n]+?)(\s*\n\s*)}/g,
    '$1: $2,\n    }'
  );
  
  // Fix the indentation of the closing brace of nested objects
  modifiedContent = modifiedContent.replace(
    /(\s{6}.*\n)(\s{2,4})}/g, 
    '$1    }'
  );
  
  // Write changes back to file
  fs.writeFileSync(filePath, modifiedContent);
  console.log(`  Updated ${filePath}`);
});

console.log('Completed fixing nested object indentation in all files.');