import { CardInstance, GameState, ZoneType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { shouldTriggerDeathrattle, processPendingDeathrattles } from './deathrattleUtils';
import { debug } from '../config/debugConfig';
// Use the bridge for enhanced deathrattle handling with EffectRegistry support
import { executeDeathrattle } from '../effects/handlers/deathrattleBridge';
import { logCardDraw, logCardDeath } from './gameLogUtils';
import { useAnimationStore } from '../animations/AnimationManager';
import { logActivity } from '../stores/activityLogStore';
import { processAllOnMinionDeathEffects, isNorseActive } from './norseIntegration';
import { isMinion, getHealth } from './cards/typeGuards';
import { createCardInstance } from './cards/cardUtils';

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
  const newState = structuredClone(state) as GameState;
  let movedCard: CardInstance | null = null;
  
  // Get the player object
  const player = newState.players[playerId];
  
  // Find the card in the source zone
  let sourceZone: CardInstance[] = [];
  switch (fromZone) {
    case 'deck':
      sourceZone = player.deck.map(card => createCardInstance(card));
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
      debug.error(`Unknown source zone: ${fromZone}`);
      return { newState: state, movedCard: null };
  }
  
  // Find the card in the source zone
  const cardIndex = sourceZone.findIndex(card => card.instanceId === cardId);
  if (cardIndex === -1) {
    debug.error(`Card ${cardId} not found in zone ${fromZone}`);
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
      debug.error(`Unknown destination zone: ${toZone}`);
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
  const newState = structuredClone(state) as GameState;
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
  const cardInstance = createCardInstance(cardData);
  
  if (player.hand.length >= MAX_HAND_SIZE) {
    return newState; // hand full — draw is missed, card stays in deck
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
 * CENTRALIZED function to remove all dead minions from both players' battlefields.
 * This should be called after ANY damage event to ensure dead minions are properly cleaned up.
 * 
 * Dead minions are defined as having currentHealth <= 0 (or baseHealth if currentHealth is undefined).
 * 
 * This fixes the bug where minions could remain on the battlefield with 0 or negative health,
 * causing inconsistent game state and visual glitches.
 */
export function removeDeadMinions(state: GameState): GameState {
  let newState = structuredClone(state) as GameState;
  
  // Process both players
  for (const playerId of ['player', 'opponent'] as const) {
    const battlefield = newState.players[playerId].battlefield;
    
    // Find dead minions (health <= 0)
    const deadMinions = battlefield.filter(minion => {
      const health = minion.currentHealth ?? getHealth(minion.card) ?? 0;
      return health <= 0;
    });
    
    // Process each dead minion through the proper destroyCard flow
    // This ensures deathrattles trigger and animations play
    for (const deadMinion of deadMinions) {
      debug.state(`[removeDeadMinions] Removing ${deadMinion.card.name} (health: ${deadMinion.currentHealth}) for ${playerId}`);
      newState = destroyCard(newState, deadMinion.instanceId, playerId);
    }
  }
  
  return newState;
}

/**
 * Check if any minions are dead on the battlefield (helper function)
 */
export function hasDeadMinions(state: GameState): boolean {
  for (const playerId of ['player', 'opponent'] as const) {
    for (const minion of state.players[playerId].battlefield) {
      const health = minion.currentHealth ?? getHealth(minion.card) ?? 0;
      if (health <= 0) {
        return true;
      }
    }
  }
  return false;
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
      return player.deck.map(card => createCardInstance(card));
    default:
      debug.error(`Unknown zone: ${zone}`);
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