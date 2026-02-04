/**
 * A specialized script to fix missing commas before collectible properties in card definitions.
 * This script ensures that each property is correctly comma-separated.
 */
const fs = require('fs');
const glob = require('glob');

// Locate all TS files in the card data directory
const CARD_DIR = './client/src/game/data/';
const cardFiles = glob.sync(`${CARD_DIR}*.ts`);

console.log(`Found ${cardFiles.length} card files to process`);

let fixedFiles = 0;
let fixedInstances = 0;

// Process each file
cardFiles.forEach(filePath => {
  try {
    // Skip type definition files and index files
    if (filePath.includes('.d.ts') || filePath.includes('index.ts') || filePath.includes('types.ts')) {
      return;
    }

    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    const backupPath = `${filePath}.bak`;
    
    // Backup the original file
    fs.writeFileSync(backupPath, content);
    
    // Fix missing commas before 'collectible: true'
    // Look for property followed by a comment or newline, then collectible
    const regex1 = /(\w+]: .+?|\w+": .+?|\w+: .+?)(\s*\/\/.*?\n\s*|\n\s*)collectible: true/g;
    const fixedContent1 = content.replace(regex1, '$1,$2collectible: true');
    
    // Look for keywords array followed by collectible
    const regex2 = /(keywords: \[.+?\])(\s*\/\/.*?\n\s*|\n\s*)collectible: true/g;
    const fixedContent2 = fixedContent1.replace(regex2, '$1,$2collectible: true');
    
    // Fix missing commas before other properties
    const regex3 = /(keywords: \[.+?\])(\s*\/\/.*?\n\s*|\n\s*)(heroClass|rarity|type): /g;
    let fixedContent3 = fixedContent2.replace(regex3, '$1,$2$3: ');
    
    // Make sure there are commas between all properties
    const propertyRegex = /\s+(id|name|manaCost|attack|health|type|rarity|description|keywords|heroClass|battlecry|deathrattle|collectible): /g;
    let lastMatch = null;
    let match;
    let positions = [];
    
    // Find all property positions
    while ((match = propertyRegex.exec(fixedContent3)) !== null) {
      if (lastMatch) {
        positions.push({
          start: lastMatch.index,
          end: match.index,
          property: lastMatch[1],
          nextProperty: match[1]
        });
      }
      lastMatch = match;
    }
    
    // Process property positions from end to start to avoid messing up indices
    positions.reverse();
    
    // Check each property position for missing commas
    for (const pos of positions) {
      const segment = fixedContent3.substring(pos.start, pos.end);
      
      // If there's no comma after the value before the next property
      if (!segment.includes(',')) {
        // Determine the insertion point for the comma
        const insertPoint = pos.start + segment.search(/\S+:\s+[^,]*$/) + segment.match(/\S+:\s+[^,]*$/)[0].length;
        
        // Insert the comma
        fixedContent3 = fixedContent3.substring(0, insertPoint) + ',' + fixedContent3.substring(insertPoint);
        fixedInstances++;
      }
    }
    
    // Check if anything was fixed
    if (fixedContent3 !== content) {
      fs.writeFileSync(filePath, fixedContent3);
      fixedFiles++;
      console.log(`  ✓ Fixed ${filePath}`);
    }
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}: ${error.message}`);
  }
});

console.log(`\n==== Summary ====`);
console.log(`Total files processed: ${cardFiles.length}`);
console.log(`Files fixed: ${fixedFiles}`);
console.log(`Instances fixed: ${fixedInstances}`);