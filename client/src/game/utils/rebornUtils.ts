/**
 * Utility functions for Reborn mechanic
 * Reborn minions return to the battlefield with 1 health after they die
 */

import { CardInstance, GameState } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logSummon } from './gameLogUtils';

/**
 * Check if a card has the Reborn keyword
 * @param card The card to check
 * @returns True if the card has the Reborn keyword and hasn't been reborn yet
 */
export function hasReborn(card: CardInstance): boolean {
  // Check if the card has the reborn keyword, hasn't been reborn yet, and is not silenced
  return card.hasReborn === true && !card.wasReborn && !card.isSilenced;
}

/**
 * Initialize reborn effect when a card is played
 * @param card Card instance being played
 * @returns Updated card instance with reborn state set
 */
export function initializeRebornEffect(card: CardInstance): CardInstance {
  return {
    ...card,
    hasReborn: true,
    wasReborn: false
  };
}

/**
 * Execute the reborn effect when a minion with Reborn dies
 * Summons a copy of the minion with 1 health
 * @param state Current game state
 * @param deadCard The card with Reborn that died
 * @param playerType The player who owns the card
 * @returns Updated game state with the reborn minion
 */
export function executeRebornEffect(
  state: GameState,
  deadCard: CardInstance,
  playerType: 'player' | 'opponent'
): GameState {
  // If the card doesn't have Reborn or has already been reborn, do nothing
  if (!hasReborn(deadCard)) {
    return state;
  }
  
  // Create a deep copy of the state to avoid mutation
  const newState = JSON.parse(JSON.stringify(state));
  
  // Get the player's battlefield
  const battlefield = newState.players[playerType].battlefield;
  
  // Check if there's room on the battlefield (max 7 minions)
  if (battlefield.length >= 7) {
    // No room for the reborn minion
    console.log(`No room for ${deadCard.card.name} to be reborn.`);
    return newState;
  }
  
  // Create a reborn version of the minion
  const rebornMinion: CardInstance = {
    ...deadCard,
    instanceId: uuidv4(), // Generate a new unique ID
    currentHealth: 1, // Reborn minions have 1 health
    wasReborn: true, // Mark that this minion has been reborn
    // Reset combat status
    canAttack: false,
    isSummoningSick: true,
    attacksPerformed: 0,
    isPlayed: true,
    // Update description to indicate this is a reborn version
    card: {
      ...deadCard.card,
      description: `${deadCard.card.description} (Reborn)`
    }
  };
  
  // Add the reborn minion to the battlefield
  battlefield.push(rebornMinion);
  
  // Log the summon event
  return logSummon(
    newState,
    playerType, 
    rebornMinion
  );
}

/**
 * Process card death with Reborn check
 * This should be called whenever a card dies to check if the Reborn effect should trigger
 * @param state Current game state
 * @param deadCardId ID of the card that died
 * @param playerType The player who owns the card
 * @returns Updated game state after processing reborn
 */
export function processRebornOnDeath(
  state: GameState,
  deadCardId: string,
  playerType: 'player' | 'opponent'
): GameState {
  // Find the card that died
  const deadCard = state.players[playerType].graveyard?.find(
    card => card.instanceId === deadCardId
  );
  
  // If the card isn't found or isn't a minion (e.g., it's a spell), do nothing
  if (!deadCard) {
    return state;
  }
  
  // Check if the card has the Reborn keyword and process the effect
  if (hasReborn(deadCard)) {
    return executeRebornEffect(state, deadCard, playerType);
  }
  
  // If the card doesn't have Reborn, return the unchanged state
  return state;
}