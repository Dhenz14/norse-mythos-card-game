import { debug } from '../config/debugConfig';
import { GameState, CardInstance, Player } from '../types';

/**
 * Finds the best possible move for the AI based on the current game state
 * This is a placeholder for more complex AI decision making in the future
 */
export function findBestMove(state: GameState, isPlayerTurn: boolean) {
  const currentPlayer = isPlayerTurn ? state.players.player : state.players.opponent;
  const opposingPlayer = isPlayerTurn ? state.players.opponent : state.players.player;
  
  // Find playable cards
  const playableCards = currentPlayer.hand.filter(card => 
    (card.card.manaCost ?? 0) <= currentPlayer.mana.current
  );
  
  // Find minions that can attack
  const attackingMinions = currentPlayer.battlefield.filter(minion => 
    minion.canAttack && !minion.isSummoningSick
  );
  
  // Simple heuristic for evaluating game state
  // (a more sophisticated evaluation function would be used in a real AI)
  const evaluateState = (state: GameState, isPlayerPerspective: boolean) => {
    const player = isPlayerPerspective ? state.players.player : state.players.opponent;
    const opponent = isPlayerPerspective ? state.players.opponent : state.players.player;
    
    // Simple score based on health, minions, and cards
    let score = 0;
    
    // Value health points
    score += player.health * 2;
    score -= opponent.health * 2;
    
    // Value minions on board (attack + health)
    player.battlefield.forEach(minion => {
      const attack = minion.card.type === 'minion' ? (minion.card.attack || 0) : 0;
      score += attack + (minion.currentHealth || 0);
    });
    
    opponent.battlefield.forEach(minion => {
      const attack = minion.card.type === 'minion' ? (minion.card.attack || 0) : 0;
      score -= attack + (minion.currentHealth || 0);
    });
    
    // Value cards in hand
    score += player.hand.length;
    
    return score;
  };
  
  // In a real implementation, this would use minimax or Monte Carlo Tree Search
  // to evaluate possible moves and choose the best one
  
  return {
    playableCards,
    attackingMinions,
    score: evaluateState(state, isPlayerTurn)
  };
}

/**
 * Enhanced AI implementation for AI vs AI gameplay
 */

export interface PlayOption {
  card: any;
  cardInstance: CardInstance | null;
  score: number;
  manaRemaining: number;
  target?: any; // Add target property for targeted cards
}

/**
 * Evaluates all possible cards that can be played and assigns a score to each
 */
export const evaluatePlayOptions = (gameState: GameState, playerIndex: number): PlayOption[] => {
  // Safety check for gameState and players
  if (!gameState || !gameState.players) {
    debug.error('[AI Utils] Invalid game state in evaluatePlayOptions:', gameState);
    return [];
  }
  
  // Handle older API format
  let currentPlayer = null;
  if (Array.isArray(gameState.players)) {
    currentPlayer = gameState.players[playerIndex];
  } else {
    currentPlayer = playerIndex === 0 ? gameState.players.player : gameState.players.opponent;
  }
  
  // Safety check for currentPlayer and hand
  if (!currentPlayer || !currentPlayer.hand) {
    debug.error('[AI Utils] Invalid player or hand data:', currentPlayer);
    return [];
  }
  
  const options: PlayOption[] = [];
  
  // Calculate available mana
  const availableMana = currentPlayer.mana?.current || currentPlayer.mana || 0;
  
  // Evaluate each card in hand
  for (const cardInstance of currentPlayer.hand) {
    if (!cardInstance || !cardInstance.card) {
      debug.warn('[AI Utils] Skipping invalid card instance in hand');
      continue;
    }
    
    const card = cardInstance.card;
    const manaCost = card.manaCost || 0;
    
    // Skip if not enough mana
    if (manaCost > availableMana) continue;
    
    // Simple scoring based on card type and stats
    let score = 0;
    
    if (card.type === 'minion') {
      // Base score is attack + health
      const attack = card.attack || 0;
      const health = card.health || 0;
      score = attack + health;
      
      // Bonus for keywords
      if (card.keywords) {
        if (card.keywords.includes('taunt')) score += 2;
        if (card.keywords.includes('divine_shield')) score += 3;
        if (card.keywords.includes('charge')) score += 2;
        if (card.keywords.includes('windfury')) score += 2;
      }
      
      // Mana efficiency bonus (stats per mana)
      if (manaCost > 0) {
        score += (attack + health) / manaCost;
      }
    } else if (card.type === 'spell') {
      // Simple estimate for spells
      score = manaCost * 1.5; // Assume spells are slightly better than minions for same cost
    } else if (card.type === 'weapon') {
      // For weapons, consider durability and attack
      const attack = card.attack || 0;
      const durability = card.durability || 0;
      score = attack * durability;
    }
    
    // Get opponent battlefield
    let opponentBattlefield = [];
    if (Array.isArray(gameState.players)) {
      opponentBattlefield = gameState.players[playerIndex === 0 ? 1 : 0].battlefield || [];
    } else {
      opponentBattlefield = playerIndex === 0 ? 
        gameState.players.opponent.battlefield || [] : 
        gameState.players.player.battlefield || [];
    }
    
    // Adjust score based on board state
    const opponentMinionCount = opponentBattlefield.length;
    const playerMinionCount = currentPlayer.battlefield?.length || 0;
    
    // If opponent has many minions, prioritize boardclears and taunts
    if (opponentMinionCount > 3 && card.type === 'spell') {
      score += 5; // Assume it might be a board clear
    }
    
    // If we have few minions, prioritize playing minions
    if (playerMinionCount < 2 && card.type === 'minion') {
      score += 3;
    }
    
    // If the card costs all available mana, slightly penalize (prefer playing multiple cards)
    if (manaCost === availableMana && availableMana > 3) {
      score -= 1;
    }
    
    // Create the play option
    const option: PlayOption = {
      card,
      cardInstance,
      score,
      manaRemaining: availableMana - manaCost
    };
    
    // If the card requires a target, select one
    if (card.battlecry?.requiresTarget || card.targetType) {
      // For now just select first valid target or hero
      // In the future, this should do more sophisticated target selection
      if (opponentBattlefield.length > 0) {
        // Target the minion with the highest attack
        const targetMinion = [...opponentBattlefield].sort((a, b) => 
          (b.card?.attack || 0) - (a.card?.attack || 0)
        )[0];
        
        if (targetMinion) {
          option.target = {
            instanceId: targetMinion.instanceId,
            name: targetMinion.card?.name || 'Unknown Minion',
            type: 'minion'
          };
        }
      } else {
        // Target enemy hero
        option.target = {
          instanceId: playerIndex === 0 ? 'hero2' : 'hero1',
          name: 'Enemy Hero',
          type: 'hero'
        };
      }
    }
    
    options.push(option);
  }
  
  return options;
};

/**
 * Determines the best play option based on current game state
 */
export const playAITurn = (gameState: GameState, playerIndex: number) => {
  if (!gameState || !gameState.players) {
    debug.error('[AI Utils] Invalid game state in playAITurn:', gameState);
    return null;
  }
  
  // Find best options to play
  const playOptions = evaluatePlayOptions(gameState, playerIndex);
  
  // Sort by score (highest first)
  playOptions.sort((a, b) => b.score - a.score);
  
  return playOptions.length > 0 ? playOptions[0] : null;
};