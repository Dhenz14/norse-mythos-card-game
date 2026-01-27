import { v4 as uuidv4 } from 'uuid';
import { 
  BattlecryEffect, 
  CardInstance, 
  GameState,
  BattlecryTargetType,
  CardData,
  SpellEffect,
  AnimationType
} from '../types';
import { fullCardDatabase } from '../data/cards';
import { useAnimationStore } from '../animations/AnimationManager';
import allCards from '../data/allCards';
import { 
  findCardInstance, 
  createCardInstance, 
  getCardTribe, 
  isCardOfTribe, 
  isMurlocCard,
  instanceToCardData,
  getCardKeywords
} from './cardUtils';
import { transformMinion, silenceMinion } from './transformUtils';
import { dealDamage } from './damageUtils';
import { healTarget } from './effectUtils';
import { setHeroHealth } from './healthModifierUtils';
import { getCardsFromPool } from '../data/discoverPools';
import { getDiscoveryOptions, createDiscoveryFromSpell } from './discoveryUtils';
import { 
  executeRenoJacksonBattlecry, 
  executeKazakusBattlecry,
  executeSoliaBattlecry,
  executeRazaBattlecry,
  executeKrulBattlecry 
} from './highlanderUtils';
import { summonColossalParts } from './colossalUtils';
import executeReturnReturn from '../effects/handlers/battlecry/returnHandler';

/**
 * Execute an AoE damage battlecry effect
 * This can be used for effects like "Deal X damage to all enemy minions"
 * or "Deal damage equal to this minion's Attack to all enemy minions"
 */
function executeAoEDamageBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  // Determine the damage amount
  let damageAmount = battlecry.value || 1;
  
  // If damage is based on a minion's stats (e.g., its Attack)
  if (battlecry.isBasedOnStats && targetType === 'minion' && targetId) {
    // Find the target minion to base damage on
    const playerBattlefield = state.players.player.battlefield || [];
    const opponentBattlefield = state.players.opponent.battlefield || [];
    const targetInfo = findCardInstance(
      [...playerBattlefield, ...opponentBattlefield], 
      targetId
    );
    
    if (targetInfo) {
      // Use the minion's attack value as the damage amount
      damageAmount = targetInfo.card.card.attack || 1; // Default to 1 if attack is undefined
      console.log(`AoE damage based on ${targetInfo.card.card.name}'s attack: ${damageAmount}`);
    }
  }
  
  // Special case for Deathwing-like effects (destroy all other minions)
  if (battlecry.targetType === 'all_minions' && damageAmount >= 1000) {
    console.log('Executing battlecry: Destroy all other minions');
    
    // Find the source minion (the one that caused the battlecry)
    // This needs to be more robust since the targetId parameter may not be set correctly for non-targeted battlecries
    let sourceMinion;
    
    // Make sure battlefield arrays exist to prevent undefined errors
    const playerBattlefield = state.players.player.battlefield || [];
    
    // Try to find the card instance by ID if targetId is provided
    if (targetId) {
      sourceMinion = playerBattlefield.find(
        m => m.instanceId === targetId
      );
      
      if (sourceMinion) {
        console.log(`Found source minion by targetId: ${sourceMinion.card.name}`);
      }
    }
    
    // If we couldn't find it by targetId, try to find it by name (Deathwing)
    if (!sourceMinion) {
      sourceMinion = playerBattlefield.find(
        m => m.card.name === 'Deathwing'
      );
      
      if (sourceMinion) {
        console.log(`Found source minion by name: ${sourceMinion.card.name}`);
      }
    }
    
    // If we found a source minion, preserve it and destroy all others
    if (sourceMinion) {
      // Get the ID of the source minion before we filter
      const sourceId = sourceMinion.instanceId;
      
      // Clear player's minions except the source
      state.players.player.battlefield = state.players.player.battlefield.filter(
        m => m.instanceId === sourceId
      );
      
      // Clear opponent's minions
      state.players.opponent.battlefield = [];
      
      console.log('Destroyed all other minions on the battlefield');
    } else {
      console.error('Could not find source minion for Deathwing battlecry');
    }
    
    // Handle discarding the player's hand if specified in the battlecry
    if (battlecry.discardCount !== undefined && battlecry.discardCount === -1) {
      console.log('Executing battlecry: Discard your hand');
      // -1 is a special value that means "discard entire hand"
      state.players.player.hand = [];
      console.log('Discarded player hand');
    }
    
    return state;
  }
  
  // Process the regular AoE effect for other cards
  if (battlecry.affectsAllEnemies) {
    console.log(`Executing AoE damage battlecry: ${damageAmount} damage to all enemy minions`);
    
    // Apply damage to all enemy minions
    const opponentBattlefield = state.players.opponent.battlefield || [];
    const minionsToRemove: number[] = [];
    
    // First pass: apply damage and track which minions need to be removed
    for (let i = 0; i < opponentBattlefield.length; i++) {
      const minion = opponentBattlefield[i];
      
      // Ensure minion has a currentHealth value
      if (minion.currentHealth === undefined) {
        minion.currentHealth = minion.card.health || 1;
      }
      
      // Check for Divine Shield
      if (minion.hasDivineShield) {
        console.log(`AoE: Divine Shield on ${minion.card.name} absorbed the damage`);
        if (state.players.opponent.battlefield) {
          state.players.opponent.battlefield[i].hasDivineShield = false;
        }
      } else {
        // Apply damage - initialize currentHealth if it's not already defined
        if (state.players.opponent.battlefield && state.players.opponent.battlefield[i].currentHealth === undefined) {
          state.players.opponent.battlefield[i].currentHealth = minion.card.health || 0;
        }
        
        // Apply damage
        if (state.players.opponent.battlefield) {
          state.players.opponent.battlefield[i].currentHealth! -= damageAmount;
          console.log(`AoE: Dealt ${damageAmount} damage to ${minion.card.name}`);
          
          // Check if the minion is destroyed
          if (state.players.opponent.battlefield[i].currentHealth! <= 0) {
            console.log(`${minion.card.name} is destroyed by AoE damage`);
            minionsToRemove.push(i);
          }
        }
      }
    }
    
    // Second pass: remove destroyed minions (in reverse order to avoid index shift issues)
    if (state.players.opponent.battlefield) {
      for (let i = minionsToRemove.length - 1; i >= 0; i--) {
        state.players.opponent.battlefield.splice(minionsToRemove[i], 1);
      }
    }
  }
  
  // Handle discarding cards if specified in the battlecry for other cards too
  if (battlecry.discardCount) {
    if (battlecry.discardCount === -1) {
      // Discard entire hand
      console.log('Executing battlecry: Discard your hand');
      state.players.player.hand = [];
      console.log('Discarded player hand');
    } else if (battlecry.discardCount > 0) {
      // Discard a specific number of cards
      const discardCount = Math.min(battlecry.discardCount, state.players.player.hand.length);
      console.log(`Executing battlecry: Discard ${discardCount} cards`);
      
      if (discardCount > 0) {
        // In Hearthstone, cards are usually discarded at random
        for (let i = 0; i < discardCount; i++) {
          if (state.players.player.hand.length > 0) {
            const randomIndex = Math.floor(Math.random() * state.players.player.hand.length);
            const discardedCard = state.players.player.hand.splice(randomIndex, 1)[0];
            console.log(`Discarded: ${discardedCard.card.name}`);
          }
        }
      }
    }
  }
  
  return state;
}

/**
 * Execute a battlecry effect based on the card and chosen target
 */
/**
 * Execute a battlecry effect based on the card and chosen target
 * @param state Current game state
 * @param cardInstanceId ID of the card with the battlecry
 * @param targetId Optional ID of the target
 * @param targetType Optional type of the target (minion or hero)
 * @returns Updated game state after battlecry execution
 */
