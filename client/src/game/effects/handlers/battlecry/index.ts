/**
 * Battlecry Handlers Index
 * 
 * This file exports all battlecry handlers for registration with the EffectRegistry
 */
import executeDiscoverTriclassDiscoverTriclass from './discover_triclassHandler';
import executeReturnReturn from './returnHandler';
import executeShuffleSpecialShuffleSpecial from './shuffle_specialHandler';
import executeOpponentSummonFromHandOpponentSummonFromHand from './opponent_summon_from_handHandler';
import executeChangeHeroPowerChangeHeroPower from './change_hero_powerHandler';
import executeWeaponAttackBuffWeaponAttackBuff from './weapon_attack_buffHandler';
import executeWeaponDurabilityDamageWeaponDurabilityDamage from './weapon_durability_damageHandler';
import executeSetManaSetMana from './set_manaHandler';
import executeDestroySpellsDestroySpells from './destroy_spellsHandler';
import executeDestroySecretsDestroySecrets from './destroy_secretsHandler';
import executeDestroyTribeDestroyTribe from './destroy_tribeHandler';
import executeMindControlRandomMindControlRandom from './mind_control_randomHandler';
import executeDestroyWeaponDestroyWeapon from './destroy_weaponHandler';
import executeHealthPerCardHealthPerCard from './health_per_cardHandler';
import executeAdaptAdapt from './adaptHandler';
import executeSummonFromSpellCostSummonFromSpellCost from './summon_from_spell_costHandler';
import executeDestroyAndStoreDestroyAndStore from './destroy_and_storeHandler';
import executeSwapStatsSwapStats from './swap_statsHandler';
import executeDestroySpellsByCostDestroySpellsByCost from './destroy_spells_by_costHandler';
import executeLimitAttackTargetLimitAttackTarget from './limit_attack_targetHandler';
import executeDestroyWeaponGainArmorDestroyWeaponGainArmor from './destroy_weapon_gain_armorHandler';
import executeDivineShieldGainDivineShieldGain from './divine_shield_gainHandler';
import executeShuffleCardShuffleCard from './shuffle_cardHandler';
import executeConditionalDamageConditionalDamage from './conditional_damageHandler';
import executeConditionalDiscoverConditionalDiscover from './conditional_discoverHandler';
import executeConditionalDrawConditionalDraw from './conditional_drawHandler';
import executeSwapStatsWithTargetSwapStatsWithTarget from './swap_stats_with_targetHandler';
import executeTransformCopyFromDeckTransformCopyFromDeck from './transform_copy_from_deckHandler';
import executeReplaySpellsReplaySpells from './replay_spellsHandler';
import executeExtraTurnsExtraTurns from './extra_turnsHandler';
import executeDrawMultipleDrawMultiple from './draw_multipleHandler';
import executeAddCardAddCard from './add_cardHandler';
import executeBuffWeaponBuffWeapon from './buff_weaponHandler';
import executeDrawUntilDrawUntil from './draw_untilHandler';
import executeCopyToHandCopyToHand from './copy_to_handHandler';
import executeDrawSpecificDrawSpecific from './draw_specificHandler';
import executeReorderDeckReorderDeck from './reorder_deckHandler';
import executeWheelOfYoggWheelOfYogg from './wheel_of_yoggHandler';
import executeEatOpponentCardEatOpponentCard from './eat_opponent_cardHandler';
import executeTransformDeckTransformDeck from './transform_deckHandler';
import executeTransformAndSilenceTransformAndSilence from './transform_and_silenceHandler';
import executeRandomDamageAndBuffRandomDamageAndBuff from './random_damage_and_buffHandler';
import executeSummonJadeGolemSummonJadeGolem from './summon_jade_golemHandler';
import executeReplayBattlecriesReplayBattlecries from './replay_battlecriesHandler';
import executeSummonCopyFromDeckSummonCopyFromDeck from './summon_copy_from_deckHandler';
import executeSummonCopySummonCopy from './summon_copyHandler';
import executeDrawByTypeDrawByType from './draw_by_typeHandler';
import executeFillBoardFillBoard from './fill_boardHandler';
import executeGiveCardsGiveCards from './give_cardsHandler';
import executeSwapDecksSwapDecks from './swap_decksHandler';
import executeTransformRandomTransformRandom from './transform_randomHandler';
import executeDestroyAndStealDestroyAndSteal from './destroy_and_stealHandler';
import executePersistentEffectPersistentEffect from './persistent_effectHandler';
import executeSetStatsSetStats from './set_statsHandler';
import executeTransformCopyTransformCopy from './transform_copyHandler';
import executeBuffDeckBuffDeck from './buff_deckHandler';
import executeGainKeywordGainKeyword from './gain_keywordHandler';
import executeReplaceSpellsReplaceSpells from './replace_spellsHandler';
import executeRandomWeaponRandomWeapon from './random_weaponHandler';
import executeReplaceHeroPowerReplaceHeroPower from './replace_hero_powerHandler';
import executeSwapWithDeckSwapWithDeck from './swap_with_deckHandler';
import executeBuffHandBuffHand from './buff_handHandler';
import executeDamageAndBuffDamageAndBuff from './damage_and_buffHandler';
import executeGiveDivineShieldGiveDivineShield from './give_divine_shieldHandler';
import executeEquipFrostmourneEquipFrostmourne from './equip_frostmourneHandler';
import executeBuffAndTauntBuffAndTaunt from './buff_and_tauntHandler';
import executeGrantStealthGrantStealth from './grant_stealthHandler';
import executeSummonRandomMinionsSummonRandomMinions from './summon_random_minionsHandler';
import executeConsumeAdjacentConsumeAdjacent from './consume_adjacentHandler';
import executeDestroyManaCrystalDestroyManaCrystal from './destroy_mana_crystalHandler';
import executeResurrectAllResurrectAll from './resurrect_allHandler';
import executeGrantPersistentEffectGrantPersistentEffect from './grant_persistent_effectHandler';
import executeSummonRandomSummonRandom from './summon_randomHandler';
import executeAlterManaAlterMana from './alter_manaHandler';
import executeGiveManaGiveMana from './give_manaHandler';
import executeBuffAdjacentBuffAdjacent from './buff_adjacentHandler';
import executeDestroyWeaponDrawDestroyWeaponDraw from './destroy_weapon_drawHandler';
import executeSummonSummon from './summonHandler';
import executeBuffBuff from './buffHandler';
import executeDamageDamage from './damageHandler';
import executeDiscoverDiscover from './discoverHandler';
import executeTransformTransform from './transformHandler';
import executeSetHealthSetHealth from './set_healthHandler';
import executeTransformCopyTransformCopy from './transform_copyHandler';
import executeShuffleCardShuffleCard from './shuffle_cardHandler';

