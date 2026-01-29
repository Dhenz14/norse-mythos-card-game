/**
 * Identify Missing Class Cards
 * 
 * This script specifically identifies cards missing the class property
 * and prints detailed information about them.
 */

// Add debug output to the DeckBuilder component
const fs = require('fs');
const path = require('path');

// Search all card files and identify cards missing the class property
function findMissingClassCards() {
  const cardDir = path.join('client', 'src', 'game', 'data');
  const files = fs.readdirSync(cardDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
  
  const missingClassCards = [];
  
  for (const file of files) {
    const filePath = path.join(cardDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that don't export cards
    if (!content.includes('export const')) {
      continue;
    }
    
    // Use regex to find card objects
    let inCardObject = false;
    let braceCount = 0;
    let cardContent = '';
    let cardStartIndex = 0;
    
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') {
        if (!inCardObject) {
          cardStartIndex = i;
          inCardObject = true;
        }
        braceCount++;
        cardContent += content[i];
      } 
      else if (inCardObject) {
        cardContent += content[i];
        if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            // Complete card object found
            const hasHeroClass = cardContent.includes('heroClass');
            const hasClass = cardContent.includes('class:');
            
            if (hasHeroClass && !hasClass) {
              // This card has heroClass but is missing class property
              const idMatch = cardContent.match(/id\s*:\s*([0-9.]+)/);
              const nameMatch = cardContent.match(/name\s*:\s*["']([^"']+)["']/);
              const heroClassMatch = cardContent.match(/heroClass\s*:\s*["']([^"']+)["']/);
              
              if (idMatch && nameMatch && heroClassMatch) {
                missingClassCards.push({
                  id: idMatch[1],
                  name: nameMatch[1],
                  heroClass: heroClassMatch[1],
                  file: file,
                  content: cardContent
                });
              }
            }
            
            // Reset for next card
            inCardObject = false;
            cardContent = '';
          }
        }
      }
    }
  }
  
  console.log('=== CARDS MISSING CLASS PROPERTY ===');
  console.log(`Found ${missingClassCards.length} cards missing the class property:`);
  
  for (const card of missingClassCards) {
    console.log(`\nID: ${card.id}`);
    console.log(`Name: ${card.name}`);
    console.log(`Hero Class: ${card.heroClass}`);
    console.log(`File: ${card.file}`);
    console.log('---');
  }
  
  return missingClassCards;
}

findMissingClassCards();