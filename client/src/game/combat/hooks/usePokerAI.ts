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
const STUCK_STATE_CHECK_INTERVAL_MS = 1500;
const STUCK_STATE_THRESHOLD_MS = 2000;

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

  // Stuck state watchdog: detects when player has acted but AI hasn't responded
  // This is a BACKUP safety net that only triggers if the main AI effect fails
  const stuckStateTimestampRef = useRef<number>(0);
  const stuckWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  useEffect(() => {
    if (!isActive) return;
    
    const checkStuckState = () => {
      // Skip if main AI timer is already scheduled - let it handle the response
      if (aiTimerRef.current !== null) {
        stuckStateTimestampRef.current = 0;
        return;
      }
      
      // Skip if AI is already processing
      if (aiResponseInProgressRef.current) {
        stuckStateTimestampRef.current = 0;
        return;
      }
      
      const adapter = getPokerCombatAdapterState();
      const freshState = adapter.combatState;
      
      if (!freshState) {
        stuckStateTimestampRef.current = 0;
        return;
      }
      
      const aiPlayerId = freshState.opponent.playerId;
      
      // Explicit betting phase check (same as main AI effect)
      const isBettingPhase = 
        freshState.phase === CombatPhase.FAITH ||
        freshState.phase === CombatPhase.FORESIGHT ||
        freshState.phase === CombatPhase.DESTINY;
      
      // Check for stuck state: player acted, opponent hasn't, it's AI's turn, betting phase
      const isStuckState = 
        freshState.player.isReady && 
        !freshState.opponent.isReady &&
        freshState.activePlayerId === aiPlayerId &&
        isBettingPhase &&
        !freshState.foldWinner &&
        !freshState.isAllInShowdown;
      
      if (!isStuckState) {
        stuckStateTimestampRef.current = 0;
        return;
      }
      
      const now = Date.now();
      if (stuckStateTimestampRef.current === 0) {
        stuckStateTimestampRef.current = now;
        return;
      }
      
      // If stuck for too long, force AI response
      if (now - stuckStateTimestampRef.current >= STUCK_STATE_THRESHOLD_MS) {
        // Re-verify conditions before acting (state may have changed)
        const freshCheck = getPokerCombatAdapterState().combatState;
        if (!freshCheck || 
            freshCheck.activePlayerId !== aiPlayerId ||
            freshCheck.opponent.isReady ||
            freshCheck.foldWinner ||
            freshCheck.isAllInShowdown ||
            freshCheck.phase === CombatPhase.RESOLUTION) {
          stuckStateTimestampRef.current = 0;
          return;
        }
        
        if (COMBAT_DEBUG.AI) {
          console.warn('[AI Stuck Watchdog] Forcing AI response after stuck state detected', {
            stuckDuration: now - stuckStateTimestampRef.current,
            phase: freshCheck.phase,
            playerReady: freshCheck.player.isReady,
            opponentReady: freshCheck.opponent.isReady,
            activePlayerId: freshCheck.activePlayerId
          });
        }
        
        stuckStateTimestampRef.current = 0;
        aiResponseInProgressRef.current = true;
        
        try {
          const aiDecision = getSmartAIAction(freshCheck, false);
          if (COMBAT_DEBUG.AI) console.log('[AI Stuck Watchdog] AI decision:', aiDecision);
          
          adapter.performAction(aiPlayerId, aiDecision.action, aiDecision.betAmount);
          
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
          if (COMBAT_DEBUG.AI) console.error('[AI Stuck Watchdog] ERROR:', error);
          aiResponseInProgressRef.current = false;
        }
      }
    };
    
    stuckWatchdogRef.current = setInterval(checkStuckState, STUCK_STATE_CHECK_INTERVAL_MS);
    
    return () => {
      if (stuckWatchdogRef.current) {
        clearInterval(stuckWatchdogRef.current);
        stuckWatchdogRef.current = null;
      }
    };
  }, [isActive, aiResponseInProgressRef]);

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
        // Only reset the in-progress flag if we actually canceled a pending timer
        // Do NOT reset if the timer already fired - the action completion callback handles that
        aiResponseInProgressRef.current = false;
      }
    };
  }, [combatState?.activePlayerId, combatState?.phase, combatState?.foldWinner, 
      combatState?.isAllInShowdown, isActive, aiResponseInProgressRef]);
}

// Helper to check if an AI action is pending or in progress
export function isAIActionPending(aiTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>, 
                                  aiResponseInProgressRef: React.MutableRefObject<boolean>): boolean {
  return aiTimerRef.current !== null || aiResponseInProgressRef.current;
}
