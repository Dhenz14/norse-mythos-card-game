/**
 * Utility functions for handling the Frenzy mechanic in Hearthstone.
 * Frenzy is a keyword introduced in the Forged in the Barrens expansion
 * that activates an effect the first time a minion survives damage.
 */
import { GameState, CardInstance, FrenzyEffect } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { findCardInstance } from './cardUtils';
import { applyDamage } from './gameUtils';
import { getCardById } from '../data/allCards';

/**
 * Initializes a card's frenzy effect
 * Sets the initial state of the frenzy effect when a card is created
 */
export function initializeFrenzyEffect(card: CardInstance): CardInstance {
  if (card.card.frenzyEffect && card.card.keywords.includes('frenzy')) {
    return {
      ...card,
      hasFrenzy: true,
      frenzyEffect: {
        ...card.card.frenzyEffect,
        triggered: false
      },
      frenzyTriggered: false
    };
  }
  return card;
}

/**
 * Checks if a card's frenzy effect should activate
 * Returns true if the card has an untriggered frenzy effect and has just survived damage
 */
export function shouldActivateFrenzy(card: CardInstance, wasJustDamaged: boolean): boolean {
  return (
    wasJustDamaged &&
    card.hasFrenzy === true &&
    (card.frenzyTriggered === false) &&
    card.frenzyEffect?.triggered === false &&
    (card.currentHealth !== undefined && card.currentHealth > 0)
  );
}

/**
 * Execute the frenzy effect for a card
 * @param state The current game state
 * @param cardId The ID of the card with the frenzy effect
 * @param playerId The ID of the player who controls the card
 * @returns Updated game state after applying the frenzy effect
 */
