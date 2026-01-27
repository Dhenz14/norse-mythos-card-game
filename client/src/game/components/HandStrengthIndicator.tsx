import React, { useMemo } from 'react';
import { PokerCard, PokerHandRank, HAND_RANK_NAMES } from '../types/PokerCombatTypes';
import { findBestHand } from '../combat/modules/HandEvaluator';

interface HandStrengthIndicatorProps {
  holeCards: PokerCard[];
  communityCards: PokerCard[];
}

const STRENGTH_COLORS: Record<PokerHandRank, string> = {
  [PokerHandRank.HIGH_CARD]: '#6b7280',
  [PokerHandRank.RUNE_MARK]: '#60a5fa',
  [PokerHandRank.DUAL_RUNES]: '#3b82f6',
  [PokerHandRank.THORS_HAMMER]: '#22c55e',
  [PokerHandRank.FATES_PATH]: '#10b981',
  [PokerHandRank.ODINS_EYE]: '#8b5cf6',
  [PokerHandRank.VALHALLAS_BLESSING]: '#a855f7',
  [PokerHandRank.GODLY_POWER]: '#f59e0b',
  [PokerHandRank.DIVINE_ALIGNMENT]: '#ef4444',
  [PokerHandRank.RAGNAROK]: '#fbbf24',
};

const STRENGTH_PERCENT: Record<PokerHandRank, number> = {
  [PokerHandRank.HIGH_CARD]: 10,
  [PokerHandRank.RUNE_MARK]: 25,
  [PokerHandRank.DUAL_RUNES]: 40,
  [PokerHandRank.THORS_HAMMER]: 50,
  [PokerHandRank.FATES_PATH]: 60,
  [PokerHandRank.ODINS_EYE]: 70,
  [PokerHandRank.VALHALLAS_BLESSING]: 80,
  [PokerHandRank.GODLY_POWER]: 90,
  [PokerHandRank.DIVINE_ALIGNMENT]: 95,
  [PokerHandRank.RAGNAROK]: 100,
};

export const HandStrengthIndicator: React.FC<HandStrengthIndicatorProps> = ({
  holeCards,
  communityCards
}) => {
  const evaluation = useMemo(() => {
    if (holeCards.length < 2) return null;
    return findBestHand(holeCards, communityCards);
  }, [holeCards, communityCards]);

  if (!evaluation) return null;

  const color = STRENGTH_COLORS[evaluation.rank] || '#6b7280';
  const percent = STRENGTH_PERCENT[evaluation.rank] || 10;
  const handName = HAND_RANK_NAMES[evaluation.rank] || 'Unknown';

  return (
    <div className="hand-strength-indicator">
      <div className="hand-strength-label">{handName}</div>
      <div className="hand-strength-bar">
        <div 
          className="hand-strength-fill"
          style={{ 
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`
          }}
        />
      </div>
    </div>
  );
};
