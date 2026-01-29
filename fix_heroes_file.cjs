/**
 * Comprehensive script to fix all syntax issues in the heroes.ts file
 * This script will:
 * 1. Fix commas at the start of arrays
 * 2. Fix improper indentation
 * 3. Fix closing brackets
 * 4. Fix type issues with heroPowers and alternateHeroes arrays
 */

const fs = require('fs');
const path = require('path');

// Path to the heroes.ts file
const filePath = path.join(__dirname, 'client', 'src', 'game', 'data', 'heroes.ts');

// Function to fix all syntax issues in the heroes.ts file
function fixHeroesFile(content) {
  // 1. Fix arrays with leading commas: replace [, with [
  let fixedContent = content.replace(/\[\s*,\s*\n/g, '[\n');
  
  // 2. Fix inconsistent indentation in arrays
  const indentationPattern = /(\s+)(heroPowers|alternateHeroes):\s*\[\n\s+{/g;
  fixedContent = fixedContent.replace(indentationPattern, (match, indent, arrayName) => {
    return `${indent}${arrayName}: [{\n`;
  });
  
  // 3. Fix closing brackets
  const closingBracketPattern = /\s+}\n\s+\]/g;
  fixedContent = fixedContent.replace(closingBracketPattern, (match) => {
    return '\n      }]\n';
  });
  
  // 4. Add type annotations for arrays to fix type errors
  // Find the HeroPower interface
  const heroPowerInterfacePattern = /interface HeroPower {([^}]+)}/;
  const heroPowerMatch = content.match(heroPowerInterfacePattern);
  
  if (heroPowerMatch) {
    // Update all heroPowers type annotations
    const heroPowersPattern = /heroPowers:\s*\[/g;
    fixedContent = fixedContent.replace(heroPowersPattern, 'heroPowers: HeroPower[] = [');
  }
  
  // Find the AlternateHero interface
  const alternateHeroInterfacePattern = /interface AlternateHero {([^}]+)}/;
  const alternateHeroMatch = content.match(alternateHeroInterfacePattern);
  
  if (alternateHeroMatch) {
    // Update all alternateHeroes type annotations
    const alternateHeroesPattern = /alternateHeroes:\s*\[/g;
    fixedContent = fixedContent.replace(alternateHeroesPattern, 'alternateHeroes: AlternateHero[] = [');
  }
  
  return fixedContent;
}

// Main function to process the file
function main() {
  try {
    console.log(`Reading file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Fix the syntax issues
    const fixedContent = fixHeroesFile(fileContent);
    
    // Check if changes were made
    if (fixedContent === fileContent) {
      console.log('No changes needed in heroes.ts');
      return;
    }
    
    // Write back to the file
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log('Successfully fixed syntax issues in heroes.ts');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Execute the script
main();