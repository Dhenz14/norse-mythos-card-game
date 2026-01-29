/**
 * Script to systematically update properties across card files
 * This version is specifically focused on fixing the neutralMinions.ts file
 */

import fs from 'fs';
import path from 'path';

const filePath = 'client/src/game/data/neutralMinions.ts';
const backupPath = 'client/src/game/data/neutralMinions.ts.bak';

// Create a backup
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at: ${backupPath}`);

let content = fs.readFileSync(filePath, 'utf8');

// Replace $2 variable placeholders with appropriate values
content = content.replace(/targetType: \$2/g, 'targetType: "any"');
content = content.replace(/heroClass: \$2/g, 'heroClass: "neutral"');
content = content.replace(/race: \$2/g, 'race: "none"');
content = content.replace(/requiresTarget: \$2/g, 'requiresTarget: false');
content = content.replace(/value: \$2/g, 'value: 1');
content = content.replace(/summonCardId: \$2/g, 'summonCardId: 30044');

// Now reconstruct the file more carefully to ensure no duplicate collectible properties
const lines = content.split('\n');
let newLines = [];
let inCardObject = false;
let collectibleFound = false;
let insideBattlecryObj = false;
let insideDeathrattleObj = false;
let bracketCount = 0;

for (let line of lines) {
  // Track object boundaries
  const openBracketCount = (line.match(/{/g) || []).length;
  const closeBracketCount = (line.match(/}/g) || []).length;
  
  if (line.includes('{')) {
    bracketCount += openBracketCount;
  }
  
  if (line.includes('}')) {
    bracketCount -= closeBracketCount;
  }

  // Detect if we're starting a new card object
  if (line.trim() === '{') {
    inCardObject = true;
    collectibleFound = false;
  }
  
  // Track if we're inside a battlecry or deathrattle object
  if (inCardObject && line.includes('battlecry: {')) {
    insideBattlecryObj = true;
  }
  
  if (inCardObject && line.includes('deathrattle: {')) {
    insideDeathrattleObj = true;
  }
  
  // Exit battlecry/deathrattle object tracking
  if ((insideBattlecryObj || insideDeathrattleObj) && line.trim() === '},') {
    insideBattlecryObj = false;
    insideDeathrattleObj = false;
  }

  // Skip collectible property inside battlecry/deathrattle objects
  if ((insideBattlecryObj || insideDeathrattleObj) && line.includes('collectible:')) {
    continue;
  }
  
  // Track if we've already found the collectible property for this card
  if (inCardObject && !insideBattlecryObj && !insideDeathrattleObj && line.includes('collectible:')) {
    if (collectibleFound) {
      continue; // Skip duplicate collectible property
    }
    collectibleFound = true;
  }
  
  // Detect if we're ending a card object
  if (inCardObject && line.trim() === '},') {
    // If we haven't found a collectible property, add one before the closing bracket
    if (!collectibleFound) {
      newLines.push('    collectible: true,');
    }
    inCardObject = false;
  }
  
  // Add the line to our new content
  newLines.push(line);
}

// Write back the fixed content
const newContent = newLines.join('\n');
fs.writeFileSync(filePath, newContent, 'utf8');
console.log(`Updated ${filePath}`);
