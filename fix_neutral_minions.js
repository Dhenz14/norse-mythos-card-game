/**
 * Script to systematically update properties across card files
 * This version is specifically focused on fixing the neutralMinions.ts file
 */

import fs from 'fs';

const filePath = 'client/src/game/data/neutralMinions.ts';

try {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Back up the original file
  fs.copyFileSync(filePath, `${filePath}.bak`);
  
  // Fix the comma issues and remove collectible properties from inside objects
  
  // Method 1: Direct replacement for specific lines we know are problematic
  
  // Fix line 93 - Coldlight Oracle battlecry
  content = content.replace(/requiresTarget: false(\s*)collectible: true(\s*)}/, 'requiresTarget: false\n    }');
  
  // Fix line 110 - Faceless Manipulator battlecry
  content = content.replace(/targetType: "any"(\s*)collectible: true(\s*)}/, 'targetType: "any"\n    }');
  
  // Fix line 167 - Twilight Drake battlecry
  content = content.replace(/requiresTarget: false(\s*)collectible: true(\s*)}/, 'requiresTarget: false\n    }');
  
  // Fix line 213 - Gentle Megasaur battlecry
  content = content.replace(/requiresTarget: false(\s*)collectible: true(\s*)}/, 'requiresTarget: false\n    }');
  
  // Fix line 230 - Spiteful Summoner battlecry
  content = content.replace(/requiresTarget: false(\s*)collectible: true(\s*)}/, 'requiresTarget: false\n    }');
  
  // Fix line 303 - Skulking Geist battlecry
  content = content.replace(/targetType: "any"(\s*)collectible: true(\s*)}/, 'targetType: "any"\n    }');
  
  // Fix line 322 - Primordial Drake battlecry
  content = content.replace(/targetType: "any"(\s*)collectible: true(\s*)}/, 'targetType: "any"\n    }');
  
  // Fix line 565 - Scrapyard Colossus deathrattle
  content = content.replace(/summonCardId: 30044(\s*)collectible: true(\s*)}/, 'summonCardId: 30044\n    }');
  
  // Fix line 658 - Muckmorpher battlecry
  content = content.replace(/value: 1(\s*)collectible: true(\s*)}/, 'value: 1\n    }');
  
  // Method 2: Generic pattern replacements for other issues
  
  // Fix any remaining collectible properties inside battlecry/deathrattle objects
  content = content.replace(/(\s*)collectible: true(\s*)}/g, '$1}');
  
  // Remove duplicate collectible properties (keeping only the root level one)
  content = content.replace(/}(\s*),(\s*)collectible: true(\s*)}(\s*),(\s*)collectible: true/g, '}$1$2}$4,$5collectible: true');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content);
  
  console.log(`Fixed neutral minions file: ${filePath}`);
  console.log(`Original file backed up as ${filePath}.bak`);
  
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}