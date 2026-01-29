/**
 * Script to fix coldlightTestData.ts file
 */

const fs = require('fs');

const filePath = 'client/src/game/data/coldlightTestData.ts';

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix excess commas
content = content.replace(/export const\s+(\w+):\s*CardData\s*=\s*\{,/g, 'export const $1: CardData = {');
content = content.replace(/battlecry: \{,/g, 'battlecry: {');
content = content.replace(/buffs: \{,/g, 'buffs: {');

// Write back
fs.writeFileSync(filePath, content);
console.log(`Fixed ${filePath}`);