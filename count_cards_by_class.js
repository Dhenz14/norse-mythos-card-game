/**
 * Count Cards by Class
 * 
 * This script analyzes all card files and counts how many cards exist for each class.
 * It also breaks down counts by rarity and card type.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as glob from 'glob';

// Helper function to extract cards from a file's content
function extractCardsFromContent(content) {
  const cards = [];
  let inCardDefinition = false;
  let bracketCount = 0;
  let currentCard = '';

  // Split content by lines and process
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for the start of a card array
    if (line.includes('CardData[]') && line.includes('[')) {
      inCardDefinition = true;
    }
    
    if (inCardDefinition) {
      currentCard += line + '\n';
      
      // Count opening brackets
      const openBrackets = (line.match(/\{/g) || []).length;
      const closeBrackets = (line.match(/\}/g) || []).length;
      bracketCount += openBrackets - closeBrackets;
      
      // If we've closed all brackets for a card, add it to the array
      if (bracketCount === 0 && line.trim() === '},') {
        cards.push(currentCard);
        currentCard = '';
      }
      
      // End of the array
      if (bracketCount === 0 && line.includes('];')) {
        inCardDefinition = false;
      }
    }
  }
  
  return cards;
}

// Find all card files in the project
function findCardFiles() {
  return new Promise((resolve, reject) => {
    glob.glob('client/src/game/data/**/*.ts', (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

// Function to extract class, rarity, and type from a card string
function extractCardProperties(cardString) {
  const properties = {
    id: null,
    name: null,
    class: null,
    heroClass: null,
    rarity: null,
    type: null,
    collectible: null
  };
  
  // Extract ID
  const idMatch = cardString.match(/id:\s*(\d+)/);
  if (idMatch) {
    properties.id = parseInt(idMatch[1], 10);
  }
  
  // Extract name
  const nameMatch = cardString.match(/name:\s*["']([^"']+)["']/);
  if (nameMatch) {
    properties.name = nameMatch[1];
  }
  
  // Extract class (case-sensitive, exact match)
  const classMatch = cardString.match(/class:\s*['"]([^'"]+)['"]/);
  if (classMatch) {
    properties.class = classMatch[1];
  }
  
  // Extract heroClass as a fallback if class is not present
  const heroClassMatch = cardString.match(/heroClass:\s*["']([^"']+)["']/);
  if (heroClassMatch) {
    properties.heroClass = heroClassMatch[1];
    
    // If class wasn't found, derive it from heroClass with proper capitalization
    if (!properties.class) {
      properties.class = properties.heroClass.charAt(0).toUpperCase() + properties.heroClass.slice(1);
    }
  }
  
  // Extract rarity
  const rarityMatch = cardString.match(/rarity:\s*["']([^"']+)["']/);
  if (rarityMatch) {
    properties.rarity = rarityMatch[1];
  }
  
  // Extract type
  const typeMatch = cardString.match(/type:\s*["']([^"']+)["']/);
  if (typeMatch) {
    properties.type = typeMatch[1];
  }
  
  // Extract collectible status
  const collectibleMatch = cardString.match(/collectible:\s*(true|false)/);
  if (collectibleMatch) {
    properties.collectible = collectibleMatch[1] === 'true';
  }
  
  return properties;
}

// Main function
async function main() {
  console.log('=== Counting Cards by Class ===');
  
  try {
    // Find all card files
    const cardFiles = await findCardFiles();
    console.log(`Found ${cardFiles.length} card files`);
    
    // Initialize counters
    const classCounts = {};
    const classRarityCounts = {};
    const classTypeCounts = {};
    let totalCards = 0;
    let collectibleCards = 0;
    
    // Process each file
    for (const file of cardFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const cardStrings = extractCardsFromContent(content);
        
        for (const cardString of cardStrings) {
          const props = extractCardProperties(cardString);
          
          if (props.class) {
            // Initialize counters if needed
            if (!classCounts[props.class]) {
              classCounts[props.class] = 0;
              classRarityCounts[props.class] = {
                common: 0,
                rare: 0,
                epic: 0,
                legendary: 0
              };
              classTypeCounts[props.class] = {
                minion: 0,
                spell: 0,
                weapon: 0,
                hero: 0
              };
            }
            
            // Only count collectible cards
            if (props.collectible === true) {
              classCounts[props.class]++;
              collectibleCards++;
              
              // Count by rarity
              if (props.rarity && classRarityCounts[props.class][props.rarity]) {
                classRarityCounts[props.class][props.rarity]++;
              }
              
              // Count by type
              if (props.type && classTypeCounts[props.class][props.type]) {
                classTypeCounts[props.class][props.type]++;
              }
            }
            
            totalCards++;
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    // Print results
    console.log('\n=== Card Counts by Class ===');
    console.log(`Total cards: ${totalCards}`);
    console.log(`Collectible cards: ${collectibleCards}\n`);
    
    // Sort classes by count
    const sortedClasses = Object.keys(classCounts).sort(
      (a, b) => classCounts[b] - classCounts[a]
    );
    
    // Print detailed breakdown
    for (const className of sortedClasses) {
      console.log(`${className}: ${classCounts[className]} cards`);
      
      // Rarity breakdown
      const rarities = classRarityCounts[className];
      console.log(`  - Common: ${rarities.common}`);
      console.log(`  - Rare: ${rarities.rare}`);
      console.log(`  - Epic: ${rarities.epic}`);
      console.log(`  - Legendary: ${rarities.legendary}`);
      
      // Type breakdown
      const types = classTypeCounts[className];
      console.log(`  - Minions: ${types.minion}`);
      console.log(`  - Spells: ${types.spell}`);
      console.log(`  - Weapons: ${types.weapon}`);
      console.log(`  - Heroes: ${types.hero}`);
      console.log();
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main();