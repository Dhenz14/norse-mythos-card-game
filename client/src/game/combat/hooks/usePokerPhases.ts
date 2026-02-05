import { useEffect, useRef } from 'react';
import { CombatPhase, PokerCombatState } from '../../types/PokerCombatTypes';
import { getPokerCombatAdapterState } from '../../hooks/usePokerCombatAdapter';
import { debug } from '../../config/debugConfig';

// SPELL_PET phase duration in milliseconds - time for players to play cards
const SPELL_PET_PHASE_DURATION_MS = 2500;

interface UsePokerPhasesOptions {
  combatState: PokerCombatState | null;
  isActive: boolean;
}

export function usePokerPhases(options: UsePokerPhasesOptions): void {
  const { combatState, isActive } = options;
  const allInAdvanceInProgressRef = useRef(false);
  const spellPetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle SPELL_PET phase - timed window for card playing, then auto-advance to FAITH
  // This phase gives players ~2.5 seconds to play cards/spells before poker betting begins
  useEffect(() => {
    if (!combatState || !isActive) return;
    if (combatState.phase !== CombatPhase.SPELL_PET) return;
    
    // Clear any existing timer
    if (spellPetTimerRef.current) {
      clearTimeout(spellPetTimerRef.current);
      spellPetTimerRef.current = null;
    }
    
    // Calculate remaining time in SPELL_PET phase
    const startTime = combatState.spellPetPhaseStartTime || Date.now();
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, SPELL_PET_PHASE_DURATION_MS - elapsed);
    
    debug.combat('[SPELL_PET Phase] Started, will advance to FAITH in', remainingTime, 'ms');
    
    // Set timer to advance after the timing window
    spellPetTimerRef.current = setTimeout(() => {
      const adapter = getPokerCombatAdapterState();
      const freshState = adapter.combatState;
      
      if (!freshState || freshState.phase !== CombatPhase.SPELL_PET) {
        return;
      }
      
      debug.combat('[SPELL_PET Phase] Timing window complete, advancing to FAITH');
      
      // Mark both players ready and advance to FAITH
      adapter.setPlayerReady(freshState.player.playerId);
      adapter.setPlayerReady(freshState.opponent.playerId);
      adapter.maybeCloseBettingRound();
    }, remainingTime);
    
    return () => {
      if (spellPetTimerRef.current) {
        clearTimeout(spellPetTimerRef.current);
        spellPetTimerRef.current = null;
      }
    };
  }, [combatState?.phase, combatState?.spellPetPhaseStartTime, isActive]);

  // Handle phase transitions when BOTH players are ready
  // This effect delegates to the store's maybeCloseBettingRound helper which
  // enforces strict sequential phase progression: SPELL_PET → FAITH → FORESIGHT → DESTINY → RESOLUTION
  useEffect(() => {
    if (!combatState) return;
    if (combatState.phase === CombatPhase.MULLIGAN) return;
    // NOTE: SPELL_PET is no longer skipped - betting actions in SPELL_PET should trigger phase advancement
    // via maybeCloseBettingRound() just like other betting phases
    
    // Only check for round closure when BOTH players are ready
    if (!combatState.player.isReady || !combatState.opponent.isReady) {
      return;
    }
    
    // Skip RESOLUTION phase - that's handled by the component for UI updates
    if (combatState.phase === CombatPhase.RESOLUTION) {
      return;
    }
    
    // Use the store's maybeCloseBettingRound helper which enforces:
    // 1. Both players ready
    // 2. Bets settled (same HP committed or one all-in)
    // 3. Strict sequential phase ordering
    getPokerCombatAdapterState().maybeCloseBettingRound();
  }, [combatState?.phase, combatState?.player?.isReady, combatState?.opponent?.isReady]);

    // ALL-IN SHOWDOWN: Auto-advance through remaining phases with dramatic delays
    // When both players are all-in, we reveal remaining community cards one by one without further betting
    useEffect(() => {
      if (!combatState || !isActive) return;
      if (!combatState.isAllInShowdown) return;
      
      debug.combat('[All-In Showdown] Active - phase:', combatState.phase, 'playerReady:', combatState.player.isReady, 'opponentReady:', combatState.opponent.isReady);
      
      // Stop when we reach RESOLUTION phase
      if (combatState.phase === CombatPhase.RESOLUTION) {
        debug.combat('[All-In Showdown] Showdown reached, stopping auto-advance');
        return;
      }
      
      if (combatState.phase === CombatPhase.MULLIGAN) return;
      
      // Prevent multiple concurrent auto-advance timers
      if (allInAdvanceInProgressRef.current) {
        debug.combat('[All-In Showdown] SKIP: Auto-advance already in progress');
        return;
      }
      
      allInAdvanceInProgressRef.current = true;
      debug.combat('[All-In Showdown] Starting 1.5s timer to advance from phase:', combatState.phase);
      
      const currentPhase = combatState.phase;
      const autoAdvanceTimer = setTimeout(() => {
        const adapter = getPokerCombatAdapterState();
        const freshState = adapter.combatState;
        
        if (!freshState || freshState.phase !== currentPhase) {
          allInAdvanceInProgressRef.current = false;
          return;
        }
        
        if (!freshState.isAllInShowdown) {
          allInAdvanceInProgressRef.current = false;
          return;
        }
        
        debug.combat('[All-In Showdown] Advancing from phase:', currentPhase);
        
        // Directly call advancePhase for all-in showdown to ensure progression
        // without getting stuck in betting validation logic
        adapter.advancePhase();
        allInAdvanceInProgressRef.current = false;
      }, 1500);
      
      return () => {
        clearTimeout(autoAdvanceTimer);
        allInAdvanceInProgressRef.current = false;
      };
    }, [combatState?.phase, combatState?.isAllInShowdown, isActive]);
}
