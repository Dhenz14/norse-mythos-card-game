import { GameState, SpellEffect, CardData, CardInstance, Position, CardKeyword } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { playCard as gamePlayCard } from './gameUtils';
import { executeBattlecry } from './battlecryUtils';
import { getRandomCards } from './cardUtils';
import { updateEnrageEffects } from './enrageUtils';
import { dealDamage } from './damageUtils';
import { drawCard, drawMultipleCards, drawMultipleCardsForCurrentPlayer } from './drawUtils';
import executeSetHealthHandler from '../effects/handlers/spellEffect/set_healthHandler';
import allCards from '../data/allCards';
import { useAnimationStore } from '../animations/AnimationManager';
import { logActivity } from '../stores/activityLogStore';
import { scheduleSpellEffect, SpellEffectType } from '../animations/UnifiedAnimationOrchestrator';
import { useGameStore } from '../stores/gameStore';

function getSpellEffectType(effectType: string): SpellEffectType {
  const typeMap: Record<string, SpellEffectType> = {
    'damage': 'damage',
    'heal': 'heal',
    'buff': 'buff',
    'debuff': 'debuff',
    'summon': 'summon',
    'aoe_damage': 'aoe',
    'cleave_damage': 'aoe',
    'draw': 'draw',
    'quest': 'quest',
    'transform': 'transform',
    'freeze': 'debuff',
    'silence': 'debuff',
  };
  return typeMap[effectType] || 'default';
}

/**
 * Queue a spell damage popup animation
 */
