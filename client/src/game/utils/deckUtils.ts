import { GameState, CardData, Player } from '../types';
import { useAnimationStore } from '../animations/AnimationManager';
import { logActivity } from '../stores/activityLogStore';

const MAX_HAND_SIZE = 9;

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
    console.error('[CardBurn] Failed to queue animation:', error);
  }
}

/**
 * Draw a card from player's deck and add it to their hand
 */
export function drawCard(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerType];
  
  // Check if the deck is empty (fatigue)
  if (player.deck.length === 0) {
    // Initialize fatigue counter if not exists
    if (!newState.fatigueCount) {
      newState.fatigueCount = {
        player: 0,
        opponent: 0
      };
    }
    
    // Increment fatigue counter for this player
    newState.fatigueCount[playerType] += 1;
    const fatigueDamage = newState.fatigueCount[playerType];
    
    // Apply fatigue damage
    player.health -= fatigueDamage;
    
    // Check for game over
    if (player.health <= 0) {
      newState.gamePhase = "game_over";
      newState.winner = playerType === 'player' ? 'opponent' : 'player';
    }
    
    return newState;
  }
  
  // Check if the hand is full (max 9 cards like Hearthstone)
  if (player.hand.length >= MAX_HAND_SIZE) {
    const burnedCard = player.deck[0];
    queueCardBurnAnimation(burnedCard.name, playerType);
    player.deck.shift();
    return newState;
  }
  
  // Draw the top card from the deck
  const drawnCard = player.deck.shift() as CardData;
  
  // Add the card to the player's hand
  const cardInstance = {
    instanceId: `${playerType}_card_${Date.now()}`,
    card: drawnCard,
    currentHealth: drawnCard.health || 1,
    canAttack: false,
    isPlayed: false,
    isSummoningSick: true,
    attacksPerformed: 0,
    hasDivineShield: drawnCard.keywords?.includes('divine_shield') || false
  };
  
  player.hand.push(cardInstance);
  
  return newState;
}

/**
 * Add a card to player's hand (different from drawing - can create cards not in deck)
 */
export function addCardToHand(state: GameState, playerType: 'player' | 'opponent', cardData: CardData): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerType];
  
  // Check if the hand is full (max 9 cards like Hearthstone)
  if (player.hand.length >= MAX_HAND_SIZE) {
    queueCardBurnAnimation(cardData.name, playerType);
    return newState;
  }
  
  // Add the card to the player's hand
  const cardInstance = {
    instanceId: `${playerType}_card_${Date.now()}`,
    card: cardData,
    currentHealth: cardData.health || 1,
    canAttack: false,
    isPlayed: false,
    isSummoningSick: true,
    attacksPerformed: 0,
    hasDivineShield: cardData.keywords?.includes('divine_shield') || false
  };
  
  player.hand.push(cardInstance);
  
  return newState;
}

/**
 * Add a card to player's deck
 */
export function addCardToDeck(state: GameState, playerType: 'player' | 'opponent', cardData: CardData): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerType];
  
  // Add card to the deck
  player.deck.push(cardData);
  
  return newState;
}

/**
 * Shuffle player's deck
 */
export function shuffleDeck(state: GameState, playerType: 'player' | 'opponent'): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerType];
  
  // Fisher-Yates shuffle algorithm
  for (let i = player.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
  }
  
  return newState;
}

/**
 * Draw multiple cards
 */
export function drawCards(state: GameState, playerType: 'player' | 'opponent', count: number): GameState {
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  for (let i = 0; i < count; i++) {
    newState = drawCard(newState, playerType);
  }
  
  return newState;
}