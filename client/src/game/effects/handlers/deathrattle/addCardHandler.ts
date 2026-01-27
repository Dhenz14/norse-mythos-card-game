/**
 * AddCard Deathrattle Handler
 * 
 * Implements the "add_card" deathrattle effect.
 * Example card: Rhonin (ID: 20808)
 */
import { GameState, CardInstance } from '../../types';
import { DeathrattleEffect } from '../../types/CardTypes';

/**
 * Execute a add_card deathrattle effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeAddCardAddCard(
  state: GameState,
  effect: DeathrattleEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing add_card deathrattle for ${sourceCard.card.name}`);
  
  // Check for required property: condition
  if (effect.condition === undefined) {
    console.warn(`AddCard effect missing condition property`);
    // Fall back to a default value or handle the missing property
  }

  // Check for required property: value
  if (effect.value === undefined) {
    console.warn(`AddCard effect missing value property`);
    // Fall back to a default value or handle the missing property
  }
  
  // TODO: Implement the add_card deathrattle effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'deathrattle',
    text: `${sourceCard.card.name} triggered add_card deathrattle`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeAddCardAddCard;
