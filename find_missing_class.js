/**
 * Script to find collectible cards that are missing the class property
 */

import fs from 'fs';
import { glob } from 'glob';

// Function to extract cards from a file
function extractCardObjects(content) {
  // Use a regex to find card objects - note this is a simplified approach
  const cardObjects = [];
  const cardRegex = /{\s*id:\s*(\d+)[^}]+collectible:\s*true[^}]+}/gs;
  
  let match;
  while ((match = cardRegex.exec(content)) !== null) {
    const cardObject = match[0];
    const id = match[1];
    cardObjects.push({ id, card: cardObject });
  }
  
  return cardObjects;
}

// Function to check if a card has a class property
function hasClassProperty(cardString) {
  return cardString.includes('class:');
}

// Function to check if a card has a heroClass property
function hasHeroClassProperty(cardString) {
  return cardString.includes('heroClass:');
}

// Main function
async function main() {
  console.log('=== Finding Cards Missing Class Property ===');
  
  // Get all card data files
  const files = await glob('client/src/game/data/**/*.ts');
  console.log(`Found ${files.length} card files`);
  
  // Process each file
  const collectibleCardsWithoutClass = [];
  const collectibleCardsWithHeroClassButNoClass = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const cards = extractCardObjects(content);
      
      for (const { id, card } of cards) {
        if (!hasClassProperty(card)) {
          collectibleCardsWithoutClass.push({ id, file, content: card });
          
          // Check if it has heroClass but no class
          if (hasHeroClassProperty(card)) {
            collectibleCardsWithHeroClassButNoClass.push({ id, file, content: card });
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  // Report findings
  console.log(`Found ${collectibleCardsWithoutClass.length} collectible cards without class property:`);
  collectibleCardsWithoutClass.forEach(({ id, file }) => {
    console.log(`ID: ${id} in ${file}`);
  });
  
  console.log(`\nOf these, ${collectibleCardsWithHeroClassButNoClass.length} have heroClass but no class property:`);
  collectibleCardsWithHeroClassButNoClass.forEach(({ id, file }) => {
    console.log(`ID: ${id} in ${file}`);
  });
}

// Run the main function
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});