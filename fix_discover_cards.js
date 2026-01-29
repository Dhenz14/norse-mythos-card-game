/**
 * Script to fix missing class property in the discoverCards.ts file
 * 
 * This script specifically addresses the remaining cards in the discoverCards.ts file
 * that are missing the class property. It adds class: "Neutral" to all collectible cards
 * that don't already have a class property.
 */

const fs = require('fs');
const path = require('path');

// File path
const filePath = 'client/src/game/data/discoverCards.ts';

function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

function fixDiscoverCards() {
  log(`Processing ${filePath}...`);
  
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all instances of "collectible: true" that are not followed by "class:"
    // Use a regex with lookbehind to ensure we're not matching instances where class is already present
    const regex = /collectible:\s*true(?!,\s*class:)/g;
    
    // Replace all instances with "collectible: true, class: "Neutral""
    const updatedContent = content.replace(regex, 'collectible: true, class: "Neutral"');
    
    // Count the replacements made
    const replacementsCount = (updatedContent.match(/class: "Neutral"/g) || []).length - 
                             (content.match(/class: "Neutral"/g) || []).length;
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    log(`Added class: "Neutral" to ${replacementsCount} cards in ${filePath}`);
    
    return true;
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

// Execute the function
fixDiscoverCards();