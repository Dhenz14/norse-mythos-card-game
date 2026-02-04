/**
 * Damage Effect Handler
 * 
 * This handler implements the battlecry:damage effect.
 * Simple damage implementation that redirects to damageHandler.
 */
import { GameContext } from '../../../GameContext';
import { Card, BattlecryEffect } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';
import executeDamageHandler from './damageHandler';

/**
 * Execute a Damage effect
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns An object indicating success or failure and any additional data
 */
export default function executeDamage(
  context: GameContext, 
  effect: BattlecryEffect, 
  sourceCard: Card
): EffectResult {
  return executeDamageHandler(context, effect, sourceCard);
}
