/**
 * Script to fix remaining specific issues in classMinions.ts
 */
const fs = require('fs');

const filePath = './client/src/game/data/classMinions.ts';

// Create a backup
const content = fs.readFileSync(filePath, 'utf8');
const backupPath = `${filePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);

// Manually fix the specific issues by line number
// Line 169 (race: "beast" -> race: "beast",)
// Line 182 (race: "beast" -> race: "beast",)
// Line 208 (keywords: ["choose_one"] -> keywords: ["choose_one"],)
// Line 220 (keywords: ["taunt"] -> keywords: ["taunt"],)
// Line 252 (keywords: [] -> keywords: [],)
// Line 304 (race: "demon" -> race: "demon",)
// Line 424 (keywords: ["stealth"] -> keywords: ["stealth"],)
// Line 438 (keywords: [] -> keywords: [],)

let fixedContent = content.replace(/race: "beast"\s*collectible:/g, 'race: "beast",\n    collectible:');
fixedContent = fixedContent.replace(/race: "demon"\s*collectible:/g, 'race: "demon",\n    collectible:');
fixedContent = fixedContent.replace(/keywords: \[\]\s*collectible:/g, 'keywords: [],\n    collectible:');
fixedContent = fixedContent.replace(/keywords: \["choose_one"\]\s*collectible:/g, 'keywords: ["choose_one"],\n    collectible:');
fixedContent = fixedContent.replace(/keywords: \["taunt"\]\s*collectible:/g, 'keywords: ["taunt"],\n    collectible:');
fixedContent = fixedContent.replace(/keywords: \["stealth"\]\s*collectible:/g, 'keywords: ["stealth"],\n    collectible:');

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent);

console.log(`Successfully fixed remaining issues in ${filePath}`);