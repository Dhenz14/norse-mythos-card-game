/**
 * AttackSystem.tsx
 * 
 * A comprehensive Hearthstone-style attack system that handles:
 * - Attack eligibility (summoning sickness, charge, rush)
 * - Attack targeting (taunt, valid targets)
 * - Attack resolution (damage calculation, divine shield)
 * - Post-attack effects (card state updates, death handling)
 * 
 * IMPORTANT: All attack eligibility checks use the authoritative function
 * from attackUtils.ts to ensure consistent behavior across the codebase.
 */

import React, { useEffect } from 'react';
import { useAttackStore } from './attackStore';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';
import { CardInstance } from '../types';
import { useAudio } from '../../lib/stores/useAudio';
import AttackIndicator from './AttackIndicator';
import './AttackStyles.css';
import { Position } from '../types/Position';
import { useGameStore } from '../stores/gameStore';
import { GameState } from '../types';
import { destroyCard } from '../utils/zoneUtils';
import { dealDamage } from '../utils/effects/damageUtils';
// AUTHORITATIVE canCardAttack function - single source of truth
import { canCardAttack as canCardAttackUtil, getAttackEligibility } from './attackUtils';
import { debug } from '../config/debugConfig';

// Types
export type AttackTarget = {
  id: string;
  type: 'minion' | 'hero';
  playerId: 'player' | 'opponent';
};

export type AttackResult = {
  success: boolean;
  newState?: GameState;
  message?: string;
  animations?: Array<{
    type: 'attack' | 'damage' | 'death';
    sourceId: string;
    targetId: string;
  }>;
};

/**
 * Check if a card can attack based on Hearthstone rules.
 * 
 * NOTE: This is a wrapper around the authoritative canCardAttack from attackUtils.ts
 * to maintain backwards compatibility. All new code should import from attackUtils directly.
 */
export function canCardAttack(card: CardInstance, isPlayerTurn: boolean): boolean {
  // Use the authoritative function with verbose logging
  const result = getAttackEligibility(card, isPlayerTurn);
  
  debug.combat('[AttackSystem.canCardAttack]', {
    name: card.card.name,
    instanceId: card.instanceId,
    canAttack: result.canAttack,
    reason: result.reason || 'eligible',
    state: {
      isSummoningSick: card.isSummoningSick,
      canAttackFlag: card.canAttack,
      attacksPerformed: card.attacksPerformed || 0,
      isFrozen: card.isFrozen
    }
  });
  
  return result.canAttack;
}

/**
 * Check if a target is valid for an attack based on Hearthstone rules
 */
export function isValidAttackTarget(
  state: GameState,
  attacker: CardInstance,
  targetId: string | undefined,
  targetType: 'minion' | 'hero' = 'minion'
): boolean {
  // If targeting a hero (no target ID provided, or explicitly targeting hero)
  if (!targetId || targetType === 'hero') {
    // Cards with Rush can only attack minions in the turn they're played
    const hasRush = attacker.card.keywords?.includes('rush');
    const hasCharge = attacker.card.keywords?.includes('charge');
    
    if (attacker.isSummoningSick && hasRush && !hasCharge) {
      return false;
    }

    // Check if opponent has taunt minions
    const opponentHasTaunt = state.players.opponent.battlefield.some(
      card => card.card.keywords?.includes('taunt')
    );

    if (opponentHasTaunt) {
      return false;
    }

    return true;
  }

  // Targeting a minion
  const targetMinion = state.players.opponent.battlefield.find(
    card => card.instanceId === targetId
  );

  if (!targetMinion) {
    return false;
  }

  // Check for taunt
  const opponentHasTaunt = state.players.opponent.battlefield.some(
    card => card.card.keywords?.includes('taunt')
  );

  if (opponentHasTaunt && !targetMinion.card.keywords?.includes('taunt')) {
    return false;
  }

  return true;
}

/**
 * Execute an attack between attacker and target
 * Handles all combat calculations and state updates
 */
