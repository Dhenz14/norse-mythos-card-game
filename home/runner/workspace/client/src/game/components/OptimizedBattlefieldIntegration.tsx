/**
 * OptimizedBattlefieldIntegration Component
 * 
 * An enhanced version of BattlefieldCardIntegration that uses the compact BattlefieldCardFrame
 * for cards on the battlefield while maintaining the full card appearance in hand.
 * 
 * Features:
 * - Full 3D cards in hand with holographic effects
 * - Optimized compact cards on battlefield with proper holographic overlays
 * - Proper scaling and responsive design
 * - Support for legendary and epic card special effects
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { animated } from 'react-spring';
import * as THREE from 'three';
import TestCard3D from './3D/TestCard3D';
import SimpleHolographicCard, { getStandardHolographicParams } from './SimpleHolographicCard';
import { CardData, CardInstance } from '../types';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';
import CardFrame from '../../components/CardFrame';
import { useCardTransform } from '../hooks/useCardTransform';
import { cardTransformManager } from '../utils/CardTransformationManager';
import BattlefieldCardFrame from '../../components/BattlefieldCardFrame';
import { Card } from './Card';
import CloudinaryService from '../../lib/cloudinaryService';

// Component props (same as BattlefieldCardIntegration)
interface OptimizedBattlefieldIntegrationProps {
  card: CardInstance | CardData | CardInstanceWithCardData;
  cardId?: string;
  scale?: number;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  onHover?: (isHovering: boolean) => void;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  animationEnabled?: boolean;
  animationSpeed?: number;
  isPlayable?: boolean;
  isTargetable?: boolean;
  isHighlighted?: boolean;
  isInHand?: boolean;
  externalIsHovering?: boolean;
  health?: number; 
  attack?: number;
  manaCost?: number;
  className?: string;
  style?: React.CSSProperties;
  renderQuality?: 'high' | 'medium' | 'low';
  showDebugInfo?: boolean;
  forceCanvasReplacement?: boolean;
  use3D?: boolean;
  holographicParams?: any;
}

/**
 * OptimizedBattlefieldIntegration uses:
 * - Full size 3D card when in hand
 * - Compact BattlefieldCardFrame when on the battlefield
 * - Special holographic effects for legendary and epic cards
 */
