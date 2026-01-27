/**
 * NextSpellCostsHealth SpellEffect Handler
 * 
 * Implements the "next_spell_costs_health" spellEffect effect.
 * Example card: Card ID: 15020
 */
import { GameState, CardInstance } from '../../types';
import { SpellEffect } from '../../types/CardTypes';

/**
 * Execute a next_spell_costs_health spellEffect effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeNextSpellCostsHealthNextSpellCostsHealth(
  state: GameState,
  effect: SpellEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  console.log(`Executing next_spell_costs_health spellEffect for ${sourceCard.card.name}`);
  
  // Check for required property: duration
  if (effect.duration === undefined) {
    console.warn(`NextSpellCostsHealth effect missing duration property`);
    // Fall back to a default value or handle the missing property
  }
  
  // TODO: Implement the next_spell_costs_health spellEffect effect
  // This is a template implementation - implement based on the effect's actual behavior
  
  // Get the current player
  const currentPlayerId = newState.currentPlayerId;
  
  // Log the effect for debugging
  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'spellEffect',
    text: `${sourceCard.card.name} triggered next_spell_costs_health spellEffect`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    source: sourceCard.card.name,
    cardId: sourceCard.card.id
  });
  
  return newState;
}

export default executeNextSpellCostsHealthNextSpellCostsHealth;
