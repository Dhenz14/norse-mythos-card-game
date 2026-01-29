/**
 * A specialized script to add the collectible property to card definitions.
 * This script carefully adds the property at the root level of each card object,
 * and avoids adding duplicate properties or placing them inside nested objects.
 */
import fs from 'fs';

// Files to process
const files = [
  './client/src/game/data/neutralMinions.ts',
  './client/src/game/data/spellCards.ts',
  './client/src/game/data/legendaryCards.ts',
  './client/src/game/data/warriorCards.ts',
  './client/src/game/data/mageCards.ts',
  './client/src/game/data/hunterCards.ts',
  './client/src/game/data/paladinCards.ts',
  './client/src/game/data/priestCards.ts',
  './client/src/game/data/rogueCards.ts',
  './client/src/game/data/shamanCards.ts',
  './client/src/game/data/warlockCards.ts',
  './client/src/game/data/druidCards.ts',
  './client/src/game/data/demonhunterCards.ts',
  './client/src/game/data/deathknightCards.ts'
];

// Function to add collectible property to a file
function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  console.log(`Processing ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Create backup
  const backupPath = `${filePath}.backup.${Date.now()}`;
  fs.writeFileSync(backupPath, content);

  // Only add collectible to cards that:
  // 1. Have type: "minion", "spell", or "weapon"
  // 2. Don't already have collectible property
  let modifiedContent = content.replace(
    /({[^{}]*type:\s*["'](?:minion|spell|weapon)["'][^{}]*?)(?!.*collectible:)(.*?})/gs,
    (match, start, end) => {
      if (match.includes('collectible:')) {
        // Already has collectible property, don't modify
        return match;
      }
      
      // Insert collectible: true before the closing brace
      return `${start}${end.slice(0, -1)},\n  collectible: true\n}`;
    }
  );

  // Fix cases where collectible: true might have been added inside nested objects
  modifiedContent = modifiedContent.replace(
    /(\s+(?:battlecry|deathrattle):\s*{[^}]+)collectible:\s*true([^}]+})/g,
    '$1$2'
  );

  // Write changes back to file
  fs.writeFileSync(filePath, modifiedContent);
  console.log(`  Updated ${filePath}`);
}

// Process each file
files.forEach(processFile);

console.log('Completed adding collectible property to all files.');