function queueSpellDamagePopup(spellName: string, damage: number, targetName?: string) {
  try {
    const addAnimation = useAnimationStore.getState().addAnimation;
    addAnimation({
      id: `spell-damage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'spell_damage_popup',
      startTime: Date.now(),
      duration: 3500,
      damage,
      spellName,
      targetName
    });
    console.log(`[SpellDamagePopup] Queued popup: ${damage} damage from ${spellName}`);
  } catch (error) {
    console.error('[SpellDamagePopup] Failed to queue popup:', error);
  }
}

/**
 * Execute a mana crystal spell effect
 * Used for spells like The Coin or Innervate that give temporary mana
 */
function executeManaSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Mana crystal spell missing value parameter');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const manaAmount = effect.value;
  
  // Give mana to current player
  if (currentPlayer === 'player') {
    newState.players.player.mana.current += manaAmount;
    console.log(`Player gained ${manaAmount} mana crystal${manaAmount > 1 ? 's' : ''}`);
    
    // If this is temporary mana, we don't need to cap it
    // Otherwise, ensure we don't exceed max mana
    if (!effect.isTemporaryMana) {
      newState.players.player.mana.current = Math.min(
        newState.players.player.mana.current,
        newState.players.player.mana.max
      );
    }
  } else {
    newState.players.opponent.mana.current += manaAmount;
    console.log(`Opponent gained ${manaAmount} mana crystal${manaAmount > 1 ? 's' : ''}`);
    
    // If this is temporary mana, we don't need to cap it
    // Otherwise, ensure we don't exceed max mana
    if (!effect.isTemporaryMana) {
      newState.players.opponent.mana.current = Math.min(
        newState.players.opponent.mana.current,
        newState.players.opponent.mana.max
      );
    }
  }
  
  return newState;
}

/**
 * Execute a spell card's effect
 */
export function executeSpell(
  state: GameState,
  spellCard: CardInstance,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!spellCard.card.spellEffect) {
    console.error(`Card ${spellCard.card.name} does not have a spell effect`);
    return state;
  }
  
  // Create a new effect with the card property for special handling
  const effect: SpellEffect = {
    ...spellCard.card.spellEffect,
    card: spellCard.card // Add the card reference for special cases like Divine Favor
  };
  
  const playerType = state.currentTurn;
  
  console.log(`Executing spell: ${spellCard.card.name} with effect type ${effect.type}`);
  
  logActivity(
    'spell_cast',
    playerType === 'player' ? 'player' : 'opponent',
    `${spellCard.card.name} cast`,
    { cardName: spellCard.card.name, cardId: spellCard.card.id }
  );
  
  try {
    const spellType = getSpellEffectType(effect.type);
    const description = spellCard.card.description || '';
    scheduleSpellEffect(spellCard.card.name, description, spellType);
  } catch (error) {
    console.error('[SpellAnimation] Failed to schedule spell effect:', error);
  }
  
  // Execute the appropriate effect based on the type
  let resultState: GameState;
  
  switch (effect.type) {
    case 'damage':
      resultState = executeDamageSpell(state, effect, targetId, targetType);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, targetType === 'hero' ? 'Enemy Hero' : undefined);
      }
      break;
    case 'heal':
      resultState = executeHealSpell(state, effect, targetId, targetType);
      break;
    case 'buff':
      resultState = executeBuffSpell(state, effect, targetId);
      break;
    case 'aoe_damage':
      resultState = executeAoEDamageSpell(state, effect);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, 'All Enemies');
      }
      break;
    case 'draw':
      resultState = executeDrawSpell(state, effect);
      break;
    case 'summon':
      resultState = executeSummonSpell(state, effect);
      break;
    case 'discover':
      resultState = executeDiscoverSpell(state, effect, spellCard.instanceId);
      break;
    case 'freeze':
      resultState = executeFreezeSpell(state, effect, targetId, targetType);
      break;
    case 'transform':
      resultState = executeTransformSpell(state, effect, targetId);
      break;
    case 'silence':
      resultState = executeSilenceSpell(state, effect, targetId);
      break;
    case 'mana_crystal':
      resultState = executeManaSpell(state, effect);
      break;
    case 'quest':
      resultState = executeQuestSpell(state, spellCard);
      break;
    case 'extra_turn':
      resultState = executeExtraTurnSpell(state, effect);
      break;
    case 'crystal_core':
      resultState = executeCrystalCoreSpell(state, effect);
      break;
    case 'cleave_damage':
      resultState = executeCleaveSpell(state, effect, targetId, targetType);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, 'Cleave');
      }
      break;
    case 'cleave_damage_with_freeze':
      resultState = executeCleaveWithFreezeSpell(state, effect, targetId, targetType);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, 'Cleave & Freeze');
      }
      break;
    case 'conditional_damage':
      resultState = executeConditionalDamageSpell(state, effect, targetId, targetType);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value);
      }
      break;
    case 'conditional_freeze_or_destroy':
      resultState = executeConditionalFreezeOrDestroySpell(state, effect, targetId, targetType);
      break;
    case 'draw_and_damage':
      resultState = executeDrawAndDamageSpell(state, effect, targetId, targetType);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value);
      }
      break;
    case 'draw_both':
      resultState = executeDrawBothPlayersSpell(state, effect);
      break;
    case 'damage_and_shuffle':
      resultState = executeDamageAndShuffleSpell(state, effect, targetId, targetType);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value);
      }
      break;
    case 'cost_reduction':
      resultState = executeCostReductionSpell(state, effect);
      break;
    case 'set_health':
      resultState = executeSetHealthSpell(state, effect, targetId, targetType);
      break;
    default:
      console.error(`Unknown spell effect type: ${effect.type}`);
      return state;
  }
  
  // Process secondary effects (e.g., heal + discover like Renew)
  if (effect.secondaryEffect) {
    console.log(`Processing secondary effect: ${effect.secondaryEffect.type} for ${spellCard.card.name}`);
    
    if (effect.secondaryEffect.type === 'discover') {
      // Create a discover effect from the secondary effect
      const discoverEffect: SpellEffect = {
        type: 'discover',
        discoveryType: effect.secondaryEffect.cardType || 'spell',
        discoveryCount: effect.secondaryEffect.count || 3
      };
      resultState = executeDiscoverSpell(resultState, discoverEffect, spellCard.instanceId);
      console.log(`Secondary discover effect triggered for ${spellCard.card.name}`);
    }
  }
  
  return resultState;
}

/**
 * Execute a damage spell effect
 */
function executeDamageSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!effect.value) {
    console.error('Damage spell missing value parameter');
    return state;
  }
  
  if (!targetId || !targetType) {
    console.error('Damage spell requires target ID and type');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const damageAmount = effect.value;
  
  if (targetType === 'minion') {
    // Find the target minion
    const player = newState.players.player;
    const opponent = newState.players.opponent;
    
    let targetFound = false;
    
    // Check player's battlefield
    const playerBattlefield = [...player.battlefield];
    for (let i = 0; i < playerBattlefield.length; i++) {
      if (playerBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = playerBattlefield[i];
        
        // Apply damage to the minion
        if (target.currentHealth !== undefined) {
          // Check for Divine Shield
          if (target.hasDivineShield) {
            console.log(`Divine Shield absorbs damage for ${target.card.name}`);
            target.hasDivineShield = false;
          } else {
            target.currentHealth -= damageAmount;
            
            // Apply enrage effects after damage
            newState = updateEnrageEffects(newState);
          }
          
          // Check if the minion is destroyed
          if (target.currentHealth <= 0) {
            console.log(`${target.card.name} was destroyed by spell damage`);
            // Move to graveyard - this should be handled by the game state update
            if (!player.graveyard) player.graveyard = [];
            player.graveyard.push({ ...target });
            playerBattlefield.splice(i, 1);
          }
        }
        
        break;
      }
    }
    
    // If not found on player's battlefield, check opponent's battlefield
    if (!targetFound) {
      const opponentBattlefield = [...opponent.battlefield];
      for (let i = 0; i < opponentBattlefield.length; i++) {
        if (opponentBattlefield[i].instanceId === targetId) {
          targetFound = true;
          const target = opponentBattlefield[i];
          
          // Apply damage to the minion
          if (target.currentHealth !== undefined) {
            // Check for Divine Shield
            if (target.hasDivineShield) {
              console.log(`Divine Shield absorbs damage for ${target.card.name}`);
              target.hasDivineShield = false;
            } else {
              target.currentHealth -= damageAmount;
              
              // Apply enrage effects after damage
              newState = updateEnrageEffects(newState);
            }
            
            // Check if the minion is destroyed
            if (target.currentHealth <= 0) {
              console.log(`${target.card.name} was destroyed by spell damage`);
              // Move to graveyard
              if (!opponent.graveyard) opponent.graveyard = [];
              opponent.graveyard.push({ ...target });
              opponentBattlefield.splice(i, 1);
            }
          }
          
          break;
        }
      }
      
      // Update opponent's battlefield
      newState.players.opponent.battlefield = opponentBattlefield;
    }
    
    // Update player's battlefield
    newState.players.player.battlefield = playerBattlefield;
  } else if (targetType === 'hero') {
    // Damage a hero using dealDamage to handle armor properly
    if (targetId === 'opponent' || targetId === 'opponent-hero') {
      // Use dealDamage function to handle armor properly
      newState = dealDamage(newState, 'opponent', 'hero', damageAmount);
      // Game over check is handled in dealDamage function
    } else if (targetId === 'player' || targetId === 'player-hero') {
      // Use dealDamage function to handle armor properly
      newState = dealDamage(newState, 'player', 'hero', damageAmount);
      // Game over check is handled in dealDamage function
    } else {
      console.error(`Unknown hero target ID: ${targetId}`);
    }
  }
  
  return newState;
}

/**
 * Execute a set_health spell effect
 * Used by cards like Hunter's Mark that set a minion's health to a specific value,
 * or like Alexstrasza that sets a hero's health to a specific value
 */
function executeSetHealthSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!targetId) {
    console.error('Set health spell requires a target ID');
    return state;
  }
  
  if (targetType === 'hero') {
    // Get the health value to set
    const healthValue = effect.value || 15; // Default to 15 (like Alexstrasza)
    let newState = { ...state };
    
    // Set the target hero's health to the specified value
    if (targetId === 'opponent' || targetId === 'opponent-hero') {
      newState.players.opponent.health = healthValue;
      console.log(`Set opponent's health to ${healthValue}`);
    } else if (targetId === 'player' || targetId === 'player-hero') {
      newState.players.player.health = healthValue;
      console.log(`Set player's health to ${healthValue}`);
    } else {
      console.error(`Unknown hero target ID: ${targetId}`);
    }
    
    return newState;
  } else {
    // For minions, use the handler from the set_healthHandler file
    return executeSetHealthHandler(state, effect, {
      card: effect.card || { 
        id: 0, 
        name: 'Effect Source', 
        type: 'effect',
        manaCost: 0,
        rarity: 'common',
        description: 'Internal effect source',
        keywords: []
      },
      instanceId: 'source-' + Math.random().toString(36).substring(2, 10),
      isPlayed: true,
      attacksPerformed: 0,
      canAttack: false,
      currentHealth: 1,
      isSummoningSick: true
    }, targetId);
  }
}

/**
 * Execute an AoE damage spell effect
 */
function executeAoEDamageSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  // Consider value 0 as valid for effects like Frost Nova which just freeze without dealing damage
  if (effect.value === undefined) {
    console.error('AoE damage spell missing value parameter');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const damageAmount = effect.value;
  
  // Damage depends on the target type
  if (effect.targetType === 'all_minions') {
    // Damage all minions on both sides
    newState = applyAoEDamage(newState, damageAmount, 'all');
  } else if (effect.targetType === 'all_enemy_minions') {
    // Damage all enemy minions
    newState = applyAoEDamage(newState, damageAmount, 'enemy');
  } else if (effect.targetType === 'all_friendly_minions') {
    // Damage all friendly minions
    newState = applyAoEDamage(newState, damageAmount, 'friendly');
  }
  
  // Handle freeze effect if present (for spells like Frost Nova and Blizzard)
  if (effect.freezeTarget) {
    newState = applyFreezeEffect(newState, effect.targetType);
    console.log(`Applied freeze effect to ${effect.targetType}`);
  }
  
  return newState;
}

/**
 * Apply AoE damage to minions based on the specified filter
 */
function applyAoEDamage(
  state: GameState,
  damageAmount: number,
  filter: 'all' | 'enemy' | 'friendly'
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Helper to process damage on a single battlefield
  const processBattlefield = (
    battlefield: CardInstance[],
    graveyard: CardInstance[] = []
  ): { newBattlefield: CardInstance[], newGraveyard: CardInstance[] } => {
    const newBattlefield: CardInstance[] = [];
    const newGraveyard = [...graveyard];
    
    for (const minion of battlefield) {
      if (minion.currentHealth !== undefined) {
        // Clone the minion to avoid modifying the original
        const newMinion = { ...minion };
        
        // Ensure currentHealth is initialized
        if (newMinion.currentHealth === undefined) {
          newMinion.currentHealth = newMinion.card.health || 0;
        }
        
        // Check for Divine Shield
        if (newMinion.hasDivineShield) {
          console.log(`Divine Shield absorbs damage for ${newMinion.card.name}`);
          newMinion.hasDivineShield = false;
          newBattlefield.push(newMinion);
        } else {
          // Apply damage
          newMinion.currentHealth! -= damageAmount; // Non-null assertion after above init
          
          // Check if destroyed
          if (newMinion.currentHealth! <= 0) {
            console.log(`${newMinion.card.name} was destroyed by AoE spell damage`);
            newGraveyard.push(newMinion);
          } else {
            newBattlefield.push(newMinion);
          }
        }
      } else {
        // Non-minion card (shouldn't happen on battlefield)
        newBattlefield.push(minion);
      }
    }
    
    return { newBattlefield, newGraveyard };
  };
  
  // Apply damage according to filter
  if (filter === 'all' || filter === 'friendly') {
    // Damage player's minions if current player or damage opponent's if not
    const battlefield = currentPlayer === 'player' ? player.battlefield : opponent.battlefield;
    const graveyard = currentPlayer === 'player' ? (player.graveyard || []) : (opponent.graveyard || []);
    
    const { newBattlefield, newGraveyard } = processBattlefield(battlefield, graveyard);
    
    if (currentPlayer === 'player') {
      newState.players.player.battlefield = newBattlefield;
      newState.players.player.graveyard = newGraveyard;
    } else {
      newState.players.opponent.battlefield = newBattlefield;
      newState.players.opponent.graveyard = newGraveyard;
    }
  }
  
  if (filter === 'all' || filter === 'enemy') {
    // Damage opponent's minions if current player or damage player's if not
    const battlefield = currentPlayer === 'player' ? opponent.battlefield : player.battlefield;
    const graveyard = currentPlayer === 'player' ? (opponent.graveyard || []) : (player.graveyard || []);
    
    const { newBattlefield, newGraveyard } = processBattlefield(battlefield, graveyard);
    
    if (currentPlayer === 'player') {
      newState.players.opponent.battlefield = newBattlefield;
      newState.players.opponent.graveyard = newGraveyard;
    } else {
      newState.players.player.battlefield = newBattlefield;
      newState.players.player.graveyard = newGraveyard;
    }
  }
  
  // Apply enrage effects after all AoE damage
  newState = updateEnrageEffects(newState);
  
  return newState;
}

/**
 * Apply AoE freeze effects based on the specified target type
 * Used by spells like Frost Nova and Blizzard
 */
function applyFreezeEffect(
  state: GameState,
  targetType: string
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const opposingPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
  
  // Determine which minions to freeze based on target type
  if (targetType === 'all_minions') {
    // Freeze all minions on the battlefield
    newState.players.player.battlefield = 
      newState.players.player.battlefield.map(minion => ({
        ...minion,
        isFrozen: true,
        canAttack: false
      }));
    
    newState.players.opponent.battlefield = 
      newState.players.opponent.battlefield.map(minion => ({
        ...minion,
        isFrozen: true,
        canAttack: false
      }));
    
    console.log(`All minions have been frozen!`);
  } else if (targetType === 'all_enemy_minions') {
    // Freeze all enemy minions
    if (opposingPlayer === 'player') {
      newState.players.player.battlefield = 
        newState.players.player.battlefield.map(minion => ({
          ...minion,
          isFrozen: true,
          canAttack: false
        }));
    } else {
      newState.players.opponent.battlefield = 
        newState.players.opponent.battlefield.map(minion => ({
          ...minion,
          isFrozen: true,
          canAttack: false
        }));
    }
    
    console.log(`All enemy minions have been frozen!`);
  } else if (targetType === 'all_friendly_minions') {
    // Freeze all friendly minions (rare, but possible)
    if (currentPlayer === 'player') {
      newState.players.player.battlefield = 
        newState.players.player.battlefield.map(minion => ({
          ...minion,
          isFrozen: true,
          canAttack: false
        }));
    } else {
      newState.players.opponent.battlefield = 
        newState.players.opponent.battlefield.map(minion => ({
          ...minion,
          isFrozen: true,
          canAttack: false
        }));
    }
    
    console.log(`All friendly minions have been frozen!`);
  } else {
    console.warn(`Unsupported freeze target type: ${targetType}`);
  }
  
  return newState;
}

/**
 * Execute a heal spell effect
 */
function executeHealSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!effect.value) {
    console.error('Heal spell missing value parameter');
    return state;
  }
  
  if (!targetId || !targetType) {
    console.error('Heal spell requires target ID and type');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const healAmount = effect.value;
  
  if (targetType === 'minion') {
    // Find the target minion
    const player = newState.players.player;
    const opponent = newState.players.opponent;
    
    let targetFound = false;
    
    // Check player's battlefield
    const playerBattlefield = [...player.battlefield];
    for (let i = 0; i < playerBattlefield.length; i++) {
      if (playerBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = playerBattlefield[i];
        
        // Apply healing to the minion
        if (target.currentHealth !== undefined && target.card.health !== undefined) {
          // Heal but don't exceed max health
          target.currentHealth = Math.min(target.currentHealth + healAmount, target.card.health);
          console.log(`Healed ${target.card.name} for ${healAmount} health`);
          
          // Check and update enrage status after healing
          newState = updateEnrageEffects(newState);
        }
        
        break;
      }
    }
    
    // If not found on player's battlefield, check opponent's battlefield
    if (!targetFound) {
      const opponentBattlefield = [...opponent.battlefield];
      for (let i = 0; i < opponentBattlefield.length; i++) {
        if (opponentBattlefield[i].instanceId === targetId) {
          targetFound = true;
          const target = opponentBattlefield[i];
          
          // Apply healing to the minion
          if (target.currentHealth !== undefined && target.card.health !== undefined) {
            // Heal but don't exceed max health
            target.currentHealth = Math.min(target.currentHealth + healAmount, target.card.health);
            console.log(`Healed ${target.card.name} for ${healAmount} health`);
            
            // Check and update enrage status after healing
            newState = updateEnrageEffects(newState);
          }
          
          break;
        }
      }
      
      // Update opponent's battlefield
      newState.players.opponent.battlefield = opponentBattlefield;
    }
    
    // Update player's battlefield
    newState.players.player.battlefield = playerBattlefield;
  } else if (targetType === 'hero') {
    // Heal a hero
    if (targetId === 'opponent' || targetId === 'opponent-hero') {
      // Basic hero healing
      const heroHealth = newState.players.opponent.health || 30;
      const newHealth = Math.min(heroHealth + healAmount, 30);
      newState.players.opponent.health = newHealth;
      console.log(`Healed opponent for ${healAmount} health to ${newHealth}`);
    } else if (targetId === 'player' || targetId === 'player-hero') {
      // Heal player
      const heroHealth = newState.players.player.health || 30;
      const newHealth = Math.min(heroHealth + healAmount, 30);
      newState.players.player.health = newHealth;
      console.log(`Healed player for ${healAmount} health to ${newHealth}`);
    } else {
      console.error(`Unknown hero target ID: ${targetId}`);
    }
  }
  
  return newState;
}

