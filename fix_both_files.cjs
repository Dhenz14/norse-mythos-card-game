const fs = require('fs');
const path = require('path');

// Helper function to fix a file
function fixFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix old-style createGameLogEvent calls
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
  console.log(`Fixed file: ${filePath}`);
}

// Fix both files
fixFile(path.join(__dirname, 'client', 'src', 'game', 'utils', 'oldGodsUtils.ts'));
fixFile(path.join(__dirname, 'client', 'src', 'game', 'utils', 'highlanderUtils.ts'));

