import { v4 as uuidv4 } from 'uuid';
import { 
  BattlecryEffect, 
  CardInstance, 
  GameState,
  BattlecryTargetType,
  CardData,
  SpellEffect,
  CardAnimationType,
  MinionCardData,
  WeaponCardData
} from '../types';
import { debug } from '../config/debugConfig';
import { trackQuestProgress } from './quests/questProgress';
import { MAX_BATTLEFIELD_SIZE } from '../constants/gameConstants';
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
} from './cards/cardUtils';
import { transformMinion, silenceMinion } from './transformUtils';
import { dealDamage } from './effects/damageUtils';
import { destroyCard } from './zoneUtils';
import { healTarget } from './effects/effectUtils';
import { setHeroHealth } from './effects/healthModifierUtils';
import { getCardsFromPool } from '../data/discoverPools';
import { getDiscoveryOptions, createDiscoveryFromSpell } from './discoveryUtils';
import { 
  executeRenoJacksonBattlecry, 
  executeKazakusBattlecry,
  executeSoliaBattlecry,
  executeRazaBattlecry,
  executeKrulBattlecry 
} from './highlanderUtils';
import { summonColossalParts } from './mechanics/colossalUtils';
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
      const minionCard = targetInfo.card.card as MinionCardData;
      damageAmount = minionCard.attack || 1; // Default to 1 if attack is undefined
    }
  }
  
  // Special case for World Ender-like effects (destroy all other minions)
  if (battlecry.targetType === 'all_minions' && damageAmount >= 1000) {
    
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
      }
    }
    
    // If we couldn't find it by targetId, try to find it by name (World Ender)
    if (!sourceMinion) {
      sourceMinion = playerBattlefield.find(
        m => m.card.name === 'World Ender'
      );
      
      if (sourceMinion) {
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
      
    } else {
      debug.error('Could not find source minion for World Ender battlecry');
    }
    
    // Handle discarding the player's hand if specified in the battlecry
    if (battlecry.discardCount !== undefined && battlecry.discardCount === -1) {
      // -1 is a special value that means "discard entire hand"
      state.players.player.hand = [];
    }
    
    return state;
  }
  
  // Process the regular AoE effect for other cards
  if (battlecry.affectsAllEnemies) {
    
    // Apply damage to all enemy minions
    const opponentBattlefield = state.players.opponent.battlefield || [];
    const minionsToRemove: number[] = [];
    
    // First pass: apply damage and track which minions need to be removed
    for (let i = 0; i < opponentBattlefield.length; i++) {
      const minion = opponentBattlefield[i];
      
      // Ensure minion has a currentHealth value
      if (minion.currentHealth === undefined) {
        const minionCard = minion.card as MinionCardData;
        minion.currentHealth = minionCard.health || 1;
      }
      
      // Check for Divine Shield
      if (minion.hasDivineShield) {
        if (state.players.opponent.battlefield) {
          state.players.opponent.battlefield[i].hasDivineShield = false;
        }
      } else {
        // Apply damage - initialize currentHealth if it's not already defined
        if (state.players.opponent.battlefield && state.players.opponent.battlefield[i].currentHealth === undefined) {
          const minionCard = minion.card as MinionCardData;
          state.players.opponent.battlefield[i].currentHealth = minionCard.health || 0;
        }
        
        // Apply damage
        if (state.players.opponent.battlefield) {
          state.players.opponent.battlefield[i].currentHealth! -= damageAmount;
          
          // Check if the minion is destroyed
          if (state.players.opponent.battlefield[i].currentHealth! <= 0) {
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
      state.players.player.hand = [];
    } else if (battlecry.discardCount > 0) {
      // Discard a specific number of cards
      const discardCount = Math.min(battlecry.discardCount, state.players.player.hand.length);
      
      if (discardCount > 0) {
        // Cards are usually discarded at random
        for (let i = 0; i < discardCount; i++) {
          if (state.players.player.hand.length > 0) {
            const randomIndex = Math.floor(Math.random() * state.players.player.hand.length);
            const discardedCard = state.players.player.hand.splice(randomIndex, 1)[0];
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
  let newState = structuredClone(state) as GameState;
  
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
        const opponent = newState.players.opponent;
        const opponentBattlefield = opponent.battlefield || [];
        cardInfo = findCardInstance(opponentBattlefield, cardInstanceId);
        
        if (!cardInfo) {
          const opponentHand = opponent.hand || [];
          cardInfo = findCardInstance(opponentHand, cardInstanceId);
        }
        
        if (!cardInfo) {
          debug.error('Card not found for battlecry execution');
          debug.error(`Looking for card ID: ${cardInstanceId}`);
          debug.error(`Player battlefield cards: ${playerBattlefield.map(c => c.instanceId).join(', ')}`);
          debug.error(`Player hand cards: ${(player.hand || []).map(c => c.instanceId).join(', ')}`);
          debug.error(`Opponent battlefield cards: ${(opponent.battlefield || []).map(c => c.instanceId).join(', ')}`);
          debug.error(`Opponent hand cards: ${(opponent.hand || []).map(c => c.instanceId).join(', ')}`);
          return state;
        }
      }
    }
    
    const cardInstance = cardInfo.card;
    const minionCardData = cardInstance.card as MinionCardData;
    const battlecry = minionCardData.battlecry;
    
    // If the card doesn't have a battlecry, just return the current state
    if (!battlecry || !getCardKeywords(cardInstance.card).includes('battlecry')) {
      return newState;
    }
    
    
    // Check if battlecry has a condition and if it's met
    if (battlecry.condition) {
      // Check minion count condition for cards like Gormok the Impaler
      if (battlecry.condition === "minion_count" && battlecry.conditionValue) {
        // Get the number of friendly minions on the battlefield (excluding the card being played)
        const friendlyMinionCount = playerBattlefield.length - 1; // Subtract 1 to exclude the card being played
        
        // Log the condition check for debugging
        
        // If the condition is not met, don't execute the battlecry
        if (friendlyMinionCount < battlecry.conditionValue) {
          return newState; // Return without executing the battlecry
        }
        
      }
    }
    
    // Check if a target is required but not provided
    if (battlecry.requiresTarget && !targetId) {
      debug.error('Battlecry requires a target but none provided');
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

      case 'summon_random':
        return executeSummonRandomBattlecry(newState, battlecry);

      case 'summon_copy':
        return executeSummonCopyBattlecry(newState, battlecry, cardInstanceId);

      case 'fill_board':
        return executeFillBoardBattlecry(newState, battlecry);

      case 'summon_jade_golem':
        return executeSummonJadeGolemBattlecry(newState);

      case 'summon_random_minions':
        return executeSummonRandomMinionsBattlecry(newState, battlecry);

      case 'summon_copy_from_deck':
        return executeSummonCopyFromDeckBattlecry(newState, battlecry);

      case 'summon_from_spell_cost':
        return executeSummonFromSpellCostBattlecry(newState);

      case 'summon_skeletons_based_on_graveyard':
        return executeSummonSkeletonsBasedOnGraveyardBattlecry(newState, battlecry);
        
      case 'draw':
        return executeDrawBattlecry(newState, battlecry);
        
      case 'draw_both':
      case 'draw_both_players':
        return executeDrawBothBattlecry(newState, battlecry);
        
      case 'discover':
        return executeDiscoverBattlecry(newState, cardInstanceId, battlecry);
        
      case 'aoe_damage':
        return executeAoEDamageBattlecry(newState, battlecry, targetId, targetType);
        
      case 'transform':
        // Check if we have a target ID and a value to use as the cardId to transform into
        if (!targetId || !battlecry.value) {
          debug.error('Transform battlecry requires a target and a card ID to transform into');
          return state;
        }
        return transformMinion(newState, targetId, battlecry.value);
        
      case 'silence':
        // Check if we have a target ID
        if (!targetId) {
          debug.error('Silence battlecry requires a target');
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
        // Execute a destroy minion battlecry (like Void Terror, World Ender)
        return executeDestroyBattlecry(newState, battlecry, targetId);
        
      case 'copy':
        // Execute a copy battlecry (like Faceless Manipulator)
        return executeCopyBattlecry(newState, battlecry, targetId);

      case 'copy_to_hand':
        return executeCopyToHandBattlecry(newState, targetId);

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
        // Execute The Wanderer's battlecry (full heal)
        return executeRenoJacksonBattlecry(newState, 'player');
        
      case 'kazakus_potion':
        // Execute Alchemist's custom potion creation battlecry
        return executeKazakusBattlecry(newState, 'player');
        
      case 'conditional_next_spell_costs_zero':
        // Execute Arcane-Master's battlecry (next spell free)
        return executeSoliaBattlecry(newState, 'player');
        
      case 'conditional_free_hero_power':
        // Execute Bound-Spirit's battlecry (hero power costs 0)
        return executeRazaBattlecry(newState, 'player');
        
      case 'conditional_summon_hand_demons':
        // Execute The Unshackled's battlecry (summon demons from hand)
        return executeKrulBattlecry(newState, 'player');
        
      // Old Gods battlecries (already implemented elsewhere)
      case 'cthun_damage':
      case 'buff_cthun':
      case 'cthun_cultist_damage':
      case 'conditional_self_buff':
      case 'conditional_armor':
      case 'conditional_summon':
      case 'summon_by_condition':
      case 'resurrect_deathrattle':
      case 'yogg_saron':
        // These are handled in oldGodsUtils.ts
        return newState;
        
      case 'heal_hero': {
        const healAmount = battlecry.value || 0;
        if (healAmount > 0) {
          let heroOwner: 'player' | 'opponent' = 'player';
          const onPlayerField = (newState.players.player.battlefield || []).some(c => c.instanceId === cardInstanceId);
          if (!onPlayerField) {
            const onOpponentField = (newState.players.opponent.battlefield || []).some(c => c.instanceId === cardInstanceId);
            if (onOpponentField) {
              heroOwner = 'opponent';
            }
          }
          const hero = newState.players[heroOwner];
          const maxHp = 30;
          hero.heroHealth = Math.min(maxHp, (hero.heroHealth ?? hero.health ?? 0) + healAmount);
        }
        return newState;
      }
        
      case 'summon_parts':
        // Execute a battlecry to summon colossal parts
        // This will handle summoning the right parts for Neptulon and other colossal minions
        return executeSummonColossalPartsBattlecry(newState, cardInstanceId);
        
      case 'buff_tribe':
        // Execute a battlecry to buff all minions of a specific tribe
        // Used by cards like Coldlight Seer (Give your other Murlocs +2 Health)
        return executeBuffTribeBattlecry(newState, cardInstanceId, battlecry);
        
      case 'conditional_grant_keyword':
        return newState;
        
      case 'self_damage': {
        const selfDamage = battlecry.value || 0;
        if (selfDamage > 0) {
          let ownerKey: 'player' | 'opponent' = 'player';
          let idx = newState.players.player.battlefield.findIndex(c => c.instanceId === cardInstanceId);
          if (idx === -1) {
            idx = newState.players.opponent.battlefield.findIndex(c => c.instanceId === cardInstanceId);
            ownerKey = 'opponent';
          }
          if (idx !== -1) {
            const minion = newState.players[ownerKey].battlefield[idx];
            const currentHp = minion.currentHealth ?? (minion.card as any).health ?? 0;
            newState.players[ownerKey].battlefield[idx].currentHealth = currentHp - selfDamage;
            if (currentHp - selfDamage <= 0) {
              newState = destroyCard(newState, cardInstanceId, ownerKey);
            }
          }
        }
        return newState;
      }

      case 'self_damage_buff': {
        const dmg = battlecry.value || 0;
        let sdOwner: 'player' | 'opponent' = 'player';
        let sdIdx = newState.players.player.battlefield.findIndex(c => c.instanceId === cardInstanceId);
        if (sdIdx === -1) {
          sdIdx = newState.players.opponent.battlefield.findIndex(c => c.instanceId === cardInstanceId);
          sdOwner = 'opponent';
        }
        if (sdIdx !== -1) {
          const minion = newState.players[sdOwner].battlefield[sdIdx];
          const currentHp = minion.currentHealth ?? (minion.card as any).health ?? 0;
          if (dmg > 0) {
            minion.currentHealth = currentHp - dmg;
          }
          if ((battlecry as any).buff) {
            (minion.card as any).attack = ((minion.card as any).attack || 0) + ((battlecry as any).buff.attack || 0);
            minion.currentHealth = (minion.currentHealth || 0) + ((battlecry as any).buff.health || 0);
          }
          if ((minion.currentHealth || 0) <= 0) {
            newState = destroyCard(newState, cardInstanceId, sdOwner);
          }
        }
        return newState;
      }
        
      case 'deal_damage':
        return executeDamageBattlecry(newState, battlecry, targetId, targetType);

      case 'damage_aoe':
      case 'damage_all':
        return executeAoEDamageBattlecry(newState, battlecry, targetId, targetType);

      case 'buff_adjacent':
        return executeBuffAdjacentBattlecry(newState, battlecry, cardInstanceId);

      case 'summon_multiple':
        return executeSummonMultipleBattlecry(newState, battlecry);

      case 'buff_hand':
        return executeBuffHandBattlecry(newState, battlecry);

      case 'conditional_damage':
        return executeConditionalDamageBattlecry(newState, battlecry, targetId, targetType);

      case 'add_random_to_hand':
        return executeAddRandomToHandBattlecry(newState, battlecry);

      case 'buff_attack':
        return executeBuffAttackBattlecry(newState, battlecry, targetId);

      case 'recruit':
        return executeRecruitBattlecry(newState, battlecry);

      case 'summon_for_opponent':
        return executeSummonForOpponentBattlecry(newState, battlecry);

      case 'swap_stats':
        return executeSwapStatsBattlecry(newState, targetId);

      case 'give_mana':
        return executeGiveManaBattlecry(newState, battlecry);

      case 'heal_aoe':
        return executeHealAoeBattlecry(newState, battlecry);

      case 'buff_temp':
        return executeBuffTempBattlecry(newState, battlecry, targetId);

      case 'gain_temporary_mana':
        return executeGainTemporaryManaBattlecry(newState, battlecry);

      case 'buff_weapon':
        return executeBuffWeaponBattlecry(newState, battlecry);

      case 'reduce_next_spell_cost':
        return executeReduceNextSpellCostBattlecry(newState, battlecry);

      case 'add_card':
        return executeAddToHandBattlecry(newState, battlecry);

      case 'conditional_discover':
        return executeConditionalDiscoverBattlecry(newState, cardInstanceId, battlecry);

      case 'conditional_buff':
        return executeConditionalBuffBattlecry(newState, battlecry, cardInstanceId, targetId);

      case 'conditional_buff_and_taunt':
        return executeConditionalBuffAndTauntBattlecry(newState, battlecry, cardInstanceId, targetId);

      case 'give_divine_shield':
        return executeGiveDivineShieldBattlecry(newState, targetId);

      case 'grant_deathrattle':
        return executeGrantDeathrattleBattlecry(newState, battlecry, targetId);

      case 'mind_control_temporary':
        return executeMindControlTemporaryBattlecry(newState, targetId);

      case 'copy_from_opponent':
        return executeCopyFromOpponentBattlecry(newState, battlecry);

      case 'adapt':
        return executeAdaptBattlecry(newState, cardInstanceId);

      case 'summon_until_full':
        return executeSummonUntilFullBattlecry(newState, battlecry);

      case 'transform_friendly':
        return executeTransformFriendlyBattlecry(newState, battlecry, targetId);

      case 'trigger_deathrattle':
        return executeTriggerDeathrattleBattlecry(newState, targetId);

      case 'buff_and_damage':
        return executeBuffAndDamageBattlecry(newState, battlecry, cardInstanceId, targetId);

      case 'buff_and_taunt':
        return executeBuffAndTauntBattlecry(newState, battlecry, targetId || cardInstanceId);

      case 'buff_aoe':
        return executeBuffAoeBattlecry(newState, battlecry, cardInstanceId);

      case 'buff_beasts_in_hand':
        return executeBuffBeastsInHandBattlecry(newState, battlecry);

      case 'buff_by_hand_size':
        return executeBuffByHandSizeBattlecry(newState, battlecry, cardInstanceId);

      case 'buff_health_by_hand_size':
        return executeBuffHealthByHandSizeBattlecry(newState, cardInstanceId);

      case 'buff_per_card_in_hand':
        return executeBuffPerCardInHandBattlecry(newState, battlecry, cardInstanceId);

      case 'buff_per_dead_friendly_minion':
        return executeBuffPerDeadFriendlyMinionBattlecry(newState, battlecry, cardInstanceId);

      case 'buff_hero':
        return executeBuffHeroBattlecry(newState, battlecry);

      case 'brawl':
        return executeBrawlBattlecry(newState);

      case 'cast_opponent_spell':
        return newState;

      case 'choose_keywords':
        return executeChooseKeywordsBattlecry(newState, cardInstanceId);

      case 'weapon_attack_buff':
        return executeWeaponAttackBuffBattlecry(newState, battlecry);

      case 'weapon_durability_damage':
        return executeWeaponDurabilityDamageBattlecry(newState, battlecry, targetId, targetType);

      case 'steal_from_deck':
        return executeStealFromDeckBattlecry(newState, battlecry);

      case 'swap_hands':
        return executeSwapHandsBattlecry(newState);

      case 'adapt_murlocs':
        return executeAdaptMurlocsBattlecry(newState);

      case 'zephrys_wish':
        return executeDiscoverBattlecry(newState, cardInstanceId, battlecry);

      case 'summon_horseman':
        return executeSummonHorsemanBattlecry(newState, battlecry);

      case 'summon_random_legendary':
        return executeSummonRandomLegendaryBattlecry(newState);

      case 'summon_splitting':
        return executeSummonSplittingBattlecry(newState, battlecry);

      case 'summon_if_other_died':
        return executeSummonIfOtherDiedBattlecry(newState, battlecry);

      case 'summon_and_draw':
        return executeSummonAndDrawBattlecry(newState, battlecry);

      case 'summon_copy_from_hand':
        return executeSummonCopyFromHandBattlecry(newState);

      case 'summon_from_both_hands':
        return executeSummonFromBothHandsBattlecry(newState);

      case 'summon_from_opponent_hand':
        return executeSummonFromOpponentHandBattlecry(newState);

      case 'summon_deathrattle_minions_that_died':
        return executeSummonDeathrattleMinionsThatDiedBattlecry(newState);

      case 'summon_all_totems':
        return executeSummonAllTotemsBattlecry(newState);

      case 'summon_defender':
        return executeSummonDefenderBattlecry(newState, battlecry);

      default:
        debug.error('Unknown battlecry type: ' + battlecry.type);
        return newState;
    }
  } catch (error) {
    debug.error('Error executing battlecry:', error);
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
      
      // Game over check handled by dealDamage function
    } else {
      // Damage player hero (self-damage effects) using dealDamage utility
      state = dealDamage(state, 'player', 'hero', damage);
      
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
      const targetMinionCard = targetMinion.card as MinionCardData;
      
      // Ensure minion has a currentHealth value
      if (targetMinion.currentHealth === undefined) {
        targetMinion.currentHealth = targetMinionCard.health || 1;
      }
      
      // Check for Divine Shield
      if (targetMinion.hasDivineShield) {
        state.players.opponent.battlefield[targetIndex].hasDivineShield = false;
      } else {
        // Apply damage
        if (state.players.opponent.battlefield[targetIndex].currentHealth !== undefined) {
          state.players.opponent.battlefield[targetIndex].currentHealth -= damage;
          
          // Check if the minion is destroyed
          if (state.players.opponent.battlefield[targetIndex].currentHealth <= 0) {
            state.players.opponent.battlefield.splice(targetIndex, 1);
          }
        }
      }
    } else {
      // Check on player's battlefield (for self-targeting battlecries)
      const playerBattlefield = state.players.player.battlefield || [];
      targetInfo = findCardInstance(playerBattlefield, targetId!);
      
      if (!targetInfo) {
        debug.error('Target minion not found for battlecry');
        return state;
      }
      
      const targetMinion = targetInfo.card;
      const targetIndex = targetInfo.index;
      const targetMinionCard = targetMinion.card as MinionCardData;
      
      // Ensure minion has a currentHealth value
      if (targetMinion.currentHealth === undefined) {
        targetMinion.currentHealth = targetMinionCard.health || 1;
      }
      
      // Check for Divine Shield
      if (targetMinion.hasDivineShield) {
        state.players.player.battlefield[targetIndex].hasDivineShield = false;
      } else {
        // Apply damage
        if (state.players.player.battlefield[targetIndex].currentHealth !== undefined) {
          state.players.player.battlefield[targetIndex].currentHealth -= damage;
          
          // Check if the minion is destroyed
          if (state.players.player.battlefield[targetIndex].currentHealth <= 0) {
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
    } else {
      // Heal player hero using healTarget function
      state = healTarget(state, 'player', 'hero', healAmount);
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
    } else {
      // Check on player's battlefield
      const playerBattlefield = state.players.player.battlefield || [];
      targetInfo = findCardInstance(playerBattlefield, targetId!);
      
      if (!targetInfo) {
        debug.error('Target minion not found for heal battlecry');
        return state;
      }
      
      const targetMinion = targetInfo.card;
      
      // Use healTarget utility function
      state = healTarget(state, 'player', targetId!, healAmount);
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
      debug.error('Target minion not found for buff battlecry');
      return state;
    }
    
    const targetMinion = targetInfo.card;
    const targetIndex = targetInfo.index;
    const targetMinionCard = targetMinion.card as MinionCardData;
    
    // Ensure minion has a currentHealth value
    if (targetMinion.currentHealth === undefined) {
      targetMinion.currentHealth = targetMinionCard.health || 1;
    }
    
    // Apply buff to attack and health
    const newAttack = (targetMinionCard.attack || 0) + attackBuff;
    const currentHealth = targetMinion.currentHealth || 1;
    const maxHealth = targetMinionCard.health || 1;
    const newMaxHealth = maxHealth + healthBuff;
    const newCurrentHealth = currentHealth + healthBuff;
    
    // Ensure player battlefield exists
    if (!state.players.player.battlefield) {
      state.players.player.battlefield = [];
      debug.error('Player battlefield was undefined during buff battlecry');
      return state;
    }
    
    // Update the card's stats
    state.players.player.battlefield[targetIndex].card = {
      ...targetMinion.card,
      attack: newAttack,
      health: newMaxHealth
    } as MinionCardData;
    
    // Update current health
    state.players.player.battlefield[targetIndex].currentHealth = newCurrentHealth;
    
  } else if (battlecry.targetType === 'enemy_minion') {
    // Try to find on opponent's battlefield (for debuffs or enemy buffs)
    const opponentBattlefield = state.players.opponent.battlefield || [];
    const targetInfo = findCardInstance(opponentBattlefield, targetId!);
    
    if (!targetInfo) {
      debug.error('Target enemy minion not found for buff battlecry');
      return state;
    }
    
    const targetMinion = targetInfo.card;
    const targetIndex = targetInfo.index;
    const targetMinionCard = targetMinion.card as MinionCardData;
    
    // Ensure minion has a currentHealth value
    if (targetMinion.currentHealth === undefined) {
      targetMinion.currentHealth = targetMinionCard.health || 1;
    }
    
    // Apply buff to attack and health
    const newAttack = (targetMinionCard.attack || 0) + attackBuff;
    const currentHealth = targetMinion.currentHealth || 1;
    const maxHealth = targetMinionCard.health || 1;
    const newMaxHealth = maxHealth + healthBuff;
    const newCurrentHealth = currentHealth + healthBuff;
    
    // Ensure opponent battlefield exists
    if (!state.players.opponent.battlefield) {
      state.players.opponent.battlefield = [];
      debug.error('Opponent battlefield was undefined during buff battlecry');
      return state;
    }
    
    // Update the card's stats
    state.players.opponent.battlefield[targetIndex].card = {
      ...targetMinion.card,
      attack: newAttack,
      health: newMaxHealth
    } as MinionCardData;
    
    // Update current health
    state.players.opponent.battlefield[targetIndex].currentHealth = newCurrentHealth;
    
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
  const newState = structuredClone(state) as GameState;
  
  try {
    // Get the source card (the one with the buff tribe battlecry)
    const cardInfo = findCardInstance(newState.players.player.battlefield || [], cardInstanceId);
    if (!cardInfo) {
      debug.error('Card not found for buff tribe battlecry', cardInstanceId);
      return state;
    }
    
    const sourceCard = cardInfo.card;
    const tribeName = battlecry.tribe || '';
    
    if (!tribeName) {
      debug.error('No tribe specified for buff tribe battlecry');
      return state;
    }
    
    
    // Get buff values from the battlecry
    const attackBuff = battlecry.buffs?.attack || 0;
    const healthBuff = battlecry.buffs?.health || 0;
    
    // Only proceed if at least one stat is being buffed
    if (attackBuff === 0 && healthBuff === 0) {
      debug.error('No buff values provided for buff tribe battlecry');
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
          const minionCard = minion.card as MinionCardData;
          const currentAttack = minionCard.attack || 0;
          const currentHealth = minionCard.health || 0;
          const currentHealthValue = minion.currentHealth || currentHealth;
          
          // Update the stats
          newState.players.player.battlefield[index].card = {
            ...minion.card,
            attack: currentAttack + attackBuff,
            health: currentHealth + healthBuff
          } as MinionCardData;
          
          // Update current health
          newState.players.player.battlefield[index].currentHealth = currentHealthValue + healthBuff;
          
          buffedCount++;
        }
      });
    }
    
    
    // Trigger animation
    const addAnimation = useAnimationStore.getState().addAnimation;
    addAnimation({
      id: `buff-tribe-${tribeName}-${Date.now()}`,
      type: 'buff',
      sourceId: sourceCard.card.id as number,
      position: { x: 400, y: 300 },
      duration: 800
    } as any);
    
    return newState;
  } catch (error) {
    debug.error('Error executing buff tribe battlecry:', error);
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
  // Check board limit before summoning
  if (state.players.player.battlefield.length >= MAX_BATTLEFIELD_SIZE) {
    return state;
  }
  
  // Check if a card ID is provided for summoning
  if (!battlecry.summonCardId) {
    debug.error('No card ID provided for summon battlecry');
    return state;
  }
  
  // Find the card data in the database (both regular and token cards)
  const cardToSummon = allCards.find(card => card.id === battlecry.summonCardId);
  
  if (!cardToSummon) {
    debug.error(`Card with ID ${battlecry.summonCardId} not found for summoning`);
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
  
  // Track quest progress for summoned minion
  trackQuestProgress('player', 'summon_minion', summonedCard.card);
  
  return state;
}

const MAX_BOARD_SIZE = 5;

function executeSummonRandomBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const count = (battlecry as any).value || (battlecry as any).count || 1;
  const pool = (battlecry as any).pool as (number | string)[] | undefined;
  const manaCostFilter = (battlecry as any).manaCost as number | undefined;
  const raceFilter = (battlecry as any).race as string | undefined;

  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  const availableSlots = MAX_BOARD_SIZE - state.players.player.battlefield.length;
  if (availableSlots <= 0) return state;
  const actualCount = Math.min(count, availableSlots);

  let candidates: CardData[];
  if (pool && pool.length > 0) {
    candidates = allCards.filter(c => pool.includes(c.id));
  } else {
    candidates = allCards.filter(c => c.type === 'minion');
    if (manaCostFilter !== undefined) {
      candidates = candidates.filter(c => c.manaCost === manaCostFilter);
    }
    if (raceFilter) {
      candidates = candidates.filter(c => (c as any).race === raceFilter);
    }
  }

  if (candidates.length === 0) return state;

  for (let i = 0; i < actualCount; i++) {
    if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    const instance = createCardInstance(selected);
    instance.isPlayed = true;
    state.players.player.battlefield.push(instance);
  }
  return state;
}

function executeSummonCopyBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  cardInstanceId: string
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  const availableSlots = MAX_BOARD_SIZE - state.players.player.battlefield.length;
  if (availableSlots <= 0) return state;

  const condition = (battlecry as any).condition as string | undefined;
  if (condition) {
    const bf = state.players.player.battlefield;
    if (condition === 'has_taunt' && !bf.some(m => getCardKeywords(m.card).includes('taunt'))) return state;
    if (condition === 'has_divine_shield' && !bf.some(m => m.hasDivineShield || getCardKeywords(m.card).includes('divine_shield'))) return state;
    if (condition === 'holding_dragon' && !(state.players.player.hand || []).some(c => isCardOfTribe(c.card, 'dragon'))) return state;
  }

  const sourceCard = state.players.player.battlefield.find(m => m.instanceId === cardInstanceId);
  if (!sourceCard) return state;

  const count = Math.min((battlecry as any).count || 1, availableSlots);
  for (let i = 0; i < count; i++) {
    if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;
    const cardData = allCards.find(c => c.id === sourceCard.card.id);
    if (cardData) {
      const copy = createCardInstance(cardData);
      copy.isPlayed = true;
      state.players.player.battlefield.push(copy);
    }
  }
  return state;
}

function executeFillBoardBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  const availableSlots = MAX_BOARD_SIZE - state.players.player.battlefield.length;
  if (availableSlots <= 0) return state;

  const summonCardId = (battlecry as any).summonCardId as number | undefined;
  const summonName = (battlecry as any).summonName as string | undefined;
  const summonAttack = (battlecry as any).summonAttack as number | undefined;
  const summonHealth = (battlecry as any).summonHealth as number | undefined;

  for (let i = 0; i < availableSlots; i++) {
    if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;

    if (summonCardId) {
      const cardData = allCards.find(c => c.id === summonCardId);
      if (cardData) {
        const instance = createCardInstance(cardData);
        instance.isPlayed = true;
        if (summonAttack !== undefined) (instance.card as any).attack = summonAttack;
        if (summonHealth !== undefined) {
          (instance.card as any).health = summonHealth;
          instance.currentHealth = summonHealth;
        }
        state.players.player.battlefield.push(instance);
      }
    } else {
      const tokenCard: CardData = {
        id: 99990 + i,
        name: summonName || 'Whelp',
        description: 'Summoned token',
        manaCost: 1,
        type: 'minion',
        rarity: 'token' as any,
        heroClass: 'neutral',
        attack: summonAttack !== undefined ? summonAttack : 1,
        health: summonHealth !== undefined ? summonHealth : 1,
        keywords: []
      } as any;
      const instance = createCardInstance(tokenCard);
      instance.isPlayed = true;
      state.players.player.battlefield.push(instance);
    }
  }
  return state;
}

function executeSummonJadeGolemBattlecry(
  state: GameState
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const player = state.players.player as any;
  const currentCounter = player.jadeGolemCounter || 0;
  player.jadeGolemCounter = currentCounter + 1;
  const golemSize = Math.min(currentCounter + 1, 30);

  const jadeGolemCard: CardData = {
    id: 85100 + golemSize,
    name: 'Jade Golem',
    description: `A ${golemSize}/${golemSize} Jade Golem.`,
    manaCost: Math.min(golemSize, 10),
    type: 'minion',
    rarity: 'token' as any,
    heroClass: 'neutral',
    attack: golemSize,
    health: golemSize,
    keywords: []
  } as any;

  const instance = createCardInstance(jadeGolemCard);
  instance.isPlayed = true;
  state.players.player.battlefield.push(instance);
  return state;
}

function executeSummonRandomMinionsBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const count = (battlecry as any).value || (battlecry as any).count || 1;
  const manaCostFilter = (battlecry as any).manaCost as number | undefined;
  const minManaCost = (battlecry as any).minManaCost as number | undefined;
  const maxManaCost = (battlecry as any).maxManaCost as number | undefined;
  const raceFilter = (battlecry as any).race as string | undefined;
  const rarityFilter = (battlecry as any).rarity as string | undefined;

  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  const availableSlots = MAX_BOARD_SIZE - state.players.player.battlefield.length;
  if (availableSlots <= 0) return state;
  const actualCount = Math.min(count, availableSlots);

  let candidates = allCards.filter(c => c.type === 'minion');
  if (manaCostFilter !== undefined) candidates = candidates.filter(c => c.manaCost === manaCostFilter);
  if (minManaCost !== undefined) candidates = candidates.filter(c => (c.manaCost ?? 0) >= minManaCost);
  if (maxManaCost !== undefined) candidates = candidates.filter(c => (c.manaCost ?? 0) <= maxManaCost);
  if (raceFilter) candidates = candidates.filter(c => (c as any).race === raceFilter);
  if (rarityFilter) candidates = candidates.filter(c => c.rarity === rarityFilter);

  if (candidates.length === 0) return state;

  const usedIndices = new Set<number>();
  for (let i = 0; i < actualCount; i++) {
    if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;
    let available = candidates.filter((_, idx) => !usedIndices.has(idx));
    if (available.length === 0) {
      available = candidates;
      usedIndices.clear();
    }
    const randomIdx = Math.floor(Math.random() * available.length);
    const selected = available[randomIdx];
    const originalIdx = candidates.indexOf(selected);
    usedIndices.add(originalIdx);
    const instance = createCardInstance(selected);
    instance.isPlayed = true;
    state.players.player.battlefield.push(instance);
  }
  return state;
}

function executeSummonCopyFromDeckBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  const availableSlots = MAX_BOARD_SIZE - state.players.player.battlefield.length;
  if (availableSlots <= 0) return state;

  const count = (battlecry as any).value || (battlecry as any).count || 1;
  const statOverride = (battlecry as any).statOverride as boolean | undefined;
  const overrideAttack = (battlecry as any).attack as number | undefined;
  const overrideHealth = (battlecry as any).health as number | undefined;

  const deck = (state.players.player.deck || []) as any[];
  const minionsInDeck = deck.filter(
    c => (c.card ? c.card.type : c.type) === 'minion'
  );
  if (minionsInDeck.length === 0) return state;

  const actualCount = Math.min(count, availableSlots, minionsInDeck.length);
  const shuffled = [...minionsInDeck].sort(() => Math.random() - 0.5);

  for (let i = 0; i < actualCount; i++) {
    if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;
    const deckMinion = shuffled[i];
    const minionId = deckMinion.card ? deckMinion.card.id : deckMinion.id;
    let cardData = allCards.find(c => c.id === minionId);
    
    if (cardData) {
      const instance = createCardInstance(cardData);
      instance.isPlayed = true;
      if (statOverride) {
        (instance.card as any).attack = overrideAttack !== undefined ? overrideAttack : 1;
        const hp = overrideHealth !== undefined ? overrideHealth : 1;
        (instance.card as any).health = hp;
        instance.currentHealth = hp;
      }
      state.players.player.battlefield.push(instance);
    } else if (deckMinion.card) {
      // Fallback: create CardInstance directly from deck card's data when allCards lookup fails
      const instance = createCardInstance(deckMinion.card);
      instance.isPlayed = true;
      if (statOverride) {
        (instance.card as any).attack = overrideAttack !== undefined ? overrideAttack : 1;
        const hp = overrideHealth !== undefined ? overrideHealth : 1;
        (instance.card as any).health = hp;
        instance.currentHealth = hp;
      }
      state.players.player.battlefield.push(instance);
    }
  }
  return state;
}

function executeSummonFromSpellCostBattlecry(
  state: GameState
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const spellDeck = (state.players.player.deck || []) as any[];
  const spellsInDeck = spellDeck.filter(
    c => (c.card ? c.card.type : c.type) === 'spell'
  );
  if (spellsInDeck.length === 0) return state;

  const randomIdx = Math.floor(Math.random() * spellsInDeck.length);
  const revealedSpell = spellsInDeck[randomIdx];
  const spellCost = revealedSpell.card ? revealedSpell.card.manaCost : revealedSpell.manaCost;

  const spellId = revealedSpell.instanceId || revealedSpell.id;
  const deckIdx = spellDeck.findIndex(
    (c: any) => (c.instanceId || c.id) === spellId
  );
  if (deckIdx !== -1) {
    (state.players.player.deck as any[]).splice(deckIdx, 1);
    if (!state.players.player.graveyard) state.players.player.graveyard = [] as any;
    (state.players.player.graveyard as any[]).push(revealedSpell);
  }

  const minionsWithCost = allCards.filter(
    c => c.type === 'minion' && c.manaCost === spellCost
  );
  if (minionsWithCost.length === 0) return state;

  const selected = minionsWithCost[Math.floor(Math.random() * minionsWithCost.length)];
  const instance = createCardInstance(selected);
  instance.isPlayed = true;
  state.players.player.battlefield.push(instance);
  return state;
}

function executeSummonSkeletonsBasedOnGraveyardBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  const availableSlots = MAX_BOARD_SIZE - state.players.player.battlefield.length;
  if (availableSlots <= 0) return state;

  const graveyard = (state.players.player.graveyard || []) as any[];
  const graveyardMinionCount = graveyard.filter(c => (c.card ? c.card.type : c.type) === 'minion').length;
  if (graveyardMinionCount === 0) return state;

  const maxSkeletons = (battlecry as any).value || 3;
  const skeletonsToSummon = Math.min(graveyardMinionCount, maxSkeletons, availableSlots);

  const skeletonCardId = (battlecry as any).summonCardId || 4900;
  const skeletonData = allCards.find(c => c.id === skeletonCardId);

  for (let i = 0; i < skeletonsToSummon; i++) {
    if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;
    if (skeletonData) {
      const instance = createCardInstance(skeletonData);
      instance.isPlayed = true;
      state.players.player.battlefield.push(instance);
    } else {
      const tokenCard: CardData = {
        id: 4900,
        name: 'Skeleton',
        description: 'Summoned skeleton',
        manaCost: 1,
        type: 'minion',
        rarity: 'token' as any,
        heroClass: 'neutral',
        attack: 1,
        health: 1,
        keywords: []
      } as any;
      const instance = createCardInstance(tokenCard);
      instance.isPlayed = true;
      state.players.player.battlefield.push(instance);
    }
  }
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
      }
    } else {
    }
    
    return state;
  }
  
  
  // If filtering by card type, create a filtered deck copy
  let eligibleCards = [...state.players.player.deck];
  
  if (cardType) {
    
    // Debug all cards in the deck BEFORE filtering
    state.players.player.deck.forEach(card => {
      // Using our new utility function to get tribe/race consistently
      const tribe = getCardTribe(card);
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
    });
    
    
    // If no cards found, try fallback to allCards to ensure at least some cards are available
    if (eligibleCards.length === 0) {
      
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
        
        // For Murlocs specifically
        if (cardType === 'murloc') {
          const murlocCards = allCards.filter((card: CardData) => isMurlocCard(card));
          eligibleCards = murlocCards.slice(0, cardsToDraw);
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
    
    // Remove from the actual deck if it exists there
    const indexInDeck = state.players.player.deck.findIndex(
      card => card.id === drawnCard.id
    );
    
    if (indexInDeck !== -1) {
      // Card exists in deck, remove it
      state.players.player.deck.splice(indexInDeck, 1);
    } else {
      // Card doesn't exist in deck, but we'll still add it to hand
      // This is a special case for when we had to use the fallback
    }
    
    // Create a card instance and add it to the hand
    const cardInstance = createCardInstance(drawnCard);
    
    // Add the card instance to hand (not just the card data)
    state.players.player.hand.push(cardInstance);
    
    drawnCount++;
  }
  
  // Log if we couldn't draw enough cards
  if (drawnCount < cardsToDraw) {
  } else {
  }
  
  if (typeof window !== 'undefined' && drawnCount > 0) {
    setTimeout(() => {
      const animationStore = useAnimationStore.getState();
      
      animationStore.addAnimation({
        id: `draw_cards_player_${Date.now()}`,
        type: 'card_draw_notification',
        startTime: Date.now(),
        value: drawnCount,
        playerId: 'player',
        cardName: cardType ? `${cardType} card${drawnCount > 1 ? 's' : ''}` : undefined,
        duration: 2500
      } as any);

      if (cardType === 'murloc' || cardType === 'beast') {
        const src = cardType === 'murloc' ? '/sounds/tribes/murloc_summon.mp3' : '/sounds/tribes/beast_summon.mp3';
        try {
          const a = document.querySelector<HTMLAudioElement>(`audio[data-pool="${src}"]`) || (() => {
            const el = new Audio(src);
            el.setAttribute('data-pool', src);
            el.preload = 'auto';
            return el;
          })();
          a.volume = 0.7;
          a.currentTime = 0;
          a.play().catch(() => {});
        } catch { /* no audio */ }
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
  
  
  // Draw cards for player
  for (let i = 0; i < cardsToDraw; i++) {
    if (state.players.player.deck.length > 0) {
      const drawnCard = state.players.player.deck.shift()!;
      // Create a card instance and add it to the hand
      const cardInstance = createCardInstance(drawnCard);
      state.players.player.hand.push(cardInstance);
      playerDrawnCount++;
    } else {
      // Apply fatigue damage here if needed when deck is empty
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
      opponentDrawnCount++;
    } else {
      // Apply fatigue damage here if needed
    }
  }
  
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const animationStore = useAnimationStore.getState();
      
      if (playerDrawnCount > 0) {
        animationStore.addAnimation({
          id: `draw_cards_player_${Date.now()}`,
          type: 'card_draw_notification',
          startTime: Date.now(),
          value: playerDrawnCount,
          playerId: 'player',
          duration: 2500
        } as any);
      }
      
      if (opponentDrawnCount > 0) {
        animationStore.addAnimation({
          id: `draw_cards_opponent_${Date.now()}`,
          type: 'card_draw_notification',
          startTime: Date.now(),
          value: opponentDrawnCount,
          playerId: 'opponent',
          duration: 2500
        } as any);
      }
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
  
  try {
    // Get cards from the discovery pool
    let discoveryCards: CardData[] = [];
    
    if (battlecry.discoveryPoolId) {
      // Get cards from a predefined pool like 'beast', 'dragon', etc.
      discoveryCards = getCardsFromPool(battlecry.discoveryPoolId);
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
    }
    
    // If we couldn't get any cards, return the state unchanged
    if (discoveryCards.length === 0) {
      debug.error('No cards available for discovery');
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
      
      // Choose a card with higher value/cost for the AI (simple heuristic)
      let bestCardIndex = 0;
      let bestCardValue = -1;
      
      discoveryState.options.forEach((card, index) => {
        // Simple AI heuristic: prefer higher mana cost cards as a starting point
        let cardValue = (card.manaCost ?? 0) * 2;
        
        // Add value for keywords that are generally powerful
        if (getCardKeywords(card).includes('taunt')) cardValue += 2;
        if (getCardKeywords(card).includes('divine_shield')) cardValue += 3;
        if (getCardKeywords(card).includes('rush') || getCardKeywords(card).includes('charge')) cardValue += 4;
        if (getCardKeywords(card).includes('poisonous')) cardValue += 3;
        if (getCardKeywords(card).includes('windfury')) cardValue += 2;
        if (getCardKeywords(card).includes('lifesteal')) cardValue += 3;
        
        // Add value for high attack or health (only for minions)
        if (card.type === 'minion') {
          const minionCard = card as MinionCardData;
          if (minionCard.attack && minionCard.attack > 4) cardValue += minionCard.attack; 
          if (minionCard.health && minionCard.health > 4) cardValue += minionCard.health;
        }
        
        if (cardValue > bestCardValue) {
          bestCardValue = cardValue;
          bestCardIndex = index;
        }
      });
      
      const selectedCard = discoveryState.options[bestCardIndex];
      
      
      // Add the selected card directly to the opponent's hand as CardInstance
      const cardInstance = createCardInstance(selectedCard);
      state.players.opponent.hand.push(cardInstance);
      
      // Return the state without setting up the discovery UI since the AI handled it
      return state;
    }
    
    // For the player's turn, update the game state with the discovery UI
    return {
      ...state,
      discovery: discoveryState
    };
  } catch (error) {
    debug.error('Error executing discover battlecry:', error);
    return state;
  }
}

/**
 * Check if a card requires a battlecry target
 */
export function requiresBattlecryTarget(card: CardData): boolean {
  if (card.type !== 'minion') return false;
  const minionCard = card as MinionCardData;
  return (
    getCardKeywords(card).includes('battlecry') &&
    minionCard.battlecry !== undefined &&
    minionCard.battlecry.requiresTarget === true
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
    debug.error('Set health battlecry requires a hero target');
    return state;
  }
  
  // Set health based on target (keep both fields in sync)
  if (targetId === 'opponent') {
    state.players.opponent.health = healthValue;
    state.players.opponent.heroHealth = healthValue;
  } else {
    state.players.player.health = healthValue;
    state.players.player.heroHealth = healthValue;
  }
  
  return state;
}

/**
 * Execute a cast all spells battlecry effect (like Zul'jin)
 */
function executeCastAllSpellsBattlecry(state: GameState): GameState {
  
  // In a real game, we'd track all spells played and replay them with random targets
  // For this implementation, we'll just log the effect
  
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
      debug.error('Target enemy minion not found for debuff battlecry');
      return state;
    }
    
    const targetMinion = targetInfo.card;
    const targetIndex = targetInfo.index;
    const targetMinionCard = targetMinion.card as MinionCardData;
    
    // Ensure card attack value is defined
    if (targetMinionCard.attack === undefined) {
      targetMinionCard.attack = 0;
    }
    
    // Handle the Aldor Peacekeeper special case (set attack to 1)
    let newAttack = targetMinionCard.attack || 0;
    if (attackDebuff === -1000) { // Special value we defined for "set to 1"
      newAttack = 1;
    } else {
      // Apply regular debuff, but don't go below 0
      newAttack = Math.max(0, (targetMinionCard.attack || 0) + attackDebuff);
    }
    
    // Update the card's attack
    state.players.opponent.battlefield[targetIndex].card = {
      ...targetMinion.card,
      attack: newAttack
    } as MinionCardData;
    
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
    const cardToAdd = allCards.find(card => card.id === cardId);
    
    if (!cardToAdd) {
      debug.error(`Card with ID ${cardId} not found for add to hand battlecry`);
      return state;
    }
    
    // Add the specific card to hand
    for (let i = 0; i < numCards; i++) {
      if (state.players.player.hand.length >= 7) {
        break;
      }
      
      // Create a card instance and add it to the hand
      const cardInstance = createCardInstance(cardToAdd);
      state.players.player.hand.push(cardInstance);
    }
  } else {
    // Add random cards (like a discovery/random generation effect)
    // For now, just adding random cards from the database as a placeholder
    for (let i = 0; i < numCards; i++) {
      if (state.players.player.hand.length >= 7) {
        break;
      }
      
      // Generate a random card as a placeholder
      // In a real implementation, this would follow specific rules based on the card's effect
      const randomIndex = Math.floor(Math.random() * allCards.length);
      const randomCard = allCards[randomIndex];
      
      // Create a card instance and add it to the hand
      const cardInstance = createCardInstance(randomCard);
      state.players.player.hand.push(cardInstance);
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
      // Clear all minions from both sides of the battlefield (like World Ender)
      state.players.player.battlefield = [];
      state.players.opponent.battlefield = [];
    } else if (battlecry.targetType === 'all_enemy_minions') {
      // Clear enemy minions
      state.players.opponent.battlefield = [];
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
        const minionCard = targetMinion.card as MinionCardData;
        const targetRace = (minionCard.race || '').toLowerCase();
        if (targetRace !== battlecry.targetType) {
          return state;
        }
      }
      
      // Remove the minion
      const removed = state.players.opponent.battlefield.splice(targetIndex, 1);
      if (removed.length > 0) {
        if (!state.players.opponent.graveyard) state.players.opponent.graveyard = [] as any;
        (state.players.opponent.graveyard as any[]).push(removed[0]);
      }
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
          const minionCard = targetMinion.card as MinionCardData;
          const targetRace = (minionCard.race || '').toLowerCase();
          if (targetRace !== battlecry.targetType) {
            return state;
          }
        }
        
        // Remove the minion
        const removedPlayer = state.players.player.battlefield.splice(targetIndex, 1);
        if (removedPlayer.length > 0) {
          if (!state.players.player.graveyard) state.players.player.graveyard = [] as any;
          (state.players.player.graveyard as any[]).push(removedPlayer[0]);
        }
      } else {
        debug.error('Target minion not found for destroy battlecry');
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
  if (state.players.player.battlefield.length >= MAX_BATTLEFIELD_SIZE) {
    return state;
  }

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
      debug.error('Target minion not found for copy battlecry');
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
      debug.error('Target minion not found for return to hand battlecry');
      return state;
    }
    
    const targetMinion = targetInfo.card;
    const targetIndex = targetInfo.index;
    
    // Check if hand is full (max 9 cards)
    if (state.players.player.hand.length >= 7) {
      state.players.player.battlefield.splice(targetIndex, 1);
      return state;
    }
    
    // Create a new card instance and add it to the hand
    const cardInstance = createCardInstance(targetMinion.card);
    state.players.player.hand.push(cardInstance);
    
    // Remove from battlefield
    state.players.player.battlefield.splice(targetIndex, 1);
    
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
    debug.error('No weapon card ID provided for equip weapon battlecry');
    return state;
  }
  
  // Find the weapon in the database
  const weaponCard = allCards.find(card => card.id === battlecry.summonCardId && card.type === 'weapon');
  
  if (!weaponCard) {
    debug.error(`Weapon card with ID ${battlecry.summonCardId} not found`);
    return state;
  }
  
  // If player already has a weapon, destroy it
  if (state.players.player.weapon) {
    // @ts-ignore - Null and undefined are being handled differently by TypeScript
    state.players.player.weapon = undefined;
  }
  
  // Create and equip the new weapon
  const weaponCardData = weaponCard as WeaponCardData;
  state.players.player.weapon = {
    instanceId: uuidv4(),
    card: weaponCardData,
    currentHealth: weaponCardData.durability || 1,
    canAttack: true,
    isPlayed: true,
    isSummoningSick: false,
    attacksPerformed: 0
  };
  
  
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
      // Set isFrozen property on the hero state
      if (!state.players.opponent.hero) {
        state.players.opponent.hero = { isFrozen: true };
      } else {
        state.players.opponent.hero.isFrozen = true;
      }
    }
  } else if (targetType === 'minion') {
    // Find target on opponent's battlefield
    let targetInfo = findCardInstance(state.players.opponent.battlefield, targetId!);
    
    if (targetInfo) {
      // Freeze the enemy minion
      state.players.opponent.battlefield[targetInfo.index].isFrozen = true;
    } else {
      // Check player's battlefield (for any_minion targets)
      targetInfo = findCardInstance(state.players.player.battlefield, targetId!);
      
      if (targetInfo) {
        // Freeze the friendly minion
        state.players.player.battlefield[targetInfo.index].isFrozen = true;
      } else {
        debug.error('Target minion not found for freeze battlecry');
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
    return state;
  }
  
  // Find target on opponent's battlefield
  const targetInfo = findCardInstance(state.players.opponent.battlefield, targetId!);
  
  if (!targetInfo) {
    debug.error('Target enemy minion not found for mind control battlecry');
    return state;
  }
  
  const targetMinion = targetInfo.card;
  const targetIndex = targetInfo.index;
  
  // Remove minion from opponent's battlefield (ALWAYS remove regardless of board state)
  state.players.opponent.battlefield.splice(targetIndex, 1);
  
  // Ensure player battlefield array exists
  if (!state.players.player.battlefield) {
    state.players.player.battlefield = [];
  }
  
  // Check if player board is full
  if (state.players.player.battlefield.length >= MAX_BATTLEFIELD_SIZE) {
    // Board is full, send the minion to graveyard instead
    if (!state.players.player.graveyard) {
      state.players.player.graveyard = [];
    }
    (state.players.player.graveyard as any[]).push(targetMinion);
    return state;
  }

  // Board is not full, add to player's battlefield
  targetMinion.isSummoningSick = true; // Mind controlled minions can't attack immediately
  state.players.player.battlefield.push(targetMinion);
  
  
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
  
  // Find the card on the battlefield
  const cardInfo = findCardInstance(state.players.player.battlefield, cardInstanceId);
  
  if (!cardInfo) {
    debug.error(`Colossal minion with ID ${cardInstanceId} not found on battlefield`);
    return state;
  }
  
  const cardInstance = cardInfo.card;
  
  // Verify the card has the colossal keyword
  if (!getCardKeywords(cardInstance.card).includes('colossal')) {
    debug.error(`Card ${cardInstance.card.name} does not have the colossal keyword`);
    return state;
  }
  
  
  // Use the colossalUtils function to summon the parts
  return summonColossalParts(state, cardInstanceId, 'player');
}

export function isValidBattlecryTarget(
  card: CardData,
  targetId: string,
  targetType: 'minion' | 'hero',
  state: GameState
): boolean {
  // Only minions can have battlecry
  if (card.type !== 'minion') return false;
  const minionCard = card as MinionCardData;
  
  // If the card doesn't have a battlecry or doesn't require a target, all targets are invalid
  if (!minionCard.battlecry || !minionCard.battlecry.requiresTarget) {
    return false;
  }
  
  type BattlecryTargetTypeString = string;
  const targetTypeMap: Record<BattlecryTargetTypeString, { validTypes: ('minion' | 'hero')[], validOwners: ('player' | 'opponent')[] }> = {
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
  
  const battlecryTargetType = minionCard.battlecry.targetType || 'none';
  const validationConfig = targetTypeMap[battlecryTargetType] || targetTypeMap['any'];
  
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

function executeBuffAdjacentBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  cardInstanceId: string
): GameState {
  const battlefield = state.players.player.battlefield || [];
  const cardIndex = battlefield.findIndex(c => c.instanceId === cardInstanceId);
  if (cardIndex === -1) return state;

  const buffAttack = battlecry.buffAttack || 0;
  const buffHealth = battlecry.buffHealth || 0;

  const adjacentIndices = [cardIndex - 1, cardIndex + 1];
  for (const idx of adjacentIndices) {
    if (idx >= 0 && idx < battlefield.length) {
      const minion = battlefield[idx];
      (minion.card as any).attack = ((minion.card as any).attack || 0) + buffAttack;
      (minion.card as any).health = ((minion.card as any).health || 0) + buffHealth;
      minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health ?? 0) + buffHealth;
    }
  }
  return state;
}

function executeSummonMultipleBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];

  const summonCardIds = (battlecry as any).summonCardIds as number[] | undefined;
  if (Array.isArray(summonCardIds)) {
    for (const cardId of summonCardIds) {
      if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;
      const cardData = allCards.find(c => c.id === cardId);
      if (cardData) {
        const instance = createCardInstance(cardData);
        instance.isPlayed = true;
        state.players.player.battlefield.push(instance);
      }
    }
  } else {
    const cardId = battlecry.summonCardId;
    const count = (battlecry as any).count || 1;
    if (cardId) {
      const cardData = allCards.find(c => c.id === cardId);
      if (cardData) {
        for (let i = 0; i < count; i++) {
          if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;
          const instance = createCardInstance(cardData);
          instance.isPlayed = true;
          state.players.player.battlefield.push(instance);
        }
      }
    }
  }
  return state;
}

function executeBuffHandBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const buffAttack = battlecry.buffAttack || 0;
  const buffHealth = battlecry.buffHealth || 0;
  const manaCostReduction = (battlecry as any).manaCostReduction || 0;

  for (const card of state.players.player.hand) {
    if (card.card.type === 'minion') {
      (card.card as any).attack = ((card.card as any).attack || 0) + buffAttack;
      (card.card as any).health = ((card.card as any).health || 0) + buffHealth;
    }
    if (manaCostReduction > 0) {
      card.card.manaCost = Math.max(0, (card.card.manaCost || 0) - manaCostReduction);
    }
  }
  return state;
}

function executeConditionalDamageBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  const condition = (battlecry as any).condition as string | undefined;
  let conditionMet = false;

  if (condition === 'holding_dragon') {
    conditionMet = state.players.player.hand.some(c => isCardOfTribe(c.card, 'dragon'));
  } else if (condition === 'minion_count') {
    const conditionValue = (battlecry as any).conditionValue || 0;
    conditionMet = (state.players.player.battlefield || []).length >= conditionValue;
  } else if (condition === 'combo') {
    conditionMet = true;
  } else {
    conditionMet = true;
  }

  if (!conditionMet) return state;

  return executeDamageBattlecry(state, battlecry, targetId, targetType);
}

function executeAddRandomToHandBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const count = battlecry.value || 1;
  const cardType = (battlecry as any).cardType as string | undefined;

  let candidates = [...allCards];
  if (cardType) {
    candidates = candidates.filter(c => c.type === cardType);
  }
  if (candidates.length === 0) return state;

  for (let i = 0; i < count; i++) {
    if (state.players.player.hand.length >= 7) break;
    const randomIdx = Math.floor(Math.random() * candidates.length);
    const cardInstance = createCardInstance(candidates[randomIdx]);
    state.players.player.hand.push(cardInstance);
  }
  return state;
}

function executeBuffAttackBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  if (!targetId) return state;

  const playerBattlefield = state.players.player.battlefield || [];
  const opponentBattlefield = state.players.opponent.battlefield || [];
  let targetInfo = findCardInstance(playerBattlefield, targetId);
  if (!targetInfo) targetInfo = findCardInstance(opponentBattlefield, targetId);
  if (!targetInfo) return state;

  const buffAmount = battlecry.value || battlecry.buffAttack || 1;
  (targetInfo.card.card as any).attack = ((targetInfo.card.card as any).attack || 0) + buffAmount;
  return state;
}

function executeRecruitBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  const count = battlecry.value || 1;
  const deck = state.players.player.deck as any[];

  for (let i = 0; i < count; i++) {
    if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;
    const minionIndices: number[] = [];
    deck.forEach((c, idx) => {
      const type = c.card ? c.card.type : c.type;
      if (type === 'minion') minionIndices.push(idx);
    });
    if (minionIndices.length === 0) break;

    const randomIdx = minionIndices[Math.floor(Math.random() * minionIndices.length)];
    const recruited = deck.splice(randomIdx, 1)[0];
    const cardData = recruited.card || recruited;
    const lookupCard = allCards.find(c => c.id === cardData.id);
    const instance = createCardInstance(lookupCard || cardData);
    instance.isPlayed = true;
    state.players.player.battlefield.push(instance);
  }
  return state;
}

function executeSummonForOpponentBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.opponent.battlefield) state.players.opponent.battlefield = [];
  const cardId = battlecry.summonCardId;
  const count = (battlecry as any).count || 1;
  if (!cardId) return state;

  const cardData = allCards.find(c => c.id === cardId);
  if (!cardData) return state;

  for (let i = 0; i < count; i++) {
    if (state.players.opponent.battlefield.length >= MAX_BOARD_SIZE) break;
    const instance = createCardInstance(cardData);
    instance.isPlayed = true;
    state.players.opponent.battlefield.push(instance);
  }
  return state;
}

function executeSwapStatsBattlecry(
  state: GameState,
  targetId?: string
): GameState {
  if (!targetId) return state;

  const playerBattlefield = state.players.player.battlefield || [];
  const opponentBattlefield = state.players.opponent.battlefield || [];
  let targetInfo = findCardInstance(playerBattlefield, targetId);
  if (!targetInfo) targetInfo = findCardInstance(opponentBattlefield, targetId);
  if (!targetInfo) return state;

  const minion = targetInfo.card;
  const minionCard = minion.card as any;
  const currentAttack = minionCard.attack || 0;
  const currentHealth = minion.currentHealth ?? minionCard.health ?? 0;

  minionCard.attack = currentHealth;
  minionCard.health = currentAttack;
  minion.currentHealth = currentAttack;
  return state;
}

function executeGiveManaBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const amount = battlecry.value || 1;
  const player = state.players.player as any;
  player.maxMana = Math.min(10, (player.maxMana || 0) + amount);
  player.currentMana = Math.min(player.maxMana, (player.currentMana || 0) + amount);
  return state;
}

function executeHealAoeBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const healAmount = battlecry.value || 2;
  const battlefield = state.players.player.battlefield || [];

  for (const minion of battlefield) {
    const maxHealth = (minion.card as any).health || 0;
    const current = minion.currentHealth ?? maxHealth;
    minion.currentHealth = Math.min(maxHealth, current + healAmount);
  }
  return state;
}

function executeBuffTempBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  if (!targetId) return state;

  const playerBattlefield = state.players.player.battlefield || [];
  const opponentBattlefield = state.players.opponent.battlefield || [];
  let targetInfo = findCardInstance(playerBattlefield, targetId);
  if (!targetInfo) targetInfo = findCardInstance(opponentBattlefield, targetId);
  if (!targetInfo) return state;

  const buffAmount = battlecry.buffAttack || battlecry.value || 1;
  const minion = targetInfo.card;
  (minion.card as any).attack = ((minion.card as any).attack || 0) + buffAmount;
  (minion as any).tempAttackBuff = buffAmount;
  return state;
}

function executeGainTemporaryManaBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const amount = battlecry.value || 1;
  (state.players.player as any).currentMana = ((state.players.player as any).currentMana || 0) + amount;
  return state;
}

function executeBuffWeaponBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const weapon = (state.players.player as any).weapon;
  if (!weapon) return state;

  weapon.attack = (weapon.attack || 0) + (battlecry.buffAttack || battlecry.value || 1);
  if (battlecry.buffHealth) {
    weapon.durability = (weapon.durability || 0) + battlecry.buffHealth;
  }
  return state;
}

function executeReduceNextSpellCostBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  (state.players.player as any).nextSpellCostReduction = battlecry.value || 1;
  return state;
}

function checkBattlecryCondition(state: GameState, condition: string): boolean {
  switch (condition) {
    case 'no_duplicates': {
      const deck = state.players.player.deck || [];
      const cardIds = deck.map(c => (c as any).card?.id || (c as any).id);
      const uniqueIds = new Set(cardIds);
      return uniqueIds.size === cardIds.length;
    }
    case 'holding_dragon': {
      const hand = state.players.player.hand || [];
      return hand.some(c => isCardOfTribe(c.card, 'dragon'));
    }
    default:
      return true;
  }
}

function executeConditionalDiscoverBattlecry(
  state: GameState,
  cardInstanceId: string,
  battlecry: BattlecryEffect
): GameState {
  const condition = (battlecry as any).condition;
  if (!checkBattlecryCondition(state, condition)) {
    return state;
  }
  return executeDiscoverBattlecry(state, cardInstanceId, battlecry);
}

function executeConditionalBuffBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  cardInstanceId: string,
  targetId?: string
): GameState {
  const condition = (battlecry as any).condition;
  if (!checkBattlecryCondition(state, condition)) {
    return state;
  }

  const searchId = battlecry.requiresTarget && targetId ? targetId : cardInstanceId;
  const playerBattlefield = state.players.player.battlefield || [];
  const opponentBattlefield = state.players.opponent.battlefield || [];
  let targetInfo = findCardInstance(playerBattlefield, searchId);
  if (!targetInfo) targetInfo = findCardInstance(opponentBattlefield, searchId);
  if (!targetInfo) return state;

  const minion = targetInfo.card;
  const buffAtk = battlecry.buffAttack || 0;
  const buffHp = battlecry.buffHealth || 0;
  (minion.card as any).attack = ((minion.card as any).attack || 0) + buffAtk;
  (minion.card as any).health = ((minion.card as any).health || 0) + buffHp;
  minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + buffHp;
  return state;
}

function executeConditionalBuffAndTauntBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  cardInstanceId: string,
  targetId?: string
): GameState {
  const condition = (battlecry as any).condition;
  if (!checkBattlecryCondition(state, condition)) {
    return state;
  }

  const searchId = battlecry.requiresTarget && targetId ? targetId : cardInstanceId;
  const playerBattlefield = state.players.player.battlefield || [];
  const opponentBattlefield = state.players.opponent.battlefield || [];
  let targetInfo = findCardInstance(playerBattlefield, searchId);
  if (!targetInfo) targetInfo = findCardInstance(opponentBattlefield, searchId);
  if (!targetInfo) return state;

  const minion = targetInfo.card;
  const buffAtk = battlecry.buffAttack || 0;
  const buffHp = battlecry.buffHealth || 0;
  (minion.card as any).attack = ((minion.card as any).attack || 0) + buffAtk;
  (minion.card as any).health = ((minion.card as any).health || 0) + buffHp;
  minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + buffHp;

  const keywords: string[] = (minion.card as any).keywords || [];
  if (!keywords.includes('taunt')) {
    keywords.push('taunt');
    (minion.card as any).keywords = keywords;
  }
  (minion as any).hasTaunt = true;
  return state;
}

function executeGiveDivineShieldBattlecry(
  state: GameState,
  targetId?: string
): GameState {
  if (!targetId) return state;

  const playerBattlefield = state.players.player.battlefield || [];
  const opponentBattlefield = state.players.opponent.battlefield || [];
  let targetInfo = findCardInstance(playerBattlefield, targetId);
  if (!targetInfo) targetInfo = findCardInstance(opponentBattlefield, targetId);
  if (!targetInfo) return state;

  targetInfo.card.hasDivineShield = true;
  return state;
}

function executeGrantDeathrattleBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  if (!targetId) return state;

  const playerBattlefield = state.players.player.battlefield || [];
  const opponentBattlefield = state.players.opponent.battlefield || [];
  let targetInfo = findCardInstance(playerBattlefield, targetId);
  if (!targetInfo) targetInfo = findCardInstance(opponentBattlefield, targetId);
  if (!targetInfo) return state;

  const minion = targetInfo.card;
  (minion.card as any).deathrattle = (battlecry as any).deathrattle;

  const keywords: string[] = (minion.card as any).keywords || [];
  if (!keywords.includes('deathrattle')) {
    keywords.push('deathrattle');
    (minion.card as any).keywords = keywords;
  }
  return state;
}

function executeMindControlTemporaryBattlecry(
  state: GameState,
  targetId?: string
): GameState {
  if (!targetId) return state;

  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const opponentBattlefield = state.players.opponent.battlefield || [];
  const targetInfo = findCardInstance(opponentBattlefield, targetId);
  if (!targetInfo) return state;

  const minion = targetInfo.card;
  state.players.opponent.battlefield.splice(targetInfo.index, 1);
  (minion as any).temporaryControl = true;
  minion.isSummoningSick = false;
  state.players.player.battlefield.push(minion);
  return state;
}

function executeCopyFromOpponentBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const count = battlecry.value || 1;
  const opponentHand = state.players.opponent.hand || [];
  if (opponentHand.length === 0) return state;

  const maxHandSize = 9;
  for (let i = 0; i < count; i++) {
    if (state.players.player.hand.length >= maxHandSize) break;
    if (opponentHand.length === 0) break;

    const randomIndex = Math.floor(Math.random() * opponentHand.length);
    const card = opponentHand[randomIndex];
    const copy = createCardInstance(card.card);
    state.players.player.hand.push(copy);
  }
  return state;
}

