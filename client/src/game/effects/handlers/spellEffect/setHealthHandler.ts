/**
 * SetHealth SpellEffect Handler
 * 
 * Implements the "set_health" spellEffect effect.
 * Example card: Card ID: 7020
 */
import { GameState, CardInstance } from '../../../types';
import { SpellEffect } from '../../../types/CardTypes';

/**
 * Execute a set_health spellEffect effect
 * 
 * @param state Current game state
 * @param effect The effect to execute
 * @param sourceCard The card that triggered the effect
 * @param targetId Optional target ID if the effect requires a target
 * @returns Updated game state
 */
export function executeSetHealthSetHealth(
  state: GameState,
  effect: SpellEffect,
  sourceCard: CardInstance,
  targetId?: string
): GameState {
  // Create a new state to avoid mutating the original
  const newState = { ...state };
  
  
  if (effect.value === undefined) {
    console.warn(`SetHealth effect missing value property`);
    return newState;
  }

  const healthValue = effect.value;

  if (targetId) {
    const findAndSetHealth = (battlefield: any[]): boolean => {
      for (let i = 0; i < battlefield.length; i++) {
        const minion = battlefield[i];
        if (minion.instanceId === targetId || String(minion.card?.id) === targetId) {
          battlefield[i] = { ...minion, currentHealth: healthValue };
          return true;
        }
      }
      return false;
    };

    newState.players = { ...state.players };
    newState.players.player = { ...state.players.player, battlefield: [...state.players.player.battlefield] };
    newState.players.opponent = { ...state.players.opponent, battlefield: [...state.players.opponent.battlefield] };

    const foundOnPlayer = findAndSetHealth(newState.players.player.battlefield);
    if (!foundOnPlayer) {
      findAndSetHealth(newState.players.opponent.battlefield);
    }
  }

  newState.gameLog = newState.gameLog || [];
  newState.gameLog.push({
    id: Math.random().toString(36).substring(2, 15),
    type: 'effect',
    player: newState.currentTurn,
    text: `${sourceCard.card.name} set a minion's health to ${healthValue}`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    cardName: sourceCard.card.name,
    cardId: String(sourceCard.card.id)
  });
  
  return newState;
}

export default executeSetHealthSetHealth;
