import React from 'react';
import { motion } from 'framer-motion';
import { CardInstance } from '../types';
import { SimpleCard, SimpleCardData } from './SimpleCard';
import './mulligan.css';

interface MulliganCardProps {
  card: CardInstance;
  isSelected: boolean;
  onClick: () => void;
}

export const MulliganCard: React.FC<MulliganCardProps> = ({ card, isSelected, onClick }) => {
  const cardData = card?.card;

  if (!cardData) {
    return (
      <div className="mulligan-card-placeholder">
        <span className="mulligan-card-placeholder-text">Loading…</span>
      </div>
    );
  }

  const cardDataTyped = cardData as any;
  const simpleCardData: SimpleCardData = {
    id: cardData.id || 0,
    name: cardData.name || 'Unknown',
    manaCost: cardData.manaCost || 0,
    attack: cardDataTyped.attack,
    health: cardDataTyped.health,
    description: cardData.description || '',
    type: (cardData.type as 'minion' | 'spell' | 'weapon') || 'minion',
    rarity: (cardData.rarity as 'common' | 'rare' | 'epic' | 'legendary') || 'common',
    tribe: cardDataTyped.tribe || cardDataTyped.race,
    cardClass: (cardDataTyped.cardClass || cardDataTyped.class),
    keywords: cardData.keywords || []
  };

  return (
    <motion.div
      className="mulligan-card-wrapper"
      animate={isSelected ? { scale: 0.93, y: 6 } : { scale: 1, y: 0 }}
      whileHover={isSelected ? {} : { scale: 1.06, y: -8 }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      onClick={onClick}
    >
      <SimpleCard
        card={simpleCardData}
        size="large"
        showDescription={true}
        onClick={onClick}
      />

      {isSelected && (
        <motion.div
          className="mulligan-card-selected-overlay"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          <div className="mulligan-card-x-badge">✕</div>
          <span className="mulligan-card-replace-label">Replace</span>
        </motion.div>
      )}
    </motion.div>
  );
};
