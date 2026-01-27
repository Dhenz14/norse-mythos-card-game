/**
 * Utility functions for Spellburst mechanic
 * Spellburst is a one-time effect that triggers after you cast a spell
 */

import { CardInstance, GameState, SpellEffect } from '../types';
import { logCardDraw } from './gameLogUtils';
import { drawCard, drawMultipleCards } from './drawUtils';

/**
 * Interface to represent the spellburst effect
 */
export interface SpellburstEffect {
  type: 'damage' | 'heal' | 'buff' | 'draw' | 'summon' | 'discover';
  value?: number; // Amount of damage, healing, cards to draw, etc.
  buffAttack?: number; // Attack buff for 'buff' type
  buffHealth?: number; // Health buff for 'buff' type
  targetRequired?: boolean; // Whether this effect requires a target
  targetType?: 'friendly_minion' | 'enemy_minion' | 'any_minion' | 'enemy_hero' | 'friendly_hero' | 'any_hero' | 'any';
  consumed: boolean; // Tracks if the spellburst has been used (starts as false)
}

/**
 * Check if a card has an unused Spellburst effect
 * @param card The card to check
 * @returns True if the card has an unused Spellburst effect
 */
export function hasUnusedSpellburst(card: CardInstance): boolean {
  return card.spellburstEffect !== undefined && 
         !card.spellburstEffect.consumed && 
         !card.isSilenced;
}

/**
 * Initialize spellburst effect when a card is played
 * @param card Card instance being played
 * @param effect The spellburst effect to apply
 * @returns Updated card instance with spellburst state set
 */
export function initializeSpellburstEffect(
  card: CardInstance, 
  effect: Omit<SpellburstEffect, 'consumed'>
): CardInstance {
  return {
    ...card,
    spellburstEffect: {
      ...effect,
      consumed: false
    },
    card: {
      ...card.card,
      description: `Spellburst: ${getSpellburstDescription(effect)}. ${card.card.description}`
    }
  };
}

/**
 * Get a description of the spellburst effect for display purposes
 * @param effect The spellburst effect
 * @returns A string description of the effect
 */
function getSpellburstDescription(effect: Omit<SpellburstEffect, 'consumed'>): string {
  switch (effect.type) {
    case 'damage':
      return `Deal ${effect.value} damage${effect.targetRequired ? ' to a target' : ''}`;
    case 'heal':
      return `Restore ${effect.value} Health${effect.targetRequired ? ' to a target' : ''}`;
    case 'buff':
      return `Give ${effect.buffAttack ? `+${effect.buffAttack} Attack` : ''}${effect.buffAttack && effect.buffHealth ? ' and ' : ''}${effect.buffHealth ? `+${effect.buffHealth} Health` : ''}${effect.targetRequired ? ' to a target' : ''}`;
    case 'draw':
      return `Draw ${effect.value} card${effect.value !== 1 ? 's' : ''}`;
    case 'summon':
      return `Summon a minion`;
    case 'discover':
      return `Discover a card`;
    default:
      return 'Has a special effect';
  }
}

/**
 * Check if any minions with Spellburst should trigger after a spell is cast
 * @param state Current game state
 * @param playerType The player who cast the spell
 * @returns Updated game state after processing spellburst effects
 */
export function processSpellburst(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state
  let newState = JSON.parse(JSON.stringify(state));
  
  // Get the player's battlefield
  const battlefield = newState.players[playerType].battlefield;
  
  // Check each minion for spellburst effects
  for (let i = 0; i < battlefield.length; i++) {
    const minion = battlefield[i];
    
    // Check if the minion has an unused spellburst effect
    if (hasUnusedSpellburst(minion)) {
      // Execute the spellburst effect
      newState = executeSpellburstEffect(newState, minion, playerType);
      
      // Mark the spellburst as consumed
      battlefield[i].spellburstEffect!.consumed = true;
      
      // Update the card description to show it's been used
      const originalDesc = minion.card.description.replace(`Spellburst: ${getSpellburstDescription(minion.spellburstEffect!)}. `, '');
      battlefield[i].card.description = `(Used Spellburst) ${originalDesc}`;
      
      // Log the spellburst effect
      console.log(`Spellburst triggered for ${minion.card.name}`);
    }
  }
  
  return newState;
}

/**
 * Execute a specific spellburst effect
 * @param state Current game state
 * @param minion The minion with the spellburst effect
 * @param playerType The player who owns the minion
 * @returns Updated game state after executing the effect
 */
function executeSpellburstEffect(
  state: GameState,
  minion: CardInstance,
  playerType: 'player' | 'opponent'
): GameState {
  // If minion doesn't have a spellburst effect, return unchanged state
  if (!minion.spellburstEffect) {
    return state;
  }
  
  const effect = minion.spellburstEffect;
  
  // Handle different effect types
  switch (effect.type) {
    case 'draw':
      // Draw cards
      const drawCount = effect.value || 1;
      
      // Use drawMultipleCards to draw the specified number of cards
      return drawMultipleCards(
        {
          ...state,
          currentTurn: playerType // Make sure the correct player is drawing
        }, 
        playerType, // The player who should draw the cards
        drawCount   // Number of cards to draw
      );
      
    case 'damage':
      // Damage implementation would go here
      console.log(`Spellburst: Deal ${effect.value} damage`);
      return state;
      
    case 'heal':
      // Heal implementation would go here
      console.log(`Spellburst: Heal for ${effect.value}`);
      return state;
      
    case 'buff':
      // Buff implementation would go here
      console.log(`Spellburst: Buff with +${effect.buffAttack}/${effect.buffHealth}`);
      return state;
      
    case 'summon':
      // Summon implementation would go here
      console.log(`Spellburst: Summon a minion`);
      return state;
      
    case 'discover':
      // Discover implementation would go here
      console.log(`Spellburst: Discover a card`);
      return state;
      
    default:
      console.log(`Unknown spellburst effect type: ${(effect as any).type}`);
      return state;
  }
}

/**
 * Update the game state to process all spellbursts after a spell is cast
 * This should be called after any spell is played
 * @param state Current game state
 * @param playerType The player who cast the spell
 * @returns Updated game state
 */
export function processSpellburstAfterSpellCast(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameState {
  return processSpellburst(state, playerType);
}