import { v4 as uuidv4 } from 'uuid';
import { 
  GameState, 
  CardInstance, 
  CardData, 
  GameLogEvent, 
  PlayerState,
  CardType
} from '../../types';
import { destroyCard } from '../zoneUtils';
import { calculateDamageTaken } from './statusEffectUtils';
import { isMinion, getHealth } from '../cards/typeGuards';

/**
 * Utility function to handle damage dealing to heroes or minions
 * Properly accounts for armor before health
 */
export function dealDamage(
  state: GameState,
  targetPlayerId: 'player' | 'opponent',
  targetType: 'hero' | 'minion',
  amount: number,
  targetInstanceId?: string, // For minions
  sourceCardId?: number,
  sourcePlayerId?: 'player' | 'opponent'
): GameState {
  const newState = { ...state };
  const target = newState.players[targetPlayerId];
  
  if (targetType === 'hero') {
    // Damage to hero - handle armor
    return dealDamageToHero(newState, targetPlayerId, amount, sourceCardId, sourcePlayerId);
  } else if (targetInstanceId) {
    // Damage to minion
    return dealDamageToMinion(newState, targetPlayerId, targetInstanceId, amount, sourceCardId, sourcePlayerId);
  } else {
    console.error('Invalid target for damage: missing targetInstanceId for minion');
    return newState;
  }
}

/**
 * Deal damage to a hero, handling armor absorption
 */
export function dealDamageToHero(
  state: GameState,
  targetPlayerId: 'player' | 'opponent',
  amount: number,
  sourceCardId?: number,
  sourcePlayerId?: 'player' | 'opponent'
): GameState {
  const newState = { ...state };
  const targetPlayer = newState.players[targetPlayerId];
  
  // First check if player has armor
  const armorAmount = targetPlayer.heroArmor || 0;
  let remainingDamage = amount;
  let armorAbsorbed = 0;
  
  // Armor absorbs damage first
  if (armorAmount > 0) {
    if (armorAmount >= remainingDamage) {
      // Armor absorbs all damage
      armorAbsorbed = remainingDamage;
      targetPlayer.heroArmor = armorAmount - remainingDamage;
      remainingDamage = 0;
    } else {
      // Armor absorbs some damage
      armorAbsorbed = armorAmount;
      targetPlayer.heroArmor = 0;
      remainingDamage = remainingDamage - armorAmount;
    }
  }
  
  // Apply remaining damage to health
  if (remainingDamage > 0) {
    targetPlayer.heroHealth = Math.max(0, (targetPlayer.heroHealth ?? 0) - remainingDamage);
  }
  
  // Add to game log
  if (!newState.gameLog) newState.gameLog = [];
  
  newState.gameLog.push({
    id: uuidv4(),
    type: 'damage',
    player: sourcePlayerId ?? 'player',
    text: `${sourcePlayerId ? 'Player ' + sourcePlayerId : 'Something'} dealt ${amount} damage to ${targetPlayerId}'s hero${armorAbsorbed > 0 ? ` (${armorAbsorbed} absorbed by armor)` : ''}.`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
  });
  
  // Check for game over
  if ((targetPlayer.heroHealth ?? 0) <= 0) {
    newState.gamePhase = 'game_over';
    newState.winner = targetPlayerId === 'player' ? 'opponent' : 'player';
    
    // Add game over event to log
    newState.gameLog.push({
      id: uuidv4(),
      type: 'effect',
      player: sourcePlayerId ?? 'player',
      text: `Game over! ${newState.winner} wins!`,
      timestamp: Date.now(),
      turn: newState.turnNumber
    });
  }
  
  return newState;
}

/**
 * Deal damage to a minion
 */