/**
 * Execute a buff spell effect
 */
function executeBuffSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Buff spell requires a target ID');
    return state;
  }
  
  // Allow buff spells that only grant keywords without stat changes
  if (!effect.buffAttack && !effect.buffHealth && !effect.grantKeywords) {
    console.error('Buff spell missing buff values or keywords to grant');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  
  // Find the target minion
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Check if this is a hero buff (like Chaos Strike)
  if (targetId === 'player' || targetId === 'opponent') {
    console.log(`Executing hero buff effect on ${targetId}'s hero`);
    
    // Get the correct player object
    const targetPlayer = targetId === 'player' ? player : opponent;
    
    // Apply hero attack buff - store as temporary attack for this turn
    if (effect.buffAttack) {
      if (!targetPlayer.tempAttackBuff) {
        targetPlayer.tempAttackBuff = 0;
      }
      targetPlayer.tempAttackBuff += effect.buffAttack;
      console.log(`Buffed ${targetId}'s hero attack by +${effect.buffAttack} this turn`);
    }
    
    // Handle additional effects
    if (effect.drawCards && effect.drawCards > 0) {
      // Determine which player should draw cards
      const drawForPlayer = targetId === 'player' ? 'player' : 'opponent';
      
      // Store the original turn to restore it later
      const originalTurn = newState.currentTurn;
      
      // Use standardized draw function directly
      newState = drawMultipleCards(newState, drawForPlayer, effect.drawCards);
      
      // Restore the original currentTurn
      newState = {
        ...newState,
        currentTurn: originalTurn
      };
      
      console.log(`Drew ${effect.drawCards} card(s) for ${targetId}`);
    }
    
    return newState;
  }
  
  // Otherwise proceed with regular minion buff handling
  let targetFound = false;
  
  // Check player's battlefield
  const playerBattlefield = [...player.battlefield];
  for (let i = 0; i < playerBattlefield.length; i++) {
    if (playerBattlefield[i].instanceId === targetId) {
      targetFound = true;
      const target = playerBattlefield[i];
      
      // Apply attack buff
      if (effect.buffAttack && target.card.attack !== undefined) {
        target.card.attack += effect.buffAttack;
        console.log(`Buffed ${target.card.name}'s attack by ${effect.buffAttack}`);
      }
      
      // Apply health buff
      if (effect.buffHealth && target.currentHealth !== undefined && target.card.health !== undefined) {
        target.card.health += effect.buffHealth;
        target.currentHealth += effect.buffHealth;
        console.log(`Buffed ${target.card.name}'s health by ${effect.buffHealth}`);
      }
      
      // Apply keyword buffs if specified
      if (effect.grantKeywords && effect.grantKeywords.length > 0) {
        // Ensure keywords array exists
        if (!target.card.keywords) {
          target.card.keywords = [];
        }
        // Add keywords to the card
        for (const keyword of effect.grantKeywords) {
          if (!target.card.keywords.includes(keyword)) {
            target.card.keywords.push(keyword);
            
            // Handle special keyword properties
            if (keyword === 'divine_shield') {
              target.hasDivineShield = true;
              console.log(`Granted Divine Shield to ${target.card.name}`);
            } else if (keyword === 'taunt') {
              console.log(`Granted Taunt to ${target.card.name}`);
            } else if (keyword === 'windfury') {
              console.log(`Granted Windfury to ${target.card.name}`);
            } else {
              console.log(`Granted ${keyword} to ${target.card.name}`);
            }
          }
        }
      }
      
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's battlefield
  if (!targetFound) {
    const opponentBattlefield = [...opponent.battlefield];
    for (let i = 0; i < opponentBattlefield.length; i++) {
      if (opponentBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = opponentBattlefield[i];
        
        // Apply attack buff
        if (effect.buffAttack && target.card.attack !== undefined) {
          target.card.attack += effect.buffAttack;
          console.log(`Buffed ${target.card.name}'s attack by ${effect.buffAttack}`);
        }
        
        // Apply health buff
        if (effect.buffHealth && target.currentHealth !== undefined && target.card.health !== undefined) {
          target.card.health += effect.buffHealth;
          target.currentHealth += effect.buffHealth;
          console.log(`Buffed ${target.card.name}'s health by ${effect.buffHealth}`);
        }
        
        // Apply keyword buffs if specified
        if (effect.grantKeywords && effect.grantKeywords.length > 0) {
          // Ensure keywords array exists
          if (!target.card.keywords) {
            target.card.keywords = [];
          }
          // Add keywords to the card
          for (const keyword of effect.grantKeywords) {
            if (!target.card.keywords.includes(keyword)) {
              target.card.keywords.push(keyword);
              
              // Handle special keyword properties
              if (keyword === 'divine_shield') {
                target.hasDivineShield = true;
                console.log(`Granted Divine Shield to ${target.card.name}`);
              } else if (keyword === 'taunt') {
                console.log(`Granted Taunt to ${target.card.name}`);
              } else if (keyword === 'windfury') {
                console.log(`Granted Windfury to ${target.card.name}`);
              } else {
                console.log(`Granted ${keyword} to ${target.card.name}`);
              }
            }
          }
        }
        
        break;
      }
    }
    
    // Update opponent's battlefield
    newState.players.opponent.battlefield = opponentBattlefield;
  }
  
  // Update player's battlefield
  newState.players.player.battlefield = playerBattlefield;
  
  // Check and update enrage status after health buffs, as they may remove enrage effects
  newState = updateEnrageEffects(newState);
  
  return newState;
}

/**
 * Execute a summon spell effect
 */
function executeSummonSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.summonCardId) {
    console.error('Summon spell missing summonCardId parameter');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const cardToSummon = effect.summonCardId;
  
  // Find the card data for the summoned minion
  // In a real implementation, we'd look up the card by ID from a database
  // For now, we'll use a simple stub implementation
  
  // For demo purposes - summon a simple minion
  // Note: In a real implementation, this should be replaced with actual card lookup
  const summonedCard: CardData = {
    id: cardToSummon,
    name: `Summoned Minion ${cardToSummon}`,
    manaCost: 0,
    attack: 1,
    health: 1,
    type: 'minion',
    description: "Summoned by a spell",
    rarity: 'common',
    keywords: [],
  };
  
  // Create a card instance for the summoned minion
  const summonedInstance: CardInstance = {
    instanceId: uuidv4(),
    card: summonedCard,
    currentHealth: summonedCard.health,
    canAttack: false,
    isPlayed: true,
    isSummoningSick: true,
    attacksPerformed: 0
  };
  
  // Add the summoned minion to the current player's battlefield
  if (currentPlayer === 'player') {
    // Check if battlefield is full (Hearthstone has a limit of 7 minions)
    if (newState.players.player.battlefield.length < 7) {
      newState.players.player.battlefield.push(summonedInstance);
      console.log(`Player summoned: ${summonedCard.name}`);
    } else {
      console.log(`Player's battlefield is full, can't summon more minions`);
    }
  } else {
    // Check if battlefield is full
    if (newState.players.opponent.battlefield.length < 7) {
      newState.players.opponent.battlefield.push(summonedInstance);
      console.log(`Opponent summoned: ${summonedCard.name}`);
    } else {
      console.log(`Opponent's battlefield is full, can't summon more minions`);
    }
  }
  
  return newState;
}

/**
 * Execute a draw spell effect
 * 
 * This uses the standardized draw functions from drawUtils.ts for consistency
 */
function executeDrawSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  
  // Special handling for Divine Favor which has a dynamic value
  if (effect.value === 0 && effect.card?.name === "Divine Favor") {
    // Calculate cards to draw based on opponent's hand size
    const playerHandSize = currentPlayer === 'player' 
      ? state.players.player.hand.length 
      : state.players.opponent.hand.length;
      
    const opponentHandSize = currentPlayer === 'player' 
      ? state.players.opponent.hand.length 
      : state.players.player.hand.length;
      
    // Draw until hand size is equal to opponent's
    if (playerHandSize < opponentHandSize) {
      const drawAmount = opponentHandSize - playerHandSize;
      console.log(`Divine Favor: Drawing ${drawAmount} cards to match opponent's hand size`);
      
      // Use our standardized drawMultipleCards function
      return drawMultipleCards(newState, currentPlayer, drawAmount);
    } else {
      console.log(`Divine Favor: No cards to draw (hand size already equal or greater than opponent's)`);
      return state;
    }
  }
  
  if (effect.value === undefined) {
    console.error('Draw spell missing value parameter');
    return state;
  }
  
  const drawAmount = effect.value;
  
  // Use our standardized draw function from drawUtils.ts
  // This handles all the logic for drawing cards, including:
  // - Fatigue damage if deck is empty
  // - Creating card instances
  // - Adding cards to hand
  // - Handling hand size limits
  return drawMultipleCards(newState, currentPlayer, drawAmount);
}

