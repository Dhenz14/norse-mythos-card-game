/**
 * Direct approach to fix the remaining class:Neutral issues in discoverCards.ts
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '[ERROR]' : 
                level === 'warn' ? '[WARNING]' : 
                '[INFO]';
  console.log(`${prefix} ${message}`);
}

function fixFile() {
  const filePath = 'client/src/game/data/discoverCards.ts';
  log(`Processing ${filePath}...`);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern to find: collectible: true, class: "Neutral"
  const pattern = /collectible:\s*true,\s*class:\s*["']Neutral["']/g;
  const updatedContent = content.replace(pattern, 'collectible: true');
  
  // Write updated content back to file
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  
  // Count occurrences
  const originalMatches = content.match(pattern) || [];
  const remainingMatches = updatedContent.match(pattern) || [];
  
  log(`Fixed ${originalMatches.length - remainingMatches.length} occurrences of 'collectible: true, class: "Neutral"'`);
  
  // Now add class: "Neutral" where needed - only for cards without heroClass
  const cardsWithoutClass = /\{\s*id:\s*\d+[^}]*?collectible:\s*true\s*\}/g;
  let matches = [...updatedContent.matchAll(cardsWithoutClass)];
  
  if (matches.length > 0) {
    let finalContent = updatedContent;
    let addedCount = 0;
    
    matches.forEach(match => {
      const cardText = match[0];
      // Only add if it doesn't have heroClass
      if (!cardText.includes('heroClass:') && !cardText.includes('class:')) {
        const replacedCard = cardText.replace(
          /collectible:\s*true/,
          'collectible: true, class: "Neutral"'
        );
        finalContent = finalContent.replace(cardText, replacedCard);
        addedCount++;
      }
    });
    
    fs.writeFileSync(filePath, finalContent, 'utf8');
    log(`Added class: "Neutral" to ${addedCount} cards that were missing class property`);
  }
}

function main() {
  fixFile();
}

main();