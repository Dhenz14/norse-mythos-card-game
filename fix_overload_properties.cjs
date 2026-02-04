/**
 * Script to fix overload properties in card data
 * 
 * This script converts all overload properties from simple numbers to the correct object format:
 * From: overload: 2
 * To: overload: { amount: 2 }
 * 
 * It processes all card files that might contain overload cards.
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌ ERROR:' : level === 'warn' ? '⚠️ WARNING:' : '✅ INFO:';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Process a single file to fix overload properties
 */
async function processFile(filePath) {
  try {
    // Read the file content
    let content = await fs.promises.readFile(filePath, 'utf8');
    
    // Skip if file doesn't contain "overload:" at all
    if (!content.includes('overload:')) {
      return { filePath, changed: false, message: "No overload properties found" };
    }
    
    // Regex to match direct overload number assignments
    // This looks for patterns like "overload: 2," or "overload: 1" at the end of a file
    const overloadRegex = /overload:\s*(\d+)(\s*[,}])/g;
    let match;
    let hasChanges = false;
    
    // Replace all instances of direct overload number assignments
    let updatedContent = content;
    while ((match = overloadRegex.exec(content)) !== null) {
      const overloadValue = match[1];
      const fullMatch = match[0];
      const endChar = match[2].trim(); // This will be either "," or "}"
      
      // Create the replacement string with the object format
      const replacement = `overload: {\n        amount: ${overloadValue}\n      }${endChar}`;
      
      // Replace this instance in the content
      updatedContent = updatedContent.replace(fullMatch, replacement);
      hasChanges = true;
      
      log(`Found overload: ${overloadValue} in ${filePath}`);
    }
    
    // If changes were made, write back to the file
    if (hasChanges) {
      await fs.promises.writeFile(filePath, updatedContent, 'utf8');
      return { filePath, changed: true, message: "Updated overload properties" };
    }
    
    return { filePath, changed: false, message: "No direct overload properties found" };
  } catch (error) {
    log(`Error processing file ${filePath}: ${error.message}`, 'error');
    return { filePath, changed: false, error: error.message };
  }
}

/**
 * Find all card files that might contain overload properties
 */
async function findCardFiles() {
  const cardFilePaths = [
    path.join(__dirname, 'client/src/game/data/overloadCards.ts'),
    path.join(__dirname, 'client/src/game/data/cards.ts'),
    // Add any other files that might contain overload cards
    path.join(__dirname, 'client/src/game/data/cardSets/shamanCards.ts'),
  ];
  
  // Filter to only include files that exist
  const existingFiles = [];
  for (const filePath of cardFilePaths) {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.isFile()) {
        existingFiles.push(filePath);
      }
    } catch (error) {
      // File doesn't exist, skip it
    }
  }
  
  return existingFiles;
}

/**
 * Main function
 */
async function main() {
  log("Starting overload property fix script");
  
  try {
    // Find all relevant card files
    const cardFiles = await findCardFiles();
    log(`Found ${cardFiles.length} card file(s) to check`);
    
    if (cardFiles.length === 0) {
      log("No card files found. Exiting.", 'warn');
      return;
    }
    
    // Process each file
    const results = [];
    for (const filePath of cardFiles) {
      log(`Processing ${filePath}...`);
      const result = await processFile(filePath);
      results.push(result);
    }
    
    // Log summary
    const changedFiles = results.filter(r => r.changed);
    log(`Processed ${results.length} file(s), updated ${changedFiles.length} file(s)`);
    
    changedFiles.forEach(file => {
      log(`Updated: ${file.filePath}`);
    });
    
    if (changedFiles.length === 0) {
      log("No files needed updates");
    }
  } catch (error) {
    log(`Error running script: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error');
  process.exit(1);
});