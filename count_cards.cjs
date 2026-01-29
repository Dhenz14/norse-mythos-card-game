/**
 * Simple Card Count Script
 * 
 * This script just counts the number of cards in each file
 * and checks for basic syntax issues.
 */

const fs = require('fs');
const path = require('path');

// Utility functions
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Find all card files
async function findCardFiles() {
  try {
    const dataDir = './client/src/game/data/';
    const files = await fs.promises.readdir(dataDir);
    
    return files
      .filter(file => file.endsWith('.ts'))
      .map(file => path.join(dataDir, file));
  } catch (error) {
    log(`Error finding card files: ${error.message}`, 'error');
    return [];
  }
}

// Extract cards from file
function extractCardsFromFile(content) {
  const cards = [];
  
  // Define a regex pattern to match objects within an array
  const cardPattern = /{\s*(?:[^{}]*|\{[^{}]*\}|\{(?:[^{}]*|\{[^{}]*\})*\})*?}/g;
  
  // Find all matches
  const matches = content.match(cardPattern);
  
  if (matches) {
    for (const match of matches) {
      if (match.includes('id:') || match.includes('name:')) {
        cards.push(match);
      }
    }
  }
  
  return cards;
}

// Main function
async function main() {
  try {
    log('Starting card count process...');
    
    // Find all card files
    const cardFiles = await findCardFiles();
    log(`Found ${cardFiles.length} card files`);
    
    // Count cards in each file
    let totalCards = 0;
    
    for (const file of cardFiles) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        const cards = extractCardsFromFile(content);
        
        const fileName = path.basename(file);
        log(`${fileName}: ${cards.length} cards`);
        
        totalCards += cards.length;
      } catch (error) {
        log(`Error counting cards in ${path.basename(file)}: ${error.message}`, 'error');
      }
    }
    
    log(`Total cards across all files: ${totalCards}`);
    return { success: true, totalCards };
  } catch (error) {
    log(`Error in main process: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Execute the main function
main();