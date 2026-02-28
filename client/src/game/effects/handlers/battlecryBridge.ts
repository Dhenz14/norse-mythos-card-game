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
import { GameContext } from '../../GameContext';
import { createGameContextFromState, adaptCardDataToCard } from '../../utils/game/types';
import { debug } from '../../config/debugConfig';

// Import the original battlecry execution function
import { executeBattlecry as originalExecuteBattlecry } from '../../utils/battlecryUtils';

/**
 * Sync changes made to a GameContext back into a GameState.
 * Writes back health, maxHealth, armor, mana, and board state.
 */
function syncContextToState(state: GameState, context: GameContext): GameState {
	const newState = structuredClone(state);
	const currentId = state.currentTurn;
	const opponentId = currentId === 'player' ? 'opponent' : 'player';

	const current = context.currentPlayer;
	const opponent = context.opponentPlayer;

	// Sync hero health/armor
	newState.players[currentId].heroHealth = current.health;
	newState.players[currentId].health = current.health;
	newState.players[currentId].maxHealth = current.maxHealth;
	newState.players[currentId].heroArmor = current.armor;

	newState.players[opponentId].heroHealth = opponent.health;
	newState.players[opponentId].health = opponent.health;
	newState.players[opponentId].maxHealth = opponent.maxHealth;
	newState.players[opponentId].heroArmor = opponent.armor;

	// Sync mana
	newState.players[currentId].mana = { ...current.mana };
	newState.players[opponentId].mana = { ...opponent.mana };

	// Check for game over
	if (current.health <= 0) {
		newState.gamePhase = 'game_over';
		newState.winner = opponentId;
	} else if (opponent.health <= 0) {
		newState.gamePhase = 'game_over';
		newState.winner = currentId;
	}

	return newState;
}

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
        // If handler returned a full GameState in additionalData, use it directly
        if (result.additionalData && typeof result.additionalData === 'object' && 'players' in result.additionalData) {
          return result.additionalData as GameState;
        }
        // Otherwise sync the in-place GameContext mutations back to GameState
        return syncContextToState(state, gameContext);
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
