/**
 * Hand utility functions
 */
import { GameState, CardData } from '../types';

/**
 * Adds a card to the player's hand
 * @param state Current game state
 * @param playerType Player to add the card to
 * @param card Card to add
 * @returns Updated game state
 */
export function addCardToHand(
  state: GameState,
  playerType: 'player' | 'opponent',
  card: CardData
): GameState {
  const newState = JSON.parse(JSON.stringify(state));
  
  // Generate unique instance ID
  const instanceId = `card_${card.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Add card to hand
  newState.players[playerType].hand.push({
    instanceId,
    card,
    isPlayed: false,
    zone: 'hand',
    turnDrawn: state.turnNumber
  });
  
  return newState;
}