export function dealDamageToMinion(
  state: GameState,
  targetPlayerId: 'player' | 'opponent',
  targetInstanceId: string,
  amount: number,
  sourceCardId?: number,
  sourcePlayerId?: 'player' | 'opponent'
): GameState {
  const newState = { ...state };
  const battlefield = newState.players[targetPlayerId].battlefield;
  
  if (!battlefield) return newState;
  
  const targetIndex = battlefield.findIndex((card: CardInstance) => card.instanceId === targetInstanceId);
  if (targetIndex === -1) return newState;
  
  // Create a copy of the target card for safer modification
  const targetCard = { ...battlefield[targetIndex] };
  
  // Apply status effect damage modifiers (Vulnerable: +3, Bleed: +3)
  let modifiedAmount = amount;
  if (targetCard.isVulnerable) {
    modifiedAmount += 3;
  }
  if (targetCard.isBleeding) {
    modifiedAmount += 3;
  }
  amount = modifiedAmount;
  
  // Check for Divine Shield (prevents damage)
  if (targetCard.hasDivineShield) {
    // Remove Divine Shield instead of taking damage
    targetCard.hasDivineShield = false;
    
    // Update the card in the battlefield
    battlefield[targetIndex] = targetCard;
    
    // Add to game log
    if (!newState.gameLog) newState.gameLog = [];
    
    newState.gameLog.push({
      id: uuidv4(),
      type: 'effect',
      player: sourcePlayerId ?? 'player',
      text: `${targetCard.card.name}'s Divine Shield blocked ${amount} damage.`,
      timestamp: Date.now(),
      turn: newState.turnNumber,
    });
    
    return newState;
  }
  
  // Apply damage
  if (targetCard.currentHealth !== undefined) {
    // Ensure we're using a valid number for health calculation
    const maxHealth = getHealth(targetCard.card);
    const oldHealth = targetCard.currentHealth || maxHealth || 0;
    const newHealth = Math.max(0, oldHealth - amount);
    
    // Update the health in our copy
    targetCard.currentHealth = newHealth;
    
    // Update the actual card in the battlefield (Mountain Giant fix)
    battlefield[targetIndex] = targetCard;
    
    // Debug log
  }
  
  // Add to game log
  if (!newState.gameLog) newState.gameLog = [];
  
  newState.gameLog.push({
    id: uuidv4(),
    type: 'damage',
    player: sourcePlayerId ?? 'player',
    text: `${sourcePlayerId ? 'Player ' + sourcePlayerId : 'Something'} dealt ${amount} damage to ${targetCard.card.name}. (${targetCard.currentHealth} HP remaining)`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    targetId: targetInstanceId,
  });
  
  // Handle death if health is 0
  if (targetCard.currentHealth === 0) {
    return handleMinionDeath(newState, targetPlayerId, targetIndex);
  }
  
  return newState;
}

/**
 * Handle the death of a minion
 * Using destroyCard to ensure consistent deathrattle processing
 */
export function handleMinionDeath(
  state: GameState,
  targetPlayerId: 'player' | 'opponent',
  targetIndex: number
): GameState {
  const battlefield = state.players[targetPlayerId].battlefield;
  
  if (!battlefield || targetIndex < 0 || targetIndex >= battlefield.length) {
    return state;
  }
  
  // Get the dead minion's instance ID
  const deadMinion = battlefield[targetIndex];
  const minionId = deadMinion.instanceId;
  
  // Use destroyCard to handle the minion death properly, including deathrattle effects
  // This ensures consistency in death processing across the codebase
  return destroyCard(state, minionId, targetPlayerId);
}

/**
 * Deal damage to all enemy minions
 */
