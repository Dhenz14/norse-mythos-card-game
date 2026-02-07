/**
 * Battlecry Bridge
 * 
 * This file bridges the gap between the existing battlecryUtils.ts and the new EffectRegistry system.
 * It wraps the existing battlecry execution logic to use the registry when appropriate.
 * 
 * Type Safety: Uses type adapters to convert between legacy types (CardData.id: string|number)
 * and effect system types (Card.id: number).
 */
import { GameState, CardInstance } from '../../types';
import { BattlecryEffect } from '../../types/CardTypes';
import { EffectRegistry } from '../EffectRegistry';
import { createGameContextFromState, adaptCardDataToCard } from '../../utils/game/types';
import { debug } from '../../config/debugConfig';

// Import the original battlecry execution function
import { executeBattlecry as originalExecuteBattlecry } from '../../utils/battlecryUtils';

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
  const player = state.players[state.currentTurn];
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
    debug.error(`Cannot find card with instanceId ${cardInstanceId}`);
    return state;
  }
  
  const cardInstance = cardInfo.card;
  
  // Check if this card type can have a battlecry (only minions have battlecry)
  // Use type narrowing to safely access the battlecry property
  const cardData = cardInstance.card;
  const battlecry = 'battlecry' in cardData ? cardData.battlecry : undefined;
  
  // If no battlecry, just return the state
  if (!battlecry) {
    return state;
  }
  
  // Check if we have a registered handler for this battlecry type
  if (EffectRegistry.hasHandler('battlecry', battlecry.type)) {
    // Use the registered handler from EffectRegistry
    try {
      // Create a GameContext from the legacy GameState using type adapters
      const gameContext = createGameContextFromState(state);
      
      // Adapt the card data to the effect system's Card type (EffectRegistry expects Card, not CardInstance)
      const adaptedCard = adaptCardDataToCard(cardInstance.card);
      
      // Execute the battlecry using the registry with properly typed parameters
      const result = EffectRegistry.executeBattlecry(
        gameContext,
        battlecry as BattlecryEffect,
        adaptedCard
      );
      
      if (result.success) {
        // EffectRegistry handlers may return updated state in additionalData
        // If additionalData is provided and looks like a GameState, use it
        // Otherwise, fall back to the original state (effect may have modified context in-place)
        // NOTE: EffectRegistry handlers typically operate on GameContext, not GameState
        // For full integration, handlers should return updated GameState in additionalData
        if (result.additionalData && typeof result.additionalData === 'object' && 'players' in result.additionalData) {
          return result.additionalData as GameState;
        }
        // If no additionalData with state structure, the effect worked but didn't modify state
        // This is expected for effects that only log or have visual effects
        debug.card(`Battlecry ${battlecry.type} executed via registry (no state changes returned)`);
        return state;
      } else {
        debug.error(`Error executing battlecry via registry: ${result.error}`);
        return state;
      }
    } catch (error) {
      debug.error('Error in battlecry bridge:', error);
      return state;
    }
  } else {
    // Fall back to the original implementation
    return originalExecuteBattlecry(state, cardInstanceId, targetId, targetType);
  }
}

export default executeBattlecry;
