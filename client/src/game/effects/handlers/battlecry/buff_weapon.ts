/**
 * Buff Weapon Effect Handler
 * 
 * This handler implements the battlecry:buff_weapon effect.
 * Wrapper that delegates to buffWeaponHandler for the actual implementation.
 */
import { GameContext } from '../../../GameContext';
import { Card, BattlecryEffect } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';
import executeBuffWeapon from './buffWeaponHandler';

/**
 * Execute a Buff Weapon effect
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns An object indicating success or failure and any additional data
 */
export default function executeBuffWeaponWrapper(
  context: GameContext, 
  effect: BattlecryEffect, 
  sourceCard: Card
): EffectResult {
  return executeBuffWeapon(context, effect, sourceCard);
}
