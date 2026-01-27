/**
 * GrantPersistentEffect Battlecry Handler
 * 
 * Implements the "grant_persistent_effect" battlecry effect.
 * Example card: Card ID: 16020
 */
import { GameState, CardInstance } from '../../types';
import { BattlecryEffect } from '../../types/CardTypes';

/**
 * Execute a grant_persistent_effect battlecry effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeGrantPersistentEffectGrantPersistentEffect(
  state: GameState,
  effect: BattlecryEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing grant_persistent_effect battlecry for ${sourceCard.card.name}`);
  
  // Check for required property: effect
  if (effect.effect === undefined) {
    console.warn(`GrantPersistentEffect effect missing effect property`);
    // Fall back to a default value or handle the missing property
  }

  // Check for required property: permanent
  if (effect.permanent === undefined) {
    console.warn(`GrantPersistentEffect effect missing permanent property`);
    // Fall back to a default value or handle the missing property
  }
  
  // TODO: Implement the grant_persistent_effect battlecry effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'battlecry',
    text: `${sourceCard.card.name} triggered grant_persistent_effect battlecry`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeGrantPersistentEffectGrantPersistentEffect;
