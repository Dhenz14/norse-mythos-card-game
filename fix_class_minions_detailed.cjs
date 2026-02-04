/**
 * Detailed fix for the structure of classMinions.ts
 * This script ensures:
 * 1. Correct card structure with proper braces
 * 2. No double commas between cards
 * 3. Proper indentation of properties
 * 4. Proper closing of nested properties
 */
const fs = require('fs');

// Log function
function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : 
                 level === 'warning' ? '⚠️ WARNING: ' : 
                 '✅ INFO: ';
  console.log(prefix + message);
}

// Path to file
const filePath = 'client/src/game/data/classMinions.ts';

// Card template for reference
const cardTemplate = {
  id: 0,
  name: "",
  manaCost: 0,
  attack: 0,
  health: 0,
  type: "minion",
  rarity: "",
  description: "",
  keywords: [],
  heroClass: "",
  class: "",
  collectible: true
};

// Main function to fix file
async function fixFileStructure() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Extract file header and footer
    const headerMatch = content.match(/^[\s\S]*?export const classMinions: CardData\[\] = \[/);
    const header = headerMatch ? headerMatch[0] : '';
    
    const footerMatch = content.match(/\];[\s\S]*$/);
    const footer = footerMatch ? footerMatch[0] : '];\n\n// Export the class minions\nexport default classMinions;';
    
    // Extract individual cards
    const cardStrings = extractCardStrings(content);
    log(`Found ${cardStrings.length} card strings in the file`);
    
    // Process each card to ensure it has proper structure
    const processedCards = cardStrings.map(processCardString);
    log(`Processed ${processedCards.length} cards`);
    
    // Join cards with proper separators
    const cardsContent = processedCards.join(',\n\n');
    
    // Create the final content
    const fixedContent = `${header}\n${cardsContent}\n${footer}`;
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Successfully fixed classMinions.ts with detailed corrections');
    return { success: true, cardCount: processedCards.length };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Extract card strings from the file content
 */
function extractCardStrings(content) {
  // Remove array brackets and export statements
  const contentWithoutBrackets = content
    .replace(/export const classMinions: CardData\[\] = \[/, '')
    .replace(/\];[\s\S]*$/, '');
  
  // Split by card ID pattern to get individual cards
  // Looking for patterns like "id: 5100," or "id: 5101,"
  const cardStrings = contentWithoutBrackets.split(/,\s*\n\s*{\s*\n\s*id:/);
  
  // Process the first card separately
  if (cardStrings.length > 0) {
    cardStrings[0] = cardStrings[0].replace(/^\s*{\s*\n\s*id:/, 'id:');
  }
  
  // Re-add opening brace to all cards except the first one
  return cardStrings.map((card, index) => {
    return index === 0 ? `{\n      ${card}` : `{\n      id:${card}`;
  });
}

/**
 * Process each card string to ensure proper structure
 */
function processCardString(cardString) {
  // Count opening and closing braces to ensure balance
  let openBraces = (cardString.match(/{/g) || []).length;
  let closeBraces = (cardString.match(/}/g) || []).length;
  
  // Add missing closing braces if needed
  let processed = cardString;
  while (closeBraces < openBraces) {
    processed += '}';
    closeBraces++;
  }
  
  // Fix the last card which has a missing bracket for onEvent
  if (processed.includes('onEvent:') && !processed.includes('onEvent: {')) {
    processed = processed.replace(/onEvent:\s*{/g, 'onEvent: {');
  }
  
  // Ensure the collectible property is at the root level
  if (!processed.includes('collectible:') && !processed.includes('collectible: ')) {
    processed += ',\n  collectible: true';
  } else if (processed.match(/}\s*,?\s*collectible: true/)) {
    // If collectible is after a closing brace, ensure there's a comma
    processed = processed.replace(/}\s*,?\s*collectible: true/, '}, collectible: true');
  }
  
  // Ensure card ends with closing brace and no trailing comma
  processed = processed.replace(/,\s*}$/, '}');
  
  return processed;
}

// Execute the fix
fixFileStructure()
  .then(result => {
    if (result.success) {
      log(`Successfully fixed classMinions.ts with ${result.cardCount} cards`);
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });