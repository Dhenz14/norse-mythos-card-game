/**
 * CardRenderer.tsx
 * 
 * Clean card rendering component using SimpleCard.
 * No 3D effects, no complex transforms - just clear, readable cards.
 */

import { debug } from '../../config/debugConfig';
import React from 'react';
import { CardData, CardInstance } from '../../types';
import { SimpleCard, SimpleCardData } from '../SimpleCard';
import { getCardDataSafely } from '../../utils/cards/cardInstanceAdapter';

export type CardRenderQuality = 'high' | 'medium' | 'low';

interface CardRendererProps {
  card: CardData | CardInstance;
  isInHand?: boolean;
  isPlayable?: boolean;
  isHighlighted?: boolean; 
  scale?: number;
  onClick?: () => void;
  onHover?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  use3D?: boolean;
  className?: string;
  style?: React.CSSProperties;
  renderQuality?: CardRenderQuality;
  cardId?: string;
  enableHolographic?: boolean;
  forceHolographic?: boolean;
  size?: 'small' | 'medium' | 'large' | 'preview';
}

/**
 * CardRenderer - Clean abstraction for rendering cards using SimpleCard
 */
const CardRenderer: React.FC<CardRendererProps> = ({
  card,
  isInHand = false,
  isPlayable = true,
  isHighlighted = false,
  scale = 1,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
  style = {},
  size = 'medium'
}) => {
  const processedCard = getCardDataSafely(card);
  
  if (!processedCard) {
    debug.warn('CardRenderer: No card data available');
    return null;
  }
  
  const simpleCardData: SimpleCardData = {
    id: processedCard.id || 0,
    name: processedCard.name || 'Unknown',
    manaCost: processedCard.manaCost || 0,
    attack: processedCard.attack,
    health: processedCard.health,
    description: processedCard.description || '',
    type: (processedCard.type as 'minion' | 'spell' | 'weapon') || 'minion',
    rarity: (processedCard.rarity as 'common' | 'rare' | 'epic' | 'legendary') || 'common',
    tribe: processedCard.tribe,
    cardClass: processedCard.cardClass || processedCard.class,
    keywords: processedCard.keywords || [] // Pass keywords for ability icons
  };
  
  const scaleStyle: React.CSSProperties = scale !== 1 ? {
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
    ...style
  } : style;
  
  return (
    <div className={`card-renderer-wrapper ${className}`} style={scaleStyle}>
      <SimpleCard
        card={simpleCardData}
        isPlayable={isPlayable}
        isHighlighted={isHighlighted}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        size={size}
        showDescription={size === 'large' || size === 'preview'}
      />
    </div>
  );
};

export default CardRenderer;
