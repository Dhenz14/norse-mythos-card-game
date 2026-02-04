/**
 * Script to fix issues in tradeable cards
 * 
 * This script addresses common problems in tradeable card files:
 * 1. Duplicate class properties
 * 2. Class properties within effect objects (should be at root level)
 * 3. Duplicate collectible properties
 * 4. Improper indentation and formatting
 * 
 * Usage: node fix_tradeable_cards.cjs
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
  
  // Now we'll rebuild the card object with proper formatting
  
  // First, extract all the properties and nested objects
  const manaCostMatch = cardStr.match(/manaCost\s*:\s*(\d+)/);
  const attackMatch = cardStr.match(/attack\s*:\s*(\d+)/);
  const healthMatch = cardStr.match(/health\s*:\s*(\d+)/);
  const descriptionMatch = cardStr.match(/description\s*:\s*"([^"]*)"/);
  const rarityMatch = cardStr.match(/rarity\s*:\s*"([^"]*)"/);
  const typeMatch = cardStr.match(/type\s*:\s*"([^"]*)"/);
  const keywordsMatch = cardStr.match(/keywords\s*:\s*(\[[^\]]*\])/);
  
  // Extract nested objects using regex patterns
  const battlecryMatch = cardStr.match(/battlecry\s*:\s*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\})/);
  const spellEffectMatch = cardStr.match(/spellEffect\s*:\s*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\})/);
  const tradeableInfoMatch = cardStr.match(/tradeableInfo\s*:\s*(\{[^{}]*(\{[^{}]*\}[^{}]*)*\})/);
  
  // Build the new card object with proper formatting and indentation
  let newCardStr = '  {\n';
  
  // Add basic properties
  if (idMatch) newCardStr += `    id: ${id},\n`;
  if (nameMatch) newCardStr += `    name: "${name}",\n`;
  if (manaCostMatch) newCardStr += `    manaCost: ${manaCostMatch[1]},\n`;
  if (attackMatch) newCardStr += `    attack: ${attackMatch[1]},\n`;
  if (healthMatch) newCardStr += `    health: ${healthMatch[1]},\n`;
  if (descriptionMatch) newCardStr += `    description: "${descriptionMatch[1]}",\n`;
  if (rarityMatch) newCardStr += `    rarity: "${rarityMatch[1]}",\n`;
  if (typeMatch) newCardStr += `    type: "${typeMatch[1]}",\n`;
  if (keywordsMatch) newCardStr += `    keywords: ${keywordsMatch[1]},\n`;
  
  // Add class and collectible properties
  if (classValue) newCardStr += `    class: "${classValue}",\n`;
  if (collectibleValue) newCardStr += `    collectible: ${collectibleValue},\n`;
  
  // Add nested objects with proper indentation
  if (battlecryMatch) {
    const formattedBattlecry = battlecryMatch[1]
      .replace(/\{/g, '{\n      ')
      .replace(/,\s*/g, ',\n      ')
      .replace(/\}/g, '\n    }');
    newCardStr += `    battlecry: ${formattedBattlecry},\n`;
  }
  
  if (spellEffectMatch) {
    const formattedSpellEffect = spellEffectMatch[1]
      .replace(/\{/g, '{\n      ')
      .replace(/,\s*/g, ',\n      ')
      .replace(/\}/g, '\n    }');
    newCardStr += `    spellEffect: ${formattedSpellEffect},\n`;
  }
  
  if (tradeableInfoMatch) {
    const formattedTradeableInfo = tradeableInfoMatch[1]
      .replace(/\{/g, '{\n      ')
      .replace(/,\s*/g, ',\n      ')
      .replace(/\}/g, '\n    }');
    newCardStr += `    tradeableInfo: ${formattedTradeableInfo}\n`;
  } else {
    // Remove trailing comma from the last property
    newCardStr = newCardStr.replace(/,\n$/, '\n');
  }
  
  // Close the card object
  newCardStr += '  }';
  
  return newCardStr;
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