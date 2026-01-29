/**
 * Turn Effects Utilities
 * 
 * This file contains utility functions for handling turn-based effects like
 * start-of-turn and end-of-turn effects.
 */

import { GameState, CardInstance, MinionCardData, GameLogEvent } from '../types';
import { drawCard } from './drawUtils';
import { v4 as uuidv4 } from 'uuid';
import { processTurnStartEffects as processStatusTurnStart, clearEndOfTurnEffects } from './statusEffectUtils';

// Helper to create type-safe game log entries for effects
function createEffectLogEntry(
  text: string,
  player: 'player' | 'opponent',
  turnNumber: number,
  cardId?: number | string
): GameLogEvent {
  return {
    id: uuidv4(),
    type: 'card_played', // Use 'card_played' as closest valid type for effects
    player,
    text,
    timestamp: Date.now(),
    turn: turnNumber,
    cardId: cardId !== undefined ? String(cardId) : undefined
  };
}

/**
 * Process start of turn effects for a player
 * @param state Current game state
 * @returns Updated game state after applying start of turn effects
 */
export function processStartOfTurnEffects(state: GameState): GameState {
  let newState = { ...state };
  const currentPlayer: 'player' | 'opponent' = state.currentTurn || 'player';
  
  // Process minion start-of-turn effects for the current player
  const battlefield = newState.players[currentPlayer]?.battlefield || [];
  
  for (const minion of battlefield) {
    // Handle specific card effects by ID
    switch (minion.card.id) {
      // Fishing Master (ID: 20607)
      case 20607:
        newState = processFishingMasterEffect(newState, minion, currentPlayer);
        break;
      
      // Clockwork Automaton (ID: 5103) - Swap with random minion in hand
      case 5103:
        newState = processClockworkAutomatonEffect(newState, minion, currentPlayer);
        break;
        
      // Add any other start-of-turn effects here as needed
      
      default:
        // Process generic start-of-turn effects (only for minion cards)
        if (minion.card.type === 'minion') {
          const minionCard = minion.card as MinionCardData;
          if (minionCard.startOfTurn) {
            // Implement generic start of turn effect processing
          }
        }
    }
  }
  
  // Process status effects for all minions using centralized utility
  for (let i = 0; i < battlefield.length; i++) {
    const minion = newState.players[currentPlayer].battlefield[i];
    const { damage } = processStatusTurnStart(minion as any);
    
    if (damage > 0) {
      // Type guard for health access
      const cardHealth = minion.card.type === 'minion' 
        ? (minion.card as MinionCardData).health 
        : 0;
      const currentHealth = minion.currentHealth ?? cardHealth ?? 0;
      const newHealth = currentHealth - damage;
      
      newState.players[currentPlayer].battlefield[i] = {
        ...minion,
        currentHealth: newHealth
      };
    }
  }
  
  return newState;
}

/**
 * Process Fishing Master's effect (50% chance to draw a card at start of turn)
 * @param state Current game state
 * @param minion Fishing Master card instance
 * @param currentPlayer The current player
 * @returns Updated game state
 */
function processFishingMasterEffect(
  state: GameState, 
  minion: CardInstance,
  currentPlayer: 'player' | 'opponent'
): GameState {
  // 50% chance to draw an extra card
  const shouldDraw = Math.random() >= 0.5;
  
  if (shouldDraw) {
    // Add a game log entry
    const newState = {
      ...state,
      gameLog: [
        ...(state.gameLog || []),
        createEffectLogEntry(
          `Fishing Master caught an extra card for ${currentPlayer === 'player' ? 'you' : 'opponent'}!`,
          currentPlayer,
          state.turnNumber || 1,
          minion.card.id
        )
      ]
    };
    
    // Draw the card - use the core drawCard function without a second parameter
    return drawCard(newState);
  } else {
    // Add a game log entry for the failed draw
    return {
      ...state,
      gameLog: [
        ...(state.gameLog || []),
        createEffectLogEntry(
          `Fishing Master didn't catch anything this turn.`,
          currentPlayer,
          state.turnNumber || 1,
          minion.card.id
        )
      ]
    };
  }
}

/**
 * Process Clockwork Automaton effect (swap with random minion in hand at start of turn)
 * @param state Current game state
 * @param minion Automaton card instance
 * @param currentPlayer The current player
 * @returns Updated game state
 */