// Necromancer specific handlers
import executeBuffFromGraveyardCountBuffFromGraveyardCount from './buffFromGraveyardCountHandler';
import executeDiscoverFromGraveyardDiscoverFromGraveyard from './discoverFromGraveyardHandler';
import executeSummonSkeletonsBasedOnGraveyardSummonSkeletonsBasedOnGraveyard from './summonSkeletonsBasedOnGraveyardHandler';

// Map of all battlecry handlers
const battlecryHandlers = {
  'discover_triclass': executeDiscoverTriclassDiscoverTriclass,
  'return': executeReturnReturn,
  'shuffle_special': executeShuffleSpecialShuffleSpecial,
  'opponent_summon_from_hand': executeOpponentSummonFromHandOpponentSummonFromHand,
  'change_hero_power': executeChangeHeroPowerChangeHeroPower,
  'weapon_attack_buff': executeWeaponAttackBuffWeaponAttackBuff,
  'weapon_durability_damage': executeWeaponDurabilityDamageWeaponDurabilityDamage,
  'set_mana': executeSetManaSetMana,
  'destroy_spells': executeDestroySpellsDestroySpells,
  'destroy_secrets': executeDestroySecretsDestroySecrets,
  'destroy_tribe': executeDestroyTribeDestroyTribe,
  'mind_control_random': executeMindControlRandomMindControlRandom,
  'destroy_weapon': executeDestroyWeaponDestroyWeapon,
  'health_per_card': executeHealthPerCardHealthPerCard,
  'adapt': executeAdaptAdapt,
  'summon_from_spell_cost': executeSummonFromSpellCostSummonFromSpellCost,
  'destroy_and_store': executeDestroyAndStoreDestroyAndStore,
  'swap_stats': executeSwapStatsSwapStats,
  'destroy_spells_by_cost': executeDestroySpellsByCostDestroySpellsByCost,
  'limit_attack_target': executeLimitAttackTargetLimitAttackTarget,
  'destroy_weapon_gain_armor': executeDestroyWeaponGainArmorDestroyWeaponGainArmor,
  'divine_shield_gain': executeDivineShieldGainDivineShieldGain,
  'shuffle_card': executeShuffleCardShuffleCard,
  'conditional_damage': executeConditionalDamageConditionalDamage,
  'conditional_discover': executeConditionalDiscoverConditionalDiscover,
  'conditional_draw': executeConditionalDrawConditionalDraw,
  'swap_stats_with_target': executeSwapStatsWithTargetSwapStatsWithTarget,
  'transform_copy_from_deck': executeTransformCopyFromDeckTransformCopyFromDeck,
  'replay_spells': executeReplaySpellsReplaySpells,
  'extra_turns': executeExtraTurnsExtraTurns,
  'draw_multiple': executeDrawMultipleDrawMultiple,
  'add_card': executeAddCardAddCard,
  'buff_weapon': executeBuffWeaponBuffWeapon,
  'draw_until': executeDrawUntilDrawUntil,
  'copy_to_hand': executeCopyToHandCopyToHand,
  'draw_specific': executeDrawSpecificDrawSpecific,
  'reorder_deck': executeReorderDeckReorderDeck,
  'wheel_of_yogg': executeWheelOfYoggWheelOfYogg,
  'eat_opponent_card': executeEatOpponentCardEatOpponentCard,
  'transform_deck': executeTransformDeckTransformDeck,
  'transform_and_silence': executeTransformAndSilenceTransformAndSilence,
  'random_damage_and_buff': executeRandomDamageAndBuffRandomDamageAndBuff,
  'summon_jade_golem': executeSummonJadeGolemSummonJadeGolem,
  'replay_battlecries': executeReplayBattlecriesReplayBattlecries,
  'summon_copy_from_deck': executeSummonCopyFromDeckSummonCopyFromDeck,
  'summon_copy': executeSummonCopySummonCopy,
  'draw_by_type': executeDrawByTypeDrawByType,
  'fill_board': executeFillBoardFillBoard,
  'give_cards': executeGiveCardsGiveCards,
  'swap_decks': executeSwapDecksSwapDecks,
  'transform_random': executeTransformRandomTransformRandom,
  'destroy_and_steal': executeDestroyAndStealDestroyAndSteal,
  'persistent_effect': executePersistentEffectPersistentEffect,
  'set_stats': executeSetStatsSetStats,
  'buff_deck': executeBuffDeckBuffDeck,
  'gain_keyword': executeGainKeywordGainKeyword,
  'replace_spells': executeReplaceSpellsReplaceSpells,
  'random_weapon': executeRandomWeaponRandomWeapon,
  'replace_hero_power': executeReplaceHeroPowerReplaceHeroPower,
  'swap_with_deck': executeSwapWithDeckSwapWithDeck,
  'buff_hand': executeBuffHandBuffHand,
  'damage_and_buff': executeDamageAndBuffDamageAndBuff,
  'give_divine_shield': executeGiveDivineShieldGiveDivineShield,
  'equip_frostmourne': executeEquipFrostmourneEquipFrostmourne,
  'buff_and_taunt': executeBuffAndTauntBuffAndTaunt,
  'grant_stealth': executeGrantStealthGrantStealth,
  'summon_random_minions': executeSummonRandomMinionsSummonRandomMinions,
  'consume_adjacent': executeConsumeAdjacentConsumeAdjacent,
  'destroy_mana_crystal': executeDestroyManaCrystalDestroyManaCrystal,
  'resurrect_all': executeResurrectAllResurrectAll,
  'grant_persistent_effect': executeGrantPersistentEffectGrantPersistentEffect,
  'summon_random': executeSummonRandomSummonRandom,
  'alter_mana': executeAlterManaAlterMana,
  'give_mana': executeGiveManaGiveMana,
  'buff_adjacent': executeBuffAdjacentBuffAdjacent,
  'destroy_weapon_draw': executeDestroyWeaponDrawDestroyWeaponDraw,
  'summon': executeSummonSummon,
  'buff': executeBuffBuff,
  'damage': executeDamageDamage,
  'discover': executeDiscoverDiscover,
  'transform': executeTransformTransform,
  'set_health': executeSetHealthSetHealth,
  'transform_copy': executeTransformCopyTransformCopy,
  
  // Necromancer specific handlers
  'buff_from_graveyard_count': executeBuffFromGraveyardCountBuffFromGraveyardCount,
  'discover_from_graveyard': executeDiscoverFromGraveyardDiscoverFromGraveyard,
  'summon_skeletons_based_on_graveyard': executeSummonSkeletonsBasedOnGraveyardSummonSkeletonsBasedOnGraveyard,
};

export default battlecryHandlers;
