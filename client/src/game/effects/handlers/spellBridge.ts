/**
 * Spell Effect Bridge
 * 
 * This file bridges the gap between the existing spellUtils.ts and the new EffectRegistry system.
 * It wraps the existing spell execution logic to use the registry when appropriate.
 */
import { GameState, CardInstance } from '../types';
import { SpellEffect } from '../types/CardTypes';
import { EffectRegistry } from '../effects/EffectRegistry';

// Import the original spell execution function
import { executeSpell as originalExecuteSpell } from '../utils/spellUtils';

/**
 * Enhanced executeSpell that uses the EffectRegistry for missing effect types
 * 
 * @param state Current game state
 * @param spellCard The spell card being played
 * @param targetId Optional target ID if the spell requires a target
 * @returns Updated game state
 */
export function executeSpell(
  state: GameState,
  spellCard: CardInstance,
  targetId?: string
): GameState {
  const effect = spellCard.card.spellEffect;
  
  // If no spell effect, just return the state
  if (!effect) {
    return state;
  }
  
  // Check if we have a registered handler for this spell effect type
  if (EffectRegistry.hasHandler('spellEffect', effect.type)) {
    // Use the registered handler from EffectRegistry
    try {
      // Execute the spell effect using the registry
      const result = EffectRegistry.executeSpellEffect(
        state as any, // Cast to GameContext type expected by EffectRegistry
        effect as SpellEffect,
        spellCard as any // Cast to Card type expected by EffectRegistry
      );
      
      if (result.success) {
        return result.additionalData || state;
      } else {
        console.error(`Error executing spell effect via registry: ${result.error}`);
        return state;
      }
    } catch (error) {
      console.error('Error in spell effect bridge:', error);
      return state;
    }
  } else {
    // Fall back to the original implementation
    return originalExecuteSpell(state, spellCard, targetId);
  }
}

export default executeSpell;
