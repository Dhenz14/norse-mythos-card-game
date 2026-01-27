import { CardInstance, GameState, CardData, DeathrattleEffect, AnimationType, GameLogEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createCardInstance } from './cardUtils';
import { drawCardFromDeck } from './zoneUtils';
import { fullCardDatabase } from '../data/cards';

/**
 * Execute deathrattle effects for a card
 */
export function executeDeathrattle(
  state: GameState,
  card: CardInstance,
  playerId: 'player' | 'opponent'
): GameState {
  // If the card doesn't have a deathrattle keyword or effect, return the original state
  if (!card.card.keywords?.includes('deathrattle') || !card.card.deathrattle) {
    return state;
  }

  console.log(`Executing deathrattle for ${card.card.name}`);

  // Create a deep copy of the state to safely modify
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Process the deathrattle based on its type
  const deathrattle = card.card.deathrattle;
  
  // Add deathrattle animation to the queue if animations are supported
  if (newState.animations) {
    // Create a properly typed animation object that matches the AnimationParams interface
    const deathrattleAnimation: AnimationParams & {
      id: string;
      startTime: number;
      endTime: number;
      completed: boolean;
      message: string;
      attackBuff?: number;
      healthBuff?: number;
    } = {
      id: `deathrattle_${card.instanceId}_${Date.now()}`,
      type: 'deathrattle' as AnimationType,
      sourceId: card.card.id,
      position: { x: 0, y: 0 }, // In a real implementation, this would be the card's position
      value: deathrattle.value,
      startTime: Date.now(),
      endTime: Date.now() + 1500, // 1.5 seconds animation
      completed: false,
      message: `${card.card.name} triggers deathrattle: ${deathrattle.type}`,
      duration: 1500 // Default animation duration
    };
    
    // Add type-specific properties based on deathrattle type
    if (deathrattle.type === 'damage') {
      deathrattleAnimation.damage = deathrattle.value;
    } else if (deathrattle.type === 'heal') {
      deathrattleAnimation.healing = deathrattle.value;
    } else if (deathrattle.type === 'buff' && (deathrattle.buffAttack || deathrattle.buffHealth)) {
      deathrattleAnimation.attackBuff = deathrattle.buffAttack;
      deathrattleAnimation.healthBuff = deathrattle.buffHealth;
    }
    
    // Add the animation to the state
    newState.animations.push(deathrattleAnimation);
  }
  
  // Add to game log if it exists
  if (newState.gameLog) {
    newState.gameLog.push({
      id: uuidv4(),
      type: 'deathrattle',
      text: `${card.card.name} triggered its deathrattle: ${deathrattle.type}`,
      timestamp: Date.now(),
      turn: newState.turnNumber,
      source: card.card.name,
      cardId: card.card.id
    });
  }
  
  // Process the deathrattle effect based on its type
  switch (deathrattle.type) {
    case 'summon':
      return executeSummonDeathrattle(newState, deathrattle, playerId);
    case 'draw':
      return executeDrawDeathrattle(newState, deathrattle, playerId);
    case 'damage':
      return executeDamageDeathrattle(newState, deathrattle, playerId);
    case 'heal':
      return executeHealDeathrattle(newState, deathrattle, playerId);
    case 'buff':
      return executeBuffDeathrattle(newState, deathrattle, playerId);
    case 'give_divine_shield':
      return executeGiveDivineShieldDeathrattle(newState, deathrattle, playerId);
    case 'mind_control':
      return executeMindControlDeathrattle(newState, deathrattle, playerId);
    default:
      console.warn(`Unknown deathrattle type: ${deathrattle.type}`);
      return newState;
  }
}

/**
 * Execute a summon deathrattle effect
 */
