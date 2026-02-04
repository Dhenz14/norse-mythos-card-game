/**
 * Direct fix for specific issues in spellCards.ts
 */

const fs = require('fs');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

try {
  const filePath = './client/src/game/data/spellCards.ts';
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix double closing braces after spellEffect objects
  content = content.replace(/}},\s*\n\s*collectible:/g, '}\n  },\n  collectible:');
  
  // Also fix the standalone extra braces
  content = content.replace(/}\s*},\s*\n\s*collectible:/g, '}\n  },\n  collectible:');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  log('Fixed specific double closing brace issues in spellCards.ts');
  
} catch (error) {
  log(`Error: ${error.message}`, 'error');
}