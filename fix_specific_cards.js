/**
 * Fix Missing Class Properties
 * 
 * This script specifically fixes class properties for two files that were identified
 * as having cards with missing class properties. It uses a more direct approach.
 */

import fs from 'fs';

// Files to fix - expanded list based on missing cards
const filesToFix = [
  'client/src/game/data/frenzyCards.ts',
  'client/src/game/data/dormantCards.ts',
  'client/src/game/data/mechanicCards.ts'
];

// Function to fix the frenzyCards.ts file
function fixFrenzyCards() {
  try {
    const file = 'client/src/game/data/frenzyCards.ts';
    console.log(`Fixing ${file}...`);
    
    // Get the original file content
    let content = fs.readFileSync(file, 'utf8');
    
    // Manually fix the class properties
    content = content.replace(
      /heroClass: 'warlock',\n\s+race: '',/,
      "heroClass: 'warlock',\n      class: 'Warlock',\n      race: '',"
    );
    
    content = content.replace(
      /heroClass: 'druid',\n\s+race: '',/g,
      "heroClass: 'druid',\n      class: 'Druid',\n      race: '',"
    );
    
    content = content.replace(
      /heroClass: 'neutral',\n\s+race: ''/g,
      "heroClass: 'neutral',\n      class: 'Neutral',\n      race: ''"
    );
    
    content = content.replace(
      /heroClass: 'neutral',\n\s+race: 'quilboar'/,
      "heroClass: 'neutral',\n      class: 'Neutral',\n      race: 'quilboar'"
    );
    
    content = content.replace(
      /heroClass: 'hunter',\n\s+race: 'beast'/,
      "heroClass: 'hunter',\n      class: 'Hunter',\n      race: 'beast'"
    );
    
    content = content.replace(
      /heroClass: 'druid',\n\s+race: 'beast'/,
      "heroClass: 'druid',\n      class: 'Druid',\n      race: 'beast'"
    );
    
    // Write the modified content back to the file
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    
    return true;
  } catch (error) {
    console.error(`Error fixing frenzyCards:`, error);
    return false;
  }
}

// Function to fix mechanicCards.ts file
function fixMechanicCards() {
  try {
    const file = 'client/src/game/data/mechanicCards.ts';
    console.log(`Fixing ${file}...`);
    
    // Get the original file content
    let content = fs.readFileSync(file, 'utf8');
    
    // Add class properties for cards with specific IDs
    const cardIds = [30101, 40112, 40114, 40115, 40116, 40121];
    
    // For each card ID, find the heroClass and add appropriate class property
    for (const id of cardIds) {
      // Find the card section (starts with id and some whitespace)
      const cardRegex = new RegExp(`id:\\s*${id}[\\s\\S]*?heroClass:\\s*['"]([^'"]+)['"]`, 'g');
      const match = cardRegex.exec(content);
      
      if (match) {
        const heroClass = match[1];
        const classValue = heroClass === 'neutral'
          ? 'Neutral'
          : heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
        
        // Add class property after heroClass
        content = content.replace(
          new RegExp(`(id:\\s*${id}[\\s\\S]*?heroClass:\\s*['"][^'"]+['"])`, 'g'),
          `$1, class: '${classValue}'`
        );
        
        console.log(`Added class='${classValue}' to card ID ${id} in ${file}`);
      }
    }
    
    // Write the modified content back to the file
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    
    return true;
  } catch (error) {
    console.error(`Error fixing mechanicCards:`, error);
    return false;
  }
}

// Function to fix the dormantCards.ts file
function fixDormantCards() {
  try {
    const file = 'client/src/game/data/dormantCards.ts';
    console.log(`Fixing ${file}...`);
    
    // Get the original file content
    let content = fs.readFileSync(file, 'utf8');
    
    // Manually fix the class properties
    content = content.replace(
      /heroClass: 'mage',\n\s+race: ''/,
      "heroClass: 'mage',\n      class: 'Mage',\n      race: ''"
    );
    
    content = content.replace(
      /heroClass: 'druid',\n\s+race: ''/,
      "heroClass: 'druid',\n      class: 'Druid',\n      race: ''"
    );
    
    content = content.replace(
      /heroClass: 'neutral',\n\s+race: ''/g,
      "heroClass: 'neutral',\n      class: 'Neutral',\n      race: ''"
    );
    
    content = content.replace(
      /heroClass: 'hunter',\n\s+race: ''/,
      "heroClass: 'hunter',\n      class: 'Hunter',\n      race: ''"
    );
    
    content = content.replace(
      /heroClass: 'demonhunter',\n\s+race: ''/g,
      "heroClass: 'demonhunter',\n      class: 'Demonhunter',\n      race: ''"
    );
    
    content = content.replace(
      /heroClass: 'paladin',\n\s+race: ''/,
      "heroClass: 'paladin',\n      class: 'Paladin',\n      race: ''"
    );
    
    content = content.replace(
      /heroClass: 'warlock',\n\s+race: ''/,
      "heroClass: 'warlock',\n      class: 'Warlock',\n      race: ''"
    );
    
    content = content.replace(
      /heroClass: 'priest',\n\s+race: ''/,
      "heroClass: 'priest',\n      class: 'Priest',\n      race: ''"
    );
    
    // Write the modified content back to the file
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    
    return true;
  } catch (error) {
    console.error(`Error fixing dormantCards:`, error);
    return false;
  }
}

// Main function
function main() {
  console.log('=== Fixing Missing Class Properties ===');
  
  // Clean up potentially broken files before starting
  for (const filePath of ['client/src/game/data/frenzyCards.ts', 'client/src/game/data/dormantCards.ts']) {
    try {
      // Read the original version
      const brokenContent = fs.readFileSync(filePath, 'utf8');
      
      // Create a cleaned version by removing broken class properties
      // Look for both single and double quoted versions
      let cleanedContent = brokenContent.replace(/, class: ".*?"/g, '');
      cleanedContent = cleanedContent.replace(/, class: '.*?'/g, '');
      cleanedContent = cleanedContent.replace(/, class:".*?"/g, '');
      cleanedContent = cleanedContent.replace(/, class:'.*?'/g, '');
      
      // Fix any other known syntax issues
      cleanedContent = cleanedContent.replace(/,\s+,/g, ',');
      
      // Write back the cleaned content
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`Cleaned up ${filePath}`);
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
    }
  }
  
  let updated = 0;
  
  // Apply the fixes
  if (fixFrenzyCards()) updated++;
  if (fixDormantCards()) updated++;
  if (fixMechanicCards()) updated++;
  
  console.log(`\n=== Summary ===`);
  console.log(`Updated ${updated} files`);
}

// Run the script
main();