export function dealDamageToAllEnemyMinions(
  state: GameState,
  attackingPlayerId: 'player' | 'opponent',
  amount: number,
  sourceCardId?: number
): GameState {
  const newState = { ...state };
  const defendingPlayerId = attackingPlayerId === 'player' ? 'opponent' : 'player';
  const playerMinions = newState.players[defendingPlayerId].battlefield;
  
  if (!playerMinions || playerMinions.length === 0) {
    return newState;
  }
  
  // Store minions that need to have damage applied
  // Using a separate array to avoid issues with Divine Shield blocking
  const minionsToUpdate: { minion: CardInstance; index: number }[] = [];
  
  // First, check Divine Shield and record damage to apply
  playerMinions.forEach((minion: CardInstance, index: number) => {
    // Create a copy for modification
    const minionCopy = { ...minion };
    
    if (minionCopy.hasDivineShield) {
      // Divine Shield blocks the damage
      minionCopy.hasDivineShield = false;
      
      // Add to game log
      if (!newState.gameLog) newState.gameLog = [];
      
      newState.gameLog.push({
        id: uuidv4(),
        type: 'effect',
        player: attackingPlayerId,
        text: `${minionCopy.card.name}'s Divine Shield blocked ${amount} damage.`,
        timestamp: Date.now(),
        turn: newState.turnNumber,
      });
    } else if (minionCopy.currentHealth !== undefined) {
      // Apply damage calculation
      const oldHealth = minionCopy.currentHealth;
      minionCopy.currentHealth = Math.max(0, minionCopy.currentHealth - amount);
      
      // Add to game log
      if (!newState.gameLog) newState.gameLog = [];
      
      newState.gameLog.push({
        id: uuidv4(),
        type: 'damage',
        player: attackingPlayerId,
        turn: newState.turnNumber,
        timestamp: Date.now(),
        text: `${amount} damage was dealt to ${minionCopy.card.name} (${oldHealth} -> ${minionCopy.currentHealth})`,
        targetId: minionCopy.instanceId,
      });
    }
    
    // Add the copy to our update array with its index
    minionsToUpdate.push({ minion: minionCopy, index });
  });
  
  // Apply all the changes to the actual state
  minionsToUpdate.forEach(({ minion, index }) => {
    // Update the minion in the actual battlefield
    playerMinions[index] = minion;
  });
  
  // Handle any deaths using destroyCard to ensure consistent deathrattle processing
  const deadMinionIds: string[] = [];
  playerMinions.forEach((minion: CardInstance) => {
    if (minion.currentHealth === 0) {
      deadMinionIds.push(minion.instanceId);
    }
  });
  
  // Process deaths one by one using destroyCard
  // Note: We create a new state for each destroyed minion to ensure proper handling
  let updatedState = newState;
  deadMinionIds.forEach(minionId => {
    updatedState = destroyCard(updatedState, minionId, defendingPlayerId);
  });
  
  return updatedState;
}

/**
 * Deal damage to all minions (both players)
 */
