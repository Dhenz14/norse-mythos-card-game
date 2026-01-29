/**
 * Script to fix syntax errors in corruptCards.ts
 * 
 * This script identifies and fixes structural issues in the corruptCards.ts file
 * after removal of duplicate card definitions.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message, level = 'info') {
  const prefix = level === 'error' ? '❌ ERROR:' : 
                level === 'warn' ? '⚠️ WARNING:' : 
                level === 'success' ? '✅ SUCCESS:' : 'ℹ️ INFO:';
  console.log(`${prefix} ${message}`);
}

function fixCorruptCardsFile() {
  const filePath = path.join(process.cwd(), 'client/src/game/data/corruptCards.ts');
  
  try {
    // Read file content to get a clean copy to work with
    let originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Fix the specific Shaman section that has syntax errors
    // First, remove the problematic section completely (line 280-289)
    const lines = originalContent.split('\n');
    
    // Find the line numbers for "// Priest" and "// Warrior"
    let priestLineIndex = -1;
    let warriorLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '// Priest') {
        priestLineIndex = i;
      } else if (lines[i].trim() === '// Warrior') {
        warriorLineIndex = i;
        break;
      }
    }
    
    // If we found both sections, replace everything in between with just the section headers
    if (priestLineIndex !== -1 && warriorLineIndex !== -1) {
      const newLines = [
        ...lines.slice(0, priestLineIndex),
        '// Priest',
        '',
        '// Shaman',
        '',
        ...lines.slice(warriorLineIndex)
      ];
      
      // Create the fixed content
      const fixedContent = newLines.join('\n');
      
      // Write the fixed content back to the file
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      log(`Successfully fixed syntax issues in ${filePath}`, 'success');
    } else {
      log(`Could not locate Priest or Warrior sections in ${filePath}`, 'error');
    }
    
    return true;
  } catch (error) {
    log(`Failed to fix ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

// Execute the fix
fixCorruptCardsFile();