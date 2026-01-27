/**
 * Handler for applying status effects on attack
 */
import { CardInstance } from '../../types/CardTypes';
import { applyStatusEffect, StatusEffectType } from '../../utils/statusEffectUtils';

export function processOnAttackStatusEffect(
  attacker: CardInstance,
  target: CardInstance
): CardInstance {
  const onAttack = (attacker.card as any).onAttack;
  
  if (!onAttack || onAttack.type !== 'apply_status') {
    return target;
  }
  
  const statusEffect = onAttack.statusEffect as StatusEffectType;
  if (!statusEffect) {
    return target;
  }
  
  console.log(`[STATUS] ${attacker.card.name} applies ${statusEffect} to ${target.card.name}`);
  return applyStatusEffect(target, statusEffect);
}
