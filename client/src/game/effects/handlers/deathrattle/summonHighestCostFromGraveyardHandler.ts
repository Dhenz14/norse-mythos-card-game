/**
 * Summon Highest Cost From Graveyard Deathrattle Handler
 * 
 * This handler finds the highest mana cost minion in the graveyard and summons it.
 * Used by Necromancer cards like Grave Pact.
 */
import { GameContext } from '../../../GameContext';
import { Card } from '../../../types/CardTypes';
import { DeathrattleEffect } from '../../../types';
import { EffectResult } from '../../../types/EffectTypes';
import { getGraveyard, GraveyardMinion } from '../../../data/cardManagement/graveyardTracker';
import { getCardById } from '../../../data/cardManagement/cardRegistry';

/**
 * Execute a deathrattle that summons the highest cost minion from the graveyard
 */
function executeSummonHighestCostFromGraveyardSummonHighestCostFromGraveyard(
  context: GameContext, 
  effect: DeathrattleEffect, 
  sourceCard: Card
): EffectResult {
  // Get all minions from the graveyard
  const graveyard = getGraveyard();
  
  // Check if graveyard is empty
  if (graveyard.length === 0) {
    console.log('Cannot summon from empty graveyard');
    return { 
      success: true, 
      info: 'No minion summoned - graveyard is empty' 
    };
  }
  
  try {
    // Find the highest cost minion in the graveyard
    let highestCostMinion: GraveyardMinion | null = null;
    
    for (const minion of graveyard) {
      // Skip any non-minion cards in the graveyard
      if (minion.type !== 'minion') continue;
      
      // Update highest cost minion
      if (!highestCostMinion || minion.manaCost > highestCostMinion.manaCost) {
        highestCostMinion = minion;
      }
      // If tied for highest cost, prefer the one with better stats (attack + health)
      else if (minion.manaCost === highestCostMinion.manaCost) {
        const currentStats = highestCostMinion.attack + highestCostMinion.health;
        const newStats = minion.attack + minion.health;
        
        if (newStats > currentStats) {
          highestCostMinion = minion;
        }
      }
    }
    
    // If we found a minion, summon it
    if (highestCostMinion) {
      // Get the card by ID
      const cardToSummon = getCardById(highestCostMinion.id);
      
      if (cardToSummon) {
        // Check if there's space on the board
        if (context.getPlayerBattlefield()?.length < 7) {
          context.summonMinion(cardToSummon, 'player');
          
          return { 
            success: true, 
            info: `Summoned ${highestCostMinion.name} (${highestCostMinion.manaCost} mana) from graveyard` 
          };
        } else {
          return { 
            success: false, 
            error: 'No board space available to summon minion' 
          };
        }
      } else {
        return { 
          success: false, 
          error: `Card with ID ${highestCostMinion.id} not found in registry` 
        };
      }
    } else {
      return { 
        success: true, 
        info: 'No valid minion found in graveyard' 
      };
    }
  } catch (error) {
    console.error('Error in summon_highest_cost_from_graveyard effect:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export default executeSummonHighestCostFromGraveyardSummonHighestCostFromGraveyard;