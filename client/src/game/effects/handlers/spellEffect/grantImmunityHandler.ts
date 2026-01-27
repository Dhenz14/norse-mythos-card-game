/**
 * GrantImmunity SpellEffect Handler
 * 
 * Implements the "grant_immunity" spellEffect effect.
 * Example card: Card ID: 9102
 */
import { GameState, CardInstance } from '../../types';
import { SpellEffect } from '../../types/CardTypes';

/**
 * Execute a grant_immunity spellEffect effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeGrantImmunityGrantImmunity(
  state: GameState,
  effect: SpellEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing grant_immunity spellEffect for ${sourceCard.card.name}`);
  
  // Check for required property: duration
  if (effect.duration === undefined) {
    console.warn(`GrantImmunity effect missing duration property`);
    // Fall back to a default value or handle the missing property
  }
  
  // TODO: Implement the grant_immunity spellEffect effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'spellEffect',
    text: `${sourceCard.card.name} triggered grant_immunity spellEffect`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeGrantImmunityGrantImmunity;
