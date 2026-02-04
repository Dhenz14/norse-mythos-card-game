/**
 * TripoSRCardIntegration Component
 * 
 * This component serves as the integration layer between the game's card data
 * and the 3D rendering system inspired by TripoSR research.
 * 
 * It manages:
 * - Card state transformation from game data to 3D model
 * - Advanced rendering techniques for maximum quality
 * - Interaction events (hover, click, drag)
 * - Animation transitions
 * - Performance optimizations
 * 
 * No simplifications are made in the rendering pipeline to ensure
 * the highest visual fidelity possible.
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { animated } from 'react-spring';
import * as THREE from 'three';
import SimpleHolographicCard, { getStandardHolographicParams } from './SimpleHolographicCard';
import { CardData, CardInstance } from '../types';
import { useCardTransform } from '../hooks/useCardTransform';
import { cardTransformManager } from '../utils/cards/CardTransformationManager';
import HexagonBadge from '../../components/HexagonBadge';

// Card interaction state
interface CardInteractionState {
  isHovering: boolean;
  isSelected: boolean;
  isAnimating: boolean;
  isDragging: boolean;
  dragPosition: { x: number; y: number } | null;
}

// Component props
interface TripoSRCardIntegrationProps {
  // Card data can be either a data object or an instance in the game
  card: CardInstance | CardData;
  
  // Card identification - used for transformation management
  cardId?: string;
  
  // Visual configuration
  scale?: number;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  
  // Interaction handlers
  onHover?: (isHovering: boolean) => void;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  
  // Animation options
  animationEnabled?: boolean;
  animationSpeed?: number;
  
  // Special states
  isPlayable?: boolean;
  isTargetable?: boolean;
  isHighlighted?: boolean;
  isInHand?: boolean;
  forceHighlighted?: boolean; // Force the highlighted state from the parent
  
  // Card state in game
  health?: number; 
  attack?: number;
  manaCost?: number;
  
  // Container options
  className?: string;
  style?: React.CSSProperties;
  
  // Additional options
  renderQuality?: 'high' | 'medium' | 'low';
  showDebugInfo?: boolean;
  forceCanvasReplacement?: boolean;
  use3D?: boolean;
  holographicParams?: any; // Params for SimpleHolographicCard
}

/**
 * Integration component for the TripoSR-inspired 3D card rendering system
 */
