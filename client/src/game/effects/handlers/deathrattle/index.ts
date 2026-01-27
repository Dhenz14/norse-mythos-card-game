/**
 * Deathrattle Handlers Index
 * 
 * This file exports all deathrattle handlers for registration with the EffectRegistry
 */
import executeSummonRandomSummonRandom from './summon_randomHandler';
import executeAddToHandAddToHand from './add_to_handHandler';
import executeSplitDamageSplitDamage from './split_damageHandler';
import executeAddCardAddCard from './add_cardHandler';
import executeSummonJadeGolemSummonJadeGolem from './summon_jade_golemHandler';
import executeShuffleShuffle from './shuffleHandler';
import executeDestroyDestroy from './destroyHandler';
import executeShuffleCardShuffleCard from './shuffle_cardHandler';
import executeResurrectResurrect from './resurrectHandler';
import executeSummonSummon from './summonHandler';
import executeDamageDamage from './damageHandler';
import executeDrawDraw from './drawHandler';
import executeHealHeal from './healHandler';
import executeBuffBuff from './buffHandler';
import executeSummonWithStatsSummonWithStats from './summon_with_statsHandler';
import executeSummonHighestCostFromGraveyardSummonHighestCostFromGraveyard from './summonHighestCostFromGraveyardHandler';

// Map of all deathrattle handlers
const deathrattleHandlers = {
  'summon_random': executeSummonRandomSummonRandom,
  'add_to_hand': executeAddToHandAddToHand,
  'split_damage': executeSplitDamageSplitDamage,
  'add_card': executeAddCardAddCard,
  'summon_jade_golem': executeSummonJadeGolemSummonJadeGolem,
  'shuffle': executeShuffleShuffle,
  'destroy': executeDestroyDestroy,
  'shuffle_card': executeShuffleCardShuffleCard,
  'resurrect': executeResurrectResurrect,
  'summon': executeSummonSummon,
  'damage': executeDamageDamage,
  'draw': executeDrawDraw,
  'heal': executeHealHeal,
  'buff': executeBuffBuff,
  'summon_with_stats': executeSummonWithStatsSummonWithStats,
  'summon_highest_cost_from_graveyard': executeSummonHighestCostFromGraveyardSummonHighestCostFromGraveyard,
};

export default deathrattleHandlers;