/**
 * Execute a freeze spell effect
 */
function executeFreezeSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  // If this is an AoE freeze spell that doesn't require a target
  if (!effect.requiresTarget) {
    console.log("Executing AoE freeze effect");
    
    // Use our new utility function for AoE freeze effects
    if (effect.targetType) {
      return applyFreezeEffect(state, effect.targetType);
    } else {
      console.error('Freeze spell missing target type');
      return state;
    }
  }
  
  // Single target freeze effects
  if (!targetId || !targetType) {
    console.error('Targeted freeze spell requires a target');
    return state;
  }
  
  // Create a new state to avoid mutations
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  let targetFound = false;
  
  // Check player's battlefield
  const playerBattlefield = [...player.battlefield];
  for (let i = 0; i < playerBattlefield.length; i++) {
    if (playerBattlefield[i].instanceId === targetId) {
      targetFound = true;
      const target = playerBattlefield[i];
      
      // Apply freeze
      target.isFrozen = true;
      target.canAttack = false;
      console.log(`${target.card.name} was frozen`);
      
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's battlefield
  if (!targetFound) {
    const opponentBattlefield = [...opponent.battlefield];
    for (let i = 0; i < opponentBattlefield.length; i++) {
      if (opponentBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = opponentBattlefield[i];
        
        // Apply freeze
        target.isFrozen = true;
        target.canAttack = false;
        console.log(`${target.card.name} was frozen`);
        
        break;
      }
    }
    
    // Update opponent's battlefield
    newState.players.opponent.battlefield = opponentBattlefield;
  }
  
  // Update player's battlefield
  newState.players.player.battlefield = playerBattlefield;
  
  return newState;
}

/**
 * Execute a transform spell effect (polymorph)
 */
function executeTransformSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Transform spell requires a target ID');
    return state;
  }
  
  let newState = { ...state };
  
  // Find the target minion
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  let targetFound = false;
  
  // Create a default sheep (or frog) transformation
  const transformedCard: CardData = {
    id: 9999, // Placeholder ID
    name: "Sheep",
    type: 'minion',
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "This minion was transformed into a sheep.",
    rarity: 'common',
    keywords: []
  };
  
  // Check player's battlefield
  const playerBattlefield = [...player.battlefield];
  for (let i = 0; i < playerBattlefield.length; i++) {
    if (playerBattlefield[i].instanceId === targetId) {
      targetFound = true;
      const target = playerBattlefield[i];
      
      // Apply transform
      const transformedInstance: CardInstance = {
        instanceId: target.instanceId, // Keep same ID for tracking
        card: transformedCard,
        currentHealth: 1,
        canAttack: false, // Can't attack after transform
        isPlayed: true,
        isSummoningSick: true,
        attacksPerformed: 0
      };
      
      playerBattlefield[i] = transformedInstance;
      console.log(`${target.card.name} was transformed into a Sheep`);
      
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's battlefield
  if (!targetFound) {
    const opponentBattlefield = [...opponent.battlefield];
    for (let i = 0; i < opponentBattlefield.length; i++) {
      if (opponentBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = opponentBattlefield[i];
        
        // Apply transform
        const transformedInstance: CardInstance = {
          instanceId: target.instanceId, // Keep same ID for tracking
          card: transformedCard,
          currentHealth: 1,
          canAttack: false, // Can't attack after transform
          isPlayed: true,
          isSummoningSick: true,
          attacksPerformed: 0
        };
        
        opponentBattlefield[i] = transformedInstance;
        console.log(`${target.card.name} was transformed into a Sheep`);
        
        break;
      }
    }
    
    // Update opponent's battlefield
    newState.players.opponent.battlefield = opponentBattlefield;
  }
  
  // Update player's battlefield
  newState.players.player.battlefield = playerBattlefield;
  
  return newState;
}

/**
 * Execute a discover spell effect
 */
function executeDiscoverSpell(
  state: GameState,
  effect: SpellEffect,
  sourceCardId: string
): GameState {
  // Number of cards to choose from (typically 3 in Hearthstone)
  const discoveryCount = effect.discoveryCount || 3;
  
  // Create discovery options
  const discoveryType = effect.discoveryType || 'any';
  const discoveryClass = effect.discoveryClass || 'any';
  
  // Get random cards based on discovery type/class
  let pool = [...allCards];
  
  // Filter by type if specified
  if (discoveryType !== 'any') {
    pool = pool.filter(card => card.type === discoveryType);
  }
  
  // Filter by class if specified
  if (discoveryClass !== 'any') {
    pool = pool.filter(card => 
      card.class?.toLowerCase() === discoveryClass.toLowerCase() || 
      card.heroClass?.toLowerCase() === discoveryClass.toLowerCase()
    );
  }

  // Shuffle and pick
  const discoveryOptions = pool
    .sort(() => 0.5 - Math.random())
    .slice(0, discoveryCount);
  
  // Set discovery state - get fresh state from store in callback
  return {
    ...state,
    discovery: {
      active: true,
      options: discoveryOptions,
      allOptions: [...discoveryOptions],
      sourceCardId,
      filters: {
        type: discoveryType as any,
        rarity: 'any',
        manaCost: 'any'
      },
      callback: (selectedCard: CardData | null) => {
        // Get the CURRENT game state from the store, not the stale captured state
        const { gameState: currentState } = useGameStore.getState();
        const updatedState = JSON.parse(JSON.stringify(currentState));
        
        if (selectedCard) {
          console.log(`[DISCOVERY] Selected card from discovery: ${selectedCard.name}`);
          
          // Add the selected card to the player's hand if there's room
          if (updatedState.players.player.hand.length < 10) {
            const cardInstance: CardInstance = {
              instanceId: uuidv4(),
              card: selectedCard,
              currentHealth: selectedCard.health ?? (selectedCard as any).hp ?? 1,
              canAttack: false,
              isPlayed: false,
              isSummoningSick: true,
              attacksPerformed: 0
            };
            
            updatedState.players.player.hand.push(cardInstance);
            console.log(`[DISCOVERY] Added ${selectedCard.name} to player hand. Hand size: ${updatedState.players.player.hand.length}`);
          } else {
            console.log(`[DISCOVERY] Hand is full, cannot add ${selectedCard.name}`);
          }
        } else {
          console.log('[DISCOVERY] Discovery selection skipped');
        }
        
        // Clear discovery state
        updatedState.discovery = undefined;
        
        return updatedState;
      }
    }
  };
}

/**
 * Execute a silence spell effect
 * Silence removes all card text, abilities, and enchantments from a minion
 */
function executeSilenceSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Handle AoE silence effects like Mass Dispel
  if (!targetId && effect.targetType && effect.targetType.includes('all')) {
    console.log(`Executing AoE silence effect on ${effect.targetType}`);
    
    // Handle silence based on targetType
    if (effect.targetType === 'all_enemy_minions') {
      // Silence all enemy minions
      const currentPlayer = state.currentTurn;
      const targetBattlefield = currentPlayer === 'player' 
        ? opponent.battlefield 
        : player.battlefield;
        
      // Apply silence to all minions in the target battlefield
      for (const target of targetBattlefield) {
        // Store original keywords if not already stored
        if (!target.originalKeywords) {
          target.originalKeywords = [...target.card.keywords];
        }
        
        // Remove all ability-based keywords
        target.card.keywords = target.card.keywords.filter(keyword => 
          keyword !== 'taunt' && 
          keyword !== 'divine_shield' && 
          keyword !== 'windfury' && 
          keyword !== 'deathrattle' && 
          keyword !== 'battlecry' && 
          keyword !== 'spell_damage'
        );
        
        // Remove divine shield if present
        target.hasDivineShield = false;
        
        // Remove any deathrattle and battlecry effects
        target.card.deathrattle = undefined;
        target.card.battlecry = undefined;
        
        // Mark the minion as silenced
        target.isSilenced = true;
        
        // Reset spell power if present
        target.spellPower = 0;
        
        console.log(`Silenced ${target.card.name}`);
      }
      
      // For Mass Dispel, draw a card
      if (effect.drawCards && effect.drawCards > 0) {
        // Use standardized draw function directly
        newState = drawMultipleCards(newState, state.currentTurn, effect.drawCards);
      }
      
      return newState;
    }
    
    // Handle other AoE silence targets if needed
    if (effect.targetType === 'all_minions') {
      // Silence all minions on both sides of the battlefield
      // (Implementation similar to above but for both player and opponent)
    }
    
    return newState;
  }
  
  // Handle single-target silence effects
  if (!targetId) {
    console.error('Single-target silence spell requires a target ID');
    return state;
  }
  
  let targetFound = false;
  
  // Check player's battlefield
  const playerBattlefield = [...player.battlefield];
  for (let i = 0; i < playerBattlefield.length; i++) {
    if (playerBattlefield[i].instanceId === targetId) {
      targetFound = true;
      const target = playerBattlefield[i];
      
      // Apply silence effect
      // Store original keywords if not already stored
      if (!target.originalKeywords) {
        target.originalKeywords = [...target.card.keywords];
      }
      
      // Remove all ability-based keywords
      target.card.keywords = target.card.keywords.filter(keyword => 
        keyword !== 'taunt' && 
        keyword !== 'divine_shield' && 
        keyword !== 'windfury' && 
        keyword !== 'deathrattle' && 
        keyword !== 'battlecry' && 
        keyword !== 'spell_damage'
      );
      
      // Remove divine shield if present
      target.hasDivineShield = false;
      
      // Remove any deathrattle and battlecry effects
      target.card.deathrattle = undefined;
      target.card.battlecry = undefined;
      
      // Mark the minion as silenced
      target.isSilenced = true;
      
      // Reset spell power if present
      target.spellPower = 0;
      
      console.log(`Silenced ${target.card.name}`);
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's battlefield
  if (!targetFound) {
    const opponentBattlefield = [...opponent.battlefield];
    for (let i = 0; i < opponentBattlefield.length; i++) {
      if (opponentBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = opponentBattlefield[i];
        
        // Apply silence effect
        // Store original keywords if not already stored
        if (!target.originalKeywords) {
          target.originalKeywords = [...target.card.keywords];
        }
        
        // Remove all ability-based keywords
        target.card.keywords = target.card.keywords.filter(keyword => 
          keyword !== 'taunt' && 
          keyword !== 'divine_shield' && 
          keyword !== 'windfury' && 
          keyword !== 'deathrattle' && 
          keyword !== 'battlecry' && 
          keyword !== 'spell_damage'
        );
        
        // Remove divine shield if present
        target.hasDivineShield = false;
        
        // Remove any deathrattle and battlecry effects
        target.card.deathrattle = undefined;
        target.card.battlecry = undefined;
        
        // Mark the minion as silenced
        target.isSilenced = true;
        
        // Reset spell power if present
        target.spellPower = 0;
        
        console.log(`Silenced ${target.card.name}`);
        break;
      }
    }
    
    // Update opponent's battlefield
    newState.players.opponent.battlefield = opponentBattlefield;
  }
  
  // Update player's battlefield
  newState.players.player.battlefield = playerBattlefield;
  
  return newState;
}

/**
 * Execute a quest spell effect
 * This activates a quest card when played
 */
function executeQuestSpell(
  state: GameState,
  spellCard: CardInstance
): GameState {
  // Make sure it's a valid quest card with quest data
  if (
    !spellCard.card || 
    !spellCard.card.spellEffect || 
    spellCard.card.spellEffect.type !== 'quest' ||
    !spellCard.card.spellEffect.questData
  ) {
    console.error('Not a valid quest card:', spellCard);
    return state;
  }
  
  // We need to directly implement the quest activation logic here
  // to avoid circular dependency issues
  
  // Get the quest data from the card
  const questData = spellCard.card.spellEffect.questData;
  
  // Create a new state with deep copies to avoid mutation
  const newState = JSON.parse(JSON.stringify(state));
  
  // Set the quest as active for the player
  newState.players[state.currentTurn].activeQuest = {
    ...questData,
    cardId: spellCard.card.id,
    cardName: spellCard.card.name
  };
  
  // Add event to game log
  newState.gameLog.push({
    id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: 'quest_started',
    turn: state.turnNumber,
    timestamp: Date.now(),
    player: state.currentTurn,
    text: `${state.currentTurn === 'player' ? 'You' : 'Opponent'} started quest: ${spellCard.card.name}`,
    progress: 0,
    target: questData.target,
    cardId: String(spellCard.card.id),
    cardName: spellCard.card.name
  });
  
  return newState;
}

/**
 * Execute an extra turn spell effect
 * Grants the player an additional turn after their current one
 */
function executeExtraTurnSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = JSON.parse(JSON.stringify(state));
  const currentPlayer = state.currentTurn;
  
  // Set the flag for an extra turn
  if (currentPlayer === 'player') {
    newState.players.player.extraTurn = true;
    console.log('Player will take an extra turn after this one');
  } else {
    newState.players.opponent.extraTurn = true;
    console.log('Opponent will take an extra turn after this one');
  }
  
  return newState;
}

/**
 * Execute the Crystal Core spell effect
 * For the rest of the game, your minions are 4/4
 */
function executeCrystalCoreSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = JSON.parse(JSON.stringify(state));
  const currentPlayer = state.currentTurn;
  
  // Apply the Crystal Core effect
  if (currentPlayer === 'player') {
    // Set the Crystal Core flag
    newState.players.player.crystalCoreActive = true;
    
    // Transform all current minions on the battlefield to 4/4
    for (let minion of newState.players.player.battlefield) {
      minion.card.attack = 4;
      minion.card.health = 4;
      minion.currentHealth = 4;
    }
    
    // Transform all minions in hand to 4/4
    for (let card of newState.players.player.hand) {
      if (card.card.type === 'minion') {
        card.card.attack = 4;
        card.card.health = 4;
      }
    }
    
    console.log('Player activated Crystal Core effect');
  } else {
    // Set the Crystal Core flag
    newState.players.opponent.crystalCoreActive = true;
    
    // Transform all current minions on the battlefield to 4/4
    for (let minion of newState.players.opponent.battlefield) {
      minion.card.attack = 4;
      minion.card.health = 4;
      minion.currentHealth = 4;
    }
    
    // Transform all minions in hand to 4/4
    for (let card of newState.players.opponent.hand) {
      if (card.card.type === 'minion') {
        card.card.attack = 4;
        card.card.health = 4;
      }
    }
    
    console.log('Opponent activated Crystal Core effect');
  }
  
  return newState;
}

