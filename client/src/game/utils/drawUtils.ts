import { GameState, CardData, CardInstance } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAnimationStore } from '../animations/AnimationManager';
import { logActivity } from '../stores/activityLogStore';
import { debug } from '../config/debugConfig';
import { dealDamage } from './effects/damageUtils';

const MAX_HAND_SIZE = 7;

function queueCardBurnAnimation(cardName: string, playerId: 'player' | 'opponent') {
  try {
    const addAnimation = useAnimationStore.getState().addAnimation;
    addAnimation({
      id: `card-burn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'card_burn',
      startTime: Date.now(),
      duration: 2500,
      cardName,
      playerId
    });
    
    logActivity('card_burn', playerId, `${cardName} burned - hand full!`, { cardName });
    
  } catch (error) {
    debug.error('[CardBurn] Failed to queue animation:', error);
  }
}

/**
 * Draw a card from a player's deck to their hand
 * Used for all card draw effects in the game
 * Implements 9-card hand limit like Hearthstone - if hand is full, card is burned
 */
export function drawCardFromDeck(
  state: GameState,
  playerId: 'player' | 'opponent'
): GameState {
  let newState = structuredClone(state) as GameState;
  const player = newState.players[playerId];

  if (player.deck.length === 0) {
    if (!newState.fatigueCount) {
      newState.fatigueCount = {
        player: 0,
        opponent: 0
      };
    }

    const currentFatigue = newState.fatigueCount[playerId] || 0;
    const newFatigue = currentFatigue + 1;
    newState.fatigueCount[playerId] = newFatigue;
    newState = dealDamage(newState, playerId, 'hero', newFatigue, undefined, undefined, playerId);

    return newState;
  }
  
  const cardData = player.deck[0];
  player.deck.splice(0, 1);
  
  if (player.hand.length >= MAX_HAND_SIZE) {
    return newState; // hand full — card stays in deck, draw is missed
  }
  
  const cardInstance: CardInstance = {
    instanceId: uuidv4(),
    card: cardData,
    currentHealth: 'health' in cardData ? (cardData.health || 0) : 0,
    canAttack: false,
    isPlayed: false,
    isSummoningSick: true,
    attacksPerformed: 0
  };
  
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