/**
 * Utility functions for Combo mechanics
 * Handling the activation and effects of Combo cards
 */
import { GameState, CardInstance, CardData, ComboEffect } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createGameLogEvent } from './gameLogUtils';
import { dealDamage, getValidTargets, summonMinion } from './damageUtils';

/**
 * Check if a combo is active for the player
 * @param state Current game state
 * @param playerType The player to check
 * @returns Boolean indicating if the player has played a card this turn (combo is active)
 */
export function isComboActive(
  state: GameState,
  playerType: 'player' | 'opponent'
): boolean {
  // Combo is active if the player has played at least one other card this turn
  return state.players[playerType].cardsPlayedThisTurn > 0;
}

/**
 * Check if combo should be activated for the card
 * @param state Current game state
 * @param playerType The player to check
 * @returns Boolean indicating if combo should be activated
 */
export function shouldActivateCombo(
  state: GameState,
  playerType: 'player' | 'opponent'
): boolean {
  // Same implementation as isComboActive but with a more descriptive name
  // Used by gameUtils for clarity
  return state.players[playerType].cardsPlayedThisTurn > 0;
}

/**
 * Execute a combo effect if the combo is active
 * @param state Current game state
 * @param playerType Player using the combo card
 * @param cardInstanceId Instance ID of the card with the combo
 * @param targetInstanceId Instance ID of the target (if applicable)
 * @returns Updated game state after the combo effect
 */
export function executeComboEffect(
  state: GameState,
  playerType: 'player' | 'opponent',
  cardInstanceId: string,
  targetInstanceId?: string
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Check if combo is active
  const comboActive = isComboActive(newState, playerType);
  
  // Find the card (either in hand or on the battlefield depending on card type)
  const hand = newState.players[playerType].hand;
  const battlefield = newState.players[playerType].battlefield;
  
  let comboCard: CardInstance | undefined;
  let comboCardLocation: 'hand' | 'battlefield' | 'weapon' | 'none' = 'none';
  
  // Check hand first
  const handIndex = hand.findIndex(card => card.instanceId === cardInstanceId);
  if (handIndex !== -1) {
    comboCard = hand[handIndex];
    comboCardLocation = 'hand';
  } else {
    // Check battlefield if not found in hand
    const battlefieldIndex = battlefield.findIndex(card => card.instanceId === cardInstanceId);
    if (battlefieldIndex !== -1) {
      comboCard = battlefield[battlefieldIndex];
      comboCardLocation = 'battlefield';
    } else if (newState.players[playerType].weapon?.instanceId === cardInstanceId) {
      // Check if it's a weapon
      comboCard = newState.players[playerType].weapon;
      comboCardLocation = 'weapon';
    }
  }
  
  // If card not found or has no combo effect, return unchanged state
  if (!comboCard || !comboCard.card.comboEffect) {
    return newState;
  }
  
  // Get the combo effect
  const comboEffect = comboCard.card.comboEffect;
  
  // If combo is not active, log the failed combo
  if (!comboActive) {
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'combo_failed' as any,
        playerType,
        `${comboCard.card.name}'s Combo does not activate (no other card played this turn).`,
        { cardId: comboCard.card.id.toString() }
      )
    );
    return newState;
  }
  
  // Log that the combo is active
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'combo_activated' as any,
      playerType,
      `${comboCard.card.name}'s Combo activates!`,
      { cardId: comboCard.card.id.toString() }
    )
  );
  
  // Process the combo effect based on its type
  switch (comboEffect.type) {
    case 'damage':
      newState = handleComboDamage(newState, playerType, comboCard, comboEffect, targetInstanceId);
      break;
    case 'summon':
      newState = handleComboSummon(newState, playerType, comboCard, comboEffect);
      break;
    case 'buff_per_card':
      newState = handleComboBuffPerCard(newState, playerType, comboCard, comboEffect);
      break;
    // Additional combo effect types would be handled here
    default:
      // Unknown combo effect type, log and return unchanged state
      newState.gameLog.push(
        createGameLogEvent(
          newState,
          'error' as any,
          playerType,
          `Unknown combo effect type: ${comboEffect.type}`,
          { cardId: comboCard.card.id.toString() }
        )
      );
  }
  
  return newState;
}

/**
 * Handle a combo effect that deals damage
 * @param state Current game state
 * @param playerType Player using the combo
 * @param comboCard The card with the combo effect
 * @param comboEffect The combo effect to apply
 * @param targetInstanceId Instance ID of the target
 * @returns Updated game state after the damage effect
 */
