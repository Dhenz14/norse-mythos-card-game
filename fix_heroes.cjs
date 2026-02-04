/**
 * Script to fix heroes.ts file
 */
const fs = require('fs');

const FILEPATH = './client/src/game/data/heroes.ts';

// Make a backup
fs.copyFileSync(FILEPATH, `${FILEPATH}.bak`);

// Get the content
let content = fs.readFileSync(FILEPATH, 'utf8');

// Fix comma errors
content = content.replace(/id: number;,/g, 'id: number;');
content = content.replace(/name: string;,/g, 'name: string;');
content = content.replace(/description: string;,/g, 'description: string;');
content = content.replace(/interface AlternateHero {,/g, 'interface AlternateHero {');
content = content.replace(/interface HeroData {,/g, 'interface HeroData {');
content = content.replace(/  {,/g, '  {');

// Write the fixed content back
fs.writeFileSync(FILEPATH, content);

console.log('Fixed heroes.ts');
