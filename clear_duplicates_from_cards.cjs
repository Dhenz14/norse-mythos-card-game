/**
 * Script specifically to remove duplicate cards from cards.ts
 * Since most duplicates are in cards.ts, this script will aggressively clean that file
 */

const fs = require('fs');
const path = require('path');

// Function to extract names and IDs from all files except cards.ts
function findCardsInOtherFiles() {
  const dataDir = path.join('client', 'src', 'game', 'data');
  const cardsToKeep = new Set();
  
  // Read all .ts files except cards.ts
  fs.readdirSync(dataDir).forEach(file => {
    if (file.endsWith('.ts') && file !== 'cards.ts') {
      try {
        const filePath = path.join(dataDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract card names
        const nameMatches = content.match(/name:\s*"([^"]+)"/g) || [];
        nameMatches.forEach(match => {
          const name = match.match(/name:\s*"([^"]+)"/)[1];
          cardsToKeep.add(name);
        });
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
  });
  
  console.log(`Found ${cardsToKeep.size} card names in other files to preserve`);
  return cardsToKeep;
}

// Function to fix cards.ts by removing duplicates
function fixCardsFile(cardsToKeep) {
  const cardsPath = path.join('client', 'src', 'game', 'data', 'cards.ts');
  try {
    const content = fs.readFileSync(cardsPath, 'utf8');
    
    // Extract the cards array with type annotation
    const arrayMatch = content.match(/export\s+const\s+fullCardDatabase\s*:\s*CardData\[\]\s*=\s*\[([\s\S]*?)\]\s*;/);
    if (!arrayMatch) {
      console.error('Could not find fullCardDatabase array in cards.ts');
      return;
    }
    
    const arrayContent = arrayMatch[1];
    
    // Split into individual cards
    const cards = [];
    let bracketCount = 0;
    let currentCard = '';
    let inComment = false;
    
    for (let i = 0; i < arrayContent.length; i++) {
      const char = arrayContent[i];
      const nextChar = arrayContent[i + 1] || '';
      
      // Handle comments
      if (char === '/' && nextChar === '*' && !inComment) {
        inComment = true;
        currentCard += char + nextChar;
        i++; // Skip next char
        continue;
      }
      
      if (char === '*' && nextChar === '/' && inComment) {
        inComment = false;
        currentCard += char + nextChar;
        i++; // Skip next char
        continue;
      }
      
      if (inComment) {
        currentCard += char;
        continue;
      }
      
      // Track object brackets
      if (char === '{') {
        if (bracketCount === 0) {
          currentCard = char;
        } else {
          currentCard += char;
        }
        bracketCount++;
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
    
    console.log(`Found ${cards.length} cards in cards.ts`);
    
    // Process each card
    const cardsToRemove = [];
    const cardsToPreserve = [];
    const namesEncountered = new Set();
    
    cards.forEach(card => {
      // Extract card name
      const nameMatch = card.match(/name:\s*"([^"]+)"/);
      if (nameMatch) {
        const name = nameMatch[1];
        
        if (cardsToKeep.has(name)) {
          // Card exists in other files, mark for removal
          cardsToRemove.push(card);
          console.log(`Marking "${name}" for removal (exists in other files)`);
        } else if (namesEncountered.has(name)) {
          // Duplicate in cards.ts, mark the duplicates for removal
          cardsToRemove.push(card);
          console.log(`Marking "${name}" for removal (duplicate in cards.ts)`);
        } else {
          // Keep the first instance
          namesEncountered.add(name);
          cardsToPreserve.push(card);
        }
      } else {
        // No name found, just keep it
        cardsToPreserve.push(card);
      }
    });
    
    console.log(`Removing ${cardsToRemove.length} cards from cards.ts`);
    
    // Build the new content
    let newArrayContent = cardsToPreserve.join(',\n');
    const newContent = content.replace(arrayMatch[0], `export const fullCardDatabase: CardData[] = [\n${newArrayContent}\n];`);
    
    // Write the modified content back to the file
    fs.writeFileSync(cardsPath, newContent, 'utf8');
    console.log(`Successfully updated cards.ts - removed ${cardsToRemove.length} duplicates`);
    
  } catch (error) {
    console.error('Error updating cards.ts:', error);
  }
}

// Main function
function main() {
  console.log('Starting aggressive duplicate removal from cards.ts');
  const cardsToKeep = findCardsInOtherFiles();
  fixCardsFile(cardsToKeep);
  console.log('Done!');
}

// Run the script
main();