// [Removed duplicate executeSetHealthSpell function as it's already defined earlier in the file]

/**
 * Execute a cast all spells spell effect (like Zul'jin hero card)
 */
function executeCastAllSpellsSpell(state: GameState, effect: SpellEffect): GameState {
  console.log('Executing cast all spells spell effect');
  
  // In a real implementation, we'd need to track all spells played in the game
  // For now, we'll just simulate by logging the effect
  console.log(`Spell effect: Cast all previously played spells (targets chosen randomly)`);
  
  // This would require access to game history and spell logic
  // For this implementation, we'll return the unchanged state
  return state;
}

/**
 * Execute a debuff spell effect (reducing a minion's stats)
 */
function executeDebuffSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Debuff spell requires a target ID');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  
  // Get debuff values
  const attackDebuff = effect.buffAttack || -1;
  const healthDebuff = effect.buffHealth || 0;
  
  // Find the target minion
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  let targetFound = false;
  
  // Check player's battlefield
  const playerBattlefield = [...player.battlefield];
  for (let i = 0; i < playerBattlefield.length; i++) {
    if (playerBattlefield[i].instanceId === targetId) {
      targetFound = true;
      const target = playerBattlefield[i];
      
      // Apply attack debuff
      if (target.card.attack !== undefined) {
        // Special handling for Aldor Peacekeeper effect (set to 1)
        if (attackDebuff === -1000) {
          target.card.attack = 1;
          console.log(`Debuffed ${target.card.name}'s attack to 1`);
        } else {
          // Regular debuff
          target.card.attack = Math.max(0, target.card.attack + attackDebuff);
          console.log(`Debuffed ${target.card.name}'s attack by ${Math.abs(attackDebuff)}`);
        }
      }
      
      // Apply health debuff if any
      if (healthDebuff < 0 && target.currentHealth !== undefined && target.card.health !== undefined) {
        target.card.health = Math.max(1, target.card.health + healthDebuff);
        target.currentHealth = Math.max(1, target.currentHealth + healthDebuff);
        console.log(`Debuffed ${target.card.name}'s health by ${Math.abs(healthDebuff)}`);
      }
      
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's battlefield
  if (!targetFound) {
    const opponentBattlefield = [...opponent.battlefield];
    for (let i = 0; i < opponentBattlefield.length; i++) {
      if (opponentBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = opponentBattlefield[i];
        
        // Apply attack debuff
        if (target.card.attack !== undefined) {
          // Special handling for Aldor Peacekeeper effect (set to 1)
          if (attackDebuff === -1000) {
            target.card.attack = 1;
            console.log(`Debuffed ${target.card.name}'s attack to 1`);
          } else {
            // Regular debuff
            target.card.attack = Math.max(0, target.card.attack + attackDebuff);
            console.log(`Debuffed ${target.card.name}'s attack by ${Math.abs(attackDebuff)}`);
          }
        }
        
        // Apply health debuff if any
        if (healthDebuff < 0 && target.currentHealth !== undefined && target.card.health !== undefined) {
          target.card.health = Math.max(1, target.card.health + healthDebuff);
          target.currentHealth = Math.max(1, target.currentHealth + healthDebuff);
          console.log(`Debuffed ${target.card.name}'s health by ${Math.abs(healthDebuff)}`);
        }
        
        break;
      }
    }
    
    // Update opponent's battlefield
    newState.players.opponent.battlefield = opponentBattlefield;
  }
  
  // Update player's battlefield
  newState.players.player.battlefield = playerBattlefield;
  
  return newState;
}

/**
 * Check if a target is valid for a spell
 */
export function isValidSpellTarget(
  spell: CardData,
  targetType: 'minion' | 'hero',
  targetId: string,
  state: GameState
): boolean {
  if (!spell.spellEffect || !spell.spellEffect.requiresTarget) {
    return false; // Spell doesn't need a target
  }
  
  const targetRequirement = spell.spellEffect.targetType;
  const currentTurn = state.currentTurn;
  
  // Handle hero targeting
  if (targetType === 'hero') {
    const isPlayerHero = targetId === 'player';
    const isOpponentHero = targetId === 'opponent';
    
    // Valid if targeting any hero
    if (targetRequirement === 'any_hero') {
      return true;
    }
    
    // Valid if targeting friendly hero and it is friendly
    if (targetRequirement === 'friendly_hero') {
      return (currentTurn === 'player' && isPlayerHero) || 
             (currentTurn === 'opponent' && isOpponentHero);
    }
    
    // Valid if targeting enemy hero and it is enemy
    if (targetRequirement === 'enemy_hero') {
      return (currentTurn === 'player' && isOpponentHero) || 
             (currentTurn === 'opponent' && isPlayerHero);
    }
    
    return false;
  }
  
  // Handle minion targeting
  if (targetType === 'minion') {
    // Find the target minion
    let targetMinion: CardInstance | undefined;
    let isPlayerMinion = false;
    
    // Check player's battlefield
    for (const minion of state.players.player.battlefield) {
      if (minion.instanceId === targetId) {
        targetMinion = minion;
        isPlayerMinion = true;
        break;
      }
    }
    
    // Check opponent's battlefield if not found
    if (!targetMinion) {
      for (const minion of state.players.opponent.battlefield) {
        if (minion.instanceId === targetId) {
          targetMinion = minion;
          isPlayerMinion = false;
          break;
        }
      }
    }
    
    if (!targetMinion) {
      return false; // Target not found
    }
    
    // Check if it's a valid target based on requirements
    
    // Can target any minion
    if (targetRequirement === 'any_minion') {
      return true;
    }
    
    // Can target only friendly minions
    if (targetRequirement === 'friendly_minion') {
      return (currentTurn === 'player' && isPlayerMinion) ||
             (currentTurn === 'opponent' && !isPlayerMinion);
    }
    
    // Can target only enemy minions
    if (targetRequirement === 'enemy_minion') {
      return (currentTurn === 'player' && !isPlayerMinion) ||
             (currentTurn === 'opponent' && isPlayerMinion);
    }
    
    return false;
  }
  
  return false;
}

/**
 * Determine if a spell requires a target
 */
export function requiresSpellTarget(card: CardData): boolean {
  if (!card.spellEffect) return false;
  
  // If explicitly defined, use that value
  if (card.spellEffect.requiresTarget !== undefined) {
    return card.spellEffect.requiresTarget;
  }
  
  // Otherwise determine based on effect type
  switch (card.spellEffect.type) {
    case 'damage':
    case 'transform':
    case 'silence':
    case 'cleave_damage':
    case 'cleave_damage_with_freeze':
    case 'conditional_damage':
    case 'conditional_freeze_or_destroy':
    case 'draw_and_damage':
    case 'damage_and_shuffle':
      return true;
    case 'aoe_damage':
    case 'draw':
    case 'quest':
    case 'draw_both':
    case 'cost_reduction':
      return false;
    default:
      return false;
  }
}

/**
 * Execute a cleave spell effect that damages a target and adjacent minions
 */
function executeCleaveSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!effect.value) {
    console.error('Cleave spell missing value parameter');
    return state;
  }
  
  if (!targetId || !targetType || targetType !== 'minion') {
    console.error('Cleave spell requires a minion target');
    return state;
  }
  
  let newState = { ...state };
  const damageAmount = effect.value;
  
  // Find the target minion and its owner
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  let targetOwner: 'player' | 'opponent' | null = null;
  let targetIndex = -1;
  
  // Check if target is on player's battlefield
  for (let i = 0; i < player.battlefield.length; i++) {
    if (player.battlefield[i].instanceId === targetId) {
      targetOwner = 'player';
      targetIndex = i;
      break;
    }
  }
  
  // If not found, check opponent's battlefield
  if (targetOwner === null) {
    for (let i = 0; i < opponent.battlefield.length; i++) {
      if (opponent.battlefield[i].instanceId === targetId) {
        targetOwner = 'opponent';
        targetIndex = i;
        break;
      }
    }
  }
  
  if (targetOwner === null || targetIndex < 0) {
    console.error('Target minion not found for cleave spell');
    return state;
  }
  
  // Get the battlefield array and apply damage to target and adjacent minions
  const battlefield = targetOwner === 'player' ? player.battlefield : opponent.battlefield;
  
  // Create a helper function to apply damage to a single minion
  const applyDamageToMinion = (minion: CardInstance) => {
    if (minion.currentHealth !== undefined) {
      // Check for Divine Shield
      if (minion.hasDivineShield) {
        console.log(`Divine Shield absorbs damage for ${minion.card.name}`);
        minion.hasDivineShield = false;
      } else {
        minion.currentHealth -= damageAmount;
        
        // Apply enrage effects if minion is still alive
        if (minion.currentHealth > 0) {
          // Will be handled collectively at the end
        }
      }
    }
  };
  
  // Apply damage to target and adjacent minions
  // First get indices of minions to damage
  const minionsToModify: number[] = [targetIndex];
  if (targetIndex > 0) {
    minionsToModify.push(targetIndex - 1); // Left minion
  }
  if (targetIndex < battlefield.length - 1) {
    minionsToModify.push(targetIndex + 1); // Right minion
  }
  
  // Apply damage to these minions
  const newBattlefield = [...battlefield];
  const killedMinions: CardInstance[] = [];
  
  minionsToModify.forEach(index => {
    if (index >= 0 && index < newBattlefield.length) {
      const minion = newBattlefield[index];
      applyDamageToMinion(minion);
      
      // Check if minion died
      if (minion.currentHealth !== undefined && minion.currentHealth <= 0) {
        killedMinions.push(minion);
      }
    }
  });
  
  // Remove killed minions
  const updatedBattlefield = newBattlefield.filter(
    minion => minion.currentHealth === undefined || minion.currentHealth > 0
  );
  
  // Move killed minions to graveyard
  const graveyard = targetOwner === 'player' ? player.graveyard || [] : opponent.graveyard || [];
  const updatedGraveyard = [...graveyard, ...killedMinions];
  
  // Update the battlefield
  if (targetOwner === 'player') {
    newState.players.player.battlefield = updatedBattlefield;
    newState.players.player.graveyard = updatedGraveyard;
  } else {
    newState.players.opponent.battlefield = updatedBattlefield;
    newState.players.opponent.graveyard = updatedGraveyard;
  }
  
  // Apply enrage effects after all damage
  newState = updateEnrageEffects(newState);
  
  return newState;
}

/**
 * Execute a cleave spell with freeze effect that damages a target and freezes adjacent minions
 */
function executeCleaveWithFreezeSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!effect.value) {
    console.error('Cleave with freeze spell missing value parameter');
    return state;
  }
  
  if (!targetId || !targetType || targetType !== 'minion') {
    console.error('Cleave with freeze spell requires a minion target');
    return state;
  }
  
  let newState = { ...state };
  const damageAmount = effect.value;
  
  // Find the target minion and its owner
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  let targetOwner: 'player' | 'opponent' | null = null;
  let targetIndex = -1;
  
  // Check if target is on player's battlefield
  for (let i = 0; i < player.battlefield.length; i++) {
    if (player.battlefield[i].instanceId === targetId) {
      targetOwner = 'player';
      targetIndex = i;
      break;
    }
  }
  
  // If not found, check opponent's battlefield
  if (targetOwner === null) {
    for (let i = 0; i < opponent.battlefield.length; i++) {
      if (opponent.battlefield[i].instanceId === targetId) {
        targetOwner = 'opponent';
        targetIndex = i;
        break;
      }
    }
  }
  
  if (targetOwner === null || targetIndex < 0) {
    console.error('Target minion not found for cleave with freeze spell');
    return state;
  }
  
  // Get the battlefield array and apply effects
  const battlefield = targetOwner === 'player' ? player.battlefield : opponent.battlefield;
  
  // Create a helper function to apply damage to the target minion
  const applyDamageToMinion = (minion: CardInstance) => {
    if (minion.currentHealth !== undefined) {
      // Check for Divine Shield
      if (minion.hasDivineShield) {
        console.log(`Divine Shield absorbs damage for ${minion.card.name}`);
        minion.hasDivineShield = false;
      } else {
        minion.currentHealth -= damageAmount;
        
        // Apply enrage effects if minion is still alive
        if (minion.currentHealth > 0) {
          // Will be handled collectively at the end
        }
      }
    }
  };
  
  // Create a helper function to apply freeze to minions
  const applyFreezeToMinion = (minion: CardInstance) => {
    minion.isFrozen = true;
    minion.canAttack = false;
    console.log(`${minion.card.name} has been frozen`);
  };
  
  // Apply damage to target and freeze to adjacent minions
  const newBattlefield = [...battlefield];
  const killedMinions: CardInstance[] = [];
  
  // Apply damage to target
  if (targetIndex >= 0 && targetIndex < newBattlefield.length) {
    const targetMinion = newBattlefield[targetIndex];
    applyDamageToMinion(targetMinion);
    
    // Check if target died
    if (targetMinion.currentHealth !== undefined && targetMinion.currentHealth <= 0) {
      killedMinions.push(targetMinion);
    }
  }
  
  // Apply freeze to adjacent minions
  // Left adjacent
  if (targetIndex > 0) {
    const leftMinion = newBattlefield[targetIndex - 1];
    applyFreezeToMinion(leftMinion);
  }
  
  // Right adjacent
  if (targetIndex < newBattlefield.length - 1) {
    const rightMinion = newBattlefield[targetIndex + 1];
    applyFreezeToMinion(rightMinion);
  }
  
  // Remove killed minions
  const updatedBattlefield = newBattlefield.filter(
    minion => minion.currentHealth === undefined || minion.currentHealth > 0
  );
  
  // Move killed minions to graveyard
  const graveyard = targetOwner === 'player' ? player.graveyard || [] : opponent.graveyard || [];
  const updatedGraveyard = [...graveyard, ...killedMinions];
  
  // Update the battlefield
  if (targetOwner === 'player') {
    newState.players.player.battlefield = updatedBattlefield;
    newState.players.player.graveyard = updatedGraveyard;
  } else {
    newState.players.opponent.battlefield = updatedBattlefield;
    newState.players.opponent.graveyard = updatedGraveyard;
  }
  
  // Apply enrage effects after all damage
  newState = updateEnrageEffects(newState);
  
  return newState;
}

