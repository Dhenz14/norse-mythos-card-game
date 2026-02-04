/**
 * Comprehensive script to fix duplicate class properties in card files
 * 
 * This script addresses the following common issues:
 * 1. Duplicate class properties at the root level of card objects
 * 2. Class properties inside effect objects (battlecry, deathrattle, etc.)
 * 3. Misplaced collectible properties
 * 4. Inconsistent formatting and indentation
 * 
 * Usage:
 * ```
 * node fix_duplicate_class_properties.js [--dry-run] [--file=path/to/file.ts]
 * ```
 * 
 * Options:
 * --dry-run: Don't actually modify files, just show what would be changed
 * --file: Process only a specific file
 */

const fs = require('fs');
const path = require('path');

// Configuration
const dryRun = process.argv.includes('--dry-run');
const specificFile = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1];

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR:' :
                level === 'warning' ? '⚠️ WARNING:' :
                level === 'success' ? '✅ SUCCESS:' : 'ℹ️ INFO:';
  console.log(`${prefix} ${message}`);
}

/**
 * Extract card objects from file content
 */
function extractCardObjects(content) {
  // This regex matches complete card objects including nested objects
  const cardRegex = /\{[^{]*?id\s*:\s*\d+[^{}]*?(\{[^{}]*\}[^{}]*)*?\}/gs;
  return [...content.matchAll(cardRegex)].map(match => match[0]);
}

/**
 * Fix a single card's duplicate properties
 */
function fixCardProperties(cardString) {
  // Extract card ID and name for logging
  const idMatch = cardString.match(/id\s*:\s*(\d+)/);
  const nameMatch = cardString.match(/name\s*:\s*"([^"]*)"/);
  
  const id = idMatch ? idMatch[1] : 'unknown';
  const name = nameMatch ? nameMatch[1] : 'Unknown Card';
  
  // Check for duplicate class properties
  const classMatches = [...cardString.matchAll(/class\s*:\s*"([^"]*)"/g)];
  
  if (classMatches.length > 1) {
    log(`Card ${id} (${name}) has ${classMatches.length} class properties`, 'warning');
    
    // Get the first class value
    const firstClass = classMatches[0][1];
    
    // Remove all class properties
    let fixedCard = cardString.replace(/,?\s*class\s*:\s*"[^"]*"/g, '');
    
    // Add back a single class property at the root level
    fixedCard = fixedCard.replace(/\}\s*\}*$/, `, class: "${firstClass}"\n}`);
    
    return fixedCard;
  }
  
  // Check for class property in effect objects (battlecry, deathrattle, etc.)
  const effectWithClassRegex = /(\{[^\{}]*)(,?\s*class\s*:\s*"[^"]*")([^\{}]*\})/g;
  let fixedCard = cardString;
  let effectWithClass = false;
  
  if (effectWithClassRegex.test(cardString)) {
    log(`Card ${id} (${name}) has class property in an effect object`, 'warning');
    effectWithClass = true;
    
    // Extract the class value from the effect
    const effectClassMatch = cardString.match(/\{[^\{}]*,?\s*class\s*:\s*"([^"]*)"[^\{}]*\}/);
    const effectClass = effectClassMatch ? effectClassMatch[1] : 'Neutral';
    
    // Remove class from effects
    fixedCard = fixedCard.replace(effectWithClassRegex, '$1$3');
    
    // Check if card already has a class at root level
    const hasRootClass = /class\s*:\s*"[^"]*"(?![^\{}]*\})/.test(fixedCard);
    
    // Add class at root level if needed
    if (!hasRootClass) {
      fixedCard = fixedCard.replace(/\}\s*\}*$/, `, class: "${effectClass}"\n}`);
    }
  }
  
  // Check for duplicate collectible properties
  const collectibleMatches = [...cardString.matchAll(/collectible\s*:\s*(true|false)/g)];
  
  if (collectibleMatches.length > 1) {
    log(`Card ${id} (${name}) has ${collectibleMatches.length} collectible properties`, 'warning');
    
    // Get the first collectible value
    const firstCollectible = collectibleMatches[0][1];
    
    // Remove all collectible properties
    fixedCard = fixedCard.replace(/,?\s*collectible\s*:\s*(true|false)/g, '');
    
    // Add back a single collectible property at the root level
    fixedCard = fixedCard.replace(/\}\s*\}*$/, `, collectible: ${firstCollectible}\n}`);
  }
  
  // Check for collectible property in effect objects
  const effectWithCollectibleRegex = /(\{[^\{}]*)(,?\s*collectible\s*:\s*(true|false))([^\{}]*\})/g;
  
  if (effectWithCollectibleRegex.test(fixedCard)) {
    log(`Card ${id} (${name}) has collectible property in an effect object`, 'warning');
    
    // Extract the collectible value from the effect
    const effectCollectibleMatch = fixedCard.match(/\{[^\{}]*,?\s*collectible\s*:\s*(true|false)[^\{}]*\}/);
    const effectCollectible = effectCollectibleMatch ? effectCollectibleMatch[1] : 'true';
    
    // Remove collectible from effects
    fixedCard = fixedCard.replace(effectWithCollectibleRegex, '$1$4');
    
    // Check if card already has a collectible at root level
    const hasRootCollectible = /collectible\s*:\s*(true|false)(?![^\{}]*\})/.test(fixedCard);
    
    // Add collectible at root level if needed
    if (!hasRootCollectible) {
      fixedCard = fixedCard.replace(/\}\s*\}*$/, `, collectible: ${effectCollectible}\n}`);
    }
  }
  
  // Fix formatting if changes were made
  if (fixedCard !== cardString || effectWithClass) {
    // Make sure nested objects are properly formatted
    fixedCard = fixedCard.replace(/,\s*\}/g, '\n  }');
    
    // Ensure consistent indentation
    const lines = fixedCard.split('\n');
    const indentedLines = lines.map(line => {
      // Determine indentation level based on brackets
      const openBrackets = (line.match(/\{/g) || []).length;
      const closeBrackets = (line.match(/\}/g) || []).length;
      
      // Clean up the line
      let trimmedLine = line.trim();
      
      // Add proper indentation
      const indent = '  '.repeat(Math.max(1, 1 + openBrackets - closeBrackets));
      return indent + trimmedLine;
    });
    
    fixedCard = indentedLines.join('\n');
  }
  
  return fixedCard;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  log(`Processing ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cardObjects = extractCardObjects(content);
    
    if (cardObjects.length === 0) {
      log(`No card objects found in ${filePath}`, 'warning');
      return false;
    }
    
    log(`Found ${cardObjects.length} card objects in ${filePath}`);
    
    let modifiedContent = content;
    let changesMade = false;
    
    // Fix each card object
    for (const cardObj of cardObjects) {
      const fixedCard = fixCardProperties(cardObj);
      
      if (fixedCard !== cardObj) {
        changesMade = true;
        // Replace the old card object with the fixed one
        modifiedContent = modifiedContent.replace(cardObj, fixedCard);
      }
    }
    
    if (changesMade) {
      if (!dryRun) {
        fs.writeFileSync(filePath, modifiedContent);
        log(`Fixed issues in ${filePath}`, 'success');
      } else {
        log(`Would fix issues in ${filePath} (dry run)`, 'success');
      }
      return true;
    } else {
      log(`No issues found in ${filePath}`);
      return false;
    }
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Find all card files
 */
function findCardFiles() {
  const basePath = path.join('client', 'src', 'game', 'data');
  
  // If a specific file was specified, return only that
  if (specificFile) {
    const fullPath = path.resolve(specificFile);
    if (fs.existsSync(fullPath)) {
      return [fullPath];
    } else {
      log(`Specified file ${specificFile} does not exist`, 'error');
      return [];
    }
  }
  
  try {
    // Get all TypeScript files in the data directory
    const files = fs.readdirSync(basePath)
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(basePath, file));
    
    return files;
  } catch (error) {
    log(`Error finding card files: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  log(`Starting ${dryRun ? '(DRY RUN)' : ''}`);
  
  const cardFiles = findCardFiles();
  
  if (cardFiles.length === 0) {
    log('No card files found to process', 'warning');
    return;
  }
  
  log(`Found ${cardFiles.length} card files to process`);
  
  let filesWithChanges = 0;
  
  for (const filePath of cardFiles) {
    const hadChanges = processFile(filePath);
    if (hadChanges) {
      filesWithChanges++;
    }
  }
  
  log(`${dryRun ? 'Would fix' : 'Fixed'} issues in ${filesWithChanges} of ${cardFiles.length} files`, 'success');
}

// Run the script
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error');
  process.exit(1);
});