export const OptimizedBattlefieldIntegration: React.FC<OptimizedBattlefieldIntegrationProps> = ({
  card,
  scale = 1,
  position,
  rotation,
  onHover,
  onClick,
  onDragStart,
  onDragEnd,
  animationEnabled = true,
  animationSpeed = 1.0,
  isPlayable = false,
  isTargetable = false,
  isHighlighted = false,
  isInHand = true, // Default to hand cards
  externalIsHovering = false,
  health,
  attack,
  manaCost,
  className = '',
  style = {},
  renderQuality = 'high',
  showDebugInfo = false,
  forceCanvasReplacement = false,
  use3D = true,
  holographicParams
}) => {
  // DOM references and state
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardImage, setCardImage] = useState<string | null>(null);
  
  // Generate a stable unique ID for this card instance
  const cardId = useMemo(() => {
    if ((card as any).instanceId) {
      return (card as any).instanceId;
    } else if ((card as any).id) {
      return `card-${(card as any).id}-${Math.random().toString(36).substring(7)}`;
    } else {
      return `card-${Math.random().toString(36).substring(7)}`;
    }
  }, [card]);
  
  // Load the card image
  useEffect(() => {
    const fetchCardImage = async () => {
      try {
        const cardData = (card as any).card || card;
        if (cardData.id) {
          const imageUrl = await CloudinaryService.fetchCardImageUrl(cardData.id);
          if (imageUrl) {
            setCardImage(imageUrl);
          }
        }
      } catch (error) {
        console.error('Error loading card image:', error);
      }
    };
    
    fetchCardImage();
  }, [card]);
  
  // Update hover state based on external control
  useEffect(() => {
    if (externalIsHovering) {
      cardTransformManager.updateCardState(cardId, { isHovering: true });
    } else {
      cardTransformManager.updateCardState(cardId, { isHovering: false });
    }
  }, [externalIsHovering, cardId]);
  
  // Animation transform system
  const { 
    transformState, 
    setHovering, 
    transformStyle: cardTransformStyle 
  } = useCardTransform({
    cardId,
    elementRef: containerRef,
    initialState: {
      isPlayable,
      isInHand,
      isOnBoard: !isInHand,
    }
  });
  
  // Handle click event
  const handleClick = () => {
    if (onClick && !transformState.isAnimating && !transformState.isDragging) {
      cardTransformManager.updateCardState(cardId, { isAnimating: true });
      onClick();
      
      setTimeout(() => {
        cardTransformManager.updateCardState(cardId, { isAnimating: false });
      }, 500);
    }
  };
  
  // Extract card data for rendering
  const cardData = (card as any).card || card;
  const cardName = cardData.name || 'Card';
  const cardType = cardData.type || 'minion';
  const description = cardData.description || '';
  const keywords = cardData.keywords || [];
  
  // Card stat values to display
  const displayAttack = attack !== undefined ? attack : cardData.attack;
  const displayHealth = health !== undefined ? health : cardData.health || (card as any).currentHealth;
  const displayManaCost = manaCost !== undefined ? manaCost : cardData.manaCost;
  
  // Card rarity information for special effects
  const cardRarity = (cardData.rarity || 'common').toLowerCase();
  const isLegendary = cardRarity === 'legendary';
  const isEpic = cardRarity === 'epic';
  
  // Card dimensions (different for hand vs battlefield)
  const cardWidth = isInHand ? 300 : 130;
  const cardHeight = isInHand ? 420 : 170;
  
  // Visual scaling factor (larger on battlefield to match demo)
  const visualScaleFactor = isInHand 
    ? 'var(--hand-card-scale)' 
    : scale || 1.5;
  
  // Determine if we should show full card on hover
  const showFullCardOnHover = !isInHand && externalIsHovering;
  
  // Container style 
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: showFullCardOnHover ? '300px' : `${cardWidth}px`,
    height: showFullCardOnHover ? '420px' : `${cardHeight}px`,
    transformStyle: 'preserve-3d',
    transform: 'translateZ(5px)',
    willChange: 'transform',
    isolation: 'isolate',
    perspective: '1200px',
    backfaceVisibility: 'hidden',
    borderRadius: '10px',
    overflow: 'visible',
    transition: 'width 0.3s ease, height 0.3s ease',
    ...style
  };
  
  return (
    // Visual scaling wrapper
    <div style={{
      transform: `scale(${visualScaleFactor})`,
      transformOrigin: 'center bottom',
      display: 'inline-block',
      transition: 'transform 0.3s ease',
    }}>
      <animated.div
        ref={containerRef}
        className={`optimized-card-container ${className}`}
        style={{
          ...containerStyle,
          ...cardTransformStyle,
          zIndex: externalIsHovering ? 1000 : transformState.zIndex,
          pointerEvents: 'auto'
        }}
        onClick={handleClick}
      >
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.3s ease'
          }}
          data-card-id={(card as any).id}
          data-card-name={cardName}
          data-card-type={cardType}
          data-rendering-mode="optimized"
        >
          {/* Conditional rendering based on where the card is */}
          {(isInHand || showFullCardOnHover) ? (
            // Full 3D card when in hand or when hovering over battlefield card
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <SimpleHolographicCard 
                card={{
                  id: typeof (card as any).id === 'string' ? parseInt((card as any).id, 10) : ((card as any).id as number),
                  name: cardName,
                  manaCost: displayManaCost || 0,
                  attack: displayAttack,
                  health: displayHealth,
                  type: cardType,
                  rarity: cardRarity || 'common',
                  class: cardData.class || "Neutral",
                  description: description || ""
                }}
                enableHolographic={true}  
                forceHolographic={true}
                effectIntensity={1.0}
                {...(holographicParams || getStandardHolographicParams())}
                showDebugOverlay={false}
              />
            </div>
          ) : (
            // Apply holographic wrapper around battlefield card for consistency with demo
            <div style={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
            }}>
              {/* Full card background holographic effect for legendary cards - first layer */}
              {isLegendary && (
                <div 
                  className="full-card-holographic absolute inset-0" 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px',
                    backgroundImage: `url('/textures/foil.png')`,
                    backgroundSize: 'cover',
                    opacity: 0.6,
                    mixBlendMode: 'color-dodge',
                    zIndex: 1,
                    pointerEvents: 'none',
                    filter: 'brightness(1.2) contrast(1.2)'
                  }}
                />
              )}
            
              {/* Full card background holographic effect for epic cards - first layer */}
              {isEpic && (
                <div 
                  className="full-card-holographic epic-holographic-bg absolute inset-0" 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px',
                    backgroundImage: `url('/textures/epic_holographic.png')`,
                    backgroundSize: 'cover',
                    opacity: 0.6,
                    mixBlendMode: 'color-dodge',
                    zIndex: 1,
                    pointerEvents: 'none',
                    filter: 'brightness(1.2) contrast(1.2)'
                  }}
                />
              )}

              {/* Main holographic effect overlay for legendary cards - second layer */}
              {isLegendary && (
                <div 
                  className="holographic-card card-holographic-effect absolute inset-0" 
                  data-rarity="legendary"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url('/textures/foil.png')`,
                    backgroundSize: 'cover',
                    borderRadius: '12px',
                    opacity: 0.75,
                    mixBlendMode: 'color-dodge',
                    zIndex: 3,
                    pointerEvents: 'none',
                    filter: 'brightness(1.3) contrast(1.15)'
                  }}
                />
              )}
              
              {/* Main holographic effect overlay for epic cards - second layer */}
              {isEpic && (
                <div 
                  className="holographic-card card-holographic-effect absolute inset-0" 
                  data-rarity="epic"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url('/textures/epic_holographic.png')`,
                    backgroundSize: 'cover',
                    borderRadius: '12px',
                    opacity: 0.75,
                    mixBlendMode: 'color-dodge',
                    zIndex: 3,
                    pointerEvents: 'none',
                    animation: 'prismatic-shift 8s infinite linear',
                    filter: 'brightness(1.25) contrast(1.15)'
                  }}
                />
              )}
              
              {/* Holographic shimmer overlay for legendary cards - third layer */}
              {isLegendary && (
                <div 
                  className="holographic-overlay absolute inset-0"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 2,
                    pointerEvents: 'none',
                    mixBlendMode: 'overlay',
                    animation: 'shimmer 3s infinite linear',
                    backgroundSize: '200% 100%',
                    borderRadius: '12px',
                    backgroundImage: 'linear-gradient(135deg, rgba(255, 215, 0, 0) 25%, rgba(255, 215, 0, 0.5) 50%, rgba(255, 215, 0, 0) 75%)',
                    filter: 'brightness(1.2)'
                  }}
                />
              )}
              
              {/* Epic card shimmer effect - third layer */}
              {isEpic && (
                <div 
                  className="epic-holographic-overlay absolute inset-0"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 2,
                    pointerEvents: 'none',
                    mixBlendMode: 'overlay',
                    animation: 'shimmer 4s infinite linear',
                    backgroundSize: '200% 100%',
                    borderRadius: '12px',
                    backgroundImage: 'linear-gradient(135deg, rgba(148, 0, 211, 0) 25%, rgba(148, 0, 211, 0.5) 50%, rgba(148, 0, 211, 0) 75%)',
                    filter: 'brightness(1.2)'
                  }}
                />
              )}
              
              {/* Using CardFrame (same as demo) for consistent appearance */}
              <CardFrame 
                name={cardName}
                attack={displayAttack || 0}
                health={displayHealth || 0}
                manaCost={displayManaCost || 0}
                rarity={cardRarity as any}
                imageSrc={cardImage || ''}
                keywords={keywords}
                description={description}
                onClick={handleClick}
                type={cardType || 'minion'}
                use3D={false}
                size="small"
              />
            </div>
          )}
          
          {/* Game state indicators for card */}
          {(isPlayable || isTargetable || isHighlighted) && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: `2px solid ${
                isPlayable ? 'rgba(34, 197, 94, 0.8)' : 
                isTargetable ? 'rgba(239, 68, 68, 0.8)' : 
                isHighlighted ? 'rgba(234, 179, 8, 0.8)' : 'transparent'
              }`,
              borderRadius: '12px',
              boxShadow: `0 0 10px ${
                isPlayable ? 'rgba(34, 197, 94, 0.5)' : 
                isTargetable ? 'rgba(239, 68, 68, 0.5)' : 
                isHighlighted ? 'rgba(234, 179, 8, 0.5)' : 'transparent'
              }`,
              pointerEvents: 'none',
              zIndex: 10
            }}/>
          )}
          
          {/* Debug overlay if enabled */}
          {showDebugInfo && (
            <div style={{
              position: 'absolute',
              bottom: '5px',
              left: '5px',
              right: '5px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '5px',
              fontSize: '10px',
              borderRadius: '2px',
              zIndex: 10
            }}>
              <div>{cardName}</div>
              <div>Location: {isInHand ? 'Hand' : 'Battlefield'}</div>
              <div>Hover: {externalIsHovering ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>
      </animated.div>
    </div>
  );
};

export default OptimizedBattlefieldIntegration;