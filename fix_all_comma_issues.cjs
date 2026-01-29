/**
 * Comprehensive script to fix comma issues in all card files
 * 
 * This script addresses the following issues:
 * 1. Dangling commas inside objects
 * 2. Missing commas between properties
 * 3. Extra commas before properties
 * 4. Incorrectly placed collectible properties that should be at the root level
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

function fixCommaIssues(content) {
  // Fix collectible property inside effect objects (battlecry, deathrattle, spellEffect, etc.)
  content = content.replace(/(\b(spellEffect|battlecry|deathrattle|frenzy|effect)\s*:\s*\{[^\}]+)collectible\s*:\s*true([^\}]*\})/g, 
    (match, prefix, effectType, suffix) => {
      // Remove collectible from effect object
      const cleanedEffect = prefix + suffix;
      // Add collectible at the card level after the effect object
      return cleanedEffect + ',\n  collectible: true';
    }
  );
  
  // Fix leading commas before properties (e.g., ", collectible: true")
  content = content.replace(/,(\s*[\n\r]\s*)collectible:/g, '$1collectible:');
  
  // Fix issue with double commas (e.g., "targetType: 'none',," or ",, collectible: true")
  content = content.replace(/,\s*,/g, ',');
  
  // Fix dangling commas at the end of objects
  content = content.replace(/,(\s*})/g, '$1');
  
  // Fix missing commas between card objects
  content = content.replace(/}(\s*){/g, '},\n$1{');
  
  // Fix comma after spellEffect object followed immediately by new card
  content = content.replace(/}(\s*)\n(\s*){/g, '}\n$1,\n$2{');
  
  return content;
}

function processFile(filePath) {
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix comma issues
    const fixedContent = fixCommaIssues(content);
    
    // Write the fixed content back to the file
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      log(`Fixed issues in ${filePath}`);
    } else {
      log(`No issues found in ${filePath}`);
    }
  } catch (error) {
    log(`Failed to process ${filePath}: ${error.message}`, 'error');
  }
}

function findCardFiles() {
  const dataDir = './client/src/game/data';
  try {
    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(dataDir, file));
    return Promise.resolve(files);
  } catch (error) {
    return Promise.reject(error);
  }
}

async function main() {
  try {
    const files = await findCardFiles();
    log(`Found ${files.length} card files to process`);
    
    for (const file of files) {
      processFile(file);
    }
    
    log('Finished processing all files');
  } catch (error) {
    log(error.message, 'error');
  }
}

// Run the script
main();