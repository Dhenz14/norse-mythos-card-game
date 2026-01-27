/**
 * Turn Effects Utilities
 * 
 * This file contains utility functions for handling turn-based effects like
 * start-of-turn and end-of-turn effects.
 */

import { GameState, CardInstance } from '../types';
import { drawCard } from './drawUtils';
import { v4 as uuidv4 } from 'uuid';
import { processTurnStartEffects as processStatusTurnStart, clearEndOfTurnEffects } from './statusEffectUtils';

/**
 * Process start of turn effects for a player
 * @param state Current game state
 * @returns Updated game state after applying start of turn effects
 */
export function processStartOfTurnEffects(state: GameState): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  
  // Process minion start-of-turn effects for the current player
  const battlefield = newState.players[currentPlayer]?.battlefield || [];
  
  for (const minion of battlefield) {
    // Handle specific card effects by ID
    switch (minion.card.id) {
      // Nat Pagle (ID: 20607)
      case 20607:
        newState = processNatPagleEffect(newState, minion);
        break;
        
      // Add any other start-of-turn effects here as needed
      
      default:
        // Process generic start-of-turn effects
        if (minion.card.startOfTurn) {
          // Implement generic start of turn effect processing
          console.log(`Processing generic start of turn effect for ${minion.card.name}`);
        }
    }
  }
  
  // Process status effects for all minions using centralized utility
  for (let i = 0; i < battlefield.length; i++) {
    const minion = newState.players[currentPlayer].battlefield[i];
    const { damage, effects } = processStatusTurnStart(minion);
    
    if (damage > 0) {
      const currentHealth = minion.currentHealth ?? minion.card.health ?? 0;
      const newHealth = currentHealth - damage;
      
      newState.players[currentPlayer].battlefield[i] = {
        ...minion,
        currentHealth: newHealth
      };
      
      effects.forEach(effect => console.log(`[STATUS] ${effect}`));
    }
  }
  
  return newState;
}

/**
 * Process Nat Pagle's effect (50% chance to draw a card at start of turn)
 * @param state Current game state
 * @param minion Nat Pagle card instance
 * @returns Updated game state
 */
function processNatPagleEffect(state: GameState, minion: CardInstance): GameState {
  const currentPlayer = state.currentTurn || 'player';
  
  // Log that the effect is being processed
  console.log(`Processing Nat Pagle effect for ${currentPlayer}`);
  
  // 50% chance to draw an extra card
  const shouldDraw = Math.random() >= 0.5;
  
  if (shouldDraw) {
    console.log(`Nat Pagle triggered! Drawing an extra card for ${currentPlayer}`);
    
    // Add a game log entry
    const newState = {
      ...state,
      gameLog: [
        ...(state.gameLog || []),
        {
          id: uuidv4(),
          type: 'effect',
          text: `Nat Pagle fished an extra card for ${currentPlayer === 'player' ? 'you' : 'opponent'}!`,
          timestamp: Date.now(),
          turn: state.turnNumber || 1,
          source: minion.card.name,
          cardId: minion.card.id
        }
      ]
    };
    
    // Draw the card - use the core drawCard function without a second parameter
    return drawCard(newState);
  } else {
    console.log(`Nat Pagle didn't catch anything this turn`);
    
    // Add a game log entry for the failed draw
    return {
      ...state,
      gameLog: [
        ...(state.gameLog || []),
        {
          id: uuidv4(),
          type: 'effect',
          text: `Nat Pagle didn't catch anything this turn.`,
          timestamp: Date.now(),
          turn: state.turnNumber || 1,
          source: minion.card.name,
          cardId: minion.card.id
        }
      ]
    };
  }
}

/**
 * Process end of turn effects for a player
 * @param state Current game state
 * @returns Updated game state after applying end of turn effects
 */
