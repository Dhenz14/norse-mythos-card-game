/**
 * Count Priest Cards
 * 
 * This script counts all priest cards in the collection.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all card files
function getCardFiles() {
  const command = 'find client/src/game/data -name "*.ts"';
  const result = execSync(command).toString();
  return result.split('\n').filter(path => path.trim() !== '');
}

// Process a file to extract priest cards
function processFile(filePath, cardStats) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regex patterns to match priest cards
    const priestClassPattern = /class:\s*['"]Priest['"]|heroClass:\s*['"]priest['"]/g;
    
    // Count priests cards
    const priestMatches = content.match(priestClassPattern) || [];
    
    // If we found priest cards, extract their details
    if (priestMatches.length > 0) {
      console.log(`Found possible Priest cards in ${filePath}`);
      
      // Match entire card definitions to analyze properly
      // Capture more content to ensure we get the full card definition
      const cardDefPattern = /\{[^{]*?(id:[^}]*?)(class:\s*['"]Priest['"]|heroClass:\s*['"]priest['"])[^}]*?collectible:\s*(true|false)[^}]*?\}/gs;
      const cardMatches = [];
      
      // Use exec to find all matches with capture groups
      let match;
      while ((match = cardDefPattern.exec(content)) !== null) {
        cardMatches.push(match[0]);
      }
      
      // Process each card
      let collectibleCount = 0;
      cardMatches.forEach(cardDef => {
        const isCollectible = /collectible:\s*true/.test(cardDef);
        const nameMatch = cardDef.match(/name:\s*['"]([^'"]+)['"]/) || [];
        const idMatch = cardDef.match(/id:\s*(\d+)/) || [];
        const typeMatch = cardDef.match(/type:\s*['"]([^'"]+)['"]/) || [];
        const rarityMatch = cardDef.match(/rarity:\s*['"]([^'"]+)['"]/) || [];
        
        const name = nameMatch[1] || 'Unknown';
        const id = idMatch[1] || 'Unknown';
        const type = typeMatch[1] || 'Unknown';
        const rarity = rarityMatch[1] || 'Unknown';
        
        if (isCollectible) {
          console.log(`  - [${id}] ${name} (${type}, ${rarity})`);
          collectibleCount++;
          
          // Update statistics
          cardStats.totalPriestCards++;
          cardStats.collectiblePriestCards++;
          
          // Count by type
          if (type) {
            cardStats.byType[type] = (cardStats.byType[type] || 0) + 1;
          }
          
          // Count by rarity
          if (rarity) {
            cardStats.byRarity[rarity] = (cardStats.byRarity[rarity] || 0) + 1;
          }
        }
      });
      
      return {
        total: cardMatches.length,
        collectible: collectibleCount
      };
    }
    
    return {
      total: 0,
      collectible: 0
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return {
      total: 0,
      collectible: 0
    };
  }
}

function main() {
  console.log('=== Counting Priest Cards ===');
  
  // Get all card files
  const cardFiles = getCardFiles();
  console.log(`Found ${cardFiles.length} card files`);
  
  // Initialize stats object
  const cardStats = {
    totalPriestCards: 0,
    collectiblePriestCards: 0,
    byType: {
      minion: 0,
      spell: 0,
      weapon: 0,
      hero: 0
    },
    byRarity: {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    }
  };
  
  // Count cards in each file
  cardFiles.forEach(file => {
    processFile(file, cardStats);
  });
  
  // Summarize results
  console.log('\n=== Results ===');
  console.log(`Total collectible Priest cards: ${cardStats.collectiblePriestCards}`);
  
  console.log('\nBreakdown by Type:');
  for (const [type, count] of Object.entries(cardStats.byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`);
  }
  
  console.log('\nBreakdown by Rarity:');
  for (const [rarity, count] of Object.entries(cardStats.byRarity).sort((a, b) => b[1] - a[1])) {
    console.log(`  - ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}: ${count}`);
  }
}

// Run the script
main();