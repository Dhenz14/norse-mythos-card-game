/**
 * Final Class Property Fixer
 *
 * This script identifies and fixes cards still missing class properties by directly
 * examining each individual card's JSON structure rather than using regex patterns.
 * It handles nested structures and complex objects with more precision.
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
  blue: "\x1b[34m"
};

function log(message, type = 'info') {
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
    default:
      prefix = `${colors.blue}[INFO]${colors.reset} `;
  }
  
  console.log(`${prefix}${message}`);
}

/**
 * Convert heroClass to Class (first letter uppercase)
 */
function heroClassToClass(heroClass) {
  if (!heroClass) return null;
  return heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
}

/**
 * Process file with a more comprehensive approach, directly parsing card objects
 */
function processFileWithParsingApproach(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if file doesn't export cards or doesn't contain proper card data
  if (!content.includes('export const') && !content.includes('cards')) {
    return 0;
  }
  
  // Parse out all card objects - carefully considering nested structures
  const cardObjects = [];
  let startIndex = 0;
  let bracketCount = 0;
  let started = false;
  let previousCardEndIndex = 0;
  let fileUpdated = false;
  let updatedContent = content;
  
  try {
    // This won't be a perfect JSON parse, but will help identify object boundaries
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (char === '{') {
        if (!started) {
          startIndex = i;
          started = true;
        }
        bracketCount++;
      } else if (char === '}' && started) {
        bracketCount--;
        
        if (bracketCount === 0) {
          // We found a complete card object
          const cardText = content.substring(startIndex, i + 1);
          
          // Check if it has heroClass but not class
          if (cardText.includes('heroClass') && !cardText.includes('class:')) {
            // Extract heroClass value
            const heroClassMatch = cardText.match(/heroClass\s*:\s*["']([^"']+)["']/);
            
            if (heroClassMatch && heroClassMatch[1] !== 'neutral') {
              const heroClass = heroClassMatch[1];
              const className = heroClassToClass(heroClass);
              
              if (className) {
                // Find point after heroClass line to insert class property
                const heroClassLineEndIndex = content.indexOf('\n', content.indexOf(heroClassMatch[0], startIndex));
                
                // Create new content with class property inserted
                const beforeInsertion = updatedContent.substring(0, heroClassLineEndIndex);
                const afterInsertion = updatedContent.substring(heroClassLineEndIndex);
                
                updatedContent = beforeInsertion + `,\n      class: "${className}"` + afterInsertion;
                
                // Adjust indices to account for inserted text
                const insertedLength = `,\n      class: "${className}"`.length;
                i += insertedLength;
                
                log(`Fixed card with heroClass="${heroClass}", added class="${className}"`, 'success');
                fileUpdated = true;
              }
            }
          }
          
          // Reset for next card
          started = false;
          previousCardEndIndex = i;
        }
      }
    }
    
    if (fileUpdated) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      log(`Updated file ${filePath}`, 'success');
      return 1;
    }
  } catch (error) {
    log(`Error processing file ${filePath}: ${error.message}`, 'error');
  }
  
  return 0;
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
 * Find and log cards that are still missing class properties
 */
function findMissingClassProperties() {
  const cardDir = path.join('client', 'src', 'game', 'data');
  const files = fs.readdirSync(cardDir)
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    .map(file => path.join(cardDir, file));
  
  const missingClassCards = [];
  let totalCards = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Skip if file doesn't export cards
    if (!content.includes('export const') && !content.includes('cards')) {
      return;
    }
    
    // Parse out all card objects
    const cardObjects = [];
    let startIndex = 0;
    let bracketCount = 0;
    let started = false;
    
    // This won't be a perfect JSON parse, but will help identify objects
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      if (char === '{') {
        if (!started) {
          startIndex = i;
          started = true;
        }
        bracketCount++;
      } else if (char === '}' && started) {
        bracketCount--;
        
        if (bracketCount === 0) {
          // We found a complete card object
          const cardText = content.substring(startIndex, i + 1);
          totalCards++;
          
          // Check if it has heroClass but not class
          if (cardText.includes('heroClass') && !cardText.includes('class:')) {
            // Extract id and name if possible
            const idMatch = cardText.match(/id\s*:\s*([0-9.]+)/);
            const nameMatch = cardText.match(/name\s*:\s*["']([^"']+)["']/);
            const heroClassMatch = cardText.match(/heroClass\s*:\s*["']([^"']+)["']/);
            
            if (heroClassMatch && heroClassMatch[1] !== 'neutral') {
              const id = idMatch ? idMatch[1] : 'unknown';
              const name = nameMatch ? nameMatch[1] : 'unknown';
              const heroClass = heroClassMatch ? heroClassMatch[1] : 'unknown';
              
              missingClassCards.push({
                id,
                name,
                heroClass,
                file: file
              });
            }
          }
          
          // Reset for next card
          started = false;
        }
      }
    }
  });
  
  if (missingClassCards.length > 0) {
    log(`Found ${missingClassCards.length} cards missing class property out of ${totalCards} total cards:`, 'warn');
    console.table(missingClassCards);
  } else {
    log(`No cards missing class property found among ${totalCards} total cards.`, 'success');
  }
  
  return missingClassCards;
}

/**
 * Main function
 */
async function main() {
  try {
    // First, find and log cards still missing class property
    const missingClassCards = findMissingClassProperties();
    
    if (missingClassCards.length === 0) {
      log('All cards have class property. No action needed.', 'success');
      return;
    }
    
    // Process files to fix missing class properties
    const files = findCardFiles();
    let totalFixed = 0;
    
    for (const file of files) {
      log(`Processing ${file}...`);
      const fixedCount = processFileWithParsingApproach(file);
      totalFixed += fixedCount;
    }
    
    log(`Fixed ${totalFixed} files with missing class properties.`, 'success');
    
    // Check again to verify all cards have been fixed
    const remainingMissing = findMissingClassProperties();
    
    if (remainingMissing.length === 0) {
      log('All cards now have class property. Fix successful!', 'success');
    } else {
      log(`There are still ${remainingMissing.length} cards missing class property.`, 'warn');
    }
    
  } catch (error) {
    log(`Unhandled error: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run the script
main();