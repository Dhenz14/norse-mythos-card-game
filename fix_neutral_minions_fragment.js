/**
 * Fix a card fragment issue in neutralMinions.ts
 * 
 * This script removes an invalid card fragment at the beginning of the file
 * that is marked as collectible but is not a complete card.
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
    
    // Find and remove the fragment at the beginning of the array
    const updatedContent = content.replace(
      /export const\s+neutralMinions:\s+CardData\[\]\s+=\s+\[\{[\s\n]*type:\s+"destroy_weapon",[\s\n]*[\s\n]*requiresTarget:\s+false,[\s\n]*[\s\n]*targetType:\s+"enemy_weapon",[\s\n]*collectible:\s+true[\s\n]*\},/,
      'export const   neutralMinions: CardData[] = [{'
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
  const filePath = path.resolve('client/src/game/data/neutralMinions.ts');
  
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'error');
    return;
  }
  
  processFile(filePath);
}

main();