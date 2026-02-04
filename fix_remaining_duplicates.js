/**
 * Script to fix remaining duplicate cards in the codebase
 * This script will analyze all card files and produce a corrected version 
 * with duplicates removed based on specific priority rules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Priority order for keeping cards (highest to lowest)
// Cards in these files will be preserved over duplicates in other files
const FILE_PRIORITY = [
  'iconicLegendaryCards.ts',     // Highest priority - keep iconic legendary cards
  'legendaryCards.ts',           // Keep main legendary cards
  'highlanderCards.ts',          // Keep Highlander cards (Reno, Kazakus, etc.)
  'oldGodsCards.ts',             // Keep Old Gods cards
  'jadeGolemCards.ts',           // Keep Jade cards
  'colossalCards.ts',            // Keep Colossal cards
  'expansionLegendaryCards.ts',  // Keep expansion-specific legendary cards
  'mechanicCards.ts',            // Keep cards with specific mechanics
  'classMinions.ts',             // Keep class-specific minions
  'spellCards.ts',               // Keep spell cards
  'neutralMinions.ts',           // Keep neutral minions
  'cards.ts'                     // Lowest priority - remove from generic cards.ts
];

// Storage for all cards
const allCards = {};
// Track which files each card appears in
const cardLocations = {};

// Function to extract cards from a file
function extractCardsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Match export arrays like "export const cards = ["
    const regex = /export\s+const\s+(\w+)\s*=\s*\[/g;
    let match;
    let fileContent = content;
    let arrayNames = [];
    
    while ((match = regex.exec(content)) !== null) {
      arrayNames.push(match[1]); // Store array names
    }
    
    // Process each array
    arrayNames.forEach(arrayName => {
      // Extract array content
      const arrayRegex = new RegExp(`export\\s+const\\s+${arrayName}\\s*=\\s*\\[(.*?)\\]\\s*;`, 's');
      const arrayMatch = arrayRegex.exec(fileContent);
      
      if (arrayMatch && arrayMatch[1]) {
        const arrayContent = arrayMatch[1];
        
        // Split into individual card objects
        let bracketCount = 0;
        let currentCard = '';
        let cards = [];
        
        for (let i = 0; i < arrayContent.length; i++) {
          const char = arrayContent[i];
          
          if (char === '{') {
            bracketCount++;
            currentCard += char;
          } else if (char === '}') {
            bracketCount--;
            currentCard += char;
            
            if (bracketCount === 0) {
              cards.push(currentCard.trim());
              currentCard = '';
            }
          } else {
            currentCard += char;
          }
        }
        
        // Process each card
        cards.forEach(cardText => {
          try {
            // Extract id
            const idMatch = /id:\s*(\d+)/g.exec(cardText);
            // Extract name
            const nameMatch = /name:\s*"([^"]+)"/g.exec(cardText);
            
            if (idMatch && nameMatch) {
              const id = parseInt(idMatch[1]);
              const name = nameMatch[1];
              
              // Store card information
              if (!allCards[name]) {
                allCards[name] = {};
              }
              
              allCards[name][id] = {
                id,
                name,
                file: fileName,
                arrayName,
                content: cardText
              };
              
              // Track which file and line this card appears in
              if (!cardLocations[name]) {
                cardLocations[name] = [];
              }
              
              cardLocations[name].push({
                id,
                file: fileName,
                arrayName
              });
            }
          } catch (error) {
            console.error(`Error processing card in ${fileName}:`, error);
          }
        });
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return false;
  }
}

// Function to determine which duplicates to keep based on file priority
function determineCardsToKeep() {
  const cardsToKeep = new Map();
  const cardsToRemove = [];
  
  Object.keys(cardLocations).forEach(cardName => {
    const instances = cardLocations[cardName];
    
    if (instances.length > 1) {
      // Sort instances by file priority
      instances.sort((a, b) => {
        const aIndex = FILE_PRIORITY.indexOf(a.file);
        const bIndex = FILE_PRIORITY.indexOf(b.file);
        
        // If both files are in priority list, use that order
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only one file is in priority list, it takes precedence
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // If neither file is in priority list, keep alphabetical
        return a.file.localeCompare(b.file);
      });
      
      // Keep the highest priority instance
      const keep = instances[0];
      cardsToKeep.set(`${cardName}-${keep.id}`, {
        name: cardName,
        id: keep.id,
        file: keep.file,
        arrayName: keep.arrayName
      });
      
      // Mark others for removal
      for (let i = 1; i < instances.length; i++) {
        const remove = instances[i];
        cardsToRemove.push({
          name: cardName,
          id: remove.id,
          file: remove.file,
          arrayName: remove.arrayName
        });
      }
    } else {
      // Only one instance, keep it
      const keep = instances[0];
      cardsToKeep.set(`${cardName}-${keep.id}`, {
        name: cardName,
        id: keep.id,
        file: keep.file,
        arrayName: keep.arrayName
      });
    }
  });
  
  return { cardsToKeep, cardsToRemove };
}

// Function to update files with duplicates removed
function updateFiles(cardsToRemove) {
  // Group cards to remove by file
  const fileUpdates = {};
  
  cardsToRemove.forEach(card => {
    if (!fileUpdates[card.file]) {
      fileUpdates[card.file] = [];
    }
    
    fileUpdates[card.file].push(card);
  });
  
  // Process each file
  Object.keys(fileUpdates).forEach(fileName => {
    const filePath = path.join('client', 'src', 'game', 'data', fileName);
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Group cards by array name
      const arrayUpdates = {};
      fileUpdates[fileName].forEach(card => {
        if (!arrayUpdates[card.arrayName]) {
          arrayUpdates[card.arrayName] = [];
        }
        arrayUpdates[card.arrayName].push(card);
      });
      
      // Process each array in the file
      Object.keys(arrayUpdates).forEach(arrayName => {
        const cardsInArray = arrayUpdates[arrayName];
        
        // Sort cards by id in descending order to avoid offset issues
        cardsInArray.sort((a, b) => b.id - a.id);
        
        // Extract the array content
        const arrayRegex = new RegExp(`export\\s+const\\s+${arrayName}\\s*=\\s*\\[(.*?)\\]\\s*;`, 's');
        const arrayMatch = arrayRegex.exec(content);
        
        if (arrayMatch && arrayMatch[1]) {
          let arrayContent = arrayMatch[1];
          
          // Remove each card from array content
          cardsInArray.forEach(card => {
            // Find and remove the card object
            let cardContent = allCards[card.name][card.id].content;
            
            // Handle different formatting patterns
            let cardPattern = new RegExp(`\\s*${cardContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?`, 'g');
            arrayContent = arrayContent.replace(cardPattern, '');
            
            // Alternative pattern with different whitespace
            cardPattern = new RegExp(`\\s*{[^}]*id:\\s*${card.id}[^}]*}\\s*,?`, 'g');
            arrayContent = arrayContent.replace(cardPattern, '');
          });
          
          // Clean up any artifact commas
          arrayContent = arrayContent.replace(/,\s*,/g, ',');
          arrayContent = arrayContent.replace(/,\s*]/g, ']');
          arrayContent = arrayContent.replace(/\[\s*,/g, '[');
          
          // Replace array in file content
          content = content.replace(arrayMatch[0], `export const ${arrayName} = [${arrayContent}];`);
        }
      });
      
      // Write updated content back to file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${fileName} - removed ${fileUpdates[fileName].length} duplicates`);
    } catch (error) {
      console.error(`Error updating file ${fileName}:`, error);
    }
  });
}

// Main execution
const dataDir = path.join('client', 'src', 'game', 'data');
let fileCount = 0;
let cardCount = 0;

// Process all TypeScript files in the data directory
fs.readdirSync(dataDir).forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(dataDir, file);
    if (extractCardsFromFile(filePath)) {
      fileCount++;
    }
  }
});

// Count total cards
Object.keys(allCards).forEach(name => {
  cardCount += Object.keys(allCards[name]).length;
});

console.log(`Processed ${fileCount} files, found ${cardCount} cards`);
console.log(`Found ${Object.keys(cardLocations).length} unique card names`);

// Count duplicates
let duplicateCount = 0;
Object.keys(cardLocations).forEach(name => {
  duplicateCount += Math.max(0, cardLocations[name].length - 1);
});

console.log(`Found ${duplicateCount} duplicate cards`);

// Determine which cards to keep and which to remove
const { cardsToKeep, cardsToRemove } = determineCardsToKeep();

console.log(`Keeping ${cardsToKeep.size} cards, removing ${cardsToRemove.length} duplicates`);

// Update files
updateFiles(cardsToRemove);

console.log('Done!');