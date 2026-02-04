/**
 * Script to fix effect type strings in card files
 * 
 * This script ensures that effect type strings in battlecry and spellEffect objects
 * are properly formatted as string literals and not used as properties.
 * It fixes issues with 'transform' and 'destroy_weapon' types that were causing TypeScript errors.
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = {
    'info': '\x1b[36m[INFO]\x1b[0m',
    'warn': '\x1b[33m[WARNING]\x1b[0m',
    'error': '\x1b[31m[ERROR]\x1b[0m',
    'success': '\x1b[32m[SUCCESS]\x1b[0m',
  }[level] || '\x1b[36m[INFO]\x1b[0m';
  
  console.log(`${prefix} ${message}`);
}

// Find all card files in the client/src/game/data directory
async function findCardFiles() {
  const dataDir = path.join('client', 'src', 'game', 'data');
  const files = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.ts') && !file.includes('test'))
    .map(file => path.join(dataDir, file));
  
  log(`Found ${files.length} card files to process`);
  return files;
}

// Process a single file to fix effect type issues
function processFile(filePath) {
  log(`Processing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix issues where 'type' is missing quotes within objects 
  const effectTypesRegex = /type\s*:\s*([a-zA-Z_]+)(?=\s*,|\s*})/g;
  
  // Find all matches for analysis
  const matches = [...content.matchAll(effectTypesRegex)];
  if (matches.length > 0) {
    log(`Found ${matches.length} potential effect type issues in ${filePath}`);
    
    // Replace each match with proper string literal formatting
    content = content.replace(effectTypesRegex, (match, typeValue) => {
      // Skip if already quoted
      if (typeValue.startsWith('"') || typeValue.startsWith("'")) {
        return match;
      }
      
      // Skip if it's a variable reference
      if (typeValue.includes('.')) {
        return match;
      }
      
      log(`  Fixing type: ${typeValue}`);
      modified = true;
      return `type: "${typeValue}"`;
    });
    
    // Fix specifically the transform and destroy_weapon types
    content = content.replace(
      /type\s*:\s*transform(?=\s*,|\s*})/g,
      'type: "transform"'
    );
    
    content = content.replace(
      /type\s*:\s*destroy_weapon(?=\s*,|\s*})/g,
      'type: "destroy_weapon"'
    );
  }
  
  // Fix indentation issues in deathrattle and battlecry objects
  content = content.replace(
    /(deathrattle|battlecry|spellEffect)\s*:\s*{\s*\n\s*type\s*:/g,
    (match) => {
      modified = true;
      const indentation = match.match(/{\s*\n(\s*)/)[1];
      return match.replace(/{\s*\n\s*/, `{\n${indentation}  `);
    }
  );
  
  // Only write back if changes were made
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`Updated ${filePath}`, 'success');
    return true;
  } else {
    log(`No changes needed in ${filePath}`);
    return false;
  }
}

// Main function to process all files
async function main() {
  const cardFiles = await findCardFiles();
  let modifiedCount = 0;
  
  for (const file of cardFiles) {
    try {
      const wasModified = processFile(file);
      if (wasModified) modifiedCount++;
    } catch (error) {
      log(`Error processing ${file}: ${error.message}`, 'error');
    }
  }
  
  log(`Finished processing ${cardFiles.length} files. Modified ${modifiedCount} files.`, 'success');
}

// Run the script
main().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});