/**
 * Deathrattle Bridge
 * 
 * This file bridges the gap between the existing deathrattleUtils.ts and the new EffectRegistry system.
 * It wraps the existing deathrattle execution logic to use the registry when appropriate.
 */
import { GameState, CardInstance } from '../types';
import { DeathrattleEffect } from '../types/CardTypes';
import { EffectRegistry } from '../effects/EffectRegistry';

// Import the original deathrattle execution function
import { executeDeathrattle as originalExecuteDeathrattle } from '../utils/deathrattleUtils';

/**
 * Enhanced executeDeathrattle that uses the EffectRegistry for missing effect types
 * 
 * @param state Current game state
 * @param card The card with the deathrattle
 * @param playerId The player ID who controlled the card
 * @returns Updated game state
 */
export function executeDeathrattle(
  state: GameState,
  card: CardInstance,
  playerId: string
): GameState {
  const deathrattle = card.card.deathrattle;
  
  // If no deathrattle, just return the state
  if (!deathrattle) {
    return state;
  }
  
  // Check if we have a registered handler for this deathrattle type
  if (EffectRegistry.hasHandler('deathrattle', deathrattle.type)) {
    // Use the registered handler from EffectRegistry
    try {
      // Execute the deathrattle using the registry
      const result = EffectRegistry.executeDeathrattle(
        state as any, // Cast to GameContext type expected by EffectRegistry
        deathrattle as DeathrattleEffect,
        card as any // Cast to Card type expected by EffectRegistry
      );
      
      if (result.success) {
        return result.additionalData || state;
      } else {
        console.error(`Error executing deathrattle via registry: ${result.error}`);
        return state;
      }
    } catch (error) {
      console.error('Error in deathrattle bridge:', error);
      return state;
    }
  } else {
    // Fall back to the original implementation
    return originalExecuteDeathrattle(state, card, playerId);
  }
}

export default executeDeathrattle;
