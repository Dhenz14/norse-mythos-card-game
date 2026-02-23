import React, { useState, useEffect, useRef } from 'react';
import { CombatPhase } from '../../types/PokerCombatTypes';

interface PhaseBannerProps {
  phase: CombatPhase;
}

const PHASE_CONFIG: Partial<Record<CombatPhase, { title: string; subtitle: string }>> = {
  [CombatPhase.PRE_FLOP]: { title: 'PRE-FLOP', subtitle: 'Place your bets' },
  [CombatPhase.FAITH]: { title: 'THE FAITH', subtitle: 'Three cards revealed' },
  [CombatPhase.FORESIGHT]: { title: 'FORESIGHT', subtitle: 'The fourth card' },
  [CombatPhase.DESTINY]: { title: 'DESTINY', subtitle: 'The final card' },
};

export const PhaseBanner: React.FC<PhaseBannerProps> = ({ phase }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [bannerData, setBannerData] = useState<{ title: string; subtitle: string } | null>(null);
  const prevPhaseRef = useRef<CombatPhase>(phase);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    const config = PHASE_CONFIG[phase];
    if (!config) return;

    clearAllTimers();

    setBannerData(config);
    setShowBanner(true);
    setIsVisible(true);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      const removeTimer = setTimeout(() => {
        setShowBanner(false);
        setBannerData(null);
      }, 300);
      timersRef.current.push(removeTimer);
    }, 1700);
    timersRef.current.push(hideTimer);
  }, [phase]);

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  if (!showBanner || !bannerData) return null;

  return (
    <div className={`phase-banner ${isVisible ? 'phase-banner-enter' : 'phase-banner-exit'}`}>
      <div className="phase-banner-content">
        <div className="phase-banner-line" />
        <div className="phase-banner-text">
          <span className="phase-banner-title">{bannerData.title}</span>
          <span className="phase-banner-subtitle">{bannerData.subtitle}</span>
        </div>
        <div className="phase-banner-line" />
      </div>
    </div>
  );
};