export function dealDamageToAllMinions(
  state: GameState,
  amount: number,
  sourceCardId?: number,
  sourcePlayerId?: 'player' | 'opponent'
): GameState {
  const newState = { ...state };
  
  // Deal damage to player minions
  const playerMinions = newState.players.player.battlefield;
  if (playerMinions && playerMinions.length > 0) {
    // Store minions that need to have damage applied
    const playerMinionsToUpdate: { minion: CardInstance; index: number }[] = [];
    
    // First, check Divine Shield and record damage to apply
    playerMinions.forEach((minion: CardInstance, index: number) => {
      // Create a copy for modification
      const minionCopy = { ...minion };
      
      if (minionCopy.hasDivineShield) {
        // Divine Shield blocks the damage
        minionCopy.hasDivineShield = false;
        
        // Add to game log
        if (!newState.gameLog) newState.gameLog = [];
        
        newState.gameLog.push({
          id: uuidv4(),
          type: 'effect',
          player: sourcePlayerId ?? 'player',
          text: `${minionCopy.card.name}'s Divine Shield blocked ${amount} damage.`,
          timestamp: Date.now(),
          turn: newState.turnNumber,
        });
      } else if (minionCopy.currentHealth !== undefined) {
        // Apply damage calculation
        const oldHealth = minionCopy.currentHealth;
        minionCopy.currentHealth = Math.max(0, minionCopy.currentHealth - amount);
        
        // Add to game log
        if (!newState.gameLog) newState.gameLog = [];
        
        newState.gameLog.push({
          id: uuidv4(),
          type: 'damage',
          player: sourcePlayerId ?? 'player',
          turn: newState.turnNumber,
          timestamp: Date.now(),
          text: `${amount} damage was dealt to ${minionCopy.card.name} (${oldHealth} -> ${minionCopy.currentHealth})`,
          targetId: minionCopy.instanceId,
        });
      }
      
      // Add the copy to our update array with its index
      playerMinionsToUpdate.push({ minion: minionCopy, index });
    });
    
    // Apply all the changes to the actual state
    playerMinionsToUpdate.forEach(({ minion, index }: { minion: CardInstance; index: number }) => {
      // Update the minion in the actual battlefield
      playerMinions[index] = minion;
    });
  }
  
  // Deal damage to opponent minions
  const opponentMinions = newState.players.opponent.battlefield;
  if (opponentMinions && opponentMinions.length > 0) {
    // Store minions that need to have damage applied
    const opponentMinionsToUpdate: { minion: CardInstance; index: number }[] = [];
    
    // First, check Divine Shield and record damage to apply
    opponentMinions.forEach((minion: CardInstance, index: number) => {
      // Create a copy for modification
      const minionCopy = { ...minion };
      
      if (minionCopy.hasDivineShield) {
        // Divine Shield blocks the damage
        minionCopy.hasDivineShield = false;
        
        // Add to game log
        if (!newState.gameLog) newState.gameLog = [];
        
        newState.gameLog.push({
          id: uuidv4(),
          type: 'effect',
          player: sourcePlayerId ?? 'player',
          text: `${minionCopy.card.name}'s Divine Shield blocked ${amount} damage.`,
          timestamp: Date.now(),
          turn: newState.turnNumber,
        });
      } else if (minionCopy.currentHealth !== undefined) {
        // Apply damage calculation
        const oldHealth = minionCopy.currentHealth;
        minionCopy.currentHealth = Math.max(0, minionCopy.currentHealth - amount);
        
        // Add to game log
        if (!newState.gameLog) newState.gameLog = [];
        
        newState.gameLog.push({
          id: uuidv4(),
          type: 'damage',
          player: sourcePlayerId ?? 'player',
          turn: newState.turnNumber,
          timestamp: Date.now(),
          text: `${amount} damage was dealt to ${minionCopy.card.name} (${oldHealth} -> ${minionCopy.currentHealth})`,
          targetId: minionCopy.instanceId,
        });
      }
      
      // Add the copy to our update array with its index
      opponentMinionsToUpdate.push({ minion: minionCopy, index });
    });
    
    // Apply all the changes to the actual state
    opponentMinionsToUpdate.forEach(({ minion, index }) => {
      // Update the minion in the actual battlefield
      opponentMinions[index] = minion;
    });
  }
  
  // Handle any deaths using destroyCard to ensure consistent deathrattle processing
  // Process player minion deaths
  const playerDeadMinionIds: string[] = [];
  if (playerMinions) {
    playerMinions.forEach((minion: CardInstance) => {
      if (minion.currentHealth === 0) {
        playerDeadMinionIds.push(minion.instanceId);
      }
    });
  }
  
  // Process opponent minion deaths  
  const opponentDeadMinionIds: string[] = [];
  if (opponentMinions) {
    opponentMinions.forEach((minion: CardInstance) => {
      if (minion.currentHealth === 0) {
        opponentDeadMinionIds.push(minion.instanceId);
      }
    });
  }
  
  // Process deaths one by one using destroyCard to ensure proper deathrattle processing
  // We need to handle all deaths in a single state to ensure consistency
  let updatedState = newState;
  
  // Process player deaths first
  playerDeadMinionIds.forEach(minionId => {
    updatedState = destroyCard(updatedState, minionId, 'player');
  });
  
  // Then process opponent deaths
  opponentDeadMinionIds.forEach(minionId => {
    updatedState = destroyCard(updatedState, minionId, 'opponent');
  });
  
  return updatedState;
}

