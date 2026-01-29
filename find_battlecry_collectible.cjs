/**
 * Script to find battlecry objects incorrectly marked as collectible
 * 
 * This script searches through all card data files to find any battlecry, deathrattle,
 * or effect objects that have been incorrectly marked as collectible.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to log messages
function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

// Pattern to find battlecry, deathrattle, spellEffect objects with collectible: true
const patterns = [
  /battlecry\s*:\s*{[^}]*collectible\s*:\s*true/g,
  /deathrattle\s*:\s*{[^}]*collectible\s*:\s*true/g,
  /spellEffect\s*:\s*{[^}]*collectible\s*:\s*true/g,
  /effect\s*:\s*{[^}]*collectible\s*:\s*true/g,
  /type\s*:\s*['"]discover['"][^}]*collectible\s*:\s*true/g
];

// Find all card data files
function findAllCardFiles() {
  return glob.sync('client/src/game/data/**/*.ts');
}

// Find problematic objects in a file
function findProblematicObjects(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      
      if (matches && matches.length > 0) {
        log(`Found ${matches.length} problematic collectible object(s) in ${filePath}:`, 'warn');
        
        for (const match of matches) {
          log(`  - ${match.substring(0, 100)}...`, 'warn');
          
          // Try to get some context around the match
          const matchIndex = content.indexOf(match);
          const start = Math.max(0, matchIndex - 100);
          const end = Math.min(content.length, matchIndex + match.length + 100);
          const context = content.substring(start, end);
          
          log(`Context: ${context}`, 'warn');
        }
      }
    }
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'error');
  }
}

// Find all discover objects directly in a card array
function findProblematicDiscoverObjects(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for patterns like: type: "discover" ... collectible: true
    // but not inside a battlecry or spellEffect
    const matches = content.match(/type\s*:\s*['"]discover['"][^}]*collectible\s*:\s*true/g);
    
    if (matches && matches.length > 0) {
      log(`Found ${matches.length} problematic discover objects in ${filePath}:`, 'warn');
      
      for (const match of matches) {
        log(`  - ${match.substring(0, 100)}...`, 'warn');
        
        // Get context
        const matchIndex = content.indexOf(match);
        const start = Math.max(0, matchIndex - 100);
        const end = Math.min(content.length, matchIndex + match.length + 100);
        const context = content.substring(start, end);
        
        log(`Context: ${context}`, 'warn');
      }
    }
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'error');
  }
}

// Main function
function main() {
  const files = findAllCardFiles();
  log(`Found ${files.length} card data files.`);
  
  for (const file of files) {
    findProblematicObjects(file);
    findProblematicDiscoverObjects(file);
  }
}

// Run the script
main();