/**
 * Handler Registration Module
 * 
 * This module registers all effect handlers with the central EffectRegistry.
 */

import EffectRegistry, { BattlecryHandler, DeathrattleHandler, SpellEffectHandler } from './EffectRegistry';

// Import handler dictionaries
import battlecryHandlers from './handlers/battlecry';
import deathrattleHandlers from './handlers/deathrattle';
import spellEffectHandlers from './handlers/spellEffect';

/**
 * Register all effect handlers with the registry
 */
export function registerAllHandlers(): void {
  // Register all battlecry handlers
  Object.entries(battlecryHandlers).forEach(([type, handler]) => {
    EffectRegistry.registerBattlecryHandler(type, handler as BattlecryHandler);
  });
  
  // Register all deathrattle handlers
  Object.entries(deathrattleHandlers).forEach(([type, handler]) => {
    EffectRegistry.registerDeathrattleHandler(type, handler as DeathrattleHandler);
  });
  
  // Register all spell effect handlers
  Object.entries(spellEffectHandlers).forEach(([type, handler]) => {
    EffectRegistry.registerSpellEffectHandler(type, handler as SpellEffectHandler);
  });
  
  // Register any combo handlers (when implemented)
  // Currently we don't have any combo handlers
  
  // Log registration status
}

// Export default function for convenience
export default registerAllHandlers;