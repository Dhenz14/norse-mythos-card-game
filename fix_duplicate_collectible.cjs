/**
 * A specialized script to fix duplicate collectible properties in card definitions.
 * This script removes collectible properties from battlecry and deathrattle objects
 * while ensuring the property exists at the root level of each card.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

function findCardFiles() {
  const pattern = 'client/src/game/data/**/*.ts';
  return glob.sync(pattern);
}

function fixFile(filePath) {
  try {
    log(`Processing ${filePath}...`);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that don't contain card definitions
    if (!content.includes('deathrattle:') && !content.includes('battlecry:')) {
      log(`Skipping ${filePath} - no deathrattle or battlecry found`);
      return 0;
    }
    
    // Fix collectible property inside deathrattle
    const deathrattleCollectibleRegex = /deathrattle:\s*\{\s*[\s\S]*?collectible:\s*(?:true|false)[\s\S]*?\}/g;
    let matches = [...content.matchAll(deathrattleCollectibleRegex)];
    
    if (matches.length > 0) {
      matches.forEach(match => {
        const deathrattleBlock = match[0];
        const fixedBlock = deathrattleBlock.replace(/,\s*collectible:\s*(?:true|false)/g, '');
        content = content.replace(deathrattleBlock, fixedBlock);
      });
      
      log(`Fixed ${matches.length} deathrattle objects with collectible property in ${filePath}`);
    }
    
    // Fix collectible property inside battlecry
    const battlecryCollectibleRegex = /battlecry:\s*\{\s*[\s\S]*?collectible:\s*(?:true|false)[\s\S]*?\}/g;
    matches = [...content.matchAll(battlecryCollectibleRegex)];
    
    if (matches.length > 0) {
      matches.forEach(match => {
        const battlecryBlock = match[0];
        const fixedBlock = battlecryBlock.replace(/,\s*collectible:\s*(?:true|false)/g, '');
        content = content.replace(battlecryBlock, fixedBlock);
      });
      
      log(`Fixed ${matches.length} battlecry objects with collectible property in ${filePath}`);
    }
    
    // Write back changes
    fs.writeFileSync(filePath, content, 'utf8');
    return matches.length;
    
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'error');
    return 0;
  }
}

function main() {
  const files = findCardFiles();
  log(`Found ${files.length} card files to process`);
  
  let totalFixed = 0;
  files.forEach(file => {
    const fixCount = fixFile(file);
    totalFixed += fixCount;
  });
  
  log(`Fixed a total of ${totalFixed} deathrattle/battlecry objects with collectible property`);
}

main();