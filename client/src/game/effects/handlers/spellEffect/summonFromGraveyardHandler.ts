/**
 * Summon From Graveyard Spell Effect Handler
 * 
 * This handler summons a random minion from the graveyard.
 * Used by Necromancer cards like Raise Dead.
 */
import { GameContext } from '../../../GameContext';
import { Card } from '../../../types/CardTypes';
import { SpellEffect } from '../../../types';
import { EffectResult } from '../../../types/EffectTypes';
import { getGraveyard, getRandomGraveyardMinion } from '../../../data/cardManagement/graveyardTracker';
import { getCardById } from '../../../data/cardManagement/cardRegistry';

/**
 * Execute a spell effect that summons a random minion from the graveyard
 */
function executeSummonFromGraveyardSummonFromGraveyard(
  context: GameContext, 
  effect: SpellEffect, 
  sourceCard: Card
): EffectResult {
  // Check if graveyard is empty
  if (getGraveyard().length === 0) {
    return { 
      success: false, 
      error: 'The graveyard is empty - no minions have died yet' 
    };
  }
  
  try {
    // Get a random minion from the graveyard
    const randomMinion = getRandomGraveyardMinion();
    
    if (!randomMinion) {
      return { 
        success: false, 
        error: 'No valid minion found in graveyard' 
      };
    }
    
    // Get the card by ID
    const cardToSummon = getCardById(randomMinion.id);
    
    if (!cardToSummon) {
      return { 
        success: false, 
        error: `Card with ID ${randomMinion.id} not found in registry` 
      };
    }
    
    // Check if there's space on the board
    if (context.getPlayerBattlefield()?.length >= 7) {
      return { 
        success: false, 
        error: 'No board space available to summon minion' 
      };
    }
    
    // Summon the minion
    context.summonMinion(cardToSummon, 'player');
    
    return { 
      success: true, 
      info: `Summoned ${randomMinion.name} from graveyard` 
    };
  } catch (error) {
    console.error('Error in summon_from_graveyard effect:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export default executeSummonFromGraveyardSummonFromGraveyard;