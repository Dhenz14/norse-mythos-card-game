/**
 * Fix Specific Missing Class Cards
 * 
 * This script targets the specific cards we've identified as missing class properties.
 */

const fs = require('fs');
const path = require('path');

// The list of card IDs we need to fix
const cardsToFix = [
  { id: '70101', name: 'Kazakus Potion (1-Cost)', file: 'highlanderCards.ts' },
  { id: '70105', name: 'Kazakus Potion (5-Cost)', file: 'highlanderCards.ts' },
  { id: '70110', name: 'Kazakus Potion (10-Cost)', file: 'highlanderCards.ts' },
  { id: '85101', name: 'Jade Golem', file: 'jadeGolemCards.ts' },
  { id: '60101', name: 'N', file: 'oldGodsCards.ts' },
  { id: '60102', name: 'Yogg-Saron, Hope', file: 'oldGodsCards.ts' },
  { id: '60103', name: 'Y', file: 'oldGodsCards.ts' }
];

// Fix cards in a file
function fixFile(filePath, cardIds) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Process each card ID
  for (const cardId of cardIds) {
    console.log(`  Looking for card with ID: ${cardId}`);
    
    // Find the card by ID
    const idPattern = new RegExp(`id\\s*:\\s*${cardId}[,\\s]`);
    const idMatch = content.match(idPattern);
    
    if (idMatch) {
      console.log(`  Found card with ID: ${cardId}`);
      
      // Find where heroClass is defined
      const startPos = content.lastIndexOf('{', idMatch.index);
      const endPos = content.indexOf('}', idMatch.index);
      const cardSection = content.substring(startPos, endPos);
      
      // Check if it has heroClass but not class
      if (cardSection.includes('heroClass') && !cardSection.includes('class:')) {
        // Find the heroClass line
        const heroClassMatch = cardSection.match(/heroClass\s*:\s*["']([^"']+)["']/);
        
        if (heroClassMatch) {
          const heroClass = heroClassMatch[1];
          const className = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
          
          // Find the end of the heroClass line to insert the class property
          const heroClassPos = content.indexOf(heroClassMatch[0], startPos);
          const lineEndPos = content.indexOf('\n', heroClassPos);
          
          // Insert the class property
          const beforeInsert = content.substring(0, lineEndPos);
          const afterInsert = content.substring(lineEndPos);
          content = beforeInsert + `,\n      class: "${className}"` + afterInsert;
          
          console.log(`  Added class: "${className}" to card with ID: ${cardId}`);
          updated = true;
        }
      }
    }
  }
  
  // Save the updated content
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated file: ${filePath}`);
  } else {
    console.log(`No updates made to ${filePath}`);
  }
}

// Main function
function main() {
  // Group cards by file
  const fileGroups = {};
  for (const card of cardsToFix) {
    if (!fileGroups[card.file]) {
      fileGroups[card.file] = [];
    }
    fileGroups[card.file].push(card.id);
  }
  
  // Process each file
  for (const fileName in fileGroups) {
    const filePath = path.join('client', 'src', 'game', 'data', fileName);
    fixFile(filePath, fileGroups[fileName]);
  }
  
  console.log('Done!');
}

main();