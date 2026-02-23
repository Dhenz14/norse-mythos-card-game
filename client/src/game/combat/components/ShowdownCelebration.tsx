import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PokerCard } from '../../types/PokerCombatTypes';
import { getCombinedHandName } from '../../types/PokerCombatTypes';

interface ShowdownCelebrationProps {
  resolution: {
    winner: 'player' | 'opponent' | 'draw';
    resolutionType: 'showdown' | 'fold';
    playerHand: { rank: number; cards: PokerCard[] };
    opponentHand: { rank: number; cards: PokerCard[] };
    playerDamage: number;
    opponentDamage: number;
    playerFinalHealth: number;
    opponentFinalHealth: number;
    whoFolded?: 'player' | 'opponent';
    foldPenalty?: number;
  };
  onComplete: () => void;
}

const ENTRANCE_DELAY = 400;

export const ShowdownCelebration: React.FC<ShowdownCelebrationProps> = ({
  resolution,
  onComplete
}) => {
  const isShowdown = resolution.resolutionType === 'showdown';
  const celebrationDuration = isShowdown ? 3200 : 2800;
  const [ready, setReady] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Brief delay before appearing so phase banner can clear
  useEffect(() => {
    const delayTimer = setTimeout(() => setReady(true), ENTRANCE_DELAY);
    return () => clearTimeout(delayTimer);
  }, []);

  // Auto-dismiss after celebration duration (starts when visible)
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, celebrationDuration);
    return () => clearTimeout(timer);
  }, [ready, celebrationDuration]);

  const getWinnerText = () => {
    if (resolution.winner === 'draw') return 'Draw!';
    return resolution.winner === 'player' ? 'Victory!' : 'Defeat';
  };

  const getHandName = () => {
    if (!isShowdown) {
      return resolution.whoFolded === 'opponent' ? 'Opponent Folded!' : 'You Folded';
    }
    const winningHand = resolution.winner === 'player'
      ? resolution.playerHand
      : resolution.opponentHand;
    return getCombinedHandName(winningHand.rank);
  };

  const getDamageText = () => {
    if (resolution.winner === 'draw') return '';
    if (resolution.resolutionType === 'fold') {
      const hpLost = resolution.foldPenalty ?? 0;
      if (hpLost > 0) {
        const loserName = resolution.whoFolded === 'player' ? 'You' : 'Opponent';
        return `${loserName} lost ${hpLost} HP`;
      }
      return '';
    }
    const damage = resolution.winner === 'player'
      ? resolution.opponentDamage
      : resolution.playerDamage;
    return damage > 0 ? `-${damage} HP` : '';
  };

  if (!ready) return null;

  return (
    <AnimatePresence>
      <div className="showdown-celebration-container">
        <motion.div
          className={`winner-badge ${resolution.winner === 'player' ? 'player-side' : resolution.winner === 'opponent' ? 'opponent-side' : 'center'}`}
          initial={{ opacity: 0, scale: 0.5, y: resolution.winner === 'player' ? 50 : resolution.winner === 'opponent' ? -50 : 0 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            duration: 0.5
          }}
        >
          <div className="winner-badge-text">{getWinnerText()}</div>
          {isShowdown && (
            <motion.div
              className="winner-hand-name"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {getHandName()}
            </motion.div>
          )}
          {!isShowdown && (
            <motion.div
              className="fold-message"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {getHandName()}
            </motion.div>
          )}
          {getDamageText() && (
            <motion.div
              className="damage-text"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {getDamageText()}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          className="celebration-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </AnimatePresence>
  );
};

export default ShowdownCelebration;
