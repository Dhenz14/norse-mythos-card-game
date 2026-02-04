/**
 * Script to fix missing class property in Rush and Lifesteal mechanic cards
 * This script specifically targets the rushLifestealCards.ts file to add
 * the missing class property to the following cards:
 * - Swift Messenger (ID: 17002)
 * - Rabid Worgen (ID: 17003) 
 * - Vicious Scalehide (ID: 17103)
 * - Bloodworm (ID: 17104)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message, level = 'info') {
  const prefix = level === 'info' ? '[INFO]' : level === 'warn' ? '[WARNING]' : '[ERROR]';
  console.log(`${prefix} ${message}`);
}

function processFile(filePath) {
  log(`Processing file: ${filePath}`);
  
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Fix missing class properties using specific patterns for each card
    let updatedContent = content;
    
    // Swift Messenger (ID: 17002)
    updatedContent = updatedContent.replace(
      /(\s*id:\s*17002,[\s\S]*?collectible:\s*true)(\s*)\n/,
      '$1, class: "Neutral"$2\n'
    );
    
    // Rabid Worgen (ID: 17003)
    updatedContent = updatedContent.replace(
      /(\s*id:\s*17003,[\s\S]*?collectible:\s*true)(\s*)\n/,
      '$1, class: "Neutral"$2\n'
    );
    
    // Vicious Scalehide (ID: 17103)
    updatedContent = updatedContent.replace(
      /(\s*id:\s*17103,[\s\S]*?collectible:\s*true)(\s*)\n/,
      '$1, class: "Neutral"$2\n'
    );
    
    // Bloodworm (ID: 17104)
    updatedContent = updatedContent.replace(
      /(\s*id:\s*17104,[\s\S]*?collectible:\s*true)(\s*)\n/,
      '$1, class: "Neutral"$2\n'
    );
    
    // Fix the duplicate class properties in Militia Commander (ID: 17001)
    updatedContent = updatedContent.replace(
      /collectible:\s*true,\s*class:\s*"Neutral"(,\s*class:\s*"Neutral")+/g,
      'collectible: true, class: "Neutral"'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    log(`Successfully updated: ${filePath}`);
    
    // Check if any changes were made
    if (content === updatedContent) {
      log('No changes were needed or made.', 'warn');
    }
    
    return true;
  } catch (error) {
    log(`Error processing file ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

function main() {
  const filePath = path.resolve('client/src/game/data/rushLifestealCards.ts');
  
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'error');
    return;
  }
  
  processFile(filePath);
}

main();