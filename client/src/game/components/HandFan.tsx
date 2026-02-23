/**
 * HandFan Component - Clean Hearthstone-style hand display
 * 
 * Self-contained component using CSS variables for responsive sizing.
 * Uses flexbox with negative margins for tight overlapping fan effect.
 */
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { CardInstance, CardData } from '../types';
import { playSound } from '../utils/soundUtils';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';
import { adaptCardInstance } from '../utils/cards/cardInstanceAdapter';
import CardWithDrag from './CardWithDrag';
import { Position } from '../types/Position';
import CardHoverPreview from './CardHoverPreview';
import { useElementalBuff } from '../combat/hooks/useElementalBuff';
import './HandFan.css';

interface HandFanProps {
  cards: CardInstance[];
  currentMana: number;
  isPlayerTurn: boolean;
  onCardPlay?: (card: CardInstance, position?: Position) => void;
  isInteractionDisabled?: boolean;
  registerCardPosition?: (card: CardInstance, position: Position) => void;
  battlefieldRef: React.RefObject<HTMLDivElement>;
}

const MAX_ROTATION = 4;
const MAX_Y_OFFSET = 15;

export const HandFan: React.FC<HandFanProps> = ({
  cards: originalCards,
  currentMana,
  isPlayerTurn,
  onCardPlay,
  isInteractionDisabled = false,
  registerCardPosition,
  battlefieldRef
}) => {
  const [hoveredCard, setHoveredCard] = useState<CardData | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const prevCardCount = useRef<number>(0);

  const elementalBuff = useElementalBuff();
  const atkBuff = elementalBuff.playerBuff?.attackBonus ?? 0;
  const hpBuff = elementalBuff.playerBuff?.healthBonus ?? 0;

  const adaptedCards = useMemo(() => {
    return originalCards.map(card => {
      if ('instanceId' in card && 'card' in card) {
        return card as CardInstanceWithCardData;
      }
      return adaptCardInstance(card as CardInstance);
    });
  }, [originalCards]);

  useEffect(() => {
    if (adaptedCards.length > prevCardCount.current) {
      playSound('card_draw');
    }
    prevCardCount.current = adaptedCards.length;
  }, [adaptedCards.length]);

  const handleCardPlay = (card: CardInstanceWithCardData, position?: Position) => {
    if (!onCardPlay) return;
    
    const originalCard = originalCards.find(c => 
      (card.instanceId === (c as any).instanceId) || 
      (card.card.id === (c as any).card?.id)
    );
    
    if (originalCard) {
      playSound('card_play');
      onCardPlay(originalCard, position);
    }
  };

  const cardCount = adaptedCards.length;
  const centerIndex = (cardCount - 1) / 2;

  const getCardTransform = (index: number): React.CSSProperties => {
    const offset = index - centerIndex;
    const normalizedOffset = cardCount > 1 ? offset / centerIndex : 0;
    
    const rotation = normalizedOffset * MAX_ROTATION;
    const yOffset = Math.abs(normalizedOffset) * MAX_Y_OFFSET;
    
    return {
      transform: `translateY(${yOffset}px) rotate(${rotation}deg)`,
      zIndex: 10 + index
    };
  };

  if (adaptedCards.length === 0) {
    return (
      <div className="hand-fan-container">
        <div className="hand-fan-empty">
          Your hand is empty. End turn to draw a card.
        </div>
      </div>
    );
  }

  // Calculate dynamic positioning for Hearthstone-style spread effect
  const getCardStyle = (index: number): React.CSSProperties => {
    const baseTransform = getCardTransform(index);
    const isHovered = hoveredIndex === index;
    const springTransition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
    const smoothTransition = 'transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)';
    
    // Hovered card gets lifted and scaled - z-index must exceed betting zone (200)
    if (isHovered) {
      return {
        zIndex: 9000,
        transform: 'translateY(-55px) scale(1.25) rotate(0deg)',
        transition: springTransition
      };
    }
    
    // When a card is hovered, push ALL other cards with weighted distance
    if (hoveredIndex !== null) {
      const distance = index - hoveredIndex; // Signed distance (negative = left, positive = right)
      const absDistance = Math.abs(distance);
      
      // Push cards with decreasing intensity based on distance (up to 3 cards away)
      if (absDistance > 0 && absDistance <= 3) {
        const pushDirection = distance < 0 ? -1 : 1;
        // Weighted push: closer cards push more (35px for adjacent, 20px for 2nd, 10px for 3rd)
        const pushAmounts = [0, 35, 20, 10];
        const pushAmount = pushDirection * pushAmounts[absDistance];
        
        return {
          ...baseTransform,
          transform: `${baseTransform.transform} translateX(${pushAmount}px)`,
          transition: smoothTransition
        };
      }
    }
    
    return {
      ...baseTransform,
      transition: smoothTransition
    };
  };

  return (
    <div className="hand-fan-container" style={hoveredIndex !== null ? { zIndex: 9000, position: 'relative' } : undefined}>
      {adaptedCards.map((card, index) => {
        if (!card || !card.card) return null;
        
        const manaCost = card.card?.manaCost || 0;
        const canPlay = isPlayerTurn && !isInteractionDisabled && manaCost <= currentMana;
        const isHovered = hoveredIndex === index;
        
        return (
          <div
            key={card.instanceId || card.card.id}
            className={`hand-fan-card ${canPlay ? 'playable' : ''} ${isHovered ? 'is-hovered' : ''}`}
            style={getCardStyle(index)}
            onDoubleClick={() => { if (canPlay) handleCardPlay(card); }}
            onMouseEnter={(e) => {
              setHoveredCard(card.card);
              setHoveredIndex(index);
              setMousePos({ x: e.clientX, y: e.clientY });
            }}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => {
              setHoveredCard(null);
              setHoveredIndex(null);
            }}
          >
            <CardWithDrag
              card={card}
              isInHand={true}
              isPlayable={canPlay}
              onClick={canPlay ? () => handleCardPlay(card) : undefined}
              onValidDrop={canPlay ? (position) => handleCardPlay(card, position) : undefined}
              boardRef={battlefieldRef}
              registerPosition={registerCardPosition || (() => {})}
              attackBuff={card.card?.type === 'minion' ? atkBuff : 0}
              healthBuff={card.card?.type === 'minion' ? hpBuff : 0}
            />
          </div>
        );
      })}
      
      {hoveredCard && <CardHoverPreview card={hoveredCard} mousePosition={mousePos} />}
    </div>
  );
};

export default HandFan;