/**
 * Add armor to a hero
 */
export function addArmor(
  state: GameState,
  targetPlayerId: 'player' | 'opponent',
  amount: number,
  sourceCardId?: number
): GameState {
  const newState = { ...state };
  const targetPlayer = newState.players[targetPlayerId];
  
  // Add armor
  targetPlayer.heroArmor = (targetPlayer.heroArmor || 0) + amount;
  
  // Add to game log
  if (!newState.gameLog) newState.gameLog = [];
  
  newState.gameLog.push({
    id: uuidv4(),
    type: 'buff',
    player: targetPlayerId,
    text: `${targetPlayerId} gained ${amount} armor.`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
  });
  
  return newState;
}

/**
 * Set a hero's max health and current health to a specific value
 * Used by cards like Amara, Warden of Hope
 */
export function setHeroHealth(
  state: GameState,
  targetPlayerId: 'player' | 'opponent',
  amount: number,
  sourceCardId?: number
): GameState {
  const newState = { ...state };
  const targetPlayer = newState.players[targetPlayerId];
  
  // Set health
  targetPlayer.heroHealth = amount;
  
  // Add to game log
  if (!newState.gameLog) newState.gameLog = [];
  
  newState.gameLog.push({
    id: uuidv4(),
    type: 'heal',
    player: targetPlayerId,
    text: `${targetPlayerId}'s health was set to ${amount}.`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
  });
  
  return newState;
}

/**
 * Heal a hero
 */
export function healHero(
  state: GameState,
  targetPlayerId: 'player' | 'opponent',
  amount: number,
  sourceCardId?: number
): GameState {
  const newState = { ...state };
  const targetPlayer = newState.players[targetPlayerId];
  
  // Calculate actual healing (can't go above max health)
  const maxHealth = 30; // Default max health in Hearthstone
  const currentHealth = targetPlayer.heroHealth ?? 0;
  const actualHealing = Math.min(amount, maxHealth - currentHealth);
  
  if (actualHealing <= 0) {
    return newState; // No healing needed
  }
  
  // Apply healing
  targetPlayer.heroHealth = (targetPlayer.heroHealth ?? 0) + actualHealing;
  
  // Add to game log
  if (!newState.gameLog) newState.gameLog = [];
  
  newState.gameLog.push({
    id: uuidv4(),
    type: 'heal',
    player: targetPlayerId,
    text: `${targetPlayerId} was healed for ${actualHealing}.`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
  });
  
  return newState;
}

/**
 * Heal a minion
 */
export function healMinion(
  state: GameState,
  targetPlayerId: 'player' | 'opponent',
  targetInstanceId: string,
  amount: number,
  sourceCardId?: number
): GameState {
  const newState = { ...state };
  const battlefield = newState.players[targetPlayerId].battlefield;
  
  if (!battlefield) return newState;
  
  const targetIndex = battlefield.findIndex((card: CardInstance) => card.instanceId === targetInstanceId);
  if (targetIndex === -1) return newState;
  
  // Create a copy of the target card for safer modification
  const targetCard = { ...battlefield[targetIndex] };
  
  // Check if minion needs healing
  const maxHealth = getHealth(targetCard.card);
  if (targetCard.currentHealth === undefined || 
      maxHealth === 0 ||
      targetCard.currentHealth >= maxHealth) {
    return newState; // No healing needed
  }
  
  // Calculate actual healing
  const currentHealth = targetCard.currentHealth;
  const actualHealing = Math.min(amount, maxHealth - currentHealth);
  
  if (actualHealing <= 0) {
    return newState; // No healing needed
  }
  
  // Apply healing
  const oldHealth = targetCard.currentHealth;
  targetCard.currentHealth += actualHealing;
  
  // Update the card in the battlefield
  battlefield[targetIndex] = targetCard;
  
  // Add to game log
  if (!newState.gameLog) newState.gameLog = [];
  
  newState.gameLog.push({
    id: uuidv4(),
    type: 'heal',
    player: targetPlayerId,
    text: `${targetCard.card.name} was healed for ${actualHealing}. (${oldHealth} -> ${targetCard.currentHealth})`,
    timestamp: Date.now(),
    turn: newState.turnNumber,
    targetId: targetInstanceId,
  });
  
  
  return newState;
}

