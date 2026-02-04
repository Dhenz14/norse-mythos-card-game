/**
 * SummonJadeGolem Battlecry Handler
 * 
 * Implements the "summon_jade_golem" battlecry effect.
 * Summons a Jade Golem with incrementing stats (1/1, 2/2, 3/3, etc. up to 30/30).
 * Example card: Jade Claws (ID: 85004)
 */
import { GameContext, Player } from '../../../GameContext';
import { Card, BattlecryEffect, CardInstance } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';
import { v4 as uuidv4 } from 'uuid';

const MAX_BOARD_SIZE = 7;
const MAX_JADE_GOLEM_SIZE = 30;

/**
 * Execute a summon_jade_golem battlecry effect
 * 
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns An object indicating success or failure and any additional data
 */
export default function executeSummonJadeGolem(
  context: GameContext,
  effect: BattlecryEffect,
  sourceCard: Card
): EffectResult {
  try {
    context.logGameEvent(`Executing summon_jade_golem battlecry for ${sourceCard.name}`);
    
    const currentBoardSize = context.currentPlayer.board.length;
    const availableSlots = MAX_BOARD_SIZE - currentBoardSize;
    
    if (availableSlots <= 0) {
      context.logGameEvent(`Board is full, cannot summon Jade Golem`);
      return { success: true, additionalData: { summonedCount: 0, boardFull: true } };
    }
    
    const player = context.currentPlayer as Player & { jadeGolemCounter?: number };
    const currentCounter = player.jadeGolemCounter || 0;
    
    player.jadeGolemCounter = currentCounter + 1;
    
    const golemSize = Math.min(currentCounter + 1, MAX_JADE_GOLEM_SIZE);
    
    const jadeGolemCard: Card = {
      id: 85100 + golemSize,
      name: 'Jade Golem',
      description: `A ${golemSize}/${golemSize} Jade Golem.`,
      manaCost: Math.min(golemSize, 10),
      type: 'minion',
      rarity: 'token',
      heroClass: 'neutral',
      attack: golemSize,
      health: golemSize,
      keywords: []
    };
    
    const jadeGolemInstance: CardInstance = {
      instanceId: uuidv4(),
      card: jadeGolemCard,
      currentHealth: golemSize,
      currentAttack: golemSize,
      canAttack: false,
      isPlayed: true,
      isSummoningSick: true,
      attacksPerformed: 0
    };
    
    context.currentPlayer.board.push(jadeGolemInstance);
    
    context.logGameEvent(`Summoned ${golemSize}/${golemSize} Jade Golem (Golem #${currentCounter + 1})`);
    
    return { 
      success: true, 
      additionalData: { 
        summonedCount: 1,
        golemSize,
        golemNumber: currentCounter + 1,
        summonedMinion: jadeGolemInstance
      } 
    };
  } catch (error) {
    console.error(`Error executing summon_jade_golem:`, error);
    return { 
      success: false, 
      error: `Error executing summon_jade_golem: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