export function executeBattlecry(
  state: GameState,
  cardInstanceId: string,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  // Deep clone the state to avoid mutation
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  try {
    // Find the card on the battlefield - the card should already be on the battlefield
    // at this point since playCard moves it there before calling executeBattlecry
    const player = newState.players.player;
    const playerBattlefield = player.battlefield || [];
    let cardInfo = findCardInstance(playerBattlefield, cardInstanceId);
    
    // If not found on battlefield, check the hand as a fallback
    // (though this shouldn't happen in normal gameplay)
    if (!cardInfo) {
      const playerHand = player.hand || [];
      cardInfo = findCardInstance(playerHand, cardInstanceId);
      
      if (!cardInfo) {
        // Log more debug information to help diagnose the issue
        console.error('Card not found for battlecry execution');
        console.error(`Looking for card ID: ${cardInstanceId}`);
        console.error(`Battlefield cards: ${playerBattlefield.map(c => c.instanceId).join(', ')}`);
        console.error(`Hand cards: ${(player.hand || []).map(c => c.instanceId).join(', ')}`);
        // Return original state when card cannot be found
        return state;
      }
    }
    
    const cardInstance = cardInfo.card;
    const battlecry = cardInstance.card.battlecry;
    
    // If the card doesn't have a battlecry, just return the current state
    if (!battlecry || !getCardKeywords(cardInstance.card).includes('battlecry')) {
      return newState;
    }
    
    console.log(`Executing battlecry for ${cardInstance.card.name}`);
    
    // Check if battlecry has a condition and if it's met
    if (battlecry.condition) {
      // Check minion count condition for cards like Gormok the Impaler
      if (battlecry.condition === "minion_count" && battlecry.conditionValue) {
        // Get the number of friendly minions on the battlefield (excluding the card being played)
        const friendlyMinionCount = playerBattlefield.length - 1; // Subtract 1 to exclude the card being played
        
        // Log the condition check for debugging
        console.log(`Checking minion count condition: have ${friendlyMinionCount}, need ${battlecry.conditionValue}`);
        
        // If the condition is not met, don't execute the battlecry
        if (friendlyMinionCount < battlecry.conditionValue) {
          console.log(`Condition not met for battlecry: need at least ${battlecry.conditionValue} other minions, but only have ${friendlyMinionCount}`);
          return newState; // Return without executing the battlecry
        }
        
        console.log(`Condition met for battlecry: have ${friendlyMinionCount} other minions`);
      }
    }
    
    // Check if a target is required but not provided
    if (battlecry.requiresTarget && !targetId) {
      console.error('Battlecry requires a target but none provided');
      return state;
    }
    
    // Process different battlecry types
    switch (battlecry.type) {
      case 'damage':
        return executeDamageBattlecry(newState, battlecry, targetId, targetType);
        
      case 'heal':
        return executeHealBattlecry(newState, battlecry, targetId, targetType);
        
      case 'buff':
        return executeBuffBattlecry(newState, battlecry, targetId);
        
      case 'summon':
        return executeSummonBattlecry(newState, battlecry);
        
      case 'draw':
        return executeDrawBattlecry(newState, battlecry);
        
      case 'draw_both':
        return executeDrawBothBattlecry(newState, battlecry);
        
      case 'discover':
        return executeDiscoverBattlecry(newState, cardInstanceId, battlecry);
        
      case 'aoe_damage':
        return executeAoEDamageBattlecry(newState, battlecry, targetId, targetType);
        
      case 'transform':
        // Check if we have a target ID and a value to use as the cardId to transform into
        if (!targetId || !battlecry.value) {
          console.error('Transform battlecry requires a target and a card ID to transform into');
          return state;
        }
        return transformMinion(newState, targetId, battlecry.value);
        
      case 'silence':
        // Check if we have a target ID
        if (!targetId) {
          console.error('Silence battlecry requires a target');
          return state;
        }
        return silenceMinion(newState, targetId);
        
      case 'set_health':
        // Execute a set health battlecry (like Alexstrasza)
        return executeSetHealthBattlecry(newState, battlecry, targetId, targetType);
        
      case 'cast_all_spells':
        // Execute a cast all spells battlecry (like Zul'jin)
        return executeCastAllSpellsBattlecry(newState);
        
      case 'set_hero_health':
        // Execute a set hero health battlecry (like Amara, Warden of Hope)
        const healthValue = battlecry.value || 40; // Default to 40 if not specified
        // Use the setHeroHealth function from healthModifierUtils
        // Target is always player for now
        return setHeroHealth(newState, 'player', healthValue, cardInstanceId);
        
      case 'debuff':
        // Execute a debuff battlecry (like Aldor Peacekeeper)
        return executeDebuffBattlecry(newState, battlecry, targetId);
        
      case 'add_to_hand':
        // Execute an add card to hand battlecry (like Swashburglar)
        return executeAddToHandBattlecry(newState, battlecry);
        
      case 'destroy':
        // Execute a destroy minion battlecry (like Void Terror, Deathwing)
        return executeDestroyBattlecry(newState, battlecry, targetId);
        
      case 'copy':
        // Execute a copy battlecry (like Faceless Manipulator)
        return executeCopyBattlecry(newState, battlecry, targetId);
        
      case 'return_to_hand':
      case 'return':
        // Execute a return to hand battlecry (like Youthful Brewmaster)
        // Use the specialized handler from returnHandler.ts
        if (cardInstance) {
          return executeReturnReturn(newState, battlecry, cardInstance, targetId);
        }
        return executeReturnToHandBattlecry(newState, battlecry, targetId);
        
      case 'equip_weapon':
        // Execute an equip weapon battlecry (like Arathi Weaponsmith)
        return executeEquipWeaponBattlecry(newState, battlecry);
        
      case 'freeze':
        // Execute a freeze battlecry (like Frost Elemental)
        return executeFreezeBattlecry(newState, battlecry, targetId, targetType);
      
      case 'mind_control':
        // Execute a mind control battlecry (like Sylvanas, Cabal Shadow Priest)
        return executeMindControlBattlecry(newState, battlecry, targetId);
        
      // Highlander card battlecries (no duplicates in deck)
      case 'conditional_full_heal':
        // Execute Reno Jackson's battlecry
        return executeRenoJacksonBattlecry(newState, 'player');
        
      case 'kazakus_potion':
        // Execute Kazakus' custom potion creation battlecry
        return executeKazakusBattlecry(newState, 'player');
        
      case 'conditional_next_spell_costs_zero':
        // Execute Inkmaster Solia's battlecry
        return executeSoliaBattlecry(newState, 'player');
        
      case 'conditional_free_hero_power':
        // Execute Raza the Chained's battlecry
        return executeRazaBattlecry(newState, 'player');
        
      case 'conditional_summon_hand_demons':
        // Execute Krul the Unshackled's battlecry
        return executeKrulBattlecry(newState, 'player');
        
      // Old Gods battlecries (already implemented elsewhere)
      case 'cthun_damage':
      case 'buff_cthun':
      case 'cthun_cultist_damage':
      case 'conditional_self_buff':
      case 'conditional_armor':
      case 'conditional_summon':
      case 'resurrect_deathrattle':
      case 'yogg_saron':
        // These are handled in oldGodsUtils.ts
        return newState;
        
      case 'summon_parts':
        // Execute a battlecry to summon colossal parts
        // This will handle summoning the right parts for Neptulon and other colossal minions
        return executeSummonColossalPartsBattlecry(newState, cardInstanceId);
        
      case 'buff_tribe':
        // Execute a battlecry to buff all minions of a specific tribe
        // Used by cards like Coldlight Seer (Give your other Murlocs +2 Health)
        return executeBuffTribeBattlecry(newState, cardInstanceId, battlecry);
        
      default:
        console.error('Unknown battlecry type: ' + battlecry.type);
        return newState;
    }
  } catch (error) {
    console.error('Error executing battlecry:', error);
    return state;
  }
}

/**
 * Execute a damage battlecry effect
 */
function executeDamageBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  // Get damage amount, default to 1 if not specified
  const damage = battlecry.value || 1;
  
  // If no target is needed, return the state unchanged
  if (!battlecry.requiresTarget) {
    return state;
  }
  
  // Process damage based on target type
  if (targetType === 'hero') {
    // Targeting a hero
    if (targetId === 'opponent') {
      // Damage opponent hero using dealDamage utility
      state = dealDamage(state, 'opponent', 'hero', damage);
      console.log(`Battlecry: Dealt ${damage} damage to opponent hero`);
      
      // Game over check handled by dealDamage function
    } else {
      // Damage player hero (self-damage effects) using dealDamage utility
      state = dealDamage(state, 'player', 'hero', damage);
      console.log(`Battlecry: Dealt ${damage} damage to player hero`);
      
      // Game over check handled by dealDamage function
    }
  } else if (targetType === 'minion') {
    // Targeting a minion
    // Find target on opponent's battlefield
    const opponentBattlefield = state.players.opponent.battlefield || [];
    let targetInfo = findCardInstance(opponentBattlefield, targetId!);
    
    if (targetInfo) {
      // Target is on opponent's side
      const targetMinion = targetInfo.card;
      const targetIndex = targetInfo.index;
      
      // Ensure minion has a currentHealth value
      if (targetMinion.currentHealth === undefined) {
        targetMinion.currentHealth = targetMinion.card.health || 1;
      }
      
      // Check for Divine Shield
      if (targetMinion.hasDivineShield) {
        console.log(`Battlecry: Divine Shield on ${targetMinion.card.name} absorbed the damage`);
        state.players.opponent.battlefield[targetIndex].hasDivineShield = false;
      } else {
        // Apply damage
        if (state.players.opponent.battlefield[targetIndex].currentHealth !== undefined) {
          state.players.opponent.battlefield[targetIndex].currentHealth -= damage;
          console.log(`Battlecry: Dealt ${damage} damage to ${targetMinion.card.name}`);
          
          // Check if the minion is destroyed
          if (state.players.opponent.battlefield[targetIndex].currentHealth <= 0) {
            console.log(`${targetMinion.card.name} is destroyed by battlecry`);
            state.players.opponent.battlefield.splice(targetIndex, 1);
          }
        }
      }
    } else {
      // Check on player's battlefield (for self-targeting battlecries)
      const playerBattlefield = state.players.player.battlefield || [];
      targetInfo = findCardInstance(playerBattlefield, targetId!);
      
      if (!targetInfo) {
        console.error('Target minion not found for battlecry');
        return state;
      }
      
      const targetMinion = targetInfo.card;
      const targetIndex = targetInfo.index;
      
      // Ensure minion has a currentHealth value
      if (targetMinion.currentHealth === undefined) {
        targetMinion.currentHealth = targetMinion.card.health || 1;
      }
      
      // Check for Divine Shield
      if (targetMinion.hasDivineShield) {
        console.log(`Battlecry: Divine Shield on ${targetMinion.card.name} absorbed the damage`);
        state.players.player.battlefield[targetIndex].hasDivineShield = false;
      } else {
        // Apply damage
        if (state.players.player.battlefield[targetIndex].currentHealth !== undefined) {
          state.players.player.battlefield[targetIndex].currentHealth -= damage;
          console.log(`Battlecry: Dealt ${damage} damage to friendly ${targetMinion.card.name}`);
          
          // Check if the minion is destroyed
          if (state.players.player.battlefield[targetIndex].currentHealth <= 0) {
            console.log(`${targetMinion.card.name} is destroyed by battlecry`);
            state.players.player.battlefield.splice(targetIndex, 1);
          }
        }
      }
    }
  }
  
  return state;
}

/**
 * Execute a heal battlecry effect
 */
function executeHealBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  // Get heal amount, default to 2 if not specified
  const healAmount = battlecry.value || 2;
  
  // If no target is needed, return the state unchanged
  if (!battlecry.requiresTarget) {
    return state;
  }
  
  // Process healing based on target type
  if (targetType === 'hero') {
    // Targeting a hero
    if (targetId === 'opponent') {
      // Heal opponent hero using healTarget function
      state = healTarget(state, 'opponent', 'hero', healAmount);
      console.log(`Battlecry: Healed opponent hero for ${healAmount}`);
    } else {
      // Heal player hero using healTarget function
      state = healTarget(state, 'player', 'hero', healAmount);
      console.log(`Battlecry: Healed player hero for ${healAmount}`);
    }
  } else if (targetType === 'minion') {
    // Targeting a minion
    // Find target on opponent's battlefield
    const opponentBattlefield = state.players.opponent.battlefield || [];
    let targetInfo = findCardInstance(opponentBattlefield, targetId!);
    
    if (targetInfo) {
      // Target is on opponent's side
      const targetMinion = targetInfo.card;
      
      // Use healTarget utility function
      state = healTarget(state, 'opponent', targetId!, healAmount);
      console.log(`Battlecry: Healed ${targetMinion.card.name} for ${healAmount}`);
    } else {
      // Check on player's battlefield
      const playerBattlefield = state.players.player.battlefield || [];
      targetInfo = findCardInstance(playerBattlefield, targetId!);
      
      if (!targetInfo) {
        console.error('Target minion not found for heal battlecry');
        return state;
      }
      
      const targetMinion = targetInfo.card;
      
      // Use healTarget utility function
      state = healTarget(state, 'player', targetId!, healAmount);
      console.log(`Battlecry: Healed ${targetMinion.card.name} for ${healAmount}`);
    }
  }
  
  return state;
}

/**
 * Execute a buff battlecry effect (giving +X/+Y stats to a minion)
 */
function executeBuffBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  // Get buff values, default to +1/+1 if not specified
  const attackBuff = battlecry.buffAttack || 1;
  const healthBuff = battlecry.buffHealth || 1;
  
  // If no target is needed, return the state unchanged
  if (!battlecry.requiresTarget) {
    return state;
  }
  
  // Find target minion based on battlecry target type
  if (battlecry.targetType === 'friendly_minion' || battlecry.targetType === 'any_minion') {
    // Try to find on player's battlefield
    const playerBattlefield = state.players.player.battlefield || [];
    const targetInfo = findCardInstance(playerBattlefield, targetId!);
    
    if (!targetInfo) {
      console.error('Target minion not found for buff battlecry');
      return state;
    }
    
    const targetMinion = targetInfo.card;
    const targetIndex = targetInfo.index;
    
    // Ensure minion has a currentHealth value
    if (targetMinion.currentHealth === undefined) {
      targetMinion.currentHealth = targetMinion.card.health || 1;
    }
    
    // Apply buff to attack and health
    const newAttack = (targetMinion.card.attack || 0) + attackBuff;
    const currentHealth = targetMinion.currentHealth || 1;
    const maxHealth = targetMinion.card.health || 1;
    const newMaxHealth = maxHealth + healthBuff;
    const newCurrentHealth = currentHealth + healthBuff;
    
    // Ensure player battlefield exists
    if (!state.players.player.battlefield) {
      state.players.player.battlefield = [];
      console.error('Player battlefield was undefined during buff battlecry');
      return state;
    }
    
    // Update the card's stats
    state.players.player.battlefield[targetIndex].card = {
      ...targetMinion.card,
      attack: newAttack,
      health: newMaxHealth
    };
    
    // Update current health
    state.players.player.battlefield[targetIndex].currentHealth = newCurrentHealth;
    
    console.log(`Battlecry: Buffed ${targetMinion.card.name} with +${attackBuff}/+${healthBuff}`);
  } else if (battlecry.targetType === 'enemy_minion') {
    // Try to find on opponent's battlefield (for debuffs or enemy buffs)
    const opponentBattlefield = state.players.opponent.battlefield || [];
    const targetInfo = findCardInstance(opponentBattlefield, targetId!);
    
    if (!targetInfo) {
      console.error('Target enemy minion not found for buff battlecry');
      return state;
    }
    
    const targetMinion = targetInfo.card;
    const targetIndex = targetInfo.index;
    
    // Ensure minion has a currentHealth value
    if (targetMinion.currentHealth === undefined) {
      targetMinion.currentHealth = targetMinion.card.health || 1;
    }
    
    // Apply buff to attack and health
    const newAttack = (targetMinion.card.attack || 0) + attackBuff;
    const currentHealth = targetMinion.currentHealth || 1;
    const maxHealth = targetMinion.card.health || 1;
    const newMaxHealth = maxHealth + healthBuff;
    const newCurrentHealth = currentHealth + healthBuff;
    
    // Ensure opponent battlefield exists
    if (!state.players.opponent.battlefield) {
      state.players.opponent.battlefield = [];
      console.error('Opponent battlefield was undefined during buff battlecry');
      return state;
    }
    
    // Update the card's stats
    state.players.opponent.battlefield[targetIndex].card = {
      ...targetMinion.card,
      attack: newAttack,
      health: newMaxHealth
    };
    
    // Update current health
    state.players.opponent.battlefield[targetIndex].currentHealth = newCurrentHealth;
    
    console.log(`Battlecry: Buffed enemy ${targetMinion.card.name} with +${attackBuff}/+${healthBuff}`);
  }
  
  return state;
}

