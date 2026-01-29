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
    case 'freeze_and_damage':
      // Freeze all targets first, then deal damage to frozen ones
      resultState = applyFreezeEffect(state, effect.targetType || 'all_enemy_minions');
      resultState = executeAoEDamageSpell(resultState, { ...effect, targetType: effect.targetType || 'all_enemy_minions' });
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, 'Freeze & Damage');
      }
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
    case 'destroy':
      resultState = executeDestroySpell(state, effect, targetId, targetType);
      break;
    case 'mind_control':
      resultState = executeMindControlSpell(state, effect, targetId);
      break;
    case 'mind_control_temporary':
      resultState = executeMindControlSpell(state, effect, targetId, true);
      break;
    case 'return_to_hand':
      resultState = executeReturnToHandSpell(state, effect, targetId);
      break;
    case 'buff_weapon':
      resultState = executeBuffWeaponSpell(state, effect);
      break;
    case 'equip_weapon':
      resultState = executeEquipWeaponSpell(state, effect);
      break;
    case 'add_card':
      resultState = executeAddCardSpell(state, effect);
      break;
    case 'random_damage':
    case 'damage_random_enemy':
      resultState = executeRandomDamageSpell(state, effect);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, 'Random Target');
      }
      break;
    case 'destroy_random':
      resultState = executeDestroyRandomSpell(state, effect);
      break;
    case 'shuffle_into_deck':
      resultState = executeShuffleIntoDeckSpell(state, effect, targetId);
      break;
    case 'give_stealth':
    case 'grant_keyword':
      resultState = executeGrantKeywordSpell(state, effect, targetId);
      break;
    case 'grant_deathrattle':
      resultState = executeGrantDeathrattleSpell(state, effect, targetId);
      break;
    case 'damage_based_on_armor':
      resultState = executeDamageBasedOnArmorSpell(state, effect, targetId, targetType);
      // Calculate actual damage based on current player's armor for popup
      const currentPlayerState = state.currentTurn === 'player' ? state.players.player : state.players.opponent;
      const armorDamage = currentPlayerState.armor || 0;
      if (armorDamage > 0) {
        queueSpellDamagePopup(spellCard.card.name, armorDamage, 'Armor Damage');
      }
      break;
    case 'summon_jade_golem':
      resultState = executeSummonJadeGolemSpell(state);
      break;
    case 'gain_mana':
    case 'mana_gain':
      resultState = executeGainManaSpell(state, effect);
      break;
    case 'summon_random':
      resultState = executeSummonRandomSpell(state, effect);
      break;
    case 'summon_copies':
      resultState = executeSummonCopiesSpell(state, effect, targetId);
      break;
    case 'summon_token':
      resultState = executeSummonTokenSpell(state, effect);
      break;
    case 'summon_minions':
      resultState = executeSummonMultipleSpell(state, effect);
      break;
    case 'summon_from_graveyard':
      resultState = executeSummonFromGraveyardSpell(state, effect);
      break;
    case 'summon_highest_cost_from_graveyard':
      resultState = executeSummonHighestCostFromGraveyardSpell(state, effect);
      break;
    case 'summon_rush_minions':
      resultState = executeSummonRushMinionsSpell(state, effect);
      break;
    case 'summon_stored':
      resultState = executeSummonStoredSpell(state, effect);
      break;
    case 'resurrect_random':
      resultState = executeResurrectSpell(state, effect);
      break;
    case 'resurrect_multiple':
      resultState = executeResurrectMultipleSpell(state, effect);
      break;
    case 'resurrect_deathrattle':
      resultState = executeResurrectDeathrattleSpell(state, effect);
      break;
    case 'silence_all':
      resultState = executeSilenceAllSpell(state, effect);
      break;
    case 'silence_and_damage':
      resultState = executeSilenceAndDamageSpell(state, effect, targetId, targetType);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, 'Silence + Damage');
      }
      break;
    case 'set_attack':
      resultState = executeSetAttackSpell(state, effect, targetId);
      break;
    case 'set_hero_health':
      resultState = executeSetHeroHealthSpell(state, effect, targetId);
      break;
    case 'self_damage':
      resultState = executeSelfDamageSpell(state, effect);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, 'Self Damage');
      }
      break;
    case 'self_damage_buff':
      resultState = executeSelfDamageBuffSpell(state, effect);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, 'Self Damage + Buff');
      }
      break;
    case 'sacrifice':
      resultState = executeSacrificeSpell(state, effect, targetId);
      break;
    case 'sacrifice_and_aoe_damage':
      resultState = executeSacrificeAndAoEDamageSpell(state, effect, targetId);
      if (effect.value) {
        queueSpellDamagePopup(spellCard.card.name, effect.value, 'Sacrifice + AoE');
      }
      break;
    case 'return':
      resultState = executeReturnToHandSpell(state, effect, targetId);
      break;
    case 'return_to_hand_next_turn':
      resultState = executeReturnToHandNextTurnSpell(state, effect, targetId);
      break;
    case 'transform_random':
      resultState = executeTransformRandomSpell(state, effect);
      break;
    case 'transform_copy':
    case 'transform_into_copy':
      resultState = executeTransformCopySpell(state, effect, targetId);
      break;
    case 'transform_random_in_hand':
      resultState = executeTransformRandomInHandSpell(state, effect);
      break;
    case 'transform_and_silence':
      resultState = executeTransformAndSilenceSpell(state, effect, targetId);
      break;
    case 'transform_deck':
      resultState = executeTransformDeckSpell(state, effect);
      break;
    case 'transform_copy_from_deck':
      resultState = executeTransformCopyFromDeckSpell(state, effect, targetId);
      break;
    case 'transform_healing_to_damage':
      resultState = executeTransformHealingToDamageSpell(state, effect);
      break;
    case 'split_damage':
      resultState = executeSplitDamageSpell(state, effect);
      break;
    case 'swap_decks':
      resultState = executeSwapDecksSpell(state, effect);
      break;
    case 'swap_hero_power':
      resultState = executeSwapHeroPowerSpell(state, effect);
      break;
    case 'reduce_deck_cost':
      resultState = executeReduceDeckCostSpell(state, effect);
      break;
    case 'reduce_next_spell_cost':
      resultState = executeReduceNextSpellCostSpell(state, effect);
      break;
    case 'reduce_opponent_mana':
      resultState = executeReduceOpponentManaSpell(state, effect);
      break;
    case 'reduce_spell_cost':
      resultState = executeReduceSpellCostSpell(state, effect);
      break;
    case 'replace_hero_power':
    case 'change_hero_power':
      resultState = executeReplaceHeroPowerSpell(state, effect);
      break;
    case 'replay_battlecries':
      resultState = executeReplayBattlecriesSpell(state, effect);
      break;
    case 'replay_spells':
      resultState = executeReplaySpellsSpell(state, effect);
      break;
    case 'random_damage_and_buff':
      resultState = executeRandomDamageAndBuffSpell(state, effect);
      break;
    case 'random_damage_with_self_damage':
      resultState = executeRandomDamageWithSelfDamageSpell(state, effect);
      break;
    case 'random_weapon':
      resultState = executeRandomWeaponSpell(state, effect);
      break;
    case 'shuffle_copies':
      resultState = executeShuffleCopiesSpell(state, effect, targetId);
      break;
    case 'shuffle_cards':
      resultState = executeShuffleCardsSpell(state, effect);
      break;
    case 'gain_mana_crystal':
      resultState = executeManaSpell(state, { ...effect, value: effect.value || 1 });
      break;
    case 'draw_multiple':
      resultState = executeDrawSpell(state, { ...effect, value: effect.count || effect.value || 1 });
      break;
    case 'draw_until':
      resultState = executeDrawUntilSpell(state, effect);
      break;
    case 'gain_armor_and_draw':
      resultState = executeGainArmorAndDrawSpell(state, effect);
      break;
    case 'gain_armor_and_immunity':
      resultState = executeGainArmorAndImmunitySpell(state, effect);
      break;
    case 'gain_armor_and_lifesteal':
      resultState = executeGainArmorAndLifestealSpell(state, effect);
      break;
    case 'add_to_hand':
      resultState = executeAddCardSpell(state, effect);
      break;
    case 'give_cards':
      resultState = executeGiveCardsSpell(state, effect);
      break;
    case 'copy_card':
      resultState = executeCopyCardSpell(state, effect, targetId);
      break;
    case 'copy_from_opponent_deck':
      resultState = executeCopyFromOpponentDeckSpell(state, effect);
      break;
    case 'aoe_heal':
      resultState = executeAoEHealSpell(state, effect);
      break;
    case 'buff_all':
    case 'buff_all_minions':
      resultState = executeBuffAllSpell(state, effect);
      break;
    case 'debuff':
    case 'debuff_attack':
      resultState = executeDebuffSpell(state, effect, targetId);
      break;
    case 'resurrect':
      resultState = executeResurrectSpell(state, effect);
      break;
    case 'summon_multiple':
    case 'summon_tokens':
      resultState = executeSummonMultipleSpell(state, effect);
      break;
    case 'summon_copy':
      resultState = executeSummonCopySpell(state, effect, targetId);
      break;
    case 'destroy_all_minions':
    case 'destroy_all':
      resultState = executeDestroyAllMinionsSpell(state, effect);
      break;
    case 'destroy_tribe':
      resultState = executeDestroyTribeSpell(state, effect);
      break;
    case 'swap_stats':
      resultState = executeSwapStatsSpell(state, effect, targetId);
      break;
    case 'swap_stats_with_target':
      resultState = executeSwapStatsWithTargetSpell(state, effect, targetId);
      break;
    case 'double_health':
      resultState = executeDoubleHealthSpell(state, effect, targetId);
      break;
    case 'divine_shield_gain':
      resultState = executeGainDivineShieldSpell(state, effect, targetId);
      break;
    case 'grant_immunity':
      resultState = executeGrantImmunitySpell(state, effect, targetId);
      break;
    case 'mana_discount':
    case 'mana_reduction':
      resultState = executeManaDiscountSpell(state, effect);
      break;
    case 'hero_attack':
      resultState = executeHeroAttackSpell(state, effect);
      break;
    case 'weapon_damage_aoe':
      resultState = executeWeaponDamageAoESpell(state, effect);
      break;
    case 'shadowflame':
      resultState = executeShadowflameSpell(state, effect, targetId);
      break;
    case 'conditional_effect':
      resultState = executeConditionalEffectSpell(state, effect, targetId, targetType);
      break;
    case 'conditional_summon':
      resultState = executeConditionalSummonSpell(state, effect);
      break;
    case 'conditional_draw':
      resultState = executeConditionalDrawSpell(state, effect);
      break;
    case 'conditional_armor':
    case 'conditional_gain_armor':
      resultState = executeConditionalArmorSpell(state, effect);
      break;
    case 'draw_specific':
    case 'draw_by_type':
      resultState = executeDrawSpecificSpell(state, effect);
      break;
    case 'discard':
    case 'discard_random':
      resultState = executeDiscardSpell(state, effect);
      break;
    case 'mill':
    case 'mill_cards':
      resultState = executeMillSpell(state, effect);
      break;
    case 'buff_hand':
      resultState = executeBuffHandSpell(state, effect);
      break;
    case 'buff_deck':
      resultState = executeBuffDeckSpell(state, effect);
      break;
    case 'transform_all':
      resultState = executeTransformAllSpell(state, effect);
      break;
    case 'freeze_all':
      resultState = applyFreezeEffect(state, 'all_enemy_minions');
      break;
    case 'restore_health':
      resultState = executeHealSpell(state, effect, targetId, targetType);
      break;
    case 'shuffle_card':
      resultState = executeShuffleIntoDeckSpell(state, effect, targetId);
      break;
    case 'mind_control_random':
      resultState = executeMindControlRandomSpell(state, effect);
      break;
    case 'gain_mana_crystals':
      resultState = executeGainManaCrystalsSpell(state, effect);
      break;
    case 'buff_attack':
      resultState = executeBuffAttackSpell(state, effect, targetId);
      break;
    case 'deal_damage':
      resultState = executeDamageSpell(state, effect, targetId, targetType);
      if (effect.value) {
        queueSpellDamagePopup('Spell', effect.value);
      }
      break;
    case 'summon_from_hand':
      resultState = executeSummonFromHandSpell(state, effect);
      break;
    case 'buff_tribe':
      resultState = executeBuffTribeSpell(state, effect);
      break;
    case 'buff_self':
      resultState = executeBuffSelfSpell(state, effect, targetId);
      break;
    case 'conditional_self_buff':
      resultState = executeConditionalSelfBuffSpell(state, effect, targetId);
      break;
    case 'gain_stealth_until_next_turn':
      resultState = executeGrantKeywordSpell(state, { ...effect, keyword: 'stealth' as CardKeyword }, targetId);
      break;
    case 'copy_card_to_hand':
      resultState = executeCopyCardSpell(state, effect, targetId);
      break;
    case 'steal_card':
      resultState = executeStealCardSpell(state, effect);
      break;
    case 'swap_attack_health':
      resultState = executeSwapStatsSpell(state, effect, targetId);
      break;
    case 'buff_damaged_minions':
      resultState = executeBuffDamagedMinionsSpell(state, effect);
      break;
    case 'draw_from_deck':
      resultState = executeDrawSpell(state, effect);
      break;
    case 'armor':
    case 'gain_armor':
      resultState = executeGainArmorSpell(state, effect);
      break;
    default:
      console.error(`Unknown spell effect type: ${effect.type}`);
      return state;
  }
  
  // Process secondary effects (e.g., heal + discover like Renew)
  if (effect.secondaryEffect) {
    
    if (effect.secondaryEffect.type === 'discover') {
      // Create a discover effect from the secondary effect
      const discoverEffect: SpellEffect = {
        type: 'discover',
        discoveryType: effect.secondaryEffect.cardType || 'spell',
        discoveryCount: effect.secondaryEffect.count || 3
      };
      resultState = executeDiscoverSpell(resultState, discoverEffect, spellCard.instanceId);
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
            target.hasDivineShield = false;
          } else {
            target.currentHealth -= damageAmount;
            
            // Apply enrage effects after damage
            newState = updateEnrageEffects(newState);
          }
          
          // Check if the minion is destroyed
          if (target.currentHealth <= 0) {
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
              target.hasDivineShield = false;
            } else {
              target.currentHealth -= damageAmount;
              
              // Apply enrage effects after damage
              newState = updateEnrageEffects(newState);
            }
            
            // Check if the minion is destroyed
            if (target.currentHealth <= 0) {
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
    } else if (targetId === 'player' || targetId === 'player-hero') {
      newState.players.player.health = healthValue;
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
          newMinion.hasDivineShield = false;
          newBattlefield.push(newMinion);
        } else {
          // Apply damage
          newMinion.currentHealth! -= damageAmount; // Non-null assertion after above init
          
          // Check if destroyed
          if (newMinion.currentHealth! <= 0) {
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
    } else if (targetId === 'player' || targetId === 'player-hero') {
      // Heal player
      const heroHealth = newState.players.player.health || 30;
      const newHealth = Math.min(heroHealth + healAmount, 30);
      newState.players.player.health = newHealth;
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
    
    // Get the correct player object
    const targetPlayer = targetId === 'player' ? player : opponent;
    
    // Apply hero attack buff - store as temporary attack for this turn
    if (effect.buffAttack) {
      if (!targetPlayer.tempAttackBuff) {
        targetPlayer.tempAttackBuff = 0;
      }
      targetPlayer.tempAttackBuff += effect.buffAttack;
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
      }
      
      // Apply health buff
      if (effect.buffHealth && target.currentHealth !== undefined && target.card.health !== undefined) {
        target.card.health += effect.buffHealth;
        target.currentHealth += effect.buffHealth;
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
            } else if (keyword === 'taunt') {
            } else if (keyword === 'windfury') {
            } else {
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
        }
        
        // Apply health buff
        if (effect.buffHealth && target.currentHealth !== undefined && target.card.health !== undefined) {
          target.card.health += effect.buffHealth;
          target.currentHealth += effect.buffHealth;
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
              } else if (keyword === 'taunt') {
              } else if (keyword === 'windfury') {
              } else {
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
    } else {
    }
  } else {
    // Check if battlefield is full
    if (newState.players.opponent.battlefield.length < 7) {
      newState.players.opponent.battlefield.push(summonedInstance);
    } else {
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
      
      // Use our standardized drawMultipleCards function
      return drawMultipleCards(newState, currentPlayer, drawAmount);
    } else {
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
  console.log('[executeDiscoverSpell] Called with effect:', effect, 'sourceCardId:', sourceCardId);
  
  // Number of cards to choose from (typically 3 in Hearthstone)
  const discoveryCount = effect.discoveryCount || 3;
  
  // Create discovery options
  const discoveryType = effect.discoveryType || 'any';
  const discoveryClass = effect.discoveryClass || 'any';
  
  console.log('[executeDiscoverSpell] discoveryType:', discoveryType, 'discoveryClass:', discoveryClass, 'discoveryCount:', discoveryCount);
  
  // Get random cards based on discovery type/class
  let pool = [...allCards];
  console.log('[executeDiscoverSpell] Total card pool size:', pool.length);
  
  // Filter by type if specified
  if (discoveryType !== 'any') {
    pool = pool.filter(card => card.type === discoveryType);
    console.log('[executeDiscoverSpell] After type filter, pool size:', pool.length);
  }
  
  // Filter by class if specified
  if (discoveryClass !== 'any') {
    pool = pool.filter(card => 
      card.class?.toLowerCase() === discoveryClass.toLowerCase() || 
      card.heroClass?.toLowerCase() === discoveryClass.toLowerCase()
    );
    console.log('[executeDiscoverSpell] After class filter, pool size:', pool.length);
  }

  // Shuffle and pick
  const discoveryOptions = pool
    .sort(() => 0.5 - Math.random())
    .slice(0, discoveryCount);
  
  console.log('[executeDiscoverSpell] Discovery options:', discoveryOptions.map(c => c.name));
  console.log('[executeDiscoverSpell] Setting discovery.active = true');
  
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
          } else {
          }
        } else {
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
  } else {
    newState.players.opponent.extraTurn = true;
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
    
  }
  
  return newState;
}

// [Removed duplicate executeSetHealthSpell function as it's already defined earlier in the file]

/**
 * Execute a cast all spells spell effect (like Zul'jin hero card)
 */
function executeCastAllSpellsSpell(state: GameState, effect: SpellEffect): GameState {
  
  // In a real implementation, we'd need to track all spells played in the game
  // For now, we'll just simulate by logging the effect
  
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
        } else {
          // Regular debuff
          target.card.attack = Math.max(0, target.card.attack + attackDebuff);
        }
      }
      
      // Apply health debuff if any
      if (healthDebuff < 0 && target.currentHealth !== undefined && target.card.health !== undefined) {
        target.card.health = Math.max(1, target.card.health + healthDebuff);
        target.currentHealth = Math.max(1, target.currentHealth + healthDebuff);
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
          } else {
            // Regular debuff
            target.card.attack = Math.max(0, target.card.attack + attackDebuff);
          }
        }
        
        // Apply health debuff if any
        if (healthDebuff < 0 && target.currentHealth !== undefined && target.card.health !== undefined) {
          target.card.health = Math.max(1, target.card.health + healthDebuff);
          target.currentHealth = Math.max(1, target.currentHealth + healthDebuff);
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
    return newState;
  }
  
  // Calculate damage based on card cost
  let damageAmount = 0;
  
  if (effect.damageBasedOnDrawnCardCost && cardsDrawn.length > 0) {
    // Use the mana cost of the first drawn card
    damageAmount = cardsDrawn[0].manaCost;
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

/**
 * Execute a destroy spell effect - destroys a targeted minion
 */
function executeDestroySpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!targetId) {
    console.error('Destroy spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Find and destroy the target minion
  let destroyedMinion: CardInstance | null = null;
  
  // Check player's battlefield
  const playerIdx = player.battlefield.findIndex(m => m.instanceId === targetId);
  if (playerIdx !== -1) {
    destroyedMinion = player.battlefield[playerIdx];
    player.battlefield.splice(playerIdx, 1);
    player.graveyard = [...(player.graveyard || []), destroyedMinion];
  }
  
  // Check opponent's battlefield
  const oppIdx = opponent.battlefield.findIndex(m => m.instanceId === targetId);
  if (oppIdx !== -1) {
    destroyedMinion = opponent.battlefield[oppIdx];
    opponent.battlefield.splice(oppIdx, 1);
    opponent.graveyard = [...(opponent.graveyard || []), destroyedMinion];
  }
  
  if (destroyedMinion) {
    
    // Apply secondary effect (e.g., heal hero for Soul's Siphon)
    if (effect.secondaryValue && effect.secondaryType === 'heal') {
      const currentPlayer = state.currentTurn || 'player';
      if (currentPlayer === 'player') {
        newState.players.player.health = Math.min(30, (newState.players.player.health || 30) + effect.secondaryValue);
      } else {
        newState.players.opponent.health = Math.min(30, (newState.players.opponent.health || 30) + effect.secondaryValue);
      }
    }
  }
  
  return newState;
}

/**
 * Execute a mind control spell - take control of enemy minion
 */
function executeMindControlSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  temporary: boolean = false
): GameState {
  if (!targetId) {
    console.error('Mind control spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  
  // Clone arrays to avoid direct mutations
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  const myBattlefield = currentPlayer === 'player' ? [...player.battlefield] : [...opponent.battlefield];
  const enemyBattlefield = currentPlayer === 'player' ? [...opponent.battlefield] : [...player.battlefield];
  
  // Find target in enemy battlefield
  const targetIdx = enemyBattlefield.findIndex(m => m.instanceId === targetId);
  if (targetIdx === -1) {
    console.error('Mind control target not found in enemy battlefield');
    return state;
  }
  
  // Check if player's battlefield is full (max 7 minions)
  if (myBattlefield.length >= 7) {
    console.warn(`Cannot take control of ${enemyBattlefield[targetIdx].card.name}: your battlefield is full (7/7)`);
    return state;
  }
  
  // Take control of the minion
  const stolenMinion = { ...enemyBattlefield[targetIdx] };
  stolenMinion.isSummoningSick = true;
  stolenMinion.canAttack = false;
  if (temporary) {
    stolenMinion.temporaryControl = true;
  }
  
  // Remove from enemy battlefield and add to own battlefield
  enemyBattlefield.splice(targetIdx, 1);
  myBattlefield.push(stolenMinion);
  
  // Update the state with cloned arrays
  if (currentPlayer === 'player') {
    newState.players.player.battlefield = myBattlefield;
    newState.players.opponent.battlefield = enemyBattlefield;
  } else {
    newState.players.opponent.battlefield = myBattlefield;
    newState.players.player.battlefield = enemyBattlefield;
  }
  
  
  return newState;
}

/**
 * Execute a return to hand spell - bounces minion back to owner's hand
 */
function executeReturnToHandSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Return to hand spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Clone arrays to avoid direct mutations
  let playerBattlefield = [...player.battlefield];
  let playerHand = [...player.hand];
  let opponentBattlefield = [...opponent.battlefield];
  let opponentHand = [...opponent.hand];
  
  // Check player's battlefield
  const playerIdx = playerBattlefield.findIndex(m => m.instanceId === targetId);
  if (playerIdx !== -1) {
    const minion = playerBattlefield[playerIdx];
    
    // Check if hand is full before adding
    if (playerHand.length >= 10) {
      console.warn(`Cannot return ${minion.card.name} to hand: hand is full (10/10)`);
      return state;
    }
    
    // Remove from battlefield
    playerBattlefield.splice(playerIdx, 1);
    
    // Reset minion state and add to hand
    minion.currentHealth = minion.card.health || 0;
    minion.isSummoningSick = true;
    minion.canAttack = false;
    playerHand.push(minion);
    
    // Update state
    newState.players.player.battlefield = playerBattlefield;
    newState.players.player.hand = playerHand;
    
    return newState;
  }
  
  // Check opponent's battlefield
  const oppIdx = opponentBattlefield.findIndex(m => m.instanceId === targetId);
  if (oppIdx !== -1) {
    const minion = opponentBattlefield[oppIdx];
    
    // Check if hand is full before adding
    if (opponentHand.length >= 10) {
      console.warn(`Cannot return ${minion.card.name} to opponent's hand: hand is full (10/10)`);
      return state;
    }
    
    // Remove from battlefield
    opponentBattlefield.splice(oppIdx, 1);
    
    // Reset minion state and add to hand
    minion.currentHealth = minion.card.health || 0;
    minion.isSummoningSick = true;
    minion.canAttack = false;
    opponentHand.push(minion);
    
    // Update state
    newState.players.opponent.battlefield = opponentBattlefield;
    newState.players.opponent.hand = opponentHand;
    
    return newState;
  }
  
  return newState;
}

/**
 * Execute a buff weapon spell - adds attack/durability to equipped weapon
 */
function executeBuffWeaponSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  if (!playerState.weapon) {
    return state;
  }
  
  if (effect.value) {
    playerState.weapon.attack = (playerState.weapon.attack || 0) + effect.value;
  }
  if (effect.secondaryValue) {
    playerState.weapon.durability = (playerState.weapon.durability || 0) + effect.secondaryValue;
  }
  
  
  return newState;
}

