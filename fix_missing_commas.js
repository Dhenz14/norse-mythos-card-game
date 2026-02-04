/**
 * A specialized script to fix missing commas between card definitions.
 * This script ensures that each card's closing brace is followed by a comma
 * if it's not the last card in the array.
 */
import fs from 'fs';

// File to process
const filePath = './client/src/game/data/neutralMinions.ts';

// Back up the original file
fs.copyFileSync(filePath, `${filePath}.bak.comma.${Date.now()}`);

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix indentation in battlecry/deathrattle objects
content = content.replace(/(\s+battlecry: {[^}]+)\n\s{2}\},/g, '$1\n    },');
content = content.replace(/(\s+deathrattle: {[^}]+)\n\s{2}\},/g, '$1\n    },');

// Fix comma after property
content = content.replace(/(\s+requiresTarget: (?:true|false))\n/g, '$1,\n');
content = content.replace(/(\s+targetType: "[^"]+")\n/g, '$1,\n');
content = content.replace(/(\s+value: \d+)\n/g, '$1,\n');
content = content.replace(/(\s+summonCardId: \d+)\n/g, '$1,\n');
content = content.replace(/(\s+specificManaCost: \d+)\n/g, '$1,\n');
content = content.replace(/(\s+specificRace: "[^"]+")\n/g, '$1,\n');
content = content.replace(/(\s+condition: "[^"]+")\n/g, '$1,\n');
content = content.replace(/(\s+discoveryType: "[^"]+")\n/g, '$1,\n');
content = content.replace(/(\s+cardType: "[^"]+")\n/g, '$1,\n');

// Write the fixed content back to the file
fs.writeFileSync(filePath, content);

console.log(`Fixed missing commas and indentation in ${filePath}`);