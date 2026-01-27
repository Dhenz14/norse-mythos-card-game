import React from 'react';
import { CombatPhase } from '../types/PokerCombatTypes';

interface PhaseProgressBarProps {
  currentPhase: CombatPhase;
}

const PHASES: { phase: CombatPhase; label: string }[] = [
  { phase: CombatPhase.FAITH, label: '' },
  { phase: CombatPhase.FORESIGHT, label: '' },
  { phase: CombatPhase.DESTINY, label: '' },
];

export const PhaseProgressBar: React.FC<PhaseProgressBarProps> = ({ currentPhase }) => {
  const currentIndex = PHASES.findIndex(p => p.phase === currentPhase);
  
  return (
    <div className="phase-progress-bar">
      {PHASES.map((p, idx) => {
        const isActive = idx === currentIndex;
        const isComplete = idx < currentIndex;
        
        return (
          <React.Fragment key={p.phase}>
            <div className={`phase-node ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
              <div className="phase-dot" />
              <span className="phase-label">{p.label}</span>
            </div>
            {idx < PHASES.length - 1 && (
              <div className={`phase-connector ${isComplete ? 'complete' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
