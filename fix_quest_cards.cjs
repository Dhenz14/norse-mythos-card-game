/**
 * Specialized script to fix the questCards.ts file
 * This file has issues with class properties not properly indented and missing commas.
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixQuestCards() {
  const filePath = './client/src/game/data/questCards.ts';
  
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Make a backup
    fs.writeFileSync(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Fix the structure
    
    // Fix class properties that are not properly indented
    content = content.replace(/^(\s*)class:/gm, '$1      class:');
    
    // Fix missing commas after class properties
    content = content.replace(/class: ["']([^"']*)["'](\s*)/g, 'class: "$1",\n      ');
    
    // Fix collectible property immediately following class without comma
    content = content.replace(/class: ["']([^"']*)["']collectible:/g, 'class: "$1",\n      collectible:');
    
    // Write back the fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    
    log(`Fixed questCards.ts file`);
    return true;
  } catch (error) {
    log(`Error fixing questCards.ts: ${error.message}`, 'error');
    return false;
  }
}

fixQuestCards();