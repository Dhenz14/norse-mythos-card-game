/**
 * Utility functions for Rush mechanic
 * Rush allows a minion to attack other minions (but not heroes) immediately after being played
 */

import { CardInstance, GameState } from '../types';

/**
 * Check if a card has the rush keyword
 * @param card The card to check
 * @returns True if the card has the rush keyword and is not silenced
 */
export function hasRush(card: CardInstance): boolean {
  // Check if the card has the rush keyword in its definition and is not silenced
  const hasRushKeyword = card.card.keywords.includes('rush');
  const hasRushProperty = card.isRush === true || card.hasRush === true;
  
  console.log(`hasRush check for ${card.card.name}:`);
  console.log(`- Rush keyword: ${hasRushKeyword}`);
  console.log(`- Rush property: ${hasRushProperty}`);
  console.log(`- Silenced: ${card.isSilenced}`);
  
  // Either the card must have the rush keyword or rush property set
  return (hasRushKeyword || hasRushProperty) && !card.isSilenced;
}

/**
 * Initialize rush effect when a card is played
 * This sets the card to be able to attack minions immediately, but not heroes
 * @param card Card instance being played
 * @returns Updated card instance with rush state set
 */
export function initializeRushEffect(card: CardInstance): CardInstance {
  return {
    ...card,
    isRush: true,
    hasRush: true,
    isSummoningSick: false, // Not summoning sick but can only attack minions
    canAttack: true // Can attack minions immediately
  };
}

/**
 * Check if a target is valid for a minion with Rush on its first turn
 * Rush minions can only attack other minions on their first turn, not heroes
 * @param attackerCard The attacking card with rush
 * @param targetType The type of target ('minion' or 'hero')
 * @returns True if the target is valid for the rush minion to attack
 */
export function isValidRushTarget(attackerCard: CardInstance, targetType: 'minion' | 'hero'): boolean {
  // Debug logging
  console.log(`isValidRushTarget check for ${attackerCard.card.name}:`);
  console.log(`- hasRush(card): ${hasRush(attackerCard)}`);
  console.log(`- isRush property: ${attackerCard.isRush}`);
  console.log(`- hasRush property: ${attackerCard.hasRush}`);
  console.log(`- targetType: ${targetType}`);
  console.log(`- Rush keyword from card data: ${attackerCard.card.keywords.includes('rush')}`);
  
  // For minion targets, always allow the attack (Rush minions CAN attack other minions)
  if (targetType === 'minion') {
    console.log(`Rush minion ${attackerCard.card.name} CAN attack another minion`);
    return true;
  }
  
  // For hero targets, check if the minion has Rush and is still on its first turn (isRush or hasRush is true)
  const isRushCardOnFirstTurn = hasRush(attackerCard) && (attackerCard.isRush === true || attackerCard.hasRush === true);
  
  if (isRushCardOnFirstTurn && targetType === 'hero') {
    console.log(`Rush minion ${attackerCard.card.name} cannot attack hero on the first turn it's played!`);
    return false;
  }
  
  // If it's not a Rush minion or it's a Rush minion that's been on the field for more than a turn,
  // it's allowed to attack heroes
  console.log(`Target validation passed for ${attackerCard.card.name} targeting ${targetType}`);
  return true;
}

/**
 * Process end of turn for rush minions
 * After a rush minion survives its first turn, it becomes a normal minion that can attack heroes
 * @param state Current game state
 * @returns Updated game state with rush status updated
 */
export function processRushAtTurnEnd(state: GameState): GameState {
  // Create a deep copy of the state
  let newState = JSON.parse(JSON.stringify(state));
  
  // Process rush minions for the current player
  const currentPlayer = state.currentTurn;
  const battlefield = newState.players[currentPlayer].battlefield;
  
  // Update rush minions that have been on the field for a turn
  // They can now attack heroes as well as minions
  battlefield.forEach((minion: CardInstance) => {
    if (minion.isRush === true || minion.hasRush === true) {
      // After a turn, rush minions become normal minions (can attack heroes)
      minion.isRush = false;
      minion.hasRush = false;
      
      // Log for debugging
      console.log(`Rush restriction removed from ${minion.card.name} at end of turn. Can now attack heroes.`);
    }
  });
  
  return newState;
}