/**
 * Execute a buff tribe battlecry effect (e.g. Coldlight Seer buffing all Murlocs)
 * This handles cards like Coldlight Seer that buff all minions of a specific tribe
 */
function executeBuffTribeBattlecry(
  state: GameState,
  cardInstanceId: string,
  battlecry: BattlecryEffect
): GameState {
  // Create a deep copy of the state to avoid mutation
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  try {
    // Get the source card (the one with the buff tribe battlecry)
    const cardInfo = findCardInstance(newState.players.player.battlefield || [], cardInstanceId);
    if (!cardInfo) {
      console.error('Card not found for buff tribe battlecry', cardInstanceId);
      return state;
    }
    
    const sourceCard = cardInfo.card;
    const tribeName = battlecry.tribe || '';
    
    if (!tribeName) {
      console.error('No tribe specified for buff tribe battlecry');
      return state;
    }
    
    console.log(`Executing buff tribe battlecry for ${sourceCard.card.name} targeting tribe: ${tribeName}`);
    
    // Get buff values from the battlecry
    const attackBuff = battlecry.buffs?.attack || 0;
    const healthBuff = battlecry.buffs?.health || 0;
    
    // Only proceed if at least one stat is being buffed
    if (attackBuff === 0 && healthBuff === 0) {
      console.error('No buff values provided for buff tribe battlecry');
      return state;
    }
    
    // Track buffed minions for logging
    let buffedCount = 0;
    
    // Apply buffs to all matching minions on the player's battlefield
    if (newState.players.player.battlefield) {
      newState.players.player.battlefield.forEach((minion, index) => {
        // Skip the source minion if it's "other" minions only (which is the usual case)
        if (minion.instanceId === cardInstanceId) {
          return;
        }
        
        // Check if this minion belongs to the specified tribe
        if (isCardOfTribe(minion.card, tribeName)) {
          // Found a matching minion, buff it
          const currentAttack = minion.card.attack || 0;
          const currentHealth = minion.card.health || 0;
          const currentHealthValue = minion.currentHealth || currentHealth;
          
          // Update the stats
          newState.players.player.battlefield[index].card = {
            ...minion.card,
            attack: currentAttack + attackBuff,
            health: currentHealth + healthBuff
          };
          
          // Update current health
          newState.players.player.battlefield[index].currentHealth = currentHealthValue + healthBuff;
          
          console.log(`Buffed ${minion.card.name} with +${attackBuff}/+${healthBuff} from ${sourceCard.card.name} battlecry`);
          buffedCount++;
        }
      });
    }
    
    console.log(`Buff tribe battlecry affected ${buffedCount} ${tribeName} minions`);
    
    // Trigger animation
    const addAnimation = useAnimationStore.getState().addAnimation;
    addAnimation({
      id: `buff-tribe-${tribeName}-${Date.now()}`,
      type: 'buff' as AnimationType,
      sourceId: sourceCard.card.id,
      message: `Buffed all ${tribeName}s!`,
      position: { x: 400, y: 300 },
      duration: 800
    });
    
    return newState;
  } catch (error) {
    console.error('Error executing buff tribe battlecry:', error);
    return state;
  }
}

/**
 * Execute a summon battlecry effect (summoning a specific minion)
 */
function executeSummonBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  // Check if a card ID is provided for summoning
  if (!battlecry.summonCardId) {
    console.error('No card ID provided for summon battlecry');
    return state;
  }
  
  // Find the card data in the database (both regular and token cards)
  const cardToSummon = fullCardDatabase.find(card => card.id === battlecry.summonCardId);
  
  if (!cardToSummon) {
    console.error(`Card with ID ${battlecry.summonCardId} not found for summoning`);
    return state;
  }
  
  // Create a new instance of the card
  const summonedCard = createCardInstance(cardToSummon);
  
  // Mark the card as already played (it's going directly to battlefield)
  summonedCard.isPlayed = true;
  
  // Add to player's battlefield (ensuring it exists first)
  if (!state.players.player.battlefield) {
    state.players.player.battlefield = [];
  }
  state.players.player.battlefield.push(summonedCard);
  
  console.log(`Battlecry: Summoned ${cardToSummon.name}`);
  
  return state;
}

/**
 * Execute a draw battlecry effect (drawing X cards)
 */
function executeDrawBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  // Get number of cards to draw, default to 1 if not specified
  const cardsToDraw = battlecry.value || 1;
  let drawnCount = 0;
  
  // Check if we need to draw specific card types (e.g., Murlocs)
  const cardType = battlecry.cardType?.toLowerCase();
  
  // Handle discard effects (negative card draw values)
  if (cardsToDraw < 0) {
    const cardsToDiscard = Math.abs(cardsToDraw);
    console.log(`Executing discard battlecry: Discard ${cardsToDiscard} cards`);
    
    // Only discard if there are cards in hand
    if (state.players.player.hand.length > 0) {
      // Choose random cards to discard
      for (let i = 0; i < cardsToDiscard; i++) {
        if (state.players.player.hand.length === 0) break;
        
        // Get a random index
        const randomIndex = Math.floor(Math.random() * state.players.player.hand.length);
        const discardedCard = state.players.player.hand[randomIndex];
        
        // Remove the card from hand
        state.players.player.hand.splice(randomIndex, 1);
        console.log(`Battlecry: Discarded ${discardedCard.card.name}`);
      }
    } else {
      console.log(`No cards in hand to discard`);
    }
    
    return state;
  }
  
  console.log(`Executing draw battlecry: Draw ${cardsToDraw} ${cardType || 'any'} cards`);
  
  // If filtering by card type, create a filtered deck copy
  let eligibleCards = [...state.players.player.deck];
  
  if (cardType) {
    console.log(`Filtering deck for ${cardType} cards`);
    
    // Debug all cards in the deck BEFORE filtering
    console.log("DEBUG - All cards in deck before filtering:");
    state.players.player.deck.forEach(card => {
      // Using our new utility function to get tribe/race consistently
      const tribe = getCardTribe(card);
      console.log(`Card: ${card.name}, ID: ${card.id}, Type: ${card.type}, Race/Tribe: ${tribe || 'none'}`);
    });
    
    // Use our new utility functions for consistent tribe/race checking
    if (cardType === 'murloc') {
      eligibleCards = state.players.player.deck.filter(card => isMurlocCard(card));
    } else if (cardType === 'beast' || cardType === 'dragon' || 
               cardType === 'mech' || cardType === 'demon' || 
               cardType === 'elemental' || cardType === 'totem' || 
               cardType === 'pirate') {
      // For other tribes/races, use the generic isCardOfTribe utility
      eligibleCards = state.players.player.deck.filter(card => isCardOfTribe(card, cardType));
    } else {
      // For non-tribe filtering (like card types: spell, weapon, etc.)
      eligibleCards = state.players.player.deck.filter(card => 
        card.type?.toLowerCase() === cardType
      );
    }
    
    // Log matching cards
    eligibleCards.forEach(card => {
      const tribe = getCardTribe(card);
      console.log(`MATCH FOUND: ${card.name} (${tribe || 'no race/tribe'})`);
    });
    
    console.log(`Found ${eligibleCards.length} ${cardType} cards in deck after filtering`);
    
    // If no cards found, try fallback to allCards to ensure at least some cards are available
    if (eligibleCards.length === 0) {
      console.log("No matching cards in deck. Checking hand for any matching cards");
      
      // Check hand for matching cards using our new utility functions
      if (cardType === 'murloc') {
        const handMurlocs = state.players.player.hand
          .filter(cardInstance => isMurlocCard(cardInstance))
          .map(instance => instance.card);
        
        eligibleCards = [...handMurlocs];
      } else {
        const handTribes = state.players.player.hand
          .filter(cardInstance => isCardOfTribe(cardInstance, cardType))
          .map(instance => instance.card);
        
        eligibleCards = [...handTribes];
      }
      
      if (eligibleCards.length === 0) {
        console.log("Still no matching cards found. Adding from allCards collection");
        
        // For Murlocs specifically
        if (cardType === 'murloc') {
          const murlocCards = allCards.filter((card: CardData) => isMurlocCard(card));
          eligibleCards = murlocCards.slice(0, cardsToDraw);
          console.log(`Added ${eligibleCards.length} Murloc cards from allCards collection`);
        }
      }
    }
  }
  
  // Draw cards from the eligible cards
  while (drawnCount < cardsToDraw && eligibleCards.length > 0) {
    // Get the first eligible card
    const drawnCard = eligibleCards[0];
    
    // Remove from eligible cards
    eligibleCards.splice(0, 1);
    
    // Log detailed information about the card being drawn
    const cardTribe = getCardTribe(drawnCard);
    console.log(`Drawing card: ${drawnCard.name}, ID: ${drawnCard.id}`);
    console.log(`Card details - Type: ${drawnCard.type}, Race/Tribe: ${cardTribe || 'none'}`);
    
    // Remove from the actual deck if it exists there
    const indexInDeck = state.players.player.deck.findIndex(
      card => card.id === drawnCard.id
    );
    
    if (indexInDeck !== -1) {
      // Card exists in deck, remove it
      console.log(`Found card in deck at index ${indexInDeck}`);
      state.players.player.deck.splice(indexInDeck, 1);
    } else {
      // Card doesn't exist in deck, but we'll still add it to hand
      // This is a special case for when we had to use the fallback
      console.log(`Card ${drawnCard.name} not found in deck, but still adding to hand for Giga-Fin functionality`);
    }
    
    // Create a card instance and add it to the hand
    const cardInstance = createCardInstance(drawnCard);
    
    // Add the card instance to hand (not just the card data)
    state.players.player.hand.push(cardInstance);
    
    console.log(`Battlecry: Drew ${drawnCard.name} (${cardType || 'any type'})`);
    drawnCount++;
  }
  
  // Log if we couldn't draw enough cards
  if (drawnCount < cardsToDraw) {
    console.log(`Could only draw ${drawnCount}/${cardsToDraw} ${cardType || ''} cards`);
  } else {
    console.log(`Successfully drew ${drawnCount} ${cardType || ''} cards`);
  }
  
  // Add animation for card draws
  // Access the animation store directly so we don't need to make battlecryUtils.ts a React component
  if (typeof window !== 'undefined') {
    // Only run in browser environment
    setTimeout(() => {
      // We're using setTimeout to ensure this runs after the state update is processed
      if (drawnCount > 0) {
        const animationStore = useAnimationStore.getState();
        
        // Use specialized animation for different card types
        if (cardType === 'murloc') {
          console.log('Adding specialized Murloc draw animation');
          // Create a specialized animation for Murlocs using standard animation API
          animationStore.addAnimation({
            id: `murloc-draw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'draw',
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 },
            value: drawnCount,
            duration: 1600,
            cardType: 'murloc' // This is important for the specialized animation renderer
          });
          
          // Play the murloc sound effect directly
          const audio = new Audio('/sounds/tribes/murloc_summon.mp3');
          audio.volume = 0.7;
          audio.play().catch(err => console.error('Failed to play murloc sound:', err));
        } else if (cardType === 'beast') {
          console.log('Adding specialized Beast draw animation');
          // Create a specialized animation for Beasts using standard animation API
          animationStore.addAnimation({
            id: `beast-draw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'draw',
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 },
            value: drawnCount,
            duration: 1600,
            cardType: 'beast' // This is important for the specialized animation renderer
          });
          
          // Play the beast sound effect directly
          const audio = new Audio('/sounds/tribes/beast_summon.mp3');
          audio.volume = 0.7;
          audio.play().catch(err => console.error('Failed to play beast sound:', err));
        } else {
          // Add standard draw animation for other card types
          animationStore.addAnimation({
            id: `draw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'draw',
            position: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 },
            value: drawnCount,
            duration: 1500,
            cardType: cardType || 'default' // Pass the cardType for any other specialized animations
          });
        }
      }
    }, 100);
  }
  
  return state;
}

/**
 * Execute a battlecry effect that draws cards for both players
 * Used for cards like Coldlight Oracle: "Battlecry: Each player draws 2 cards."
 */
function executeDrawBothBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  // Get number of cards to draw, default to 2 if not specified
  const cardsToDraw = battlecry.value || 2;
  let playerDrawnCount = 0;
  let opponentDrawnCount = 0;
  
  console.log(`Executing draw_both battlecry: Each player draws ${cardsToDraw} cards`);
  
  // Draw cards for player
  for (let i = 0; i < cardsToDraw; i++) {
    if (state.players.player.deck.length > 0) {
      const drawnCard = state.players.player.deck.shift()!;
      // Create a card instance and add it to the hand
      const cardInstance = createCardInstance(drawnCard);
      state.players.player.hand.push(cardInstance);
      console.log(`Player drew ${drawnCard.name}`);
      playerDrawnCount++;
    } else {
      console.log(`Player's deck is empty, cannot draw more cards`);
      // Apply fatigue damage here if needed (similar to Hearthstone)
      // This would be where you'd increment fatigue counter and deal increasing damage
    }
  }
  
  // Draw cards for opponent
  for (let i = 0; i < cardsToDraw; i++) {
    if (state.players.opponent.deck.length > 0) {
      const drawnCard = state.players.opponent.deck.shift()!;
      // Create a card instance and add it to the hand
      const cardInstance = createCardInstance(drawnCard);
      state.players.opponent.hand.push(cardInstance);
      console.log(`Opponent drew ${drawnCard.name}`);
      opponentDrawnCount++;
    } else {
      console.log(`Opponent's deck is empty, cannot draw more cards`);
      // Apply fatigue damage here if needed
    }
  }
  
  // Add animation for card draws
  if (typeof window !== 'undefined') {
    // Only run in browser environment
    setTimeout(() => {
      const animationStore = useAnimationStore.getState();
      
      // Add standard draw animation
      animationStore.addAnimation({
        id: `draw_both_${Date.now()}`,  // Add a unique ID for the animation
        type: 'draw_both' as AnimationType, // Explicitly cast to AnimationType
        position: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 },
        value: cardsToDraw,
        duration: 1500,
        playerDrawCount: playerDrawnCount,
        opponentDrawCount: opponentDrawnCount
      });
    }, 100);
  }
  
  return state;
}

/**
 * Execute a discover battlecry effect - allowing the player to discover a card
 */
function executeDiscoverBattlecry(
  state: GameState,
  cardInstanceId: string,
  battlecry: BattlecryEffect
): GameState {
  console.log(`Executing discover battlecry with pool: ${battlecry.discoveryPoolId}`);
  
  try {
    // Get cards from the discovery pool
    let discoveryCards: CardData[] = [];
    
    if (battlecry.discoveryPoolId) {
      // Get cards from a predefined pool like 'beast', 'dragon', etc.
      discoveryCards = getCardsFromPool(battlecry.discoveryPoolId);
      console.log(`Found ${discoveryCards.length} cards in discovery pool ${battlecry.discoveryPoolId}`);
    } else {
      // Map special discovery types to valid type values for discovery
      let discoveryCardType: 'spell' | 'minion' | 'weapon' | 'secret' | 'any' = 'any';
      if (battlecry.discoveryType) {
        // Handle special discovery types that aren't direct CardType values
        if (battlecry.discoveryType === 'taunt_minion' || battlecry.discoveryType === 'deathrattle_minion') {
          discoveryCardType = 'minion';
        } else if (battlecry.discoveryType === 'spell') {
          discoveryCardType = 'spell';
        } else if (battlecry.discoveryType === 'minion') {
          discoveryCardType = 'minion';
        } else if (battlecry.discoveryType === 'weapon') {
          discoveryCardType = 'weapon';
        } else if (battlecry.discoveryType === 'secret') {
          discoveryCardType = 'secret';
        }
      }
      
      // Fall back to general discovery based on type if no pool is specified
      discoveryCards = getDiscoveryOptions(
        3, // Default to 3 options
        discoveryCardType,
        battlecry.discoveryClass || 'any',
        'any', // Card rarity
        battlecry.discoveryManaCost || 'any',
        'any' // Mana cost range
      );
      console.log(`Generated ${discoveryCards.length} discovery options from type: ${discoveryCardType}`);
    }
    
    // If we couldn't get any cards, return the state unchanged
    if (discoveryCards.length === 0) {
      console.error('No cards available for discovery');
      return state;
    }
    
    // Map special discovery types to valid discoveryType values for SpellEffect
    let spellDiscoveryType: 'spell' | 'minion' | 'weapon' | 'secret' | 'any' | undefined = undefined;
    if (battlecry.discoveryType) {
      if (battlecry.discoveryType === 'taunt_minion' || battlecry.discoveryType === 'deathrattle_minion') {
        spellDiscoveryType = 'minion';
      } else if (['spell', 'minion', 'weapon', 'secret', 'any'].includes(battlecry.discoveryType)) {
        spellDiscoveryType = battlecry.discoveryType as 'spell' | 'minion' | 'weapon' | 'secret' | 'any';
      } else {
        spellDiscoveryType = 'any';
      }
    } else {
      spellDiscoveryType = 'any';
    }
    
    // Create a discovery effect to use with the existing discovery system
    const dummySpellEffect: SpellEffect = {
      type: 'discover',
      requiresTarget: false,
      discoveryType: spellDiscoveryType,
      discoveryClass: battlecry.discoveryClass || 'any',
      discoveryCount: battlecry.discoveryCount || 3,
      discoveryRarity: 'any',
      discoveryManaCost: battlecry.discoveryManaCost || 'any',
      discoveryPoolId: battlecry.discoveryPoolId,
      targetType: 'none'
    };
    
    // Create a discovery state
    const discoveryState = createDiscoveryFromSpell(state, dummySpellEffect, cardInstanceId);
    
    // Override the options with our discovery cards
    discoveryState.options = discoveryCards.slice(0, 3); // Limit to 3 options
    discoveryState.allOptions = [...discoveryCards]; // Store all for filtering
    
    // Special handling for opponent's turn - AI should auto-select a card instead of showing the discovery UI
    if (state.currentTurn === 'opponent') {
      console.log("AI opponent's discover effect - auto-selecting a card");
      
      // Choose a card with higher value/cost for the AI (simple heuristic)
      let bestCardIndex = 0;
      let bestCardValue = -1;
      
      discoveryState.options.forEach((card, index) => {
        // Simple AI heuristic: prefer higher mana cost cards as a starting point
        let cardValue = card.manaCost * 2;
        
        // Add value for keywords that are generally powerful
        if (getCardKeywords(card).includes('taunt')) cardValue += 2;
        if (getCardKeywords(card).includes('divine_shield')) cardValue += 3;
        if (getCardKeywords(card).includes('rush') || getCardKeywords(card).includes('charge')) cardValue += 4;
        if (getCardKeywords(card).includes('poisonous')) cardValue += 3;
        if (getCardKeywords(card).includes('windfury')) cardValue += 2;
        if (getCardKeywords(card).includes('lifesteal')) cardValue += 3;
        
        // Add value for high attack or health
        if (card.attack && card.attack > 4) cardValue += card.attack; 
        if (card.health && card.health > 4) cardValue += card.health;
        
        if (cardValue > bestCardValue) {
          bestCardValue = cardValue;
          bestCardIndex = index;
        }
      });
      
      const selectedCard = discoveryState.options[bestCardIndex];
      
      console.log(`AI selected: ${selectedCard.name} from discovery options (value: ${bestCardValue})`);
      
      // Add the selected card directly to the opponent's hand as CardData
      state.players.opponent.hand.push(selectedCard);
      
      // Return the state without setting up the discovery UI since the AI handled it
      return state;
    }
    
    // For the player's turn, update the game state with the discovery UI
    return {
      ...state,
      discovery: discoveryState
    };
  } catch (error) {
    console.error('Error executing discover battlecry:', error);
    return state;
  }
}

/**
 * Check if a card requires a battlecry target
 */
export function requiresBattlecryTarget(card: CardData): boolean {
  return (
    getCardKeywords(card).includes('battlecry') &&
    card.battlecry !== undefined &&
    card.battlecry.requiresTarget
  );
}

/**
 * Execute a set health battlecry effect (setting a hero's health to a specific value)
 */
function executeSetHealthBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  // Get the health value to set
  const healthValue = battlecry.value || 15; // Default to 15 for Alexstrasza
  
  // If no target is needed or target is not a hero, return the state unchanged
  if (!battlecry.requiresTarget || targetType !== 'hero') {
    console.error('Set health battlecry requires a hero target');
    return state;
  }
  
  // Set health based on target
  if (targetId === 'opponent') {
    // Set opponent hero health
    state.players.opponent.health = healthValue;
    console.log(`Battlecry: Set opponent hero's health to ${healthValue}`);
  } else {
    // Set player hero health
    state.players.player.health = healthValue;
    console.log(`Battlecry: Set player hero's health to ${healthValue}`);
  }
  
  return state;
}

/**
 * Execute a cast all spells battlecry effect (like Zul'jin)
 */
function executeCastAllSpellsBattlecry(state: GameState): GameState {
  console.log('Executing cast all spells battlecry');
  
  // In a real game, we'd track all spells played and replay them with random targets
  // For this implementation, we'll just log the effect
  console.log(`Battlecry: Cast all previously played spells (targets chosen randomly)`);
  
  // Create a copy of the state to work with
  let newState = { ...state };
  
  // In a proper implementation, we would iterate through the spell history
  // and replay each spell with random targets. But for now, this is a placeholder.
  
  return newState;
}

/**
 * Execute a debuff battlecry effect (reducing a minion's stats)
 */
function executeDebuffBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  // Get debuff values
  const attackDebuff = battlecry.buffAttack || -1;
  
  // If no target is needed, return the state unchanged
  if (!battlecry.requiresTarget) {
    return state;
  }
  
  // Since this is a debuff, we're likely targeting an enemy minion
  if (battlecry.targetType === 'enemy_minion') {
    // Find the target on opponent's battlefield
    const targetInfo = findCardInstance(state.players.opponent.battlefield, targetId!);
    
    if (!targetInfo) {
      console.error('Target enemy minion not found for debuff battlecry');
      return state;
    }
    
    const targetMinion = targetInfo.card;
    const targetIndex = targetInfo.index;
    
    // Ensure card attack value is defined
    if (targetMinion.card.attack === undefined) {
      targetMinion.card.attack = 0;
    }
    
    // Handle the Aldor Peacekeeper special case (set attack to 1)
    let newAttack = targetMinion.card.attack || 0;
    if (attackDebuff === -1000) { // Special value we defined for "set to 1"
      newAttack = 1;
    } else {
      // Apply regular debuff, but don't go below 0
      newAttack = Math.max(0, (targetMinion.card.attack || 0) + attackDebuff);
    }
    
    // Update the card's attack
    state.players.opponent.battlefield[targetIndex].card = {
      ...targetMinion.card,
      attack: newAttack
    };
    
    console.log(`Battlecry: Debuffed enemy ${targetMinion.card.name}'s attack to ${newAttack}`);
  }
  
  return state;
}

