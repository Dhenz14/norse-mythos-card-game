/**
 * Fix Missing Class Properties for dormantCards.ts
 * 
 * This script specifically fixes class properties for the dormantCards.ts file
 * that was identified as still having cards with missing class properties.
 */

import fs from 'fs';

function fixDormantCards() {
  const filePath = 'client/src/game/data/dormantCards.ts';
  console.log(`Fixing ${filePath}...`);
  
  try {
    // First read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Map of heroClass to class property
    const classMap = {
      'mage': 'Mage',
      'druid': 'Druid',
      'neutral': 'Neutral',
      'hunter': 'Hunter',
      'demonhunter': 'Demonhunter',
      'paladin': 'Paladin',
      'warlock': 'Warlock',
      'priest': 'Priest'
    };
    
    // For each card based on ID, find its heroClass and add the corresponding class property
    const cardIds = [10001, 10002, 10003, 10004, 10005, 10006, 10007, 10008, 10009, 10010, 10011];
    
    for (const id of cardIds) {
      // Find the card section in the file
      const regex = new RegExp(`id: ${id}[\\s\\S]*?heroClass: ['"]([^'"]+)['"]`, 'g');
      const match = regex.exec(content);
      
      if (match) {
        const heroClass = match[1];
        const classValue = classMap[heroClass] || heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
        
        // Add class property after heroClass
        content = content.replace(
          new RegExp(`(id: ${id}[\\s\\S]*?heroClass: ['"][^'"]+['"])`, 'g'),
          `$1,\n      class: '${classValue}'`
        );
        
        console.log(`Added class='${classValue}' to card ID ${id}`);
      } else {
        console.log(`Could not find card with ID ${id} or its heroClass`);
      }
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
    return false;
  }
}

// Run the function
fixDormantCards();