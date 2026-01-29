/**
 * Special script to fix the cards.ts file with excessive duplicate class properties
 */

const fs = require('fs');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

function fixFile() {
  const filePath = 'client/src/game/data/cards.ts';
  log(`Processing ${filePath}...`);
  
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find all cards with excessive duplicate class properties
    const excessiveRegex = /(collectible:\s*true,\s*)class:\s*["']Neutral["'](?:,\s*class:\s*["']Neutral["'])+/g;
    const fixedContent = content.replace(excessiveRegex, '$1class: "Neutral"');
    
    // Also fix any standalone duplicate class properties
    const duplicateClassRegex = /class:\s*["'](\w+)["']\s*,(?:\s*class:\s*["']\w+["']\s*,)*\s*class:\s*["']\w+["']/g;
    const finalContent = fixedContent.replace(duplicateClassRegex, 'class: "$1"');
    
    // Write back if changes were made
    if (finalContent !== content) {
      fs.writeFileSync(filePath, finalContent);
      log(`Fixed excessive duplicate class properties in ${filePath}`);
    } else {
      log(`No excessive duplicate class properties found in ${filePath}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      log(`File ${filePath} not found`, 'error');
    } else {
      log(`Error processing ${filePath}: ${error.message}`, 'error');
    }
  }
}

function main() {
  fixFile();
}

main();