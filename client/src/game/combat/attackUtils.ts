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
  console.log(`[ATTACK DEBUG] Checking if card can attack:`, {
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
    console.log(`[ATTACK DEBUG] Cannot attack - not player's turn`);
    return false;
  }
  
  // Card must be a minion to attack
  if (card.card.type !== 'minion') {
    console.log(`[ATTACK DEBUG] Cannot attack - not a minion`);
    return false;
  }
  
  // Card needs the canAttack flag
  if (!card.canAttack) {
    console.log(`[ATTACK DEBUG] Cannot attack - canAttack flag is false`);
    return false;
  }
  
  // Card can't be summoning sick unless it has Charge or Rush
  if (card.isSummoningSick && 
      !card.card.keywords?.includes('charge') && 
      !card.card.keywords?.includes('rush')) {
    console.log(`[ATTACK DEBUG] Cannot attack - has summoning sickness and no charge/rush`);
    return false;
  }
  
  // Card must not have already attacked this turn
  // Most minions can only attack once per turn
  const attackLimit = card.card.attacksPerTurn || 1;
  if (card.attacksPerformed >= attackLimit) {
    console.log(`[ATTACK DEBUG] Cannot attack - already attacked ${card.attacksPerformed}/${attackLimit} times`);
    return false;
  }
  
  // All checks passed, card can attack
  console.log(`[ATTACK DEBUG] Card ${card.card.name} can attack!`);
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
    console.log(`[Attack Utils] Cannot attack non-taunt minion when taunt minions are present`);
    return false;
  }
  
  // Can't attack friendly minions
  if (attackingCard.isPlayerOwned === targetCard.isPlayerOwned) {
    console.log(`[Attack Utils] Cannot attack friendly minions`);
    return false;
  }
  
  // If the attacker has rush, it can only attack minions (not heroes) in the turn it's played
  if (attackingCard.isSummoningSick && attackingCard.card.keywords?.includes('rush') && targetCard.card.type === 'hero') {
    console.log(`[Attack Utils] Rush minions cannot attack heroes in the turn they're played`);
    return false;
  }
  
  // Target is valid
  console.log(`[Attack Utils] ${targetCard.card.name} is a valid target for ${attackingCard.card.name}`);
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