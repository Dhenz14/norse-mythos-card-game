/**
 * Full Coverage Class Property Fixer
 *
 * This script applies the class property to ALL non-neutral cards that have a heroClass
 * but no class property, regardless of how they're defined or organized.
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
  return heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
}

/**
 * Process a file with a simple text replacement approach
 */
function processFileWithTextReplacement(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all heroClass declarations that aren't 'neutral'
  const heroClassRegex = /heroClass\s*:\s*['"]([^'"]+)['"]/g;
  let match;
  let updatedContent = content;
  let replacements = 0;
  
  // Track already processed sections to avoid duplicates
  const processedRanges = [];
  
  while ((match = heroClassRegex.exec(content)) !== null) {
    // Skip if it's neutral
    if (match[1] === 'neutral') continue;
    
    // Check if we're in an already processed range
    let inProcessedRange = false;
    for (const [start, end] of processedRanges) {
      if (match.index >= start && match.index <= end) {
        inProcessedRange = true;
        break;
      }
    }
    if (inProcessedRange) continue;
    
    // Check if class property is already present in the vicinity
    const nearbyContent = content.substring(Math.max(0, match.index - 50), match.index + 150);
    if (nearbyContent.includes('class:')) continue;
    
    // Convert heroClass to proper Class format
    const heroClass = match[1];
    const className = heroClassToClass(heroClass);
    
    // Insert class property after heroClass
    const insertion = `${match[0]},\n      class: "${className}"`;
    
    // Create replacement with proper indentation
    updatedContent = updatedContent.replace(match[0], insertion);
    replacements++;
    
    // Track processed range to avoid overlapping replacements
    processedRanges.push([match.index, match.index + match[0].length + 50]);
  }
  
  // Save the file if changes were made
  if (replacements > 0) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    log(`Updated ${replacements} cards in ${filePath}`, 'success');
    return replacements;
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
 * Main function
 */
async function main() {
  try {
    const files = findCardFiles();
    log(`Found ${files.length} card files to process`);
    
    let totalFixed = 0;
    
    for (const file of files) {
      log(`Processing ${file}...`);
      const fixedCount = processFileWithTextReplacement(file);
      totalFixed += fixedCount;
    }
    
    log(`Fixed a total of ${totalFixed} cards across all files`, 'success');
    
  } catch (error) {
    log(`Unhandled error: ${error.message}`, 'error');
  }
}

// Run the script
main();