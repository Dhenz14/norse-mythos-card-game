/**
 * Deep fix for spellCards.ts syntax errors
 * 
 * This script focuses on fixing particularly problematic patterns in the spellCards.ts file:
 * 1. Missing closing braces for nested objects (spellEffect, battlecry, etc)
 * 2. Missing commas after collectible property
 * 3. Duplicate collectible properties
 * 4. Broken object structures
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

try {
  const filePath = './client/src/game/data/spellCards.ts';
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // First pass - fix the collectible property immediately after closing braces
  // This fixes patterns like "}collectible: true"
  content = content.replace(/}(\s*)collectible:/g, '},\n  collectible:');
  
  // Second pass - fix missing commas after collectible: true
  content = content.replace(/collectible:\s*true(\s*)(?!,|\s*})/g, 'collectible: true,');
  
  // Third pass - fix the specific duplicated collectible: true pattern
  content = content.replace(/collectible:\s*true}collectible:\s*true/g, 'collectible: true\n}, {\n  collectible: true');
  
  // Fourth pass - ensure proper commas after all property values (except the last one in an object)
  // This is more comprehensive and handles many edge cases
  content = content.replace(/(".*?"|true|false|\d+|\[\]|\[[^\]]+\]|\{[^}]+\})(\s*)(\n\s*\w+:)/g, '$1,$2$3');
  
  // Fifth pass - fix spacing and indentation for nested objects
  content = content.replace(/(\w+):\s*{([^{}]*)}/g, (match, propName, innerContent) => {
    // Process the inner content of the object
    const formattedContent = innerContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map(line => {
        // Ensure property lines end with commas except for the last line
        if (!line.endsWith(',') && !line.endsWith('}') && line.includes(':')) {
          return line + ',';
        }
        return line;
      })
      .join('\n    ');
    
    return `${propName}: {\n    ${formattedContent}\n  }`;
  });
  
  // Final cleanup - check for any edge cases we might have missed
  content = content.replace(/,(\s*)(})/g, '$1$2'); // Remove trailing commas inside objects
  content = content.replace(/}(\s*),(\s*)}/g, '}$1$2}'); // Fix nested object closing
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  log('Successfully fixed spellCards.ts with deep fixes');
  
  // Output a backup just in case
  fs.writeFileSync(filePath + '.backup', content, 'utf8');
  log('Created backup file: ' + filePath + '.backup');
  
} catch (error) {
  log(`Error: ${error.message}`, 'error');
}