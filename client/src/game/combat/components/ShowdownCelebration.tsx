import React, { useEffect, useRef } from 'react';
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
  };
  onComplete: () => void;
}

export const ShowdownCelebration: React.FC<ShowdownCelebrationProps> = ({
  resolution,
  onComplete
}) => {
  const isShowdown = resolution.resolutionType === 'showdown';
  const celebrationDuration = isShowdown ? 2000 : 1200; // Fast auto-dismiss
  
  // Use ref to avoid callback identity changes resetting the timer
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, celebrationDuration);

    return () => clearTimeout(timer);
  }, [celebrationDuration]); // Only depend on duration, not callback

  const getWinnerText = () => {
    if (resolution.winner === 'draw') return 'Draw!';
    return resolution.winner === 'player' ? '🏆 Victory!' : 'Defeat';
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
      const damage = resolution.whoFolded === 'player' 
        ? resolution.playerDamage 
        : resolution.opponentDamage;
      return `-${damage} HP`;
    }
    const damage = resolution.winner === 'player' 
      ? resolution.opponentDamage 
      : resolution.playerDamage;
    return damage > 0 ? `-${damage} HP` : '';
  };

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
