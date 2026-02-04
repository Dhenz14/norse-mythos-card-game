/**
 * Script to fix issues in tradeable cards
 * 
 * This script addresses common problems in tradeable card files:
 * 1. Duplicate class properties
 * 2. Class properties within effect objects (should be at root level)
 * 3. Duplicate collectible properties
 * 4. Improper indentation and formatting
 * 
 * Usage: node fix_tradeable_cards.js
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR:' :
                level === 'warning' ? '⚠️ WARNING:' :
                level === 'success' ? '✅ SUCCESS:' : 'ℹ️ INFO:';
  console.log(`${prefix} ${message}`);
}

function processFile(filePath) {
  log(`Processing ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixCardIssues(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent);
      log(`Fixed issues in ${filePath}`, 'success');
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

function extractCards(content) {
  const cardRegex = /\{[^{]*?id\s*:\s*\d+[^{}]*?(\{[^{}]*\}[^{}]*)*?\}/gs;
  return [...content.matchAll(cardRegex)].map(match => match[0]);
}

function fixCardIssues(content) {
  // Extract the opening array and any leading text
  const leadingText = content.split(/\[\s*\{/)[0];
  
  // Extract each card definition
  const cardDefinitions = extractCards(content);
  
  if (cardDefinitions.length === 0) {
    log('No card definitions found in file', 'warning');
    return content;
  }
  
  // Fix each card definition
  const fixedCards = cardDefinitions.map(card => fixCardDefinition(card));
  
  // Reconstruct the file content
  const reconstructed = leadingText + '[\n' + fixedCards.join(',\n') + '\n];\n\nexport default tradeableCards;';
  
  return reconstructed;
}

function fixCardDefinition(cardStr) {
  // Extract basic card properties
  const idMatch = cardStr.match(/id\s*:\s*(\d+)/);
  const nameMatch = cardStr.match(/name\s*:\s*"([^"]*)"/);
  const classMatch = cardStr.match(/class\s*:\s*"([^"]*)"/g);
  const collectibleMatch = cardStr.match(/collectible\s*:\s*(true|false)/g);
  
  const id = idMatch ? idMatch[1] : 'unknown';
  const name = nameMatch ? nameMatch[1] : 'Unknown Card';
  
  // Handle duplicate class properties
  let classValue = null;
  if (classMatch && classMatch.length > 0) {
    // Extract the class value from the first occurrence
    const firstClassMatch = classMatch[0].match(/class\s*:\s*"([^"]*)"/);
    if (firstClassMatch) {
      classValue = firstClassMatch[1];
    }
    
    // Remove all class properties from the card string
    cardStr = cardStr.replace(/,?\s*class\s*:\s*"[^"]*"/g, '');
  }
  
  // Handle duplicate collectible properties
  let collectibleValue = null;
  if (collectibleMatch && collectibleMatch.length > 0) {
    // Extract the collectible value from the first occurrence
    const firstCollectibleMatch = collectibleMatch[0].match(/collectible\s*:\s*(true|false)/);
    if (firstCollectibleMatch) {
      collectibleValue = firstCollectibleMatch[1];
    }
    
    // Remove all collectible properties from the card string
    cardStr = cardStr.replace(/,?\s*collectible\s*:\s*(true|false)/g, '');
  }
  
  // Remove class and collectible from nested objects (battlecry, deathrattle, etc.)
  cardStr = cardStr.replace(/(\{[^\{}]*)(,?\s*class\s*:\s*"[^"]*")([^\{}]*\})/g, '$1$3');
  cardStr = cardStr.replace(/(\{[^\{}]*)(,?\s*collectible\s*:\s*(true|false))([^\{}]*\})/g, '$1$4');
  
  // Reconstruct the card with proper formatting and indentation
  // First, clean up the card string by removing any trailing commas before closing braces
  cardStr = cardStr.replace(/,\s*\}/g, '\n  }');
  
  // Create a cleaner version of the card string with proper indentation
  const lines = cardStr.split('\n').map(line => line.trim());
  let cleanCardStr = '  {\n';
  
  // Add the basic properties first
  if (idMatch) {
    cleanCardStr += `    id: ${id},\n`;
  }
  
  if (nameMatch) {
    cleanCardStr += `    name: "${name}",\n`;
  }
  
  // Add other properties (excluding the closing brace)
  const otherProperties = lines
    .filter(line => 
      line !== '{' && 
      line !== '}' && 
      !line.match(/^\s*id\s*:/) && 
      !line.match(/^\s*name\s*:/)
    )
    .map(line => {
      // Ensure lines end with commas except for closing braces or lines that already have commas
      if (!line.endsWith(',') && !line.endsWith('}') && !line.endsWith('{')) {
        line += ',';
      }
      return '    ' + line;
    })
    .join('\n');
  
  cleanCardStr += otherProperties;
  
  // Make sure to properly close nested objects
  cleanCardStr = cleanCardStr.replace(/,\s*\n\s*\}/g, '\n    }');
  
  // Add the class and collectible properties if they were found
  if (classValue) {
    // Add before the last '}'
    cleanCardStr = cleanCardStr.replace(/(\s*\}\s*)$/, `    class: "${classValue}",\n$1`);
  }
  
  if (collectibleValue) {
    // Add before the last '}'
    cleanCardStr = cleanCardStr.replace(/(\s*\}\s*)$/, `    collectible: ${collectibleValue},\n$1`);
  }
  
  // Remove any trailing comma before the closing brace
  cleanCardStr = cleanCardStr.replace(/,(\s*\}\s*)$/, '$1');
  
  return cleanCardStr;
}

function findCardFiles() {
  const cardFilePaths = [
    path.join('client', 'src', 'game', 'data', 'tradeableCards.ts'),
    // Add other card files here if needed
  ];
  
  return cardFilePaths.filter(filePath => fs.existsSync(filePath));
}

async function main() {
  const cardFiles = findCardFiles();
  
  if (cardFiles.length === 0) {
    log('No card files found', 'warning');
    return;
  }
  
  log(`Found ${cardFiles.length} card files to process`);
  
  let fixedFiles = 0;
  
  for (const filePath of cardFiles) {
    const wasFixed = processFile(filePath);
    if (wasFixed) {
      fixedFiles++;
    }
  }
  
  log(`Fixed issues in ${fixedFiles} of ${cardFiles.length} files`, 'success');
}

main().catch(error => {
  log(`Error executing script: ${error.message}`, 'error');
  process.exit(1);
});