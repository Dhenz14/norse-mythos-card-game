/**
 * A specialized script to fix the discover pools file.
 * This removes all the incorrect collectible properties in the discover pools.
 */

import fs from 'fs';

const filePath = 'client/src/game/data/discoverPools.ts';

try {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Back up the original file
  fs.copyFileSync(filePath, `${filePath}.bak`);
  
  // Fix the comma issues and remove collectible properties
  let fixedContent = content;
  
  // Remove incorrect collectible properties from discover pool items
  fixedContent = fixedContent.replace(/,\s*collectible:\s*true}/g, '}');
  
  // Remove incorrect collectible property from the end of getDiscoverPoolOptions function
  fixedContent = fixedContent.replace(/}\)\);\s*,\s*collectible:\s*true}/g, '}));');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, fixedContent);
  
  console.log(`Fixed discover pools file: ${filePath}`);
  console.log(`Original file backed up as ${filePath}.bak`);
  
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}