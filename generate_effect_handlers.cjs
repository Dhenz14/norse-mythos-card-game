/**
 * Effect Handler Generator
 * 
 * This script generates skeleton effect handlers for card effects based on the analysis
 * in card_effects_report.json. It prioritizes the most common effect types and ensures
 * the handlers follow the established pattern in the codebase.
 */

const fs = require('fs');
const path = require('path');

// Paths
const CARD_EFFECTS_REPORT = path.join(__dirname, 'card_effects_report.json');
const HANDLERS_DIR = path.join(__dirname, 'client', 'src', 'game', 'effects', 'handlers');

// Effect categories
const EFFECT_CATEGORIES = ['battlecry', 'deathrattle', 'spellEffect', 'combo'];

// Template for effect handler files
function createHandlerTemplate(category, type, properties) {
  // Convert properties to parameter list for function
  const propsList = Array.from(new Set(properties)).filter(prop => 
    prop !== 'type' && prop !== 'requiresTarget'
  );
  
  const propsComments = propsList.map(prop => 
    `   * @param effect.${prop} - The ${prop.replace(/([A-Z])/g, ' $1').toLowerCase()} for the effect`
  ).join('\n');
  
  return `/**
 * ${formatEffectName(type)} Effect Handler
 * 
 * This handler implements the ${category}:${type} effect.
 */
import { GameContext } from '../../../GameContext';
import { Card, ${getCategoryEffectType(category)} } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';

/**
 * Execute a ${formatEffectName(type)} effect
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
${propsComments}
 * @returns An object indicating success or failure and any additional data
 */
export default function execute${pascalCase(type)}${pascalCase(type)}(
  context: GameContext, 
  effect: ${getCategoryEffectType(category)}, 
  sourceCard: Card
): EffectResult {
  try {
    // Log the effect execution
    context.logGameEvent(\`Executing ${category}:${type} for \${sourceCard.name}\`);
    
    // Get effect properties with defaults
    const requiresTarget = effect.requiresTarget === true;
    const targetType = effect.targetType || 'none';
${propsList.map(prop => `    const ${prop} = effect.${prop};`).join('\n')}
    
    // Implementation placeholder
    console.log(\`${category}:${type} executed with properties: \${JSON.stringify(effect)}\`);
    
    // TODO: Implement the ${category}:${type} effect
    if (requiresTarget) {
      // Get targets based on targetType
      const targets = context.getTargets(targetType, sourceCard);
      
      if (targets.length === 0) {
        context.logGameEvent(\`No valid targets for ${category}:${type}\`);
        return { success: false, error: 'No valid targets' };
      }
      
      // Example implementation for target-based effect
      targets.forEach(target => {
        context.logGameEvent(\`${formatEffectName(type)} effect applied to \${target.card.name}\`);
        // TODO: Apply effect to target
      });
    } else {
      // Example implementation for non-target effect
      context.logGameEvent(\`${formatEffectName(type)} effect applied\`);
      // TODO: Apply effect without target
    }
    
    return { success: true };
  } catch (error) {
    console.error(\`Error executing ${category}:${type}:\`, error);
    return { 
      success: false, 
      error: \`Error executing ${category}:${type}: \${error instanceof Error ? error.message : String(error)}\`
    };
  }
}
`;
}

// Helper functions
function formatEffectName(type) {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function pascalCase(str) {
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function getCategoryEffectType(category) {
  switch (category) {
    case 'battlecry': return 'BattlecryEffect';
    case 'deathrattle': return 'DeathrattleEffect';
    case 'spellEffect': return 'SpellEffect';
    case 'combo': return 'ComboEffect';
    default: return 'unknown';
  }
}

function createIndexTemplate(category, handlers) {
  const imports = handlers.map(type => 
    `import execute${pascalCase(type)}${pascalCase(type)} from './${type}Handler';`
  ).join('\n');
  
  const exportObject = handlers.map(type => 
    `  '${type}': execute${pascalCase(type)}${pascalCase(type)},`
  ).join('\n');
  
  return `/**
 * ${formatEffectName(category)} Handlers Index
 * 
 * This file exports all ${category} handlers for registration with the EffectRegistry
 */
${imports}

// Map of all ${category} handlers
const ${category}Handlers = {
${exportObject}
};

export default ${category}Handlers;
`;
}

// Main function
async function main() {
  try {
    // Read card effects report
    const reportData = JSON.parse(fs.readFileSync(CARD_EFFECTS_REPORT, 'utf8'));
    
    // Get common effects by category
    const effectsByCategory = {};
    const existingHandlers = {};
    
    // Get existing handlers
    for (const category of EFFECT_CATEGORIES) {
      const categoryDir = path.join(HANDLERS_DIR, category);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }
      
      // Check existing handlers
      existingHandlers[category] = [];
      if (fs.existsSync(path.join(categoryDir, 'index.ts'))) {
        const indexContent = fs.readFileSync(path.join(categoryDir, 'index.ts'), 'utf8');
        const handlerMatches = indexContent.matchAll(/'([a-z_]+)'/g);
        for (const match of handlerMatches) {
          existingHandlers[category].push(match[1]);
        }
      }
      
      // Get top effects for this category
      effectsByCategory[category] = [];
      for (const effectType in reportData.effectTypes) {
        if (effectType.startsWith(`${category}:`)) {
          const type = effectType.split(':')[1];
          if (!existingHandlers[category].includes(type)) {
            effectsByCategory[category].push({
              type,
              count: reportData.effectTypes[effectType].count,
              properties: Object.keys(reportData.effectTypes[effectType].properties || {})
            });
          }
        }
      }
      
      // Sort by count (most common first)
      effectsByCategory[category].sort((a, b) => b.count - a.count);
    }
    
    // Generate handlers for top 5 missing effects in each category
    const generatedHandlers = {};
    
    for (const category of EFFECT_CATEGORIES) {
      generatedHandlers[category] = [];
      const topEffects = effectsByCategory[category].slice(0, 5);
      
      for (const effect of topEffects) {
        const handlerPath = path.join(HANDLERS_DIR, category, `${effect.type}Handler.ts`);
        
        // Generate handler file
        const handlerContent = createHandlerTemplate(category, effect.type, effect.properties);
        fs.writeFileSync(handlerPath, handlerContent);
        console.log(`Created handler for ${category}:${effect.type}`);
        
        generatedHandlers[category].push(effect.type);
      }
      
      // Update index file if handlers were generated
      if (generatedHandlers[category].length > 0) {
        // Combine existing and new handlers
        const allHandlers = [...existingHandlers[category], ...generatedHandlers[category]];
        
        // Create or update index file
        const indexPath = path.join(HANDLERS_DIR, category, 'index.ts');
        const indexContent = createIndexTemplate(category, allHandlers);
        fs.writeFileSync(indexPath, indexContent);
        console.log(`Updated index for ${category} handlers`);
      }
    }
    
    console.log('Effect handlers generation complete!');
    console.log('Summary:');
    for (const category of EFFECT_CATEGORIES) {
      console.log(`- ${formatEffectName(category)}: ${generatedHandlers[category].length} handlers generated`);
      if (generatedHandlers[category].length > 0) {
        console.log(`  ${generatedHandlers[category].join(', ')}`);
      }
    }
  } catch (error) {
    console.error('Error generating effect handlers:', error);
  }
}

// Run the generator
main();