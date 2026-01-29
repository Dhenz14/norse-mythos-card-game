/**
 * Effect Initialization System
 * 
 * This module automatically registers all available effect handlers with the EffectRegistry.
 * It eliminates the need for manual registration of each handler.
 */
import { EffectRegistry } from './EffectRegistry';

// Import handler collections - these will be replaced with dynamic imports in a production system
// For simplicity, we'll create placeholders for now
// In a full implementation, we would use dynamic imports or a different module system

// Placeholder for battlecry handlers
const battlecryHandlers: Record<string, any> = {};

// Placeholder for deathrattle handlers
const deathrattleHandlers: Record<string, any> = {};

// Placeholder for spell effect handlers
const spellEffectHandlers: Record<string, any> = {};

/**
 * Convert a PascalCase handler name to a snake_case effect type
 * 
 * @param handlerName - Handler name (e.g., "executeDealDamage")
 * @returns Effect type in snake_case (e.g., "deal_damage")
 */
function handlerNameToEffectType(handlerName: string): string {
  // Remove "execute" prefix
  const withoutPrefix = handlerName.replace(/^execute/, '');
  
  // Convert PascalCase to snake_case
  return withoutPrefix
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Initialize all effect handlers by registering them with the EffectRegistry
 */
export function initializeEffectHandlers(): void {
  
  // Register battlecry handlers
  Object.entries(battlecryHandlers).forEach(([handlerName, handler]) => {
    if (handlerName.startsWith('execute')) {
      const effectType = handlerNameToEffectType(handlerName);
      EffectRegistry.registerBattlecryHandler(effectType, handler);
    }
  });
  
  // Register deathrattle handlers
  Object.entries(deathrattleHandlers).forEach(([handlerName, handler]) => {
    if (handlerName.startsWith('execute')) {
      const effectType = handlerNameToEffectType(handlerName);
      EffectRegistry.registerDeathrattleHandler(effectType, handler);
    }
  });
  
  // Register spell effect handlers
  Object.entries(spellEffectHandlers).forEach(([handlerName, handler]) => {
    if (handlerName.startsWith('execute')) {
      const effectType = handlerNameToEffectType(handlerName);
      EffectRegistry.registerSpellEffectHandler(effectType, handler);
    }
  });
  
}

/**
 * A utility for more advanced projects to automatically discover and register handlers
 * This would typically use webpack's require.context or similar in a real project
 */
export async function registerEffectHandlersAsync(): Promise<void> {
  
  try {
    // This is a simplified example - in a real project you would use
    // webpack's require.context or a similar mechanism to dynamically
    // import all handler files
    
    // Example of what this would look like with dynamic imports:
    /*
    const battlecryContext = require.context('./handlers/battlecry', false, /\.ts$/);
    const battlecryModules = await Promise.all(
      battlecryContext.keys().map(async key => {
        const module = await import(key);
        return { key, module };
      })
    );
    
    battlecryModules.forEach(({ key, module }) => {
      const handlerName = key.replace(/^\.\/(.*)\.\w+$/, '$1');
      if (handlerName.startsWith('execute')) {
        const effectType = handlerNameToEffectType(handlerName);
        EffectRegistry.registerBattlecryHandler(effectType, module.default);
      }
    });
    */
    
  } catch (error) {
    console.error('Error during dynamic effect handler registration:', error);
  }
}

// Export a function to register a specific effect handler
export function registerEffectHandler(
  handlerType: 'battlecry' | 'deathrattle' | 'spell',
  handlerName: string,
  handler: any
): void {
  const effectType = handlerNameToEffectType(handlerName);
  
  switch (handlerType) {
    case 'battlecry':
      EffectRegistry.registerBattlecryHandler(effectType, handler);
      break;
    case 'deathrattle':
      EffectRegistry.registerDeathrattleHandler(effectType, handler);
      break;
    case 'spell':
      EffectRegistry.registerSpellEffectHandler(effectType, handler);
      break;
  }
}