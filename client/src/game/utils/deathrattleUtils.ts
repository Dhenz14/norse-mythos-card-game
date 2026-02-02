import { CardInstance, GameState, CardData, DeathrattleEffect, CardAnimationType, GameLogEvent, AnimationParams, MinionCardData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createCardInstance } from './cards/cardUtils';
import { drawCardFromDeck } from './zoneUtils';
import allCards from '../data/allCards';
import { trackQuestProgress } from './quests/questProgress';

/**
 * Execute deathrattle effects for a card
 */
export function executeDeathrattle(
  state: GameState,
  card: CardInstance,
  playerId: 'player' | 'opponent'
): GameState {
  // If the card is not a minion, return the original state
  if (card.card.type !== 'minion') {
    console.log(`[Deathrattle] Skipped: ${card.card.name} is not a minion`);
    return state;
  }
  
  // Get the deathrattle from the minion card
  const minionCard = card.card as MinionCardData;
  
  // Check for deathrattle keyword OR deathrattle effect (some cards may have one without the other)
  const hasDeathrattleKeyword = minionCard.keywords?.includes('deathrattle') === true;
  const hasDeathrattleEffect = minionCard.deathrattle !== undefined;
  
  if (!hasDeathrattleKeyword && !hasDeathrattleEffect) {
    return state;
  }
  
  // If keyword exists but no effect, log warning
  if (hasDeathrattleKeyword && !hasDeathrattleEffect) {
    console.warn(`[Deathrattle] Card ${card.card.name} has deathrattle keyword but no effect defined!`);
    return state;
  }
  
  // If effect exists but no keyword, still execute but log for debugging
  if (!hasDeathrattleKeyword && hasDeathrattleEffect) {
    console.warn(`[Deathrattle] Card ${card.card.name} has deathrattle effect but no keyword - executing anyway`);
  }
  
  console.log(`[Deathrattle] Triggered: ${card.card.name} (ID: ${card.card.id}) - Effect: ${minionCard.deathrattle!.type}`, minionCard.deathrattle);


  // Create a deep copy of the state to safely modify
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Process the deathrattle based on its type
  const deathrattle = minionCard.deathrattle!;
  
  // Add deathrattle animation to the queue if animations are supported
  if ((newState as any).animations) {
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
      type: 'deathrattle' as const,
      sourceId: card.card.id.toString(),
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
    (newState as any).animations.push(deathrattleAnimation);
  }
  
  // Add to game log if it exists
  if (newState.gameLog) {
    newState.gameLog.push({
      id: uuidv4(),
      type: 'deathrattle',
      player: playerId,
      text: `${card.card.name} triggered its deathrattle: ${deathrattle.type}`,
      timestamp: Date.now(),
      turn: newState.turnNumber,
      cardId: card.card.id.toString()
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
  
  const cardToSummon = allCards.find(card => card.id === deathrattle.summonCardId);
  
  if (!cardToSummon) {
    console.error(`Card with ID ${deathrattle.summonCardId} not found in the database`);
    return state;
  }
  
  const player = newState.players[playerId];
  
  // Check if there's room on the battlefield (max 7 minions)
  if (player.battlefield.length >= 7) {
    return newState;
  }
  
  // Determine how many copies to summon (default to 1 if not specified)
  const summonCount = deathrattle.value || 1;
  
  // Create and add instances for each summon, up to the battlefield limit
  for (let i = 0; i < summonCount; i++) {
    // Check battlefield space again on each iteration
    if (player.battlefield.length >= 7) {
      break;
    }
    
    // Create a new instance of the card to summon
    const summonedCard = createCardInstance(cardToSummon);
    
    // Add the summoned card to the battlefield
    player.battlefield.push(summonedCard);
    
    // Track quest progress for summoned minion
    trackQuestProgress(playerId, 'summon_minion', summonedCard.card);
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
  
  
  // Check if player has enough cards in deck
  const player = newState.players[playerId];
  
  if (player.deck.length === 0) {
    // In Hearthstone, drawing from an empty deck causes fatigue damage
    // For simplicity, we'll just skip the draw without causing fatigue damage
    return newState;
  }
  
  // Draw the specified number of cards, but stop if deck is empty
  for (let i = 0; i < cardsToDraw; i++) {
    if (player.deck.length > 0) {
      newState = drawCardFromDeck(newState, playerId);
    } else {
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
      } else {
        const currentHealth = minion.currentHealth ?? (minion.card.type === 'minion' ? minion.card.health : 0) ?? 0;
        minion.currentHealth = currentHealth - damageAmount;
      }
    });
    
    // Deal damage to enemy hero
    enemyPlayer.health -= damageAmount;
  } else if (targets === 'all') {
    // Deal damage to all minions on both sides
    for (const playerKey of ['player', 'opponent'] as const) {
      newState.players[playerKey].battlefield.forEach(minion => {
        // Handle divine shield
        if (minion.hasDivineShield) {
          minion.hasDivineShield = false;
        } else {
          const currentHealth = minion.currentHealth ?? (minion.card.type === 'minion' ? minion.card.health : 0) ?? 0;
          minion.currentHealth = currentHealth - damageAmount;
        }
      });
    }
  } else if (targets === 'enemy_hero') {
    // Deal damage to enemy hero only
    const enemyId = playerId === 'player' ? 'opponent' : 'player';
    newState.players[enemyId].health -= damageAmount;
  }
  
  // Check if any minions died as a result of the deathrattle damage
  // Note: Chained deathrattles from AOE damage are NOT processed here to prevent infinite loops.
  // The game uses a sequential resolution model where deaths from deathrattles are moved to graveyard
  // but their deathrattles are deferred until the next combat phase check.
  // This matches Hearthstone's behavior where simultaneous deaths resolve together.
  
  for (const playerKey of ['player', 'opponent'] as const) {
    const deadMinions = newState.players[playerKey].battlefield.filter(minion => (minion.currentHealth ?? 0) <= 0);
    if (deadMinions.length > 0) {
      // Remove dead minions from the battlefield
      newState.players[playerKey].battlefield = newState.players[playerKey].battlefield.filter(
        minion => (minion.currentHealth ?? 0) > 0
      );
      
      // Add them to the graveyard
      if (!newState.players[playerKey].graveyard) {
        newState.players[playerKey].graveyard = [];
      }
      newState.players[playerKey].graveyard = [
        ...newState.players[playerKey].graveyard,
        ...deadMinions
      ];
      
      // Log deaths with deathrattles for debugging - these will be handled by the combat resolution phase
      for (const minion of deadMinions) {
        if (shouldTriggerDeathrattle(minion)) {
          console.log(`[Deathrattle] Minion ${minion.card.name} died from AOE damage - deathrattle queued for combat resolution`);
          // Mark on the state that there are pending deathrattles to process
          if (!(newState as any).pendingDeathrattles) {
            (newState as any).pendingDeathrattles = [];
          }
          (newState as any).pendingDeathrattles.push({ 
            minion, 
            playerId: playerKey,
            source: 'aoe_damage'
          });
        }
      }
    }
  }
  
  // Also check for hero death (game over)
  if (newState.players.player.health <= 0) {
    newState.gamePhase = "game_over";
    newState.winner = 'opponent';
  } else if (newState.players.opponent.health <= 0) {
    newState.gamePhase = "game_over";
    newState.winner = 'player';
  }
  
  // Process pending deathrattles now (since we bypassed destroyCard for AOE deaths)
  // This is safe because processPendingDeathrattles handles the iteration itself
  return processPendingDeathrattles(newState);
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
      const currentHealth = minion.currentHealth ?? (minion.card.type === 'minion' ? minion.card.health : 0) ?? 0;
      const maxHealth = minion.card.type === 'minion' ? (minion.card.health ?? 0) : 0;
      minion.currentHealth = Math.min(currentHealth + healAmount, maxHealth);
    });
    
    // Heal friendly hero
    currentPlayer.health = Math.min(currentPlayer.health + healAmount, 30); // 30 is max health
  } else if (targets === 'all') {
    // Heal all minions and heroes
    for (const playerKey of ['player', 'opponent'] as const) {
      newState.players[playerKey].battlefield.forEach(minion => {
        const currentHealth = minion.currentHealth ?? (minion.card.type === 'minion' ? minion.card.health : 0) ?? 0;
        const maxHealth = minion.card.type === 'minion' ? (minion.card.health ?? 0) : 0;
        minion.currentHealth = Math.min(currentHealth + healAmount, maxHealth);
      });
      
      newState.players[playerKey].health = Math.min(newState.players[playerKey].health + healAmount, 30);
    }
  } else if (targets === 'friendly_hero') {
    // Heal friendly hero only
    newState.players[playerId].health = Math.min(newState.players[playerId].health + healAmount, 30);
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
    if (minion.card.type === 'minion') {
      const minionCard = minion.card as MinionCardData;
      // Increase attack
      if (attackBuff !== 0) {
        minionCard.attack = (minionCard.attack ?? 0) + attackBuff;
      }
      
      // Increase max health and current health
      if (healthBuff !== 0) {
        minionCard.health = (minionCard.health ?? 0) + healthBuff;
        minion.currentHealth = (minion.currentHealth ?? minionCard.health ?? 0) + healthBuff;
      }
    }
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
      });
    }
  } else if (targetType === 'all_minions') {
    // Give divine shield to all minions on both sides
    for (const playerKey of ['player', 'opponent'] as const) {
      const playerState = newState.players[playerKey];
      
      if (playerState.battlefield) {
        playerState.battlefield.forEach(minion => {
          minion.hasDivineShield = true;
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
      return newState;
    }
    
    // Check if current player has room for a new minion
    if (currentPlayer.battlefield && currentPlayer.battlefield.length >= 7) {
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
  if (minion.currentHealth !== undefined) {
    return minion.currentHealth;
  }
  if (minion.card.type === 'minion') {
    return (minion.card as MinionCardData).health ?? 1;
  }
  return 1;
}

// Helper function to safely set divine shield
function setDivineShield(minion: CardInstance, value: boolean): void {
  minion.hasDivineShield = value;
}

/**
 * Check if a card should trigger its deathrattle
 * Only returns true if the card has a deathrattle effect defined (not just keyword)
 */
export function shouldTriggerDeathrattle(card: CardInstance): boolean {
  if (card.card.type !== 'minion') {
    return false;
  }
  
  const minionCard = card.card as MinionCardData;
  const hasDeathrattleEffect = minionCard.deathrattle !== undefined;
  
  // Only trigger if effect exists - keyword-only cards are data errors
  if (!hasDeathrattleEffect) {
    const hasDeathrattleKeyword = minionCard.keywords?.includes('deathrattle') === true;
    if (hasDeathrattleKeyword) {
      console.warn(`[Deathrattle] Card ${card.card.name} has deathrattle keyword but no effect defined - data error`);
    }
  }
  
  return hasDeathrattleEffect;
}

/**
 * Process any pending deathrattles in the game state
 * This should be called at the end of combat resolution phases
 * Returns the updated state with pending deathrattles cleared
 */
export function processPendingDeathrattles(state: GameState): GameState {
  const pendingDeathrattles = (state as any).pendingDeathrattles as Array<{
    minion: CardInstance;
    playerId: 'player' | 'opponent';
    source: string;
  }> | undefined;
  
  if (!pendingDeathrattles || pendingDeathrattles.length === 0) {
    return state;
  }
  
  console.log(`[Deathrattle] Processing ${pendingDeathrattles.length} pending deathrattles`);
  
  let currentState = state;
  const MAX_ITERATIONS = 30; // Safety limit
  let iterations = 0;
  
  // Process pending deathrattles - each may create new ones
  while ((currentState as any).pendingDeathrattles?.length > 0 && iterations < MAX_ITERATIONS) {
    const queue = [...(currentState as any).pendingDeathrattles];
    (currentState as any).pendingDeathrattles = [];
    
    for (const { minion, playerId } of queue) {
      console.log(`[Deathrattle] Processing pending: ${minion.card.name} for ${playerId}`);
      currentState = executeDeathrattle(currentState, minion, playerId);
    }
    
    iterations++;
  }
  
  if (iterations >= MAX_ITERATIONS) {
    console.warn('[Deathrattle] Maximum iterations reached while processing pending deathrattles');
  }
  
  // Clear any remaining pending deathrattles
  delete (currentState as any).pendingDeathrattles;
  
  return currentState;
}