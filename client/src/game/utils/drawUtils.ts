import { GameState, CardData, CardInstance } from '../types';
import { debug } from '../config/debugConfig';
import { createCardInstance } from './cards/cardUtils';

const MAX_HAND_SIZE = 7;

/**
 * Draw a card from a player's deck to their hand
 * Used for all card draw effects in the game
 * Implements 9-card hand limit by design - if hand is full, card is burned
 */
export function drawCardFromDeck(
  state: GameState,
  playerId: 'player' | 'opponent'
): GameState {
  let newState = structuredClone(state) as GameState;
  const player = newState.players[playerId];

  if (player.deck.length === 0) {
    return newState;
  }
  
  if (player.hand.length >= MAX_HAND_SIZE) {
    return newState;
  }

  const cardData = player.deck[0];
  player.deck.splice(0, 1);

  const cardInstance = createCardInstance(cardData);

  player.hand.push(cardInstance);
  
  
  return newState;
}

/**
 * Wrapper function that draws a card for the current player
 * This is the main function that should be called for drawing cards
 */
export function drawCard(state: GameState): GameState {
  if (!state.currentTurn) {
    debug.error('Cannot draw card: No current turn specified');
    return state;
  }
  
  return drawCardFromDeck(state, state.currentTurn);
}

/**
 * Draw multiple cards for a player
 */
export function drawMultipleCards(
  state: GameState,
  playerId: 'player' | 'opponent',
  count: number
): GameState {
  let newState = { ...state };
  
  for (let i = 0; i < count; i++) {
    newState = drawCardFromDeck(newState, playerId);
  }
  
  return newState;
}

/**
 * Draw multiple cards for the current player
 */
export function drawMultipleCardsForCurrentPlayer(
  state: GameState,
  count: number
): GameState {
  if (!state.currentTurn) {
    debug.error('Cannot draw cards: No current turn specified');
    return state;
  }
  
  return drawMultipleCards(state, state.currentTurn, count);
}