function executeSummonDeathrattle(
  state: GameState,
  deathrattle: DeathrattleEffect,
  playerId: 'player' | 'opponent'
): GameState {
  // Deep copy the state to avoid mutation
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Find the card to summon based on the specified card ID
  if (!deathrattle.summonCardId) {
    console.error("No summon card ID specified in the deathrattle effect");
    return state;
  }
  
  const cardToSummon = fullCardDatabase.find(card => card.id === deathrattle.summonCardId);
  
  if (!cardToSummon) {
    console.error(`Card with ID ${deathrattle.summonCardId} not found in the database`);
    return state;
  }
  
  const player = newState.players[playerId];
  
  // Check if there's room on the battlefield (max 7 minions)
  if (player.battlefield.length >= 7) {
    console.log(`${playerId}'s battlefield is full, cannot summon ${cardToSummon.name}`);
    return newState;
  }
  
  // Determine how many copies to summon (default to 1 if not specified)
  const summonCount = deathrattle.value || 1;
  
  // Create and add instances for each summon, up to the battlefield limit
  for (let i = 0; i < summonCount; i++) {
    // Check battlefield space again on each iteration
    if (player.battlefield.length >= 7) {
      console.log(`${playerId}'s battlefield is now full, stopping summons after ${i} copies`);
      break;
    }
    
    // Create a new instance of the card to summon
    const summonedCard = createCardInstance(cardToSummon);
    
    // Add the summoned card to the battlefield
    player.battlefield.push(summonedCard);
    
    console.log(`Deathrattle: Summoned ${cardToSummon.name} (${i+1}/${summonCount}) for ${playerId}`);
  }
  
  return newState;
}

/**
 * Execute a draw deathrattle effect
 */
function executeDrawDeathrattle(
  state: GameState,
  deathrattle: DeathrattleEffect,
  playerId: 'player' | 'opponent'
): GameState {
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Default to 1 card if no value is specified
  const cardsToDraw = deathrattle.value || 1;
  
  console.log(`Deathrattle: Drawing ${cardsToDraw} card(s) for ${playerId}`);
  
  // Check if player has enough cards in deck
  const player = newState.players[playerId];
  
  if (player.deck.length === 0) {
    console.log(`${playerId} has no cards left in deck for deathrattle draw effect`);
    // In Hearthstone, drawing from an empty deck causes fatigue damage
    // For simplicity, we'll just skip the draw without causing fatigue damage
    return newState;
  }
  
  // Draw the specified number of cards, but stop if deck is empty
  for (let i = 0; i < cardsToDraw; i++) {
    if (player.deck.length > 0) {
      newState = drawCardFromDeck(newState, playerId);
    } else {
      console.log(`${playerId}'s deck is empty, stopping draw effect`);
      break;
    }
  }
  
  return newState;
}

/**
 * Execute a damage deathrattle effect
 */
function executeDamageDeathrattle(
  state: GameState,
  deathrattle: DeathrattleEffect,
  playerId: 'player' | 'opponent'
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  const damageAmount = deathrattle.value || 1;
  const targets = deathrattle.targetType;
  
  // Determine the targets based on the deathrattle target type
  if (targets === 'all_enemies') {
    // The opponent player is the enemy of the current player
    const enemyId = playerId === 'player' ? 'opponent' : 'player';
    const enemyPlayer = newState.players[enemyId];
    
    // Deal damage to all enemy minions
    enemyPlayer.battlefield.forEach(minion => {
      // Handle divine shield
      if (minion.hasDivineShield) {
        minion.hasDivineShield = false;
        console.log(`Deathrattle: Divine shield absorbed damage on ${minion.card.name}`);
      } else {
        minion.currentHealth -= damageAmount;
        console.log(`Deathrattle: Dealt ${damageAmount} damage to ${minion.card.name}`);
      }
    });
    
    // Deal damage to enemy hero
    enemyPlayer.health -= damageAmount;
    console.log(`Deathrattle: Dealt ${damageAmount} damage to ${enemyId} hero`);
  } else if (targets === 'all') {
    // Deal damage to all minions on both sides
    for (const playerKey of ['player', 'opponent'] as const) {
      newState.players[playerKey].battlefield.forEach(minion => {
        // Handle divine shield
        if (minion.hasDivineShield) {
          minion.hasDivineShield = false;
          console.log(`Deathrattle: Divine shield absorbed damage on ${minion.card.name}`);
        } else {
          minion.currentHealth -= damageAmount;
          console.log(`Deathrattle: Dealt ${damageAmount} damage to ${minion.card.name}`);
        }
      });
    }
  } else if (targets === 'enemy_hero') {
    // Deal damage to enemy hero only
    const enemyId = playerId === 'player' ? 'opponent' : 'player';
    newState.players[enemyId].health -= damageAmount;
    console.log(`Deathrattle: Dealt ${damageAmount} damage to ${enemyId} hero`);
  }
  
  // Check if any minions died as a result of the deathrattle damage
  for (const playerKey of ['player', 'opponent'] as const) {
    const deadMinions = newState.players[playerKey].battlefield.filter(minion => minion.currentHealth <= 0);
    if (deadMinions.length > 0) {
      // Remove dead minions from the battlefield
      newState.players[playerKey].battlefield = newState.players[playerKey].battlefield.filter(
        minion => minion.currentHealth > 0
      );
      
      // Add them to the graveyard (but don't trigger more deathrattles to avoid loops)
      if (!newState.players[playerKey].graveyard) {
        newState.players[playerKey].graveyard = [];
      }
      newState.players[playerKey].graveyard = [
        ...newState.players[playerKey].graveyard,
        ...deadMinions
      ];
      
      console.log(`Deathrattle: ${deadMinions.length} minions died from deathrattle damage`);
    }
  }
  
  // Also check for hero death (game over)
  if (newState.players.player.health <= 0) {
    newState.gamePhase = "game_over";
    newState.winner = 'opponent';
    console.log('Game over: Player died from deathrattle damage');
  } else if (newState.players.opponent.health <= 0) {
    newState.gamePhase = "game_over";
    newState.winner = 'player';
    console.log('Game over: Opponent died from deathrattle damage');
  }
  
  return newState;
}

