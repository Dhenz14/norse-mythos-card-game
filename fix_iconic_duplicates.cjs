/**
 * Script to fix duplicate cards in iconicLegendaryCards.ts and legendaryCards.ts
 */

const fs = require('fs');
const path = require('path');

// Files to prioritize
const PRIORITY_FILES = [
  'iconicLegendaryCards.ts',
  'legendaryCards.ts'
];

// Function to remove duplicates from lower-priority files
function removeDuplicates() {
  const duplicatesReport = fs.readFileSync('duplicate_cards_report_after.txt', 'utf8');
  
  // Parse the report to find duplicates in the priority files
  const duplicates = new Map();
  let currentFile = '';
  let currentCard = '';
  let currentId = 0;
  let inDuplicate = false;
  let alsoDupes = [];

  const lines = duplicatesReport.split('\n');
  for (const line of lines) {
    if (line.includes('=== ') && line.includes(' (')) {
      currentFile = line.match(/=== (.+?) \(/)?.[1] || '';
    } else if (line.trim().startsWith('Line ') && line.includes(': "')) {
      const nameMatch = line.match(/: "([^"]+)"/);
      const idMatch = line.match(/\(ID: (\d+)/);
      if (nameMatch && idMatch) {
        currentCard = nameMatch[1];
        currentId = parseInt(idMatch[1]);
        inDuplicate = true;
        alsoDupes = [];
      }
    } else if (inDuplicate && line.includes('Also appears in:')) {
      // Continue - will collect duplicates next
    } else if (inDuplicate && line.trim().startsWith('    ')) {
      const fileMatch = line.trim().match(/^([^:]+):(\d+) \(ID: (\d+)\)/);
      if (fileMatch) {
        alsoDupes.push({
          file: fileMatch[1],
          line: parseInt(fileMatch[2]),
          id: parseInt(fileMatch[3])
        });
      }
    } else if (line.trim() === '') {
      if (inDuplicate && PRIORITY_FILES.includes(currentFile)) {
        // If this is a priority file, store the duplicates
        if (!duplicates.has(currentFile)) {
          duplicates.set(currentFile, []);
        }
        duplicates.get(currentFile).push({
          name: currentCard,
          id: currentId,
          duplicates: alsoDupes
        });
      }
      inDuplicate = false;
    }
  }

  // Process duplicates in each priority file
  for (const [file, dupes] of duplicates.entries()) {
    console.log(`Processing ${dupes.length} duplicates in ${file}`);
    
    for (const dupe of dupes) {
      // Remove this card from all other files
      dupe.duplicates.forEach(duplicate => {
        const duplicateFile = duplicate.file;
        const duplicateId = duplicate.id;
        
        if (!PRIORITY_FILES.includes(duplicateFile)) {
          // Lower priority file, remove the card
          const filePath = path.join('client', 'src', 'game', 'data', duplicateFile);
          try {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Find the card by ID and remove it
            const cardPattern = new RegExp(`\\s*{[^}]*id:\\s*${duplicateId}[^}]*}\\s*,?`, 'g');
            const newContent = content.replace(cardPattern, '');
            
            // Clean up any artifact commas
            let cleanedContent = newContent.replace(/,\s*,/g, ',');
            cleanedContent = cleanedContent.replace(/,\s*]/g, ']');
            cleanedContent = cleanedContent.replace(/\[\s*,/g, '[');
            
            fs.writeFileSync(filePath, cleanedContent, 'utf8');
            console.log(`Removed ${dupe.name} (ID: ${duplicateId}) from ${duplicateFile}`);
          } catch (error) {
            console.error(`Error updating file ${duplicateFile}:`, error);
          }
        }
      });
    }
  }
}

// Main function
function main() {
  // Remove duplicates
  removeDuplicates();
  console.log('Done!');
}

main();