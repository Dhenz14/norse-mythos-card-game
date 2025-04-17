import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CardData } from '../types';
import { Position } from '../types/Position';
import { CardInstanceWithCardData, getCardData } from '../types/interfaceExtensions';
import { CardInstance } from '../../types/cards';
import { TripoSRCardIntegration } from './TripoSRCardIntegration';
import BattlefieldCardIntegration from './BattlefieldCardIntegration';
import OptimizedBattlefieldIntegration from './OptimizedBattlefieldIntegration';
import BoardRippleEffect from '../animations/BoardRippleEffect';
import { motion } from 'framer-motion';
import { adaptCardInstance, adaptCardInstances } from '../utils/cardInstanceAdapter';
import { ACTIVE_CARD_RENDERER } from '../utils/cardRenderingRegistry';
import { fixCardRenderingIssues } from '../utils/cardRenderingSystemFix';
import { getStandardHolographicParams } from './SimpleHolographicCard';

// Track which cards have recently been played to trigger ripple effects
interface RippleEffect {
  id: string;
  position: Position;
  element: string;
  strength: 'normal' | 'powerful' | 'legendary';
  timestamp: number;
}

interface BattlefieldProps {
  playerCards: CardInstanceWithCardData[];
  opponentCards: CardInstanceWithCardData[];
  onCardClick?: (card: CardInstanceWithCardData) => void;
  onOpponentCardClick?: (card: CardInstanceWithCardData) => void;
  onOpponentHeroClick?: () => void;
  attackingCard: CardInstanceWithCardData | null;
  isPlayerTurn: boolean;
  isHeroPowerTargetMode?: boolean;
  isBattlecryTargetMode?: boolean;
  selectedCardName?: string;
  registerCardPosition?: (card: CardInstanceWithCardData, position: Position) => void;
  isInteractionDisabled?: boolean;
}

// Helper to determine element type and effect strength
const getCardAttributes = (card: CardData) => {
  // Default values
  let element = 'neutral';
  let strength: 'normal' | 'powerful' | 'legendary' = 'normal';
  
  // Determine element based on class
  if (card.class) {
    switch(card.class) {
      case 'Mage':
        element = 'frost';
        break;
      case 'Warlock':
        element = 'shadow';
        break;
      case 'Druid':
        element = 'nature';
        break;
      case 'Priest':
        element = 'holy';
        break;
      default:
        element = 'neutral';
    }
  }
  
  // Determine strength based on rarity
  if (card.rarity) {
    switch(card.rarity.toLowerCase()) {
      case 'legendary':
        strength = 'legendary';
        break;
      case 'epic':
      case 'rare':
        strength = 'powerful';
        break;
      default:
        strength = 'normal';
    }
  }
  
  return { element, strength };
};



