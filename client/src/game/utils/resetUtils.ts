/**
 * resetUtils.ts
 * 
 * Utility functions for resetting game state components at the start of a turn
 */

import { GameState } from '../types';

/**
 * Resets all minions' attack state at the start of a player's turn
 * - Clears summoning sickness for minions that have been on the field
 * - Resets attack counter
 * - Sets canAttack to true for all minions that aren't frozen
 */
export function resetMinionsForTurn(state: GameState): GameState {
  const currentPlayer = state.currentTurn;
  const newState = { ...state };
  
  // Get player object based on whose turn it is
  const player = newState.players[currentPlayer];
  
  console.log(`[RESET DEBUG] Resetting minions for ${currentPlayer}'s turn`);
  console.log(`[RESET DEBUG] Battlefield before reset:`, player.battlefield);
  
  // Update each minion on the battlefield
  player.battlefield = player.battlefield.map(minion => {
    // Create updated minion
    const updatedMinion = {
      ...minion,
      // Clear summoning sickness for minions that have been on the field for a turn
      isSummoningSick: minion.isPlayed ? false : minion.isSummoningSick,
      // Reset attacks performed counter
      attacksPerformed: 0,
      // Enable attacking for all non-frozen minions
      canAttack: !minion.isFrozen
    };
    
    // Log each minion's state change
    console.log(`[RESET DEBUG] Minion reset - ${minion.card.name}:`, {
      before: {
        isSummoningSick: minion.isSummoningSick,
        attacksPerformed: minion.attacksPerformed || 0,
        canAttack: minion.canAttack,
        isFrozen: minion.isFrozen
      },
      after: {
        isSummoningSick: updatedMinion.isSummoningSick,
        attacksPerformed: updatedMinion.attacksPerformed,
        canAttack: updatedMinion.canAttack,
        isFrozen: updatedMinion.isFrozen
      }
    });
    
    return updatedMinion;
  });
  
  console.log(`[RESET DEBUG] Battlefield after reset:`, player.battlefield);
  
  return newState;
}

/**
 * Applies overload mana penalties from the previous turn
 */
export function applyOverload(state: GameState): GameState {
  const currentPlayer = state.currentTurn;
  const newState = { ...state };
  
  // Get player object
  const player = newState.players[currentPlayer];
  
  // Apply pending overload to current overload
  player.mana.overloaded = player.mana.pendingOverload || 0;
  player.mana.pendingOverload = 0;
  
  // Ensure mana.current reflects the overload penalty
  player.mana.current = Math.max(0, player.mana.max - player.mana.overloaded);
  
  return newState;
}

/**
 * Performs all necessary resets at the start of a turn
 */
export function performTurnStartResets(state: GameState): GameState {
  let newState = { ...state };
  
  // Apply overload penalties
  newState = applyOverload(newState);
  
  // Reset minion states
  newState = resetMinionsForTurn(newState);
  
  // Reset card played counter
  newState.players[newState.currentTurn].cardsPlayedThisTurn = 0;
  
  // Reset hero power usage
  newState.players[newState.currentTurn].heroPower.used = false;
  
  return newState;
}