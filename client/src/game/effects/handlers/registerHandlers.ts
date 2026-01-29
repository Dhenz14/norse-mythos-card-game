/**
 * Effect Handler Registration
 * 
 * This file registers all effect handlers with the EffectRegistry
 */
import { EffectRegistry } from './EffectRegistry';
import battlecryHandlers from './handlers/battlecry';
import deathrattleHandlers from './handlers/deathrattle';
import spellEffectHandlers from './handlers/spellEffect';
import comboHandlers from './handlers/combo';

/**
 * Register all effect handlers with the EffectRegistry
 */
export function registerAllEffectHandlers() {
  // Register battlecry handlers
  Object.entries(battlecryHandlers).forEach(([type, handler]) => {
    EffectRegistry.registerBattlecryHandler(type, handler);
  });
  
  // Register deathrattle handlers
  Object.entries(deathrattleHandlers).forEach(([type, handler]) => {
    EffectRegistry.registerDeathrattleHandler(type, handler);
  });
  
  // Register spell effect handlers
  Object.entries(spellEffectHandlers).forEach(([type, handler]) => {
    EffectRegistry.registerSpellEffectHandler(type, handler);
  });
  
  // Register combo handlers
  Object.entries(comboHandlers).forEach(([type, handler]) => {
    EffectRegistry.registerComboHandler(type, handler);
  });
  
}

export default registerAllEffectHandlers;