/**
 * Execute an add to hand battlecry effect (adding cards to player's hand)
 */
function executeAddToHandBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  // Get number of cards to add and the card ID if specified
  const numCards = battlecry.value || 1;
  const cardId = battlecry.summonCardId; // Optional specific card to add
  
  if (cardId) {
    // Add a specific card to the hand
    const cardToAdd = fullCardDatabase.find(card => card.id === cardId);
    
    if (!cardToAdd) {
      console.error(`Card with ID ${cardId} not found for add to hand battlecry`);
      return state;
    }
    
    // Add the specific card to hand
    for (let i = 0; i < numCards; i++) {
      if (state.players.player.hand.length >= 9) {
        console.log('Hand is full, card burned');
        break;
      }
      
      // Create a card instance and add it to the hand
      const cardInstance = createCardInstance(cardToAdd);
      state.players.player.hand.push(cardInstance);
      console.log(`Battlecry: Added ${cardToAdd.name} to hand`);
    }
  } else {
    // Add random cards (like a discovery/random generation effect)
    // For now, just adding random cards from the database as a placeholder
    for (let i = 0; i < numCards; i++) {
      if (state.players.player.hand.length >= 9) {
        console.log('Hand is full, card burned');
        break;
      }
      
      // Generate a random card as a placeholder
      // In a real implementation, this would follow specific rules based on the card's effect
      const randomIndex = Math.floor(Math.random() * fullCardDatabase.length);
      const randomCard = fullCardDatabase[randomIndex];
      
      // Create a card instance and add it to the hand
      const cardInstance = createCardInstance(randomCard);
      state.players.player.hand.push(cardInstance);
      console.log(`Battlecry: Added random card ${randomCard.name} to hand`);
    }
  }
  
  return state;
}

