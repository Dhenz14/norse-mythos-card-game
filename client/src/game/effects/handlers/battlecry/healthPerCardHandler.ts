/**
 * HealthPerCard Battlecry Handler
 * 
 * Implements the "health_per_card" battlecry effect.
 * Example card: Twilight Drake (ID: 30013)
 */
import { GameState, CardInstance } from '../../types';
import { BattlecryEffect } from '../../types/CardTypes';

/**
 * Execute a health_per_card battlecry effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeHealthPerCardHealthPerCard(
  state: GameState,
  effect: BattlecryEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing health_per_card battlecry for ${sourceCard.card.name}`);
  

  
  // TODO: Implement the health_per_card battlecry effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'battlecry',
    text: `${sourceCard.card.name} triggered health_per_card battlecry`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeHealthPerCardHealthPerCard;
