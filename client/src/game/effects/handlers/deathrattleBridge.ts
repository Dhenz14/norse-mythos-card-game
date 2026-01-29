/**
 * Deathrattle Bridge
 * 
 * This file bridges the gap between the existing deathrattleUtils.ts and the new EffectRegistry system.
 * It wraps the existing deathrattle execution logic to use the registry when appropriate.
 */
import { GameState, CardInstance } from '../../types';
import { DeathrattleEffect } from '../../types/CardTypes';
import { EffectRegistry } from '../EffectRegistry';

// Import the original deathrattle execution function and related utilities
import { 
  executeDeathrattle as originalExecuteDeathrattle,
  shouldTriggerDeathrattle,
  processPendingDeathrattles
} from '../../utils/deathrattleUtils';

// Re-export utilities for consumers
export { shouldTriggerDeathrattle, processPendingDeathrattles };

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
  playerId: 'player' | 'opponent'
): GameState {
  // Only minions can have deathrattles
  if (card.card.type !== 'minion') {
    console.log(`[Deathrattle Bridge] Skipped: ${card.card.name} is not a minion`);
    return state;
  }
  
  const deathrattle = (card.card as any).deathrattle;
  
  // If no deathrattle, just return the state
  if (!deathrattle) {
    console.log(`[Deathrattle Bridge] Skipped: ${card.card.name} has no deathrattle effect`);
    return state;
  }
  
  console.log(`[Deathrattle Bridge] Processing: ${card.card.name} (ID: ${card.card.id}) - Type: ${deathrattle.type}`, deathrattle);
  
  // Check if we have a registered handler for this deathrattle type
  if (EffectRegistry.hasHandler('deathrattle', deathrattle.type)) {
    console.log(`[Deathrattle Bridge] Using EffectRegistry handler for type: ${deathrattle.type}`);
    // Use the registered handler from EffectRegistry
    try {
      // Execute the deathrattle using the registry
      const result = EffectRegistry.executeDeathrattle(
        state as any, // Cast to GameContext type expected by EffectRegistry
        deathrattle as DeathrattleEffect,
        card as any // Cast to Card type expected by EffectRegistry
      );
      
      if (result.success) {
        console.log(`[Deathrattle Bridge] Success: ${card.card.name} deathrattle executed via registry`);
        return result.additionalData || state;
      } else {
        console.error(`[Deathrattle Bridge] Error: ${result.error}`);
        return state;
      }
    } catch (error) {
      console.error('[Deathrattle Bridge] Exception:', error);
      return state;
    }
  } else {
    console.log(`[Deathrattle Bridge] Using original handler for type: ${deathrattle.type}`);
    // Fall back to the original implementation
    return originalExecuteDeathrattle(state, card, playerId);
  }
}

export default executeDeathrattle;