export function executeAttack(
  state: GameState,
  attackerId: string,
  targetId?: string,
  targetType: 'minion' | 'hero' = 'hero'
): AttackResult {

  // Deep clone the state to avoid mutations
  let newState = JSON.parse(JSON.stringify(state)) as GameState;

  // Find the attacker
  const attacker = newState.players.player.battlefield.find(
    card => card.instanceId === attackerId
  );

  if (!attacker) {
    return {
      success: false,
      message: 'Attacker not found on battlefield'
    };
  }

  // Verify the attacker can attack (use local function with type assertion)
  if (!canCardAttack(attacker as unknown as CardInstance, true)) {
    return {
      success: false,
      message: 'Card cannot attack'
    };
  }

  // Initialize tracking
  const animations = [];
  let targetDestroyed = false;
  let attackerDestroyed = false;

  // If no target specified, attack hero
  if (!targetId || targetType === 'hero') {
    // Check if this is a valid hero attack (use local function with type assertion)
    if (!isValidAttackTarget(newState, attacker as unknown as CardInstance, undefined, 'hero')) {
      return {
        success: false,
        message: 'Invalid hero attack'
      };
    }

    const attackValue = attacker.card.type === 'minion' ? (attacker.card.attack ?? 0) : 0;
    
    // Record the animation
    animations.push({
      type: 'attack',
      sourceId: attackerId,
      targetId: 'opponent-hero'
    });

    // Deal damage to opponent hero — goes through armor, sets gamePhase if lethal
    const damage = attacker.card.type === 'minion' ? (attacker.card.attack ?? 0) : 0;
    newState = dealDamage(newState, 'opponent', 'hero', damage, undefined, undefined, 'player');

    animations.push({
      type: 'damage',
      sourceId: attackerId,
      targetId: 'opponent-hero'
    });
  } 
  // Targeting a minion
  else {
    // Find the target minion
    const targetMinion = newState.players.opponent.battlefield.find(
      card => card.instanceId === targetId
    );

    if (!targetMinion) {
      return {
        success: false,
        message: 'Target minion not found'
      };
    }

    // Check if this is a valid minion attack (use local function with type assertion)
    if (!isValidAttackTarget(newState, attacker as unknown as CardInstance, targetId, 'minion')) {
      return {
        success: false,
        message: 'Invalid minion attack'
      };
    }

    const attackerAttack = attacker.card.type === 'minion' ? (attacker.card.attack ?? 0) : 0;
    const targetAttack = targetMinion.card.type === 'minion' ? (targetMinion.card.attack ?? 0) : 0;
    
    // Record the attack animation
    animations.push({
      type: 'attack',
      sourceId: attackerId,
      targetId: targetId
    });

    // Handle Divine Shield
    let attackerDivineShield = attacker.hasDivineShield || false;
    let targetDivineShield = targetMinion.hasDivineShield || false;

    // Attacker deals damage to target
    if (targetDivineShield) {
      // Divine shield absorbs the damage
      targetMinion.hasDivineShield = false;
    } else {
      // Apply damage
      const attackerDamage = attacker.card.type === 'minion' ? (attacker.card.attack ?? 0) : 0;
      if (targetMinion.currentHealth !== undefined) {
        targetMinion.currentHealth -= attackerDamage;
      }
      
      animations.push({
        type: 'damage',
        sourceId: attackerId,
        targetId: targetId
      });

    }

    // Target deals damage to attacker
    if (attackerDivineShield) {
      // Divine shield absorbs the damage
      attacker.hasDivineShield = false;
    } else {
      // Apply damage
      const targetDamage = targetMinion.card.type === 'minion' ? (targetMinion.card.attack ?? 0) : 0;
      if (attacker.currentHealth !== undefined) {
        attacker.currentHealth -= targetDamage;
      }
      
      animations.push({
        type: 'damage',
        sourceId: targetId,
        targetId: attackerId
      });

    }

    // Check if minions died from the attack
    if ((targetMinion.currentHealth ?? 0) <= 0) {
      targetDestroyed = true;
      
      animations.push({
        type: 'death',
        sourceId: attackerId,
        targetId: targetId
      });
    }

    if ((attacker.currentHealth ?? 0) <= 0) {
      attackerDestroyed = true;
      
      animations.push({
        type: 'death',
        sourceId: targetId,
        targetId: attackerId
      });
    }

    // Handle minion deaths
    if (targetDestroyed) {
      newState = destroyCard(newState, targetId, 'opponent');
    }
  }

  // Update attacker state (if it survived)
  const updatedAttackerIndex = newState.players.player.battlefield.findIndex(
    card => card.instanceId === attackerId
  );

  if (updatedAttackerIndex !== -1 && !attackerDestroyed) {
    // Increment attacks performed
    const updatedAttacker = newState.players.player.battlefield[updatedAttackerIndex];
    updatedAttacker.attacksPerformed = (updatedAttacker.attacksPerformed || 0) + 1;
    
    // Check if it can attack again this turn
    const hasWindfury = updatedAttacker.card.keywords?.includes('windfury');
    const maxAttacks = hasWindfury ? 2 : 1;
    
    if (updatedAttacker.attacksPerformed >= maxAttacks) {
      updatedAttacker.canAttack = false;
    }
  } else if (attackerDestroyed) {
    // If the attacker died, remove it from battlefield
    newState = destroyCard(newState, attackerId, 'player');
  }

  return {
    success: true,
    newState,
    animations: animations as Array<{
      type: 'attack' | 'damage' | 'death';
      sourceId: string;
      targetId: string;
    }>
  };
}

