/**
 * Freeze Battlecry Handler
 * 
 * Implements the "freeze" battlecry effect.
 * This handler freezes a target character, preventing it from attacking on the next turn.
 */
import { GameContext } from '../../../GameContext';
import { Card, BattlecryEffect } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';

/**
 * Execute a freeze battlecry effect
 * 
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns Effect result with success/failure status
 */
export default function executeFreeze(
  context: GameContext,
  effect: BattlecryEffect,
  sourceCard: Card
): EffectResult {
  try {
    // Get the target from the context
    const targetId = context.targetId;
    
    if (!targetId) {
      return {
        success: false,
        error: 'No target selected for freeze effect'
      };
    }
    
    // Find the target card
    let target;
    if (targetId === 'player') {
      target = context.currentPlayer.hero;
    } else if (targetId === 'opponent') {
      target = context.opponentPlayer.hero;
    } else {
      // Look in both sides of the board
      target = [...context.currentPlayer.board, ...context.opponentPlayer.board]
        .find(card => card.instanceId === targetId);
    }
    
    if (!target) {
      return {
        success: false,
        error: `Target with ID ${targetId} not found for freeze effect`
      };
    }
    
    // Apply frozen status
    target.isFrozen = true;
    
    // Log the effect
    context.logGameEvent(`${sourceCard.name} froze ${target.name}`);
    
    return {
      success: true,
      targetId: targetId
    };
  } catch (error) {
    console.error(`Error executing battlecry:freeze:`, error);
    return { 
      success: false, 
      error: `Error executing battlecry:freeze: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}