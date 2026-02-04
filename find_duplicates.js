import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all .ts files in the data directory
const dataDir = path.join(__dirname, 'client', 'src', 'game', 'data');
const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.ts'));

// Store card names and their locations
const cardNames = {};
const duplicates = [];

// Process each file
files.forEach(file => {
  const filePath = path.join(dataDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract card names and additional details using regex
  const nameRegex = /id:\s*(\d+)[\s\S]*?name:\s*["']([^"']+)["'][\s\S]*?type:\s*["']([^"']+)["'][\s\S]*?rarity:\s*["']([^"']+)["']/g;
  let match;
  
  while ((match = nameRegex.exec(content)) !== null) {
    const cardId = match[1];
    const cardName = match[2];
    const cardType = match[3];
    const cardRarity = match[4];
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    if (!cardNames[cardName]) {
      cardNames[cardName] = [];
    }
    
    cardNames[cardName].push({
      file,
      line: lineNumber,
      id: cardId,
      type: cardType,
      rarity: cardRarity
    });
    
    // If this is a duplicate, add to duplicates array
    if (cardNames[cardName].length > 1) {
      // Only add if this exact duplicate hasn't been added yet
      const alreadyAdded = duplicates.some(dup => 
        dup.name === cardName && 
        dup.locations.some(loc => 
          loc.file === file && loc.line === lineNumber
        )
      );
      
      if (!alreadyAdded) {
        // Check if we already have this card name in our duplicates
        const existingDup = duplicates.find(dup => dup.name === cardName);
        
        if (existingDup) {
          existingDup.locations.push({ 
            file, 
            line: lineNumber,
            id: cardId,
            type: cardType,
            rarity: cardRarity
          });
        } else {
          duplicates.push({
            name: cardName,
            locations: cardNames[cardName]
          });
        }
      }
    }
  }
});

// Group duplicates by file to make it easier to fix them
const duplicatesByFile = {};

duplicates.forEach(dup => {
  dup.locations.forEach(loc => {
    if (!duplicatesByFile[loc.file]) {
      duplicatesByFile[loc.file] = [];
    }
    
    // Check if this card is already in the array for this file
    const existingCardIndex = duplicatesByFile[loc.file].findIndex(entry => entry.name === dup.name);
    
    if (existingCardIndex === -1) {
      // Add a new entry for this card
      duplicatesByFile[loc.file].push({
        name: dup.name,
        line: loc.line,
        id: loc.id,
        type: loc.type,
        rarity: loc.rarity,
        otherLocations: dup.locations
          .filter(otherLoc => otherLoc.file !== loc.file)
          .map(otherLoc => ({
            file: otherLoc.file,
            line: otherLoc.line,
            id: otherLoc.id
          }))
      });
    }
  });
});

// Print general results
console.log(`Found ${duplicates.length} cards with duplicates across ${Object.keys(duplicatesByFile).length} files.\n`);

// Print detailed results grouped by file
console.log('=== DUPLICATE CARDS BY FILE ===\n');

Object.keys(duplicatesByFile).sort().forEach(file => {
  const duplicatesInFile = duplicatesByFile[file];
  console.log(`\n=== ${file} (${duplicatesInFile.length} duplicates) ===`);
  
  duplicatesInFile.sort((a, b) => a.line - b.line).forEach(card => {
    console.log(`\n  Line ${card.line}: "${card.name}" (ID: ${card.id}, Type: ${card.type}, Rarity: ${card.rarity})`);
    console.log('  Also appears in:');
    card.otherLocations.forEach(loc => {
      console.log(`    ${loc.file}:${loc.line} (ID: ${loc.id})`);
    });
  });
});