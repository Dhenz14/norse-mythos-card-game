/**
 * Script to fix indentation issues in modernLegendaryCards.ts
 * This script specifically fixes indentation of effect properties
 */
import fs from 'fs';
import path from 'path';

const FILE_PATH = './client/src/game/data/modernLegendaryCards.ts';

function fixFile(filePath) {
  console.log(`Fixing indentation in ${filePath}...`);

  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix battlecry indentation
  content = content.replace(/battlecry: \{\s+type:/g, 'battlecry: {\n        type:');
  
  // Fix indentation for effect properties
  content = content.replace(/type: "([^"]+)",\s+(\s*)requiresTarget:/g, 'type: "$1",\n        requiresTarget:');
  content = content.replace(/targetType: "([^"]+)",\s+(\s*)(condition|summonForOpponent|cardType|value|discoveryCount):/g, 'targetType: "$1",\n        $3:');
  
  // Fix deathrattle indentation
  content = content.replace(/deathrattle: \{\s+type:/g, 'deathrattle: {\n        type:');
  
  // Fix onEvent indentation
  content = content.replace(/onEvent: \{\s+type:/g, 'onEvent: {\n        type:');
  
  // Fix inspireEffect indentation
  content = content.replace(/inspireEffect: \{\s+type:/g, 'inspireEffect: {\n        type:');
  
  // Fix overkillEffect indentation
  content = content.replace(/overkillEffect: \{\s+type:/g, 'overkillEffect: {\n        type:');
  
  // Fix generic object property indentation
  content = content.replace(/(\w+): \{\s+(\w+):/g, '$1: {\n        $2:');
  
  // Fix comma after closing brace at the end of an object
  content = content.replace(/\n\s+},\s+collectible:/g, '\n      },\n      collectible:');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log(`Fixed indentation in ${filePath}`);
}

try {
  fixFile(FILE_PATH);
  console.log('Indentation fixing complete!');
} catch (err) {
  console.error('Error fixing indentation:', err);
}