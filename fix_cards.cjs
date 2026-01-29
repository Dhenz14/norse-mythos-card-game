/**
 * Script to fix cards.ts file
 */
const fs = require('fs');

const FILEPATH = './client/src/game/data/cards.ts';

// Make a backup
fs.copyFileSync(FILEPATH, `${FILEPATH}.bak`);

// Get the content
let content = fs.readFileSync(FILEPATH, 'utf8');

// Fix comma errors
content = content.replace(/class: ['"]Neutral['"],,/g, 'class: "Neutral",');

// Write the fixed content back
fs.writeFileSync(FILEPATH, content);

console.log('Fixed cards.ts');
