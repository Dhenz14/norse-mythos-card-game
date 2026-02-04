/**
 * Fixed script to restore classMinions.ts structure
 * 
 * This script carefully checks and restores the proper structure of the file,
 * keeping only one set of imports and exports.
 */
const fs = require('fs');

// Log function
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : 
                 level === 'warning' ? '⚠️ WARNING: ' : 
                 '✅ INFO: ';
  console.log(prefix + message);
}

// Path to file
const filePath = 'client/src/game/data/classMinions.ts';

async function fixClassMinionsFile() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Start with proper structure
    let fixedContent = '';
    
    // Add imports 
    fixedContent += 'import { CardData, HeroClass } from \'../types\';\n\n';
    
    // Add comments
    fixedContent += '/**\n';
    fixedContent += ' * Collection of minions for different classes\n';
    fixedContent += ' * Includes minions with various class-specific mechanics\n';
    fixedContent += ' */\n';
    
    // Get the actual card data
    const cardArrayStart = content.indexOf('export const classMinions: CardData[] = [');
    
    if (cardArrayStart === -1) {
      log('Could not find card array start marker', 'error');
      throw new Error('Could not parse file structure');
    }
    
    // Extract the card data part
    let cardDataPart = 'export const classMinions: CardData[] = [\n';
    
    // Extract all card definitions
    const cardPattern = /\{\s*id:\s*\d+,[\s\S]+?\}/g;
    const cards = content.match(cardPattern);
    
    if (!cards || cards.length === 0) {
      log('No card definitions found', 'error');
      throw new Error('Could not extract card definitions');
    }
    
    // Add each card with proper indentation and commas
    cards.forEach((card, index) => {
      // Clean up indentation
      const cleanCard = card.replace(/^\s+/gm, '  ');
      cardDataPart += '  ' + cleanCard + (index < cards.length - 1 ? ',\n\n' : '\n');
    });
    
    // Close the array
    cardDataPart += '];';
    
    // Add card data to fixed content
    fixedContent += cardDataPart;
    
    // Write fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Fixed structure issues in classMinions.ts');
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the fix
fixClassMinionsFile()
  .then(result => {
    if (result.success) {
      log('Successfully fixed issues');
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });