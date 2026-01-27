/**
 * SpellEffect Handlers Index
 * 
 * This file exports all spellEffect handlers for registration with the EffectRegistry
 */
import executeManaReductionManaReduction from './mana_reductionHandler';
import executeDestroyDestroy from './destroyHandler';
import executeTempManaTempMana from './temp_manaHandler';
import executeCustomCustom from './customHandler';
import executeTransformAllTransformAll from './transform_allHandler';
import executeDrawAndShuffleDrawAndShuffle from './draw_and_shuffleHandler';
import executeDamageAndBuffDamageAndBuff from './damage_and_buffHandler';
import executeCommandingShoutCommandingShout from './commanding_shoutHandler';
import executeDamageDrawIfSurvivesDamageDrawIfSurvives from './damage_draw_if_survivesHandler';
import executeDamageWithAdjacentDamageWithAdjacent from './damage_with_adjacentHandler';
import executeSummonRandomSummonRandom from './summon_randomHandler';
import executeBuffAndImmuneBuffAndImmune from './buff_and_immuneHandler';
import executeDestroyRandomDestroyRandom from './destroy_randomHandler';
import executeSetHealthSetHealth from './set_healthHandler';
import executeDiscoverFromDeckDiscoverFromDeck from './discover_from_deckHandler';
import executeDrawToMatchOpponentDrawToMatchOpponent from './draw_to_match_opponentHandler';
import executeBuffAttackBuffAttack from './buff_attackHandler';
import executeEnchantEnchant from './enchantHandler';
import executeGiveDivineShieldGiveDivineShield from './give_divine_shieldHandler';
import executeDeathCoilDeathCoil from './death_coilHandler';
import executeFreezeAndDamageFreezeAndDamage from './freeze_and_damageHandler';
import executeKillAndSummonKillAndSummon from './kill_and_summonHandler';
import executeDamageAndBuffWeaponDamageAndBuffWeapon from './damage_and_buff_weaponHandler';
import executeAoeWithOnKillAoeWithOnKill from './aoe_with_on_killHandler';
import executeGainArmorAndImmunityGainArmorAndImmunity from './gain_armor_and_immunityHandler';
import executeMindControlTemporaryMindControlTemporary from './mind_control_temporaryHandler';
import executeResurrectRandomResurrectRandom from './resurrect_randomHandler';
import executeBuffAndEnchantBuffAndEnchant from './buff_and_enchantHandler';
import executeGainArmorAndLifestealGainArmorAndLifesteal from './gain_armor_and_lifestealHandler';
import executeFreezeAdjacentFreezeAdjacent from './freeze_adjacentHandler';
import executeBuffAllWithDeathrattleBuffAllWithDeathrattle from './buff_all_with_deathrattleHandler';
import executeFreezeAndDrawFreezeAndDraw from './freeze_and_drawHandler';
import executeDamageBasedOnMissingHealthDamageBasedOnMissingHealth from './damage_based_on_missing_healthHandler';
import executeDoubleHealthDoubleHealth from './double_healthHandler';
import executeCopyFromOpponentCopyFromOpponent from './copy_from_opponentHandler';
import executeAttackEqualsHealthAttackEqualsHealth from './attack_equals_healthHandler';
import executeDamageAndHealDamageAndHeal from './damage_and_healHandler';
import executeSummonCopyFromDeckSummonCopyFromDeck from './summon_copy_from_deckHandler';
import executeSacrificeAndDamageSacrificeAndDamage from './sacrifice_and_damageHandler';
import executeDestroyDeckPortionDestroyDeckPortion from './destroy_deck_portionHandler';
import executeGainManaGainMana from './gain_manaHandler';
import executeGrantDeathrattleGrantDeathrattle from './grant_deathrattleHandler';
import executeBetrayalBetrayal from './betrayalHandler';
import executeReturnAllMinionsToHandReturnAllMinionsToHand from './return_all_minions_to_handHandler';
import executeCopyLastPlayedCardCopyLastPlayedCard from './copy_last_played_cardHandler';
import executeGrantImmunityGrantImmunity from './grant_immunityHandler';
import executeSwapHeroPowerSwapHeroPower from './swap_hero_powerHandler';
import executeConditionalFreezeOrDamageConditionalFreezeOrDamage from './conditional_freeze_or_damageHandler';
import executeBuffThenDestroyBuffThenDestroy from './buff_then_destroyHandler';
import executeDrawSpecificDrawSpecific from './draw_specificHandler';
import executeNextSpellCostsHealthNextSpellCostsHealth from './next_spell_costs_healthHandler';
import executeCopyToHandCopyToHand from './copy_to_handHandler';
import executeArmorArmor from './armorHandler';
import executeDamageDamage from './damageHandler';
import executeBuffBuff from './buffHandler';
import executeAoeDamageAoeDamage from './aoe_damageHandler';
import executeDiscoverDiscover from './discoverHandler';
import executeSummonSummon from './summonHandler';
import executeSummonFromGraveyardSummonFromGraveyard from './summonFromGraveyardHandler';