function processClockworkAutomatonEffect(
  state: GameState, 
  minion: CardInstance, 
  currentPlayer: 'player' | 'opponent'
): GameState {
  const hand = state.players[currentPlayer]?.hand || [];
  const battlefield = state.players[currentPlayer]?.battlefield || [];
  
  // Find minions in hand (cards with attack and health properties, type 'minion')
  const minionsInHand = hand.filter(card => 
    card.card.type === 'minion' && 
    typeof card.card.attack === 'number' && 
    typeof (card.card as MinionCardData).health === 'number'
  );
  
  if (minionsInHand.length === 0) {
    console.log('[Clockwork Automaton] No minions in hand to swap with');
    return {
      ...state,
      gameLog: [
        ...(state.gameLog || []),
        createEffectLogEntry(
          `Clockwork Automaton tried to swap but found no minions in hand.`,
          currentPlayer,
          state.turnNumber || 1,
          minion.card.id
        )
      ]
    };
  }
  
  // Pick a random minion from hand
  const randomIndex = Math.floor(Math.random() * minionsInHand.length);
  const handMinion = minionsInHand[randomIndex];
  
  // Find the indices
  const automatonIndex = battlefield.findIndex(m => m.instanceId === minion.instanceId);
  const handMinionIndex = hand.findIndex(c => c.instanceId === handMinion.instanceId);
  
  if (automatonIndex === -1 || handMinionIndex === -1) {
    console.error('[Clockwork Automaton] Could not find cards to swap');
    return state;
  }
  
  // Create new arrays for the swap
  const newBattlefield = [...battlefield];
  const newHand = [...hand];
  
  // Swap: Put automaton in hand, put hand minion on battlefield
  const automatonFromField = newBattlefield[automatonIndex];
  const minionFromHand = newHand[handMinionIndex];
  
  // The automaton goes to hand (reset its played state)
  const automatonToHand: CardInstance = {
    ...automatonFromField,
    isPlayed: false,
    canAttack: false,
    isSummoningSick: true,
    attacksPerformed: 0
  };
  
  // Get the health from the minion card (type guard for MinionCardData)
  const minionCard = minionFromHand.card;
  const minionHealth = minionCard.type === 'minion' ? (minionCard as MinionCardData).health : undefined;
  
  // The hand minion goes to battlefield (mark as summoning sick)
  const minionToBattlefield: CardInstance = {
    ...minionFromHand,
    isPlayed: true,
    canAttack: false,
    isSummoningSick: true,
    attacksPerformed: 0,
    currentHealth: minionHealth
  };
  
  // Perform the swap
  newBattlefield[automatonIndex] = minionToBattlefield;
  newHand[handMinionIndex] = automatonToHand;
  
  console.log(`[Clockwork Automaton] Swapped with ${handMinion.card.name} from hand`);
  
  return {
    ...state,
    players: {
      ...state.players,
      [currentPlayer]: {
        ...state.players[currentPlayer],
        battlefield: newBattlefield,
        hand: newHand
      }
    },
    gameLog: [
      ...(state.gameLog || []),
      createEffectLogEntry(
        `Clockwork Automaton swapped places with ${handMinion.card.name}!`,
        currentPlayer,
        state.turnNumber || 1,
        minion.card.id
      )
    ]
  };
}

/**
 * Process end of turn effects for a player
 * @param state Current game state
 * @returns Updated game state after applying end of turn effects
 */
export function processEndOfTurnEffects(state: GameState): GameState {
  let newState = { ...state };
  const currentPlayer: 'player' | 'opponent' = state.currentTurn || 'player';
  const opponentPlayer: 'player' | 'opponent' = currentPlayer === 'player' ? 'opponent' : 'player';
  
  // Process minion end-of-turn effects for the current player
  const battlefield = newState.players[currentPlayer]?.battlefield || [];
  
  for (const minion of battlefield) {
    // Handle specific card effects by ID
    switch (minion.card.id) {
      // Jormungandr's Coil - Deal 1 damage to all enemy minions
      case 20621:
        newState = processJormungandrCoilEffect(newState, minion, opponentPlayer);
        break;
      
      default:
        // Process generic end-of-turn effects (only for minion cards)
        if (minion.card.type === 'minion') {
          const minionCard = minion.card as MinionCardData;
          if (minionCard.endOfTurn) {
            newState = processCustomEndOfTurnEffect(newState, minion, opponentPlayer);
          }
        }
    }
  }
  
  // Clear temporary status effects using centralized utility
  for (let i = 0; i < newState.players[currentPlayer].battlefield.length; i++) {
    const minion = newState.players[currentPlayer].battlefield[i];
    newState.players[currentPlayer].battlefield[i] = clearEndOfTurnEffects(minion as any) as CardInstance;
  }
  
  return newState;
}

