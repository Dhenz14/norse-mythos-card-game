/**
 * attackUtils.ts
 * 
 * Utility functions for attack functionality in the game.
 * These functions determine if cards can attack and what they can attack.
 */

import { CardInstance } from '../types/CardTypes';

/**
 * Determines if a card can attack based on game rules
 */
export function canCardAttack(card: CardInstance, isPlayerTurn: boolean): boolean {
  // Add comprehensive debug info
    name: card.card.name,
    id: card.instanceId,
    isPlayerTurn,
    canAttack: card.canAttack,
    isSummoningSick: card.isSummoningSick,
    attacksPerformed: card.attacksPerformed || 0,
    keywords: card.card.keywords || []
  });
  
  // Must be player's turn
  if (!isPlayerTurn) {
    return false;
  }
  
  // Card must be a minion to attack
  if (card.card.type !== 'minion') {
    return false;
  }
  
  // Card needs the canAttack flag
  if (!card.canAttack) {
    return false;
  }
  
  // Card can't be summoning sick unless it has Charge or Rush
  if (card.isSummoningSick && 
      !card.card.keywords?.includes('charge') && 
      !card.card.keywords?.includes('rush')) {
    return false;
  }
  
  // Card must not have already attacked this turn
  // Most minions can only attack once per turn
  const attackLimit = card.card.attacksPerTurn || 1;
  if (card.attacksPerformed >= attackLimit) {
    return false;
  }
  
  // All checks passed, card can attack
  return true;
}

/**
 * Determines if a target is valid for an attack
 */
export function isValidAttackTarget(
  attackingCard: CardInstance, 
  targetCard: CardInstance, 
  opponentTauntCards: CardInstance[]
): boolean {
  // Check if opponent has any taunt minions
  const hasTaunt = opponentTauntCards.length > 0;
  
  // If opponent has taunt minions, can only attack those, unless target is also a taunt
  if (hasTaunt && 
      !opponentTauntCards.some(card => card.instanceId === targetCard.instanceId) && 
      targetCard.card.type !== 'hero') {
    return false;
  }
  
  // Can't attack friendly minions
  if (attackingCard.isPlayerOwned === targetCard.isPlayerOwned) {
    return false;
  }
  
  // If the attacker has rush, it can only attack minions (not heroes) in the turn it's played
  if (attackingCard.isSummoningSick && attackingCard.card.keywords?.includes('rush') && targetCard.card.type === 'hero') {
    return false;
  }
  
  // Target is valid
  return true;
}

/**
 * Gets all valid targets for an attacking card
 */
export function getValidTargets(
  attackingCard: CardInstance,
  opponentCards: CardInstance[],
  opponentHero: CardInstance
): CardInstance[] {
  // If card can't attack, no valid targets
  if (!attackingCard.canAttack) return [];
  
  // Check for taunt minions
  const tauntMinions = opponentCards.filter(card => 
    card.card.keywords?.includes('taunt')
  );
  
  // If there are taunt minions, they are the only valid targets
  if (tauntMinions.length > 0) {
    return tauntMinions;
  }
  
  // Otherwise, all opponent cards and hero are valid targets
  // Exception: Rush minions can't attack heroes in the turn they're played
  const hasRushLimitation = attackingCard.isSummoningSick && 
                         attackingCard.card.keywords?.includes('rush');
  
  const targets = [...opponentCards];
  
  // Only add hero as target if not restricted by rush
  if (!hasRushLimitation) {
    targets.push(opponentHero);
  }
  
  return targets;
}