/**
 * Execute an equip weapon spell - equips a weapon from a spell
 */
function executeEquipWeaponSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.weaponCardId) {
    console.error('Equip weapon spell missing weaponCardId');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Find the weapon card
  const weaponCard = allCards.find(c => c.id === effect.weaponCardId);
  if (!weaponCard || weaponCard.type !== 'weapon') {
    console.error(`Weapon card ${effect.weaponCardId} not found`);
    return state;
  }
  
  playerState.weapon = {
    card: weaponCard,
    attack: weaponCard.attack || 0,
    durability: weaponCard.durability || 1
  };
  
  
  return newState;
}

/**
 * Execute an add card spell - generates cards into hand
 */
function executeAddCardSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerHand = currentPlayer === 'player' ? newState.players.player.hand : newState.players.opponent.hand;
  
  const count = effect.count || 1;
  
  if (effect.addCardId) {
    // Add specific card(s)
    const cardToAdd = allCards.find(c => c.id === effect.addCardId);
    if (cardToAdd) {
      for (let i = 0; i < count && playerHand.length < 10; i++) {
        const instance: CardInstance = {
          instanceId: uuidv4(),
          card: cardToAdd,
          currentHealth: cardToAdd.health || 0,
          canAttack: false,
          isSummoningSick: true,
          attacksPerformed: 0
        };
        playerHand.push(instance);
      }
    }
  } else if (effect.addRandomType) {
    // Add random cards of a type
    const validCards = allCards.filter(c => c.type === effect.addRandomType && c.collectible);
    for (let i = 0; i < count && playerHand.length < 10; i++) {
      const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
      if (randomCard) {
        const instance: CardInstance = {
          instanceId: uuidv4(),
          card: randomCard,
          currentHealth: randomCard.health || 0,
          canAttack: false,
          isSummoningSick: true,
          attacksPerformed: 0
        };
        playerHand.push(instance);
      }
    }
  }
  
  return newState;
}

