/**
 * Utilities for handling the Magnetic mechanic in Hearthstone
 * Magnetic allows a minion to be attached to a Mech, combining their stats and effects
 */
import { CardInstance, GameState } from '../types';

/**
 * Check if a card can be magnetized to a target
 * @param card The card with Magnetic being played
 * @param target The potential target for magnetization
 * @returns Boolean indicating if magnetization is valid
 */
export function canMagnetize(card: CardInstance, target: CardInstance | null): boolean {
  // If no target, magnetization is not possible
  if (!target) {
    return false;
  }
  
  // Both cards must be minions
  if (card.card.type !== 'minion' || target.card.type !== 'minion') {
    return false;
  }
  
  // Card being played must have the magnetic keyword
  if (!card.card.keywords.includes('magnetic')) {
    return false;
  }
  
  // Target must be a Mech
  if (target.card.race !== 'mech') {
    return false;
  }
  
  // Magnetization is valid
  return true;
}

/**
 * Apply magnetization effects - combine the magnetic minion with the target mech
 * @param state Current game state
 * @param playerId ID of the player performing the magnetization
 * @param magneticCardId ID of the magnetic card being played
 * @param targetId ID of the target Mech
 * @returns Updated game state after magnetization
 */
export function applyMagnetization(
  state: GameState,
  playerId: 'player' | 'opponent',
  magneticCardId: string,
  targetId: string
): GameState {
  // Create a deep copy of the state to avoid mutation
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[playerId];
  
  // Find the target card on the battlefield
  const targetIndex = player.battlefield.findIndex(card => card.instanceId === targetId);
  if (targetIndex === -1) {
    console.error('Magnetic target not found on battlefield');
    return state;
  }
  
  // Find the magnetic card in hand
  const magneticCardIndex = player.hand.findIndex(card => card.instanceId === magneticCardId);
  if (magneticCardIndex === -1) {
    console.error('Magnetic card not found in hand');
    return state;
  }
  
  // Get references to both cards
  const magneticCard = player.hand[magneticCardIndex];
  const targetCard = player.battlefield[targetIndex];
  
  // Verify magnetization is valid
  if (!canMagnetize(magneticCard, targetCard)) {
    console.error('Invalid magnetization attempt');
    return state;
  }
  
  
  // Apply stat buffs from magnetic card to target
  const attackBonus = (magneticCard.card.attack || 0);
  const healthBonus = (magneticCard.card.health || 0);
  
  // Update both the base card stats and the current/active stats
  targetCard.card.attack = (targetCard.card.attack || 0) + attackBonus;
  targetCard.card.health = (targetCard.card.health || 0) + healthBonus;
  targetCard.currentHealth = (targetCard.currentHealth || targetCard.card.health || 0) + healthBonus;
  
  
  // Transfer keywords from magnetic card to target (excluding 'magnetic' itself)
  magneticCard.card.keywords.forEach(keyword => {
    if (keyword !== 'magnetic' && !targetCard.card.keywords.includes(keyword)) {
      targetCard.card.keywords.push(keyword);
    }
  });
  
  // If magnetic card has deathrattle, transfer it to the target
  if (magneticCard.card.deathrattle && !targetCard.card.deathrattle) {
    targetCard.card.deathrattle = { ...magneticCard.card.deathrattle };
  }
  
  // Initialize mechAttachments array if it doesn't exist
  if (!targetCard.mechAttachments) {
    targetCard.mechAttachments = [];
  }
  
  // Add the magnetic card to the mechAttachments array
  targetCard.mechAttachments.push({
    ...magneticCard,
    isAttached: true
  });
  
  
  // If magnetic card has battlecry, it is NOT transferred (as per Hearthstone rules)
  
  // Remove the magnetic card from hand after applying effects
  player.hand.splice(magneticCardIndex, 1);
  
  // Update mana spent for the player
  player.mana.current -= (magneticCard.card.manaCost || 0);
  
  // Handle pending overload for overload cards
  if (magneticCard.card.keywords.includes('overload') && magneticCard.card.overload) {
    player.mana.pendingOverload = (player.mana.pendingOverload || 0) + magneticCard.card.overload.amount;
  }
  
  return newState;
}

/**
 * Check if a mech can be a valid target for magnetization
 * @param card A potential target card
 * @returns Boolean indicating if the card is a valid magnetization target
 */
export function isValidMagneticTarget(card: CardInstance): boolean {
  return card.card.type === 'minion' && card.card.race === 'mech';
}

/**
 * Find all valid magnetic targets on the battlefield
 * @param state Current game state
 * @param playerId ID of the player controlling the magnetic minion
 * @returns Array of valid target card instances
 */
export function getValidMagneticTargets(
  state: GameState,
  playerId: 'player' | 'opponent'
): CardInstance[] {
  return state.players[playerId].battlefield.filter(isValidMagneticTarget);
}

/**
 * Handle the play of a magnetic card
 * @param state Current game state
 * @param playerId ID of the player playing the card
 * @param cardId ID of the magnetic card being played
 * @param position Position on the battlefield (null if magnetizing)
 * @param targetId ID of the target Mech (null if playing as regular minion)
 * @returns Updated game state
 */
/**
 * Initialize a card's magnetic properties when created
 * @param card Card instance to initialize
 * @returns Card instance with properly initialized magnetic properties
 */
export function initializeMagneticEffect(card: CardInstance): CardInstance {
  // Check if the card has the magnetic keyword
  if (card.card.keywords?.includes('magnetic')) {
    return {
      ...card,
      isMagnetic: true,
      isAttached: false
    };
  }
  return card;
}

export function handleMagneticCardPlay(
  state: GameState,
  playerId: 'player' | 'opponent',
  cardId: string,
  position: number | null,
  targetId: string | null
): GameState {
  // If targeting a mech, apply magnetization
  if (targetId) {
    return applyMagnetization(state, playerId, cardId, targetId);
  }
  
  // Otherwise, play the magnetic minion normally to the battlefield
  // This would use the regular minion placement logic from other utility functions
  // but we'll return the unmodified state for now
  return state;
}