/**
 * Specialized script to fix the oldGodsCards.ts file
 * This file has multiple structural issues with complex nested objects
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixOldGodsCards() {
  const filePath = './client/src/game/data/oldGodsCards.ts';
  
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Make a backup
    fs.writeFileSync(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Fix targetType followed immediately by collectible property
    content = content.replace(/targetType: ["']([^"']*)["']collectible:/g, 'targetType: "$1",\n      collectible:');
    
    // Fix collectible followed by closing brace without comma
    content = content.replace(/(\s+)collectible: (true|false)(\s*)\n(\s*)\}/g, '$1collectible: $2$3\n$4},');
    
    // Fix standalone comma followed by class
    content = content.replace(/^(\s*), class:/gm, '$1class:');
    
    // Fix closing brace followed immediately by collectible
    content = content.replace(/\}collectible:/g, '},\n      collectible:');
    
    // Fix class property with duplicate definitions
    content = content.replace(/(class: ["'][^"']*["']),\s*class:/g, '$1');
    
    // Fix standalone property that should be part of an object
    content = content.replace(/^{(\s*)/gm, '  {$1');
    
    // Fix collectible at the end of an object without closing brace
    content = content.replace(/collectible: (true|false)(\s*)\n(\s*){/g, 'collectible: $1$2\n$3},\n$3{');
    
    // Fix missing comma after target
    content = content.replace(/target: ([0-9]+)(\s*)/g, 'target: $1,$2');
    
    // Fix missing closing braces and semicolons in array declarations
    content = content.replace(/(\s*)collectible: (true|false)(\s*)\n(\s*)\]\s*;?/g, '$1collectible: $2$3\n$4}\n];');
    
    // Write back the fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    
    log(`Fixed oldGodsCards.ts file`);
    return true;
  } catch (error) {
    log(`Error fixing oldGodsCards.ts: ${error.message}`, 'error');
    return false;
  }
}

fixOldGodsCards();