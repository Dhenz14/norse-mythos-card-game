/**
 * Warrior Effect Registration Script
 * 
 * This script updates the EffectRegistry.ts file to register all the new warrior effect handlers.
 */

const fs = require('fs');
const path = require('path');

// Paths
const REGISTRY_PATH = path.join(__dirname, 'client', 'src', 'game', 'effects', 'EffectRegistry.ts');
const HANDLERS_DIR = path.join(__dirname, 'client', 'src', 'game', 'effects', 'handlers');

// New effect types for warrior cards
const WARRIOR_EFFECT_TYPES = {
  battlecry: [
    'conditional_buff',
    'gain_armor_equal_to_attack',
    'damage',
    'gain_armor_conditional_draw',
    'buff_weapon',
    'equip_weapon_from_deck_gain_armor'
  ],
  spellEffect: [
    'gain_armor_reduce_cost',
    'damage_with_self_damage',
    'damage_based_on_armor',
    'buff_weapon',
    'buff_damaged_minions',
    'draw_weapon_gain_armor',
    'gain_armor_reduce_hero_power',
    'cleave_damage',
    'armor_based_on_missing_health',
    'equip_special_weapon'
  ]
};

// Helper functions
function pascalCase(str) {
  return str.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Read the current registry file
const registryContent = fs.readFileSync(REGISTRY_PATH, 'utf8');

// Generate import statements for all handlers
let importsToAdd = '';
let registrationsToAdd = '';

// Process each category and its effect types
for (const category in WARRIOR_EFFECT_TYPES) {
  const effectTypes = WARRIOR_EFFECT_TYPES[category];
  
  // Generate import statements
  effectTypes.forEach(type => {
    const handlerName = `execute${pascalCase(type)}`;
    importsToAdd += `import ${handlerName} from './handlers/${category}/${type}';\n`;
  });
  
  // Generate registration statements based on category
  effectTypes.forEach(type => {
    const handlerName = `execute${pascalCase(type)}`;
    
    switch (category) {
      case 'battlecry':
        registrationsToAdd += `    EffectRegistry.registerBattlecryHandler('${type}', ${handlerName});\n`;
        break;
      case 'deathrattle':
        registrationsToAdd += `    EffectRegistry.registerDeathrattleHandler('${type}', ${handlerName});\n`;
        break;
      case 'spellEffect':
        registrationsToAdd += `    EffectRegistry.registerSpellEffectHandler('${type}', ${handlerName});\n`;
        break;
      case 'combo':
        registrationsToAdd += `    EffectRegistry.registerComboHandler('${type}', ${handlerName});\n`;
        break;
    }
  });
}

// Find the position to insert imports (after the last import statement)
const lastImportIndex = registryContent.lastIndexOf('import');
const lastImportEndIndex = registryContent.indexOf(';', lastImportIndex) + 1;
const contentBeforeImports = registryContent.substring(0, lastImportEndIndex);
const contentAfterImports = registryContent.substring(lastImportEndIndex);

// Find the position to insert registrations (in the initializeHandlers method)
const initMethodStart = registryContent.indexOf('static initializeHandlers()');
const initBodyStart = registryContent.indexOf('{', initMethodStart);
const initBodyEnd = registryContent.indexOf('  }', initBodyStart);

const contentBeforeRegistrations = registryContent.substring(0, initBodyEnd);
const contentAfterRegistrations = registryContent.substring(initBodyEnd);

// Create the updated content
const updatedContent = 
  contentBeforeImports + '\n' + 
  importsToAdd + '\n' + 
  contentAfterImports.substring(0, initBodyEnd - contentBeforeImports.length) + 
  '\n' + registrationsToAdd + 
  contentAfterRegistrations;

// Write the updated content back to the registry file
fs.writeFileSync(REGISTRY_PATH, updatedContent, 'utf8');

console.log('Updated EffectRegistry.ts with all warrior effect handlers.');