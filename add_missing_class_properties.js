/**
 * Script to add class property to cards that have heroClass but are missing class
 */

import fs from 'fs';
import { glob } from 'glob';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Function to extract hero class value
function extractHeroClass(cardString) {
  const match = cardString.match(/heroClass:\s*"([^"]+)"/);
  return match ? match[1] : null;
}

// Function to add class property to a card with heroClass
function addClassPropertyToCard(cardContent, file) {
  console.log(`  Processing array content in ${file}`);
  console.log(`  Array content length: ${cardContent.length} characters`);
  
  // Extract individual card objects
  const cardObjects = [];
  let bracketCount = 0;
  let currentObj = '';
  let inObject = false;
  let cardCount = 0;
  let propertiesAdded = 0;
  
  // Log the first 100 characters to see what we're dealing with
  console.log(`  Content preview: ${cardContent.substring(0, 100).replace(/\n/g, '\\n')}...`);
  
  // Check if the content starts with a comma and remove it
  if (cardContent.trim().startsWith(',')) {
    cardContent = cardContent.trim().substring(1);
    console.log(`  Removed leading comma from content`);
  }
  
  for (let i = 0; i < cardContent.length; i++) {
    const char = cardContent[i];
    
    // Start of a card object
    if (char === '{' && !inObject) {
      inObject = true;
      bracketCount = 1;
      currentObj = '{';
      cardCount++;
      continue;
    }
    
    if (inObject) {
      currentObj += char;
      
      if (char === '{') bracketCount++;
      if (char === '}') bracketCount--;
      
      // End of card object
      if (bracketCount === 0) {
        const obj = currentObj;
        
        // Extract card ID for debugging
        const debugIdMatch = obj.match(/id:\s*(\d+)/);
        const debugId = debugIdMatch ? debugIdMatch[1] : 'unknown';
        
        // Log conditions for each card
        const hasCollectible = obj.includes('collectible: true');
        const hasHeroClass = obj.includes('heroClass:');
        const hasClass = obj.includes('class:');
        
        console.log(`Card ${debugId}: collectible=${hasCollectible}, heroClass=${hasHeroClass}, hasClass=${hasClass}`);
        
        // Only process collectible cards with heroClass but no class
        if (hasCollectible && hasHeroClass && !hasClass) {
            
          const heroClass = extractHeroClass(obj);
          if (heroClass) {
            // Get card ID for logging
            const idMatch = obj.match(/id:\s*(\d+)/);
            const id = idMatch ? idMatch[1] : 'unknown';
            
            // Capitalize hero class for 'class' property
            const classValue = heroClass === 'neutral' 
              ? 'Neutral' 
              : heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
            
            // Create modified card with class property added
            // Log the original string for debugging
            console.log(`Original heroClass: "${heroClass}"`);
            console.log(`Capitalizing to: "${classValue}"`);
            
            // Find the position of heroClass and race for proper placement
            let modifiedCard = obj.replace(
              /(heroClass:\s*"[^"]+")(\s*,\s*race:\s*)/,
              `$1, class: "${classValue}"$2`
            );
            
            // Check if the first replacement worked
            if (modifiedCard === obj) {
              console.log(`First replacement failed, trying alternate...`);
              
              // Try a simpler regex
              modifiedCard = obj.replace(
                /(heroClass:\s*"[^"]+")/, 
                `$1, class: "${classValue}"`
              );
              
              // Check if the replacement worked
              if (modifiedCard === obj) {
                console.log(`Second replacement failed too! No changes made to card ${id}`);
              } else {
                console.log(`Second replacement succeeded for card ${id}`);
              }
            } else {
              console.log(`First replacement succeeded for card ${id}`);
            }
            
            console.log(`Added class="${classValue}" to card ID ${id} in ${file}`);
            propertiesAdded++;
            cardObjects.push(modifiedCard);
          } else {
            cardObjects.push(obj);
          }
        } else {
          cardObjects.push(obj);
        }
        
        inObject = false;
        currentObj = '';
      }
    }
  }
  
  // Log a summary of what we found
  console.log(`  Processed ${cardCount} card objects in ${file}, added ${propertiesAdded} class properties`);
  
  // Join all cards back together
  return {
    content: cardObjects.join(',\n'),
    propertiesAdded: propertiesAdded
  };
}

// Process a single file
function processFile(filePath) {
  try {
    console.log(`Processing file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find array declaration - try both 'export const' and just 'const'
    let arrayMatch = content.match(/export const\s+([^:]+)[\s\n]*:[\s\n]*CardData\[\][\s\n]*=[\s\n]*\[/);
    if (!arrayMatch) {
      // Try without the 'export' keyword
      arrayMatch = content.match(/const\s+([^:]+)[\s\n]*:[\s\n]*CardData\[\][\s\n]*=[\s\n]*\[/);
      if (!arrayMatch) {
        console.log(`  No array match in ${filePath}`);
        return 0;
      }
    }
    
    console.log(`  Found array: ${arrayMatch[1]}`);
    
    const arrayStart = content.indexOf(arrayMatch[0]);
    const beforeArray = content.substring(0, arrayStart + arrayMatch[0].length);
    
    // Find end of array
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
    
    // Process array content to add class properties
    const result = addClassPropertyToCard(arrayContent, filePath);
    
    // Check if any properties were added
    if (result.propertiesAdded > 0) {
      const newContent = beforeArray + result.content + afterArray;
      
      if (!isDryRun) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath} with ${result.propertiesAdded} new class properties`);
      } else {
        console.log(`Would update ${filePath} with ${result.propertiesAdded} new class properties (dry run)`);
      }
      
      return 1;
    } else {
      console.log(`No changes needed in ${filePath} (no class properties added)`);
    }
    
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return 0;
  }
}

// Main function
async function main() {
  console.log('=== Adding Missing Class Properties ===');
  if (isDryRun) console.log('Running in dry-run mode');
  
  // Focus only on files that were identified as having cards with missing class properties
  const targetFiles = [
    'client/src/game/data/frenzyCards.ts'
  ];
  
  let totalUpdated = 0;
  
  for (const file of targetFiles) {
    const updated = processFile(file);
    totalUpdated += updated;
  }
  
  console.log(`\n=== Summary ===`);
  if (isDryRun) {
    console.log(`Would update ${totalUpdated} files (dry run)`);
  } else {
    console.log(`Updated ${totalUpdated} files`);
  }
}

// Run the script
main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});