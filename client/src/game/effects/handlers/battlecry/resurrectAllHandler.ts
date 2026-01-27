/**
 * ResurrectAll Battlecry Handler
 * 
 * Implements the "resurrect_all" battlecry effect.
 * Example card: Card ID: 15019
 */
import { GameState, CardInstance } from '../../types';
import { BattlecryEffect } from '../../types/CardTypes';

/**
 * Execute a resurrect_all battlecry effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeResurrectAllResurrectAll(
  state: GameState,
  effect: BattlecryEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing resurrect_all battlecry for ${sourceCard.card.name}`);
  
  // Check for required property: race
  if (effect.race === undefined) {
    console.warn(`ResurrectAll effect missing race property`);
    // Fall back to a default value or handle the missing property
  }

  // Check for required property: source
  if (effect.source === undefined) {
    console.warn(`ResurrectAll effect missing source property`);
    // Fall back to a default value or handle the missing property
  }
  
  // TODO: Implement the resurrect_all battlecry effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'battlecry',
    text: `${sourceCard.card.name} triggered resurrect_all battlecry`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeResurrectAllResurrectAll;
