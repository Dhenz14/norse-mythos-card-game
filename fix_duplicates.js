import fs from 'fs';

const filePath = 'client/src/game/data/neutralMinions.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix $2 references - replace with appropriate values
content = content.replace(/targetType: \$2/g, 'targetType: "any"');
content = content.replace(/heroClass: \$2/g, 'heroClass: "neutral"');
content = content.replace(/race: \$2/g, 'race: "none"');
content = content.replace(/requiresTarget: \$2/g, 'requiresTarget: false');
content = content.replace(/value: \$2/g, 'value: 1');
content = content.replace(/summonCardId: \$2/g, 'summonCardId: 30044');

// Find all card objects in the file
const cardRegex = /{[^{}]*id:[^{}]*?(?:{[^{}]*})*?.*?}/gs;
const cards = content.match(cardRegex);

if (cards) {
  let newContent = content;
  
  for (const card of cards) {
    // Check if this card has duplicate collectible properties
    const collectibleCount = (card.match(/collectible:/g) || []).length;
    
    if (collectibleCount > 1) {
      // Create a fixed version without duplicate collectible properties
      let fixedCard = card;
      
      // Remove collectible from inside battlecry/deathrattle objects
      fixedCard = fixedCard.replace(/,\s*collectible: (true|false)\s*}(?=\s*},)/g, ' }');
      
      // Replace the original card with the fixed one
      newContent = newContent.replace(card, fixedCard);
    }
  }
  
  content = newContent;
}

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed duplicate collectible properties in neutralMinions.ts');
