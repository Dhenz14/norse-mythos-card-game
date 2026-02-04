import fs from 'fs';

const filePath = 'client/src/game/data/neutralMinions.ts';
const content = fs.readFileSync(filePath, 'utf8');

// Remove collectible property from inside interface objects
let updatedContent = content.replace(/(deathrattle|battlecry):\s*{[^}]*?collectible:\s*true[^}]*?}/gs, (match) => {
  return match.replace(/,\s*collectible:\s*true/g, '');
});

// Fix any missing commas in the file
updatedContent = updatedContent.replace(/}\s*{/g, '},\n  {');

fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Fixed neutralMinions.ts file interfaces');
