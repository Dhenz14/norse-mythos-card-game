const fs = require('fs');

// Read the file
const filePath = 'client/src/game/utils/highlanderUtils.ts';
let fileContent = fs.readFileSync(filePath, 'utf8');

// Replace all problematic createGameLogEvent calls
fileContent = fileContent.replace(
  /createGameLogEvent\({([^}]+)}\)/g, 
  function(match, innerContent) {
    // Extract relevant parts from the inner content
    const typeMatch = innerContent.match(/type: ['"]([^'"]+)['"]/);
    const playerMatch = innerContent.match(/player: ([^,]+)/);
    const textMatch = innerContent.match(/text: ['"]([^'"]+)['"]/);
    const cardIdMatch = innerContent.match(/cardId: ['"]([^'"]+)['"]/);
    const targetIdMatch = innerContent.match(/targetId: ['"]([^'"]+)['"]/);
    const valueMatch = innerContent.match(/value: ([^,]+)/);
    
    if (!typeMatch || !playerMatch || !textMatch) {
      return match; // Skip if can't extract all required parts
    }
    
    // Build options object
    let options = '';
    if (cardIdMatch || targetIdMatch || valueMatch) {
      options = '{ ';
      if (cardIdMatch) options += `cardId: ${cardIdMatch[1]}, `;
      if (targetIdMatch) options += `targetId: ${targetIdMatch[1]}, `;
      if (valueMatch) options += `value: ${valueMatch[1]}, `;
      options = options.slice(0, -2) + ' }'; // Remove trailing comma and space
    }
    
    // Format new call
    return `createGameLogEvent(
      newState,
      '${typeMatch[1]}' as GameLogEventType,
      ${playerMatch[1]},
      \`${textMatch[1].replace(/`/g, '\\`')}\`${options ? ',\n      ' + options : ''}
    )`;
  }
);

// Fix the card and demon type issues
fileContent = fileContent.replace(
  /const demonsInHand = hand.filter\(card =>\s*card\.card\.type === 'minion' && card\.card\.tribe === 'demon'\s*\);/,
  `const demonsInHand = hand.filter((card: CardInstance) => 
    card.card.type === 'minion' && card.card.tribe === 'demon'
  );`
);

fileContent = fileContent.replace(
  /newState\.players\[playerType\]\.hand = hand\.filter\(card =>\s*!demonsToSummon\.some\(demon => demon\.instanceId === card\.instanceId\)\s*\);/,
  `newState.players[playerType].hand = hand.filter((card: CardInstance) => 
    !demonsToSummon.some((demon: CardInstance) => demon.instanceId === card.instanceId)
  );`
);

fileContent = fileContent.replace(
  /const potionIndex = hand\.findIndex\(card => card\.instanceId === potionInstanceId\);/,
  `const potionIndex = hand.findIndex((card: CardInstance) => card.instanceId === potionInstanceId);`
);

// Write back the modified file
fs.writeFileSync(filePath, fileContent);
console.log('Updated highlanderUtils.ts');
