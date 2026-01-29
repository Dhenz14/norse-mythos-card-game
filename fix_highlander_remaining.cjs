// Script to fix remaining createGameLogEvent calls in highlanderUtils.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'client', 'src', 'game', 'utils', 'highlanderUtils.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace remaining old-style createGameLogEvent calls with the new format
content = content.replace(
  /newState\.gameLog\.push\(\s*createGameLogEvent\(\{\s*type: ['"]([^'"]+)['"](?: as GameLogEventType)?,\s*player: ([^,]+),\s*text: [`']([^`']+)[`'](?:,\s*cardId: ['"]?([^'"}\s]+)['"]?)?(?:,\s*targetId: ['"]?([^'"}\s]+)['"]?)?(?:,\s*value: ([^,}\s]+))?\s*\}\)\s*\);/g,
  function(match, type, player, text, cardId, targetId, value) {
    let options = {};
    
    if (cardId) options.cardId = cardId;
    if (targetId) options.targetId = targetId;
    if (value) options.value = value;
    
    const optionsStr = Object.keys(options).length > 0 
      ? `{ ${Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(', ')} }` 
      : '{}';
      
    return `newState.gameLog.push(\n    createGameLogEvent(\n      newState,\n      '${type}' as GameLogEventType,\n      ${player},\n      \`${text}\`,\n      ${optionsStr}\n    )\n  );`;
  }
);

// Write the modified content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Remaining createGameLogEvent calls in highlanderUtils.ts have been updated');
