/**
 * Utility functions for Corrupt mechanic
 * Corrupt cards transform when you play a higher-cost card while they're in your hand
 */

import { CardData, CardInstance, GameState } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface to represent the corrupted state of a card
 */
export interface CorruptState {
  isCorruptible: boolean;    // Whether the card can be corrupted
  isCorrupted: boolean;      // Whether the card has been corrupted
  corruptedVersion?: CardData; // The data for the corrupted version of this card
}

/**
 * Check if a card is corruptible
 * @param card The card to check
 * @returns True if the card is corruptible and not already corrupted
 */
export function isCorruptible(card: CardInstance): boolean {
  return card.corruptState?.isCorruptible === true && 
         card.corruptState?.isCorrupted === false;
}

/**
 * Check if a card is already corrupted
 * @param card The card to check
 * @returns True if the card has been corrupted
 */
export function isCorrupted(card: CardInstance): boolean {
  return card.corruptState?.isCorrupted === true;
}

/**
 * Initialize corrupt state when creating a corruptible card
 * @param card Card instance to initialize
 * @param corruptedVersion The card data for the corrupted version
 * @returns Updated card instance with corrupt state set
 */
export function initializeCorruptState(
  card: CardInstance, 
  corruptedVersion: CardData
): CardInstance {
  return {
    ...card,
    corruptState: {
      isCorruptible: true,
      isCorrupted: false,
      corruptedVersion
    },
    card: {
      ...card.card,
      description: `Corrupt: Transform when you play a higher-cost card. ${card.card.description}`
    }
  };
}

/**
 * Process corrupt mechanic when a card is played
 * Check if any corruptible cards in hand should become corrupted
 * @param state Current game state
 * @param playedCard The card that was played
 * @param playerType The player who played the card
 * @returns Updated game state with corrupted cards
 */
export function processCorruption(
  state: GameState,
  playedCard: CardInstance,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state
  const newState = JSON.parse(JSON.stringify(state));
  
  // Get the played card's mana cost
  const playedCardCost = playedCard.card.manaCost;
  
  // Get the player's hand
  const hand = newState.players[playerType].hand;
  
  // Check each card in hand for corruption
  for (let i = 0; i < hand.length; i++) {
    const card = hand[i];
    
    // Check if the card is corruptible and the played card costs more
    if (isCorruptible(card) && playedCardCost > card.card.manaCost) {
      // Corrupt the card
      const corruptedCard = createCorruptedVersion(card);
      
      // Replace the card in hand with its corrupted version
      hand[i] = corruptedCard;
      
      // Log the corruption
      console.log(`${card.card.name} was corrupted into ${corruptedCard.card.name}!`);
    }
  }
  
  return newState;
}

/**
 * Create the corrupted version of a card
 * @param card The original corruptible card
 * @returns The corrupted version of the card
 */
function createCorruptedVersion(card: CardInstance): CardInstance {
  // Check if card is corruptible and has a corrupted version defined
  if (!isCorruptible(card) || !card.corruptState?.corruptedVersion) {
    return card;
  }
  
  // Get the corrupted version data
  const corruptedVersion = card.corruptState.corruptedVersion;
  
  // Create a new card instance with the corrupted data
  return {
    ...card,
    instanceId: uuidv4(), // Generate a new unique ID
    card: corruptedVersion,
    corruptState: {
      ...card.corruptState,
      isCorrupted: true // Mark as corrupted
    }
  };
}