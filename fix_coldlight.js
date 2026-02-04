/**
 * Script to fix coldlightTestData.ts file
 */
const fs = require('fs');

const FILEPATH = './client/src/game/data/coldlightTestData.ts';

// Make a backup
fs.copyFileSync(FILEPATH, `${FILEPATH}.bak`);

// Get the content
let content = fs.readFileSync(FILEPATH, 'utf8');

// Fix comma errors
content = content.replace(/battlecry: {,/g, 'battlecry: {');
content = content.replace(/class: "Neutral",,/g, 'class: "Neutral",');
content = content.replace(/export const murlocTidehunter: CardData = {,/g, 'export const murlocTidehunter: CardData = {');
content = content.replace(/export const murlocScout: CardData = {,/g, 'export const murlocScout: CardData = {');
content = content.replace(/export const bluegillWarrior: CardData = {,/g, 'export const bluegillWarrior: CardData = {');
content = content.replace(/export const riverCrocolisk: CardData = {,/g, 'export const riverCrocolisk: CardData = {');

// Write the fixed content back
fs.writeFileSync(FILEPATH, content);

console.log('Fixed coldlightTestData.ts');
