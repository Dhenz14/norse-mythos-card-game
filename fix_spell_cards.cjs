/**
 * Specialized script to fix syntax issues in spellCards.ts
 * This script focuses on fixing the syntax errors in line 26-29
 */

const fs = require('fs');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixSpellCards() {
  const filePath = './client/src/game/data/spellCards.ts';
  
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    log('Original content read successfully');
    
    // First, examine the area around line 25-29 specifically
    const lines = content.split('\n');
    const problemArea = lines.slice(19, 30).join('\n');
    log(`Problem area before fixing:\n${problemArea}`);
    
    // Direct fix for the specific problem area in lines 25-29
    const specificPattern = /heroClass: "priest",\s*class: "Priest",\s*spellEffect: {\s*type: "summon_copies",\s*source: "enemy_board",\s*modifyHealth: 1\s*,?\s*collectible: true\s*}/;
    const specificReplacement = `heroClass: "priest",
  class: "Priest",
  spellEffect: {
    type: "summon_copies",
    source: "enemy_board",
    modifyHealth: 1
  },
  collectible: true`;
    content = content.replace(specificPattern, specificReplacement);
    
    // Fix specific issue with missing comma between a card's closing brace and the next card's opening brace
    content = content.replace(/}\s*{/g, '},\n{');
    
    // Fix collectible property within effect objects
    content = content.replace(/(\b(spellEffect|battlecry|deathrattle|frenzy|effect)\s*:\s*\{[^\}]+)collectible\s*:\s*true([^\}]*\})/g, 
      (match, prefix, effectType, suffix) => {
        // Remove collectible from effect object
        const cleanedEffect = prefix + suffix;
        // Add collectible at the card level after the effect object
        return cleanedEffect + ',\n  collectible: true';
      }
    );
    
    // Fix missing commas between card properties
    content = content.replace(/(\w+):\s+([^,\n]+)\n\s+(\w+):/g, '$1: $2,\n  $3:');
    
    // Fix improperly indented properties
    content = content.replace(/\n\s{2,}(\w+):\s*{/g, '\n  $1: {');
    
    // Fix dangling commas at the end of objects
    content = content.replace(/,(\s*})/g, '$1');
    
    // Fix leading commas
    content = content.replace(/,\s*(\n\s*\w+:)/g, '$1');
    
    // Make sure collectible property has a comma after it when followed by another card
    content = content.replace(/collectible:\s*true\s*\n\s*{/g, 'collectible: true,\n{');
    
    // Fix missing commas after the complete card object
    content = content.replace(/}(\s*)(\n\s*{)/g, '},\n$2');
    
    // Examine the fixed content
    const fixedLines = content.split('\n');
    const fixedProblemArea = fixedLines.slice(19, 30).join('\n');
    log(`Problem area after fixing:\n${fixedProblemArea}`);
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Fixed issues in ${filePath}`);
  } catch (error) {
    log(`Failed to process ${filePath}: ${error.message}`, 'error');
  }
}

// Run the fix
fixSpellCards();