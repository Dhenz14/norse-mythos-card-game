/**
 * Script to add class property to cards that have heroClass but are missing class
 */
const fs = require('fs');
const path = require('path');

function extractHeroClass(cardString) {
  // Look for the heroClass property in the card string
  const heroClassMatch = cardString.match(/heroClass:\s*['"]([^'"]+)['"]/);
  if (heroClassMatch && heroClassMatch[1]) {
    return heroClassMatch[1];
  }
  return null;
}

function addClassPropertyToCard(cardContent, file) {
  // Identify cards that have heroClass but not class
  let updatedContent = cardContent;
  
  // Check if this card has heroClass but not class
  const heroClass = extractHeroClass(cardContent);
  const hasClassProperty = cardContent.includes('class:');
  
  if (heroClass && !hasClassProperty && heroClass !== 'neutral') {
    // Capitalize the first letter for class property
    const className = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
    
    // Find the heroClass line
    const heroClassRegex = /(heroClass:\s*['"][^'"]+['"],?)/;
    const match = cardContent.match(heroClassRegex);
    
    if (match) {
      // Add the class property after heroClass
      updatedContent = cardContent.replace(
        match[0],
        `${match[0]}\n      class: "${className}",`
      );
      console.log(`Added class property to a card in ${file}`);
    }
  }
  
  return updatedContent;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let cardsUpdated = 0;
    
    // Extract all card objects from the file using regex
    const cardRegex = /{\s*id:[\s\S]*?(?=},|}\];|}$)/g;
    const cardMatches = content.match(cardRegex);
    
    if (cardMatches) {
      for (const cardMatch of cardMatches) {
        const updatedCard = addClassPropertyToCard(cardMatch, filePath);
        if (updatedCard !== cardMatch) {
          updatedContent = updatedContent.replace(cardMatch, updatedCard);
          cardsUpdated++;
        }
      }
    }
    
    if (cardsUpdated > 0) {
      console.log(`Updated ${cardsUpdated} cards in ${filePath}`);
      fs.writeFileSync(filePath, updatedContent, 'utf8');
    }
    
    return cardsUpdated;
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
    return 0;
  }
}

async function main() {
  try {
    const cardDir = path.join('client', 'src', 'game', 'data');
    const files = fs.readdirSync(cardDir)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
      .map(file => path.join(cardDir, file));
    
    console.log(`Found ${files.length} card files to process`);
    
    let totalUpdated = 0;
    for (const file of files) {
      const updated = processFile(file);
      totalUpdated += updated;
    }
    
    console.log(`Total cards updated: ${totalUpdated}`);
    
  } catch (error) {
    console.error(`Unhandled error: ${error.message}`);
  }
}

main();