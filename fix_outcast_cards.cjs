/**
 * Specialized script to fix the outcastCards.ts file
 * This file has multiple structural issues with outcastEffect properties appearing outside
 * of their proper card objects.
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixOutcastCards() {
  const filePath = './client/src/game/data/outcastCards.ts';
  
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Make a backup
    fs.writeFileSync(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Fix the structure - this is a more aggressive replacement
    // We need to find standalone outcastEffect properties and properly associate them with their card objects
    
    // First, fix the pattern where outcastEffect appears at the beginning of a line (not indented properly)
    content = content.replace(/^outcastEffect:/gm, '      outcastEffect:');
    
    // Fix collectible property that appears after an outcastEffect block
    content = content.replace(/}(\s*)collectible:/g, '},\n      collectible:');
    
    // Fix standalone card objects that appear after a collectible property
    content = content.replace(/(\s+)collectible: (true|false)(\s*)\n(\s*){/g, 
      '$1collectible: $2,\n$4{');
    
    // Remove any standalone card objects that aren't part of the array
    content = content.replace(/^{(\s*)/gm, '  {$1');
    
    // Add missing commas between card objects
    content = content.replace(/}(\s*){/g, '},\n  {');
    
    // Fix closing array syntax
    content = content.replace(/collectible: (true|false)]/g, 'collectible: $1\n];');
    
    // Write back the fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    
    log(`Fixed outcastCards.ts file`);
    return true;
  } catch (error) {
    log(`Error fixing outcastCards.ts: ${error.message}`, 'error');
    return false;
  }
}

fixOutcastCards();