import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardInstance, MulliganState } from '../types';
import { MulliganCard } from './MulliganCard';
import { useGameStore } from '../stores/gameStore';
import { UnifiedCardTooltip, TooltipCardData } from './ui/UnifiedCardTooltip';
import './mulligan.css';

interface MulliganScreenProps {
  mulligan: MulliganState;
  playerHand: CardInstance[];
  onMulliganAction: (newState: any) => void;
}

export const MulliganScreen: React.FC<MulliganScreenProps> = ({
  mulligan,
  playerHand,
  onMulliganAction
}) => {
  const toggleMulliganCard = useGameStore(state => state.toggleMulliganCard);
  const confirmMulliganChoice = useGameStore(state => state.confirmMulligan);
  const skipMulliganChoice = useGameStore(state => state.skipMulligan);

  const [hoveredCard, setHoveredCard] = useState<TooltipCardData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const handleCardHoverEnter = useCallback((card: CardInstance, e: React.MouseEvent) => {
    const cd = card?.card as any;
    if (!cd) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredCard({
      id: cd.id || 0,
      name: cd.name || 'Unknown',
      manaCost: cd.manaCost || 0,
      attack: cd.attack,
      health: cd.health,
      description: cd.description || '',
      type: cd.type || 'minion',
      rarity: cd.rarity || 'common',
      tribe: cd.tribe || cd.race,
      cardClass: cd.cardClass || cd.class,
      keywords: cd.keywords || []
    });
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
  }, []);

  const handleCardHoverLeave = useCallback(() => {
    setHoveredCard(null);
    setTooltipPosition(null);
  }, []);

  if (!mulligan || !mulligan.active) return null;

  const handleCardClick = (card: CardInstance) => {
    toggleMulliganCard(card.instanceId);
  };

  const selectedCount = Object.values(mulligan.playerSelections).filter(Boolean).length;
  const validPlayerHand = playerHand.filter(card => card && card.card);
  const isWaiting = mulligan.playerReady;

  return (
    <AnimatePresence>
      <motion.div
        className="mulligan-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Decorative rune rings */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="mulligan-ring mulligan-ring-large"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="mulligan-ring mulligan-ring-small"
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <motion.div
          className="mulligan-container"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="mulligan-header">
            <motion.h2
              className="mulligan-title"
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 20 }}
            >
              Mulligan
            </motion.h2>
            <motion.p
              className="mulligan-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              Choose cards to replace with new ones from your deck
            </motion.p>
          </div>

          {/* Cards row */}
          <div className="mulligan-cards-row">
            {validPlayerHand.map((card, i) => (
              <motion.div
                key={card.instanceId}
                initial={{ y: 80, opacity: 0, rotateY: -15 }}
                animate={{ y: 0, opacity: 1, rotateY: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <MulliganCard
                  card={card}
                  isSelected={!!mulligan.playerSelections[card.instanceId]}
                  onClick={() => handleCardClick(card)}
                  onMouseEnter={(e) => handleCardHoverEnter(card, e)}
                  onMouseLeave={handleCardHoverLeave}
                />
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <motion.div
            className="mulligan-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.35 }}
          >
            <button
              type="button"
              className="mulligan-btn mulligan-btn-keep"
              onClick={skipMulliganChoice}
            >
              Keep All
            </button>
            <button
              type="button"
              className={`mulligan-btn mulligan-btn-replace${selectedCount > 0 ? ' has-selection' : ''}`}
              onClick={confirmMulliganChoice}
            >
              {selectedCount === 0
                ? 'Confirm (Keep All)'
                : `Replace ${selectedCount} Card${selectedCount > 1 ? 's' : ''}`}
            </button>
          </motion.div>

          {/* Waiting indicator */}
          <AnimatePresence>
            {isWaiting && (
              <motion.div
                className="mulligan-waiting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mulligan-waiting-dots">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="mulligan-waiting-dot"
                      animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, delay: i * 0.18, repeat: Infinity }}
                    />
                  ))}
                </div>
                <span className="mulligan-waiting-label">Waiting for opponent…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <UnifiedCardTooltip
          card={hoveredCard}
          position={tooltipPosition}
          visible={!!hoveredCard}
          placement="above"
        />
      </motion.div>
    </AnimatePresence>
  );
};
