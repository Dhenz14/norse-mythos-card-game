/**
 * Find Duplicate Cards
 * 
 * This script finds duplicate card definitions across all class files,
 * organizing them by class and providing file locations for cleanup.
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Get all card files
function getCardFiles() {
  const command = 'find client/src/game/data -name "*.ts"';
  const result = execSync(command).toString();
  return result.split('\n').filter(path => path.trim() !== '');
}

// Extract cards from file content
function extractCards(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Match entire card definitions
    const cardDefPattern = /\{\s*id:\s*(\d+)[^{]*?name:\s*['"]([^'"]+)['"][^{]*?class:\s*['"]([^'"]+)['"][^}]*?collectible:\s*(true|false)[^}]*?\}/gs;
    const cardMatches = [];
    
    // Use exec to find all matches with capture groups
    let match;
    while ((match = cardDefPattern.exec(content)) !== null) {
      const id = parseInt(match[1], 10);
      const name = match[2];
      const cardClass = match[3];
      const isCollectible = match[4] === 'true';
      
      if (isCollectible) {
        cardMatches.push({
          id,
          name,
          class: cardClass,
          file: filePath
        });
      }
    }
    
    // Also look for cards with heroClass but no class property
    const heroClassPattern = /\{\s*id:\s*(\d+)[^{]*?name:\s*['"]([^'"]+)['"][^{]*?heroClass:\s*['"]([^'"]+)['"][^}]*?collectible:\s*(true|false)[^}]*?\}/gs;
    
    while ((match = heroClassPattern.exec(content)) !== null) {
      // Skip if it has both class and heroClass (already captured above)
      if (!/class:\s*['"]/g.test(match[0])) {
        const id = parseInt(match[1], 10);
        const name = match[2];
        const heroClass = match[3];
        const isCollectible = match[4] === 'true';
        
        // Convert heroClass to class format (capitalized)
        const cardClass = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
        
        if (isCollectible) {
          cardMatches.push({
            id,
            name,
            class: cardClass,
            file: filePath,
            usesHeroClass: true
          });
        }
      }
    }
    
    return cardMatches;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return [];
  }
}

// Main function
function main() {
  console.log('=== Finding Duplicate Card Definitions ===\n');
  
  // Get all card files
  const cardFiles = getCardFiles();
  console.log(`Analyzing ${cardFiles.length} card files...\n`);
  
  // Collect all cards
  let allCards = [];
  
  cardFiles.forEach(file => {
    const cards = extractCards(file);
    allCards = [...allCards, ...cards];
  });
  
  console.log(`Found ${allCards.length} collectible cards in total\n`);
  
  // Group cards by ID
  const cardsById = {};
  allCards.forEach(card => {
    if (!cardsById[card.id]) {
      cardsById[card.id] = [];
    }
    cardsById[card.id].push(card);
  });
  
  // Find duplicates
  const duplicateIds = Object.keys(cardsById).filter(id => cardsById[id].length > 1);
  
  console.log(`Found ${duplicateIds.length} card IDs with multiple definitions\n`);
  
  // Group duplicates by class
  const duplicatesByClass = {};
  
  duplicateIds.forEach(id => {
    const cards = cardsById[id];
    const cardClass = cards[0].class;
    
    if (!duplicatesByClass[cardClass]) {
      duplicatesByClass[cardClass] = [];
    }
    
    duplicatesByClass[cardClass].push({
      id: parseInt(id, 10),
      name: cards[0].name,
      instances: cards.map(card => ({
        file: card.file,
        usesHeroClass: card.usesHeroClass || false
      }))
    });
  });
  
  // Output duplicates by class
  console.log('=== Duplicate Cards By Class ===\n');
  
  Object.keys(duplicatesByClass).sort().forEach(className => {
    const duplicates = duplicatesByClass[className];
    console.log(`\n== ${className} Class (${duplicates.length} duplicated cards) ==`);
    
    duplicates.forEach(card => {
      console.log(`\n[ID: ${card.id}] ${card.name}`);
      console.log(`Defined in ${card.instances.length} files:`);
      
      card.instances.forEach((instance, index) => {
        console.log(`  ${index + 1}. ${instance.file}${instance.usesHeroClass ? ' (uses heroClass)' : ''}`);
      });
    });
  });
  
  console.log('\nRecommended action: Keep only one definition per card ID, preferably in the most appropriate file.');
}

// Run the script
main();