export const Battlefield: React.FC<BattlefieldProps> = ({
  playerCards: rawPlayerCards,
  opponentCards: rawOpponentCards,
  onCardClick,
  onOpponentCardClick,
  onOpponentHeroClick,
  attackingCard: rawAttackingCard,
  isPlayerTurn,
  isHeroPowerTargetMode = false,
  isBattlecryTargetMode = false,
  selectedCardName,
  registerCardPosition,
  isInteractionDisabled = false
}) => {
  // Adapt incoming card data to ensure it works with the premium card system
  // Added robust error handling and filtering of invalid cards
  const playerCards = useMemo(() => {
    try {
      console.log("DEBUG Battlefield - Player cards before filtering:", rawPlayerCards?.length);
      console.log("DEBUG Battlefield - Player cards raw data:", JSON.stringify(rawPlayerCards));
      
      // Check if rawPlayerCards is null or undefined
      if (!rawPlayerCards) {
        console.error("ERROR: rawPlayerCards is null or undefined");
        return [];
      }
      
      // Check if it's an array
      if (!Array.isArray(rawPlayerCards)) {
        console.error("ERROR: rawPlayerCards is not an array:", typeof rawPlayerCards);
        return [];
      }
      
      const filtered = (rawPlayerCards as any[])
        .filter(card => card); // Filter out null/undefined cards
      console.log("DEBUG Battlefield - Player cards after filtering:", filtered?.length);
      
      if (filtered.length > 0) {
        console.log("DEBUG Battlefield - First player card:", JSON.stringify(filtered[0]));
      }
      
      const adapted = filtered.map(card => {
        try {
          return adaptCardInstance(card);
        } catch (err) {
          console.error("Error adapting a specific player card:", err, card);
          // Return a simplified version of the card if adaptation fails
          return card;
        }
      });
      console.log("DEBUG Battlefield - Player cards after adapting:", adapted?.length);
      return adapted;
    } catch (error) {
      console.error("Error adapting player cards:", error);
      return [];
    }
  }, [rawPlayerCards]);
  
  const opponentCards = useMemo(() => {
    try {
      return (rawOpponentCards as any[])
        .filter(card => card) // Filter out null/undefined cards
        .map(card => adaptCardInstance(card));
    } catch (error) {
      console.error("Error adapting opponent cards:", error);
      return [];
    }
  }, [rawOpponentCards]);
  
  const attackingCard = useMemo(() => {
    try {
      return rawAttackingCard ? adaptCardInstance(rawAttackingCard as any) : null;
    } catch (error) {
      console.error("Error adapting attacking card:", error);
      return null;
    }
  }, [rawAttackingCard]);
  // Reference to the battlefield element for position calculations
  const battlefieldRef = useRef<HTMLDivElement>(null);
  
  // Track ripple effects
  const [rippleEffects, setRippleEffects] = useState<RippleEffect[]>([]);
  
  // Track board shake effects
  const [isShaking, setIsShaking] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  // Track hover states for player and opponent cards
  const [hoveredPlayerCardId, setHoveredPlayerCardId] = useState<string | null>(null);
  const [hoveredOpponentCardId, setHoveredOpponentCardId] = useState<string | null>(null);
  
  // Track when a card is being dragged (for visual feedback)
  const [isDraggingOverBattlefield, setIsDraggingOverBattlefield] = useState(false);
  
  // Listen for global drag events
  useEffect(() => {
    const handleDragStart = () => {
      console.log("Card drag start detected in Battlefield");
    };
    
    const handleDragEnd = () => {
      // When drag ends, make sure to reset the dragging state
      setIsDraggingOverBattlefield(false);
      console.log("Card drag end detected in Battlefield");
    };
    
    // Track mouse position during dragging to highlight battlefield
    const handleMouseMove = (e: MouseEvent) => {
      if (battlefieldRef.current) {
        const battlefieldRect = battlefieldRef.current.getBoundingClientRect();
        const playerBattlefield = battlefieldRef.current.querySelector('.player-battlefield-zone');
        
        // Add tolerance area (same as in card drag component)
        const toleranceX = battlefieldRect.width * 0.05;
        const toleranceY = battlefieldRect.height * 0.05;
        
        // Check if mouse is over the battlefield (with tolerance)
        const isOverBattlefield = 
          e.clientX >= (battlefieldRect.left - toleranceX) && 
          e.clientX <= (battlefieldRect.right + toleranceX) &&
          e.clientY >= (battlefieldRect.top - toleranceY) && 
          e.clientY <= (battlefieldRect.bottom + toleranceY);
          
        // Only update if we have a player battlefield element and player's turn
        if (playerBattlefield && isPlayerTurn) {
          setIsDraggingOverBattlefield(isOverBattlefield);
        }
      }
    };
    
    window.addEventListener('card-drag-start', handleDragStart);
    window.addEventListener('card-drag-end', handleDragEnd);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('card-drag-start', handleDragStart);
      window.removeEventListener('card-drag-end', handleDragEnd);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [battlefieldRef, isPlayerTurn]);
  
  // Previously seen cards to detect new ones
  const prevPlayerCardsRef = useRef<string[]>([]);
  const prevOpponentCardsRef = useRef<string[]>([]);
  
  // Apply card rendering fixes
  useEffect(() => {
    // Apply system-wide rendering fixes to ensure consistent card display
    fixCardRenderingIssues();
    
    // Mark this component for debugging purposes
    if (battlefieldRef?.current) {
      battlefieldRef.current.setAttribute('data-card-component', 'Battlefield');
      battlefieldRef.current.setAttribute('data-active-renderer', ACTIVE_CARD_RENDERER);
    }
  }, []);

  // Check for newly played cards
  useEffect(() => {
    // Get current card IDs
    const currentPlayerIds = playerCards.map(card => card.instanceId);
    const currentOpponentIds = opponentCards.map(card => card.instanceId);
    
    // Find new cards (played this render)
    const newPlayerCards = playerCards.filter(
      card => !prevPlayerCardsRef.current.includes(card.instanceId)
    );
    
    const newOpponentCards = opponentCards.filter(
      card => !prevOpponentCardsRef.current.includes(card.instanceId)
    );
    
    // Create ripple effects for new cards
    if (newPlayerCards.length > 0 || newOpponentCards.length > 0) {
      const newEffects: RippleEffect[] = [];
      
      // Process new player cards
      newPlayerCards.forEach(card => {
        if (!card.animationPosition) return;
        
        const { element, strength } = getCardAttributes(card.card);
        
        newEffects.push({
          id: `ripple-${card.instanceId}`,
          position: card.animationPosition,
          element,
          strength,
          timestamp: Date.now()
        });
        
        // Add board shake for powerful/legendary cards
        if (strength === 'legendary') {
          setIsShaking(true);
          setShakeIntensity(5);
          setTimeout(() => setIsShaking(false), 1000);
        } else if (strength === 'powerful') {
          setIsShaking(true);
          setShakeIntensity(3);
          setTimeout(() => setIsShaking(false), 700);
        }
      });
      
      // Process new opponent cards
      newOpponentCards.forEach(card => {
        if (!card.animationPosition) return;
        
        const { element, strength } = getCardAttributes(card.card);
        
        newEffects.push({
          id: `ripple-${card.instanceId}`,
          position: card.animationPosition,
          element,
          strength,
          timestamp: Date.now()
        });
        
        // Add board shake for powerful/legendary cards
        if (strength === 'legendary') {
          setIsShaking(true);
          setShakeIntensity(5);
          setTimeout(() => setIsShaking(false), 1000);
        } else if (strength === 'powerful') {
          setIsShaking(true);
          setShakeIntensity(3);
          setTimeout(() => setIsShaking(false), 700);
        }
      });
      
      // Add new ripple effects
      if (newEffects.length > 0) {
        setRippleEffects(prev => [...prev, ...newEffects]);
      }
    }
    
    // Clean up old ripple effects
    setRippleEffects(prev => 
      prev.filter(effect => Date.now() - effect.timestamp < 3000)
    );
    
    // Update previous card lists
    prevPlayerCardsRef.current = currentPlayerIds;
    prevOpponentCardsRef.current = currentOpponentIds;
  }, [playerCards, opponentCards]);
  
  return (
    <div className="battlefield-area battlefield-container w-full h-full min-h-[300px] relative flex justify-center items-center z-index-base battlefield-spacing" ref={battlefieldRef}>
      {/* Hearthstone-style wooden battlefield with stone/paper center */}
      <motion.div 
        className={`w-full h-full max-w-full lg:max-w-full xl:max-w-full 2xl:max-w-full mx-auto rounded-lg overflow-hidden game-area-padding 
          ${isHeroPowerTargetMode ? 'battlefield-targeting-hero-power' : ''} 
          ${isBattlecryTargetMode ? 'battlefield-targeting-battlecry' : ''} 
          transition-colors relative`}
        animate={isShaking ? {
          x: [-shakeIntensity, shakeIntensity, -shakeIntensity/2, shakeIntensity/2, 0],
          y: [shakeIntensity, -shakeIntensity/2, shakeIntensity/2, -shakeIntensity, 0]
        } : {}}
        transition={isShaking ? { 
          duration: 0.5, 
          ease: "easeOut" 
        } : {}}
      >
        {/* Fancy wooden board background with paper-like center */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900 to-amber-800">
          {/* Paper/Stone center area */}
          <div className="absolute inset-x-8 inset-y-4 bg-amber-200 rounded-lg opacity-50"></div>
          
          {/* Dynamic board shadows */}
          <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
        </div>
        
        {/* Ripple effects container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-index-cards">
          {rippleEffects.map(effect => (
            <BoardRippleEffect
              key={effect.id}
              position={effect.position}
              elementType={effect.element as any}
              strength={effect.strength}
              onComplete={() => {
                // Remove this effect when animation completes
                setRippleEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          ))}
        </div>
        
        <div className="relative z-index-cards p-4 flex flex-col justify-between h-full" style={{ minHeight: "520px" }}>
          {/* Hero power targeting indicator */}
          {isHeroPowerTargetMode && (
            <div className="mb-3 bg-purple-900 bg-opacity-70 p-2 rounded-md text-center">
              <span className="text-purple-200 font-semibold">Select a target for your hero power</span>
            </div>
          )}
          
          {/* Battlecry targeting indicator */}
          {isBattlecryTargetMode && (
            <div className="mb-3 bg-yellow-900 bg-opacity-70 p-2 rounded-md text-center">
              <span className="text-yellow-200 font-semibold">
                Select a target for {selectedCardName}'s battlecry
              </span>
            </div>
          )}
        
          {/* Opponent's battlefield */}
          <div className="opponent-area opponent-battlefield-zone mb-2 pb-2 border-b border-amber-800 border-opacity-30 flex-grow-0">
            <div 
              className="card-container opponent-cards"
              data-card-count={opponentCards.length}
              style={{ zIndex: 20 }}
            >
              {opponentCards.length === 0 ? (
                <div className="empty-battlefield"></div>
              ) : (
                opponentCards.map((card, index) => (
                  <div 
                    key={card.instanceId}
                    className={`transform transition-transform hover:scale-105 ${opponentCards.length >= 4 ? 'mx-0' : 'm-1'} ${
                      isHeroPowerTargetMode 
                        ? 'cursor-pointer card-targeting-hero-power' 
                        : isBattlecryTargetMode
                          ? 'cursor-pointer card-targeting-battlecry animate-pulse' 
                          : attackingCard 
                            ? 'cursor-pointer card-targeting-attack' 
                            : ''
                    }`}
                    ref={(el) => {
                      // Register this card's position when the element is mounted
                      if (el && registerCardPosition) {
                        const rect = el.getBoundingClientRect();
                        const position = {
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2
                        };
                        registerCardPosition(card, position);
                      }
                    }}
                    onMouseEnter={() => setHoveredOpponentCardId(card.instanceId)}
                    onMouseLeave={() => setHoveredOpponentCardId(null)}
                    style={{ zIndex: 30 }} /* Explicit z-index for opponent cards */
                  >
                    <OptimizedBattlefieldIntegration
                      card={card}
                      isInHand={false}
                      isPlayable={!isInteractionDisabled && (attackingCard !== null || isHeroPowerTargetMode || isBattlecryTargetMode)}
                      isHighlighted={attackingCard !== null || isHeroPowerTargetMode || isBattlecryTargetMode}
                      scale={1.5} /* Significantly increased scale to match demo cards */
                      holographicParams={getStandardHolographicParams()} /* Use the same holographic parameters as in the test cards */
                      onClick={() => {
                        console.log("DEBUG Battlefield - Opponent card clicked:", card.card?.name);
                        if (!isInteractionDisabled && onOpponentCardClick) {
                          onOpponentCardClick(card);
                        }
                      }}
                      onHover={(isHovering) => {
                        console.log("DEBUG Battlefield - Opponent card hovered:", card.card?.name, isHovering);
                      }}
                      // This is the key change - using externalIsHovering to control hover state from parent
                      externalIsHovering={hoveredOpponentCardId === card.instanceId}
                      use3D={false} /* Disable 3D for battlefield cards to ensure proper rendering */
                      className="battlefield-card opponent-card"
                      style={{
                        filter: (attackingCard !== null || isHeroPowerTargetMode || isBattlecryTargetMode) ? 'brightness(1.2)' : 'brightness(0.95)',
                        zIndex: 30,
                      }}
                    />
                  </div>
                ))
              )}
            </div>
            
            {/* Opponent's hero - Always visible, can be attacked directly or targeted with hero power */}
            <div className="flex flex-col items-center mt-2 mb-1 opponent-hero-container">
              <div 
                onClick={() => !isInteractionDisabled && onOpponentHeroClick && (attackingCard || isHeroPowerTargetMode) && onOpponentHeroClick()}
                className={`w-20 h-20 rounded-full bg-gradient-to-br from-red-700 to-red-900 border-4 flex items-center justify-center shadow-lg opponent-hero-portrait ${(!isInteractionDisabled && (attackingCard || isHeroPowerTargetMode)) ? 'cursor-pointer' : 'cursor-default'} transform transition-all ${(attackingCard || isHeroPowerTargetMode) ? 'hover:scale-110' : ''} ${
                  isHeroPowerTargetMode 
                    ? 'border-purple-500 hover:border-purple-300 shadow-purple-500/50' 
                    : (attackingCard)
                      ? 'border-red-600 hover:border-yellow-400 shadow-yellow-400/30'
                      : 'border-red-800 opacity-90'
                }`}
              >
                <span className="text-white font-bold text-lg">ENEMY</span>
              </div>
              <span className="text-amber-200 text-xs mt-1 font-medium hero-label">Opponent's Hero</span>
            </div>
          </div>
          
          {/* Player's battlefield */}
          <div className={`player-area player-battlefield-zone mt-0 pt-2 border-t border-amber-800 border-opacity-30 flex-grow ${isDraggingOverBattlefield ? 'drag-target-active' : ''}`}>
            <div 
              className="card-container player-cards"
              data-card-count={playerCards.length}
              style={{ zIndex: 20, minHeight: "120px", display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
              {playerCards.length === 0 ? (
                <div className="empty-battlefield"></div>
              ) : (
                playerCards.map((card, index) => (
                  <div 
                    key={card.instanceId}
                    className={`transform transition-transform hover:scale-105 ${playerCards.length >= 4 ? 'mx-0' : 'm-1'} ${
                      attackingCard?.instanceId === card.instanceId 
                        ? 'card-attacking scale-110' 
                        : isBattlecryTargetMode 
                          ? 'cursor-pointer card-targeting-battlecry animate-pulse'
                          : ''
                    }`}
                    ref={(el) => {
                      // Register this card's position when the element is mounted
                      if (el && registerCardPosition) {
                        const rect = el.getBoundingClientRect();
                        const position = {
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2
                        };
                        registerCardPosition(card, position);
                      }
                    }}
                    onMouseEnter={() => setHoveredPlayerCardId(card.instanceId)}
                    onMouseLeave={() => setHoveredPlayerCardId(null)}
                    style={{ zIndex: 30 }} /* Explicit z-index for player cards */
                  >
                    <OptimizedBattlefieldIntegration
                      card={card}
                      isInHand={false}
                      isPlayable={!isInteractionDisabled && ((isPlayerTurn && !card.isSummoningSick && card.canAttack) || isBattlecryTargetMode)}
                      isHighlighted={attackingCard?.instanceId === card.instanceId}
                      scale={1.5} /* Significantly increased scale to match demo cards */
                      holographicParams={getStandardHolographicParams()} /* Use the same holographic parameters as in the test cards */
                      onClick={() => {
                        console.log("DEBUG Battlefield - Player card clicked:", card.card?.name);
                        if (!isInteractionDisabled && onCardClick) {
                          onCardClick(card);
                        }
                      }}
                      onHover={(isHovering) => {
                        console.log("DEBUG Battlefield - Player card hovered:", card.card?.name, isHovering);
                      }}
                      // This is the key change - using externalIsHovering to control hover state from parent
                      externalIsHovering={hoveredPlayerCardId === card.instanceId}
                      use3D={false} /* Disable 3D for battlefield cards to ensure proper rendering */
                      className="battlefield-card player-card"
                      style={{
                        filter: attackingCard?.instanceId === card.instanceId ? 'brightness(1.3)' : 
                                !isInteractionDisabled && ((isPlayerTurn && !card.isSummoningSick && card.canAttack) || isBattlecryTargetMode) ? 
                                'brightness(1.1)' : 'brightness(0.95)',
                        zIndex: 30, /* Ensure card is visible */
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Battlefield;