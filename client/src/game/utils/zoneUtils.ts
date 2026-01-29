import { CardInstance, GameState, ZoneType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { shouldTriggerDeathrattle, processPendingDeathrattles } from './deathrattleUtils';
// Use the bridge for enhanced deathrattle handling with EffectRegistry support
import { executeDeathrattle } from '../effects/handlers/deathrattleBridge';
import { logCardDraw, logCardDeath } from './gameLogUtils';
import { useAnimationStore } from '../animations/AnimationManager';
import { logActivity } from '../stores/activityLogStore';
import { processAllOnMinionDeathEffects, isNorseActive } from './norseIntegration';

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
 * Moves a card from one zone to another
 * Returns the updated state and the moved card instance
 */
export function moveCard(
  state: GameState,
  cardId: string,
  fromZone: ZoneType,
  toZone: ZoneType,
  playerId: 'player' | 'opponent'
): { newState: GameState; movedCard: CardInstance | null } {
  // Create a deep copy of the state to avoid mutation
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  let movedCard: CardInstance | null = null;
  
  // Get the player object
  const player = newState.players[playerId];
  
  // Find the card in the source zone
  let sourceZone: CardInstance[] = [];
  switch (fromZone) {
    case 'deck':
      sourceZone = player.deck.map(card => ({
        instanceId: uuidv4(),
        card: card,
        currentHealth: card.health,
        canAttack: false,
        isPlayed: false,
        isSummoningSick: true,
        attacksPerformed: 0
      }));
      break;
    case 'hand':
      sourceZone = player.hand;
      break;
    case 'battlefield':
      sourceZone = player.battlefield;
      break;
    case 'graveyard':
      sourceZone = player.graveyard || [];
      break;
    default:
      console.error(`Unknown source zone: ${fromZone}`);
      return { newState: state, movedCard: null };
  }
  
  // Find the card in the source zone
  const cardIndex = sourceZone.findIndex(card => card.instanceId === cardId);
  if (cardIndex === -1) {
    console.error(`Card ${cardId} not found in zone ${fromZone}`);
    return { newState: state, movedCard: null };
  }
  
  // Remove the card from the source zone
  movedCard = sourceZone[cardIndex];
  sourceZone.splice(cardIndex, 1);
  
  // Update the source zone in the state
  switch (fromZone) {
    case 'deck':
      // For deck, we've already created instances, so we need to remove from the actual deck
      player.deck.splice(cardIndex, 1);
      break;
    case 'hand':
      player.hand = sourceZone;
      break;
    case 'battlefield':
      player.battlefield = sourceZone;
      break;
    case 'graveyard':
      player.graveyard = sourceZone;
      break;
  }
  
  // If the card wasn't found, return the original state
  if (!movedCard) {
    return { newState: state, movedCard: null };
  }
  
  // Add the card to the destination zone
  switch (toZone) {
    case 'hand':
      // When adding to hand, make sure it's not marked as played
      movedCard.isPlayed = false;
      player.hand.push(movedCard);
      break;
    case 'battlefield':
      // When adding to battlefield, mark it as played and update summoning sickness
      movedCard.isPlayed = true;
      
      // Check for both Charge and Rush keywords (safely handle undefined keywords)
      const keywords = movedCard.card.keywords || [];
      const hasCharge = keywords.includes('charge');
      const hasRush = keywords.includes('rush');
      const canAttackImmediately = hasCharge || hasRush;
      
      if (!canAttackImmediately) {
        // Regular minions have summoning sickness and can't attack
        movedCard.isSummoningSick = true;
        movedCard.canAttack = false;
      } else {
        // Charge/Rush minions can attack immediately
        movedCard.isSummoningSick = false;
        movedCard.canAttack = true;
        
        // Make sure to set the correct properties for rush minions
        if (hasRush) {
          movedCard.hasRush = true;
          movedCard.isRush = true;
        }
      }
      
      player.battlefield.push(movedCard);
      break;
    case 'graveyard':
      // When adding to graveyard, just store the card as-is
      if (!player.graveyard) {
        player.graveyard = [];
      }
      player.graveyard.push(movedCard);
      break;
    case 'deck':
      // Returning a card to the deck is rare (shuffle effects)
      player.deck.push(movedCard.card);
      break;
    default:
      console.error(`Unknown destination zone: ${toZone}`);
      return { newState: state, movedCard: null };
  }
  
  return { newState, movedCard };
}

/**
 * Draws a card from the deck to the hand
 */
export function drawCardFromDeck(
  state: GameState,
  playerId: 'player' | 'opponent'
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerId];
  
  // Check if there are cards left in the deck
  if (player.deck.length === 0) {
    // In real Hearthstone, taking fatigue damage would happen here
    return newState;
  }
  
  // Get the top card from the deck
  const cardData = player.deck[0];
  
  // Remove the card from the deck
  player.deck.splice(0, 1);
  
  // Create a card instance for the hand
  const cardInstance: CardInstance = {
    instanceId: uuidv4(),
    card: cardData,
    currentHealth: cardData.health,
    canAttack: false,
    isPlayed: false,
    isSummoningSick: true,
    attacksPerformed: 0
  };
  
  // Check if hand is already at max capacity (9 cards like Hearthstone)
  if (player.hand.length >= MAX_HAND_SIZE) {
    // Card is burned (discarded) when hand is full - trigger animation and log
    queueCardBurnAnimation(cardData.name, playerId);
    
    // Add to graveyard instead of hand
    if (!player.graveyard) {
      player.graveyard = [];
    }
    player.graveyard.push(cardInstance);
    
    // Add to game log - card was drawn but burned
    const updatedState = logCardDraw(
      newState,
      playerId,
      cardInstance.instanceId,
      true, // burned flag
      false // not fatigue
    );
    
    return updatedState;
  }
  
  // Add the card to the hand if there's room
  player.hand.push(cardInstance);
  
  
  // Add to game log
  const updatedState = logCardDraw(
    newState,
    playerId,
    cardInstance.instanceId
  );
  
  return updatedState;
}

