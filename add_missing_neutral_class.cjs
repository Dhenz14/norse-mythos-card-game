/**
 * Script to add class: "Neutral" to cards that are missing it
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

function fixFile() {
  const filePath = 'client/src/game/data/discoverCards.ts';
  log(`Processing ${filePath}...`);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Get all card objects
  const cardPattern = /\{\s*id:\s*\d+[\s\S]*?collectible:\s*true\s*\}/g;
  const cards = [...content.matchAll(cardPattern)].map(m => m[0]);
  
  let updatedContent = content;
  let count = 0;
  
  cards.forEach(card => {
    // Skip cards that already have class or heroClass
    if (card.includes('class:') || card.includes('heroClass:')) {
      return;
    }
    
    // Add class: "Neutral" before the closing brace
    const updatedCard = card.replace(
      /collectible:\s*true\s*\}/,
      'collectible: true, class: "Neutral" }'
    );
    
    updatedContent = updatedContent.replace(card, updatedCard);
    count++;
  });
  
  if (count > 0) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    log(`Added class: "Neutral" to ${count} cards`);
  } else {
    log('No cards needed class: "Neutral" added');
  }
}

function main() {
  fixFile();
}

main();