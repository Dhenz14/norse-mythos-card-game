/**
 * Script to identify cards that are missing the class property
 */
const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ' : level === 'warning' ? '⚠️ ' : level === 'success' ? '✅ ' : '';
  console.log(`${prefix}${message}`);
}

// Extract cards from a file content
function extractCardsFromContent(content) {
  try {
    // Clean up the content to handle potential syntax issues
    const cleanedContent = content
      .replace(/export default \[/g, '[')
      .replace(/export const \w+ = \[/g, '[')
      .replace(/];$/g, ']')
      .trim();
    
    // Parse the content to get the array of cards
    const parsedContent = eval(`(${cleanedContent})`);
    
    if (Array.isArray(parsedContent)) {
      return parsedContent;
    } else {
      log(`Parsed content is not an array: ${typeof parsedContent}`, 'error');
      return [];
    }
  } catch (error) {
    log(`Error parsing cards: ${error.message}`, 'error');
    return [];
  }
}

// Find all card files in the project
async function findCardFiles() {
  const cardDir = path.join('client', 'src', 'game', 'data');
  const files = fs.readdirSync(cardDir);
  
  return files
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    .map(file => path.join(cardDir, file));
}

// Analyze a card file to find cards missing class property
function analyzeCardFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const cards = extractCardsFromContent(fileContent);
    
    if (!cards.length) {
      log(`No cards found in ${filePath}`, 'warning');
      return { filePath, missingClassCards: [] };
    }
    
    const missingClassCards = cards.filter(card => {
      // Skip neutral cards, they don't need a class property
      if (card.heroClass === 'neutral') return false;
      // Find cards that have heroClass but no class property
      return card.heroClass && !card.class;
    });
    
    return { 
      filePath, 
      missingClassCards: missingClassCards.map(card => ({
        id: card.id,
        name: card.name,
        heroClass: card.heroClass
      }))
    };
  } catch (error) {
    log(`Error analyzing ${filePath}: ${error.message}`, 'error');
    return { filePath, missingClassCards: [] };
  }
}

async function main() {
  const cardFiles = await findCardFiles();
  log(`Found ${cardFiles.length} card files to analyze`);
  
  const results = cardFiles.map(analyzeCardFile);
  const missingClassFilesInfo = results.filter(result => result.missingClassCards.length > 0);
  
  let totalMissingClassCards = 0;
  
  missingClassFilesInfo.forEach(fileInfo => {
    const { filePath, missingClassCards } = fileInfo;
    
    if (missingClassCards.length > 0) {
      log(`File: ${filePath} has ${missingClassCards.length} cards missing class property:`, 'warning');
      missingClassCards.forEach(card => {
        log(`  - Card ID: ${card.id}, Name: ${card.name}, HeroClass: ${card.heroClass}`);
      });
      totalMissingClassCards += missingClassCards.length;
    }
  });
  
  log(`Total cards missing class property: ${totalMissingClassCards}`, 'warning');
}

main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error');
});