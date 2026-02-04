/**
 * Advanced Class Property Fixer
 * 
 * This script finds and fixes cards that are missing class properties
 * using a more robust approach to detect different patterns and card formats.
 */
const fs = require('fs');
const path = require('path');

// Colorful console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

function log(message, type = 'info') {
  const now = new Date().toLocaleTimeString();
  let prefix = '';
  
  switch (type) {
    case 'error':
      prefix = `${colors.red}[ERROR]${colors.reset} `;
      break;
    case 'warn':
      prefix = `${colors.yellow}[WARN]${colors.reset} `;
      break;
    case 'success':
      prefix = `${colors.green}[SUCCESS]${colors.reset} `;
      break;
    case 'debug':
      prefix = `${colors.cyan}[DEBUG]${colors.reset} `;
      break;
    default:
      prefix = `${colors.blue}[INFO]${colors.reset} `;
  }
  
  console.log(`${prefix}${message}`);
}

/**
 * Analyzes card data to find cards with missing class property
 */
function analyzeCardData(data, filePath) {
  const cards = [];
  let totalCards = 0;
  let missingClassCount = 0;
  
  try {
    // First attempt: extract all complete card objects using regex
    const cardRegex = /{\s*(?:id:|name:)[\s\S]+?(?=},|}\];|}$)/g;
    const cardMatches = data.match(cardRegex) || [];
    
    for (const cardMatch of cardMatches) {
      totalCards++;
      
      // Check for heroClass but no class property
      const hasHeroClass = /heroClass\s*:\s*['"]([^'"]+)['"]/i.test(cardMatch);
      const hasClass = /class\s*:\s*['"]([^'"]+)['"]/i.test(cardMatch);
      const heroClassMatch = cardMatch.match(/heroClass\s*:\s*['"]([^'"]+)['"]/i);
      
      if (hasHeroClass && !hasClass && heroClassMatch && heroClassMatch[1] !== 'neutral') {
        const idMatch = cardMatch.match(/id\s*:\s*(\d+)/);
        const nameMatch = cardMatch.match(/name\s*:\s*['"]([^'"]+)['"]/);
        
        cards.push({
          id: idMatch ? idMatch[1] : 'unknown',
          name: nameMatch ? nameMatch[1] : 'unknown',
          heroClass: heroClassMatch[1],
          cardText: cardMatch
        });
        
        missingClassCount++;
      }
    }
    
    log(`Analyzed ${totalCards} cards in ${filePath}; found ${missingClassCount} missing class property`, missingClassCount > 0 ? 'warn' : 'info');
    return cards;
  } catch (error) {
    log(`Error analyzing file ${filePath}: ${error.message}`, 'error');
    return [];
  }
}

/**
 * Fixes a card by adding the class property
 */
function fixCard(cardText, heroClass) {
  try {
    // Capitalize first letter of heroClass for class property
    const className = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
    
    // Find the line with heroClass (handling different formatting)
    const heroClassLineRegex = /(heroClass\s*:\s*['"][^'"]+['"],?)/;
    const match = cardText.match(heroClassLineRegex);
    
    if (match) {
      // Add the class property after heroClass line with proper indentation
      const updatedCardText = cardText.replace(
        match[0],
        `${match[0]}\n      class: "${className}",`
      );
      
      return updatedCardText;
    }
    
    return cardText; // Return unchanged if pattern not found
  } catch (error) {
    log(`Error fixing card: ${error.message}`, 'error');
    return cardText;
  }
}

/**
 * Process a file to fix cards with missing class property
 */
function processFile(filePath) {
  try {
    log(`Processing ${filePath}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const cardsToFix = analyzeCardData(content, filePath);
    
    if (cardsToFix.length === 0) {
      return 0;
    }
    
    let updatedContent = content;
    let fixedCount = 0;
    
    // Apply fixes to the content
    for (const card of cardsToFix) {
      const fixedCardText = fixCard(card.cardText, card.heroClass);
      
      if (fixedCardText !== card.cardText) {
        updatedContent = updatedContent.replace(card.cardText, fixedCardText);
        fixedCount++;
        log(`Fixed card ${card.id} (${card.name}) with heroClass '${card.heroClass}'`, 'success');
      }
    }
    
    if (fixedCount > 0) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      log(`Updated ${fixedCount} cards in ${filePath}`, 'success');
    }
    
    return fixedCount;
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'error');
    return 0;
  }
}

/**
 * Find all card files in the project
 */
function findCardFiles() {
  const cardDir = path.join('client', 'src', 'game', 'data');
  return fs.readdirSync(cardDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    .map(file => path.join(cardDir, file));
}

/**
 * Main function
 */
async function main() {
  try {
    const files = findCardFiles();
    log(`Found ${files.length} card files to process`);
    
    let totalFixed = 0;
    
    for (const file of files) {
      const fixedCount = processFile(file);
      totalFixed += fixedCount;
    }
    
    if (totalFixed > 0) {
      log(`Fixed a total of ${totalFixed} cards across all files`, 'success');
    } else {
      log(`No cards needed fixing`, 'info');
    }
  } catch (error) {
    log(`Unhandled error: ${error.message}`, 'error');
  }
}

// Run the script
main();