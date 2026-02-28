import { useEffect, useRef } from 'react';
import { CombatAction, CombatPhase, PokerCombatState } from '../../types/PokerCombatTypes';
import { getPokerCombatAdapterState } from '../../hooks/usePokerCombatAdapter';
import { getSmartAIAction } from '../modules/SmartAI';
import { useGameStore } from '../../stores/gameStore';
import { COMBAT_DEBUG } from '../debugConfig';
import { debug } from '../../config/debugConfig';
import { fireAnnouncement } from '../../stores/unifiedUIStore';
import { ALL_NORSE_HEROES } from '../../data/norseHeroes';

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

  const cardGameMulliganActive = useGameStore(state => state.gameState?.mulligan?.active);

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
          if (COMBAT_DEBUG.AI) debug.warn('[AI Watchdog] Resetting stuck aiResponseInProgressRef');
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

  useEffect(() => {
    if (!combatState || !isActive) return;

    if (cardGameMulliganActive) {
      if (COMBAT_DEBUG.AI) debug.ai('[AI Effect] Blocked: card game mulligan still active');
      return;
    }

    const aiPlayerId = combatState.opponent.playerId;
    const isAITurn = combatState.activePlayerId === aiPlayerId;

    if (!isAITurn) {
      if (COMBAT_DEBUG.AI) debug.ai('[AI Effect] Not AI turn, activePlayerId:', combatState.activePlayerId);
      return;
    }

    const isBettingPhase =
      combatState.phase === CombatPhase.PRE_FLOP ||
      combatState.phase === CombatPhase.FAITH ||
      combatState.phase === CombatPhase.FORESIGHT ||
      combatState.phase === CombatPhase.DESTINY;

    if (!isBettingPhase) {
      if (COMBAT_DEBUG.AI) debug.ai('[AI Effect] Not a betting phase:', combatState.phase);
      return;
    }

    if (combatState.foldWinner || combatState.isAllInShowdown) {
      if (COMBAT_DEBUG.AI) debug.ai('[AI Effect] Game over (fold or all-in showdown)');
      return;
    }

    if (aiResponseInProgressRef.current) {
      if (COMBAT_DEBUG.AI) debug.ai('[AI Effect] AI action already in progress');
      return;
    }

    if (COMBAT_DEBUG.AI) {
      debug.ai('[AI Effect] AI turn detected, will act in', AI_RESPONSE_DELAY_MS, 'ms', {
        phase: combatState.phase,
        activePlayerId: combatState.activePlayerId,
        currentBet: combatState.currentBet,
        actionsThisRound: combatState.actionsThisRound
      });
    }

    aiResponseInProgressRef.current = true;

    aiTimerRef.current = setTimeout(() => {
      try {
        const mulliganStillActive = useGameStore.getState().gameState?.mulligan?.active;
        if (mulliganStillActive) {
          aiResponseInProgressRef.current = false;
          return;
        }

        const adapter = getPokerCombatAdapterState();
        const freshState = adapter.combatState;

        if (!freshState) {
          aiResponseInProgressRef.current = false;
          return;
        }

        if (freshState.activePlayerId !== aiPlayerId) {
          if (COMBAT_DEBUG.AI) debug.ai('[AI Effect] No longer AI turn after delay');
          aiResponseInProgressRef.current = false;
          return;
        }

        if (freshState.foldWinner || freshState.isAllInShowdown ||
            freshState.phase === CombatPhase.RESOLUTION) {
          aiResponseInProgressRef.current = false;
          return;
        }

        if (COMBAT_DEBUG.AI) debug.ai('[AI Effect] AI making decision now');
        const aiDecision = getSmartAIAction(freshState, false);
        if (COMBAT_DEBUG.AI) debug.ai('[AI Effect] AI decision:', aiDecision);

        adapter.performAction(aiPlayerId, aiDecision.action, aiDecision.betAmount);

        // Fire dramatic announcement for opponent poker actions
        const heroId = freshState.opponent.pet.norseHeroId;
        const hero = heroId ? ALL_NORSE_HEROES[heroId] : null;
        const heroName = hero?.name || 'Opponent';

        if (aiDecision.action === CombatAction.ATTACK) {
          const amount = aiDecision.betAmount || freshState.currentBet || 0;
          fireAnnouncement('poker_bet', `${heroName} attacks for ${amount} HP!`, {
            subtitle: 'Match or brace!',
            duration: 2500
          });
        } else if (aiDecision.action === CombatAction.COUNTER_ATTACK) {
          const amount = aiDecision.betAmount || 0;
          fireAnnouncement('poker_bet', `${heroName} counter-attacks ${amount} HP!`, {
            subtitle: 'The stakes grow higher!',
            duration: 2500
          });
        } else if (aiDecision.action === CombatAction.ENGAGE) {
          fireAnnouncement('poker_call', `${heroName} engages!`, {
            subtitle: 'Matched your attack',
            duration: 1800
          });
        } else if (aiDecision.action === CombatAction.BRACE) {
          fireAnnouncement('poker_fold', `${heroName} braces!`, {
            subtitle: 'They yield the round',
            duration: 1800
          });
        }

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
        if (COMBAT_DEBUG.AI) debug.error('[AI Effect] ERROR:', error);
        debug.warn('[AI Effect] SmartAI failed, using emergency fallback decision');

        try {
          const fallbackAdapter = getPokerCombatAdapterState();
          const fallbackState = fallbackAdapter.combatState;

          if (fallbackState && fallbackState.activePlayerId === aiPlayerId) {
            const aiPlayer = fallbackState.opponent;
            const aiHP = aiPlayer.pet.stats.currentHealth;
            const betToCall = Math.max(0, fallbackState.currentBet - aiPlayer.hpCommitted);
            const hasBet = betToCall > 0;

            let fallbackAction: CombatAction;
            let fallbackBetAmount = 0;

            if (hasBet && aiHP < betToCall) {
              fallbackAction = CombatAction.BRACE;
            } else if (!hasBet) {
              fallbackAction = CombatAction.DEFEND;
            } else {
              fallbackAction = CombatAction.ENGAGE;
            }

            debug.warn('[AI Effect] Fallback decision:', fallbackAction);
            fallbackAdapter.performAction(aiPlayerId, fallbackAction, fallbackBetAmount);

            setTimeout(() => {
              const adapterAfterFallback = getPokerCombatAdapterState();
              if (adapterAfterFallback.combatState &&
                  adapterAfterFallback.combatState.player.isReady &&
                  adapterAfterFallback.combatState.opponent.isReady &&
                  adapterAfterFallback.combatState.phase !== CombatPhase.RESOLUTION) {
                adapterAfterFallback.maybeCloseBettingRound();
              }
              aiResponseInProgressRef.current = false;
            }, 100);
          } else {
            aiResponseInProgressRef.current = false;
          }
        } catch (fallbackError) {
          debug.error('[AI Effect] Fallback also failed:', fallbackError);
          aiResponseInProgressRef.current = false;
        }
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
      combatState?.isAllInShowdown, isActive, aiResponseInProgressRef, cardGameMulliganActive]);
}
