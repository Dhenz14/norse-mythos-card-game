/**
 * Ultimate card fix script - fixes all collectible property issues in all card files
 * Uses a direct string replacement approach for maximum effectiveness
 */
const fs = require('fs');
const glob = require('glob');

// Locate all TS files in the card data directory
const CARD_DIR = './client/src/game/data/';
const cardFiles = glob.sync(`${CARD_DIR}*.ts`);

console.log(`Found ${cardFiles.length} card files to process`);

let fixedFiles = 0;

// Process each file
cardFiles.forEach(filePath => {
  try {
    // Skip type definition files and index files
    if (filePath.includes('.d.ts') || filePath.includes('index.ts') || filePath.includes('types.ts')) {
      return;
    }

    console.log(`Processing ${filePath}...`);
    
    // Create backup
    const content = fs.readFileSync(filePath, 'utf8');
    const backupPath = `${filePath}.bak`;
    fs.writeFileSync(backupPath, content);
    
    // Apply the most direct and reliable fix
    // Replace all occurrences of "collectible: true}" with "collectible: true\n  }"
    const fixedContent = content.replace(/collectible: true}/g, 'collectible: true\n  }');
    
    // Write back to file
    fs.writeFileSync(filePath, fixedContent);
    fixedFiles++;
    
    console.log(`  ✓ Fixed ${filePath}`);
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}: ${error.message}`);
  }
});

console.log(`\n==== Summary ====`);
console.log(`Total files processed: ${cardFiles.length}`);
console.log(`Files fixed: ${fixedFiles}`);