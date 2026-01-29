// Script to fix all createGameLogEvent calls in highlanderUtils.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'game', 'utils', 'highlanderUtils.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all old-style createGameLogEvent calls with the new format
content = content.replace(
  /createGameLogEvent\(\{[\s\n]*type: ['"]([^'"]+)['"](?: as GameLogEventType)?[\s\n]*,[\s\n]*player: ([^,]+)[\s\n]*,[\s\n]*text: [`']([^`']+)[`'][\s\n]*(?:,[\s\n]*cardId: ['"]?([^'"}\s]+)['"]?)?[\s\n]*(?:,[\s\n]*targetId: ['"]?([^'"}\s]+)['"]?)?[\s\n]*(?:,[\s\n]*value: ([^,}\s]+))?[\s\n]*\}\)/g, 
  function(match, type, player, text, cardId, targetId, value) {
    let options = {};
    
    if (cardId) options.cardId = cardId;
    if (targetId) options.targetId = targetId;
    if (value) options.value = value;
    
    const optionsStr = Object.keys(options).length > 0 
      ? `{ ${Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(', ')} }` 
      : '{}';
      
    return `createGameLogEvent(\n      newState,\n      '${type}' as GameLogEventType,\n      ${player},\n      \`${text}\`,\n      ${optionsStr}\n    )`;
  }
);

// Write the modified content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('All createGameLogEvent calls in highlanderUtils.ts have been updated');
