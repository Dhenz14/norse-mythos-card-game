/**
 * Script to fix the format of additionalSpellCards.ts
 * The main issue is that cards have an incorrect pattern: "},\n},{" instead of "},\n  {"
 */
import fs from 'fs';

// Path to the file to fix
const filePath = 'client/src/game/data/additionalSpellCards.ts';

// Function to fix the file
function fixFile() {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the card pattern
  content = content.replace(/},\s*},{/g, '},\n  {');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content);
  
  console.log('File has been fixed successfully.');
}

fixFile();