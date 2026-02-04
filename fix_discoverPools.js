/**
 * Script to fix all comma issues in the discoverPools.ts file
 */
import fs from 'fs';

// File path
const filePath = 'client/src/game/data/discoverPools.ts';

// Read file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix all filter functions
const filterPattern = /filter: \(card: CardData\): boolean => Boolean\(card\.keywords && Array\.isArray\(card\.keywords\) && card\.keywords\.some\(keyword => ,\s+typeof keyword === 'string' && keyword.toLowerCase\(\) === '([^']+)'\)\)/g;
content = content.replace(filterPattern, (match, keywordType) => {
  return `filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => typeof keyword === 'string' && keyword.toLowerCase() === '${keywordType}'))`;
});

// Fix commas in arrow functions
content = content.replace(/keyword => ,/g, 'keyword => ');

// Fix trailing commas in export statements and other places
content = content.replace(/createDiscoveryPools\(\);,/g, 'createDiscoveryPools();');
content = content.replace(/\${fullCardDatabase\.length}\);,/g, '${fullCardDatabase.length});');
content = content.replace(/pool: \${poolId}\);,/g, 'pool: ${poolId});');
content = content.replace(/count: number = 3\): CardData\[\] {,/g, 'count: number = 3): CardData[] {');
content = content.replace(/result: CardData\[\] = \[\];,/g, 'result: CardData[] = [];');
content = content.replace(/card\.type === 'minion' && ,/g, 'card.type === \'minion\' && ');

// Fix the damaged_minion filter
content = content.replace(/filter: \(card: CardData\): boolean => Boolean\(card\.type === 'minion' && ,/g, 
  "filter: (card: CardData): boolean => Boolean(card.type === 'minion' && ");

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed discoverPools.ts file');