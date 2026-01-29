/**
 * Script to fix duplicate class properties in discoverCards.ts
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

function fixFile(filePath) {
  log(`Processing ${filePath}...`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find and fix all instances of duplicate class property
  const heroclassRegex = /heroClass:\s*['"](\w+)['"]/g;
  const matches = [...content.matchAll(heroclassRegex)];
  
  let fixCount = 0;
  
  matches.forEach(match => {
    const heroClass = match[1];
    const capitalized = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
    
    // Create a regex for the specific instance
    const duplicateRegex = new RegExp(`class:\\s*["']${capitalized}["']\\s*,\\s*class:\\s*["']\\w+["']`, 'g');
    if (duplicateRegex.test(content)) {
      content = content.replace(duplicateRegex, `class: "${capitalized}"`);
      fixCount++;
    }
    
    // Also fix collectible: true, class: "Neutral" when heroClass is already set
    const neutralDuplicateRegex = new RegExp(`heroClass:\\s*["']${heroClass}["'].*?collectible:\\s*true,\\s*class:\\s*["']Neutral["']`, 's');
    if (neutralDuplicateRegex.test(content)) {
      content = content.replace(neutralDuplicateRegex, (match) => {
        return match.replace(/, class: "Neutral"/, '');
      });
      fixCount++;
    }
  });
  
  // Also fix any standalone collectible: true, class: "Neutral" when class is already defined
  const classRegex = /class:\s*["'](\w+)["'].*?collectible:\s*true,\s*class:\s*["']Neutral["']/gs;
  if (classRegex.test(content)) {
    content = content.replace(classRegex, (match, className) => {
      return match.replace(/, class: "Neutral"/, '');
    });
    fixCount++;
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  
  log(`Fixed ${fixCount} duplicate class properties in ${filePath}`);
  return fixCount;
}

function main() {
  const filePath = 'client/src/game/data/discoverCards.ts';
  fixFile(filePath);
}

main();