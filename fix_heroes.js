import fs from 'fs';

const filePath = 'client/src/game/data/heroes.ts';
const content = fs.readFileSync(filePath, 'utf8');

// Fix the collectible property in the interfaces
let updatedContent = content
  .replace(/,\s*collectible: true}/, '}')  // Remove collectible from the interface
  .replace(/,\s*collectible: true\s*}(\s*\n|\s*\r\n)/g, '\n  collectible: true\n}$1');  // Fix the format of collectible

// Fix the format of each hero object
const heroPattern = /](\s*),\s*collectible: true}/g;
updatedContent = updatedContent.replace(heroPattern, '],\n    collectible: true\n  }');

fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Fixed heroes.ts file');
