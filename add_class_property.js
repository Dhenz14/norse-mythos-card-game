/**
 * Script to add class property to cards that have heroClass
 * 
 * This script uses a more robust parsing approach to prevent issues with string replacement
 * It properly handles the conversion without breaking the file structure
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');
const specificFileArg = args.find(arg => arg.startsWith('--file='));
const specificFile = specificFileArg ? specificFileArg.split('=')[1] : null;

// Logging utility
function log(message, level = 'info') {
  if (level === 'debug' && !isVerbose) return;
  console.log(message);
}

// Function to read a file and extract card objects
function extractCardsFromContent(content) {
  // Extract all objects within the array by finding matching braces
  const cards = [];
  let bracketCount = 0;
  let currentCard = '';
  let inArray = false;
  let inCardObject = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    // Track array brackets
    if (char === '[' && !inCardObject) {
      inArray = true;
      continue;
    }
    
    if (!inArray) continue;
    
    // Track object brackets
    if (char === '{' && !inCardObject && bracketCount === 0) {
      inCardObject = true;
      bracketCount = 1;
      currentCard = '{';
      continue;
    }
    
    if (inCardObject) {
      currentCard += char;
      
      if (char === '{') bracketCount++;
      if (char === '}') bracketCount--;
      
      // Complete card object
      if (bracketCount === 0) {
        cards.push(currentCard);
        currentCard = '';
        inCardObject = false;
      }
    }
  }
  
  return cards;
}

// Function to safely add class property to a card string
function addClassPropertyToCard(cardString) {
  // Check if the card already has a class property
  if (cardString.includes('class:')) {
    return { card: cardString, modified: false };
  }
  
  // Check if the card has a heroClass property
  const heroClassMatch = cardString.match(/heroClass:\s*"([^"]+)"/);
  if (!heroClassMatch) {
    return { card: cardString, modified: false };
  }
  
  // Get the heroClass value and capitalize for class
  const heroClassValue = heroClassMatch[1];
  const classValue = heroClassValue === 'neutral' 
    ? 'Neutral' 
    : heroClassValue.charAt(0).toUpperCase() + heroClassValue.slice(1);
  
  // Find the heroClass property and add class after it
  const modifiedCard = cardString.replace(
    /heroClass:\s*"([^"]+)"/,
    `heroClass: "${heroClassValue}", class: "${classValue}"`
  );
  
  return { 
    card: modifiedCard, 
    modified: true,
    heroClass: heroClassValue,
    class: classValue
  };
}

// Process a single file
function processFile(filePath) {
  try {
    log(`Processing file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the array declaration
    const arrayMatch = content.match(/export const\s+([a-zA-Z0-9_]+)\s*:\s*CardData\[\]\s*=\s*\[/);
    if (!arrayMatch) {
      log(`No card array found in ${filePath}`, 'debug');
      return 0;
    }
    
    const arrayName = arrayMatch[1];
    const arrayStart = content.indexOf(arrayMatch[0]);
    const beforeArray = content.substring(0, arrayStart + arrayMatch[0].length);
    
    // Find the array closing bracket
    let bracketCount = 1;
    let arrayEnd = arrayStart + arrayMatch[0].length;
    
    for (let i = arrayEnd; i < content.length; i++) {
      if (content[i] === '[') bracketCount++;
      if (content[i] === ']') bracketCount--;
      
      if (bracketCount === 0) {
        arrayEnd = i;
        break;
      }
    }
    
    const afterArray = content.substring(arrayEnd);
    const arrayContent = content.substring(arrayStart + arrayMatch[0].length, arrayEnd);
    
    // Extract card objects from the array content
    const cardStrings = extractCardsFromContent(arrayContent);
    log(`Found ${cardStrings.length} cards in ${filePath}`, 'debug');
    
    // Process each card
    let modifiedCount = 0;
    const processedCards = [];
    
    for (const cardString of cardStrings) {
      const { card, modified, heroClass, class: className } = addClassPropertyToCard(cardString);
      processedCards.push(card);
      
      if (modified) {
        modifiedCount++;
        log(`  Added class="${className}" based on heroClass="${heroClass}"`, 'info');
      }
    }
    
    // Only write changes if at least one card was modified
    if (modifiedCount > 0) {
      const newArrayContent = processedCards.join(',\n');
      const newContent = beforeArray + newArrayContent + afterArray;
      
      if (!isDryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        log(`Updated ${modifiedCount} cards in ${filePath}`);
      } else {
        log(`Would update ${modifiedCount} cards in ${filePath} (dry run)`);
      }
    } else {
      log(`No cards needed updating in ${filePath}`, 'debug');
    }
    
    return modifiedCount;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return 0;
  }
}

// Main execution function
async function main() {
  console.log('=== Class Property Adder ===');
  
  if (isDryRun) {
    console.log('Running in dry-run mode (no changes will be made)');
  }
  
  let files;
  
  if (specificFile) {
    files = [specificFile];
    console.log(`Processing only ${specificFile}`);
  } else {
    files = await glob('client/src/game/data/**/*.ts');
    console.log(`Found ${files.length} card files to process`);
  }
  
  let totalUpdated = 0;
  
  for (const file of files) {
    try {
      const updates = processFile(file);
      totalUpdated += updates;
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }
  
  console.log('=== Summary ===');
  
  if (isDryRun) {
    console.log(`Would update ${totalUpdated} cards with class property (dry run)`);
  } else {
    console.log(`Updated ${totalUpdated} cards with class property`);
  }
}

// Run the main function
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});