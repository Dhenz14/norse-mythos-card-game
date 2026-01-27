/**
 * EatOpponentCard Battlecry Handler
 * 
 * Implements the "eat_opponent_card" battlecry effect.
 * Example card: Mutanus the Devourer (ID: 20313)
 */
import { GameState, CardInstance } from '../../types';
import { BattlecryEffect } from '../../types/CardTypes';

/**
 * Execute a eat_opponent_card battlecry effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeEatOpponentCardEatOpponentCard(
  state: GameState,
  effect: BattlecryEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing eat_opponent_card battlecry for ${sourceCard.card.name}`);
  
  // Check for required property: cardType
  if (effect.cardType === undefined) {
    console.warn(`EatOpponentCard effect missing cardType property`);
    // Fall back to a default value or handle the missing property
  }

  // Check for required property: isRandom
  if (effect.isRandom === undefined) {
    console.warn(`EatOpponentCard effect missing isRandom property`);
    // Fall back to a default value or handle the missing property
  }
  
  // TODO: Implement the eat_opponent_card battlecry effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'battlecry',
    text: `${sourceCard.card.name} triggered eat_opponent_card battlecry`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeEatOpponentCardEatOpponentCard;
