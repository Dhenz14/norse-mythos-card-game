/**
 * Generate Effect Handler Script
 * 
 * This script generates skeleton effect handlers for the card game.
 * It creates the necessary files and boilerplate code for implementing a new effect.
 * 
 * Usage: node generate_effect_handler.cjs --type battlecry --name deal_damage
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
let effectType = null;
let effectName = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type' && i + 1 < args.length) {
    effectType = args[i + 1];
    i++;
  } else if (args[i] === '--name' && i + 1 < args.length) {
    effectName = args[i + 1];
    i++;
  }
}

// Validate arguments
if (!effectType || !effectName) {
  console.error('Missing required arguments. Usage: node generate_effect_handler.cjs --type battlecry --name deal_damage');
  process.exit(1);
}

if (!['battlecry', 'deathrattle', 'spell'].includes(effectType)) {
  console.error(`Invalid effect type: ${effectType}. Must be one of: battlecry, deathrattle, spell`);
  process.exit(1);
}

if (!/^[a-z_]+$/.test(effectName)) {
  console.error(`Invalid effect name: ${effectName}. Must be in snake_case format (lowercase with underscores)`);
  process.exit(1);
}

// Convert snake_case to PascalCase for function name
const functionName = effectName
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

// Convert snake_case to camelCase for file name
const fileName = effectName
  .split('_')
  .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

// Determine the effect interface type
const effectInterface = 
  effectType === 'battlecry' ? 'BattlecryEffect' : 
  effectType === 'deathrattle' ? 'DeathrattleEffect' : 
  'SpellEffect';

// Set up paths
const baseDir = path.join(__dirname, 'client', 'src', 'game', 'effects');
const handlerDir = path.join(baseDir, 'handlers', effectType);
const handlerPath = path.join(handlerDir, `${fileName}Handler.ts`);
const indexPath = path.join(handlerDir, 'index.ts');

// Ensure directory exists
if (!fs.existsSync(handlerDir)) {
  fs.mkdirSync(handlerDir, { recursive: true });
  console.log(`Created directory: ${handlerDir}`);
}

// Check if handler already exists
if (fs.existsSync(handlerPath)) {
  console.error(`Handler already exists: ${handlerPath}`);
  process.exit(1);
}

// Generate handler file content
const handlerContent = `/**
 * ${functionName} ${effectType.charAt(0).toUpperCase() + effectType.slice(1)} Handler
 * 
 * Implements the "${effectName}" ${effectType} effect.
 */
import { GameContext } from '../../GameContext';
import { Card, ${effectInterface} } from '../../types/CardTypes';
import { EffectResult } from '../../types/EffectTypes';

/**
 * Execute a ${effectName} ${effectType} effect
 * 
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns Effect result with success/failure status
 */
export default function execute${functionName}(
  context: GameContext,
  effect: ${effectInterface},
  sourceCard: Card
): EffectResult {
  try {
    // TODO: Implement ${effectName} logic here
    console.log(\`Executing ${effectType} ${effectName} from \${sourceCard.name}\`);
    
    return {
      success: true,
      // Add any additional result data as needed
    };
  } catch (error) {
    console.error(\`Error executing ${effectType}:${effectName}:\`, error);
    return { 
      success: false, 
      error: \`Error executing ${effectType}:${effectName}: \${error instanceof Error ? error.message : String(error)}\`
    };
  }
}
`;

// Write handler file
fs.writeFileSync(handlerPath, handlerContent);
console.log(`Created handler file: ${handlerPath}`);

// Update or create index file
let indexContent = '';
if (fs.existsSync(indexPath)) {
  // Read existing index file and update it
  indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check if handler is already in index
  if (indexContent.includes(`execute${functionName}`)) {
    console.log(`Handler execute${functionName} already exists in index.`);
  } else {
    // Add new import
    const lastImport = indexContent.lastIndexOf('import');
    const importEnd = indexContent.indexOf(';', lastImport) + 1;
    const newImport = `\nimport execute${functionName} from './${fileName}Handler';`;
    indexContent = indexContent.substring(0, importEnd) + newImport + indexContent.substring(importEnd);
    
    // Add to export list
    const exportStart = indexContent.indexOf('export {');
    const exportEnd = indexContent.indexOf('};', exportStart);
    const newExport = `  execute${functionName},\n`;
    indexContent = indexContent.substring(0, exportEnd) + newExport + indexContent.substring(exportEnd);
    
    fs.writeFileSync(indexPath, indexContent);
    console.log(`Updated index file: ${indexPath}`);
  }
} else {
  // Create new index file
  indexContent = `/**
 * ${effectType.charAt(0).toUpperCase() + effectType.slice(1)} Effect Handlers Index
 * 
 * This file exports all ${effectType} handlers for registration with the EffectRegistry.
 */
import execute${functionName} from './${fileName}Handler';

export {
  execute${functionName},
};
`;
  fs.writeFileSync(indexPath, indexContent);
  console.log(`Created index file: ${indexPath}`);
}

console.log(`\nSuccessfully generated ${effectType} handler for ${effectName}.`);
console.log(`Next steps:
1. Implement the logic in ${handlerPath}
2. Make sure the effect is registered in the EffectRegistry
3. Add tests for the effect handler`);