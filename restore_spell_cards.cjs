/**
 * Restore Spell Cards
 * 
 * This script processes the most recent backup of spellCards.ts,
 * extracts each card object, ensures it's properly formatted,
 * and adds it to the current valid file structure.
 */

const fs = require('fs');
const path = require('path');

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR: ' : level === 'warning' ? '⚠️ WARNING: ' : '✅ INFO: ';
  console.log(prefix + message);
}

// Use a specific backup file with most data
function findBackupFile() {
  // Let's use the largest backup file which likely has the most data
  const specificBackup = './client/src/game/data/spellCards.ts.backup.1743551248388';
  
  if (fs.existsSync(specificBackup)) {
    return specificBackup;
  }
  
  // Fallback to latest backup if specific one not found
  const dir = './client/src/game/data';
  const files = fs.readdirSync(dir);
  const backupFiles = files
    .filter(f => f.startsWith('spellCards.ts.backup'))
    .map(f => ({ 
      name: f, 
      path: path.join(dir, f),
      size: fs.statSync(path.join(dir, f)).size
    }))
    .sort((a, b) => b.size - a.size); // Sort by size (largest first)
  
  return backupFiles.length > 0 ? backupFiles[0].path : null;
}

// Extract card objects from the backup file
function extractCardObjects(backupContent) {
  const cardObjects = [];
  let inCardObject = false;
  let braceCount = 0;
  let currentCardStr = '';
  
  // Attempt to extract each card object
  const lines = backupContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Start of a card object
    if (line.startsWith('{') && !inCardObject) {
      inCardObject = true;
      braceCount = 1;
      currentCardStr = '{';
      continue;
    }
    
    if (inCardObject) {
      if (line.includes('{')) braceCount += line.split('{').length - 1;
      if (line.includes('}')) braceCount -= line.split('}').length - 1;
      
      currentCardStr += line + '\n';
      
      // End of a card object
      if (braceCount === 0) {
        inCardObject = false;
        
        // Clean up the card object string
        try {
          // Format the card object as clean JSON
          const cleanedStr = currentCardStr
            .replace(/,\s*}/g, '\n  }')
            .replace(/,\s*$/gm, '')
            .replace(/(\w+):/g, '"$1":')
            .replace(/:\s*"([^"]*)"/g, ': "$1"')
            .replace(/:\s*\{/g, ': {')
            .replace(/\}\s*,\s*$/gm, '}');
          
          // Add to card objects if it looks valid
          if (cleanedStr.includes('"id":') && cleanedStr.includes('"name":')) {
            cardObjects.push(cleanedStr);
          }
        } catch (e) {
          log(`Error processing card at line ${i}: ${e.message}`, 'warning');
        }
        
        currentCardStr = '';
      }
    }
  }
  
  log(`Extracted ${cardObjects.length} card objects from backup`);
  return cardObjects;
}

// Main function
async function main() {
  try {
    // Find the backup with most data
    const backupPath = findBackupFile();
    if (!backupPath) {
      log('No backup file found.', 'error');
      return;
    }
    
    log(`Using backup file: ${backupPath}`);
    
    // Read the backup content
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    
    // Read the current spellCards.ts file
    const currentFilePath = './client/src/game/data/spellCards.ts';
    const currentContent = fs.readFileSync(currentFilePath, 'utf8');
    
    // Extract card objects from backup
    const cardObjects = extractCardObjects(backupContent);
    
    if (cardObjects.length === 0) {
      log('No valid card objects found in backup.', 'error');
      return;
    }
    
    // Create a new file with the first 10 cards to start
    const firstTenCards = cardObjects.slice(0, 10);
    
    // Replace the current array content with our extracted cards
    const newContent = currentContent.replace(
      /export const spellCards: CardData\[\] = \[([\s\S]*?)\];/,
      `export const spellCards: CardData[] = [\n  ${firstTenCards.join(',\n  ')}\n];`
    );
    
    // Create a backup of current file before changing
    fs.copyFileSync(currentFilePath, `${currentFilePath}.pre-restore-${Date.now()}`);
    
    // Write the new content
    fs.writeFileSync(currentFilePath, newContent, 'utf8');
    
    log(`Successfully restored 10 card objects to spellCards.ts`);
    log('Run TypeScript compiler to verify the restored file is valid');
    
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

main();