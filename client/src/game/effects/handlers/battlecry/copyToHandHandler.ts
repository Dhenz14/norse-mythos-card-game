/**
 * CopyToHand Battlecry Handler
 * 
 * Implements the "copy_to_hand" battlecry effect.
 * Example card: Zola the Gorgon (ID: 20306)
 */
import { GameState, CardInstance } from '../../types';
import { BattlecryEffect } from '../../types/CardTypes';

/**
 * Execute a copy_to_hand battlecry effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeCopyToHandCopyToHand(
  state: GameState,
  effect: BattlecryEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing copy_to_hand battlecry for ${sourceCard.card.name}`);
  
  // Check for required property: isGolden
  if (effect.isGolden === undefined) {
    console.warn(`CopyToHand effect missing isGolden property`);
    // Fall back to a default value or handle the missing property
  }
  
  // TODO: Implement the copy_to_hand battlecry effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'battlecry',
    text: `${sourceCard.card.name} triggered copy_to_hand battlecry`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeCopyToHandCopyToHand;
