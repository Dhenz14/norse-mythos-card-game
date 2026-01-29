/**
 * Utility functions for Colossal minions
 * Colossal minions are large entities that summon additional body parts when played
 * All parts are connected and have synergy. When a main colossal minion is played,
 * its additional parts are automatically summoned
 */

import { CardInstance, GameState, CardData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { findCardInstance, findCardById } from './cardUtils';

/**
 * Check if a card is a colossal minion
 * @param card The card to check
 * @returns True if the card has the colossal keyword
 */
export function isColossalMinion(card: CardInstance): boolean {
  return card.isColossal === true && !card.isSilenced;
}

/**
 * Initialize colossal effect when a card is played
 * @param card Card instance being played
 * @returns Updated card instance with colossal state set
 */
export function initializeColossalEffect(card: CardInstance): CardInstance {
  return {
    ...card,
    isColossal: true,
    colossalParts: [] // Initialize the array to track colossal parts
  };
}

/**
 * Get the array of part IDs that should be summoned when a colossal minion is played
 * In a real implementation, this would be part of the card data
 * @param colossalId The ID of the main colossal minion
 * @returns Array of card IDs for the parts
 */
export function getColossalParts(colossalId: number): number[] {
  // Map of colossal minions to their parts
  // Key: Main colossal minion ID, Value: Array of part IDs to summon
  const colossalPartsMap: Record<number, number[]> = {
    // Example: Neptulon the Tidehunter (core minion) and its hands (parts)
    3001: [3002, 3002], // Neptulon with two identical hands
    
    // Example: Giga-Fin (core minion) and its fins/tail (parts)
    3003: [3004, 3005], // Giga-Fin with a fin and tail
    
    // Example: Colossus of the Moon (core minion) and its shields (parts)
    3006: [3007, 3007, 3007], // Colossus with three identical shields
  };
  
  return colossalPartsMap[colossalId] || [];
}

/**
 * Summon colossal parts when the main minion is played
 * @param state Current game state
 * @param mainMinionId The instanceId of the main colossal minion that was played
 * @param playerType The player who played the minion
 * @returns Updated game state with parts summoned
 */
export function summonColossalParts(
  state: GameState,
  mainMinionId: string,
  playerType: 'player' | 'opponent'
): GameState {
  // Deep clone the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Find the main minion
  const playerField = newState.players[playerType].battlefield;
  const foundMinion = findCardInstance(playerField, mainMinionId);
  
  if (!foundMinion) {
    console.error(`Main colossal minion with ID ${mainMinionId} not found`);
    return newState;
  }
  
  const { card: mainMinion, index: mainMinionIndex } = foundMinion;
  
  // Get the part IDs for this colossal minion
  const partIds = getColossalParts(mainMinion.card.id);
  
  if (partIds.length === 0) {
    return newState;
  }
  
  // Check if this is a known colossal minion that should trigger special animations
  // These are hardcoded to match our 3D models
  const SPECIAL_COLOSSAL_IDS = {
    NEPTULON: 3001,      // Neptulon the Tidehunter
    GIGA_FIN: 3003,      // Giga-Fin
    COLOSSUS_MOON: 3006  // Colossus of the Moon
  };
  
  // If this is a special colossal minion with a 3D model, trigger the animation
  if (Object.values(SPECIAL_COLOSSAL_IDS).includes(mainMinion.card.id)) {
    
    // Add animation event to the game state to be processed by the Animation Manager
    // Note: In a real implementation, we might want a more robust way to trigger animations
    // but this simple approach will work for now
    if (!newState.animations) {
      newState.animations = [];
    }
    
    newState.animations.push({
      type: 'play',
      sourceId: mainMinion.card.id,
      // For center of screen animation
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      duration: 4000 // Longer duration for impressive colossal animations
    });
  }
  
  // Check if there's space on the battlefield (max 7 minions)
  const battlefieldCount = playerField.length;
  const availableSpace = 7 - battlefieldCount;
  
  // If no space, we can't summon parts
  if (availableSpace <= 0) {
    return newState;
  }
  
  // Determine how many parts we can summon based on available space
  const partsToSummon = Math.min(partIds.length, availableSpace);
  
  // References to track the summoned parts
  const summonedParts: CardInstance[] = [];
  
  // Summon each part
  for (let i = 0; i < partsToSummon; i++) {
    const partId = partIds[i];
    const partData = findCardById(partId);
    
    if (!partData) {
      console.error(`Part card with ID ${partId} not found`);
      continue;
    }
    
    // Create an instance for the part
    const partInstance: CardInstance = {
      instanceId: uuidv4(),
      card: partData,
      isPlayed: true,
      currentHealth: partData.health,
      canAttack: false,
      isSummoningSick: true,
      attacksPerformed: 0,
      isColossalPart: true, // Mark as a part of a colossal minion
      parentColossalId: mainMinionId // Reference to the main minion
    };
    
    // Add the part to the battlefield
    newState.players[playerType].battlefield.push(partInstance);
    
    // Keep a reference to this part
    summonedParts.push(partInstance);
    
    // Add to the game log
    newState.gameLog.push({
      id: uuidv4(),
      type: 'summon',
      turn: newState.turnNumber,
      timestamp: Date.now(),
      player: playerType,
      text: `${mainMinion.card.name} summons ${partData.name}!`,
      cardId: partInstance.instanceId
    });
  }
  
  // Update the main minion with references to its parts
  newState.players[playerType].battlefield[mainMinionIndex].colossalParts = summonedParts;
  
  return newState;
}

/**
 * Handle the death of a colossal minion or its part
 * Could be extended to implement special death effects when parts are killed
 * @param state Current game state
 * @param colossalId The instanceId of a colossal minion or part that died
 * @param playerType The player who controlled the minion
 * @returns Updated game state
 */
export function handleColossalMinionDeath(
  state: GameState,
  colossalId: string,
  playerType: 'player' | 'opponent'
): GameState {
  // Deep clone the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Find the minion that died
  const playerField = newState.players[playerType].battlefield;
  const foundMinion = findCardInstance(playerField, colossalId);
  
  // If not found, the minion might already be removed from battlefield
  if (!foundMinion) {
    return newState;
  }
  
  const { card: deadMinion } = foundMinion;
  
  // If it's a main colossal minion, nothing special to do
  // The parts remain independent on the board
  if (deadMinion.isColossal) {
    return newState;
  }
  
  // If it's a part, we might want to apply effects to the main minion
  // For now, we're just implementing a simple version
  if (deadMinion.isColossalPart && deadMinion.parentColossalId) {
    // Find the parent colossal minion
    const parentMinion = findCardInstance(playerField, deadMinion.parentColossalId);
    
    // If parent still exists, update its colossalParts array
    if (parentMinion) {
      const parentIndex = parentMinion.index;
      const updatedParts = newState.players[playerType].battlefield[parentIndex].colossalParts || [];
      
      // Remove the dead part reference
      const filteredParts = updatedParts.filter(part => part.instanceId !== colossalId);
      newState.players[playerType].battlefield[parentIndex].colossalParts = filteredParts;
      
      // Log that a part was destroyed
      newState.gameLog.push({
        id: uuidv4(),
        type: 'death',
        turn: newState.turnNumber,
        timestamp: Date.now(),
        player: playerType,
        text: `${deadMinion.card.name}, a part of ${parentMinion.card.card.name}, is destroyed!`,
        cardId: colossalId
      });
    }
  }
  
  return newState;
}