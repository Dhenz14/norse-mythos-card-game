/**
 * attackUtils.ts
 * 
 * SINGLE SOURCE OF TRUTH for attack eligibility in the game.
 * All attack checks MUST use these functions to ensure consistent behavior.
 * 
 * Based on Hearthstone rules:
 * - Minions have summoning sickness when first played
 * - Charge: Can attack immediately, including heroes
 * - Rush: Can attack minions immediately, heroes only after sickness wears off
 * - Windfury: Can attack twice per turn
 * - Frozen: Cannot attack
 */

import { CardInstance } from '../types';

export interface AttackEligibilityResult {
  canAttack: boolean;
  reason?: string;
}

/**
 * AUTHORITATIVE function to determine if a card can attack.
 * This is the single source of truth - all other attack checks should use this.
 * 
 * @param card The card instance to check
 * @param isPlayerTurn Whether it's currently the player's turn
 * @param verbose Whether to log debug info (default: false)
 * @returns AttackEligibilityResult with canAttack boolean and optional reason
 */
export function canCardAttack(
  card: CardInstance, 
  isPlayerTurn: boolean,
  verbose: boolean = false
): boolean {
  const result = getAttackEligibility(card, isPlayerTurn);
  
  if (verbose) {
    console.log(`[canCardAttack] ${card.card.name}: ${result.canAttack ? 'CAN attack' : `CANNOT attack - ${result.reason}`}`);
  }
  
  return result.canAttack;
}

/**
 * Get detailed attack eligibility with reason for why a card can or cannot attack.
 * Useful for UI feedback and debugging.
 */
export function getAttackEligibility(card: CardInstance, isPlayerTurn: boolean): AttackEligibilityResult {
  // Must be player's turn
  if (!isPlayerTurn) {
    return { canAttack: false, reason: 'Not your turn' };
  }
  
  // Card must be a minion to attack
  if (card.card.type !== 'minion') {
    return { canAttack: false, reason: 'Only minions can attack' };
  }
  
  // Check for 0 attack
  const attackValue = (card.card as any).attack || 0;
  if (attackValue <= 0) {
    return { canAttack: false, reason: 'Minion has 0 attack' };
  }
  
  // Check if frozen
  if (card.isFrozen) {
    return { canAttack: false, reason: 'Minion is frozen' };
  }
  
  // Card needs the canAttack flag (set by turn reset logic)
  if (!card.canAttack) {
    return { canAttack: false, reason: 'Minion cannot attack (exhausted or disabled)' };
  }
  
  // Check summoning sickness
  const hasCharge = card.card.keywords?.includes('charge');
  const hasRush = card.card.keywords?.includes('rush');
  
  if (card.isSummoningSick && !hasCharge && !hasRush) {
    return { canAttack: false, reason: 'Summoning sickness' };
  }
  
  // Check attack limit (Windfury allows 2 attacks, Mega-Windfury allows 4)
  const hasWindfury = card.card.keywords?.includes('windfury');
  const hasMegaWindfury = card.card.keywords?.includes('mega_windfury');
  const attackLimit = hasMegaWindfury ? 4 : (hasWindfury ? 2 : 1);
  const attacksPerformed = card.attacksPerformed || 0;
  
  if (attacksPerformed >= attackLimit) {
    return { canAttack: false, reason: `Already attacked ${attacksPerformed}/${attackLimit} times` };
  }
  
  // All checks passed
  return { canAttack: true };
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