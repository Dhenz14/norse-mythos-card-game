/**
 * DrawUntil Battlecry Handler
 * 
 * Implements the "draw_until" battlecry effect.
 * Example card: Wrathion (ID: 20302)
 */
import { GameState, CardInstance } from '../../types';
import { BattlecryEffect } from '../../types/CardTypes';

/**
 * Execute a draw_until battlecry effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeDrawUntilDrawUntil(
  state: GameState,
  effect: BattlecryEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing draw_until battlecry for ${sourceCard.card.name}`);
  
  // Check for required property: stopCondition
  if (effect.stopCondition === undefined) {
    console.warn(`DrawUntil effect missing stopCondition property`);
    // Fall back to a default value or handle the missing property
  }
  
  // TODO: Implement the draw_until battlecry effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'battlecry',
    text: `${sourceCard.card.name} triggered draw_until battlecry`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeDrawUntilDrawUntil;
