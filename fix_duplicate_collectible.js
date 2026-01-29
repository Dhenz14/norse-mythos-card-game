/**
 * A specialized script to fix duplicate collectible properties in card definitions.
 * This script removes collectible properties from battlecry and deathrattle objects
 * while ensuring the property exists at the root level of each card.
 */
import fs from 'fs';

// File to process
const filePath = './client/src/game/data/neutralMinions.ts';

// Back up the original file
fs.copyFileSync(filePath, `${filePath}.bak.${Date.now()}`);

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix collectible property inside battlecry and deathrattle
content = content.replace(/(\s+requiresTarget:\s*(?:true|false))(?:\s*collectible:\s*(?:true|false))/g, '$1');
content = content.replace(/(\s+targetType:\s*"[^"]+")(?:\s*collectible:\s*(?:true|false))/g, '$1');
content = content.replace(/(\s+value:\s*\d+)(?:\s*collectible:\s*(?:true|false))/g, '$1');
content = content.replace(/(\s+summonCardId:\s*\d+)(?:\s*collectible:\s*(?:true|false))/g, '$1');
content = content.replace(/(\s+specificManaCost:\s*\d+)(?:\s*collectible:\s*(?:true|false))/g, '$1');
content = content.replace(/(\s+specificRace:\s*"[^"]+")(?:\s*collectible:\s*(?:true|false))/g, '$1');
content = content.replace(/(\s+condition:\s*"[^"]+")(?:\s*collectible:\s*(?:true|false))/g, '$1');
content = content.replace(/(\s+discoveryType:\s*"[^"]+")(?:\s*collectible:\s*(?:true|false))/g, '$1');
content = content.replace(/(\s+cardType:\s*"[^"]+")(?:\s*collectible:\s*(?:true|false))/g, '$1');

// Write the fixed content back to the file
fs.writeFileSync(filePath, content);

console.log(`Fixed duplicate collectible properties in ${filePath}`);