/**
 * Execute a heal deathrattle effect
 */
function executeHealDeathrattle(
  state: GameState,
  deathrattle: DeathrattleEffect,
  playerId: 'player' | 'opponent'
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  const healAmount = deathrattle.value || 1;
  const targets = deathrattle.targetType;
  
  // Determine the targets based on the deathrattle target type
  if (targets === 'all_friendly') {
    const currentPlayer = newState.players[playerId];
    
    // Heal all friendly minions
    currentPlayer.battlefield.forEach(minion => {
      minion.currentHealth = Math.min(minion.currentHealth + healAmount, minion.card.health);
      console.log(`Deathrattle: Healed ${minion.card.name} for ${healAmount}`);
    });
    
    // Heal friendly hero
    currentPlayer.health = Math.min(currentPlayer.health + healAmount, 30); // 30 is max health
    console.log(`Deathrattle: Healed ${playerId} hero for ${healAmount}`);
  } else if (targets === 'all') {
    // Heal all minions and heroes
    for (const playerKey of ['player', 'opponent'] as const) {
      newState.players[playerKey].battlefield.forEach(minion => {
        minion.currentHealth = Math.min(minion.currentHealth + healAmount, minion.card.health);
        console.log(`Deathrattle: Healed ${minion.card.name} for ${healAmount}`);
      });
      
      newState.players[playerKey].health = Math.min(newState.players[playerKey].health + healAmount, 30);
      console.log(`Deathrattle: Healed ${playerKey} hero for ${healAmount}`);
    }
  } else if (targets === 'friendly_hero') {
    // Heal friendly hero only
    newState.players[playerId].health = Math.min(newState.players[playerId].health + healAmount, 30);
    console.log(`Deathrattle: Healed ${playerId} hero for ${healAmount}`);
  }
  
  return newState;
}

/**
 * Execute a buff deathrattle effect
 */
function executeBuffDeathrattle(
  state: GameState,
  deathrattle: DeathrattleEffect,
  playerId: 'player' | 'opponent'
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Buff values with fallbacks to 0
  const attackBuff = deathrattle.buffAttack || 0;
  const healthBuff = deathrattle.buffHealth || 0;
  
  if (attackBuff === 0 && healthBuff === 0) {
    console.warn('Deathrattle buff effect has no attack or health changes');
    return state;
  }
  
  const player = newState.players[playerId];
  
  // Apply buff to all friendly minions
  player.battlefield.forEach(minion => {
    // Increase attack
    if (attackBuff !== 0) {
      minion.card.attack += attackBuff;
    }
    
    // Increase max health and current health
    if (healthBuff !== 0) {
      minion.card.health += healthBuff;
      minion.currentHealth += healthBuff;
    }
    
    console.log(`Deathrattle: Buffed ${minion.card.name} with +${attackBuff}/+${healthBuff}`);
  });
  
  return newState;
}

/**
 * Execute a divine shield deathrattle effect
 */
