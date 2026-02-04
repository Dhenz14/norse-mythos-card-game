/**
 * Comprehensive fix for classMinions.ts structural issues
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

async function fixStructure() {
  try {
    log('Reading file...');
    const content = await fs.promises.readFile(filePath, 'utf8');
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    await fs.promises.writeFile(backupPath, content, 'utf8');
    log(`Created backup at ${backupPath}`);
    
    // Extract the file header - import statements and comments
    const headerMatch = content.match(/^[\s\S]*?\bexport const classMinions: CardData\[\] = \[/);
    const header = headerMatch ? headerMatch[0] : '/**\n * Class-specific minions for Hearthstone clone\n */\nimport { CardData, HeroClass } from \'../types\';\n\nexport const classMinions: CardData[] = [';
    
    // Extract the array content
    const contentStartIndex = header.length;
    const contentEndIndex = content.lastIndexOf('];');
    
    if (contentEndIndex === -1) {
      throw new Error('Could not find end of array');
    }
    
    // Get the array content
    let arrayContent = content.substring(contentStartIndex, contentEndIndex + 1);
    
    // Normalize array elements and ensure proper commas
    const normalizedContent = normalizeArrayContent(arrayContent);
    
    // Create the fixed file content
    const fixedContent = `${header}${normalizedContent}\n\n// Export the class minions\nexport default classMinions;`;
    
    // Write the fixed content back
    await fs.promises.writeFile(filePath, fixedContent, 'utf8');
    
    log('Applied comprehensive fix for classMinions.ts structure');
    return { success: true };
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Normalize array content by ensuring proper separations between objects
 */
function normalizeArrayContent(content) {
  // Remove the closing bracket if present
  content = content.replace(/\];$/, '');
  
  // Split the content into individual cards based on pattern
  const cardStrings = [];
  let currentCard = '';
  let braceCount = 0;
  let inString = false;
  let prevChar = '';
  
  // Parse character by character
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    // Track strings
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    }
    
    // Track braces
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    
    // Add character to current card
    currentCard += char;
    
    // Check if we're at the end of a card
    if (braceCount === 0 && char === '}' && !inString) {
      // We found a complete card
      cardStrings.push(currentCard.trim());
      currentCard = '';
    }
    
    prevChar = char;
  }
  
  // Final cleanup and joining
  return cardStrings
    .filter(card => card.length > 5) // Filter out any empty or very small fragments
    .join(',\n\n');
}

// Execute the fix
fixStructure()
  .then(result => {
    if (result.success) {
      log('Successfully fixed class minions structure');
    } else {
      log(`Failed: ${result.error}`, 'error');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });