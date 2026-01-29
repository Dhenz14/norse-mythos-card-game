/**
 * Script to fix the duplicate class properties that were added by the previous script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message, level = 'info') {
  const levels = {
    info: '\x1b[32m%s\x1b[0m', // green
    warn: '\x1b[33m%s\x1b[0m', // yellow
    error: '\x1b[31m%s\x1b[0m', // red
  };
  console.log(levels[level] || levels.info, message);
}

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'error');
    return false;
  }
  
  log(`Processing ${filePath}...`);
  
  // Read the file
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Fix pattern: collectible: true, class: "Neutral", class: "Neutral", ...
  const multipleClassPattern = /(collectible: true), (class: "Neutral",)+ /g;
  let updatedContent = content.replace(multipleClassPattern, '$1, class: "Neutral", ');
  
  // Fix other duplicate class patterns
  const duplicateClassPattern = /class: "([^"]+)", class: "([^"]+)"/g;
  updatedContent = updatedContent.replace(duplicateClassPattern, 'class: "$1"');
  
  // Write back if changes were made
  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    log(`Fixed duplicate class properties in ${filePath}`, 'info');
    return true;
  }
  
  log(`No duplicate class properties found in ${filePath}`, 'warn');
  return false;
}

async function main() {
  // Process specific files that we know have issues
  const filesToProcess = [
    path.join('.', 'client', 'src', 'game', 'data', 'mechanicCards.ts'),
    path.join('.', 'client', 'src', 'game', 'data', 'dormantCards.ts'),
    path.join('.', 'client', 'src', 'game', 'data', 'spellCards.ts')
  ];
  
  let fixedCount = 0;
  for (const file of filesToProcess) {
    const fixed = fixFile(file);
    if (fixed) fixedCount++;
  }
  
  log(`Fixed duplicate class properties in ${fixedCount} files.`, 'info');
}

main();