/**
 * SummonJadeGolem Deathrattle Handler
 * 
 * Implements the "summon_jade_golem" deathrattle effect.
 * Summons a Jade Golem with stats based on jade counter.
 * Example: Jade Swarmer (deathrattle: summon a Jade Golem)
 */
import { debug } from '../../../config/debugConfig';
import { GameContext } from '../../../GameContext';
import { Card, CardInstance } from '../../../types/CardTypes';
import { DeathrattleEffect } from '../../../types';
import { EffectResult } from '../../../types/EffectTypes';
import { v4 as uuidv4 } from 'uuid';

let jadeGolemCounter = 1;

export function resetJadeGolemCounter(): void {
  jadeGolemCounter = 1;
}

export function getJadeGolemCounter(): number {
  return jadeGolemCounter;
}

/**
 * Execute a summon_jade_golem deathrattle effect
 */
export default function executeSummonJadeGolemSummonJadeGolem(
  context: GameContext,
  effect: DeathrattleEffect,
  sourceCard: Card | CardInstance
): EffectResult {
  try {
    const cardName = 'card' in sourceCard ? sourceCard.card.name : sourceCard.name;
    context.logGameEvent(`Executing deathrattle:summon_jade_golem for ${cardName}`);
    
    if (context.currentPlayer.board.length >= 7) {
      context.logGameEvent(`Board is full, cannot summon Jade Golem`);
      return { success: false, error: 'Board is full' };
    }
    
    const currentJadeStats = Math.min(jadeGolemCounter, 30);
    
    const jadeGolemCard: Card = {
      id: 85000 + jadeGolemCounter,
      name: 'Jade Golem',
      type: 'minion',
      manaCost: currentJadeStats,
      attack: currentJadeStats,
      health: currentJadeStats,
      rarity: 'common',
      heroClass: 'neutral',
      keywords: [],
      description: '',
      collectible: false,
      race: 'elemental'
    };
    
    const jadeGolemInstance: CardInstance = {
      instanceId: uuidv4(),
      card: jadeGolemCard,
      currentHealth: currentJadeStats,
      canAttack: false,
      isPlayed: true,
      isSummoningSick: true,
      attacksPerformed: 0
    };
    
    context.currentPlayer.board.push(jadeGolemInstance);
    context.logGameEvent(`Summoned a ${currentJadeStats}/${currentJadeStats} Jade Golem from ${cardName}'s deathrattle`);
    
    jadeGolemCounter++;
    
    return {
      success: true,
      additionalData: { 
        jadeGolemStats: currentJadeStats,
        nextJadeStats: Math.min(jadeGolemCounter, 30),
        summonedMinion: jadeGolemInstance
      }
    };
  } catch (error) {
    debug.error(`Error executing deathrattle:summon_jade_golem:`, error);
    return {
      success: false,
      error: `Error executing deathrattle:summon_jade_golem: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
