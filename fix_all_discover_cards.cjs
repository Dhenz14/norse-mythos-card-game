/**
 * Comprehensive script to fix all issues in discoverCards.ts
 * - Add class property to cards missing it
 * - Fix duplicate class properties
 * - Ensure consistent property format
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

/**
 * Extract card objects from file content
 */
function extractCardObjects(content) {
  // Regex to extract each card object
  const cardRegex = /\{\s*id:\s*\d+[\s\S]*?collectible:\s*(?:true|false)(?:,\s*class:\s*["'](?:\w+)["'])?\s*\}/g;
  return [...content.matchAll(cardRegex)].map(match => match[0]);
}

/**
 * Fix a single card object
 */
function fixCardObject(cardString) {
  // Check if card already has heroClass property
  const heroClassMatch = cardString.match(/heroClass:\s*['"](\w+)['"]/);
  
  if (heroClassMatch) {
    const heroClass = heroClassMatch[1];
    // Capitalize first letter for class property
    const capitalizedClass = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
    
    // Check if card already has class property
    if (cardString.includes(`class: "${capitalizedClass}"`)) {
      // Fix duplicate class property if it exists
      return cardString.replace(
        new RegExp(`class:\\s*["']${capitalizedClass}["']\\s*,\\s*class:\\s*["']\\w+["']`),
        `class: "${capitalizedClass}"`
      );
    }
    
    // Fix "collectible: true, class: "Neutral"" when heroClass is already set
    return cardString.replace(
      /collectible:\s*true,\s*class:\s*["']Neutral["']/,
      'collectible: true'
    );
  }
  
  // If no heroClass, check if card needs class property
  if (!cardString.includes('class:')) {
    // Add class: "Neutral" if missing
    return cardString.replace(
      /collectible:\s*true/,
      'collectible: true, class: "Neutral"'
    );
  }
  
  return cardString;
}

/**
 * Process the discoverCards.ts file
 */
function fixFile(filePath) {
  log(`Processing ${filePath}...`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Extract each card object
  const cardObjects = extractCardObjects(content);
  
  // Process each card object
  let fixedContent = content;
  let fixCount = 0;
  
  cardObjects.forEach(cardObj => {
    const fixedCard = fixCardObject(cardObj);
    if (fixedCard !== cardObj) {
      fixedContent = fixedContent.replace(cardObj, fixedCard);
      fixCount++;
    }
  });
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  
  log(`Fixed ${fixCount} cards in ${filePath}`);
  return fixCount;
}

function main() {
  const filePath = 'client/src/game/data/discoverCards.ts';
  fixFile(filePath);
}

main();