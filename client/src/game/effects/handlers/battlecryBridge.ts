/**
 * Battlecry Bridge
 * 
 * This file bridges the gap between the existing battlecryUtils.ts and the new EffectRegistry system.
 * It wraps the existing battlecry execution logic to use the registry when appropriate.
 */
import { GameState, CardInstance } from '../types';
import { BattlecryEffect } from '../types/CardTypes';
import { EffectRegistry } from '../effects/EffectRegistry';

// Import the original battlecry execution function
import { executeBattlecry as originalExecuteBattlecry } from '../utils/battlecryUtils';

/**
 * Enhanced executeBattlecry that uses the EffectRegistry for missing effect types
 * 
 * @param state Current game state
 * @param cardInstanceId ID of the card with the battlecry
 * @param targetId Optional target ID
 * @param targetType Optional target type
 * @returns Updated game state
 */
export function executeBattlecry(
  state: GameState,
  cardInstanceId: string,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  // First, check if we can find the card with the battlecry
  const player = state.players[state.currentPlayerId];
  const battlefield = player.battlefield || [];
  
  // Find the card on the battlefield or in hand
  let cardInfo;
  for (let i = 0; i < battlefield.length; i++) {
    if (battlefield[i].instanceId === cardInstanceId) {
      cardInfo = { card: battlefield[i], location: 'battlefield', index: i };
      break;
    }
  }
  
  if (!cardInfo && player.hand) {
    for (let i = 0; i < player.hand.length; i++) {
      if (player.hand[i].instanceId === cardInstanceId) {
        cardInfo = { card: player.hand[i], location: 'hand', index: i };
        break;
      }
    }
  }
  
  if (!cardInfo) {
    console.error(`Cannot find card with instanceId ${cardInstanceId}`);
    return state;
  }
  
  const cardInstance = cardInfo.card;
  const battlecry = cardInstance.card.battlecry;
  
  // If no battlecry, just return the state
  if (!battlecry) {
    return state;
  }
  
  // Check if we have a registered handler for this battlecry type
  if (EffectRegistry.hasHandler('battlecry', battlecry.type)) {
    // Use the registered handler from EffectRegistry
    try {
      // Execute the battlecry using the registry
      const result = EffectRegistry.executeBattlecry(
        state as any, // Cast to GameContext type expected by EffectRegistry
        battlecry as BattlecryEffect,
        cardInstance as any // Cast to Card type expected by EffectRegistry
      );
      
      if (result.success) {
        return result.additionalData || state;
      } else {
        console.error(`Error executing battlecry via registry: ${result.error}`);
        return state;
      }
    } catch (error) {
      console.error('Error in battlecry bridge:', error);
      return state;
    }
  } else {
    // Fall back to the original implementation
    return originalExecuteBattlecry(state, cardInstanceId, targetId, targetType);
  }
}

export default executeBattlecry;