export const TripoSRCardIntegration: React.FC<TripoSRCardIntegrationProps> = ({
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
  isInHand = false,
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
  // References to DOM elements and canvas
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use our professional card transformation hook instead of local state
  const cardId = useMemo(() => {
    // Generate a stable unique ID for this card instance
    if ((card as any).instanceId) {
      return (card as any).instanceId;
    } else if ((card as any).id) {
      return `card-${(card as any).id}-${Math.random().toString(36).substring(7)}`;
    } else {
      return `card-${Math.random().toString(36).substring(7)}`;
    }
  }, [card]);
  
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
  
  // For backward compatibility, mimic the old interactionState
  const interactionState = {
    isHovering: transformState.isHovering,
    isSelected: transformState.isSelected,
    isAnimating: transformState.isAnimating,
    isDragging: transformState.isDragging,
    dragPosition: null
  };
  
  // DISABLED: No longer handling direct mouse events in TripoSRCardIntegration
  // This fixes the duplicate hover detection issue by centralizing hover in CardWithDrag
  // Hover detection now happens ONLY at the CardWithDrag level
  const handleMouseEnter = () => {
    // We no longer directly set hovering state here
    // This is controlled by the parent CardWithDrag component
    
    // Still call the callback in case other components need to know
    if (onHover) {
      onHover(true);
    }
  };
  
  const handleMouseLeave = () => {
    // We no longer directly set hovering state here
    // This is controlled by the parent CardWithDrag component
    
    // Still call the callback in case other components need to know
    if (onHover) {
      onHover(false);
    }
  };
  
  const handleClick = () => {
    if (onClick && !interactionState.isAnimating && !interactionState.isDragging) {
      // Use cardTransformManager directly to set animation state
      cardTransformManager.updateCardState(cardId, { isAnimating: true });
      onClick();
      
      // Reset animation state after a short delay
      setTimeout(() => {
        cardTransformManager.updateCardState(cardId, { isAnimating: false });
      }, 500);
    }
  };
  
  // Visual scaling factor - maintain full 300x420 render quality
  // but visually scale to precisely fit the display context
  // Hand: 50% scale (300px → 150px) 
  // Battlefield: 70% scale (300px → 210px) to match Hearthstone's smaller battlefield cards
  const visualScaleFactor = isInHand ? 0.5 : scale || 1.0;
  
  // We no longer need the spring animation as we're using the CardTransformationManager
  // This ensures a single source of truth for all card transforms
  
  // Get card properties for rendering - handling both direct card objects and card instance objects
  const cardData = (card as any).card || card; // If card has a nested card property, use that, otherwise use the card directly
  const cardName = cardData.name || 'Card';
  const cardType = cardData.type || 'minion';
  // Card attack and health, from props or from card data
  const displayAttack = attack !== undefined ? attack : cardData.attack;
  const displayHealth = health !== undefined ? health : cardData.health || (card as any).currentHealth; // Try currentHealth as a fallback
  const displayManaCost = manaCost !== undefined ? manaCost : cardData.manaCost;
  
  // Card rarity information - use the cardData object to get rarity
  const cardRarity = (cardData.rarity || 'common').toLowerCase();
  const isLegendary = cardRarity === 'legendary';
  const isEpic = cardRarity === 'epic';
  
  // Determine if we should show the compact view (for cards in hand)
  const isCompactView = isInHand && !interactionState.isHovering;
  
  // Container style with positioning - 100% EXACT MATCH with test environment
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '300px',  // EXACT width from test environment (300px in MinimalCardTest.tsx)
    height: '420px', // EXACT height from test environment (420px in MinimalCardTest.tsx)
    // Apply special styling based on card state with more prominent Norse-themed glow effects
    boxShadow: isPlayable 
      ? '0 0 15px rgba(120, 255, 120, 0.8), 0 0 30px rgba(0, 255, 0, 0.4)' // Enhanced playable glow
      : isTargetable 
        ? '0 0 15px rgba(255, 120, 120, 0.8), 0 0 30px rgba(255, 0, 0, 0.4)' // Enhanced targetable glow
        : isHighlighted 
          ? '0 0 15px rgba(255, 255, 120, 0.8), 0 0 30px rgba(255, 255, 0, 0.4)' // Enhanced highlight glow
          : isLegendary 
            ? '0 0 25px rgba(255, 215, 0, 0.7), 0 0 10px rgba(255, 215, 0, 0.4)' // Special legendary ambient glow
            : isEpic
              ? '0 0 25px rgba(163, 53, 238, 0.7), 0 0 10px rgba(163, 53, 238, 0.4)' // Amplified epic glow to match legendary size
              : '0 0 25px rgba(0, 112, 221, 0.7), 0 0 10px rgba(0, 112, 221, 0.4)', // Added ambient glow for common/rare to match legendary size
    transformStyle: 'preserve-3d', // Force 3D context preservation
    transform: 'translateZ(5px)', // Consistently elevate all cards to the same Z level for consistent sizing
    willChange: 'transform', // Signal to browser for optimization
    isolation: 'isolate', // Create a new stacking context
    perspective: '1200px', // EXACT match with test simulation's perspective value
    backfaceVisibility: 'hidden', // Prevent flickering
    borderRadius: '8px', // EXACT match with test simulation (8px in MinimalCardTest.tsx)
    overflow: 'hidden', // Changed to hidden to prevent hover detection extending beyond card boundaries
    ...style
  };
  
  return (
    // Visual scaling wrapper to maintain full 300x420 render quality
    // but fit within the hand UI by scaling visually
    <div style={{
      transform: `scale(${visualScaleFactor})`,
      transformOrigin: 'center bottom',
      display: 'inline-block',
    }}>
      <animated.div
        ref={containerRef}
        className={`triposr-card-container ${className}`}
        style={{
          ...containerStyle,
          // Use our professional card transform style from the manager
          ...cardTransformStyle,
          // Apply any additional card-specific styles
          boxShadow: transformState.isHovering
            ? '0 0 20px rgba(0, 0, 0, 0.5)'
            : containerStyle.boxShadow,
          // Critical for proper stacking when hovering
          zIndex: transformState.isHovering ? 1000 : transformState.zIndex,
          // Override existing pointer events to allow interactions when popped up
          pointerEvents: 'auto'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            position: 'relative',
            perspective: '1000px', // Add perspective for better 3D look
            transformStyle: 'preserve-3d',
            transition: 'transform 0.3s ease' // EXACT match with MinimalCardTest.tsx
          }}
          data-card-id={(card as any).id}
          data-card-name={cardName}
          data-card-type={cardType}
          data-rendering-mode={use3D ? '3d' : '2d'}
        >
          {/* Card Rendering - ONLY use SimpleHolographicCard without manual text/stat overlays */}
          {use3D ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Use 100% IDENTICAL properties as in MinimalCardTest for perfect matching */}
              <SimpleHolographicCard 
                card={{
                  id: typeof (card as any).id === 'string' ? parseInt((card as any).id, 10) : ((card as any).id as number),
                  name: cardName,
                  manaCost: displayManaCost || 0,
                  attack: displayAttack,
                  health: displayHealth,
                  type: cardType,
                  // Rarity is critical for display, ensure it's always a valid value
                  rarity: cardRarity || 'common',
                  class: cardData.class || "Neutral",
                  description: cardData.description || ""
                }}
                // Apply holographic parameters based on card rarity
                enableHolographic={true}
                forceHolographic={isLegendary || isEpic}
                effectIntensity={isLegendary ? 1.0 : isEpic ? 0.9 : 0.4}
                // CRITICAL: Pass the hover state from the parent down to SimpleHolographicCard
                // This ensures we use a single source of truth for hover state
                forceHoverState={transformState.isHovering}
                {...(holographicParams || getStandardHolographicParams(cardRarity))}
                showDebugOverlay={false}
              />

              {/* Only add a minimal, non-intrusive border to indicate gameplay state */}
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
                  borderRadius: '8px', // EXACT match with test cards
                  boxShadow: `0 0 10px ${
                    isPlayable ? 'rgba(34, 197, 94, 0.5)' : 
                    isTargetable ? 'rgba(239, 68, 68, 0.5)' : 
                    isHighlighted ? 'rgba(234, 179, 8, 0.5)' : 'transparent'
                  }`,
                  pointerEvents: 'none',
                  zIndex: 10 // Lower z-index so it doesn't interfere with holographic effects
                }}/>
              )}
            </div>
          ) : (
            <div className="card-2d-fallback" style={{ 
              width: '100%', 
              height: '100%', 
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              borderRadius: '8px',
              border: '2px solid #f59e0b',
              boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              textAlign: 'center',
              padding: '10px',
              position: 'relative'
            }}>
              {/* Mana cost */}
              {displayManaCost !== undefined && (
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  left: '5px',
                  width: '25px',
                  height: '25px',
                  borderRadius: '50%',
                  backgroundColor: '#1e40af',
                  border: '2px solid #42a5f5',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}>
                  {displayManaCost}
                </div>
              )}
              
              {/* Card name */}
              <div style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                {cardName}
              </div>
              
              {/* Card art space */}
              <div style={{
                margin: '5px 0',
                width: '80%',
                height: '40px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '4px'
              }}></div>
              
              {/* Card description */}
              <div style={{ 
                fontSize: '12px', 
                marginTop: '5px',
                padding: '2px 5px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                overflow: 'visible',
                wordWrap: 'break-word'
              }}>
                {cardData.description || 'No description'}
              </div>
              
              {/* Attack/Health stats - Now using HexagonBadge for consistent styling */}
              {displayAttack !== undefined && displayHealth !== undefined && (
                <div style={{ 
                  marginTop: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0 10px'
                }}>
                  <HexagonBadge 
                    value={displayAttack} 
                    color="#f8b700" 
                    position="left" 
                    size={28} 
                    style={{ position: 'relative' }} 
                  />
                  <HexagonBadge 
                    value={displayHealth} 
                    color="#e61610"
                    position="right" 
                    size={28} 
                    style={{ position: 'relative' }} 
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Card Stats Overlay (optional) */}
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
              <div>Type: {cardType}</div>
              <div>Rarity: {cardRarity}</div>
              {displayAttack !== undefined && displayHealth !== undefined && (
                <div>Stats: {displayAttack}/{displayHealth}</div>
              )}
              {displayManaCost !== undefined && (
                <div>Cost: {displayManaCost}</div>
              )}
            </div>
          )}
        </div>
      </animated.div>
    </div>
  );
};