/**
 * Process Jormungandr's Coil effect (deal 1 damage to all enemy minions at end of turn)
 * @param state Current game state
 * @param minion Jormungandr's Coil card instance
 * @param opponentPlayer The opponent player id
 * @returns Updated game state
 */
function processJormungandrCoilEffect(
  state: GameState, 
  minion: CardInstance, 
  opponentPlayer: 'player' | 'opponent'
): GameState {
  const currentPlayer: 'player' | 'opponent' = opponentPlayer === 'player' ? 'opponent' : 'player';
  let newState = { ...state };
  const enemyMinions = newState.players[opponentPlayer]?.battlefield || [];
  
  if (enemyMinions.length === 0) {
    // Add a game log entry for the effect even if there are no targets
    return {
      ...newState,
      gameLog: [
        ...(newState.gameLog || []),
        createEffectLogEntry(
          `Jormungandr's Coil tried to deal damage, but found no enemy minions.`,
          currentPlayer,
          newState.turnNumber || 1,
          minion.card.id
        )
      ]
    };
  }
  
  // Apply 1 damage to all enemy minions
  const updatedEnemyMinions = enemyMinions.map(enemyMinion => {
    // Safely get the current health with default values (type guard for MinionCardData)
    const cardHealth = enemyMinion.card.type === 'minion' 
      ? (enemyMinion.card as MinionCardData).health 
      : 0;
    const currentCardHealth = cardHealth ?? 0;
    const currentHealth = typeof enemyMinion.currentHealth !== 'undefined' ? enemyMinion.currentHealth : currentCardHealth;
    const updatedHealth = currentHealth - 1;
    
    return {
      ...enemyMinion,
      currentHealth: updatedHealth
    };
  });
  
  // Update the battlefield with the damaged minions
  newState = {
    ...newState,
    players: {
      ...newState.players,
      [opponentPlayer]: {
        ...newState.players[opponentPlayer],
        battlefield: updatedEnemyMinions
      }
    },
    gameLog: [
      ...(newState.gameLog || []),
      createEffectLogEntry(
        `Jormungandr's Coil dealt 1 damage to all enemy minions.`,
        currentPlayer,
        newState.turnNumber || 1,
        minion.card.id
      )
    ]
  };
  
  return newState;
}

/**
 * Process custom end-of-turn effects from the card's endOfTurn property
 * @param state Current game state
 * @param minion Card instance with the end-of-turn effect
 * @param opponentPlayer The opponent player id
 * @returns Updated game state
 */
function processCustomEndOfTurnEffect(
  state: GameState, 
  minion: CardInstance, 
  opponentPlayer: 'player' | 'opponent'
): GameState {
  const currentPlayer: 'player' | 'opponent' = opponentPlayer === 'player' ? 'opponent' : 'player';
  
  // Type guard: this function is only called for minion cards with endOfTurn
  if (minion.card.type !== 'minion') {
    return state;
  }
  const minionCard = minion.card as MinionCardData;
  const effect = minionCard.endOfTurn;
  if (!effect) {
    return state;
  }
  
  let newState = { ...state };
  
  // Handle different effect types
  switch (effect.type) {
    case 'damage':
      // Handle damage effects
      if (effect.targetType === 'enemy_minions') {
        const enemyMinions = newState.players[opponentPlayer]?.battlefield || [];
        
        if (enemyMinions.length === 0) {
          return newState;
        }
        
        // Apply damage to all enemy minions
        const damageValue = typeof effect.value === 'number' ? effect.value : 1;
        const updatedEnemyMinions = enemyMinions.map(enemyMinion => {
          // Safely get the current health with default values (type guard for MinionCardData)
          const cardHealth = enemyMinion.card.type === 'minion' 
            ? (enemyMinion.card as MinionCardData).health 
            : 0;
          const currentCardHealth = cardHealth ?? 0;
          const currentHealth = typeof enemyMinion.currentHealth !== 'undefined' ? enemyMinion.currentHealth : currentCardHealth;
          const updatedHealth = currentHealth - damageValue;
          
          return {
            ...enemyMinion,
            currentHealth: updatedHealth
          };
        });
        
        // Update the battlefield with the damaged minions
        newState = {
          ...newState,
          players: {
            ...newState.players,
            [opponentPlayer]: {
              ...newState.players[opponentPlayer],
              battlefield: updatedEnemyMinions
            }
          },
          gameLog: [
            ...(newState.gameLog || []),
            createEffectLogEntry(
              `${minion.card.name} dealt ${damageValue} damage to all enemy minions.`,
              currentPlayer,
              newState.turnNumber || 1,
              minion.card.id
            )
          ]
        };
      }
      break;
      
    // Add more effect types as needed
    
    default:
  }
  
  return newState;
}