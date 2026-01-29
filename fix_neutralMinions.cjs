/**
 * Specialized script to fix neutralMinions.ts file
 * Handles specific syntax issues with battlecry and deathrattle properties
 */
const fs = require('fs');

const filePath = './client/src/game/data/neutralMinions.ts';

console.log('Starting to fix neutralMinions.ts issues...');

if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}`);
  process.exit(1);
}

console.log(`Processing ${filePath}...`);

// Create backup
const backupPath = `${filePath}.backup.${Date.now()}`;
const content = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(backupPath, content);

// Fix specific issue with battlecry and deathrattle missing comma
let modifiedContent = content.replace(
  /(\s+)battlecry:\s*\{([^}]*?)\n\s+\}(\s*)deathrattle:/g,
  '$1battlecry: {$2\n$1},$3deathrattle:'
);

// Fix nested object missing commas (more general)
modifiedContent = modifiedContent.replace(
  /(\s+)(\w+):\s*\{([^}]*?)\n(\s+)\}(\s*)(\w+):/g,
  (match, indent, prop1, content, indent2, space, prop2) => {
    return `${indent}${prop1}: {${content}\n${indent2}},$5${prop2}:`;
  }
);

// Clean up white space in nested objects
modifiedContent = modifiedContent.replace(
  /\{([^}]*?)\n\s+\}/g,
  (match, content) => {
    // Trim trailing whitespace and newlines in content
    const cleanContent = content.trimEnd();
    return `{${cleanContent}\n    }`;
  }
);

// Fix missing commas between properties
modifiedContent = modifiedContent.replace(
  /(\s+)(\w+):\s*([^,{}\n]+)\s*(\w+):/g,
  '$1$2: $3,\n$1$4:'
);

// Write changes back to file
fs.writeFileSync(filePath, modifiedContent);
console.log(`Fixed and updated ${filePath}`);

console.log('Completed fixing neutralMinions.ts issues.');