/**
 * Destroy a minion and move it to the graveyard
 */
function destroyMinion(state: GameState, minionId: string, playerId: 'player' | 'opponent'): GameState {
  return destroyCard(state, minionId, playerId);
}

/**
 * Reset attack state for a new turn
 * Called at the beginning of each turn to reset attack counters
 */
export function resetAttackStateForTurn(state: GameState, playerId: 'player' | 'opponent'): GameState {
  
  // Clone state to avoid mutations
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Get the current player's battlefield
  const battlefield = newState.players[playerId].battlefield;
  
  // Reset attack state for all minions
  battlefield.forEach(card => {
    // Reset the number of attacks performed this turn
    card.attacksPerformed = 0;
    
    // Non-summoning sick minions can attack
    if (!card.isSummoningSick) {
      card.canAttack = true;
    }
    
    // Remove summoning sickness for minions that were played last turn
    if (card.isSummoningSick) {
      card.isSummoningSick = false;
      card.canAttack = true;
    }
  });
  
  return newState;
}

/**
 * Format info about a card's attack status for debugging
 */
export function getAttackStatusInfo(card: CardInstance, isPlayerTurn: boolean): string {
  const hasCharge = card.card.keywords?.includes('charge');
  const hasRush = card.card.keywords?.includes('rush');
  const hasWindfury = card.card.keywords?.includes('windfury');
  
  return `
    Name: ${card.card.name}
    Can Attack: ${canCardAttack(card, isPlayerTurn)}
    Is Player Turn: ${isPlayerTurn}
    Summoning Sickness: ${card.isSummoningSick}
    Has Charge: ${hasCharge}
    Has Rush: ${hasRush}
    Has Windfury: ${hasWindfury}
    Attacks Performed: ${card.attacksPerformed || 0}/${hasWindfury ? 2 : 1}
  `;
}

// React Component
interface AttackSystemProps {
  isPlayerTurn: boolean;
  cardPositions: Record<string, Position>;
  getBoardCenter: () => Position;
  onAttackComplete?: () => void;
}