/**
 * Execute a random damage spell - deals damage to random enemy
 */
function executeRandomDamageSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Random damage spell missing value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const enemyBattlefield = currentPlayer === 'player' ? 
    newState.players.opponent.battlefield : 
    newState.players.player.battlefield;
  
  // Get valid targets (enemy minions and optionally hero)
  const targets: Array<{ type: 'minion' | 'hero'; id?: string; idx?: number }> = [];
  
  enemyBattlefield.forEach((minion, idx) => {
    targets.push({ type: 'minion', id: minion.instanceId, idx });
  });
  
  if (effect.targetType !== 'enemy_minion_only') {
    targets.push({ type: 'hero' });
  }
  
  if (targets.length === 0) {
    return state;
  }
  
  // Pick random target
  const target = targets[Math.floor(Math.random() * targets.length)];
  
  if (target.type === 'hero') {
    const enemyPlayer = currentPlayer === 'player' ? newState.players.opponent : newState.players.player;
    enemyPlayer.health = (enemyPlayer.health || 30) - effect.value;
  } else if (target.idx !== undefined) {
    const minion = enemyBattlefield[target.idx];
    minion.currentHealth = (minion.currentHealth || minion.card.health || 0) - effect.value;
    
    // Check for death
    if (minion.currentHealth <= 0) {
      enemyBattlefield.splice(target.idx, 1);
      const graveyard = currentPlayer === 'player' ? 
        newState.players.opponent.graveyard : 
        newState.players.player.graveyard;
      graveyard.push(minion);
    }
  }
  
  return newState;
}

/**
 * Execute destroy random spell - destroys a random enemy minion
 */
function executeDestroyRandomSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const enemyBattlefield = currentPlayer === 'player' ? 
    newState.players.opponent.battlefield : 
    newState.players.player.battlefield;
  
  if (enemyBattlefield.length === 0) {
    return state;
  }
  
  const randomIdx = Math.floor(Math.random() * enemyBattlefield.length);
  const destroyed = enemyBattlefield.splice(randomIdx, 1)[0];
  
  const graveyard = currentPlayer === 'player' ? 
    newState.players.opponent.graveyard : 
    newState.players.player.graveyard;
  graveyard.push(destroyed);
  
  
  return newState;
}

/**
 * Execute shuffle into deck spell
 */
function executeShuffleIntoDeckSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  
  if (targetId) {
    // Shuffle a specific minion from battlefield
    const player = newState.players.player;
    const opponent = newState.players.opponent;
    
    const playerIdx = player.battlefield.findIndex(m => m.instanceId === targetId);
    if (playerIdx !== -1) {
      const minion = player.battlefield.splice(playerIdx, 1)[0];
      player.deck.push(minion);
      // Shuffle
      player.deck.sort(() => Math.random() - 0.5);
    }
    
    const oppIdx = opponent.battlefield.findIndex(m => m.instanceId === targetId);
    if (oppIdx !== -1) {
      const minion = opponent.battlefield.splice(oppIdx, 1)[0];
      opponent.deck.push(minion);
      opponent.deck.sort(() => Math.random() - 0.5);
    }
  } else if (effect.shuffleCardId) {
    // Shuffle a specific card into deck
    const cardToShuffle = allCards.find(c => c.id === effect.shuffleCardId);
    if (cardToShuffle) {
      const instance: CardInstance = {
        instanceId: uuidv4(),
        card: cardToShuffle,
        currentHealth: cardToShuffle.health || 0,
        canAttack: false,
        isSummoningSick: true,
        attacksPerformed: 0
      };
      
      const deck = currentPlayer === 'player' ? 
        newState.players.player.deck : 
        newState.players.opponent.deck;
      deck.push(instance);
      deck.sort(() => Math.random() - 0.5);
    }
  }
  
  return newState;
}

/**
 * Execute grant keyword spell - gives a minion a keyword like stealth
 */
function executeGrantKeywordSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Grant keyword spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Find target minion
  let target: CardInstance | null = null;
  const playerIdx = player.battlefield.findIndex(m => m.instanceId === targetId);
  if (playerIdx !== -1) {
    target = player.battlefield[playerIdx];
  }
  
  const oppIdx = opponent.battlefield.findIndex(m => m.instanceId === targetId);
  if (oppIdx !== -1) {
    target = opponent.battlefield[oppIdx];
  }
  
  if (!target) {
    console.error('Target minion not found');
    return state;
  }
  
  // Apply keyword
  const keyword = effect.keyword || effect.grantKeyword || 'stealth';
  switch (keyword.toLowerCase()) {
    case 'stealth':
      target.hasStealth = true;
      break;
    case 'taunt':
      target.hasTaunt = true;
      break;
    case 'divine shield':
      target.hasDivineShield = true;
      break;
    case 'windfury':
      target.hasWindfury = true;
      break;
    case 'lifesteal':
      target.hasLifesteal = true;
      break;
    case 'poisonous':
      target.hasPoisonous = true;
      break;
    case 'rush':
      target.hasRush = true;
      target.canAttack = true;
      break;
    case 'charge':
      target.hasCharge = true;
      target.canAttack = true;
      target.isSummoningSick = false;
      break;
  }
  
  
  return newState;
}

/**
 * Execute grant deathrattle spell
 */
function executeGrantDeathrattleSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Grant deathrattle spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Find target
  let target: CardInstance | null = null;
  const playerIdx = player.battlefield.findIndex(m => m.instanceId === targetId);
  if (playerIdx !== -1) {
    target = player.battlefield[playerIdx];
  }
  
  const oppIdx = opponent.battlefield.findIndex(m => m.instanceId === targetId);
  if (oppIdx !== -1) {
    target = opponent.battlefield[oppIdx];
  }
  
  if (target && effect.deathrattle) {
    target.addedDeathrattle = effect.deathrattle;
  }
  
  return newState;
}

/**
 * Execute damage based on armor spell (like Shield Slam)
 */
function executeDamageBasedOnArmorSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!targetId) {
    console.error('Damage based on armor spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  const armor = playerState.armor || 0;
  const damageAmount = armor;
  
  if (damageAmount <= 0) {
    return state;
  }
  
  // Apply damage using the damage spell logic
  const damageEffect: SpellEffect = {
    type: 'damage',
    value: damageAmount,
    requiresTarget: true
  };
  
  return executeDamageSpell(newState, damageEffect, targetId, targetType);
}

/**
 * Execute summon jade golem spell
 */
function executeSummonJadeGolemSpell(
  state: GameState
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Increment jade counter
  if (!playerState.jadeCounter) {
    playerState.jadeCounter = 1;
  } else {
    playerState.jadeCounter = Math.min(playerState.jadeCounter + 1, 30);
  }
  
  const jadeSize = playerState.jadeCounter;
  
  // Create jade golem token
  const jadeGolem: CardInstance = {
    instanceId: uuidv4(),
    card: {
      id: 99999,
      name: 'Jade Golem',
      type: 'minion',
      manaCost: jadeSize,
      attack: jadeSize,
      health: jadeSize,
      description: '',
      rarity: 'common',
      class: 'Neutral',
      race: 'Elemental'
    },
    currentHealth: jadeSize,
    canAttack: false,
    isSummoningSick: true,
    attacksPerformed: 0
  };
  
  // Check battlefield limit
  if (playerState.battlefield.length < 7) {
    playerState.battlefield.push(jadeGolem);
  }
  
  return newState;
}

/**
 * Execute gain mana spell
 */
function executeGainManaSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Gain mana spell missing value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  if (effect.permanent) {
    // Permanent mana crystal (like Wild Growth)
    playerState.mana.max = Math.min((playerState.mana.max || 1) + effect.value, 10);
    // Also increase current mana for this turn
    playerState.mana.current = Math.min(playerState.mana.current + effect.value, playerState.mana.max);
  } else {
    // Temporary mana this turn (like Innervate)
    playerState.mana.current = Math.min((playerState.mana.current || 0) + effect.value, 10);
  }
  
  
  return newState;
}

/**
 * Execute summon_random spell effect
 * Summons a random minion from the card pool
 */
function executeSummonRandomSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Check battlefield limit
  if (playerState.battlefield.length >= 7) {
    return newState;
  }
  
  // Get all minion cards from allCards
  const minions = allCards.filter(card => card && card.type === 'minion');
  if (minions.length === 0) {
    console.error('No minions available to summon randomly');
    return newState;
  }
  
  // Pick a random minion
  const randomMinion = minions[Math.floor(Math.random() * minions.length)];
  
  // Create a card instance
  const summonedInstance: CardInstance = {
    instanceId: uuidv4(),
    card: randomMinion as CardData,
    currentHealth: randomMinion.health || 1,
    canAttack: false,
    isPlayed: true,
    isSummoningSick: true,
    attacksPerformed: 0
  };
  
  playerState.battlefield.push(summonedInstance);
  
  return newState;
}

/**
 * Execute summon_copies spell effect
 * Summons multiple copies of a target minion
 */
function executeSummonCopiesSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Summon copies spell requires a target ID');
    return state;
  }
  
  if (!effect.count) {
    console.error('Summon copies spell missing count parameter');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Find the target minion
  let targetMinion: CardInstance | undefined;
  for (const minion of newState.players.player.battlefield.concat(newState.players.opponent.battlefield)) {
    if (minion.instanceId === targetId) {
      targetMinion = minion;
      break;
    }
  }
  
  if (!targetMinion) {
    console.error(`Target minion ${targetId} not found`);
    return state;
  }
  
  // Summon copies
  for (let i = 0; i < effect.count; i++) {
    if (playerState.battlefield.length >= 7) {
      break;
    }
    
    const copiedInstance: CardInstance = {
      instanceId: uuidv4(),
      card: targetMinion.card,
      currentHealth: targetMinion.currentHealth || targetMinion.card.health || 1,
      canAttack: false,
      isPlayed: true,
      isSummoningSick: true,
      attacksPerformed: 0
    };
    
    playerState.battlefield.push(copiedInstance);
  }
  
  
  return newState;
}

/**
 * Execute summon_token spell effect
 * Similar to summon_tokens - summons a specific token minion
 */
function executeSummonTokenSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.tokenId || !effect.count) {
    console.error('Summon token spell missing tokenId or count');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Find the token card
  const tokenCard = allCards.find(card => card && card.id === effect.tokenId);
  if (!tokenCard) {
    console.error(`Token with ID ${effect.tokenId} not found`);
    return state;
  }
  
  // Summon tokens
  for (let i = 0; i < effect.count; i++) {
    if (playerState.battlefield.length >= 7) {
      break;
    }
    
    const tokenInstance: CardInstance = {
      instanceId: uuidv4(),
      card: tokenCard as CardData,
      currentHealth: tokenCard.health || 1,
      canAttack: false,
      isPlayed: true,
      isSummoningSick: true,
      attacksPerformed: 0
    };
    
    playerState.battlefield.push(tokenInstance);
  }
  
  
  return newState;
}

/**
 * Execute summon_from_graveyard spell effect
 * Summons a random minion from the player's graveyard
 */
function executeSummonFromGraveyardSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Check battlefield limit
  if (playerState.battlefield.length >= 7) {
    return newState;
  }
  
  // Check if graveyard is empty
  const graveyard = playerState.graveyard || [];
  if (graveyard.length === 0) {
    return newState;
  }
  
  // Pick a random minion from graveyard
  const randomIndex = Math.floor(Math.random() * graveyard.length);
  const minionToSummon = { ...graveyard[randomIndex] };
  
  // Reset minion state
  minionToSummon.currentHealth = minionToSummon.card.health || 1;
  minionToSummon.isSummoningSick = true;
  minionToSummon.canAttack = false;
  
  // Add to battlefield and remove from graveyard
  playerState.battlefield.push(minionToSummon);
  graveyard.splice(randomIndex, 1);
  playerState.graveyard = graveyard;
  
  
  return newState;
}

/**
 * Execute summon_highest_cost_from_graveyard spell effect
 * Summons the highest cost minion from the player's graveyard
 */
function executeSummonHighestCostFromGraveyardSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Check battlefield limit
  if (playerState.battlefield.length >= 7) {
    return newState;
  }
  
  // Check if graveyard is empty
  const graveyard = playerState.graveyard || [];
  if (graveyard.length === 0) {
    return newState;
  }
  
  // Find the highest cost minion
  let highestCostIndex = 0;
  let highestCost = graveyard[0].card.manaCost || 0;
  
  for (let i = 1; i < graveyard.length; i++) {
    const cost = graveyard[i].card.manaCost || 0;
    if (cost > highestCost) {
      highestCost = cost;
      highestCostIndex = i;
    }
  }
  
  const minionToSummon = { ...graveyard[highestCostIndex] };
  
  // Reset minion state
  minionToSummon.currentHealth = minionToSummon.card.health || 1;
  minionToSummon.isSummoningSick = true;
  minionToSummon.canAttack = false;
  
  // Add to battlefield and remove from graveyard
  playerState.battlefield.push(minionToSummon);
  graveyard.splice(highestCostIndex, 1);
  playerState.graveyard = graveyard;
  
  
  return newState;
}

/**
 * Execute summon_rush_minions spell effect
 * Summons minions that have the Rush keyword
 */
function executeSummonRushMinionsSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  if (!effect.count) {
    console.error('Summon rush minions spell missing count');
    return state;
  }
  
  // Get all rush minions
  const rushMinions = allCards.filter(card => 
    card && card.type === 'minion' && card.keywords && card.keywords.includes('Rush')
  );
  
  if (rushMinions.length === 0) {
    return newState;
  }
  
  // Summon random rush minions
  for (let i = 0; i < effect.count; i++) {
    if (playerState.battlefield.length >= 7) {
      break;
    }
    
    const randomRushMinion = rushMinions[Math.floor(Math.random() * rushMinions.length)];
    
    const summonedInstance: CardInstance = {
      instanceId: uuidv4(),
      card: randomRushMinion as CardData,
      currentHealth: randomRushMinion.health || 1,
      canAttack: true,  // Rush minions can attack immediately
      isPlayed: true,
      isSummoningSick: false,
      attacksPerformed: 0
    };
    
    playerState.battlefield.push(summonedInstance);
  }
  
  
  return newState;
}

/**
 * Execute summon_stored spell effect
 * Summons minions that were stored previously (typically in effect.storedMinions array)
 */
function executeSummonStoredSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  if (!effect.storedMinions || !Array.isArray(effect.storedMinions) || effect.storedMinions.length === 0) {
    return newState;
  }
  
  // Summon each stored minion
  for (const storedMinion of effect.storedMinions) {
    if (playerState.battlefield.length >= 7) {
      break;
    }
    
    // Create instance from stored minion (already a CardInstance)
    const summonedInstance: CardInstance = {
      ...storedMinion,
      instanceId: uuidv4(),  // Generate new instance ID
      isSummoningSick: true,
      canAttack: false
    };
    
    playerState.battlefield.push(summonedInstance);
  }
  
  
  return newState;
}

/**
 * Execute resurrect_multiple spell effect
 * Resurrects multiple minions from the player's graveyard
 */
function executeResurrectMultipleSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  if (!effect.count) {
    console.error('Resurrect multiple spell missing count');
    return state;
  }
  
  // Check graveyard
  const graveyard = [...(playerState.graveyard || [])];
  if (graveyard.length === 0) {
    return newState;
  }
  
  // Resurrect multiple minions
  let resurrectedCount = 0;
  for (let i = 0; i < effect.count && graveyard.length > 0; i++) {
    if (playerState.battlefield.length >= 7) {
      break;
    }
    
    // Pick a random minion from graveyard
    const randomIndex = Math.floor(Math.random() * graveyard.length);
    const minionToResurrect = { ...graveyard[randomIndex] };
    
    // Reset minion state
    minionToResurrect.currentHealth = minionToResurrect.card.health || 1;
    minionToResurrect.isSummoningSick = true;
    minionToResurrect.canAttack = false;
    
    // Add to battlefield
    playerState.battlefield.push(minionToResurrect);
    graveyard.splice(randomIndex, 1);
    resurrectedCount++;
  }
  
  playerState.graveyard = graveyard;
  
  return newState;
}

/**
 * Execute resurrect_deathrattle spell effect
 * Resurrects a minion and triggers its deathrattle effect
 */
function executeResurrectDeathrattleSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn;
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Check battlefield limit
  if (playerState.battlefield.length >= 7) {
    return newState;
  }
  
  // Check graveyard
  const graveyard = [...(playerState.graveyard || [])];
  if (graveyard.length === 0) {
    return newState;
  }
  
  // Pick a random minion from graveyard
  const randomIndex = Math.floor(Math.random() * graveyard.length);
  const minionToResurrect = { ...graveyard[randomIndex] };
  
  // Reset minion state
  minionToResurrect.currentHealth = minionToResurrect.card.health || 1;
  minionToResurrect.isSummoningSick = true;
  minionToResurrect.canAttack = false;
  
  // Add to battlefield
  playerState.battlefield.push(minionToResurrect);
  graveyard.splice(randomIndex, 1);
  playerState.graveyard = graveyard;
  
  
  // TODO: Trigger deathrattle effect if the minion has one
  // This would require checking minionToResurrect.card.deathrattle and executing it
  // For now, just log that we would trigger it
  if (minionToResurrect.card.deathrattle) {
  }
  
  return newState;
}

/**
 * Execute silence_all spell effect - silences all minions on the battlefield
 */
function executeSilenceAllSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Helper function to silence a minion
  const silenceMinion = (minion: CardInstance) => {
    // Store original keywords if not already stored
    if (!minion.originalKeywords) {
      minion.originalKeywords = [...(minion.card.keywords || [])];
    }
    
    // Remove all ability-based keywords
    minion.card.keywords = (minion.card.keywords || []).filter(keyword =>
      keyword !== 'taunt' &&
      keyword !== 'divine_shield' &&
      keyword !== 'windfury' &&
      keyword !== 'deathrattle' &&
      keyword !== 'battlecry' &&
      keyword !== 'spell_damage'
    );
    
    // Remove divine shield if present
    minion.hasDivineShield = false;
    
    // Remove any deathrattle and battlecry effects
    minion.card.deathrattle = undefined;
    minion.card.battlecry = undefined;
    
    // Mark the minion as silenced
    minion.isSilenced = true;
    
    // Reset spell power if present
    minion.spellPower = 0;
    
  };
  
  // Silence all minions on player's battlefield
  for (const minion of player.battlefield) {
    silenceMinion(minion);
  }
  
  // Silence all minions on opponent's battlefield
  for (const minion of opponent.battlefield) {
    silenceMinion(minion);
  }
  
  
  return newState;
}

/**
 * Execute silence_and_damage spell effect - silences a minion and deals damage to it
 */
function executeSilenceAndDamageSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  if (!targetId || !targetType || targetType !== 'minion') {
    console.error('Silence and damage spell requires a minion target');
    return state;
  }
  
  if (!effect.value) {
    console.error('Silence and damage spell missing damage value');
    return state;
  }
  
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Find the target minion
  let targetFound = false;
  
  // Check player's battlefield
  for (const minion of player.battlefield) {
    if (minion.instanceId === targetId) {
      targetFound = true;
      
      // Apply silence effect
      if (!minion.originalKeywords) {
        minion.originalKeywords = [...(minion.card.keywords || [])];
      }
      
      minion.card.keywords = (minion.card.keywords || []).filter(keyword =>
        keyword !== 'taunt' &&
        keyword !== 'divine_shield' &&
        keyword !== 'windfury' &&
        keyword !== 'deathrattle' &&
        keyword !== 'battlecry' &&
        keyword !== 'spell_damage'
      );
      
      minion.hasDivineShield = false;
      minion.card.deathrattle = undefined;
      minion.card.battlecry = undefined;
      minion.isSilenced = true;
      minion.spellPower = 0;
      
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's
  if (!targetFound) {
    for (const minion of opponent.battlefield) {
      if (minion.instanceId === targetId) {
        targetFound = true;
        
        // Apply silence effect
        if (!minion.originalKeywords) {
          minion.originalKeywords = [...(minion.card.keywords || [])];
        }
        
        minion.card.keywords = (minion.card.keywords || []).filter(keyword =>
          keyword !== 'taunt' &&
          keyword !== 'divine_shield' &&
          keyword !== 'windfury' &&
          keyword !== 'deathrattle' &&
          keyword !== 'battlecry' &&
          keyword !== 'spell_damage'
        );
        
        minion.hasDivineShield = false;
        minion.card.deathrattle = undefined;
        minion.card.battlecry = undefined;
        minion.isSilenced = true;
        minion.spellPower = 0;
        
        break;
      }
    }
  }
  
  if (!targetFound) {
    console.error('Target minion not found for silence and damage spell');
    return state;
  }
  
  // Now apply damage using the damage spell effect
  const damageEffect: SpellEffect = {
    type: 'damage',
    value: effect.value,
    requiresTarget: true
  };
  
  return executeDamageSpell(newState, damageEffect, targetId, 'minion');
}

/**
 * Execute set_attack spell effect - sets a minion's attack to a specific value
 */
function executeSetAttackSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Set attack spell requires a target');
    return state;
  }
  
  if (effect.value === undefined) {
    console.error('Set attack spell missing attack value');
    return state;
  }
  
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Find the target minion
  let targetFound = false;
  
  // Check player's battlefield
  for (const minion of player.battlefield) {
    if (minion.instanceId === targetId) {
      targetFound = true;
      minion.card.attack = effect.value;
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's
  if (!targetFound) {
    for (const minion of opponent.battlefield) {
      if (minion.instanceId === targetId) {
        targetFound = true;
        minion.card.attack = effect.value;
        break;
      }
    }
  }
  
  if (!targetFound) {
    console.error('Target minion not found for set attack spell');
    return state;
  }
  
  return newState;
}

/**
 * Execute set_hero_health spell effect - sets a hero's health to a specific value
 */
function executeSetHeroHealthSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Set hero health spell requires a target');
    return state;
  }
  
  if (effect.value === undefined) {
    console.error('Set hero health spell missing health value');
    return state;
  }
  
  let newState = { ...state };
  
  // Set the target hero's health to the specified value
  if (targetId === 'opponent' || targetId === 'opponent-hero') {
    newState.players.opponent.health = effect.value;
  } else if (targetId === 'player' || targetId === 'player-hero') {
    newState.players.player.health = effect.value;
  } else {
    console.error(`Unknown hero target ID: ${targetId}`);
    return state;
  }
  
  return newState;
}

/**
 * Execute self_damage spell effect - deals damage to the caster's hero
 */
function executeSelfDamageSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Self damage spell missing damage value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const damageAmount = effect.value;
  
  // Deal damage to the current player's hero using dealDamage to handle armor properly
  newState = dealDamage(newState, currentPlayer, 'hero', damageAmount);
  
  
  return newState;
}

/**
 * Execute self_damage_buff spell effect - deals damage to self and gains a buff
 */
function executeSelfDamageBuffSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Self damage buff spell missing damage value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  const damageAmount = effect.value;
  
  // First, deal damage to self
  newState = dealDamage(newState, currentPlayer, 'hero', damageAmount);
  
  
  // Then apply buff effect if specified
  if (effect.buffAttack || effect.buffHealth || effect.grantKeywords) {
    // Apply buff to all friendly minions
    for (const minion of playerState.battlefield) {
      if (effect.buffAttack) {
        if (minion.card.attack !== undefined) {
          minion.card.attack += effect.buffAttack;
        }
      }
      
      if (effect.buffHealth) {
        if (minion.currentHealth !== undefined && minion.card.health !== undefined) {
          minion.card.health += effect.buffHealth;
          minion.currentHealth += effect.buffHealth;
        }
      }
      
      if (effect.grantKeywords && effect.grantKeywords.length > 0) {
        if (!minion.card.keywords) {
          minion.card.keywords = [];
        }
        for (const keyword of effect.grantKeywords) {
          if (!minion.card.keywords.includes(keyword)) {
            minion.card.keywords.push(keyword);
          }
        }
      }
    }
  }
  
  return newState;
}

/**
 * Execute sacrifice spell effect - destroys a friendly minion
 */
function executeSacrificeSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Sacrifice spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Find and destroy the target minion from friendly battlefield
  let sacrificedMinion: CardInstance | null = null;
  const minionIdx = playerState.battlefield.findIndex(m => m.instanceId === targetId);
  
  if (minionIdx !== -1) {
    sacrificedMinion = playerState.battlefield[minionIdx];
    playerState.battlefield.splice(minionIdx, 1);
    playerState.graveyard = [...(playerState.graveyard || []), sacrificedMinion];
  } else {
    console.error('Target minion not found in friendly battlefield');
    return state;
  }
  
  return newState;
}