/**
 * Get valid targets for a spell or effect based on targeting requirements
 * @param state The current game state
 * @param targetType Type of targets to get ('any', 'friendly', 'enemy', etc.)
 * @param cardType Optional restriction to only certain card types ('minion', 'hero', etc.)
 * @returns Array of valid target IDs with their types
 */
export function getValidTargets(
  state: GameState,
  targetType: string = 'any',
  cardType?: CardType | string
): { targetId: string; targetType: 'minion' | 'hero' | string }[] {
  const validTargets: { targetId: string; targetType: 'minion' | 'hero' | string }[] = [];
  
  // Parse the targeting requirements
  const isFriendly = targetType.includes('friendly');
  const isEnemy = targetType.includes('enemy');
  const isAny = targetType === 'any' || (!isFriendly && !isEnemy);
  const isHero = targetType.includes('hero');
  const isMinion = targetType.includes('minion');
  const isCharacter = targetType.includes('character') || (!isHero && !isMinion);
  
  // If targeting "all", return a special identifier
  if (targetType === 'all') {
    return [{ targetId: 'all', targetType: 'all' }];
  }
  
  // Check if heroes can be targeted
  if ((isHero || isCharacter || isAny) && !cardType || cardType === 'hero') {
    // Check friendly hero
    if (isFriendly || isAny) {
      validTargets.push({ targetId: 'player', targetType: 'hero' });
    }
    
    // Check enemy hero
    if (isEnemy || isAny) {
      validTargets.push({ targetId: 'opponent', targetType: 'hero' });
    }
  }
  
  // Check if minions can be targeted
  if ((isMinion || isCharacter || isAny) && !cardType || cardType === 'minion') {
    // Check friendly minions
    if (isFriendly || isAny) {
      const friendlyMinions = state.players.player.battlefield || [];
      friendlyMinions.forEach((minion: CardInstance) => {
        const minionKeywords = minion.card.keywords || [];
        
        // Skip minions with stealth if they're enemy targets (Stealth minions can only be targeted by friendly effects)
        // Skip minions with untargetable flag
        const isUntargetable = minionKeywords.includes('untargetable') || 
          (isEnemy && minionKeywords.includes('stealth'));
          
        if (!isUntargetable) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
    }
    
    // Check enemy minions
    if (isEnemy || isAny) {
      const enemyMinions = state.players.opponent.battlefield || [];
      enemyMinions.forEach((minion: CardInstance) => {
        const minionKeywords = minion.card.keywords || [];
        
        // Skip minions with stealth or untargetable flag
        const isUntargetable = minionKeywords.includes('untargetable') || 
          minionKeywords.includes('stealth');
          
        if (!isUntargetable) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
    }
  }
  
  // Handle special case for damaged minions
  if (targetType === 'damaged_minion') {
    return validTargets.filter(target => {
      if (target.targetType !== 'minion') return false;
      
      // Find the minion in either player's battlefield
      const playerField = state.players.player.battlefield || [];
      const opponentField = state.players.opponent.battlefield || [];
      
      let minion = playerField.find((m: CardInstance) => m.instanceId === target.targetId);
      if (!minion) {
        minion = opponentField.find((m: CardInstance) => m.instanceId === target.targetId);
      }
      
      // Check if it's damaged
      const minionMaxHealth = minion ? getHealth(minion.card) : 0;
      return minion && minion.currentHealth !== undefined && 
             minionMaxHealth > 0 && 
             minion.currentHealth < minionMaxHealth;
    });
  }
  
  return validTargets;
}