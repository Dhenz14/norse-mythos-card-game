/**
 * Fix legendaryCards.ts syntax errors
 * 
 * This script addresses formatting issues in the legendaryCards.ts file
 */

const fs = require('fs');

// The file to fix
const filePath = 'client/src/game/data/legendaryCards.ts';

// Read the file
try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Extract the import statements and array declaration
  const headerMatch = fileContent.match(/([\s\S]*?export const legendaryCards: CardData\[\] = \[)/);
  const header = headerMatch ? headerMatch[1] : '';
  
  // Extract the array closing
  const footerMatch = fileContent.match(/(\];[\s\S]*$)/);
  const footer = footerMatch ? footerMatch[1] : '];';
  
  // Extract all card objects with a regex
  const cardPattern = /{[\s\S]*?collectible: (true|false)[\s\S]*?}/g;
  const cards = [...fileContent.matchAll(cardPattern)].map(match => match[0]);
  
  if (cards.length === 0) {
    console.error('No card objects found in the file. The regex pattern may not be matching correctly.');
    process.exit(1);
  }
  
  // Function to properly format a card object
  function formatCard(cardString) {
    // Extract card properties
    const propMatches = [...cardString.matchAll(/(\w+):\s*(\{[\s\S]*?\}|"[^"]*"|'[^']*'|\[[^\]]*\]|[^,\n{}]+)(?:,|\n|$)/g)];
    
    let formattedProps = [];
    
    for (const [, propName, propValue] of propMatches) {
      // Special handling for nested objects like battlecry, deathrattle, etc.
      if (propValue.startsWith('{')) {
        // Format the nested object
        const nestedObject = formatNestedObject(propValue);
        formattedProps.push(`  ${propName}: ${nestedObject}`);
      } else if (propValue.startsWith('[')) {
        // Format arrays properly
        formattedProps.push(`  ${propName}: ${propValue}`);
      } else {
        formattedProps.push(`  ${propName}: ${propValue}`);
      }
    }
    
    // Assemble the formatted card
    return `{\n${formattedProps.join(',\n')}\n}`;
  }
  
  // Function to format nested objects
  function formatNestedObject(objString) {
    // Extract all properties from the nested object
    const propMatches = [...objString.matchAll(/(\w+):\s*(\{[\s\S]*?\}|"[^"]*"|'[^']*'|\[[^\]]*\]|[^,\n{}]+)(?:,|\n|$)/g)];
    
    // If it's an empty object or couldn't parse properties, return as is
    if (propMatches.length === 0) {
      return objString;
    }
    
    let formattedProps = [];
    
    for (const [, propName, propValue] of propMatches) {
      // Handle doubly-nested objects
      if (propValue.startsWith('{')) {
        const nestedNestedObject = formatNestedNestedObject(propValue);
        formattedProps.push(`    ${propName}: ${nestedNestedObject}`);
      } else if (propValue.startsWith('[')) {
        // Format arrays properly
        formattedProps.push(`    ${propName}: ${propValue}`);
      } else {
        formattedProps.push(`    ${propName}: ${propValue}`);
      }
    }
    
    // Assemble the formatted nested object
    return `{\n${formattedProps.join(',\n')}\n  }`;
  }
  
  // Function to format doubly-nested objects
  function formatNestedNestedObject(objString) {
    // Extract all properties from the doubly-nested object
    const propMatches = [...objString.matchAll(/(\w+):\s*(\{[\s\S]*?\}|"[^"]*"|'[^']*'|\[[^\]]*\]|[^,\n{}]+)(?:,|\n|$)/g)];
    
    // If it's an empty object or couldn't parse properties, return as is
    if (propMatches.length === 0) {
      return objString;
    }
    
    let formattedProps = [];
    
    for (const [, propName, propValue] of propMatches) {
      formattedProps.push(`      ${propName}: ${propValue}`);
    }
    
    // Assemble the formatted doubly-nested object
    return `{\n${formattedProps.join(',\n')}\n    }`;
  }
  
  // Format each card
  const formattedCards = cards.map(card => formatCard(card));
  
  // Join everything back together
  const fixedContent = `${header}\n${formattedCards.join(',\n')}\n${footer}`;
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, fixedContent);
  
  console.log('Successfully fixed legendaryCards.ts');
} catch (error) {
  console.error('Error processing file:', error);
}