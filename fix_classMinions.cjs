/**
 * Script to fix all syntax issues in classMinions.ts using a line-by-line approach
 */
const fs = require('fs');

const filePath = './client/src/game/data/classMinions.ts';

// Create a backup
const content = fs.readFileSync(filePath, 'utf8');
const backupPath = `${filePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);

// Split the file into lines for more precise manipulation
const lines = content.split('\n');
const fixedLines = [];

// Track the current state
let inObject = false;
let lastNonEmptyLine = '';
let lineNeedsFix = false;

// Process each line
lines.forEach((line, index) => {
  let modifiedLine = line;
  
  // Check for end of an object with incorrect collectible property
  if (line.trim().startsWith('collectible:') && inObject) {
    // If the last line was a property without a comma, fix it
    if (lastNonEmptyLine.trim().match(/^[a-zA-Z0-9_]+:/) && !lastNonEmptyLine.trim().endsWith(',')) {
      fixedLines[fixedLines.length - 1] = lastNonEmptyLine + ',';
    }
    modifiedLine = '    ' + line.trim();
  }
  
  // Track object nesting
  if (line.includes('{')) {
    inObject = true;
  }
  if (line.includes('}')) {
    inObject = false;
  }
  
  // Detect a property that needs a comma before collectible
  if (line.trim().match(/^[a-zA-Z0-9_]+:\s*(\[\]|".+"|[a-zA-Z0-9_]+)$/) && 
      index + 1 < lines.length && 
      lines[index + 1].trim().startsWith('collectible:')) {
    modifiedLine = line + ',';
    lineNeedsFix = true;
  }
  
  fixedLines.push(modifiedLine);
  
  // Keep track of the last non-empty line for context
  if (line.trim()) {
    lastNonEmptyLine = line;
  }
});

// Join the fixed lines back together
let fixedContent = fixedLines.join('\n');

// Do final regex fixes for any remaining issues
// Fix patterns where we have: keywords: [...] collectible: true}
fixedContent = fixedContent.replace(/(\w+): (\[[\w, "]*\])\s*collectible:/g, '$1: $2,\n    collectible:');

// Fix patterns where we have: race: "..." collectible: true}
fixedContent = fixedContent.replace(/(\w+): (".*?")\s*collectible:/g, '$1: $2,\n    collectible:');

// Fix patterns where we have: spellPower: 1 collectible:
fixedContent = fixedContent.replace(/(\w+): (\d+)\s*collectible:/g, '$1: $2,\n    collectible:');

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent);

console.log(`Successfully fixed ${filePath}`);