function executeAdaptBattlecry(
  state: GameState,
  cardInstanceId: string
): GameState {
  const playerBattlefield = state.players.player.battlefield || [];
  const opponentBattlefield = state.players.opponent.battlefield || [];
  let targetInfo = findCardInstance(playerBattlefield, cardInstanceId);
  if (!targetInfo) targetInfo = findCardInstance(opponentBattlefield, cardInstanceId);
  if (!targetInfo) return state;

  const minion = targetInfo.card;
  const adaptations = [
    { type: 'stats', attack: 1, health: 1 },
    { type: 'stats', attack: 3, health: 0 },
    { type: 'stats', attack: 0, health: 3 },
    { type: 'keyword', keyword: 'divine_shield' },
    { type: 'keyword', keyword: 'taunt' },
    { type: 'keyword', keyword: 'windfury' },
    { type: 'keyword', keyword: 'stealth' },
    { type: 'keyword', keyword: 'poisonous' },
    { type: 'keyword', keyword: 'elusive' },
    { type: 'keyword', keyword: 'deathrattle_tokens' },
  ];

  const chosen = adaptations[Math.floor(Math.random() * adaptations.length)];

  if (chosen.type === 'stats') {
    (minion.card as any).attack = ((minion.card as any).attack || 0) + (chosen.attack || 0);
    (minion.card as any).health = ((minion.card as any).health || 0) + (chosen.health || 0);
    minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + (chosen.health || 0);
  } else if (chosen.type === 'keyword') {
    const keywords: string[] = (minion.card as any).keywords || [];
    switch (chosen.keyword) {
      case 'divine_shield':
        minion.hasDivineShield = true;
        if (!keywords.includes('divine_shield')) keywords.push('divine_shield');
        break;
      case 'taunt':
        (minion as any).hasTaunt = true;
        if (!keywords.includes('taunt')) keywords.push('taunt');
        break;
      case 'windfury':
        (minion as any).hasWindfury = true;
        if (!keywords.includes('windfury')) keywords.push('windfury');
        break;
      case 'stealth':
        (minion as any).hasStealth = true;
        if (!keywords.includes('stealth')) keywords.push('stealth');
        break;
      case 'poisonous':
        (minion as any).hasPoisonous = true;
        if (!keywords.includes('poisonous')) keywords.push('poisonous');
        break;
      case 'elusive':
        (minion as any).cantBeTargeted = true;
        if (!keywords.includes('elusive')) keywords.push('elusive');
        break;
      case 'deathrattle_tokens':
        if (!keywords.includes('deathrattle')) keywords.push('deathrattle');
        (minion.card as any).deathrattle = { type: 'summon', summonCardId: 'token_1_1', count: 2 };
        break;
    }
    (minion.card as any).keywords = keywords;
  }
  return state;
}

function executeSummonUntilFullBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const summonCardId = (battlecry as any).summonCardId;
  if (!summonCardId) return state;

  const cardTemplate = allCards.find(c => c.id === summonCardId);
  if (!cardTemplate) return state;

  while (state.players.player.battlefield.length < MAX_BOARD_SIZE) {
    const instance = createCardInstance(cardTemplate);
    instance.currentHealth = (cardTemplate as any).health || 1;
    state.players.player.battlefield.push(instance);
  }
  return state;
}

function executeTransformFriendlyBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string
): GameState {
  if (!targetId || !battlecry.value) {
    return state;
  }
  return transformMinion(state, targetId, battlecry.value);
}

function executeTriggerDeathrattleBattlecry(
  state: GameState,
  targetId?: string
): GameState {
  if (!targetId) return state;
  return state;
}

function executeBuffAndDamageBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  cardInstanceId: string,
  targetId?: string
): GameState {
  if (!targetId) return state;

  const damage = (battlecry as any).damageValue ?? battlecry.value ?? 1;
  const buffAtk = battlecry.buffAttack || 0;
  const buffHp = battlecry.buffHealth || 0;

  // Find target in either battlefield (card description says "Give a minion" — any minion)
  let targetInfo = findCardInstance(state.players.opponent.battlefield || [], targetId);
  let ownerKey: 'opponent' | 'player' = 'opponent';
  if (!targetInfo) {
    targetInfo = findCardInstance(state.players.player.battlefield || [], targetId);
    ownerKey = 'player';
  }
  if (!targetInfo) return state;

  const m = targetInfo.card;
  if (m.currentHealth === undefined) m.currentHealth = (m.card as any).health || 1;

  // Apply attack buff to the target
  if (buffAtk > 0) {
    (m.card as any).attack = ((m.card as any).attack || 0) + buffAtk;
    m.currentAttack = (m.currentAttack ?? (m.card as any).attack) + buffAtk;
  }
  if (buffHp > 0) {
    (m.card as any).health = ((m.card as any).health || 0) + buffHp;
    m.currentHealth += buffHp;
  }

  // Deal damage to the target (after buff so max health is updated first)
  if (m.hasDivineShield) {
    m.hasDivineShield = false;
  } else {
    m.currentHealth = (m.currentHealth ?? 0) - damage;
    if ((m.currentHealth ?? 0) <= 0) {
      state.players[ownerKey].battlefield.splice(targetInfo.index, 1);
    }
  }

  return state;
}

function executeBuffAndTauntBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId: string
): GameState {
  const playerBattlefield = state.players.player.battlefield || [];
  const opponentBattlefield = state.players.opponent.battlefield || [];
  let targetInfo = findCardInstance(playerBattlefield, targetId);
  if (!targetInfo) targetInfo = findCardInstance(opponentBattlefield, targetId);
  if (!targetInfo) return state;

  const minion = targetInfo.card;
  (minion.card as any).attack = ((minion.card as any).attack || 0) + (battlecry.buffAttack || 0);
  (minion.card as any).health = ((minion.card as any).health || 0) + (battlecry.buffHealth || 0);
  minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + (battlecry.buffHealth || 0);

  const keywords: string[] = (minion.card as any).keywords || [];
  if (!keywords.includes('taunt')) {
    keywords.push('taunt');
    (minion.card as any).keywords = keywords;
  }
  (minion as any).hasTaunt = true;
  return state;
}

function executeBuffAoeBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  cardInstanceId: string
): GameState {
  const battlefield = state.players.player.battlefield || [];
  const buffAtk = battlecry.buffAttack || 0;
  const buffHp = battlecry.buffHealth || 0;

  for (const minion of battlefield) {
    if (minion.instanceId === cardInstanceId) continue;
    (minion.card as any).attack = ((minion.card as any).attack || 0) + buffAtk;
    (minion.card as any).health = ((minion.card as any).health || 0) + buffHp;
    minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + buffHp;
  }
  return state;
}

function executeBuffBeastsInHandBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const buffAtk = battlecry.buffAttack || 0;
  const buffHp = battlecry.buffHealth || 0;
  const hand = state.players.player.hand || [];

  for (const card of hand) {
    if (isCardOfTribe(card.card, 'beast')) {
      (card.card as any).attack = ((card.card as any).attack || 0) + buffAtk;
      (card.card as any).health = ((card.card as any).health || 0) + buffHp;
    }
  }
  return state;
}

function executeBuffByHandSizeBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  cardInstanceId: string
): GameState {
  const handSize = (state.players.player.hand || []).length;
  const battlefield = state.players.player.battlefield || [];
  const idx = battlefield.findIndex(c => c.instanceId === cardInstanceId);
  if (idx === -1) return state;

  const minion = battlefield[idx];
  (minion.card as any).attack = ((minion.card as any).attack || 0) + handSize;
  (minion.card as any).health = ((minion.card as any).health || 0) + handSize;
  minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + handSize;
  return state;
}

function executeBuffHealthByHandSizeBattlecry(
  state: GameState,
  cardInstanceId: string
): GameState {
  const handSize = (state.players.player.hand || []).length;
  const battlefield = state.players.player.battlefield || [];
  const idx = battlefield.findIndex(c => c.instanceId === cardInstanceId);
  if (idx === -1) return state;

  const minion = battlefield[idx];
  (minion.card as any).health = ((minion.card as any).health || 0) + handSize;
  minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + handSize;
  return state;
}

function executeBuffPerCardInHandBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  cardInstanceId: string
): GameState {
  const handSize = (state.players.player.hand || []).length;
  const battlefield = state.players.player.battlefield || [];
  const idx = battlefield.findIndex(c => c.instanceId === cardInstanceId);
  if (idx === -1) return state;

  const minion = battlefield[idx];
  const totalAtk = handSize * (battlecry.buffAttack || 0);
  const totalHp = handSize * (battlecry.buffHealth || 0);
  (minion.card as any).attack = ((minion.card as any).attack || 0) + totalAtk;
  (minion.card as any).health = ((minion.card as any).health || 0) + totalHp;
  minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + totalHp;
  return state;
}

function executeBuffPerDeadFriendlyMinionBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  cardInstanceId: string
): GameState {
  const graveyard = (state.players.player.graveyard || []) as any[];
  const deadCount = graveyard.filter(c => (c.card ? c.card.type : c.type) === 'minion').length;
  if (deadCount === 0) return state;

  const battlefield = state.players.player.battlefield || [];
  const idx = battlefield.findIndex(c => c.instanceId === cardInstanceId);
  if (idx === -1) return state;

  const minion = battlefield[idx];
  const buffPerMinion = battlecry.buffAttack || 1;
  const totalBuff = deadCount * buffPerMinion;
  (minion.card as any).attack = ((minion.card as any).attack || 0) + totalBuff;
  (minion.card as any).health = ((minion.card as any).health || 0) + totalBuff;
  minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + totalBuff;
  return state;
}

function executeBuffHeroBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const amount = battlecry.value || 0;
  state.players.player.heroArmor = (state.players.player.heroArmor || 0) + amount;
  return state;
}

function executeBrawlBattlecry(
  state: GameState
): GameState {
  const playerBf = state.players.player.battlefield || [];
  const opponentBf = state.players.opponent.battlefield || [];
  const allMinions: { minion: any; side: 'player' | 'opponent' }[] = [];

  for (const m of playerBf) allMinions.push({ minion: m, side: 'player' });
  for (const m of opponentBf) allMinions.push({ minion: m, side: 'opponent' });

  if (allMinions.length <= 1) return state;

  const survivorIdx = Math.floor(Math.random() * allMinions.length);
  const survivor = allMinions[survivorIdx];

  state.players.player.battlefield = [];
  state.players.opponent.battlefield = [];

  if (survivor.side === 'player') {
    state.players.player.battlefield.push(survivor.minion);
  } else {
    state.players.opponent.battlefield.push(survivor.minion);
  }
  return state;
}

function executeChooseKeywordsBattlecry(
  state: GameState,
  cardInstanceId: string
): GameState {
  const battlefield = state.players.player.battlefield || [];
  const idx = battlefield.findIndex(c => c.instanceId === cardInstanceId);
  if (idx === -1) return state;

  const minion = battlefield[idx];
  const options = ['taunt', 'divine_shield', 'windfury', 'stealth'];
  const chosen = options[Math.floor(Math.random() * options.length)];

  const keywords: string[] = (minion.card as any).keywords || [];
  if (!keywords.includes(chosen)) {
    keywords.push(chosen);
    (minion.card as any).keywords = keywords;
  }

  switch (chosen) {
    case 'taunt': (minion as any).hasTaunt = true; break;
    case 'divine_shield': minion.hasDivineShield = true; break;
    case 'windfury': (minion as any).hasWindfury = true; break;
    case 'stealth': (minion as any).hasStealth = true; break;
  }
  return state;
}

function executeWeaponAttackBuffBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const weapon = (state.players.player as any).weapon;
  if (!weapon) return state;
  const buffAmount = battlecry.value || 1;
  weapon.attack = (weapon.attack || ((weapon.card as any)?.attack || 0)) + buffAmount;
  if (weapon.card) (weapon.card as any).attack = ((weapon.card as any).attack || 0) + buffAmount;
  return state;
}