export function executeFrenzyEffect(
  state: GameState,
  cardId: string,
  playerId: 'player' | 'opponent'
): GameState {
  // Find the card instance
  const cardInfo = findCardInstance(state.players[playerId].battlefield, cardId);
  if (!cardInfo) {
    console.error('Frenzy card not found on battlefield');
    return state;
  }

  const card = cardInfo.card;
  const index = cardInfo.index;
  
  // Ensure card has a frenzy effect to execute
  if (!card.frenzyEffect) {
    console.error('Card has no frenzy effect to execute');
    return state;
  }
  
  // Mark frenzy as triggered
  const updatedState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId]
      }
    }
  };
  
  updatedState.players[playerId].battlefield[index].frenzyTriggered = true;
  if (updatedState.players[playerId].battlefield[index].frenzyEffect) {
    updatedState.players[playerId].battlefield[index].frenzyEffect.triggered = true;
  }
  
  // Log the frenzy activation
  
  // Add to the game log
  updatedState.gameLog = [
    ...(updatedState.gameLog || []),
    {
      id: uuidv4(),
      type: 'frenzy',
      cardId: cardId,
      player: playerId,
      turn: updatedState.turnNumber,
      timestamp: Date.now(),
      text: `${card.card.name}'s Frenzy effect activated!`
    }
  ];
  
  const effect = card.frenzyEffect;
  const effectType = effect.type;
  
  // Execute effect based on its type
  switch (effectType) {
    case 'damage':
      // Deal damage to specified targets
      if (effect.targetType === 'all_enemy_minions') {
        const damageAmount = effect.useAttackValue ? (card.card.attack || 0) : (effect.value || 1);
        // Deal damage to all enemy minions
        const enemyPlayerId = playerId === 'player' ? 'opponent' : 'player';
        const enemyMinions = updatedState.players[enemyPlayerId].battlefield;
        
        // Apply damage to each enemy minion
        let newState = { ...updatedState };
        for (const minion of enemyMinions) {
          // We can safely use our applyDamage function from earlier
          newState = applyDamage(newState, enemyPlayerId, minion.instanceId, damageAmount);
        }
        return newState;
      }
      return updatedState;
      
    case 'heal':
      // Heal the specified target
      if (effect.targetType === 'friendly_hero') {
        const healAmount = effect.value || 1;
        updatedState.players[playerId].health = Math.min(
          30, // Max health in Hearthstone
          updatedState.players[playerId].health + healAmount
        );
      }
      return updatedState;
      
    case 'buff':
      // Buff the minion's stats
      if (effect.buffAttack || effect.buffHealth) {
        const buffedCard = updatedState.players[playerId].battlefield[index];
        // Apply attack buff
        if (effect.buffAttack) {
          buffedCard.card = {
            ...buffedCard.card,
            attack: (buffedCard.card.attack || 0) + effect.buffAttack
          };
        }
        // Apply health buff
        if (effect.buffHealth && buffedCard.currentHealth !== undefined) {
          buffedCard.currentHealth += effect.buffHealth;
          buffedCard.card = {
            ...buffedCard.card,
            health: (buffedCard.card.health || 0) + effect.buffHealth
          };
        }
      }
      return updatedState;
      
    case 'draw':
      // Draw cards
      const drawCount = effect.value || 1;
      // Since we can't use drawCards directly from cardUtils (it has different interface),
      // we just simulate drawing by giving a message without actually modifying the state
      return updatedState;
      
    case 'transform':
      // Transform the minion into another minion
      if (effect.transformId) {
        const transformCard = getCardById(effect.transformId);
        if (!transformCard) {
          console.error(`Transform target card (ID: ${effect.transformId}) not found`);
          return updatedState;
        }
        
        // Create a new instance of the transformed card
        const transformedCard: CardInstance = {
          instanceId: uuidv4(),
          card: transformCard,
          isPlayed: true,
          currentHealth: transformCard.health,
          isSummoningSick: false, // Already on the battlefield, so not summoning sick
          canAttack: card.canAttack, // Preserve attack status
          attacksPerformed: card.attacksPerformed || 0
        };
        
        // Replace the original card with the transformed one
        updatedState.players[playerId].battlefield[index] = transformedCard;
      }
      return updatedState;
      
    case 'add_to_hand':
      // Add cards to hand
      if (effect.cardType === 'spell' && effect.isRandom) {
        // Add a random spell to hand 
        // In a real implementation, this would query all spells and pick one randomly
        // For now, we'll just use a placeholder spell from the existing spell cards
        const spell = getCardById(1001); // Assuming 1001 is a valid spell ID
        if (spell) {
          updatedState.players[playerId].hand.push({
            instanceId: uuidv4(),
            card: spell,
            isPlayed: false
          });
        }
      }
      return updatedState;
      
    case 'attack_random':
      // Attack a random enemy
      // This would involve selecting a random enemy (minion or hero) and executing an attack
      // For now, we'll just log that it happened
      return updatedState;
      
    default:
      console.error(`Unknown frenzy effect type: ${effectType}`);
      return updatedState;
  }
}

/**
 * Processes frenzy effects when a minion takes damage
 * This should be called whenever a minion takes damage and survives
 */
export function processFrenzyEffect(
  state: GameState,
  cardId: string,
  playerId: 'player' | 'opponent'
): GameState {
  // Find the card instance
  const cardInfo = findCardInstance(state.players[playerId].battlefield, cardId);
  if (!cardInfo) {
    return state; // Card not found
  }

  const card = cardInfo.card;
  
  // Check if the frenzy should activate
  if (shouldActivateFrenzy(card, true)) {
    return executeFrenzyEffect(state, cardId, playerId);
  }
  
  return state;
}

/**
 * Process frenzy effects for multiple minions
 * This is a convenience function to process frenzy effects for multiple damaged minions
 */
export function processFrenzyEffects(
  state: GameState,
  damagedMinionIds: { id: string; playerId: 'player' | 'opponent' }[]
): GameState {
  let updatedState = { ...state };
  
  // Process each damaged minion for frenzy effects
  for (const { id, playerId } of damagedMinionIds) {
    updatedState = processFrenzyEffect(updatedState, id, playerId);
  }
  
  return updatedState;
}