/**
 * Execute a conditional damage spell effect (deals more damage if condition is met)
 */
function executeConditionalDamageSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!effect.value || !effect.enhancedValue) {
    console.error('Conditional damage spell missing value parameters');
    return state;
  }
  
  if (!targetId || !targetType) {
    console.error('Conditional damage spell requires target ID and type');
    return state;
  }
  
  let newState = { ...state };
  const baseValue = effect.value;
  const enhancedValue = effect.enhancedValue;
  
  // Default to base value
  let damageAmount = baseValue;
  
  // Check if target meets the condition
  if (effect.condition === 'is_frozen') {
    // For now, we only handle the "is_frozen" condition
    
    if (targetType === 'minion') {
      // Find the target minion
      const player = newState.players.player;
      const opponent = newState.players.opponent;
      let targetMinion: CardInstance | null = null;
      
      // Check player's battlefield
      player.battlefield.forEach(minion => {
        if (minion.instanceId === targetId) {
          targetMinion = minion;
        }
      });
      
      // If not found, check opponent's battlefield
      if (!targetMinion) {
        opponent.battlefield.forEach(minion => {
          if (minion.instanceId === targetId) {
            targetMinion = minion;
          }
        });
      }
      
      // If target found and is frozen, use enhanced damage
      if (targetMinion && targetMinion.isFrozen) {
        damageAmount = enhancedValue;
        console.log(`${targetMinion.card.name} is frozen, dealing ${enhancedValue} damage instead of ${baseValue}`);
      }
    }
  }
  
  // Execute the damage spell with determined damage amount
  const modifiedEffect = { ...effect, value: damageAmount };
  return executeDamageSpell(newState, modifiedEffect, targetId, targetType);
}

/**
 * Execute a conditional freeze or destroy spell effect
 */
function executeConditionalFreezeOrDestroySpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!targetId || !targetType || targetType !== 'minion') {
    console.error('Conditional freeze or destroy spell requires a minion target');
    return state;
  }
  
  let newState = { ...state };
  
  // Find the target minion
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  let targetFound = false;
  let targetOwner: 'player' | 'opponent' | null = null;
  let targetIndex = -1;
  
  // Check player's battlefield
  for (let i = 0; i < player.battlefield.length; i++) {
    if (player.battlefield[i].instanceId === targetId) {
      targetFound = true;
      targetOwner = 'player';
      targetIndex = i;
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's battlefield
  if (!targetFound) {
    for (let i = 0; i < opponent.battlefield.length; i++) {
      if (opponent.battlefield[i].instanceId === targetId) {
        targetFound = true;
        targetOwner = 'opponent';
        targetIndex = i;
        break;
      }
    }
  }
  
  if (!targetFound || targetOwner === null || targetIndex < 0) {
    console.error('Target minion not found for conditional freeze or destroy spell');
    return state;
  }
  
  const battlefield = targetOwner === 'player' ? player.battlefield : opponent.battlefield;
  const target = battlefield[targetIndex];
  
  // Check if target is already frozen
  if (target.isFrozen) {
    console.log(`${target.card.name} is already frozen, destroying it`);
    
    // Target is frozen, so destroy it
    const updatedBattlefield = [...battlefield];
    const killedMinion = updatedBattlefield.splice(targetIndex, 1)[0];
    
    // Move to graveyard
    const graveyard = targetOwner === 'player' ? player.graveyard || [] : opponent.graveyard || [];
    const updatedGraveyard = [...graveyard, killedMinion];
    
    // Update the battlefield
    if (targetOwner === 'player') {
      newState.players.player.battlefield = updatedBattlefield;
      newState.players.player.graveyard = updatedGraveyard;
    } else {
      newState.players.opponent.battlefield = updatedBattlefield;
      newState.players.opponent.graveyard = updatedGraveyard;
    }
  } else {
    // Target is not frozen, so freeze it
    console.log(`Freezing ${target.card.name}`);
    target.isFrozen = true;
    target.canAttack = false;
  }
  
  return newState;
}

/**
 * Execute a draw and damage spell effect (draw a card and deal damage equal to its cost)
 */
function executeDrawAndDamageSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!targetId || !targetType) {
    console.error('Draw and damage spell requires target ID and type');
    return state;
  }
  
  if (!effect.drawCards) {
    console.error('Draw and damage spell missing drawCards parameter');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const drawCount = effect.drawCards;
  
  // First, draw the cards
  const cardsDrawn: CardData[] = [];
  
  // Get the player's cards before drawing
  const playerHandBefore = [...newState.players[currentPlayer === 'player' ? 'player' : 'opponent'].hand];
  
  // Draw the cards using the standardized drawMultipleCards function
  // Ensure currentPlayer is a valid player type
  newState = drawMultipleCards(
    newState, 
    currentPlayer === 'player' ? 'player' : 'opponent', 
    drawCount
  );
  
  // Compare the hand after drawing with the hand before to find the newly drawn cards
  const safePlayerType = currentPlayer === 'player' ? 'player' : 'opponent';
  const playerHandAfter = newState.players[safePlayerType].hand;
  const newCardInstances = playerHandAfter.filter(
    cardAfter => !playerHandBefore.some(cardBefore => cardBefore.instanceId === cardAfter.instanceId)
  );
  
  // Add the newly drawn cards to our list
  for (const cardInstance of newCardInstances) {
    cardsDrawn.push(cardInstance.card);
  }
  
  // If no cards were drawn, exit early
  if (cardsDrawn.length === 0) {
    console.log('No cards drawn, skipping damage part of effect');
    return newState;
  }
  
  // Calculate damage based on card cost
  let damageAmount = 0;
  
  if (effect.damageBasedOnDrawnCardCost && cardsDrawn.length > 0) {
    // Use the mana cost of the first drawn card
    damageAmount = cardsDrawn[0].manaCost;
    console.log(`Drew ${cardsDrawn[0].name} with cost ${damageAmount}, dealing ${damageAmount} damage`);
  }
  
  // Now apply the damage using a modified damage spell effect
  const damageEffect: SpellEffect = {
    type: 'damage',
    value: damageAmount,
    requiresTarget: true,
    targetType: effect.targetType
  };
  
  return executeDamageSpell(newState, damageEffect, targetId, targetType);
}

/**
 * Execute a draw for both players spell effect
 */
function executeDrawBothPlayersSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Draw both players spell missing value parameter');
    return state;
  }
  
  let newState = { ...state };
  const drawCount = effect.value;
  const currentPlayer = state.currentTurn || 'player';
  const opposingPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
  
  // Draw cards for current player using the standardized drawMultipleCards function
  // First, ensure currentPlayer is a valid player type
  const safeCurrentPlayer = 'player';
  newState = drawMultipleCards(
    { ...newState, currentTurn: safeCurrentPlayer }, 
    safeCurrentPlayer,
    drawCount
  );
  
  // Draw cards for opposing player using the standardized drawMultipleCards function
  // Since opposingPlayer is guaranteed to be either 'player' or 'opponent', this is safe
  newState = drawMultipleCards(
    { ...newState, currentTurn: 'opponent' },
    'opponent',
    drawCount
  );
  
  // Restore the original current turn
  newState = { ...newState, currentTurn: currentPlayer };
  
  console.log(`Both players drew ${drawCount} cards`);
  return newState;
}

/**
 * Execute a damage and shuffle spell effect (like Forgotten Torch)
 */
function executeDamageAndShuffleSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!effect.value) {
    console.error('Damage and shuffle spell missing value parameter');
    return state;
  }
  
  if (!effect.shuffleCardId) {
    console.error('Damage and shuffle spell missing shuffleCardId parameter');
    return state;
  }
  
  if (!targetId || !targetType) {
    console.error('Damage and shuffle spell requires target ID and type');
    return state;
  }
  
  let newState = { ...state };
  const damageAmount = effect.value;
  const cardIdToShuffle = effect.shuffleCardId;
  const currentPlayer = state.currentTurn || 'player';
  
  // First apply the damage effect
  const damageEffect: SpellEffect = {
    type: 'damage',
    value: damageAmount,
    requiresTarget: true,
    targetType: effect.targetType
  };
  
  newState = executeDamageSpell(newState, damageEffect, targetId, targetType);
  
  // Then shuffle the card into the deck
  // Find the card to shuffle by ID
  const cardToShuffle = allCards.find(card => card.id === cardIdToShuffle);
  
  if (!cardToShuffle) {
    console.error(`Card with ID ${cardIdToShuffle} not found for shuffling`);
    return newState;
  }
  
  // Get current player's deck
  const playerDeck = currentPlayer === 'player' ? 
    newState.players.player.deck : 
    newState.players.opponent.deck;
  
  // Create a card instance to shuffle in
  const cardInstance: CardInstance = {
    instanceId: uuidv4(),
    card: cardToShuffle,
    currentHealth: 0, // Not applicable for spells but required by CardInstance interface
    canAttack: false, // Not applicable for spells but required by CardInstance interface
    isSummoningSick: false, // Not applicable for spells but required by CardInstance interface
    attacksPerformed: 0 // Not applicable for spells but required by CardInstance interface
  };
  
  // Shuffle the card into the current player's deck
  if (currentPlayer === 'player') {
    newState.players.player.deck = [...playerDeck, cardInstance];
  } else {
    newState.players.opponent.deck = [...playerDeck, cardInstance];
  }
  
  console.log(`Shuffled ${cardInstance.card.name} into ${currentPlayer}'s deck`);
  
  return newState;
}

/**
 * Execute a cost reduction spell effect
 */
function executeCostReductionSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Cost reduction spell missing value parameter');
    return state;
  }
  
  let newState = { ...state };
  const reductionAmount = effect.value;
  const currentPlayer = state.currentTurn || 'player';
  const specificRace = effect.specificRace; // For "The next Elemental you play this turn costs (2) less"
  
  // We need to set a temporary state flag to track cost reduction for the next played card
  // This would be implemented in the game engine to apply the discount when playing cards
  
  console.log(`Applied cost reduction of ${reductionAmount} for next ${specificRace || 'card'}`);
  
  // Mark cost reduction in game state 
  // In a real implementation, this would be more sophisticated with proper tracking
  if (currentPlayer === 'player') {
    if (!newState.players.player.tempEffects) {
      newState.players.player.tempEffects = {};
    }
    newState.players.player.tempEffects.costReduction = {
      amount: reductionAmount,
      specificRace: specificRace,
      duration: 'next_card'
    };
  } else {
    if (!newState.players.opponent.tempEffects) {
      newState.players.opponent.tempEffects = {};
    }
    newState.players.opponent.tempEffects.costReduction = {
      amount: reductionAmount,
      specificRace: specificRace,
      duration: 'next_card'
    };
  }
  
  return newState;
}