function handleComboDamage(
  state: GameState,
  playerType: 'player' | 'opponent',
  comboCard: CardInstance,
  comboEffect: ComboEffect,
  targetInstanceId?: string
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Check if target is required and provided
  if (comboEffect.requiresTarget && !targetInstanceId) {
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'error' as any,
        playerType,
        `Target required for ${comboCard.card.name}'s combo effect but none provided.`,
        { cardId: comboCard.card.id.toString() }
      )
    );
    return newState;
  }
  
  // If target is required, find and validate the target
  if (comboEffect.requiresTarget && targetInstanceId) {
    // Get all valid targets
    const validTargets = getValidTargets(newState, playerType, comboEffect.targetType);
    
    // Check if the provided target is valid
    const target = validTargets.find(target => target.instanceId === targetInstanceId);
    
    if (!target) {
      newState.gameLog.push(
        createGameLogEvent(
          newState,
          'error' as any,
          playerType,
          `Invalid target for ${comboCard.card.name}'s combo effect.`,
          { cardId: comboCard.card.id.toString() }
        )
      );
      return newState;
    }
    
    // Deal damage to the target
    const damageAmount = comboEffect.value || 0;
    
    // Log the damage
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'combo_damage' as any,
        playerType,
        `${comboCard.card.name}'s Combo deals ${damageAmount} damage to ${target.card.name}.`,
        { 
          cardId: comboCard.card.id.toString(),
          targetId: targetInstanceId,
          value: damageAmount
        }
      )
    );
    
    // Apply the damage
    newState = dealDamage(newState, targetInstanceId, damageAmount, playerType, comboCard.instanceId);
  }
  
  return newState;
}

/**
 * Handle a combo effect that summons a minion
 * @param state Current game state
 * @param playerType Player using the combo
 * @param comboCard The card with the combo effect
 * @param comboEffect The combo effect to apply
 * @returns Updated game state after the summon effect
 */
function handleComboSummon(
  state: GameState,
  playerType: 'player' | 'opponent',
  comboCard: CardInstance,
  comboEffect: ComboEffect
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Check if the battlefield is full
  const battlefield = newState.players[playerType].battlefield;
  if (battlefield.length >= 7) {
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'summon_failed' as any,
        playerType,
        `The battlefield is full! ${comboCard.card.name}'s Combo cannot summon a minion.`,
        { cardId: comboCard.card.id.toString() }
      )
    );
    return newState;
  }
  
  // Find the card to summon
  const cardToSummonId = comboEffect.cardId;
  const cardToSummon = newState.cardDatabase.find(card => card.id === cardToSummonId);
  
  if (!cardToSummon) {
    newState.gameLog.push(
      createGameLogEvent(
        newState,
        'error' as any,
        playerType,
        `Card with ID ${cardToSummonId} not found for ${comboCard.card.name}'s Combo.`,
        { cardId: comboCard.card.id.toString() }
      )
    );
    return newState;
  }
  
  // Create the minion instance
  const summonedMinion: CardInstance = {
    instanceId: uuidv4(),
    card: cardToSummon,
    isPlayed: false,
    isSummoningSick: true,
    attacksPerformed: 0,
    health: cardToSummon.health,
    attack: cardToSummon.attack,
    hasAttacked: false,
    hasTaunt: false,
    hasDivineShield: false,
    hasWindfury: false,
    isFrozen: false,
    isDead: false
  };
  
  // Add the minion to the battlefield
  newState.players[playerType].battlefield.push(summonedMinion);
  
  // Log the summon
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'combo_summon' as any,
      playerType,
      `${comboCard.card.name}'s Combo summons a ${cardToSummon.name}.`,
      { 
        cardId: comboCard.card.id.toString(),
        summonedCardId: cardToSummon.id.toString()
      }
    )
  );
  
  return newState;
}

/**
 * Handle a combo effect that buffs a minion based on cards played this turn
 * @param state Current game state
 * @param playerType Player using the combo
 * @param comboCard The card with the combo effect
 * @param comboEffect The combo effect to apply
 * @returns Updated game state after the buff effect
 */
function handleComboBuffPerCard(
  state: GameState,
  playerType: 'player' | 'opponent',
  comboCard: CardInstance,
  comboEffect: ComboEffect
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Find the minion on the battlefield (should be already played)
  const battlefield = newState.players[playerType].battlefield;
  const minionIndex = battlefield.findIndex(minion => minion.instanceId === comboCard.instanceId);
  
  if (minionIndex === -1) {
    return newState; // Minion not found on battlefield
  }
  
  // Calculate the buff based on cards played this turn
  const cardsPlayedThisTurn = newState.players[playerType].cardsPlayedThisTurn;
  
  // Subtract 1 because the current card should not count for its own combo
  const cardCount = Math.max(0, cardsPlayedThisTurn - 1);
  
  // Calculate buff values
  const attackBuff = (comboEffect.attackPerCard || 0) * cardCount;
  const healthBuff = (comboEffect.healthPerCard || 0) * cardCount;
  
  if (attackBuff === 0 && healthBuff === 0) {
    return newState; // No buff to apply
  }
  
  // Apply the buff
  const minion = battlefield[minionIndex];
  
  if (!minion.buffs) {
    minion.buffs = { attack: attackBuff, health: healthBuff };
  } else {
    minion.buffs.attack += attackBuff;
    minion.buffs.health += healthBuff;
  }
  
  // Make sure health is adjusted properly
  minion.health += healthBuff;
  
  // Log the buff
  newState.gameLog.push(
    createGameLogEvent(
      newState,
      'combo_buff' as any,
      playerType,
      `${comboCard.card.name}'s Combo gives +${attackBuff}/+${healthBuff} (${cardCount} other cards played).`,
      { 
        cardId: comboCard.card.id.toString(),
        value: cardCount
      }
    )
  );
  
  return newState;
}

// Export all functions - no need for a separate export block as they are already exported inline