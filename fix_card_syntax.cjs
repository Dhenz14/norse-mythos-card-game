/**
 * Comprehensive script to fix syntax issues in card files
 */
const fs = require('fs');
const path = require('path');

// Files to process
const files = [
  './client/src/game/data/spellCards.ts',
  './client/src/game/data/dualClassCards.ts',
  './client/src/game/data/legendaryCards.ts',
  './client/src/game/data/neutralMinions.ts'
];

console.log('Starting to fix card syntax issues...');

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`File not found: ${file}`);
    continue;
  }

  console.log(`Processing ${file}...`);
  
  // Create backup
  const backupPath = `${file}.backup.${Date.now()}`;
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(backupPath, content);
  
  // Fix import issues
  let modifiedContent = content
    .replace(/import\s*{\s*CardData\s*},\s*from/g, 'import { CardData } from');
  
  // Fix commas in card definitions
  modifiedContent = modifiedContent
    // Fix extra commas before closing brackets
    .replace(/,(\s*\})/g, '$1')
    // Fix missing commas after closing brackets
    .replace(/(\})\s*(\s*\{)/g, '$1,\n  $2')
    // Fix extra commas before closing braces
    .replace(/,(\s*\]\s*)/g, '$1')
    // Fix double commas
    .replace(/,,/g, ',')
    // Fix spellEffect syntax
    .replace(/spellEffect:\s*\{([^}]*?)\},?\s*,?\s*collectible:/g, 'spellEffect: {$1\n    },\n    collectible:')
    // Fix secretEffect syntax
    .replace(/secretEffect:\s*\{([^}]*?)\},?\s*,?\s*collectible:/g, 'secretEffect: {$1\n    },\n    collectible:')
    // Fix battlecry syntax
    .replace(/battlecry:\s*\{([^}]*?)\},?\s*,?\s*collectible:/g, 'battlecry: {$1\n    },\n    collectible:')
    // Fix deathrattle syntax
    .replace(/deathrattle:\s*\{([^}]*?)\},?\s*,?\s*collectible:/g, 'deathrattle: {$1\n    },\n    collectible:')
    // Fix effect in secretEffect syntax
    .replace(/(effect:\s*\{[^}]*?)\},?\s*,?\s*description:/g, '$1\n      },\n      description:')
    // Make sure spellEffect properly closed
    .replace(/spellEffect:\s*\{([^}]*?)(\s*)\}\s*,?\s*\}/g, 'spellEffect: {$1$2}\n  }')
    // Fix nested formatting
    .replace(/(\s+)(\w+):\s*\{([^}]*?),?\s*\}/g, (match, indent, prop, content) => {
      // Format nested object properties with correct indentation
      return `${indent}${prop}: {${content}\n${indent}}`; 
    })
    // Fix comma issues with collectible
    .replace(/(\s*collectible:\s*true),?\s*\}/g, '$1\n  }')
    // Remove duplicate collectible properties
    .replace(/(\s*collectible:\s*true\s*),\s*collectible:\s*true/g, '$1')
    // Fix weird comma dangling
    .replace(/(\s*\},\s*),/g, '$1')
    // Fix double commas after a property
    .replace(/,\s*,/g, ',')
    // Fix missing comma after property and before next object
    .replace(/(\s*)\}(\s*)\{/g, '$1},$2{')
    // Fix extra line with just a comma
    .replace(/,\s*\n\s*,/g, ',\n')
    // Fix dangling comma lines
    .replace(/\n\s*,(\s*collectible)/g, '\n    $1')
    // Fix indentation
    .replace(/\n(\s*)\{/g, '\n  {');

  // Write changes back to file
  fs.writeFileSync(file, modifiedContent);
  console.log(`Fixed and updated ${file}`);
}

console.log('Completed fixing card syntax issues.');