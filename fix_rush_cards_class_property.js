/**
 * Script to fix missing class property in Rush mechanic cards
 * This script targets the remaining 6 cards that are missing the class property:
 * - Militia Commander (ID: 17001)
 * - Swift Messenger (ID: 17002)
 * - Rabid Worgen (ID: 17003)
 * - Vicious Scalehide (ID: 17103)
 * - Bloodworm (ID: 17104)
 * And one undefined placeholder card
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

// Try to find all possible files where these cards might be defined
async function findCardFiles() {
  const clientDir = path.join('.', 'client', 'src', 'game', 'data');
  
  log(`Looking for card data files in ${clientDir}...`);
  
  const files = fs.readdirSync(clientDir);
  
  // Focus on files most likely to contain Rush mechanic cards
  const rushKeywordFiles = files.filter(file => 
    file.includes('rush') || 
    file.includes('worgen') || 
    file.includes('mechanic') || 
    file.includes('witchwood')
  );
  
  // Also look at standard card files
  const standardCardFiles = files.filter(file => 
    (file.includes('card') || file.includes('Cards') || file.includes('minion')) && 
    file.endsWith('.ts')
  );
  
  // Combine all relevant files
  const potentialFiles = [...rushKeywordFiles, ...standardCardFiles]
    .map(file => path.join(clientDir, file));
  
  return potentialFiles;
}

function processFile(filePath) {
  log(`Processing ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    log(`File does not exist: ${filePath}`, 'error');
    return false;
  }
  
  // Read the file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for the specific card IDs
  const cardIdsToFix = [17001, 17002, 17003, 17103, 17104];
  
  let updatedContent = content;
  let modified = false;
  
  // Check each card ID
  for (const cardId of cardIdsToFix) {
    // Look for the card definition
    const regex = new RegExp(`id: ${cardId}[^}]*?(,\\s*heroClass: "[^"]+")`, 'g');
    const matches = [...content.matchAll(regex)];
    
    if (matches.length > 0) {
      for (const match of matches) {
        // Extract the heroClass value
        const heroClassMatch = match[1].match(/heroClass: "([^"]+)"/);
        if (heroClassMatch) {
          const heroClass = heroClassMatch[1];
          
          // Determine the class value (capitalized)
          const classValue = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
          
          // Check if the class property already exists
          const hasClass = content.includes(`id: ${cardId}`) && content.includes(`class: "${classValue}"`);
          
          if (!hasClass) {
            // Replace the heroClass line with heroClass and class
            const replacementText = `${match[1]}, class: "${classValue}"`;
            updatedContent = updatedContent.replace(match[1], replacementText);
            modified = true;
            
            log(`Added class: "${classValue}" to card ${cardId}`, 'info');
          }
        }
      }
    }
  }
  
  // Special handling for cards with undefined name/ID
  // These are typically missing both heroClass and class
  // We'll add class: "Neutral" to any card that has collectible: true but no class
  const collectibleRegex = /collectible: true(?![^{]*class:)/g;
  const collectibleMatches = [...content.matchAll(collectibleRegex)];
  
  if (collectibleMatches.length > 0) {
    for (const match of collectibleMatches) {
      const replacementText = `collectible: true, class: "Neutral"`;
      updatedContent = updatedContent.replace(match[0], replacementText);
      modified = true;
      
      log(`Added class: "Neutral" to a card missing class property`, 'info');
    }
  }
  
  // Only write if changes were made
  if (modified) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    log(`Updated file: ${filePath}`, 'info');
    return true;
  }
  
  log(`No cards to fix in ${filePath}`, 'warn');
  return false;
}

async function main() {
  const filesToProcess = await findCardFiles();
  
  log(`Found ${filesToProcess.length} potential card data files.`);
  
  let successCount = 0;
  for (const file of filesToProcess) {
    const success = processFile(file);
    if (success) {
      successCount++;
    }
  }
  
  log(`Fix completed. Updated ${successCount} files.`, 'info');
}

main();