/**
 * Script to fix various comma-related issues in effect objects
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define all effect types to check for
const effectTypes = [
  'battlecry', 'deathrattle', 'spellEffect', 'secretEffect', 
  'auraEffect', 'onPlayEffect', 'comboEffect', 'secondaryEffect'
];

// Function to fix a specific issue in a file's content
function fixEffectCommas(content) {
  let modified = content;
  
  // Fix comma after opening brace in effect declarations
  for (const effectType of effectTypes) {
    const pattern = new RegExp(`${effectType}\\s*:\\s*\\{\\s*,`, 'g');
    modified = modified.replace(pattern, `${effectType}: {`);
  }
  
  return modified;
}

// Function to process a single file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modifiedContent = fixEffectCommas(content);
    
    if (content !== modifiedContent) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      console.log(`Updated ${filePath}`);
      return true;
    } else {
      console.log(`No changes needed for ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting to fix effect commas in card files...');
  
  // Find all TypeScript files in the game/data directory
  const files = glob.sync('client/src/game/data/**/*.ts');
  
  let changedFilesCount = 0;
  
  for (const file of files) {
    const changed = processFile(file);
    if (changed) changedFilesCount++;
  }
  
  console.log(`Completed. Fixed ${changedFilesCount} files.`);
}

main();