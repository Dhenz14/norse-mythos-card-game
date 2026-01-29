/**
 * Fix Card Syntax Patterns
 * 
 * This script fixes common syntax errors in card files:
 * 1. Missing commas before "class" property
 * 2. Missing commas between properties
 * 3. Misplaced collectible properties
 * 4. Extra closing braces
 * 5. Incorrect indentation
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Files to fix
const filesToFix = [
  './client/src/game/data/cards.ts',
  './client/src/game/data/classMinions.ts',
  './client/src/game/data/additionalSpellCards.ts',
  './client/src/game/data/additionalClassMinions.ts',
  './client/src/game/data/mechanicCards.ts',
  './client/src/game/data/modernLegendaryCards.ts',
  './client/src/game/data/iconicLegendaryCards.ts',
  './client/src/game/data/echoCards.ts',
  './client/src/game/data/expansionLegendaryCards.ts',
  './client/src/game/data/neutralMinions.ts',
  './client/src/game/data/rebornCards.ts',
  './client/src/game/data/recruitCards.ts',
  './client/src/game/data/rushLifestealCards.ts',
  './client/src/game/data/overloadCards.ts',
  './client/src/game/data/pirateCards.ts',
  './client/src/game/data/questCards.ts',
  './client/src/game/data/outcastCards.ts',
  './client/src/game/data/coldlightTestData.ts',
  './client/src/game/data/colossalCards.ts',
  './client/src/game/data/comboCards.ts',
  './client/src/game/data/corruptCards.ts',
  './client/src/game/data/discoverCards.ts',
  './client/src/game/data/dormantCards.ts',
  './client/src/game/data/dualClassCards.ts',
  './client/src/game/data/neutralSpellsAndTech.ts',
  './client/src/game/data/newSpellCards.ts',
  './client/src/game/data/oldGodsCards.ts',
  './client/src/game/data/classCards.ts'
];

// Fix specific patterns in a file
function fixPatternsInFile(filePath) {
  try {
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Make a backup
    fs.writeFileSync(`${filePath}.backup-${Date.now()}`, content, 'utf8');
    
    // Fix common patterns
    
    // 1. Fix improper "class" property placement
    content = content.replace(/, class:/g, ',\n      class:');
    content = content.replace(/(\s+), class:/g, '$1\n      class:');
    content = content.replace(/(\s+)class: "([^"]*)"/g, '$1class: "$2"');
    
    // 2. Fix "collectible: true" appearing at the wrong indentation level
    content = content.replace(/\}(\s*)collectible: true/g, '},\n      collectible: true');
    content = content.replace(/(\s+)\}(\s*)collectible:/g, '$1},\n      collectible:');
    
    // 3. Fix class and collectible properties
    content = content.replace(/(\s+)class: ['"]([^'"]*)['"]\s*collectible: (true|false)/g, 
      '$1class: "$2",\n      collectible: $3');
    
    // 4. Fix brackets without commas
    content = content.replace(/(\s+)\]\s*collectible:/g, '$1],\n      collectible:');
    
    // 5. Fix missing commas after properties
    content = content.replace(/(\s+)([a-zA-Z]+): (true|false|[0-9]+|"[^"]*"|'[^']*'|\[[^\]]*\])\s+([a-zA-Z]+):/g,
      '$1$2: $3,\n      $4:');
      
    // 6. Fix missing comma between class and collectible
    content = content.replace(/class: ['"]([^'"]*)['"]\s*collectible:/g, 
      'class: "$1",\n      collectible:');
    
    // 7. Fix comma at start of line
    content = content.replace(/^(\s*),\s*class:/gm, '$1class:');
    
    // 8. Fix specific pattern for cards.ts
    content = content.replace(/race: ['"]([^'"]*)['"](,?)\s+class:/g, 
      'race: "$1",\n      class:');
    
    // 9. Fix missing comma in chooseOneOptions
    content = content.replace(/(\s+)\}(\s*)\]/g, '$1}\n      ]');
    
    // 10. Fix collectible property after closing brace
    content = content.replace(/(\s+)\}(\s*)collectible:/g, '$1},\n      collectible:');
    
    // 11. Fix direct pattern with class
    content = content.replace(/class: ['"]([^'"]*)['"]\s*collectible: (true|false)(,?)/g, 
      'class: "$1",\n      collectible: $2$3');
    
    // 12. Fix double closing brackets
    content = content.replace(/\}\s*\},/g, '}\n    },');
    
    // 13. Fix collectible property after array
    content = content.replace(/(\s+)\](\s*)collectible:/g, '$1],\n      collectible:');
    
    // 14. Fix the common }collectible: pattern in mechanicCards.ts
    content = content.replace(/(\s+)\}collectible:/g, '$1},\n      collectible:');
    
    // 15. Fix specific pattern for mechanicCards.ts
    content = content.replace(/collectible: (true|false)\];/g, 'collectible: $1\n];');
    
    // 16. Fix specifically for iconicLegendaryCards.ts
    content = content.replace(/class: ['"]([^'"]*)['"]\s*collectible: (true|false),/g, 
      'class: "$1",\n      collectible: $2,');
      
    // 17. More specific pattern for iconic legendary cards
    content = content.replace(/heroClass: ['"]([^'"]*)['"](,?) class: ['"]([^'"]*)['"]\s*collectible: (true|false)/g,
      'heroClass: "$1"$2\n      class: "$3",\n      collectible: $4');
      
    // 18. Fix for echoCards.ts
    content = content.replace(/collectible: (true|false)\]\s*;?/g, 'collectible: $1\n];');
    
    // 19. Fix for numeric values followed by collectible
    content = content.replace(/([0-9]+)collectible:/g, '$1,\n      collectible:');
    
    // 20. Fix for race property followed by collectible
    content = content.replace(/race: ['"]([^'"]*)['"]\s*collectible:/g, 'race: "$1",\n      collectible:');
    
    // 21. Fix for neutralMinions.ts specific issues
    content = content.replace(/^(\s*)collectible: (true|false)$/gm, '$1collectible: $2,');
    
    // 22. Fix for modernLegendaryCards.ts standalone deathrattle property
    content = content.replace(/^deathrattle:/gm, '      deathrattle:');
    
    // 23. Fix for standalone class property
    content = content.replace(/^(\s*)class: ["']([^"']*)["']$/gm, '$1class: "$2",');
    
    // 24. Fix for standalone property that should be part of an object
    content = content.replace(/^{$/gm, '  {');
    
    // 25. Fix for isolated properties
    content = content.replace(/,\s*{/g, ',\n  {');
    
    // 26. Fix for rebornCards.ts
    content = content.replace(/heroClass: ['"]([^'"]*)['"](,?) class: ['"]([^'"]*)['"]\s*$/gm, 
      'heroClass: "$1"$2\n      class: "$3",');
    
    // 27. Fix for rebornCards.ts collectible at end of line
    content = content.replace(/collectible: (true|false)]\s*;?$/gm, 'collectible: $1\n];');
    
    // 28. Fix for rushLifestealCards.ts specific issue
    content = content.replace(/^(\s*), class:/gm, '$1class:');
    
    // 29. More specific fix for recruitCards.ts
    content = content.replace(/}collectible: (true|false)/g, '},\n      collectible: $1');
    
    // 30. Fix for overloadCards.ts standalone property
    content = content.replace(/^overload:/gm, '      overload:');
    
    // 31. Fix for pirateCards.ts specific pattern
    content = content.replace(/([0-9]+)collectible:/g, '$1,\n      collectible:');
    
    // 32. Fix for questCards.ts duplicate collectible
    content = content.replace(/collectible: (true|false)collectible:/g, 'collectible: $1,\n      collectible:');
    
    // 33. Fix for questCards.ts specific pattern
    content = content.replace(/, class: ["']([^"']*)["']collectible:/g, ',\n      class: "$1",\n      collectible:');
    
    // 34. Remove trailing commas at the end of array declarations
    content = content.replace(/\];,/g, '\n];');
    
    // 35. Fix missing semicolons after array declarations
    content = content.replace(/\]$\n/gm, '];\n');
    
    // 36. Fix for outcastCards.ts standalone property
    content = content.replace(/^outcastEffect:/gm, '      outcastEffect:');
    
    // 37. Fix for newSpellCards.ts
    content = content.replace(/collectible: (true|false)];/g, 'collectible: $1\n];');
    
    // 38. Fix for neutralSpellsAndTech.ts
    content = content.replace(/(\s+)battlecry: {/g, '$1      battlecry: {');
    
    // 39. Fix for multiple class definitions
    content = content.replace(/(class: ["'][^"']*["']),\s*class:/g, '$1');
    
    // 40. Fix for oldGodsCards.ts specific pattern
    content = content.replace(/targetType: ["'][^"']*["']collectible:/g, 'targetType: "$1",\n      collectible:');
    
    // 41. Fix for class property after collectible
    content = content.replace(/collectible: (true|false), class:/g, 'collectible: $1,\n      class:');
    
    // 42. Fix for battlecry property
    content = content.replace(/battlecry: {([^}]*)}collectible:/g, 'battlecry: {$1},\n      collectible:');
    
    // Write back the fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    
    log(`Fixed patterns in ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    log(`Error fixing ${path.basename(filePath)}: ${error.message}`, 'error');
    return false;
  }
}

// Main function
function main() {
  let successCount = 0;
  
  for (const file of filesToFix) {
    if (fixPatternsInFile(file)) {
      successCount++;
    }
  }
  
  log(`Successfully fixed ${successCount} of ${filesToFix.length} files`);
}

main();