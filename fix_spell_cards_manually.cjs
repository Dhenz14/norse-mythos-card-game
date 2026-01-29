/**
 * Complete manual fix for spellCards.ts syntax errors
 */

const fs = require('fs');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

try {
  const filePath = './client/src/game/data/spellCards.ts';
  
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Insert a brace after collectible: true and before the { for the next card definition
  // This specific pattern matches exactly where we need to fix in line ~28-29
  let fixed = content.replace(/(collectible:\s*true),?\s*\n\s*{/g, '$1\n}, {');
  
  // Also fix specific issue with the priest spell (lines 20-28)
  fixed = fixed.replace(/(heroClass:\s*"priest")\s*\n\s*(class:\s*"Priest"),?\s*\n\s*(spellEffect:\s*{[^}]*})\s*\n\s*(collectible:\s*true),?\s*\n\s*},\s*{/gs, 
    '$1,\n  $2,\n  $3,\n  $4\n}, {');
  
  // Fix general property patterns (property: value followed by another property without comma)
  fixed = fixed.replace(/(\w+):\s+("[^"]*"|'[^']*'|\[[^\]]*\]|\d+|true|false|\w+)\s*\n\s*(\w+):/g, '$1: $2,\n  $3:');
  
  // Fix properties inside objects like spellEffect
  fixed = fixed.replace(/(\s*\w+):\s*{([^{}]*?)(\w+):\s+([^,{}]+)\s*\n\s*(\w+):/g, '$1: {$2$3: $4,\n    $5:');
  
  // Make sure there's a comma after every property:value pair that's followed by another property
  fixed = fixed.replace(/("[^"]*"|'[^']*'|\[[^\]]*\]|\d+|true|false|\w+)\s*\n\s*(\w+):/g, '$1,\n  $2:');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, fixed, 'utf8');
  log('Successfully fixed spellCards.ts');
} catch (error) {
  log(`Error: ${error.message}`, 'error');
}