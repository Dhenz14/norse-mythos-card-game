import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePokerCombatStore } from '../combat/PokerCombatStore';
import { CombatPhase } from '../types/PokerCombatTypes';
import './PhaseTimer.css';

const PHASE_DURATIONS: Record<CombatPhase, number> = {
  [CombatPhase.MULLIGAN]: 30,
  [CombatPhase.SPELL_PET]: 60,
  [CombatPhase.FAITH]: 45,
  [CombatPhase.FORESIGHT]: 45,
  [CombatPhase.DESTINY]: 45,
  [CombatPhase.RESOLUTION]: 10
};

const PHASE_ICONS: Record<CombatPhase, string> = {
  [CombatPhase.MULLIGAN]: '🔄',
  [CombatPhase.SPELL_PET]: '🐾',
  [CombatPhase.FAITH]: '🃏',
  [CombatPhase.FORESIGHT]: '👁️',
  [CombatPhase.DESTINY]: '⚡',
  [CombatPhase.RESOLUTION]: '⚔️'
};

const PHASE_NAMES: Record<CombatPhase, string> = {
  [CombatPhase.MULLIGAN]: 'Mulligan',
  [CombatPhase.SPELL_PET]: 'Play Cards',
  [CombatPhase.FAITH]: 'Faith',
  [CombatPhase.FORESIGHT]: 'Foresight',
  [CombatPhase.DESTINY]: 'Destiny',
  [CombatPhase.RESOLUTION]: 'Resolution'
};

interface PhaseTimerProps {
  showPhaseAnnouncement?: boolean;
}

export function PhaseTimer({ showPhaseAnnouncement = true }: PhaseTimerProps) {
  const combatState = usePokerCombatStore(state => state.combatState);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [phaseStartTime, setPhaseStartTime] = useState<number>(Date.now());
  const [showingPhaseChange, setShowingPhaseChange] = useState(false);
  const [previousPhase, setPreviousPhase] = useState<CombatPhase | null>(null);
  
  const currentPhase = combatState?.phase || CombatPhase.MULLIGAN;
  const phaseDuration = PHASE_DURATIONS[currentPhase];
  
  useEffect(() => {
    if (previousPhase !== currentPhase) {
      setPreviousPhase(currentPhase);
      setPhaseStartTime(Date.now());
      setTimeRemaining(phaseDuration);
      
      if (showPhaseAnnouncement && phaseDuration > 0) {
        setShowingPhaseChange(true);
        const timer = setTimeout(() => setShowingPhaseChange(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPhase, previousPhase, phaseDuration, showPhaseAnnouncement]);
  
  useEffect(() => {
    if (phaseDuration <= 0) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - phaseStartTime) / 1000);
      const remaining = Math.max(0, phaseDuration - elapsed);
      setTimeRemaining(remaining);
    }, 100);
    
    return () => clearInterval(interval);
  }, [phaseStartTime, phaseDuration]);
  
  if (!combatState || phaseDuration <= 0) {
    return null;
  }
  
  const progressPercent = (timeRemaining / phaseDuration) * 100;
  const isLowTime = timeRemaining <= 10;
  const isCriticalTime = timeRemaining <= 5;
  
  return (
    <>
      <div className={`phase-timer ${isLowTime ? 'low-time' : ''} ${isCriticalTime ? 'critical' : ''}`}>
        <div className="phase-info">
          <span className="phase-icon">{PHASE_ICONS[currentPhase]}</span>
          <span className="phase-name">{PHASE_NAMES[currentPhase]}</span>
        </div>
        
        <div className="timer-display">
          <div className="timer-bar-container">
            <motion.div 
              className="timer-bar"
              initial={{ width: '100%' }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className={`timer-seconds ${isCriticalTime ? 'pulse' : ''}`}>
            {timeRemaining}s
          </span>
        </div>
      </div>
      
      <AnimatePresence>
        {showingPhaseChange && (
          <motion.div
            className="phase-announcement"
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -20 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          >
            <span className="announcement-icon">{PHASE_ICONS[currentPhase]}</span>
            <span className="announcement-text">{PHASE_NAMES[currentPhase]}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
