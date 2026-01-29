/**
 * Direct Fix for missing class property
 * 
 * This script takes a more direct approach by modifying cards with missing class properties
 * It works with specific files that were identified as having missing class properties.
 */

import fs from 'fs';

// Focus only on files that were identified as having cards with missing class properties
const targetFiles = [
  'client/src/game/data/frenzyCards.ts',
  'client/src/game/data/dormantCards.ts'
];

// Function to fix a specific file
function fixFile(filePath) {
  try {
    console.log(`Processing file: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = content;
    let madeChanges = false;
    
    // Find all heroClass properties
    const heroClassMatches = content.matchAll(/heroClass:\s*['"]([^'"]+)['"]/g);
    
    for (const match of heroClassMatches) {
      const heroClass = match[1];
      const classValue = heroClass === 'neutral'
        ? 'Neutral'
        : heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
      
      // Only add class property if it doesn't already exist
      const fullLine = match[0];
      const linePos = match.index;
      
      // Check if there's already a class property close to this heroClass
      const nearbyContent = content.substring(Math.max(0, linePos - 50), linePos + fullLine.length + 50);
      if (!nearbyContent.includes('class:')) {
        // Add class property right after heroClass
        const before = content.substring(0, linePos + fullLine.length);
        const after = content.substring(linePos + fullLine.length);
        
        // Insert the class property after heroClass
        modified = before + `, class: "${classValue}"` + after;
        
        // Update content with the modification for future iterations
        content = modified;
        madeChanges = true;
        
        console.log(`Added class property '${classValue}' after heroClass='${heroClass}'`);
      }
    }
    
    // Only save if changes were made
    if (madeChanges) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`Updated ${filePath}`);
      return true;
    } else {
      console.log(`No changes needed in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  console.log('=== Directly Fixing Missing Class Properties ===');
  
  let totalUpdated = 0;
  
  for (const file of targetFiles) {
    const updated = fixFile(file);
    if (updated) totalUpdated++;
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Updated ${totalUpdated} files`);
}

// Run the script
main();