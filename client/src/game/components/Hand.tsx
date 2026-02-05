/**
 * Hand Component
 * 
 * Renders the player's hand of cards with premium 3D effects.
 * Uses the card adapter pattern to ensure consistent data handling
 * between different parts of the application.
 * 
 * Uses slot-based layout system from SlotLayout.css for professional TCG styling.
 */
import React, { useRef, useEffect, useMemo, useState } from 'react';
import { CardInstance, CardData } from '../types';
import { playSound } from '../utils/soundUtils';
import { debug } from '../config/debugConfig';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';
import { adaptCardInstance } from '../utils/cards/cardInstanceAdapter';
import DirectCardDrag from './DirectCardDrag';
import CardWithDrag from './CardWithDrag';
import { Position } from '../types/Position';
import CardHoverPreview from './CardHoverPreview';
import { useHandArc, getHandCardStyle } from '../hooks/useHandArc';

// Props for the Hand component
interface HandProps {
  cards: CardInstance[];
  currentMana: number;
  isPlayerTurn: boolean;
  onCardPlay?: (card: CardInstance, position?: Position) => void;
  isInteractionDisabled?: boolean;
  registerCardPosition?: (card: CardInstance, position: Position) => void;
  battlefieldRef: React.RefObject<HTMLDivElement>; // Required - battlefield ref for drop detection
}

/**
 * Hand component displays the player's current hand of cards
 */
export const Hand: React.FC<HandProps> = ({
  cards: originalCards,
  currentMana,
  isPlayerTurn,
  onCardPlay,
  isInteractionDisabled = false,
  registerCardPosition,
  battlefieldRef // Add this parameter to receive the battlefield reference
}) => {
  // Track which card is being hovered for preview and mouse position
  const [hoveredCard, setHoveredCard] = useState<CardData | null>(null);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Debug the props being passed to Hand component
  debug.log('🎯 Hand component render:', {
    cardsCount: originalCards?.length || 0,
    currentMana,
    isPlayerTurn,
    isInteractionDisabled,
    hasCards: originalCards && originalCards.length > 0,
    cardsArray: originalCards
  });
  
  // Force initialization if no cards
  useEffect(() => {
    if (!originalCards || originalCards.length === 0) {
      debug.log('🔧 Hand is empty - checking game initialization');
    }
  }, [originalCards]);

  // Convert all cards to the premium format using the adapter
  const adaptedCards = useMemo(() => {
    return originalCards.map(card => {
      // Type guard to ensure we have the correct card structure
      if ('instanceId' in card && 'card' in card) {
        return card as CardInstanceWithCardData;
      }
      return adaptCardInstance(card as CardInstance);
    });
  }, [originalCards]);
  
  // Reference to hand container for position calculations
  const handContainerRef = useRef<HTMLDivElement>(null);
  const prevCardCount = useRef<number>(0);
  
  // Play sound when cards are added to hand
  useEffect(() => {
    if (adaptedCards.length > prevCardCount.current) {
      playSound('card_draw');
    }
    prevCardCount.current = adaptedCards.length;
  }, [adaptedCards.length]);
  
  // Handle card play - accepts optional position from drag-drop
  const handleCardPlay = (card: CardInstanceWithCardData, position?: Position) => {
    debug.log('[Hand.handleCardPlay] Called with:', {
      cardInstanceId: card.instanceId,
      cardId: card.card.id,
      cardName: card.card.name,
      hasOnCardPlay: !!onCardPlay
    });
    
    if (!onCardPlay) {
      debug.log('[Hand.handleCardPlay] No onCardPlay callback!');
      return;
    }
    
    // Find the original card in the array
    const originalCard = originalCards.find(c => 
      (card.instanceId === (c as any).instanceId) || 
      (card.card.id === (c as any).card?.id)
    );
    
    debug.log('[Hand.handleCardPlay] Original card found:', !!originalCard, originalCard?.instanceId);
    
    if (originalCard) {
      playSound('card_play');
      onCardPlay(originalCard, position);
    } else {
      debug.error('[Hand.handleCardPlay] Could not find original card!');
    }
  };
  
  // Calculate and register card position
  // Uses the central position calculation from useCardPositions hook
  const calculateCardPosition = (cardElement: HTMLElement, card: CardInstanceWithCardData) => {
    if (!cardElement || !registerCardPosition) return;
    
    // Find original card to register
    const originalCard = originalCards.find(c => 
      (card.instanceId === (c as any).instanceId) || 
      (card.card.id === (c as any).card?.id)
    );
    
    if (originalCard && cardElement) {
      // Use a consistent position calculation approach
      const rect = cardElement.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      // Register with the central store
      registerCardPosition(originalCard, position);
    }
  };
  
  // Use the professional hand arc calculator for card positioning from SlotLayout system
  const handArcTransforms = useHandArc(adaptedCards.length);

  return (
    <div className="tcg-zone zone-player-hand">
      {adaptedCards.length === 0 ? (
        <div className="text-amber-200 text-sm italic mb-5">
          Your hand is empty. End turn to draw a card.
        </div>
      ) : (
        <div 
          ref={handContainerRef}
          className="hand-container" 
          data-card-count={adaptedCards.length}
          style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
        >
          {adaptedCards.map((card, index) => {
            if (!card || !card.card) {
              debug.error("Invalid card data in hand:", card);
              return null;
            }
            
            const manaCost = card.card?.manaCost || 0;
            
            // Proper playability check: affordable cards only
            const canPlay = isPlayerTurn && 
                           !isInteractionDisabled && 
                           manaCost <= currentMana;
            
            // Use the professional hand arc transform system
            const transform = handArcTransforms[index];
            const isHovered = hoveredCardIndex === index;
            const cardStyle = transform ? getHandCardStyle(transform, isHovered) : {};
            
            return (
              <div 
                key={card.instanceId || card.card.id}
                className={`hand-card-wrapper ${canPlay ? 'playable' : ''}`}
                style={{ 
                  '--card-offset-x': `${transform?.xOffset || 0}px`,
                  '--card-offset-y': `${transform?.yOffset || 0}px`,
                  '--card-rotation': `${transform?.rotation || 0}deg`,
                  '--card-z': transform?.zIndex || 10
                } as React.CSSProperties}
                ref={(el) => {
                  if (el && registerCardPosition) {
                    calculateCardPosition(el, card);
                  }
                }}
                data-card-id={card.card.id}
                data-card-instance-id={card.instanceId}
                data-card-name={card.card.name}
                data-can-play={canPlay ? 'true' : 'false'}
                onMouseEnter={(e) => {
                  setHoveredCard(card.card);
                  setHoveredCardIndex(index);
                  setMousePos({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                onMouseLeave={() => {
                  setHoveredCard(null);
                  setHoveredCardIndex(null);
                }}
              >
                <CardWithDrag 
                  card={card}
                  isInHand={true}
                  isPlayable={canPlay}
                  onClick={canPlay ? () => handleCardPlay(card) : undefined}
                  onValidDrop={canPlay ? (position) => {
                    debug.log("🎯 Card dropped on battlefield:", card.card.name, "at position:", position);
                    handleCardPlay(card, position);
                  } : undefined}
                  boardRef={battlefieldRef}
                  registerPosition={registerCardPosition || (() => {})}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {/* Card hover preview - shows full description on hover */}
      {hoveredCard && <CardHoverPreview card={hoveredCard} mousePosition={mousePos} />}
    </div>
  );
};

export default Hand;