/**
 * Script to fix specialEffectNeutrals.ts
 * This script adds proper collectible properties to all cards and fixes indentation
 */
const fs = require('fs');

const filePath = './client/src/game/data/specialEffectNeutrals.ts';

// Create a backup
const content = fs.readFileSync(filePath, 'utf8');
const backupPath = `${filePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);

// Fix indentation and collectible properties for all cards
let fixedContent = content;

// First, fix all nested closing brackets with missing collectible property
fixedContent = fixedContent.replace(/(\s+)}\s*(\s+)}/g, '$1},\n$2collectible: true\n$2}');

// Fix indentation in all effect blocks
fixedContent = fixedContent.replace(/(\s{4})(\w+): {(\s+)(\w+)/g, '$1$2: {\n      $4');

// Fix all lines with incorrect indentation
fixedContent = fixedContent.replace(/^(\s{4})(\w+)/gm, '$1  $2');

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent);

console.log(`Successfully fixed ${filePath}`);