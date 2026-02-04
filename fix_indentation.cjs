/**
 * Script to fix indentation issues in card files
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
  
  // Fix indentation issues
  let modifiedContent = content;
  
  // Fix stray collectible property after multiple empty lines
  modifiedContent = modifiedContent.replace(/(\s+race:.*?[",]\s*?)\n\s*?\n\s*?(collectible:\s*?true)\s*?(\n\s*?})/g, '$1\n    $2$3');
  
  // Fix indentation of collectible property
  modifiedContent = modifiedContent.replace(/(\s+[\w]+:.*?[",]\s*?)\n(\s*)collectible:/g, '$1\n    collectible:');
  
  // Fix inconsistent indentation of closing braces
  modifiedContent = modifiedContent.replace(/\n\s*?}\s*?,/g, '\n  },');
  
  // Fix multiple consecutive newlines
  modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Write changes back to file
  fs.writeFileSync(filePath, modifiedContent);
  console.log(`  Updated ${filePath}`);
});

console.log('Completed fixing indentation issues in all files.');