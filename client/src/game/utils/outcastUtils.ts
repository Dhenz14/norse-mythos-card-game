/**
 * Utility functions for Outcast mechanic
 * Outcast cards have special effects when played from the leftmost or rightmost position in your hand
 */

import { CardInstance, GameState } from '../types';

/**
 * Interface to represent the outcast effect
 */
export interface OutcastEffect {
  type: 'damage' | 'heal' | 'buff' | 'draw' | 'mana_discount' | 'discover';
  value?: number; // Amount of damage, healing, cards to draw, etc.
  buffAttack?: number; // Attack buff for 'buff' type
  buffHealth?: number; // Health buff for 'buff' type
  manaDiscount?: number; // Mana discount for 'mana_discount' type
  targetRequired?: boolean; // Whether this effect requires a target
}

/**
 * Check if a card has the Outcast keyword
 * @param card The card to check
 * @returns True if the card has the Outcast keyword and is not silenced
 */
export function hasOutcast(card: CardInstance): boolean {
  return card.outcastEffect !== undefined && !card.isSilenced;
}

/**
 * Initialize outcast effect when creating a card with outcast
 * @param card Card instance to initialize
 * @param effect The outcast effect to apply
 * @returns Updated card instance with outcast effect set
 */
export function initializeOutcastEffect(card: CardInstance, effect: OutcastEffect): CardInstance {
  return {
    ...card,
    outcastEffect: effect,
    card: {
      ...card.card,
      description: `Outcast: ${getOutcastDescription(effect)}. ${card.card.description}`
    }
  };
}

/**
 * Get a description of the outcast effect for display purposes
 * @param effect The outcast effect
 * @returns A string description of the effect
 */
function getOutcastDescription(effect: OutcastEffect): string {
  switch (effect.type) {
    case 'damage':
      return `Deal ${effect.value} damage${effect.targetRequired ? ' to a target' : ''}`;
    case 'heal':
      return `Restore ${effect.value} Health${effect.targetRequired ? ' to a target' : ''}`;
    case 'buff':
      return `Give ${effect.buffAttack ? `+${effect.buffAttack} Attack` : ''}${effect.buffAttack && effect.buffHealth ? ' and ' : ''}${effect.buffHealth ? `+${effect.buffHealth} Health` : ''}${effect.targetRequired ? ' to a target' : ''}`;
    case 'draw':
      return `Draw ${effect.value} card${effect.value !== 1 ? 's' : ''}`;
    case 'mana_discount':
      return `Costs ${effect.manaDiscount} less`;
    case 'discover':
      return 'Discover a card';
    default:
      return 'Has a special effect';
  }
}

/**
 * Check if a card is in the outcast position (leftmost or rightmost in hand)
 * @param state Current game state
 * @param cardInstanceId ID of the card to check
 * @param playerType The player who owns the card
 * @returns True if the card is in the outcast position
 */
export function isInOutcastPosition(
  state: GameState,
  cardInstanceId: string,
  playerType: 'player' | 'opponent'
): boolean {
  const hand = state.players[playerType].hand;
  
  // If hand is empty or has only one card, it's always in outcast position
  if (hand.length <= 1) {
    return true;
  }
  
  // Find the position of the card in hand
  const cardIndex = hand.findIndex(card => card.instanceId === cardInstanceId);
  
  // If card not found in hand, return false
  if (cardIndex === -1) {
    return false;
  }
  
  // Check if it's the leftmost (index 0) or rightmost (last index) position
  return cardIndex === 0 || cardIndex === hand.length - 1;
}

/**
 * Apply mana discount to the card if it has an outcast effect that reduces cost
 * This should be called whenever the hand changes to update all cards with outcast
 * @param state Current game state
 * @returns Updated game state with outcast mana discounts applied
 */
export function updateOutcastManaDiscounts(state: GameState): GameState {
  // Create a deep copy of the state
  const newState = JSON.parse(JSON.stringify(state));
  
  // Update both players' hands
  for (const playerType of ['player', 'opponent'] as const) {
    const hand = newState.players[playerType].hand;
    
    // Check each card in hand
    hand.forEach((card: CardInstance, index: number) => {
      // Check if the card has an outcast effect that's a mana discount
      if (hasOutcast(card) && card.outcastEffect?.type === 'mana_discount') {
        const isOutcast = index === 0 || index === hand.length - 1;
        
        // Store original mana cost if not already stored
        if (card.originalManaCost === undefined) {
          card.originalManaCost = card.card.manaCost;
        }
        
        // Apply or remove discount based on position
        if (isOutcast && card.outcastEffect.manaDiscount) {
          card.card.manaCost = Math.max(0, card.originalManaCost - card.outcastEffect.manaDiscount);
        } else {
          // Reset to original cost if not in outcast position
          card.card.manaCost = card.originalManaCost;
        }
      }
    });
  }
  
  return newState;
}

/**
 * Execute the outcast effect of a card
 * This should be called when a card with outcast is played from an outcast position
 * @param state Current game state
 * @param card The card with outcast being played
 * @param playerType The player playing the card
 * @param targetId Optional target ID for targeted effects
 * @param targetType Optional target type for targeted effects
 * @returns Updated game state after executing outcast effect
 */
export function executeOutcastEffect(
  state: GameState,
  card: CardInstance,
  playerType: 'player' | 'opponent',
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  // Check if card has outcast and is in outcast position
  if (!hasOutcast(card) || !isInOutcastPosition(state, card.instanceId, playerType)) {
    return state;
  }
  
  // Create a deep copy of the state
  let newState = JSON.parse(JSON.stringify(state));
  
  // Execute the effect based on type
  const effect = card.outcastEffect;
  if (!effect) return newState;
  
  switch (effect.type) {
    case 'damage':
      // Implementation for damage effect would go here
      // This would be similar to existing damage effects in spellUtils
      console.log(`Outcast effect: Deal ${effect.value} damage`);
      break;
    
    case 'heal':
      // Implementation for heal effect
      console.log(`Outcast effect: Heal for ${effect.value}`);
      break;
    
    case 'buff':
      // Implementation for buff effect
      console.log(`Outcast effect: Buff with +${effect.buffAttack}/${effect.buffHealth}`);
      break;
    
    case 'draw':
      // Implementation for draw effect
      const drawCount = effect.value || 1;
      console.log(`Outcast effect: Draw ${drawCount} cards`);
      // Would call drawCard multiple times here
      break;
    
    case 'mana_discount':
      // Mana discount is handled in updateOutcastManaDiscounts
      // No additional effect needed when played
      console.log(`Outcast effect: Mana discount already applied`);
      break;
    
    case 'discover':
      // Implementation for discover effect
      console.log(`Outcast effect: Discover a card`);
      break;
    
    default:
      console.log(`Unknown outcast effect type: ${(effect as any).type}`);
  }
  
  return newState;
}