/**
 * Fix for the structure of classMinions.ts
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

async function fixFileStructure() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Step 1: Extract the header (import statements and comments)
    const headerMatch = content.match(/^[\s\S]*?export const classMinions: CardData\[\] = \[/);
    const header = headerMatch ? headerMatch[0] : '';
    
    // Step 2: Extract all card objects from the file
    const cardObjects = extractCards(content);
    
    if (cardObjects.length === 0) {
      throw new Error('Could not extract any valid card objects');
    }
    
    log(`Found ${cardObjects.length} card objects`);
    
    // Step 3: Re-create the file with proper structure
    const cardArrayContent = cardObjects.join(',\n\n');
    const fixedContent = `${header}\n${cardArrayContent}\n];\n\n// Export the class minions\nexport default classMinions;`;
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Applied fix for classMinions.ts structure');
    return { success: true, cardCount: cardObjects.length };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Extract card objects from content using a more robust approach
 */
function extractCards(content) {
  const cards = [];
  
  // Remove the array brackets and exports
  const strippedContent = content
    .replace(/export const classMinions: CardData\[\] = \[/, '')
    .replace(/\];[\s\S]*$/, '');
  
  // Split the content by looking for the pattern that starts a new card object
  const cardStartPattern = /\n\s*\{\s*\n\s*id:/g;
  
  // Get indices of all card starts
  const cardStartIndices = [];
  let match;
  while ((match = cardStartPattern.exec(strippedContent)) !== null) {
    cardStartIndices.push(match.index);
  }
  
  // Add the first card which doesn't have a newline before it
  const firstCardIndex = strippedContent.indexOf('{');
  if (firstCardIndex !== -1 && firstCardIndex < 20) { // First card should be near the start
    cardStartIndices.unshift(firstCardIndex);
  }
  
  // Extract each card
  for (let i = 0; i < cardStartIndices.length; i++) {
    const startIndex = cardStartIndices[i];
    const endIndex = (i < cardStartIndices.length - 1) ? 
                     cardStartIndices[i + 1] : 
                     strippedContent.length;
    
    let cardText = strippedContent.substring(startIndex, endIndex).trim();
    
    // Ensure the card ends with a proper closing brace
    if (!cardText.endsWith('}')) {
      cardText = ensureProperCardEnding(cardText);
    }
    
    // Remove any trailing commas after the closing brace
    cardText = cardText.replace(/},*$/, '}');
    
    cards.push(cardText);
  }
  
  return cards;
}

/**
 * Ensure each card ends with a proper closing brace
 */
function ensureProperCardEnding(cardText) {
  // Count the number of opening and closing braces
  let openBraces = 0;
  let closeBraces = 0;
  
  for (let i = 0; i < cardText.length; i++) {
    if (cardText[i] === '{') openBraces++;
    if (cardText[i] === '}') closeBraces++;
  }
  
  // Add missing closing braces
  while (closeBraces < openBraces) {
    cardText += '}';
    closeBraces++;
  }
  
  return cardText;
}

// Execute the fix
fixFileStructure()
  .then(result => {
    if (result.success) {
      log(`Successfully fixed classMinions.ts structure with ${result.cardCount} cards`);
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });