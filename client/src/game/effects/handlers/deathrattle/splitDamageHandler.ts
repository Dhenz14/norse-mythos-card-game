/**
 * SplitDamage Deathrattle Handler
 * 
 * Implements the "split_damage" deathrattle effect.
 * Example card: Augmented Porcupine (ID: 30050)
 */
import { GameState, CardInstance } from '../../types';
import { DeathrattleEffect } from '../../types/CardTypes';

/**
 * Execute a split_damage deathrattle effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeSplitDamageSplitDamage(
  state: GameState,
  effect: DeathrattleEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing split_damage deathrattle for ${sourceCard.card.name}`);
  

  
  // TODO: Implement the split_damage deathrattle effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'deathrattle',
    text: `${sourceCard.card.name} triggered split_damage deathrattle`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeSplitDamageSplitDamage;
