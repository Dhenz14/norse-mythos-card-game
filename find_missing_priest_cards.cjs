/**
 * Find Missing Priest Cards
 * 
 * This script finds and lists all Priest cards that are collectible 
 * but may not be showing in the deck builder.
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Get all card files
function getCardFiles() {
  const command = 'find client/src/game/data -name "*.ts"';
  const result = execSync(command).toString();
  return result.split('\n').filter(path => path.trim() !== '');
}

// Process a file to extract priest cards
function processFile(filePath, priestCards) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regex patterns to match priest cards
    const priestClassPattern = /class:\s*['"]Priest['"]|heroClass:\s*['"]priest['"]/g;
    
    // Count priests cards
    const priestMatches = content.match(priestClassPattern) || [];
    
    // If we found priest cards, extract their details
    if (priestMatches.length > 0) {
      // Match entire card definitions to analyze properly
      const cardDefPattern = /\{[^{]*?(id:[^}]*?)(class:\s*['"]Priest['"]|heroClass:\s*['"]priest['"])[^}]*?collectible:\s*(true|false)[^}]*?\}/gs;
      const cardMatches = [];
      
      // Use exec to find all matches with capture groups
      let match;
      while ((match = cardDefPattern.exec(content)) !== null) {
        cardMatches.push(match[0]);
      }
      
      // Process each card
      cardMatches.forEach(cardDef => {
        const isCollectible = /collectible:\s*true/.test(cardDef);
        const nameMatch = cardDef.match(/name:\s*['"]([^'"]+)['"]/) || [];
        const idMatch = cardDef.match(/id:\s*(\d+)/) || [];
        const typeMatch = cardDef.match(/type:\s*['"]([^'"]+)['"]/) || [];
        const rarityMatch = cardDef.match(/rarity:\s*['"]([^'"]+)['"]/) || [];
        
        const name = nameMatch[1] || 'Unknown';
        const id = idMatch[1] ? parseInt(idMatch[1], 10) : 'Unknown';
        const type = typeMatch[1] || 'Unknown';
        const rarity = rarityMatch[1] || 'Unknown';
        
        if (isCollectible) {
          priestCards.push({
            id,
            name,
            type,
            rarity,
            file: filePath
          });
        }
      });
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Find deck builder logic file to check any potential filtering
function analyzeDeckBuilder() {
  try {
    const deckBuilderPath = 'client/src/game/components/DeckBuilder.tsx';
    if (fs.existsSync(deckBuilderPath)) {
      const content = fs.readFileSync(deckBuilderPath, 'utf8');
      
      // Look for filtering logic
      const filterPatterns = [
        /filter/g,
        /collectible/g,
        /priest/g,
        /class.*?filter/g
      ];
      
      console.log('\n=== Deck Builder Analysis ===');
      filterPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`Found ${matches.length} instances of ${pattern}`);
        }
      });
      
      // Find specific filtering conditions
      const filterConditions = content.match(/if\s*\([^)]*collectible[^)]*\)/g) || [];
      if (filterConditions.length > 0) {
        console.log('\nFilter conditions:');
        filterConditions.forEach(condition => {
          console.log(`  - ${condition.trim()}`);
        });
      }
    } else {
      console.log('DeckBuilder.tsx file not found');
    }
  } catch (error) {
    console.error('Error analyzing deck builder:', error.message);
  }
}

// Check for duplicate cards
function checkForDuplicates(cards) {
  const uniqueIds = new Set();
  const duplicates = [];
  
  cards.forEach(card => {
    if (uniqueIds.has(card.id)) {
      duplicates.push(card);
    } else {
      uniqueIds.add(card.id);
    }
  });
  
  return {
    uniqueCount: uniqueIds.size,
    duplicates
  };
}

function main() {
  console.log('=== Finding Missing Priest Cards ===');
  
  // Get all card files
  const cardFiles = getCardFiles();
  console.log(`Found ${cardFiles.length} card files`);
  
  // Collect all Priest cards
  const priestCards = [];
  
  // Process each file
  cardFiles.forEach(file => {
    processFile(file, priestCards);
  });
  
  // Check for duplicates
  const { uniqueCount, duplicates } = checkForDuplicates(priestCards);
  
  // Sort cards by ID for easier reading
  priestCards.sort((a, b) => a.id - b.id);
  
  // Display results
  console.log(`\n=== Priest Cards Overview ===`);
  console.log(`Found ${priestCards.length} total collectible Priest cards`);
  console.log(`Found ${uniqueCount} unique collectible Priest cards`);
  
  if (duplicates.length > 0) {
    console.log(`\n=== Duplicate Cards (${duplicates.length}) ===`);
    duplicates.forEach(card => {
      console.log(`  - [${card.id}] ${card.name} (defined in ${card.file})`);
    });
  }
  
  console.log(`\n=== All Priest Cards ===`);
  priestCards.forEach(card => {
    console.log(`  - [${card.id}] ${card.name} (${card.type}, ${card.rarity}) in ${card.file}`);
  });
  
  // Analyze deck builder to understand filtering logic
  analyzeDeckBuilder();
}

// Run the script
main();