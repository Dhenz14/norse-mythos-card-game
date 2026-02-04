/**
 * Script to fix nested collectible properties in card files
 */
const fs = require('fs');

// List of files to fix
const filesToFix = [
  './client/src/game/data/cards.ts',
  './client/src/game/data/specialEffectNeutrals.ts',
  './client/src/game/data/colossalCards.ts'
];

filesToFix.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Create a backup
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, content);

    // Fix nested collectible properties where they don't belong
    let fixedContent = content;

    // Fix patterns like: }[\n\s]*collectible: true[\n\s]*} (closing brackets with collectible in between)
    fixedContent = fixedContent.replace(/}\s*collectible: true\s*}/g, '}\n      }');

    // Fix patterns like: }\s*collectible: true, (closing bracket, collectible property, comma)
    fixedContent = fixedContent.replace(/}\s*collectible: true(,?)/g, '},\n    collectible: true$1');

    // Fix indented collectible properties without proper comma
    fixedContent = fixedContent.replace(/(\s+)}\s*(\s+)collectible: true(\s+)/g, '$1},\n$2collectible: true$3');

    // Write the fixed content back to the file
    fs.writeFileSync(filePath, fixedContent);

    console.log(`Successfully fixed ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});