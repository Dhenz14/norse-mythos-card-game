/**
 * Fix Duplicates Within File
 * 
 * This script finds and removes duplicate card definitions within the same file.
 * It keeps the first instance of each card and removes subsequent duplicates.
 */

const fs = require('fs');

// Card IDs to fix and their corresponding files
const duplicatesInFiles = {
  'client/src/game/data/cards.ts': [3008, 3010, 5017, 5018, 14020],
  'client/src/game/data/additionalClassMinions.ts': [40020]
};

// Utility function to find all occurrences of a pattern in a string
function findAllOccurrences(str, regex) {
  const matches = [];
  let match;
  
  // Using exec with the global flag to find all occurrences
  while ((match = regex.exec(str)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      text: match[0]
    });
  }
  
  return matches;
}

// Function to fix duplicates in a file
function fixDuplicatesInFile(filePath, cardIds) {
  console.log(`Fixing duplicates in ${filePath} for card IDs: ${cardIds.join(', ')}`);
  
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Process each card ID
    for (const cardId of cardIds) {
      // Create a regex to find all instances of this card definition
      const cardRegex = new RegExp(`\\{[^{]*?id:\\s*${cardId}[^}]*?\\},?`, 'g');
      
      // Find all occurrences
      const occurrences = findAllOccurrences(content, cardRegex);
      
      if (occurrences.length > 1) {
        console.log(`Found ${occurrences.length} occurrences of card ID ${cardId}`);
        
        // Keep the first occurrence, remove the rest
        for (let i = 1; i < occurrences.length; i++) {
          const occurrence = occurrences[i];
          
          // Create a new string with the occurrence removed
          content = content.substring(0, occurrence.index) + 
                   content.substring(occurrence.index + occurrence.length);
          
          console.log(`Removed duplicate of card ID ${cardId} (occurrence #${i+1})`);
          
          // Need to adjust indices of subsequent occurrences
          for (let j = i + 1; j < occurrences.length; j++) {
            occurrences[j].index -= occurrence.length;
          }
        }
      } else {
        console.log(`No duplicates found for card ID ${cardId}`);
      }
    }
    
    // Fix any potential syntax issues caused by removal (like double commas)
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/\[\s*,/g, '[');
    content = content.replace(/,\s*\]/g, ']');
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath} successfully`);
    
  } catch (error) {
    console.error(`Error fixing duplicates in ${filePath}:`, error.message);
  }
}

// Main function to process all files
function main() {
  for (const [filePath, cardIds] of Object.entries(duplicatesInFiles)) {
    fixDuplicatesInFile(filePath, cardIds);
  }
}

// Run the script
main();