function executeGiveDivineShieldDeathrattle(
  state: GameState,
  deathrattle: DeathrattleEffect,
  playerId: 'player' | 'opponent'
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  const targetType = deathrattle.targetType || 'friendly_minions';
  
  // Determine the targets based on the target type
  if (targetType === 'friendly_minions') {
    // Give divine shield to all friendly minions
    const currentPlayer = newState.players[playerId];
    
    if (currentPlayer.battlefield) {
      currentPlayer.battlefield.forEach(minion => {
        minion.hasDivineShield = true;
        console.log(`Deathrattle: Gave divine shield to ${minion.card.name}`);
      });
    }
  } else if (targetType === 'all_minions') {
    // Give divine shield to all minions on both sides
    for (const playerKey of ['player', 'opponent'] as const) {
      const playerState = newState.players[playerKey];
      
      if (playerState.battlefield) {
        playerState.battlefield.forEach(minion => {
          minion.hasDivineShield = true;
          console.log(`Deathrattle: Gave divine shield to ${minion.card.name}`);
        });
      }
    }
  } else if (targetType === 'random_friendly_minion') {
    // Give divine shield to a random friendly minion
    const currentPlayer = newState.players[playerId];
    
    if (currentPlayer.battlefield && currentPlayer.battlefield.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentPlayer.battlefield.length);
      const targetMinion = currentPlayer.battlefield[randomIndex];
      
      targetMinion.hasDivineShield = true;
      console.log(`Deathrattle: Gave divine shield to ${targetMinion.card.name} (random friendly minion)`);
    }
  }
  
  return newState;
}

/**
 * Execute a mind control deathrattle effect
 */
function executeMindControlDeathrattle(
  state: GameState,
  deathrattle: DeathrattleEffect,
  playerId: 'player' | 'opponent'
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // The opponent of the current player
  const opponentId = playerId === 'player' ? 'opponent' : 'player';
  
  // Get references to both players
  const currentPlayer = newState.players[playerId];
  const opponentPlayer = newState.players[opponentId];
  
  // Default target type is random_enemy_minion if not specified
  const targetType = deathrattle.targetType || 'random_enemy_minion';
  
  if (targetType === 'random_enemy_minion') {
    // Check if opponent has any minions
    if (!opponentPlayer.battlefield || opponentPlayer.battlefield.length === 0) {
      console.log('No enemy minions to mind control');
      return newState;
    }
    
    // Check if current player has room for a new minion
    if (currentPlayer.battlefield && currentPlayer.battlefield.length >= 7) {
      console.log(`${playerId}'s battlefield is full, cannot mind control`);
      return newState;
    }
    
    // Select a random enemy minion
    const randomIndex = Math.floor(Math.random() * opponentPlayer.battlefield.length);
    const targetMinion = opponentPlayer.battlefield[randomIndex];
    
    // Remove the minion from opponent's battlefield
    opponentPlayer.battlefield = opponentPlayer.battlefield.filter(
      (minion) => minion.instanceId !== targetMinion.instanceId
    );
    
    // Add the minion to current player's battlefield
    currentPlayer.battlefield = currentPlayer.battlefield || [];
    currentPlayer.battlefield.push(targetMinion);
    
    // The minion has just been mind-controlled, so it can't attack this turn
    targetMinion.canAttack = false;
    targetMinion.isSummoningSick = true;
    
    console.log(`Deathrattle: Mind controlled ${targetMinion.card.name} from ${opponentId} to ${playerId}`);
  }
  
  return newState;
}

/**
 * Check if a card should trigger its deathrattle
 */
// Helper function to safely check for undefined battlefield
function safeBattlefield(battlefield: CardInstance[] | undefined): CardInstance[] {
  return battlefield || [];
}

// Helper function to safely check for undefined health
function safeHealth(health: number | undefined): number {
  return health !== undefined ? health : 30; // Default health is 30
}

// Helper function to safely update health with a minimum of 0
function updateHealth(currentHealth: number | undefined, change: number, maxHealth?: number): number {
  const health = currentHealth !== undefined ? currentHealth : 30;
  const result = maxHealth !== undefined ? 
    Math.min(Math.max(health + change, 0), maxHealth) : 
    Math.max(health + change, 0);
  return result;
}

// Helper function to safely check for undefined current health
function safeCurrentHealth(minion: CardInstance): number {
  return minion.currentHealth !== undefined ? minion.currentHealth : (minion.card.health || 1);
}

// Helper function to safely set divine shield
function setDivineShield(minion: CardInstance, value: boolean): void {
  minion.hasDivineShield = value;
}

/**
 * Check if a card should trigger its deathrattle
 */
export function shouldTriggerDeathrattle(card: CardInstance): boolean {
  return (
    card.card.keywords?.includes('deathrattle') === true && 
    card.card.deathrattle !== undefined
  );
}