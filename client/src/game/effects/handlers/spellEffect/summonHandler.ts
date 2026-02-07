/**
 * Summon Effect Handler
 * 
 * This handler implements the spellEffect:summon effect.
 */
import { GameContext } from '../../../GameContext';
import { Card, SpellEffect } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';

export default function executeSummonSummon(
  context: GameContext, 
  effect: SpellEffect, 
  sourceCard: Card
): EffectResult {
  try {
    context.logGameEvent(`Executing spellEffect:summon for ${sourceCard.name}`);
    
    const summonCardId = effect.summonCardId;
    const count = effect.count || 1;
    const maxBoardSize = 7;

    if (!summonCardId) {
      context.logGameEvent(`No summonCardId specified for summon effect`);
      return { success: false, error: 'No summonCardId specified' };
    }

    let summoned = 0;

    for (let i = 0; i < count; i++) {
      if (context.currentPlayer.board.length >= maxBoardSize) {
        context.logGameEvent(`Board is full, cannot summon more minions`);
        break;
      }

      const summonedMinion: any = {
        instanceId: `summon-${summonCardId}-${Date.now()}-${i}`,
        card: {
          id: summonCardId,
          name: `Summoned Minion ${summonCardId}`,
          type: 'minion',
          cost: 0,
          attack: 1,
          health: 1,
          ...(typeof summonCardId === 'object' ? summonCardId : {})
        },
        currentAttack: 1,
        currentHealth: 1,
        maxHealth: 1,
        canAttack: false,
        isPlayed: true,
        isSummoningSick: true,
        attacksPerformed: 0,
        hasDivineShield: false,
        isFrozen: false,
        isSilenced: false,
      };

      context.currentPlayer.board.push(summonedMinion);
      summoned++;
      context.logGameEvent(`Summoned ${summonedMinion.card.name} to the battlefield`);
    }

    return { 
      success: true, 
      additionalData: { summoned } 
    };
  } catch (error) {
    console.error(`Error executing spellEffect:summon:`, error);
    return { 
      success: false, 
      error: `Error executing spellEffect:summon: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
