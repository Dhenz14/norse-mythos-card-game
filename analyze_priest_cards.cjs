/**
 * Script to analyze existing Priest cards and identify ID ranges
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Extract card objects from content
function extractCardObjects(content) {
  const cards = [];
  let nestLevel = 0;
  let startIdx = -1;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    // Handle string literals and escaping
    if (char === '"' || char === "'") {
      if (!escapeNext) {
        inString = !inString;
      }
    }
    
    if (char === '\\' && inString) {
      escapeNext = !escapeNext;
    } else {
      escapeNext = false;
    }
    
    // Only track braces when not in a string
    if (!inString) {
      if (char === '{') {
        if (nestLevel === 0) {
          startIdx = i;
        }
        nestLevel++;
      } else if (char === '}') {
        nestLevel--;
        if (nestLevel === 0 && startIdx !== -1) {
          const cardObj = content.substring(startIdx, i + 1);
          cards.push(cardObj);
          startIdx = -1;
        }
      }
    }
  }
  
  return cards;
}

// Check if card has Priest class
function isPriestCard(cardString) {
  return (
    cardString.includes("class: 'Priest'") || 
    cardString.includes('class: "Priest"') || 
    cardString.includes("heroClass: 'priest'") || 
    cardString.includes('heroClass: "priest"')
  );
}

// Extract card ID from card string
function extractCardId(cardString) {
  const idMatch = cardString.match(/id:\s*(\d+)/);
  return idMatch ? parseInt(idMatch[1]) : null;
}

// Extract card name from card string
function extractCardName(cardString) {
  const nameMatch = cardString.match(/name:\s*["']([^"']+)["']/);
  return nameMatch ? nameMatch[1] : null;
}

// Extract card type from card string
function extractCardType(cardString) {
  const typeMatch = cardString.match(/type:\s*["']([^"']+)["']/);
  return typeMatch ? typeMatch[1] : null;
}

// Main function
async function main() {
  console.log('=== Analyzing Priest Cards ===');
  
  // Find all card files
  const cardFiles = glob.sync('client/src/game/data/**/*.ts');
  console.log(`Found ${cardFiles.length} card files`);
  
  const priestCards = [];
  
  // Process each file
  for (const file of cardFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const cardStrings = extractCardObjects(content);
      
      for (const cardString of cardStrings) {
        if (isPriestCard(cardString)) {
          const id = extractCardId(cardString);
          const name = extractCardName(cardString);
          const type = extractCardType(cardString);
          
          if (id) {
            priestCards.push({
              id,
              name: name || 'Unknown Name',
              type: type || 'Unknown Type',
              file: path.basename(file)
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  // Sort cards by ID
  priestCards.sort((a, b) => a.id - b.id);
  
  // Log detailed card list
  console.log('\n=== Priest Cards List ===');
  priestCards.forEach(card => {
    console.log(`ID: ${card.id}, Name: ${card.name}, Type: ${card.type}, File: ${card.file}`);
  });
  
  // Analyze ID ranges
  if (priestCards.length > 0) {
    console.log('\n=== ID Range Analysis ===');
    const idRanges = {};
    
    priestCards.forEach(card => {
      const firstDigit = Math.floor(card.id / 10000);
      idRanges[firstDigit] = idRanges[firstDigit] || [];
      idRanges[firstDigit].push(card);
    });
    
    for (const range in idRanges) {
      console.log(`Range ${range}xxxx: ${idRanges[range].length} cards`);
      console.log(`  Min ID: ${Math.min(...idRanges[range].map(c => c.id))}`);
      console.log(`  Max ID: ${Math.max(...idRanges[range].map(c => c.id))}`);
    }
  } else {
    console.log('No Priest cards found');
  }
  
  // Suggest IDs for new cards
  console.log('\n=== Suggested IDs for New Cards ===');
  const usedIds = new Set(priestCards.map(card => card.id));
  
  // Determine preferred ranges for each card type
  const preferredRanges = {
    minion: { start: 5100, end: 6000 },
    spell: { start: 6000, end: 7000 },
    weapon: { start: 7000, end: 8000 },
    hero: { start: 8000, end: 9000 }
  };
  
  Object.entries(preferredRanges).forEach(([type, range]) => {
    let availableIds = [];
    for (let id = range.start; id < range.end; id++) {
      if (!usedIds.has(id)) {
        availableIds.push(id);
        if (availableIds.length >= 5) break;
      }
    }
    
    console.log(`For ${type} cards: ${availableIds.join(', ')}`);
  });
  
  // Count card types
  console.log('\n=== Type Distribution ===');
  const typeCount = {};
  priestCards.forEach(card => {
    typeCount[card.type] = (typeCount[card.type] || 0) + 1;
  });
  
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`${type}: ${count} cards`);
  });
}

main();