export function processEndOfTurnEffects(state: GameState): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const opponentPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
  
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
        // Process generic end-of-turn effects
        if (minion.card.endOfTurn) {
          // Implement generic end of turn effect processing
          console.log(`Processing generic end of turn effect for ${minion.card.name}`);
          
          // If the card has a custom endOfTurn property, process it
          if ('endOfTurn' in minion.card) {
            newState = processCustomEndOfTurnEffect(newState, minion, opponentPlayer);
          }
        }
    }
  }
  
  // Clear temporary status effects using centralized utility
  for (let i = 0; i < newState.players[currentPlayer].battlefield.length; i++) {
    const minion = newState.players[currentPlayer].battlefield[i];
    newState.players[currentPlayer].battlefield[i] = clearEndOfTurnEffects(minion);
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
function processJormungandrCoilEffect(state: GameState, minion: CardInstance, opponentPlayer: string): GameState {
  console.log(`Processing Jormungandr's Coil effect`);
  
  let newState = { ...state };
  const enemyMinions = newState.players[opponentPlayer]?.battlefield || [];
  
  if (enemyMinions.length === 0) {
    console.log(`No enemy minions to damage`);
    
    // Add a game log entry for the effect even if there are no targets
    return {
      ...newState,
      gameLog: [
        ...(newState.gameLog || []),
        {
          id: uuidv4(),
          type: 'effect',
          text: `Jormungandr's Coil tried to deal damage, but found no enemy minions.`,
          timestamp: Date.now(),
          turn: newState.turnNumber || 1,
          source: minion.card.name,
          cardId: minion.card.id
        }
      ]
    };
  }
  
  // Apply 1 damage to all enemy minions
  const updatedEnemyMinions = enemyMinions.map(enemyMinion => {
    // Safely get the current health with default values
    const currentCardHealth = enemyMinion.card && enemyMinion.card.health ? enemyMinion.card.health : 0;
    const currentHealth = typeof enemyMinion.currentHealth !== 'undefined' ? enemyMinion.currentHealth : currentCardHealth;
    const updatedHealth = currentHealth - 1;
    console.log(`Dealing 1 damage to ${enemyMinion.card.name}, health: ${currentHealth} -> ${updatedHealth}`);
    
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
      {
        id: uuidv4(),
        type: 'effect',
        text: `Jormungandr's Coil dealt 1 damage to all enemy minions.`,
        timestamp: Date.now(),
        turn: newState.turnNumber || 1,
        source: minion.card.name,
        cardId: minion.card.id
      }
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
function processCustomEndOfTurnEffect(state: GameState, minion: CardInstance, opponentPlayer: string): GameState {
  console.log(`Processing custom end of turn effect for ${minion.card.name}`);
  
  const effect = minion.card.endOfTurn;
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
          console.log(`No enemy minions to damage`);
          return newState;
        }
        
        // Apply damage to all enemy minions
        const damageValue = effect.value || 1;
        const updatedEnemyMinions = enemyMinions.map(enemyMinion => {
          // Safely get the current health with default values
          const currentCardHealth = enemyMinion.card && enemyMinion.card.health ? enemyMinion.card.health : 0;
          const currentHealth = typeof enemyMinion.currentHealth !== 'undefined' ? enemyMinion.currentHealth : currentCardHealth;
          const updatedHealth = currentHealth - damageValue;
          console.log(`Dealing ${damageValue} damage to ${enemyMinion.card.name}, health: ${currentHealth} -> ${updatedHealth}`);
          
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
            {
              id: uuidv4(),
              type: 'effect',
              text: `${minion.card.name} dealt ${damageValue} damage to all enemy minions.`,
              timestamp: Date.now(),
              turn: newState.turnNumber || 1,
              source: minion.card.name,
              cardId: minion.card.id
            }
          ]
        };
      }
      break;
      
    // Add more effect types as needed
    
    default:
      console.log(`Unknown end of turn effect type: ${effect.type}`);
  }
  
  return newState;
}