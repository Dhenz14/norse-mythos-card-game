/**
 * Highly targeted fix for specific issues in spellCards.ts
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
  
  // Fix issue at line ~708-709 where a standalone { appears after a card
  // We need to add a proper closing brace and comma to the previous card
  content = content.replace(/},\s*\n\s*\n\s*{/g, '}\n}, {');
  
  // Fix the issue with ]collectible: true
  content = content.replace(/collectible:\s*true,?\s*]\s*collectible:\s*true/g, 'collectible: true\n}, {');
  
  // Fix any remaining standalone { without proper formatting
  content = content.replace(/(?<![\[\{,])\s*\n\s*{/g, '\n}, {');
  
  // Fix duplicate closing tags
  content = content.replace(/}\s*},\s*{/g, '}\n}, {');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  log('Successfully fixed specific issues in spellCards.ts');
  
} catch (error) {
  log(`Error: ${error.message}`, 'error');
}