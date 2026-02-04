/**
 * Remove Duplicate Card Definitions
 * 
 * This script removes duplicate card definitions across class files,
 * keeping only the most appropriate definition for each card ID.
 */

const fs = require('fs');
const path = require('path');

// Mapping of card IDs to the file where their definition should be kept
const cardIdToPreferredFile = {
  // Priest duplicates
  10011: 'client/src/game/data/dormantCards.ts', // Imprisoned Homunculus - keep in dormant cards
  
  // Demonhunter duplicates  
  10005: 'client/src/game/data/dormantCards.ts', // Imprisoned Gan'arg - keep in dormant cards
  
  // Druid duplicates
  9010: 'client/src/game/data/frenzyCards.ts', // Toad of the Wilds - keep in frenzy cards
  
  // Hunter duplicates
  9009: 'client/src/game/data/frenzyCards.ts', // Goretusk Ravager - keep in frenzy cards
  10004: 'client/src/game/data/dormantCards.ts', // Imprisoned Felmaw - keep in dormant cards
  30101: 'client/src/game/data/mechanicCards.ts', // Hound - keep in mechanic cards
  
  // Mage duplicates
  14020: 'client/src/game/data/cards.ts', // Meteor - keep first instance
  
  // Neutral duplicates
  3008: 'client/src/game/data/cards.ts', // Blood Knight - keep first instance
  3010: 'client/src/game/data/cards.ts', // Crazed Alchemist - keep first instance
  9006: 'client/src/game/data/frenzyCards.ts', // Peon - keep in frenzy cards
  10003: 'client/src/game/data/dormantCards.ts', // Imprisoned Vilefiend - keep in dormant cards
  10007: 'client/src/game/data/dormantCards.ts', // Magtheridon - keep in dormant cards
  20004: 'client/src/game/data/magneticCards.ts', // Wargear - keep in magnetic cards
  
  // Paladin duplicates
  20008: 'client/src/game/data/magneticCards.ts', // Glow-Tron - keep in magnetic cards
  
  // Warlock duplicates
  10010: 'client/src/game/data/dormantCards.ts', // Imprisoned Scrap Imp - keep in dormant cards
  20036: 'client/src/game/data/legendaryCards.ts', // Skull of the Man'ari - keep in legendary cards
  
  // Warrior duplicates
  5017: 'client/src/game/data/cards.ts', // Bloodhoof Brave - keep first instance
  5018: 'client/src/game/data/cards.ts', // Slam - keep first instance
  20009: 'client/src/game/data/magneticCards.ts', // Beryllium Nullifier - keep in magnetic cards
  40020: 'client/src/game/data/additionalClassMinions.ts' // Armored Warhorse - keep first instance
};

// Function to remove a card definition from a file
function removeCardFromFile(filePath, cardId) {
  try {
    console.log(`Removing card ID ${cardId} from ${filePath}`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Create a regex to match the entire card definition
    const cardDefRegex = new RegExp(`\\{[^{]*?id:\\s*${cardId}[^}]*?\\},?`, 'gs');
    
    // Replace the card definition with an empty string
    const newContent = content.replace(cardDefRegex, '');
    
    // Fix any double commas that might be created
    const fixedContent = newContent.replace(/,\s*,/g, ',').replace(/\[\s*,/g, '[');
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    
    return true;
  } catch (error) {
    console.error(`Error removing card from ${filePath}:`, error.message);
    return false;
  }
}

// Function to get all files that need to be processed
function getFilesToProcess() {
  const preferredFiles = new Set(Object.values(cardIdToPreferredFile));
  const cardIds = Object.keys(cardIdToPreferredFile);
  
  // Collect all files that might have duplicates
  const filesToProcess = new Set();
  
  // Look through all the card files in the data directory
  const dataDir = 'client/src/game/data';
  const files = fs.readdirSync(dataDir);
  
  files.forEach(file => {
    if (file.endsWith('.ts')) {
      const fullPath = path.join(dataDir, file);
      filesToProcess.add(fullPath);
    }
  });
  
  return Array.from(filesToProcess);
}

// Find card IDs in a file
function findCardIdsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const cardIdRegex = /id:\s*(\d+)/g;
    
    const cardIds = [];
    let match;
    
    while ((match = cardIdRegex.exec(content)) !== null) {
      cardIds.push(parseInt(match[1], 10));
    }
    
    return cardIds;
  } catch (error) {
    console.error(`Error finding cards in ${filePath}:`, error.message);
    return [];
  }
}

// Main function
function main() {
  console.log('=== Removing Duplicate Card Definitions ===\n');
  
  // Get all files to process
  const filesToProcess = getFilesToProcess();
  console.log(`Processing ${filesToProcess.length} card files...\n`);
  
  // Map of card IDs to the files they're found in
  const cardIdToFiles = {};
  
  // Find all occurrences of card IDs
  filesToProcess.forEach(file => {
    const cardIds = findCardIdsInFile(file);
    
    cardIds.forEach(cardId => {
      if (!cardIdToFiles[cardId]) {
        cardIdToFiles[cardId] = [];
      }
      
      if (!cardIdToFiles[cardId].includes(file)) {
        cardIdToFiles[cardId].push(file);
      }
    });
  });
  
  // Process each duplicate card
  let removedCount = 0;
  
  for (const [cardId, preferredFile] of Object.entries(cardIdToPreferredFile)) {
    const id = parseInt(cardId, 10);
    const files = cardIdToFiles[id] || [];
    
    // Skip if card not found or only in one file
    if (files.length <= 1) {
      console.log(`Card ID ${id} not found or not duplicated, skipping.`);
      continue;
    }
    
    // Remove the card from all files except the preferred one
    for (const file of files) {
      if (file !== preferredFile) {
        console.log(`Removing card ID ${id} from ${file} (keeping in ${preferredFile})`);
        if (removeCardFromFile(file, id)) {
          removedCount++;
        }
      }
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Removed ${removedCount} duplicate card definitions`);
  console.log(`Done.`);
}

// Run the script
main();