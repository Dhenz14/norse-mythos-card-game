/**
 * ReplayBattlecries Battlecry Handler
 * 
 * Implements the "replay_battlecries" battlecry effect.
 * Replays all battlecries played this game (Shudderwock style).
 * Example card: Shudderwock (ID: 20102)
 */
import { debug } from '../../../config/debugConfig';
import { GameContext } from '../../../GameContext';
import { Card, BattlecryEffect, CardInstance } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';

export default function executeReplayBattlecries(
  context: GameContext, 
  effect: BattlecryEffect, 
  sourceCard: Card
): EffectResult {
  try {
    context.logGameEvent(`Executing battlecry:replay_battlecries for ${sourceCard.name}`);
    
    const isRandom = effect.isRandom !== false;
    const maxBattlecries = effect.maxBattlecries || 30;
    
    const battlecriesPlayed = (context as any).battlecriesPlayedThisGame || [];
    
    if (battlecriesPlayed.length === 0) {
      context.logGameEvent(`No battlecries have been played this game`);
      return { success: true, additionalData: { battlecriesReplayed: 0 } };
    }
    
    let battlecriesToReplay = [...battlecriesPlayed];
    
    if (isRandom) {
      for (let i = battlecriesToReplay.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [battlecriesToReplay[i], battlecriesToReplay[j]] = [battlecriesToReplay[j], battlecriesToReplay[i]];
      }
    }
    
    battlecriesToReplay = battlecriesToReplay.slice(0, maxBattlecries);
    
    const replayedEffects: string[] = [];
    const sourceMinion = context.getFriendlyMinions().find(m => m.card.id === sourceCard.id);
    
    for (const battlecry of battlecriesToReplay) {
      if (!sourceMinion || (sourceMinion.currentHealth !== undefined && sourceMinion.currentHealth <= 0)) {
        context.logGameEvent(`${sourceCard.name} died, stopping battlecry replay`);
        break;
      }
      
      try {
        const effectType = battlecry.effect?.type || 'unknown';
        const cardName = battlecry.cardName || 'Unknown Card';
        
        context.logGameEvent(`Replaying ${cardName}'s battlecry (${effectType})`);
        replayedEffects.push(`${cardName}: ${effectType}`);
        
        if (battlecry.effect) {
          const effect = battlecry.effect;
          
          switch (effect.type) {
            case 'damage':
              const damageTargets = context.getTargets(effect.targetType || 'random_enemy_minion', sourceMinion!);
              if (damageTargets.length > 0) {
                const randomTarget = damageTargets[Math.floor(Math.random() * damageTargets.length)];
                context.dealDamage(randomTarget, effect.value || 1);
              }
              break;
              
            case 'heal':
              const healTargets = context.getTargets(effect.targetType || 'random_friendly_minion', sourceMinion!);
              if (healTargets.length > 0) {
                const randomTarget = healTargets[Math.floor(Math.random() * healTargets.length)];
                context.healTarget(randomTarget, effect.value || 1);
              }
              break;
              
            case 'buff':
              if (sourceMinion) {
                sourceMinion.currentAttack = (sourceMinion.currentAttack || sourceMinion.card.attack || 0) + (effect.buffAttack || 0);
                sourceMinion.currentHealth = (sourceMinion.currentHealth || sourceMinion.card.health || 0) + (effect.buffHealth || 0);
              }
              break;
              
            case 'draw':
              context.drawCards(effect.value || 1);
              break;
              
            default:
              context.logGameEvent(`Unknown effect type: ${effect.type}, skipping`);
          }
        }
      } catch (err) {
        debug.error(`Error replaying battlecry:`, err);
      }
    }
    
    context.logGameEvent(`${sourceCard.name} replayed ${replayedEffects.length} battlecries`);
    
    return { 
      success: true, 
      additionalData: { 
        battlecriesReplayed: replayedEffects.length,
        effects: replayedEffects
      } 
    };
  } catch (error) {
    debug.error(`Error executing battlecry:replay_battlecries:`, error);
    return { 
      success: false, 
      error: `Error executing battlecry:replay_battlecries: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
