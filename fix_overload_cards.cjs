/**
 * Specialized script to fix the overloadCards.ts file
 * This file has multiple structural issues with overload properties appearing outside
 * of their proper card objects.
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixOverloadCards() {
  const filePath = './client/src/game/data/overloadCards.ts';
  
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Make a backup
    fs.writeFileSync(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Fix the structure
    
    // First, fix the pattern where overload appears at the beginning of a line
    content = content.replace(/^(\s*)overload:/gm, '$1      overload:');
    
    // Fix standalone card objects that appear after properties
    content = content.replace(/(\s+)}\s*\n\s*{/g, '$1},\n  {');
    
    // Fix class properties that are not properly indented
    content = content.replace(/^(\s*)class:/gm, '$1      class:');
    
    // Remove any standalone card objects that aren't part of the array
    content = content.replace(/^{(\s*)/gm, '  {$1');
    
    // Fix missing commas after closing braces in objects
    content = content.replace(/}(\s*){/g, '},\n  {');
    
    // Fix closing array syntax
    content = content.replace(/^];/gm, '\n];');
    
    // Write back the fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    
    log(`Fixed overloadCards.ts file`);
    return true;
  } catch (error) {
    log(`Error fixing overloadCards.ts: ${error.message}`, 'error');
    return false;
  }
}

fixOverloadCards();