// Map of all spellEffect handlers
const spellEffectHandlers = {
  'mana_reduction': executeManaReductionManaReduction,
  'destroy': executeDestroyDestroy,
  'temp_mana': executeTempManaTempMana,
  'custom': executeCustomCustom,
  'transform_all': executeTransformAllTransformAll,
  'draw_and_shuffle': executeDrawAndShuffleDrawAndShuffle,
  'damage_and_buff': executeDamageAndBuffDamageAndBuff,
  'commanding_shout': executeCommandingShoutCommandingShout,
  'damage_draw_if_survives': executeDamageDrawIfSurvivesDamageDrawIfSurvives,
  'damage_with_adjacent': executeDamageWithAdjacentDamageWithAdjacent,
  'summon_random': executeSummonRandomSummonRandom,
  'buff_and_immune': executeBuffAndImmuneBuffAndImmune,
  'destroy_random': executeDestroyRandomDestroyRandom,
  'set_health': executeSetHealthSetHealth,
  'discover_from_deck': executeDiscoverFromDeckDiscoverFromDeck,
  'draw_to_match_opponent': executeDrawToMatchOpponentDrawToMatchOpponent,
  'buff_attack': executeBuffAttackBuffAttack,
  'enchant': executeEnchantEnchant,
  'give_divine_shield': executeGiveDivineShieldGiveDivineShield,
  'death_coil': executeDeathCoilDeathCoil,
  'freeze_and_damage': executeFreezeAndDamageFreezeAndDamage,
  'kill_and_summon': executeKillAndSummonKillAndSummon,
  'damage_and_buff_weapon': executeDamageAndBuffWeaponDamageAndBuffWeapon,
  'aoe_with_on_kill': executeAoeWithOnKillAoeWithOnKill,
  'gain_armor_and_immunity': executeGainArmorAndImmunityGainArmorAndImmunity,
  'mind_control_temporary': executeMindControlTemporaryMindControlTemporary,
  'resurrect_random': executeResurrectRandomResurrectRandom,
  'buff_and_enchant': executeBuffAndEnchantBuffAndEnchant,
  'gain_armor_and_lifesteal': executeGainArmorAndLifestealGainArmorAndLifesteal,
  'freeze_adjacent': executeFreezeAdjacentFreezeAdjacent,
  'buff_all_with_deathrattle': executeBuffAllWithDeathrattleBuffAllWithDeathrattle,
  'freeze_and_draw': executeFreezeAndDrawFreezeAndDraw,
  'damage_based_on_missing_health': executeDamageBasedOnMissingHealthDamageBasedOnMissingHealth,
  'double_health': executeDoubleHealthDoubleHealth,
  'copy_from_opponent': executeCopyFromOpponentCopyFromOpponent,
  'attack_equals_health': executeAttackEqualsHealthAttackEqualsHealth,
  'damage_and_heal': executeDamageAndHealDamageAndHeal,
  'summon_copy_from_deck': executeSummonCopyFromDeckSummonCopyFromDeck,
  'sacrifice_and_damage': executeSacrificeAndDamageSacrificeAndDamage,
  'destroy_deck_portion': executeDestroyDeckPortionDestroyDeckPortion,
  'gain_mana': executeGainManaGainMana,
  'grant_deathrattle': executeGrantDeathrattleGrantDeathrattle,
  'betrayal': executeBetrayalBetrayal,
  'return_all_minions_to_hand': executeReturnAllMinionsToHandReturnAllMinionsToHand,
  'copy_last_played_card': executeCopyLastPlayedCardCopyLastPlayedCard,
  'grant_immunity': executeGrantImmunityGrantImmunity,
  'swap_hero_power': executeSwapHeroPowerSwapHeroPower,
  'conditional_freeze_or_damage': executeConditionalFreezeOrDamageConditionalFreezeOrDamage,
  'buff_then_destroy': executeBuffThenDestroyBuffThenDestroy,
  'draw_specific': executeDrawSpecificDrawSpecific,
  'next_spell_costs_health': executeNextSpellCostsHealthNextSpellCostsHealth,
  'copy_to_hand': executeCopyToHandCopyToHand,
  'armor': executeArmorArmor,
  'damage': executeDamageDamage,
  'buff': executeBuffBuff,
  'aoe_damage': executeAoeDamageAoeDamage,
  'discover': executeDiscoverDiscover,
  'summon': executeSummonSummon,
  'summon_from_graveyard': executeSummonFromGraveyardSummonFromGraveyard,
};

export default spellEffectHandlers;