function executeWeaponDurabilityDamageBattlecry(
  state: GameState,
  battlecry: BattlecryEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  const weapon = (state.players.player as any).weapon;
  if (!weapon) return state;
  if (!targetId) return state;

  const durability = weapon.currentHealth || (weapon.card as any)?.durability || 1;

  if (targetType === 'hero') {
    if (targetId === 'opponent') {
      state = dealDamage(state, 'opponent', 'hero', durability);
    } else {
      state = dealDamage(state, 'player', 'hero', durability);
    }
  } else if (targetType === 'minion') {
    let targetInfo = findCardInstance(state.players.opponent.battlefield || [], targetId);
    if (targetInfo) {
      const m = targetInfo.card;
      if (m.currentHealth === undefined) m.currentHealth = (m.card as any).health || 1;
      m.currentHealth! -= durability;
      if (m.currentHealth! <= 0) {
        state.players.opponent.battlefield.splice(targetInfo.index, 1);
      }
    } else {
      targetInfo = findCardInstance(state.players.player.battlefield || [], targetId);
      if (targetInfo) {
        const m = targetInfo.card;
        if (m.currentHealth === undefined) m.currentHealth = (m.card as any).health || 1;
        m.currentHealth! -= durability;
        if (m.currentHealth! <= 0) {
          state.players.player.battlefield.splice(targetInfo.index, 1);
        }
      }
    }
  }
  return state;
}

function executeStealFromDeckBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  const count = battlecry.value || 1;
  const opponentDeck = state.players.opponent.deck as any[];
  if (!opponentDeck || opponentDeck.length === 0) return state;

  for (let i = 0; i < count; i++) {
    if (state.players.player.hand.length >= 7) break;
    if (opponentDeck.length === 0) break;
    const randomIdx = Math.floor(Math.random() * opponentDeck.length);
    const stolen = opponentDeck.splice(randomIdx, 1)[0];
    const cardData = stolen.card || stolen;
    const instance = createCardInstance(cardData);
    state.players.player.hand.push(instance);
  }
  return state;
}

function executeSwapHandsBattlecry(
  state: GameState
): GameState {
  const temp = state.players.player.hand;
  state.players.player.hand = state.players.opponent.hand;
  state.players.opponent.hand = temp;
  return state;
}

function executeAdaptMurlocsBattlecry(
  state: GameState
): GameState {
  const battlefield = state.players.player.battlefield || [];
  const murlocs = battlefield.filter(m => isCardOfTribe(m.card, 'murloc'));
  if (murlocs.length === 0) return state;

  const adaptations = [
    { type: 'stats', attack: 1, health: 1 },
    { type: 'stats', attack: 3, health: 0 },
    { type: 'stats', attack: 0, health: 3 },
    { type: 'keyword', keyword: 'divine_shield' },
    { type: 'keyword', keyword: 'taunt' },
    { type: 'keyword', keyword: 'windfury' },
    { type: 'keyword', keyword: 'stealth' },
    { type: 'keyword', keyword: 'poisonous' },
  ];

  const chosen = adaptations[Math.floor(Math.random() * adaptations.length)];

  for (const minion of murlocs) {
    if (chosen.type === 'stats') {
      (minion.card as any).attack = ((minion.card as any).attack || 0) + (chosen.attack || 0);
      (minion.card as any).health = ((minion.card as any).health || 0) + (chosen.health || 0);
      minion.currentHealth = (minion.currentHealth ?? (minion.card as any).health) + (chosen.health || 0);
    } else if (chosen.type === 'keyword' && chosen.keyword) {
      const keywords: string[] = (minion.card as any).keywords || [];
      if (!keywords.includes(chosen.keyword)) {
        keywords.push(chosen.keyword);
        (minion.card as any).keywords = keywords;
      }
      switch (chosen.keyword) {
        case 'divine_shield': minion.hasDivineShield = true; break;
        case 'taunt': (minion as any).hasTaunt = true; break;
        case 'windfury': (minion as any).hasWindfury = true; break;
        case 'stealth': (minion as any).hasStealth = true; break;
        case 'poisonous': (minion as any).hasPoisonous = true; break;
      }
    }
  }
  return state;
}

function executeSummonHorsemanBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  if (battlecry.summonCardId) {
    const cardData = allCards.find(c => c.id === battlecry.summonCardId);
    if (cardData) {
      const instance = createCardInstance(cardData);
      instance.isPlayed = true;
      state.players.player.battlefield.push(instance);
      return state;
    }
  }

  const tokenCard: CardData = {
    id: 99800,
    name: 'Horseman',
    description: 'A 2/2 Horseman.',
    manaCost: 2,
    type: 'minion',
    rarity: 'token' as any,
    heroClass: 'neutral',
    attack: 2,
    health: 2,
    keywords: []
  } as any;
  const instance = createCardInstance(tokenCard);
  instance.isPlayed = true;
  state.players.player.battlefield.push(instance);
  return state;
}

function executeSummonRandomLegendaryBattlecry(
  state: GameState
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const legendaries = allCards.filter(c => c.type === 'minion' && c.rarity === 'legendary');
  if (legendaries.length === 0) return state;

  const selected = legendaries[Math.floor(Math.random() * legendaries.length)];
  const instance = createCardInstance(selected);
  instance.isPlayed = true;
  state.players.player.battlefield.push(instance);
  return state;
}

function executeSummonSplittingBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  if (battlecry.summonCardId) {
    const cardData = allCards.find(c => c.id === battlecry.summonCardId);
    if (cardData) {
      const instance = createCardInstance(cardData);
      instance.isPlayed = true;
      state.players.player.battlefield.push(instance);
    }
  }
  return state;
}

function executeSummonIfOtherDiedBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const graveyard = (state.players.player.graveyard || []) as any[];
  const hasDead = graveyard.some(c => (c.card ? c.card.type : c.type) === 'minion');
  if (!hasDead) return state;

  if (battlecry.summonCardId) {
    const cardData = allCards.find(c => c.id === battlecry.summonCardId);
    if (cardData) {
      const instance = createCardInstance(cardData);
      instance.isPlayed = true;
      state.players.player.battlefield.push(instance);
    }
  }
  return state;
}

function executeSummonAndDrawBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];

  if (battlecry.summonCardId && state.players.player.battlefield.length < MAX_BOARD_SIZE) {
    const cardData = allCards.find(c => c.id === battlecry.summonCardId);
    if (cardData) {
      const instance = createCardInstance(cardData);
      instance.isPlayed = true;
      state.players.player.battlefield.push(instance);
    }
  }

  const drawCount = (battlecry as any).drawCount || 1;
  for (let i = 0; i < drawCount; i++) {
    if (state.players.player.deck.length === 0) break;
    if (state.players.player.hand.length >= 7) break;
    const drawn = state.players.player.deck.shift()!;
    const instance = createCardInstance(drawn);
    state.players.player.hand.push(instance);
  }
  return state;
}

function executeSummonCopyFromHandBattlecry(
  state: GameState
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const hand = state.players.player.hand || [];
  const minionsInHand = hand.filter(c => c.card.type === 'minion');
  if (minionsInHand.length === 0) return state;

  const randomCard = minionsInHand[Math.floor(Math.random() * minionsInHand.length)];
  const copy = createCardInstance(randomCard.card);
  copy.isPlayed = true;
  state.players.player.battlefield.push(copy);
  return state;
}

function executeSummonFromBothHandsBattlecry(
  state: GameState
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const opponentHand = state.players.opponent.hand || [];
  const minionsInHand = opponentHand.filter(c => c.card.type === 'minion');
  if (minionsInHand.length === 0) return state;

  const randomIdx = Math.floor(Math.random() * minionsInHand.length);
  const selected = minionsInHand[randomIdx];
  const handIdx = opponentHand.indexOf(selected);
  if (handIdx !== -1) opponentHand.splice(handIdx, 1);

  const instance = createCardInstance(selected.card);
  instance.isPlayed = true;
  state.players.player.battlefield.push(instance);
  return state;
}

function executeSummonFromOpponentHandBattlecry(
  state: GameState
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const opponentHand = state.players.opponent.hand || [];
  const minionsInHand = opponentHand.filter(c => c.card.type === 'minion');
  if (minionsInHand.length === 0) return state;

  const randomIdx = Math.floor(Math.random() * minionsInHand.length);
  const selected = minionsInHand[randomIdx];
  const handIdx = opponentHand.indexOf(selected);
  if (handIdx !== -1) opponentHand.splice(handIdx, 1);

  const instance = createCardInstance(selected.card);
  instance.isPlayed = true;
  state.players.player.battlefield.push(instance);
  return state;
}

function executeSummonDeathrattleMinionsThatDiedBattlecry(
  state: GameState
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const graveyard = (state.players.player.graveyard || []) as any[];
  const deathrattleMinions = graveyard.filter(c => {
    const card = c.card || c;
    if ((card.type || '') !== 'minion') return false;
    const kw = card.keywords || [];
    return kw.includes('deathrattle');
  });

  if (deathrattleMinions.length === 0) return state;

  const randomPick = deathrattleMinions[Math.floor(Math.random() * deathrattleMinions.length)];
  const cardData = randomPick.card || randomPick;
  const lookupCard = allCards.find(c => c.id === cardData.id);
  const instance = createCardInstance(lookupCard || cardData);
  instance.isPlayed = true;
  state.players.player.battlefield.push(instance);
  return state;
}

function executeSummonAllTotemsBattlecry(
  state: GameState
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];

  const totems: { name: string; attack: number; health: number; keywords: string[] }[] = [
    { name: 'Healing Totem', attack: 0, health: 2, keywords: [] },
    { name: 'Stoneclaw Totem', attack: 0, health: 2, keywords: ['taunt'] },
    { name: 'Searing Totem', attack: 1, health: 1, keywords: [] },
    { name: 'Wrath of Air Totem', attack: 0, health: 2, keywords: ['spell_damage'] },
  ];

  for (let i = 0; i < totems.length; i++) {
    if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) break;
    const totemDef = totems[i];
    const tokenCard: CardData = {
      id: 99810 + i,
      name: totemDef.name,
      description: `A basic ${totemDef.name}.`,
      manaCost: 1,
      type: 'minion',
      rarity: 'token' as any,
      heroClass: 'shaman',
      attack: totemDef.attack,
      health: totemDef.health,
      race: 'totem',
      keywords: totemDef.keywords
    } as any;
    const instance = createCardInstance(tokenCard);
    instance.isPlayed = true;
    if (totemDef.keywords.includes('taunt')) {
      (instance as any).hasTaunt = true;
    }
    state.players.player.battlefield.push(instance);
  }
  return state;
}

function executeSummonDefenderBattlecry(
  state: GameState,
  battlecry: BattlecryEffect
): GameState {
  if (!state.players.player.battlefield) state.players.player.battlefield = [];
  if (state.players.player.battlefield.length >= MAX_BOARD_SIZE) return state;

  const atk = (battlecry as any).summonAttack || battlecry.buffAttack || battlecry.value || 1;
  const hp = (battlecry as any).summonHealth || battlecry.buffHealth || battlecry.value || 1;

  const tokenCard: CardData = {
    id: 99820,
    name: 'Defender',
    description: 'A defender with Taunt.',
    manaCost: 1,
    type: 'minion',
    rarity: 'token' as any,
    heroClass: 'neutral',
    attack: atk,
    health: hp,
    keywords: ['taunt']
  } as any;
  const instance = createCardInstance(tokenCard);
  instance.isPlayed = true;
  (instance as any).hasTaunt = true;
  state.players.player.battlefield.push(instance);
  return state;
}

function executeCopyToHandBattlecry(state: GameState, targetId?: string): GameState {
  if (!targetId) return state;

  const player = state.players.player;
  const target = player.battlefield.find(c => c.instanceId === targetId);
  if (!target) return state;

  if ((player.hand?.length ?? 0) >= 10) return state;

  const copy = createCardInstance(target.card);
  player.hand = player.hand || [];
  player.hand.push(copy);

  return state;
}