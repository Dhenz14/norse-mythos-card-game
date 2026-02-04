/**
 * Script to fix issues in additionalSpellCards.ts file
 * 
 * This script addresses several issues:
 * 1. Unbalanced braces
 * 2. Missing closing braces
 * 3. Misplaced commas
 * 4. Inconsistent quotes
 * 5. Misplaced collectible properties
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const emoji = level === 'error' ? '❌' : '✅';
  console.log(`${emoji} ${level.toUpperCase()}: ${message}`);
}

function fixAdditionalSpellCards() {
  const filePath = 'client/src/game/data/additionalSpellCards.ts';
  
  // Read the file
  log('Reading file...');
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log(`Failed to read file: ${error.message}`, 'error');
    return;
  }
  
  // Create backup
  const backupPath = `${filePath}.backup-${Date.now()}`;
  try {
    fs.writeFileSync(backupPath, content);
    log(`Created backup at ${backupPath}`);
  } catch (error) {
    log(`Failed to create backup: ${error.message}`, 'error');
    return;
  }
  
  // Fix the string quotes issues first (for Hunter's Mark, Warrior's Will, and Champion's Legacy)
  content = content.replace(/Hunter's Mark"/g, 'Hunter\'s Mark"');
  content = content.replace(/Warrior's Will"/g, 'Warrior\'s Will"');
  content = content.replace(/Champion's Legacy"/g, 'Champion\'s Legacy"');
  
  // Fix misplaced collectible properties and missing commas
  // Strategy: Break down the file into cards and fix each card individually
  
  // Split the content by card objects (starting with '{' and ending with '},')
  const cardStart = /\{\s*id: \d+/g;
  const cardMatches = [...content.matchAll(cardStart)];
  
  // Process each card
  let fixedContent = content.substring(0, cardMatches[0].index);
  
  for (let i = 0; i < cardMatches.length; i++) {
    const start = cardMatches[i].index;
    const end = i < cardMatches.length - 1 ? cardMatches[i + 1].index : content.length;
    let cardContent = content.substring(start, end);
    
    // Fix the structure of the card
    cardContent = fixCardContent(cardContent);
    
    fixedContent += cardContent;
  }
  
  // Ensure the array is properly closed
  if (!fixedContent.trim().endsWith('];')) {
    fixedContent = fixedContent.replace(/\};?\s*$/, '}\n];');
  }
  
  // Write the fixed content back to the file
  try {
    fs.writeFileSync(filePath, fixedContent);
    log('Successfully fixed additionalSpellCards.ts');
  } catch (error) {
    log(`Failed to write fixed content: ${error.message}`, 'error');
  }
}

function fixCardContent(cardContent) {
  // Fix missing closing braces and adjust the card structure
  
  // Replace misplaced collectible properties in spell effects
  cardContent = cardContent.replace(/,\s*collectible: true\s*\n\s*\}/g, '\n  }\n  collectible: true');
  
  // Fix the issue where collectible property is incorrectly positioned after commas
  cardContent = cardContent.replace(/,\s*collectible: true/g, '\n  }, \n  collectible: true');
  
  // Fix cards with misplaced commas
  cardContent = cardContent.replace(/\s*,\s*collectible: true\s*\n\}/g, '\n  },\n  collectible: true\n}');
  
  // Ensure each card ends properly
  if (!cardContent.trim().endsWith('},') && !cardContent.trim().endsWith('}')) {
    cardContent = cardContent.trim() + '\n},';
  }
  
  return cardContent;
}

// Run the function
fixAdditionalSpellCards();