/**
 * Execute sacrifice_and_aoe_damage spell effect - sacrifices a minion to deal AoE damage
 */
function executeSacrificeAndAoEDamageSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Sacrifice and AoE damage spell requires a target');
    return state;
  }
  
  if (!effect.value && !effect.damageBasedOnSacrifice) {
    console.error('Sacrifice and AoE damage spell missing damage value or flag');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Find the target minion
  let sacrificedMinion: CardInstance | null = null;
  const minionIdx = playerState.battlefield.findIndex(m => m.instanceId === targetId);
  
  if (minionIdx === -1) {
    console.error('Target minion not found in friendly battlefield');
    return state;
  }
  
  sacrificedMinion = playerState.battlefield[minionIdx];
  
  // Determine damage amount
  let damageAmount = effect.value || 0;
  
  if (effect.damageBasedOnSacrifice) {
    if (effect.damageBasedOnSacrifice === 'attack') {
      damageAmount = sacrificedMinion.card.attack || 0;
    } else if (effect.damageBasedOnSacrifice === 'health') {
      damageAmount = sacrificedMinion.card.health || 0;
    } else if (effect.damageBasedOnSacrifice === 'total_stats') {
      damageAmount = (sacrificedMinion.card.attack || 0) + (sacrificedMinion.card.health || 0);
    }
  }
  
  
  // Remove minion from battlefield and add to graveyard
  playerState.battlefield.splice(minionIdx, 1);
  playerState.graveyard = [...(playerState.graveyard || []), sacrificedMinion];
  
  // Apply AoE damage to enemy minions
  const aoeEffect: SpellEffect = {
    type: 'aoe_damage',
    value: damageAmount,
    targetType: 'all_enemy_minions'
  };
  
  return executeAoEDamageSpell(newState, aoeEffect);
}

/**
 * Execute return_to_hand_next_turn spell effect - sets up a minion to return to hand next turn
 */
function executeReturnToHandNextTurnSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Return to hand next turn spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Find the target minion
  let targetFound = false;
  
  // Check player's battlefield
  for (const minion of player.battlefield) {
    if (minion.instanceId === targetId) {
      targetFound = true;
      // Mark the minion as returning next turn
      minion.returnsToHandNextTurn = true;
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's
  if (!targetFound) {
    for (const minion of opponent.battlefield) {
      if (minion.instanceId === targetId) {
        targetFound = true;
        // Mark the minion as returning next turn
        minion.returnsToHandNextTurn = true;
        break;
      }
    }
  }
  
  if (!targetFound) {
    console.error('Target minion not found for return to hand next turn spell');
    return state;
  }
  
  return newState;
}

/**
 * Execute transform_random spell effect - transforms a random minion
 */
function executeTransformRandomSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  
  // Get the opponent's battlefield (we transform one of their minions)
  const opponentState = currentPlayer === 'player' ? newState.players.opponent : newState.players.player;
  
  if (opponentState.battlefield.length === 0) {
    return newState;
  }
  
  // Pick a random minion to transform
  const randomIdx = Math.floor(Math.random() * opponentState.battlefield.length);
  const targetMinion = opponentState.battlefield[randomIdx];
  
  // Create a default sheep transformation
  const transformedCard: CardData = {
    id: 9999,
    name: "Sheep",
    type: 'minion',
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "This minion was transformed into a sheep.",
    rarity: 'common',
    keywords: []
  };
  
  // Apply transform
  const transformedInstance: CardInstance = {
    instanceId: targetMinion.instanceId,
    card: transformedCard,
    currentHealth: 1,
    canAttack: false,
    isPlayed: true,
    isSummoningSick: true,
    attacksPerformed: 0
  };
  
  opponentState.battlefield[randomIdx] = transformedInstance;
  
  return newState;
}

/**
 * Execute transform_copy spell effect - transforms a minion into a copy of another minion
 */
function executeTransformCopySpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId || !effect.transformTargetId) {
    console.error('Transform copy spell requires both target ID and transform target ID');
    return state;
  }
  
  let newState = { ...state };
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  
  // Find the minion to copy from (the source)
  let sourceMinion: CardInstance | null = null;
  for (const minion of player.battlefield.concat(opponent.battlefield)) {
    if (minion.instanceId === effect.transformTargetId) {
      sourceMinion = minion;
      break;
    }
  }
  
  if (!sourceMinion) {
    console.error(`Source minion ${effect.transformTargetId} not found`);
    return state;
  }
  
  // Find the target minion to be transformed
  let targetFound = false;
  
  // Check player's battlefield
  const playerBattlefield = [...player.battlefield];
  for (let i = 0; i < playerBattlefield.length; i++) {
    if (playerBattlefield[i].instanceId === targetId) {
      targetFound = true;
      const target = playerBattlefield[i];
      const originalName = target.card.name;
      
      // Transform into a copy
      target.card = { ...sourceMinion.card };
      target.currentHealth = sourceMinion.card.health || 1;
      target.canAttack = false;
      target.isSummoningSick = true;
      
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's
  if (!targetFound) {
    const opponentBattlefield = [...opponent.battlefield];
    for (let i = 0; i < opponentBattlefield.length; i++) {
      if (opponentBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = opponentBattlefield[i];
        const originalName = target.card.name;
        
        // Transform into a copy
        target.card = { ...sourceMinion.card };
        target.currentHealth = sourceMinion.card.health || 1;
        target.canAttack = false;
        target.isSummoningSick = true;
        
        break;
      }
    }
    
    newState.players.opponent.battlefield = opponentBattlefield;
  }
  
  newState.players.player.battlefield = playerBattlefield;
  
  return newState;
}

/**
 * Execute transform_random_in_hand spell effect - transforms a random card in hand
 */
function executeTransformRandomInHandSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  if (playerState.hand.length === 0) {
    return newState;
  }
  
  // Pick a random card from hand
  const randomIdx = Math.floor(Math.random() * playerState.hand.length);
  const cardToTransform = playerState.hand[randomIdx];
  
  // Create a transformation card
  const transformCard: CardData = {
    id: 9998,
    name: "Transformed Card",
    type: cardToTransform.card.type,
    manaCost: effect.transformManaCost || 1,
    attack: effect.transformAttack || 1,
    health: effect.transformHealth || 1,
    description: "This card was transformed.",
    rarity: 'common',
    keywords: []
  };
  
  // Replace the card
  cardToTransform.card = transformCard;
  
  return newState;
}

/**
 * Execute transform_and_silence spell effect - transforms and silences a minion
 */
function executeTransformAndSilenceSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Transform and silence spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  
  // First transform the minion
  const transformedCard: CardData = {
    id: 9999,
    name: "Sheep",
    type: 'minion',
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "This minion was transformed and silenced.",
    rarity: 'common',
    keywords: []
  };
  
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  let targetFound = false;
  
  // Check player's battlefield
  const playerBattlefield = [...player.battlefield];
  for (let i = 0; i < playerBattlefield.length; i++) {
    if (playerBattlefield[i].instanceId === targetId) {
      targetFound = true;
      const target = playerBattlefield[i];
      
      // Transform
      target.card = transformedCard;
      target.currentHealth = 1;
      target.canAttack = false;
      target.isSummoningSick = true;
      
      // Silence
      target.isSilenced = true;
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's
  if (!targetFound) {
    const opponentBattlefield = [...opponent.battlefield];
    for (let i = 0; i < opponentBattlefield.length; i++) {
      if (opponentBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = opponentBattlefield[i];
        
        // Transform
        target.card = transformedCard;
        target.currentHealth = 1;
        target.canAttack = false;
        target.isSummoningSick = true;
        
        // Silence
        target.isSilenced = true;
        break;
      }
    }
    
    newState.players.opponent.battlefield = opponentBattlefield;
  }
  
  newState.players.player.battlefield = playerBattlefield;
  
  return newState;
}

/**
 * Execute transform_deck spell effect - transforms cards in the deck
 */
function executeTransformDeckSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  if (playerState.deck.length === 0) {
    return newState;
  }
  
  // Transform cards in deck based on effect parameters
  const cardsToTransform = Math.min(effect.count || playerState.deck.length, playerState.deck.length);
  
  for (let i = 0; i < cardsToTransform && i < playerState.deck.length; i++) {
    const card = playerState.deck[i];
    
    // Create transformed card
    const transformedCard: CardData = {
      ...card.card,
      id: 9997 + i,
      name: `${card.card.name} (Transformed)`,
      attack: effect.transformAttack || card.card.attack || 1,
      health: effect.transformHealth || card.card.health || 1
    };
    
    card.card = transformedCard;
  }
  
  
  return newState;
}

/**
 * Execute transform_copy_from_deck spell effect - transforms a minion into a copy from deck
 */
function executeTransformCopyFromDeckSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Transform copy from deck spell requires a target');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Get a random card from deck
  if (playerState.deck.length === 0) {
    return newState;
  }
  
  const randomDeckCardIdx = Math.floor(Math.random() * playerState.deck.length);
  const deckCard = playerState.deck[randomDeckCardIdx];
  
  // Find and transform the target minion
  const player = newState.players.player;
  const opponent = newState.players.opponent;
  let targetFound = false;
  
  // Check player's battlefield
  const playerBattlefield = [...player.battlefield];
  for (let i = 0; i < playerBattlefield.length; i++) {
    if (playerBattlefield[i].instanceId === targetId) {
      targetFound = true;
      const target = playerBattlefield[i];
      const originalName = target.card.name;
      
      // Transform into copy of deck card
      target.card = { ...deckCard.card };
      target.currentHealth = deckCard.card.health || 1;
      target.canAttack = false;
      target.isSummoningSick = true;
      
      break;
    }
  }
  
  // If not found on player's battlefield, check opponent's
  if (!targetFound) {
    const opponentBattlefield = [...opponent.battlefield];
    for (let i = 0; i < opponentBattlefield.length; i++) {
      if (opponentBattlefield[i].instanceId === targetId) {
        targetFound = true;
        const target = opponentBattlefield[i];
        const originalName = target.card.name;
        
        // Transform into copy of deck card
        target.card = { ...deckCard.card };
        target.currentHealth = deckCard.card.health || 1;
        target.canAttack = false;
        target.isSummoningSick = true;
        
        break;
      }
    }
    
    newState.players.opponent.battlefield = opponentBattlefield;
  }
  
  newState.players.player.battlefield = playerBattlefield;
  
  return newState;
}