/**
 * Sends a card from the battlefield to the graveyard (when destroyed)
 * 
 * This now includes triggering death animations and a slight delay to make 
 * deaths more dramatic and visible during combat.
 */
export function destroyCard(
  state: GameState,
  cardId: string,
  playerId: 'player' | 'opponent'
): GameState {
  // First, get the card that's going to be destroyed to check for deathrattle
  const player = state.players[playerId];
  const cardToDestroy = player.battlefield.find(card => card.instanceId === cardId);
  
  // Before removing the card, trigger death animation if available and we have the card
  if (cardToDestroy && state.animationSystem) {
    // Flag the card as dying but don't remove it yet
    // This will make it visually distinct during the death animation
    cardToDestroy.isDying = true;
    
    // Dispatch death animation if we have the animation system available
    try {
      // Enhanced death animation with card information
      if (typeof state.animationSystem.triggerMinionDeath === 'function') {
        state.animationSystem.triggerMinionDeath(cardToDestroy);
      }
      
      // Legacy animation system
      if (typeof state.animationSystem.addAnimation === 'function' && cardToDestroy.animationPosition) {
        state.animationSystem.addAnimation({
          id: `death-${cardId}-${Date.now()}`,
          type: 'enhanced_death',
          position: cardToDestroy.animationPosition,
          card: cardToDestroy.card,
          startTime: Date.now(),
          duration: 4000 // 4 seconds for more dramatic slow-motion effect
        });
      }
    } catch (error) {
      console.error('Error triggering death animation:', error);
    }
    
    // For non-browser environments or tests, we need to continue without animation
    if (typeof window === 'undefined') {
    }
  }
  
  // Move the card to the graveyard
  const result = moveCard(state, cardId, 'battlefield', 'graveyard', playerId);
  let newState = result.newState;
  
  if (result.movedCard) {
    
    // Add to game log
    newState = logCardDeath(newState, playerId, result.movedCard);
    
    // Check if the card has a deathrattle effect and trigger it
    if (cardToDestroy && shouldTriggerDeathrattle(cardToDestroy)) {
      newState = executeDeathrattle(newState, cardToDestroy, playerId);
    }
    
    // Trigger Norse on-minion-death passives (King and Hero passives)
    if (isNorseActive()) {
      newState = processAllOnMinionDeathEffects(newState, playerId, cardId);
    }
    
    // Process any pending deathrattles that were queued (from AOE damage deaths, etc.)
    newState = processPendingDeathrattles(newState);
  }
  
  return newState;
}

/**
 * Gets all cards in a specific zone
 */
export function getCardsInZone(
  state: GameState,
  zone: ZoneType,
  playerId: 'player' | 'opponent'
): CardInstance[] {
  const player = state.players[playerId];
  
  switch (zone) {
    case 'hand':
      return player.hand;
    case 'battlefield':
      return player.battlefield;
    case 'graveyard':
      return player.graveyard || [];
    case 'deck':
      // For deck, we have to create instances on the fly since deck stores CardData
      return player.deck.map(card => ({
        instanceId: uuidv4(), // Temporary ID for the purpose of display
        card,
        currentHealth: card.health,
        canAttack: false,
        isPlayed: false,
        isSummoningSick: true,
        attacksPerformed: 0
      }));
    default:
      console.error(`Unknown zone: ${zone}`);
      return [];
  }
}

/**
 * Return all cards that died this game (in graveyard)
 */
export function getDeadCards(
  state: GameState,
  playerId: 'player' | 'opponent'
): CardInstance[] {
  const player = state.players[playerId];
  return player.graveyard || [];
}