import { useEffect, useRef } from 'react';
import { CombatPhase, PokerCombatState } from '../../types/PokerCombatTypes';
import { getPokerCombatAdapterState } from '../../hooks/usePokerCombatAdapter';
import { getSmartAIAction } from '../modules/SmartAI';
import { COMBAT_DEBUG } from '../debugConfig';

interface UsePokerAIOptions {
  combatState: PokerCombatState | null;
  isActive: boolean;
  aiResponseInProgressRef: React.MutableRefObject<boolean>;
}

const AI_RESPONSE_DELAY_MS = 600;
const AI_TIMEOUT_MS = 5000;

/**
 * Simplified AI hook that uses activePlayerId as the single source of truth.
 * 
 * This follows the same pattern as professional poker engines:
 * - One field (activePlayerId) determines whose turn it is
 * - AI reacts when activePlayerId matches the opponent's ID
 * - No complex inference from isReady flags
 */
export function usePokerAI(options: UsePokerAIOptions): void {
  const { combatState, isActive, aiResponseInProgressRef } = options;
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Watchdog to reset stuck AI flag
  useEffect(() => {
    let lastSetTime = 0;
    
    const checkStuckRef = () => {
      if (aiResponseInProgressRef.current) {
        const now = Date.now();
        if (lastSetTime === 0) {
          lastSetTime = now;
          return;
        }
        if (now - lastSetTime >= AI_TIMEOUT_MS) {
          if (COMBAT_DEBUG.AI) console.warn('[AI Watchdog] Resetting stuck aiResponseInProgressRef');
          aiResponseInProgressRef.current = false;
          lastSetTime = 0;
        }
      } else {
        lastSetTime = 0;
      }
    };
    
    watchdogTimerRef.current = setInterval(checkStuckRef, 1000);
    
    return () => {
      if (watchdogTimerRef.current) {
        clearInterval(watchdogTimerRef.current);
      }
    };
  }, [aiResponseInProgressRef]);

  // Single unified AI effect using activePlayerId
  useEffect(() => {
    if (!combatState || !isActive) return;
    
    // Core check: Is it the AI's turn?
    const aiPlayerId = combatState.opponent.playerId;
    const isAITurn = combatState.activePlayerId === aiPlayerId;
    
    if (!isAITurn) {
      if (COMBAT_DEBUG.AI) console.log('[AI Effect] Not AI turn, activePlayerId:', combatState.activePlayerId);
      return;
    }
    
    // Skip non-betting phases
    const isBettingPhase = 
      combatState.phase === CombatPhase.FAITH ||
      combatState.phase === CombatPhase.FORESIGHT ||
      combatState.phase === CombatPhase.DESTINY;
      
    if (!isBettingPhase) {
      if (COMBAT_DEBUG.AI) console.log('[AI Effect] Not a betting phase:', combatState.phase);
      return;
    }
    
    // Skip if game is over
    if (combatState.foldWinner || combatState.isAllInShowdown) {
      if (COMBAT_DEBUG.AI) console.log('[AI Effect] Game over (fold or all-in showdown)');
      return;
    }
    
    // Prevent duplicate actions
    if (aiResponseInProgressRef.current) {
      if (COMBAT_DEBUG.AI) console.log('[AI Effect] AI action already in progress');
      return;
    }
    
    if (COMBAT_DEBUG.AI) {
      console.log('[AI Effect] AI turn detected, will act in', AI_RESPONSE_DELAY_MS, 'ms', {
        phase: combatState.phase,
        activePlayerId: combatState.activePlayerId,
        currentBet: combatState.currentBet,
        actionsThisRound: combatState.actionsThisRound
      });
    }
    
    aiResponseInProgressRef.current = true;
    
    aiTimerRef.current = setTimeout(() => {
      try {
        const adapter = getPokerCombatAdapterState();
        const freshState = adapter.combatState;
        
        if (!freshState) {
          aiResponseInProgressRef.current = false;
          return;
        }
        
        // Re-verify it's still AI's turn
        if (freshState.activePlayerId !== aiPlayerId) {
          if (COMBAT_DEBUG.AI) console.log('[AI Effect] No longer AI turn after delay');
          aiResponseInProgressRef.current = false;
          return;
        }
        
        // Skip if game ended
        if (freshState.foldWinner || freshState.isAllInShowdown || 
            freshState.phase === CombatPhase.RESOLUTION) {
          aiResponseInProgressRef.current = false;
          return;
        }
        
        if (COMBAT_DEBUG.AI) console.log('[AI Effect] AI making decision now');
        const aiDecision = getSmartAIAction(freshState, false);
        if (COMBAT_DEBUG.AI) console.log('[AI Effect] AI decision:', aiDecision);
        
        adapter.performAction(aiPlayerId, aiDecision.action, aiDecision.betAmount);
        
        // Check if betting round should close after AI action
        setTimeout(() => {
          const adapterAfterAI = getPokerCombatAdapterState();
          if (adapterAfterAI.combatState && 
              adapterAfterAI.combatState.player.isReady && 
              adapterAfterAI.combatState.opponent.isReady &&
              adapterAfterAI.combatState.phase !== CombatPhase.RESOLUTION) {
            adapterAfterAI.maybeCloseBettingRound();
          }
          aiResponseInProgressRef.current = false;
        }, 100);
        
      } catch (error) {
        if (COMBAT_DEBUG.AI) console.error('[AI Effect] ERROR:', error);
        aiResponseInProgressRef.current = false;
      }
    }, AI_RESPONSE_DELAY_MS);
    
    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
        aiResponseInProgressRef.current = false;
      }
    };
  }, [combatState?.activePlayerId, combatState?.phase, combatState?.foldWinner, 
      combatState?.isAllInShowdown, isActive, aiResponseInProgressRef]);
}