/**
 * Execute transform_healing_to_damage spell effect - switches healing to damage (Auchenai-like)
 */
function executeTransformHealingToDamageSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Set flag to convert healing to damage
  playerState.healingToDamage = true;
  
  // Set duration if provided
  if (effect.duration) {
    playerState.healingToDamageTurns = effect.duration;
  } else {
    // Default to rest of game if no duration specified
    playerState.healingToDamageTurns = 100;
  }
  
  
  return newState;
}

/**
 * Execute split_damage spell effect - splits damage among targets
 */
function executeSplitDamageSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Split damage spell missing damage value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const enemyState = currentPlayer === 'player' ? newState.players.opponent : newState.players.player;
  const totalTargets = enemyState.battlefield.length;
  
  if (totalTargets === 0) {
    return newState;
  }
  
  // Calculate damage per minion
  const damagePerTarget = Math.floor(effect.value / totalTargets);
  const remainingDamage = effect.value % totalTargets;
  
  
  // Apply damage to each minion
  for (let i = 0; i < enemyState.battlefield.length; i++) {
    const minion = enemyState.battlefield[i];
    
    // Apply base damage
    let damage = damagePerTarget;
    // Distribute remaining damage starting from first minion
    if (i < remainingDamage) {
      damage += 1;
    }
    
    if (minion.currentHealth !== undefined) {
      // Check for Divine Shield
      if (minion.hasDivineShield) {
        minion.hasDivineShield = false;
      } else {
        minion.currentHealth -= damage;
      }
    }
  }
  
  // Remove destroyed minions
  const survivors: CardInstance[] = [];
  const graveyard = enemyState.graveyard || [];
  
  for (const minion of enemyState.battlefield) {
    if (minion.currentHealth !== undefined && minion.currentHealth <= 0) {
      graveyard.push(minion);
    } else {
      survivors.push(minion);
    }
  }
  
  enemyState.battlefield = survivors;
  enemyState.graveyard = graveyard;
  
  return newState;
}

/**
 * Execute swap_decks spell effect - swaps decks with opponent
 */
function executeSwapDecksSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  
  // Swap the decks
  const tempDeck = newState.players.player.deck;
  newState.players.player.deck = newState.players.opponent.deck;
  newState.players.opponent.deck = tempDeck;
  
  
  return newState;
}

/**
 * Execute swap_hero_power spell effect - swaps hero powers with opponent
 */
function executeSwapHeroPowerSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  
  // Swap the hero powers
  const tempHeroPower = newState.players.player.heroPower;
  newState.players.player.heroPower = newState.players.opponent.heroPower;
  newState.players.opponent.heroPower = tempHeroPower;
  
  // Reset hero power usage for current turn if applicable
  if (effect.resetUsage) {
    newState.players.player.heroPowerUsed = false;
    newState.players.opponent.heroPowerUsed = false;
  }
  
  
  return newState;
}

/**
 * Execute reduce_deck_cost spell effect - reduce mana cost of cards in deck
 */
function executeReduceDeckCostSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Reduce deck cost spell missing cost reduction value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  const costReduction = effect.value;
  const cardsToReduce = effect.count || playerState.deck.length;
  
  // Apply cost reduction to cards in deck
  for (let i = 0; i < Math.min(cardsToReduce, playerState.deck.length); i++) {
    const card = playerState.deck[i].card;
    card.manaCost = Math.max(0, card.manaCost - costReduction);
  }
  
  
  return newState;
}

/**
 * Execute reduce_next_spell_cost spell effect - make next spell cast cheaper
 */
function executeReduceNextSpellCostSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Reduce next spell cost spell missing cost reduction value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Store the cost reduction for next spell
  playerState.nextSpellCostReduction = (playerState.nextSpellCostReduction || 0) + effect.value;
  playerState.nextSpellCostReductionCount = (playerState.nextSpellCostReductionCount || 1);
  
  
  return newState;
}

/**
 * Execute reduce_opponent_mana spell effect - reduce opponent's current mana
 */
function executeReduceOpponentManaSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Reduce opponent mana spell missing mana reduction value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const opponentState = currentPlayer === 'player' ? newState.players.opponent : newState.players.player;
  
  const manaReduction = effect.value;
  opponentState.mana.current = Math.max(0, opponentState.mana.current - manaReduction);
  
  
  return newState;
}

/**
 * Execute reduce_spell_cost spell effect - reduce spell costs
 */
function executeReduceSpellCostSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Reduce spell cost spell missing cost reduction value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  const costReduction = effect.value;
  
  // Apply cost reduction to all spells in hand
  for (const card of playerState.hand) {
    if (card.card.type === 'spell') {
      card.card.manaCost = Math.max(0, card.card.manaCost - costReduction);
    }
  }
  
  
  return newState;
}

/**
 * Execute replace_hero_power spell effect - replace current hero power
 */
function executeReplaceHeroPowerSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.heroPowerId && !effect.heroPower) {
    console.error('Replace hero power spell missing hero power data');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Get the new hero power from the effect or from card data
  const newHeroPower = effect.heroPower || { 
    id: effect.heroPowerId || 0,
    name: 'New Power',
    description: 'Replacement hero power',
    cost: effect.heroPowerCost || 2,
    effect: effect.heroPowerEffect
  };
  
  playerState.heroPower = newHeroPower;
  playerState.heroPowerUsed = false;
  
  
  return newState;
}

/**
 * Execute replay_battlecries spell effect - replay battlecry effects of minions
 */
function executeReplayBattlecriesSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Find minions with battlecry effects on battlefield
  const minionsWithBattlecry = playerState.battlefield.filter(minion => 
    minion.card.keywords && minion.card.keywords.includes('battlecry')
  );
  
  
  // Execute battlecry for each minion (placeholder implementation)
  for (const minion of minionsWithBattlecry) {
    if (minion.card.battlecryEffect) {
      // Actual battlecry execution would be handled by executeBattlecry function
      newState = executeBattlecry(newState, minion.card.battlecryEffect, minion);
    }
  }
  
  return newState;
}

/**
 * Execute replay_spells spell effect - replay spells cast this game
 */
function executeReplaySpellsSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  
  // This is a placeholder implementation
  // In a real implementation, you would track spells cast in game history and re-execute them
  // For now, we'll just log the action
  
  const spellCount = effect.count || 1;
  
  
  return newState;
}

/**
 * Execute random_damage_and_buff spell effect - deal random damage and gain buff
 */
function executeRandomDamageAndBuffSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Random damage and buff spell missing damage value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  const enemyState = currentPlayer === 'player' ? newState.players.opponent : newState.players.player;
  
  // Deal random damage to a random enemy minion
  if (enemyState.battlefield.length > 0) {
    const randomTarget = enemyState.battlefield[Math.floor(Math.random() * enemyState.battlefield.length)];
    const damage = effect.value;
    
    if (randomTarget.currentHealth !== undefined) {
      randomTarget.currentHealth -= damage;
      
      if (randomTarget.currentHealth <= 0) {
        const survivors = enemyState.battlefield.filter(m => m.instanceId !== randomTarget.instanceId);
        enemyState.battlefield = survivors;
      }
    }
  }
  
  // Apply buff to current player's minions
  if (effect.buffAttack || effect.buffHealth) {
    for (const minion of playerState.battlefield) {
      if (effect.buffAttack && minion.card.attack !== undefined) {
        minion.card.attack += effect.buffAttack;
      }
      if (effect.buffHealth && minion.currentHealth !== undefined) {
        minion.currentHealth += effect.buffHealth;
        minion.card.health = (minion.card.health || 0) + effect.buffHealth;
      }
    }
  }
  
  return newState;
}

/**
 * Execute random_damage_with_self_damage spell effect - deal damage with self harm
 */
function executeRandomDamageWithSelfDamageSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  if (!effect.value) {
    console.error('Random damage with self damage spell missing damage value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  const enemyState = currentPlayer === 'player' ? newState.players.opponent : newState.players.player;
  
  const damage = effect.value;
  
  // Deal random damage to a random enemy minion
  if (enemyState.battlefield.length > 0) {
    const randomTarget = enemyState.battlefield[Math.floor(Math.random() * enemyState.battlefield.length)];
    
    if (randomTarget.currentHealth !== undefined) {
      randomTarget.currentHealth -= damage;
      
      if (randomTarget.currentHealth <= 0) {
        const survivors = enemyState.battlefield.filter(m => m.instanceId !== randomTarget.instanceId);
        enemyState.battlefield = survivors;
      }
    }
  } else {
    // Damage enemy hero if no minions
    enemyState.health = Math.max(0, (enemyState.health || 30) - damage);
  }
  
  // Deal self damage
  const selfDamage = effect.selfDamage || damage;
  playerState.health = Math.max(0, (playerState.health || 30) - selfDamage);
  
  return newState;
}

/**
 * Execute random_weapon spell effect - equip a random weapon
 */
function executeRandomWeaponSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // Create a random weapon
  const weaponAttack = effect.attack || Math.floor(Math.random() * 5) + 1; // 1-5 attack
  const weaponDurability = effect.durability || Math.floor(Math.random() * 3) + 1; // 1-3 durability
  
  const randomWeapon = {
    id: Math.floor(Math.random() * 10000),
    name: `Random ${['Battle', 'War', 'Steel', 'Frost', 'Fire'][Math.floor(Math.random() * 5)]} Axe`,
    type: 'weapon' as const,
    attack: weaponAttack,
    durability: weaponDurability,
    description: 'A random weapon'
  };
  
  playerState.weapon = randomWeapon;
  
  
  return newState;
}

/**
 * Execute shuffle_copies spell effect - shuffle copies of a card into deck
 */
function executeShuffleCopiesSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!effect.count) {
    console.error('Shuffle copies spell missing count value');
    return state;
  }
  
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // If targetId is provided, find that card and shuffle copies
  if (targetId) {
    // Search for the card in hand
    const targetCardInHand = playerState.hand.find(c => c.instanceId === targetId);
    const targetCardInDeck = playerState.deck.find(c => c.instanceId === targetId);
    const targetCard = targetCardInHand || targetCardInDeck;
    
    if (targetCard) {
      // Shuffle copies into deck
      for (let i = 0; i < effect.count; i++) {
        const cardCopy: CardInstance = {
          ...targetCard,
          instanceId: uuidv4(),
          isPlayed: false
        };
        playerState.deck.push(cardCopy);
      }
    } else {
    }
  } else {
  }
  
  return newState;
}

