/**
 * Enhanced Card component with Hearthstone-style drag and drop
 * 
 * This component is responsible for card dragging behaviors and transformations.
 * Uses flat card design with hover preview system (no 3D tilt effects).
 */
import { debug } from '../config/debugConfig';
import React, { useRef, useEffect, useState } from 'react';
import { CardInstance } from '../types';
import { Position } from '../types/Position';
import { CardInstanceWithCardData, isCardInstanceWithCardData } from '../types/interfaceExtensions';
import { CardDragAnimation } from './CardDragAnimation';
import { playSound } from '../utils/soundUtils';
import { ACTIVE_CARD_RENDERER } from '../utils/cards/cardRenderingRegistry';
import { fixCardRenderingIssues } from '../utils/cardRenderingSystemFix';
import { getCardDataSafely } from '../utils/cards/cardInstanceAdapter';
import { useCardTransform } from '../hooks/useCardTransform';
import CardRenderer from './CardRendering/CardRenderer';
import './CardHoverEffects.css';

interface CardWithDragProps {
  card: CardInstance | CardInstanceWithCardData;
  isInHand: boolean;
  isPlayable: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: (wasDropped: boolean, position: Position) => void;
  onValidDrop?: (position: Position) => void;
  boardRef: React.RefObject<HTMLDivElement>;
  registerPosition: (card: CardInstance | CardInstanceWithCardData, position: Position) => void;
  className?: string;
  attackBuff?: number;
  healthBuff?: number;
}

export const CardWithDrag: React.FC<CardWithDragProps> = ({
  card,
  isInHand,
  isPlayable,
  onClick,
  onDragStart,
  onDragEnd,
  onValidDrop,
  boardRef,
  registerPosition,
  className = "",
  attackBuff = 0,
  healthBuff = 0
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [isHovering, setIsHovering] = useState(false);
  
  const hasCardProperty = isCardInstanceWithCardData(card);
  
  const cardData = hasCardProperty ? card.card : card;
  
  if (!card) {
    debug.error('CardWithDrag received null card data');
    return null;
  }

  const getStableCardId = (): string => {
    if ('instanceId' in card && card.instanceId) {
      return card.instanceId;
    }
    if (hasCardProperty && card.card?.id) {
      return `card-${card.card.id}`;
    }
    if ('id' in card && card.id) {
      return `card-${card.id}`;
    }
    const name = hasCardProperty ? card.card?.name : (card as any).name;
    const manaCost = hasCardProperty ? card.card?.manaCost : (card as any).manaCost;
    return `card-${name || 'unknown'}-${manaCost || 0}`;
  };
  const cardId = getStableCardId();
  
  const { 
    transformState, 
    setHovering,
    setDragging,
    transformStyle
  } = useCardTransform({
    cardId,
    elementRef: cardRef,
    initialState: {
      isPlayable,
      glowIntensity: isPlayable ? 0.5 : 0
    },
    isInHand,
    isOnBoard: !isInHand
  });
  
  const isDragging = transformState.isDragging;
  
  useEffect(() => {
    fixCardRenderingIssues();
    
    if (cardRef?.current) {
      cardRef.current.setAttribute('data-card-component', 'CardWithDrag');
      cardRef.current.setAttribute('data-active-renderer', ACTIVE_CARD_RENDERER);
    }
  }, []);

  const processedCard = getCardDataSafely(card);
  
  const handleClick = () => {
    if (onClick && isPlayable) {
      playSound('card_hover');
      onClick();
    }
  };

  const handleHoverChange = (hovering: boolean) => {
    if (isInHand || isPlayable || !hovering) {
      setIsHovering(hovering);
      setHovering(hovering, { hoverSource: 'direct' });
      
      if (hovering && isPlayable) {
        playSound('card_hover');
      }
    }
  };

  const handleOnDragStart = () => {
    setDragging(true);
    if (onDragStart) onDragStart();
  };

  const handleOnDragEnd = (wasDropped: boolean, position: Position) => {
    setDragging(false);
    if (onDragEnd) onDragEnd(wasDropped, position);
  };

  return (
    <CardDragAnimation
      cardRef={cardRef}
      card={processedCard}
      isPlayable={isPlayable}
      onDragStart={handleOnDragStart}
      onDragEnd={handleOnDragEnd}
      onValidDrop={onValidDrop}
      boardRef={boardRef}
      disabled={!isPlayable}
      onHoverChange={handleHoverChange}
    >
      <div 
        ref={cardRef} 
        className={`card-with-drag hand-card-flat ${className} ${isPlayable ? 'playable' : 'not-playable'} ${isDragging ? 'is-dragging' : ''} ${isHovering ? 'is-hovering' : ''}`}
        style={{
          width: 'var(--card-width, 140px)',
          height: 'var(--card-height, 200px)',
          filter: isPlayable ? 'brightness(1.05)' : 'brightness(0.6) grayscale(0.3)',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out, filter 0.2s ease',
          transformStyle: 'flat',
          position: 'relative',
          transform: isHovering && !isDragging ? 'translateY(-12px)' : 'translateY(0)',
          pointerEvents: isInHand || isPlayable ? 'auto' : 'none',
          cursor: isPlayable ? 'grab' : 'default',
          zIndex: isDragging ? 9999 : isHovering ? 100 : 'auto'
        }}
        data-card-id={processedCard.id || (hasCardProperty ? card.card?.id : undefined)}
        data-is-dragging={isDragging ? 'true' : 'false'}
        data-is-hovering={isHovering ? 'true' : 'false'}
        data-is-in-hand={isInHand ? 'true' : 'false'}
        data-is-playable={isPlayable ? 'true' : 'false'}
      >
        <CardRenderer
          card={processedCard}
          isInHand={isInHand}
          isPlayable={isPlayable}
          isHighlighted={isHovering || isDragging}
          scale={1.0}
          onClick={handleClick}
          onHover={() => {}}
          use3D={false}
          className="flat-card-container"
          renderQuality="high"
          cardId={cardId}
          attackBuff={attackBuff}
          healthBuff={healthBuff}
        />
      </div>
    </CardDragAnimation>
  );
};

export default CardWithDrag;
