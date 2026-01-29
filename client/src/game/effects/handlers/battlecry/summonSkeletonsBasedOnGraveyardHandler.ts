/**
 * Summon Skeletons Based On Graveyard Battlecry Handler
 * 
 * This handler summons skeleton minions based on the number of minions in the graveyard.
 * Used by Necromancer cards like Skeletal Lord.
 */
import { GameContext } from '../../../GameContext';
import { Card } from '../../../types/CardTypes';
import { BattlecryEffect } from '../../../types';
import { EffectResult } from '../../../types/EffectTypes';
import { getGraveyard } from '../../../data/cardManagement/graveyardTracker';
import { getCardById } from '../../../data/cardManagement/cardRegistry';

/**
 * Execute a battlecry that summons skeletons based on graveyard size
 */
function executeSummonSkeletonsBasedOnGraveyardSummonSkeletonsBasedOnGraveyard(
  context: GameContext, 
  effect: BattlecryEffect, 
  sourceCard: Card
): EffectResult {
  // Get the number of minions in the graveyard
  const graveyardSize = getGraveyard().length;
  
  // Maximum number of skeletons to summon
  const maxSkeletons = effect.value || 3;
  
  // Calculate how many skeletons to summon (limited by board space and max)
  const skeletonsToSummon = Math.min(
    graveyardSize,
    maxSkeletons,
    // Also limit by available board space
    7 - (context.getPlayerBattlefield()?.length || 0)
  );
  
  if (skeletonsToSummon <= 0) {
    return { 
      success: true, 
      info: 'No skeletons summoned - graveyard is empty or board is full' 
    };
  }
  
  try {
    // Get the skeleton card to summon
    const skeletonId = effect.summonCardId || 4900; // Default to the standard Skeleton token
    const skeletonCard = getCardById(skeletonId);
    
    if (!skeletonCard) {
      console.error(`Skeleton card with ID ${skeletonId} not found`);
      return { 
        success: false, 
        error: `Skeleton card with ID ${skeletonId} not found` 
      };
    }
    
    // Summon the skeletons
    for (let i = 0; i < skeletonsToSummon; i++) {
      context.summonMinion(skeletonCard, 'player');
    }
    
    return { 
      success: true, 
      info: `Summoned ${skeletonsToSummon} skeletons based on ${graveyardSize} minions in graveyard` 
    };
  } catch (error) {
    console.error('Error in summon_skeletons_based_on_graveyard effect:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export default executeSummonSkeletonsBasedOnGraveyardSummonSkeletonsBasedOnGraveyard;