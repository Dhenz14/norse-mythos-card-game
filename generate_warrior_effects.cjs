/**
 * Warrior Effect Handler Generator
 * 
 * This script generates skeleton effect handlers for the new warrior card effects.
 * It creates handler files for both battlecry and spell effects used in our new warrior cards.
 */

const fs = require('fs');
const path = require('path');

// Paths
const HANDLERS_DIR = path.join(__dirname, 'client', 'src', 'game', 'effects', 'handlers');

// New effect types for warrior cards
const WARRIOR_EFFECT_TYPES = {
  battlecry: [
    { 
      type: 'conditional_buff', 
      properties: ['condition', 'buffAttack', 'buffHealth'] 
    },
    { 
      type: 'gain_armor_equal_to_attack', 
      properties: [] 
    },
    { 
      type: 'damage', 
      properties: ['value'] 
    },
    { 
      type: 'gain_armor_conditional_draw', 
      properties: ['value'] 
    },
    { 
      type: 'buff_weapon', 
      properties: ['buffAttack', 'buffDurability'] 
    },
    { 
      type: 'equip_weapon_from_deck_gain_armor', 
      properties: [] 
    }
  ],
  spellEffect: [
    { 
      type: 'gain_armor_reduce_cost', 
      properties: ['value', 'costReduction'] 
    },
    { 
      type: 'damage_with_self_damage', 
      properties: ['value', 'selfDamage'] 
    },
    { 
      type: 'damage_based_on_armor', 
      properties: ['minimumDamage'] 
    },
    { 
      type: 'buff_weapon', 
      properties: ['buffAttack', 'buffDurability'] 
    },
    { 
      type: 'buff_damaged_minions', 
      properties: ['buffAttack', 'buffHealth'] 
    },
    { 
      type: 'draw_weapon_gain_armor', 
      properties: [] 
    },
    { 
      type: 'gain_armor_reduce_hero_power', 
      properties: ['value', 'heroReduction'] 
    },
    { 
      type: 'cleave_damage', 
      properties: ['value'] 
    },
    { 
      type: 'armor_based_on_missing_health', 
      properties: [] 
    },
    { 
      type: 'equip_special_weapon', 
      properties: ['weaponAttack', 'weaponDurability', 'armorPerAttack'] 
    }
  ]
};

// Template for effect handler files
function createHandlerTemplate(category, type, properties) {
  // Convert properties to parameter list for function
  const propsList = Array.from(new Set(properties)).filter(prop => 
    prop !== 'type' && prop !== 'requiresTarget'
  );
  
  const propsComments = propsList.map(prop => 
    `   * @param effect.${prop} - The ${prop.replace(/([A-Z])/g, ' $1').toLowerCase()} for the effect`
  ).join('\n');
  
  const propsSetters = propsList.map(prop => `    const ${prop} = effect.${prop};`).join('\n');
  
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
export default function execute${pascalCase(type)}(
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
${propsSetters}
    
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
  return str.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function getCategoryEffectType(category) {
  switch (category) {
    case 'battlecry': return 'BattlecryEffect';
    case 'deathrattle': return 'DeathrattleEffect';
    case 'spellEffect': return 'SpellEffect';
    case 'combo': return 'ComboEffect';
    default: return 'Effect';
  }
}

// Create the handlers directory if it doesn't exist
if (!fs.existsSync(HANDLERS_DIR)) {
  fs.mkdirSync(HANDLERS_DIR, { recursive: true });
}

// Generate all the handlers
for (const category in WARRIOR_EFFECT_TYPES) {
  const categoryDir = path.join(HANDLERS_DIR, category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  WARRIOR_EFFECT_TYPES[category].forEach(effectInfo => {
    const { type, properties } = effectInfo;
    const handlerPath = path.join(categoryDir, `${type}.ts`);
    
    // Don't overwrite existing handlers
    if (!fs.existsSync(handlerPath)) {
      const handlerContent = createHandlerTemplate(category, type, properties);
      fs.writeFileSync(handlerPath, handlerContent, 'utf8');
      console.log(`Created handler for ${category}:${type} at ${handlerPath}`);
    } else {
      console.log(`Handler for ${category}:${type} already exists at ${handlerPath}`);
    }
  });
}

console.log('Generated all warrior card effect handlers successfully.');