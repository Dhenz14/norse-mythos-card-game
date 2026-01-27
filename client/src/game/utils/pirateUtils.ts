/**
 * Utility functions for Pirate mechanics
 * Primarily handling Patches the Pirate's automatic summoning and pirate synergies
 */
import { GameState, CardInstance, CardData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createGameLogEvent } from './gameLogUtils';
import { checkAndTriggerDeathEvents } from './damageUtils';

/**
 * Check if Patches the Pirate should be summoned after playing a pirate
 * @param state Current game state
 * @param playerType Player who played the pirate
 * @param pirateCard The pirate card that was played
 * @returns Updated game state after checking for Patches
 */
export function checkForPatchesSummon(
  state: GameState,
  playerType: 'player' | 'opponent',
  pirateCard: CardData
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Only proceed if another pirate was played (not Patches himself)
  if (pirateCard.tribe !== 'pirate' || pirateCard.id === 80001) {
    return newState;
  }
  
  // Search for Patches in the player's deck
  const playerDeck = newState.players[playerType].deck;
  const patchesIndex = playerDeck.findIndex(
    (card: CardInstance) => card.card.id === 80001 && card.card.isPatches
  );
  
  // If Patches is not in the deck, return unchanged state
  if (patchesIndex === -1) {
    return newState;
  }
  
  // Get Patches from the deck
  const patches = playerDeck[patchesIndex];
  
  // Log the effect trigger
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'effect_trigger' as any,
      playerType,
      `${playerType} played a Pirate, summoning Patches the Pirate from their deck!`,
      { cardId: '80001' }
    )
  );
  
  // Remove Patches from deck
  newState.players[playerType].deck.splice(patchesIndex, 1);
  
  // Check if the battlefield is full
  const battlefield = newState.players[playerType].battlefield;
  if (battlefield.length >= 7) {
    // Log that the battlefield is full
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'summon_failed' as any,
        playerType,
        `The battlefield is full! Patches the Pirate cannot be summoned.`,
        { cardId: '80001' }
      )
    );
    return newState;
  }
  
  // Create a summoned version of Patches
  const summonedPatches: CardInstance = {
    ...patches,
    instanceId: uuidv4(),
    isPlayed: false,
    isSummoningSick: false, // Patches has Charge, so no summoning sickness
    attacksPerformed: 0,
    hasCharge: true
  };
  
  // Add Patches to the battlefield
  newState.players[playerType].battlefield.push(summonedPatches);
  
  // Log the summon
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'minion_summoned' as any,
      playerType,
      `Patches the Pirate is summoned to ${playerType}'s side of the battlefield!`,
      { cardId: '80001' }
    )
  );
  
  return newState;
}

/**
 * Apply pirate aura effects (e.g., Southsea Captain)
 * @param state Current game state
 * @returns Updated game state with aura effects applied
 */
export function applyPirateAuraEffects(state: GameState): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Process for both players
  ['player', 'opponent'].forEach((playerType: 'player' | 'opponent') => {
    const battlefield = newState.players[playerType].battlefield;
    
    // Find all Southsea Captains on the battlefield
    const captains = battlefield.filter(
      (card: CardInstance) => card.card.id === 80002 && !card.isSilenced
    );
    
    // If no captains, skip aura application
    if (captains.length === 0) {
      return;
    }
    
    // Apply auras to all other pirates
    battlefield.forEach((minion: CardInstance) => {
      if (minion.card.tribe === 'pirate' && minion.card.id !== 80002) {
        // Reset to base stats first to avoid stacking auras incorrectly
        if (!minion.auraBuffs) {
          minion.auraBuffs = { attack: 0, health: 0 };
        } else {
          minion.auraBuffs.attack = 0;
          minion.auraBuffs.health = 0;
        }
        
        // Apply +1/+1 for each captain
        minion.auraBuffs.attack += captains.length;
        minion.auraBuffs.health += captains.length;
        
        // Ensure the current health is properly updated based on max health
        if (minion.healthAdjustment === undefined) {
          minion.healthAdjustment = 0;
        }
        
        // Calculate new maximum health with auras
        const newMaxHealth = minion.card.health + minion.auraBuffs.health + (minion.buffs?.health || 0);
        
        // If current health adjustment needs updating
        if (minion.health > newMaxHealth) {
          minion.healthAdjustment = newMaxHealth - minion.card.health - (minion.buffs?.health || 0);
        }
      }
    });
  });
  
  return newState;
}

/**
 * Process Bloodsail Raider's battlecry (gain attack equal to weapon)
 * @param state Current game state
 * @param playerType Player who played Bloodsail Raider
 * @param cardInstanceId The instance ID of the Bloodsail Raider card
 * @returns Updated game state after the battlecry
 */
export function executeBloodsailRaiderBattlecry(
  state: GameState,
  playerType: 'player' | 'opponent',
  cardInstanceId: string
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Check if player has a weapon
  const playerWeapon = newState.players[playerType].weapon;
  if (!playerWeapon) {
    // Log that there's no weapon
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'battlecry_fail' as any,
        playerType,
        `Bloodsail Raider's battlecry finds no weapon to gain Attack from.`,
        { cardId: '80003' }
      )
    );
    return newState;
  }
  
  // Find the Bloodsail Raider on the battlefield
  const battlefield = newState.players[playerType].battlefield;
  const raiderIndex = battlefield.findIndex(
    (card: CardInstance) => card.instanceId === cardInstanceId
  );
  
  if (raiderIndex === -1) {
    return newState;
  }
  
  const raider = battlefield[raiderIndex];
  const weaponAttack = playerWeapon.attack;
  
  // Apply the buff
  if (!raider.buffs) {
    raider.buffs = { attack: weaponAttack, health: 0 };
  } else {
    raider.buffs.attack += weaponAttack;
  }
  
  // Log the buff
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'battlecry_success' as any,
      playerType,
      `Bloodsail Raider gains +${weaponAttack} Attack from ${playerType}'s weapon.`,
      { cardId: '80003', value: weaponAttack }
    )
  );
  
  return newState;
}

/**
 * Process Bloodsail Corsair's battlecry (remove 1 durability from opponent's weapon)
 * @param state Current game state
 * @param playerType Player who played Bloodsail Corsair
 * @returns Updated game state after the battlecry
 */
export function executeBloodsailCorsairBattlecry(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Determine opponent
  const opponentType = playerType === 'player' ? 'opponent' : 'player';
  
  // Check if opponent has a weapon
  const opponentWeapon = newState.players[opponentType].weapon;
  if (!opponentWeapon) {
    // Log that there's no weapon
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'battlecry_fail' as any,
        playerType,
        `Bloodsail Corsair's battlecry finds no opponent weapon to damage.`,
        { cardId: '80004' }
      )
    );
    return newState;
  }
  
  // Reduce durability
  opponentWeapon.durability -= 1;
  
  // Log the effect
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'battlecry_success' as any,
      playerType,
      `Bloodsail Corsair removes 1 Durability from ${opponentType}'s weapon.`,
      { cardId: '80004' }
    )
  );
  
  // Check if weapon is destroyed
  if (opponentWeapon.durability <= 0) {
    // Log the weapon destruction
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'weapon_destroyed' as any,
        opponentType,
        `${opponentType}'s ${opponentWeapon.card.name} is destroyed.`,
        { cardId: opponentWeapon.card.id.toString() }
      )
    );
    
    // Remove the weapon
    newState.players[opponentType].weapon = null;
    
    // Add the weapon to the graveyard
    newState.players[opponentType].graveyard.push(opponentWeapon);
  }
  
  return newState;
}

// Functions are already exported inline