/**
 * Execute a destroy battlecry effect (destroying targeted minions)
 */
function executeDestroyBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  // If no target is required, it might be a "destroy all" effect
  if (!battlecry.requiresTarget) {
    if (battlecry.targetType === 'all_minions') {
      // Clear all minions from both sides of the battlefield (like Deathwing)
      state.players.player.battlefield = [];
      state.players.opponent.battlefield = [];
      console.log('Battlecry: Destroyed all minions on the battlefield');
    } else if (battlecry.targetType === 'all_enemy_minions') {
      // Clear enemy minions
      state.players.opponent.battlefield = [];
      console.log('Battlecry: Destroyed all enemy minions');
    }
    return state;
  }
  
  // Otherwise find and destroy the targeted minion
  // First check if this is a tribe-specific destroy (like "Destroy a Beast")
  const tribeTargets = ['beast', 'mech', 'murloc', 'dragon', 'demon', 'pirate', 'totem', 'elemental', 'undead'];
  const isTribeTarget = tribeTargets.includes(battlecry.targetType || '');
  
  if (isTribeTarget || battlecry.targetType === 'enemy_minion' || battlecry.targetType === 'any_minion') {
    // Check opponent's battlefield first
    let targetInfo = findCardInstance(state.players.opponent.battlefield, targetId!);
    
    if (targetInfo) {
      const targetMinion = targetInfo.card;
      const targetIndex = targetInfo.index;
      
      // If tribe-specific, validate the target has the correct race
      if (isTribeTarget) {
        const targetRace = (targetMinion.card.race || targetMinion.card.tribe || '').toLowerCase();
        if (targetRace !== battlecry.targetType) {
          console.log(`Battlecry: Target ${targetMinion.card.name} is not a ${battlecry.targetType} (race: ${targetRace || 'none'})`);
          return state;
        }
      }
      
      // Remove the minion
      state.players.opponent.battlefield.splice(targetIndex, 1);
      console.log(`Battlecry: Destroyed enemy ${targetMinion.card.name}`);
      return state;
    }
    
    // If targeting any minion or tribe, also check player's battlefield
    if (battlecry.targetType === 'any_minion' || isTribeTarget) {
      targetInfo = findCardInstance(state.players.player.battlefield, targetId!);
      
      if (targetInfo) {
        const targetMinion = targetInfo.card;
        const targetIndex = targetInfo.index;
        
        // If tribe-specific, validate the target has the correct race
        if (isTribeTarget) {
          const targetRace = (targetMinion.card.race || targetMinion.card.tribe || '').toLowerCase();
          if (targetRace !== battlecry.targetType) {
            console.log(`Battlecry: Target ${targetMinion.card.name} is not a ${battlecry.targetType} (race: ${targetRace || 'none'})`);
            return state;
          }
        }
        
        // Remove the minion
        state.players.player.battlefield.splice(targetIndex, 1);
        console.log(`Battlecry: Destroyed friendly ${targetMinion.card.name}`);
      } else {
        console.error('Target minion not found for destroy battlecry');
      }
    }
  }
  
  return state;
}

/**
 * Execute a copy battlecry effect (creating copies of minions)
 */
function executeCopyBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  // If no target is needed, return the state unchanged
  if (!battlecry.requiresTarget) {
    return state;
  }
  
  // Find the target minion to copy
  let targetInfo;
  let isPlayerMinion = false;
  
  // Check opponent's battlefield
  targetInfo = findCardInstance(state.players.opponent.battlefield, targetId!);
  
  // If not found, check player's battlefield
  if (!targetInfo) {
    targetInfo = findCardInstance(state.players.player.battlefield, targetId!);
    isPlayerMinion = true;
    
    if (!targetInfo) {
      console.error('Target minion not found for copy battlecry');
      return state;
    }
  }
  
  const targetMinion = targetInfo.card;
  
  // Create a copy of the minion with the same stats and effects
  const copiedMinionData = { ...targetMinion.card };
  const copiedMinion = createCardInstance(copiedMinionData);
  
  // Copy current health and other relevant status effects
  copiedMinion.currentHealth = targetMinion.currentHealth;
  copiedMinion.hasDivineShield = targetMinion.hasDivineShield;
  copiedMinion.isSummoningSick = true; // A newly copied minion still has summoning sickness
  copiedMinion.isPlayed = true;
  
  // Add the copy to the player's battlefield
  state.players.player.battlefield.push(copiedMinion);
  
  console.log(`Battlecry: Copied ${isPlayerMinion ? "friendly" : "enemy"} ${targetMinion.card.name}`);
  
  return state;
}

/**
 * Execute a return to hand battlecry effect (returning minions to hand)
 */
function executeReturnToHandBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  // If no target is needed, return the state unchanged
  if (!battlecry.requiresTarget) {
    return state;
  }
  
  if (battlecry.targetType === 'friendly_minion' || battlecry.targetType === 'any_minion') {
    // Find target on player's battlefield
    const targetInfo = findCardInstance(state.players.player.battlefield, targetId!);
    
    if (!targetInfo) {
      console.error('Target minion not found for return to hand battlecry');
      return state;
    }
    
    const targetMinion = targetInfo.card;
    const targetIndex = targetInfo.index;
    
    // Check if hand is full (max 9 cards like Hearthstone)
    if (state.players.player.hand.length >= 9) {
      console.log('Hand is full, card destroyed');
      state.players.player.battlefield.splice(targetIndex, 1);
      return state;
    }
    
    // Create a new card instance and add it to the hand
    const cardInstance = createCardInstance(targetMinion.card);
    state.players.player.hand.push(cardInstance);
    
    // Remove from battlefield
    state.players.player.battlefield.splice(targetIndex, 1);
    
    console.log(`Battlecry: Returned ${targetMinion.card.name} to hand`);
  }
  
  return state;
}

