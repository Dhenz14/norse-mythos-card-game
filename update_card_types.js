import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the cards.ts file
const cardsFilePath = join(__dirname, 'client', 'src', 'game', 'data', 'cards.ts');

// Read the original file content
let fileContent = readFileSync(cardsFilePath, 'utf8');

// Create a comprehensive pattern to fix all card objects
fileContent = fileContent.replace(/\n\s*keywords:/g, '\n    keywords:');

// Write the content back
writeFileSync(cardsFilePath, fileContent, 'utf8');

// Let's do a full fix of all card objects
const fullReformatScript = `
import { readFileSync, writeFileSync } from 'fs';

// Path to the cards.ts file
const cardsFilePath = '${cardsFilePath}';

// Read the original file content
let content = readFileSync(cardsFilePath, 'utf8');

// Fix the formatting issues with cards by reformatting each card object
content = content.replace(/{\\s*id: \\d+,([\\s\\S]*?)}(?=[,\\s]*\\n)/g, (match, cardContents) => {
  // Parse the card contents
  const lines = cardContents.split('\\n').map(line => line.trim()).filter(line => line);
  
  // Create a properly formatted card object
  return '{\\n    id:' + lines.join(',\\n    ') + '\\n  }';
});

// Fix indentation on the first entry 
content = content.replace(/export const tokenCards: CardData\\[\\] = \\[\\s*{/, 'export const tokenCards: CardData[] = [\\n  {');

// Fix missing type property
content = content.replace(/rarity: "(common|rare|epic|legendary)",\\s*\\n\\s*keywords:/g, 'rarity: "$1",\\n    type: "minion",\\n    keywords:');

// Write the updated content back to the file
writeFileSync(cardsFilePath, content, 'utf8');
`;

// Write this script to a temporary file
const tempScriptPath = join(__dirname, 'temp_reformat.js');
writeFileSync(tempScriptPath, fullReformatScript, 'utf8');

// Now execute this script to perform the comprehensive formatting
console.log('Running full reformatting script...');
import('child_process').then(({ execSync }) => {
  try {
    execSync(`node ${tempScriptPath}`, { encoding: 'utf8' });
    console.log('Successfully reformatted card data in:', cardsFilePath);
  } catch (error) {
    console.error('Error during reformatting:', error.message);
  } finally {
    // Clean up the temporary script
    import('fs').then(({ unlinkSync }) => {
      try {
        unlinkSync(tempScriptPath);
      } catch (e) {
        console.error('Could not delete temporary script:', e.message);
      }
    });
  }
});