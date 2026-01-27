/**
 * Attack Logger Utility
 * 
 * This utility helps to debug the attack flow by providing consistent
 * logging throughout the attack process.
 */

export const logAttackAction = (action: string, data: any) => {
  console.log(`[ATTACK FLOW] ${action}:`, data);
};

export const logAttackError = (action: string, error: any) => {
  console.error(`[ATTACK FLOW ERROR] ${action}:`, error);
};

export const logAttackState = (state: 'started' | 'targeting' | 'completed' | 'cancelled', data: any) => {
  console.log(`[ATTACK STATE] ${state.toUpperCase()}:`, data);
};

export const logAttackConditions = (card: any) => {
  console.log(`[ATTACK ELIGIBILITY] Card: ${card.card.name}`, {
    instanceId: card.instanceId,
    canAttack: card.canAttack,
    isSummoningSick: card.isSummoningSick,
    hasAttacked: card.attacksPerformed > 0,
    isPlayerTurn: true, // This is set when calling the function
    keywords: card.card.keywords,
    isHighlighted: !card.isSummoningSick && card.canAttack,
    attacksPerformed: card.attacksPerformed
  });
};

export const isCardAttackable = (card: any, isPlayerTurn: boolean): boolean => {
  const canAttack = isPlayerTurn && 
                   !card.isSummoningSick && 
                   card.canAttack && 
                   (card.attacksPerformed === undefined || card.attacksPerformed < 1);
  
  logAttackConditions({...card, attacksPerformed: card.attacksPerformed || 0});
  return canAttack;
};