/**
 * Execute an equip weapon battlecry effect
 */
function executeEquipWeaponBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  // Check if a card ID is provided for the weapon
  if (!battlecry.summonCardId) {
    console.error('No weapon card ID provided for equip weapon battlecry');
    return state;
  }
  
  // Find the weapon in the database
  const weaponCard = fullCardDatabase.find(card => card.id === battlecry.summonCardId && card.type === 'weapon');
  
  if (!weaponCard) {
    console.error(`Weapon card with ID ${battlecry.summonCardId} not found`);
    return state;
  }
  
  // If player already has a weapon, destroy it
  if (state.players.player.weapon) {
    console.log(`Destroyed existing weapon: ${state.players.player.weapon.card.name}`);
    // @ts-ignore - Null and undefined are being handled differently by TypeScript
    state.players.player.weapon = undefined;
  }
  
  // Create and equip the new weapon
  const weaponInstance = createCardInstance(weaponCard);
  weaponInstance.currentDurability = weaponCard.durability;
  weaponInstance.isPlayed = true;
  
  state.players.player.weapon = weaponInstance;
  
  console.log(`Battlecry: Equipped ${weaponCard.name}`);
  
  return state;
}

/**
 * Execute a freeze battlecry effect (freezing a character so it can't attack next turn)
 */
function executeFreezeBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  // If no target is needed, return the state unchanged
  if (!battlecry.requiresTarget) {
    return state;
  }
  
  // Process freezing based on target type
  if (targetType === 'hero') {
    // Freeze a hero (Typically only makes sense to freeze the enemy hero)
    if (targetId === 'opponent') {
      // Set isFrozen property to true
      state.players.opponent.isFrozen = true;
      console.log('Battlecry: Froze the enemy hero');
    }
  } else if (targetType === 'minion') {
    // Find target on opponent's battlefield
    let targetInfo = findCardInstance(state.players.opponent.battlefield, targetId!);
    
    if (targetInfo) {
      // Freeze the enemy minion
      state.players.opponent.battlefield[targetInfo.index].isFrozen = true;
      console.log(`Battlecry: Froze enemy ${targetInfo.card.card.name}`);
    } else {
      // Check player's battlefield (for any_minion targets)
      targetInfo = findCardInstance(state.players.player.battlefield, targetId!);
      
      if (targetInfo) {
        // Freeze the friendly minion
        state.players.player.battlefield[targetInfo.index].isFrozen = true;
        console.log(`Battlecry: Froze friendly ${targetInfo.card.card.name}`);
      } else {
        console.error('Target minion not found for freeze battlecry');
      }
    }
  }
  
  return state;
}

/**
 * Execute a mind control battlecry effect (taking control of an enemy minion)
 */
function executeMindControlBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  // If no target is needed, return the state unchanged
  if (!battlecry.requiresTarget) {
    return state;
  }
  
  // Ensure opponent battlefield array exists
  if (!state.players.opponent.battlefield) {
    state.players.opponent.battlefield = [];
    console.log('Created opponent battlefield array for mind control');
    return state;
  }
  
  // Find target on opponent's battlefield
  const targetInfo = findCardInstance(state.players.opponent.battlefield, targetId!);
  
  if (!targetInfo) {
    console.error('Target enemy minion not found for mind control battlecry');
    return state;
  }
  
  const targetMinion = targetInfo.card;
  const targetIndex = targetInfo.index;
  
  // Remove minion from opponent's battlefield
  state.players.opponent.battlefield.splice(targetIndex, 1);
  
  // Ensure player battlefield array exists
  if (!state.players.player.battlefield) {
    state.players.player.battlefield = [];
  }
  
  // Add to player's battlefield
  targetMinion.isSummoningSick = true; // Mind controlled minions can't attack immediately
  state.players.player.battlefield.push(targetMinion);
  
  console.log(`Battlecry: Mind controlled ${targetMinion.card.name}`);
  
  return state;
}

/**
 * Execute a battlecry that summons colossal parts for a colossal minion
 * This is used for minions like Neptulon the Tidehunter that summon additional parts when played
 */
function executeSummonColossalPartsBattlecry(
  state: GameState,
  cardInstanceId: string
): GameState {
  console.log(`Executing colossal parts summoning battlecry for ${cardInstanceId}`);
  
  // Find the card on the battlefield
  const cardInfo = findCardInstance(state.players.player.battlefield, cardInstanceId);
  
  if (!cardInfo) {
    console.error(`Colossal minion with ID ${cardInstanceId} not found on battlefield`);
    return state;
  }
  
  const cardInstance = cardInfo.card;
  
  // Verify the card has the colossal keyword
  if (!getCardKeywords(cardInstance.card).includes('colossal')) {
    console.error(`Card ${cardInstance.card.name} does not have the colossal keyword`);
    return state;
  }
  
  console.log(`Summoning colossal parts for ${cardInstance.card.name}`);
  
  // Use the colossalUtils function to summon the parts
  return summonColossalParts(state, cardInstanceId, 'player');
}

export function isValidBattlecryTarget(
  card: CardData,
  targetId: string,
  targetType: 'minion' | 'hero',
  state: GameState
): boolean {
  // If the card doesn't have a battlecry or doesn't require a target, all targets are invalid
  if (!card.battlecry || !card.battlecry.requiresTarget) {
    return false;
  }
  
  const targetTypeMap: Record<BattlecryTargetType, { validTypes: ('minion' | 'hero')[], validOwners: ('player' | 'opponent')[] }> = {
    'none': { validTypes: [], validOwners: [] },
    'friendly_minion': { validTypes: ['minion'], validOwners: ['player'] },
    'enemy_minion': { validTypes: ['minion'], validOwners: ['opponent'] },
    'any_minion': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'enemy_hero': { validTypes: ['hero'], validOwners: ['opponent'] },
    'friendly_hero': { validTypes: ['hero'], validOwners: ['player'] },
    'any_hero': { validTypes: ['hero'], validOwners: ['player', 'opponent'] },
    'any': { validTypes: ['minion', 'hero'], validOwners: ['player', 'opponent'] },
    'all_minions': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'all_friendly_minions': { validTypes: ['minion'], validOwners: ['player'] },
    'all_enemy_minions': { validTypes: ['minion'], validOwners: ['opponent'] },
    'adjacent_minions': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'damaged_minion': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'undamaged_minion': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'beast': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'dragon': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'mech': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'murloc': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'demon': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'pirate': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'elemental': { validTypes: ['minion'], validOwners: ['player', 'opponent'] },
    'totem': { validTypes: ['minion'], validOwners: ['player', 'opponent'] }
  };
  
  const validationConfig = targetTypeMap[card.battlecry.targetType];
  
  // Check if the target type (minion/hero) is valid
  if (!validationConfig.validTypes.includes(targetType)) {
    return false;
  }
  
  // For hero targets
  if (targetType === 'hero') {
    // Check if targeting the owner is allowed
    if (targetId === 'player' && !validationConfig.validOwners.includes('player')) {
      return false;
    }
    
    // Check if targeting the opponent is allowed
    if (targetId === 'opponent' && !validationConfig.validOwners.includes('opponent')) {
      return false;
    }
    
    return true;
  } 
  
  // For minion targets
  if (targetType === 'minion') {
    // Try to find the minion on player's battlefield
    const playerMinion = findCardInstance(state.players.player.battlefield, targetId);
    
    if (playerMinion && !validationConfig.validOwners.includes('player')) {
      return false;
    }
    
    // Try to find the minion on opponent's battlefield
    const opponentMinion = findCardInstance(state.players.opponent.battlefield, targetId);
    
    if (opponentMinion && !validationConfig.validOwners.includes('opponent')) {
      return false;
    }
    
    // If the minion wasn't found on either battlefield, it's an invalid target
    return (playerMinion !== undefined || opponentMinion !== undefined);
  }
  
  return false;
}