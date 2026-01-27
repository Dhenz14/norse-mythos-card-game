/**
 * Utility functions for Jade Golem mechanic
 * Handles summoning increasingly larger Jade Golems
 */
import { GameState, CardInstance, CardData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createGameLogEvent } from './gameLogUtils';
import { findAvailableBoardPosition } from './damageUtils';
import { jadeGolemTokens } from '../data/jadeGolemCards';

/**
 * Summon a Jade Golem for the specified player
 * @param state Current game state
 * @param playerType Player summoning the Jade Golem
 * @param sourceCardId ID of the card that initiated the Jade Golem summon
 * @returns Updated game state with the new Jade Golem
 */
export function summonJadeGolem(
  state: GameState,
  playerType: 'player' | 'opponent',
  sourceCardId: string
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Check if the battlefield is full
  const battlefield = newState.players[playerType].battlefield;
  if (battlefield.length >= 7) {
    // Log the battlefield full message
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'summon_failed' as any,
        playerType,
        `The battlefield is full! Cannot summon a Jade Golem.`,
        { cardId: sourceCardId }
      )
    );
    return newState;
  }
  
  // Get the current Jade Golem counter for this player
  const jadeCounter = newState.players[playerType].jadeGolemCounter || 0;
  
  // Increment the counter for the next summon
  newState.players[playerType].jadeGolemCounter = jadeCounter + 1;
  
  // Cap the jade golem size at 30/30
  const golemSize = Math.min(jadeCounter + 1, 30);
  
  // Get the appropriate Jade Golem token based on size
  // In a full implementation, we'd have tokens for all sizes
  // Here, we're just using a base token and adjusting its stats
  let golemToken: CardData;
  
  // Find the token card for this golem size or use the last one and adjust stats
  if (golemSize <= jadeGolemTokens.length) {
    golemToken = jadeGolemTokens.find(token => token.jadeGolemStats?.number === golemSize) || jadeGolemTokens[0];
  } else {
    golemToken = JSON.parse(JSON.stringify(jadeGolemTokens[jadeGolemTokens.length - 1]));
    golemToken.attack = golemSize;
    golemToken.health = golemSize;
    golemToken.manaCost = Math.min(golemSize, 10); // Mana cost capped at 10
    if (golemToken.jadeGolemStats) {
      golemToken.jadeGolemStats.attack = golemSize;
      golemToken.jadeGolemStats.health = golemSize;
      golemToken.jadeGolemStats.number = golemSize;
    }
  }
  
  // Create the Jade Golem card instance
  const jadeGolem: CardInstance = {
    instanceId: uuidv4(),
    card: golemToken,
    isPlayed: false,
    isSummoningSick: true, // Jade Golems have summoning sickness
    attacksPerformed: 0,
    health: golemToken.health,
    attack: golemToken.attack,
    hasAttacked: false,
    isJadeGolem: true,
    jadeGolemNumber: golemSize,
    hasTaunt: false,
    hasDivineShield: false,
    hasWindfury: false,
    isFrozen: false,
    isDead: false,
    isImmune: false
  };
  
  // Add the Jade Golem to the battlefield
  newState.players[playerType].battlefield.push(jadeGolem);
  
  // Log the summon
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'summon_jade_golem' as any,
      playerType,
      `${playerType} summons a ${golemSize}/${golemSize} Jade Golem.`,
      { cardId: golemToken.id.toString(), value: golemSize }
    )
  );
  
  return newState;
}

/**
 * Shuffle copies of a card into a player's deck (for Jade Idol)
 * @param state Current game state
 * @param playerType Player shuffling copies into their deck
 * @param cardId ID of the card to copy
 * @param copies Number of copies to shuffle
 * @returns Updated game state with copies shuffled into deck
 */
export function shuffleCopiesIntoDeck(
  state: GameState,
  playerType: 'player' | 'opponent',
  cardId: number,
  copies: number
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Find the original card data
  const originalCard = newState.cardDatabase.find(card => card.id === cardId);
  
  if (!originalCard) {
    return newState;
  }
  
  // Log the shuffle
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'shuffle_copies' as any,
      playerType,
      `${playerType} shuffles ${copies} copies of ${originalCard.name} into their deck.`,
      { cardId: cardId.toString(), value: copies }
    )
  );
  
  // Create and add copies to the deck
  for (let i = 0; i < copies; i++) {
    const cardCopy: CardInstance = {
      instanceId: uuidv4(),
      card: originalCard,
      isPlayed: false
    };
    
    // Add to a random position in the deck
    const deckPosition = Math.floor(Math.random() * (newState.players[playerType].deck.length + 1));
    newState.players[playerType].deck.splice(deckPosition, 0, cardCopy);
  }
  
  return newState;
}

/**
 * Execute the Jade Idol choose one effect
 * @param state Current game state
 * @param playerType Player using Jade Idol
 * @param option The chosen option (0 for Summon, 1 for Shuffle)
 * @param cardInstanceId The instance ID of the Jade Idol card
 * @returns Updated game state after the chosen effect
 */
export function executeJadeIdolChooseOne(
  state: GameState,
  playerType: 'player' | 'opponent',
  option: number,
  cardInstanceId: string
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Find the card in hand
  const hand = newState.players[playerType].hand;
  const cardIndex = hand.findIndex(card => card.instanceId === cardInstanceId);
  
  if (cardIndex === -1) {
    return newState;
  }
  
  // Remove the card from hand (it's spent)
  const card = hand[cardIndex];
  newState.players[playerType].hand.splice(cardIndex, 1);
  
  // Move to graveyard
  newState.players[playerType].graveyard.push(card);
  
  // Based on the selected option
  if (option === 0) {
    // Option 0: Summon a Jade Golem
    newState = summonJadeGolem(newState, playerType, card.card.id.toString());
  } else if (option === 1) {
    // Option 1: Shuffle 3 copies into the deck
    newState = shuffleCopiesIntoDeck(newState, playerType, 85001, 3);
  }
  
  return newState;
}

// Functions are already exported inline