/**
 * Execute shuffle_cards spell effect - shuffle specific cards into deck
 */
function executeShuffleCardsSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  // This is a placeholder implementation
  // Real implementation would shuffle cards based on effect.cardIds or effect.cardType
  
  if (effect.cardIds) {
    // Shuffle specific cards by ID
    for (const cardId of effect.cardIds) {
      const card = allCards.find(c => c.id === cardId);
      if (card) {
        const cardInstance: CardInstance = {
          card,
          instanceId: uuidv4(),
          isPlayed: false,
          attacksPerformed: 0,
          canAttack: false,
          currentHealth: card.health || 0,
          isSummoningSick: true
        };
        playerState.deck.push(cardInstance);
      }
    }
  } else if (effect.cardType) {
    // Shuffle random cards of a type
    const count = effect.count || 1;
    const cardsOfType = allCards.filter(c => c.type === effect.cardType);
    
    for (let i = 0; i < count && cardsOfType.length > 0; i++) {
      const randomCard = cardsOfType[Math.floor(Math.random() * cardsOfType.length)];
      const cardInstance: CardInstance = {
        card: randomCard,
        instanceId: uuidv4(),
        isPlayed: false,
        attacksPerformed: 0,
        canAttack: false,
        currentHealth: randomCard.health || 0,
        isSummoningSick: true
      };
      playerState.deck.push(cardInstance);
    }
  } else {
  }
  
  return newState;
}
/**
 * Execute mind control random spell - take control of a random enemy minion
 */
function executeMindControlRandomSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  const opponentState = currentPlayer === 'player' ? newState.players.opponent : newState.players.player;
  
  if (opponentState.battlefield.length === 0) {
    return newState;
  }
  
  if (playerState.battlefield.length >= 7) {
    return newState;
  }
  
  const randomIndex = Math.floor(Math.random() * opponentState.battlefield.length);
  const stolenMinion = opponentState.battlefield[randomIndex];
  
  opponentState.battlefield = [...opponentState.battlefield.slice(0, randomIndex), ...opponentState.battlefield.slice(randomIndex + 1)];
  playerState.battlefield = [...playerState.battlefield, { ...stolenMinion, canAttack: false, isSummoningSick: true }];
  
  return newState;
}

/**
 * Execute gain mana crystals spell - gain permanent mana crystals
 */
function executeGainManaCrystalsSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  const crystals = effect.value || 1;
  playerState.mana.max = Math.min(10, playerState.mana.max + crystals);
  playerState.mana.current = Math.min(playerState.mana.max, playerState.mana.current + crystals);
  
  return newState;
}

/**
 * Execute buff attack spell - buff only attack of a minion (supports both friendly and enemy targets)
 */
function executeBuffAttackSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) {
    console.error('Buff attack spell requires a target');
    return state;
  }
  
  const newState = { ...state };
  const buffAmount = effect.value || 0;
  
  // Check player battlefield first
  const playerTargetIndex = newState.players.player.battlefield.findIndex(m => m.instanceId === targetId);
  if (playerTargetIndex !== -1) {
    const targetMinion = newState.players.player.battlefield[playerTargetIndex];
    newState.players = {
      ...newState.players,
      player: {
        ...newState.players.player,
        battlefield: newState.players.player.battlefield.map((m, i) => 
          i === playerTargetIndex 
            ? { ...m, card: { ...m.card, attack: m.card.attack + buffAmount } }
            : m
        )
      }
    };
    return newState;
  }
  
  // Check opponent battlefield
  const opponentTargetIndex = newState.players.opponent.battlefield.findIndex(m => m.instanceId === targetId);
  if (opponentTargetIndex !== -1) {
    const targetMinion = newState.players.opponent.battlefield[opponentTargetIndex];
    newState.players = {
      ...newState.players,
      opponent: {
        ...newState.players.opponent,
        battlefield: newState.players.opponent.battlefield.map((m, i) => 
          i === opponentTargetIndex 
            ? { ...m, card: { ...m.card, attack: m.card.attack + buffAmount } }
            : m
        )
      }
    };
    return newState;
  }
  
  return newState;
}

/**
 * Execute summon from hand spell - summon a minion from hand to battlefield
 */
function executeSummonFromHandSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  if (playerState.battlefield.length >= 7) {
    return newState;
  }
  
  const minionsInHand = playerState.hand.filter(c => c.card.type === 'minion');
  if (minionsInHand.length === 0) {
    return newState;
  }
  
  const randomMinion = minionsInHand[Math.floor(Math.random() * minionsInHand.length)];
  playerState.hand = playerState.hand.filter(c => c.instanceId !== randomMinion.instanceId);
  playerState.battlefield = [...playerState.battlefield, { ...randomMinion, canAttack: false, isSummoningSick: true }];
  
  return newState;
}

/**
 * Execute buff tribe spell - buff all minions of a specific tribe
 */
function executeBuffTribeSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  const tribe = effect.tribe || effect.race;
  if (!tribe) {
    return newState;
  }
  
  playerState.battlefield = playerState.battlefield.map(minion => {
    if (minion.card.race === tribe || minion.card.tribe === tribe) {
      return {
        ...minion,
        card: {
          ...minion.card,
          attack: minion.card.attack + (effect.attack || effect.value || 0),
          health: minion.card.health + (effect.health || 0)
        },
        currentHealth: minion.currentHealth + (effect.health || 0)
      };
    }
    return minion;
  });
  
  return newState;
}

/**
 * Execute buff self spell - buff the minion that cast this effect (immutable)
 */
function executeBuffSelfSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  if (!targetId) return state;
  
  const newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const attackBuff = effect.attack || effect.value || 0;
  const healthBuff = effect.health || 0;
  
  if (currentPlayer === 'player') {
    const targetIndex = newState.players.player.battlefield.findIndex(m => m.instanceId === targetId);
    if (targetIndex !== -1) {
      const minion = newState.players.player.battlefield[targetIndex];
      newState.players = {
        ...newState.players,
        player: {
          ...newState.players.player,
          battlefield: newState.players.player.battlefield.map((m, i) =>
            i === targetIndex
              ? {
                  ...m,
                  card: { ...m.card, attack: m.card.attack + attackBuff, health: m.card.health + healthBuff },
                  currentHealth: m.currentHealth + healthBuff
                }
              : m
          )
        }
      };
    }
  } else {
    const targetIndex = newState.players.opponent.battlefield.findIndex(m => m.instanceId === targetId);
    if (targetIndex !== -1) {
      const minion = newState.players.opponent.battlefield[targetIndex];
      newState.players = {
        ...newState.players,
        opponent: {
          ...newState.players.opponent,
          battlefield: newState.players.opponent.battlefield.map((m, i) =>
            i === targetIndex
              ? {
                  ...m,
                  card: { ...m.card, attack: m.card.attack + attackBuff, health: m.card.health + healthBuff },
                  currentHealth: m.currentHealth + healthBuff
                }
              : m
          )
        }
      };
    }
  }
  
  return newState;
}

/**
 * Execute conditional self buff spell
 */
function executeConditionalSelfBuffSpell(
  state: GameState,
  effect: SpellEffect,
  targetId?: string
): GameState {
  return executeBuffSelfSpell(state, effect, targetId);
}

/**
 * Execute steal card spell - steal a card from opponent's hand
 */
function executeStealCardSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  const opponentState = currentPlayer === 'player' ? newState.players.opponent : newState.players.player;
  
  if (opponentState.hand.length === 0) {
    return newState;
  }
  
  if (playerState.hand.length >= 10) {
    return newState;
  }
  
  const randomIndex = Math.floor(Math.random() * opponentState.hand.length);
  const stolenCard = opponentState.hand[randomIndex];
  
  opponentState.hand = [...opponentState.hand.slice(0, randomIndex), ...opponentState.hand.slice(randomIndex + 1)];
  playerState.hand = [...playerState.hand, stolenCard];
  
  return newState;
}

/**
 * Execute buff damaged minions spell
 */
function executeBuffDamagedMinionsSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  playerState.battlefield = playerState.battlefield.map(minion => {
    if (minion.currentHealth < minion.card.health) {
      return {
        ...minion,
        card: {
          ...minion.card,
          attack: minion.card.attack + (effect.attack || effect.value || 0),
          health: minion.card.health + (effect.health || 0)
        },
        currentHealth: minion.currentHealth + (effect.health || 0)
      };
    }
    return minion;
  });
  
  return newState;
}

/**
 * Execute AoE heal spell - heal all friendly minions
 */
function executeAoEHealSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  const healAmount = effect.value || 0;
  
  playerState.battlefield = playerState.battlefield.map(minion => ({
    ...minion,
    currentHealth: Math.min(minion.card.health, minion.currentHealth + healAmount)
  }));
  
  return newState;
}

/**
 * Execute gain armor spell
 */
function executeGainArmorSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  let newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  const playerState = currentPlayer === 'player' ? newState.players.player : newState.players.opponent;
  
  const armorAmount = effect.value || 0;
  playerState.armor = (playerState.armor || 0) + armorAmount;
  
  return newState;
}

/**
 * Execute gain armor and immunity spell - gain armor and grant immunity
 */
function executeGainArmorAndImmunitySpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  const newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  
  // Clone player state to avoid mutation
  if (currentPlayer === 'player') {
    newState.players = {
      ...newState.players,
      player: {
        ...newState.players.player,
        armor: (newState.players.player.armor || 0) + (effect.value || 0),
        isImmune: true
      }
    };
  } else {
    newState.players = {
      ...newState.players,
      opponent: {
        ...newState.players.opponent,
        armor: (newState.players.opponent.armor || 0) + (effect.value || 0),
        isImmune: true
      }
    };
  }
  
  return newState;
}

/**
 * Execute gain armor and lifesteal spell - gain armor and grant lifesteal to hero
 */
function executeGainArmorAndLifestealSpell(
  state: GameState,
  effect: SpellEffect
): GameState {
  const newState = { ...state };
  const currentPlayer = state.currentTurn || 'player';
  
  // Clone player state to avoid mutation
  if (currentPlayer === 'player') {
    newState.players = {
      ...newState.players,
      player: {
        ...newState.players.player,
        armor: (newState.players.player.armor || 0) + (effect.value || 0),
        hasLifesteal: true
      }
    };
  } else {
    newState.players = {
      ...newState.players,
      opponent: {
        ...newState.players.opponent,
        armor: (newState.players.opponent.armor || 0) + (effect.value || 0),
        hasLifesteal: true
      }
    };
  }
  
  return newState;
}