const AttackSystem: React.FC<AttackSystemProps> = ({
  isPlayerTurn,
  cardPositions,
  getBoardCenter,
  onAttackComplete
}) => {
  const { attackingCard, isAttackMode, validTargets, selectAttacker, performAttack, cancelAttack } = useAttackStore();
  const gameState = useGameStore(s => s.gameState);
  const audioState = useAudio.getState();
  
  // Handle escape key to cancel attack
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAttackMode) {
        cancelAttack();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isAttackMode, cancelAttack]);

  // Methods exposed to the parent component for attack management
  
  /**
   * Handle clicking on a player's minion (potential attacker)
   */
  const handleAttackerClick = (card: CardInstance | CardInstanceWithCardData) => {
    
    // We're in attack mode and clicked a different card - cancel current attack
    if (isAttackMode && attackingCard && attackingCard.instanceId !== card.instanceId) {
      cancelAttack();
    }
    
    // Select this card as the attacker (or toggle off if already selected)
    selectAttacker(card as CardInstance);
  };
  
  /**
   * Handle clicking on an opponent's minion (potential target)
   */
  const handleTargetClick = (card: CardInstance | CardInstanceWithCardData) => {
    
    // If we're not in attack mode or have no attacker, do nothing
    if (!isAttackMode || !attackingCard) {
      return false;
    }
    
    // Check if this is a valid target
    if (!validTargets.includes(card.instanceId)) {
      
      // Play error sound
      if (audioState.playSoundEffect) audioState.playSoundEffect('error');
      return false;
    }
    
    // Play attack sound
    if (audioState.playSoundEffect) audioState.playSoundEffect('attack');
    
    // Execute the attack
    const success = performAttack(card.instanceId, 'minion');
    
    // Notify the parent component
    if (success && onAttackComplete) {
      onAttackComplete();
    }
    
    return success;
  };
  
  /**
   * Handle clicking on the opponent's hero
   */
  const handleHeroClick = () => {
    
    // If we're not in attack mode or have no attacker, do nothing
    if (!isAttackMode || !attackingCard) {
      return false;
    }
    
    // Check if hero is a valid target
    if (!validTargets.includes('opponent-hero')) {
      
      // Play error sound
      if (audioState.playSoundEffect) audioState.playSoundEffect('error');
      return false;
    }
    
    // Play attack sound
    if (audioState.playSoundEffect) audioState.playSoundEffect('attack');
    
    // Execute the attack against the hero (use 'opponent-hero' as the target ID)
    const success = performAttack('opponent-hero', 'hero');
    
    // Notify the parent component
    if (success && onAttackComplete) {
      onAttackComplete();
    }
    
    return success;
  };
  
  /**
   * Get CSS class names for a card based on attack state
   */
  const getCardClasses = (card: CardInstance | CardInstanceWithCardData, isPlayerCard: boolean): string => {
    const classes: string[] = [];
    
    if (isPlayerCard) {
      // This is a potential attacker
      if (isPlayerTurn && !card.isSummoningSick && card.canAttack) {
        classes.push('card-attackable');
      } else {
        classes.push('card-non-attackable');
      }
      
      // This is the currently selected attacker
      if (attackingCard && attackingCard.instanceId === card.instanceId) {
        classes.push('active-attacker');
      }
    } else {
      // This is a potential target
      if (isAttackMode && validTargets.includes(card.instanceId)) {
        classes.push('valid-target');
      }
      
      // This is a taunt minion
      if (card.card.keywords?.includes('taunt')) {
        classes.push('has-taunt');
      }
    }
    
    return classes.join(' ');
  };
  
  /**
   * Check if a card can attack (convenience wrapper)
   */
  const canCardAttackWrapper = (card: CardInstance | CardInstanceWithCardData): boolean => {
    return isPlayerTurn && !card.isSummoningSick && card.canAttack === true;
  };

  return (
    <>
      {/* Render attack indicators when in attack mode */}
      {isAttackMode && attackingCard && cardPositions[attackingCard.instanceId] && (
        <AttackIndicator 
          fromPosition={cardPositions[attackingCard.instanceId]}
          toPosition={getBoardCenter()}
          isActive={true}
        />
      )}
      
      {/* This component doesn't render anything else directly,
          it just provides methods to the parent component */}
    </>
  );
};

// Export the component as default and helper methods as named exports
export { useAttackStore };
export default AttackSystem;