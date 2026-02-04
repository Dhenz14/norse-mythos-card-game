import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CardData, CardInstance, Position } from '../types';
import './CardEnhancements.css'; // Import enhanced styling
import './FixInvisibleBox.css'; // Import fixes for the invisible box issue
import './styles/CardTextStyles.css'; // Import card text styles
import { formatCardText, getRarityTextStyle } from '../utils/textFormatUtils';
import NorseFrame from './NorseFrame/NorseFrame';
import RaceIcon from './RaceIcon'; // Import the new RaceIcon component
import { KEYWORD_DEFINITIONS } from './ui/UnifiedCardTooltip'; // Centralized keyword definitions
import { isMinion, getAttack, getHealth } from '../utils/cards/typeGuards'; // Type guards for safe property access

// Extend the CardInstance type to include additional properties
declare module '../types' {
  interface CardInstance {
    isGolden?: boolean;
    animationPosition?: { x: number; y: number };
    isPoisonous?: boolean;
  }
}

interface CardProps {
  card: CardData | CardInstance;
  isInHand?: boolean;
  isPlayable?: boolean;
  scale?: number;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void; // Add hover handler
  isHighlighted?: boolean;
  isDraggable?: boolean;
  dragConstraints?: React.RefObject<HTMLDivElement>;
  registerPosition?: (card: CardInstance, position: Position) => void;
  className?: string;
  showDebugInfo?: boolean; // Add debug mode property
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  card,
  scale = 1,
  onClick,
  onHover, // Add the onHover callback
  isInHand = false,
  isPlayable = true,
  isHighlighted = false,
  isDraggable = false,
  dragConstraints,
  registerPosition,
  className = "",
  showDebugInfo = false
}, ref) => {
  // If the card is a CardInstance, extract the CardData from it
  const cardData = 'card' in card ? card.card : card;
  
  // Debug opponent minions attack values
  if ('card' in card && !isInHand) {
    // Only log if we're on the battlefield (not in hand)
    console.log(`Card instance: ${cardData.name}, Attack: ${getAttack(cardData)}, Type: ${cardData.type}`);
  }
  
  // Get current health from CardInstance if available
  const currentHealth = 
    'card' in card && card.currentHealth !== undefined 
      ? card.currentHealth 
      : getHealth(cardData);
      
  // Determine if this card is a damaged minion
  const isDamaged = 
    cardData.type === 'minion' && 
    currentHealth !== undefined && 
    cardData.health !== undefined && 
    currentHealth < cardData.health;
  
  // Responsive card sizing using aspect-ratio (standard Hearthstone card ratio: 230/342)
  
  // State for card images and hover state - using placeholder logic (Cloudinary removed)
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [largeCardImage, setLargeCardImage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(true); // Default to true for placeholder
  const [largeImageLoaded, setLargeImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Race/Tribe text for the card
  const raceText = cardData.race || '';
  
  // Card state flags (only available for CardInstance)
  const isSummoningSick = 'card' in card ? card.isSummoningSick : false;
  const hasDivineShield = 'card' in card ? card.hasDivineShield : false;
  const isFrozen = 'card' in card ? card.isFrozen : false;
  const canAttack = 'card' in card ? card.canAttack : false;
  const isPoisonous = 'card' in card ? card.isPoisonous : false;
  const hasLifesteal = 'card' in card ? card.hasLifesteal : false;
  const isRush = 'card' in card ? card.isRush : false;
  
  // Check if this card has taunt (from keywords)
  const hasTaunt = cardData.keywords?.includes('taunt') || false;
  
  // Detect keywords from the card data
  const hasKeywords = !!(
    cardData.keywords?.length ||
    hasDivineShield ||
    isPoisonous ||
    hasLifesteal ||
    isRush ||
    cardData.description?.match(/(Battlecry|Deathrattle|Taunt|Discover|Adapt|Frenzy|Inspire|Reborn|Spellburst)/i)
  );
  
  // Get keyword icons from card - uses centralized KEYWORD_DEFINITIONS
  const getCardKeywordIcons = () => {
    const icons: { icon: string; color: string; keyword: string }[] = [];
    const addedKeywords = new Set<string>();
    
    // Check explicit keywords array
    if (cardData.keywords) {
      for (const keyword of cardData.keywords) {
        const key = keyword.toLowerCase();
        const def = KEYWORD_DEFINITIONS[key];
        if (def && !addedKeywords.has(key)) {
          icons.push({ icon: def.icon, color: def.color, keyword: key });
          addedKeywords.add(key);
        }
      }
    }
    
    // Also check card state flags
    if (hasDivineShield && !addedKeywords.has('divine shield')) {
      const def = KEYWORD_DEFINITIONS['divine shield'];
      if (def) icons.push({ icon: def.icon, color: def.color, keyword: 'divine shield' });
      addedKeywords.add('divine shield');
    }
    if (isPoisonous && !addedKeywords.has('poisonous')) {
      const def = KEYWORD_DEFINITIONS['poisonous'];
      if (def) icons.push({ icon: def.icon, color: def.color, keyword: 'poisonous' });
      addedKeywords.add('poisonous');
    }
    if (hasLifesteal && !addedKeywords.has('lifesteal')) {
      const def = KEYWORD_DEFINITIONS['lifesteal'];
      if (def) icons.push({ icon: def.icon, color: def.color, keyword: 'lifesteal' });
      addedKeywords.add('lifesteal');
    }
    if (isRush && !addedKeywords.has('rush')) {
      const def = KEYWORD_DEFINITIONS['rush'];
      if (def) icons.push({ icon: def.icon, color: def.color, keyword: 'rush' });
      addedKeywords.add('rush');
    }
    if (hasTaunt && !addedKeywords.has('taunt')) {
      const def = KEYWORD_DEFINITIONS['taunt'];
      if (def) icons.push({ icon: def.icon, color: def.color, keyword: 'taunt' });
      addedKeywords.add('taunt');
    }
    
    // Check description for keywords
    if (cardData.description) {
      const desc = cardData.description.toLowerCase();
      for (const [keyword, def] of Object.entries(KEYWORD_DEFINITIONS)) {
        if (desc.includes(keyword) && !addedKeywords.has(keyword)) {
          icons.push({ icon: def.icon, color: def.color, keyword });
          addedKeywords.add(keyword);
        }
      }
    }
    
    return icons.slice(0, 4);
  };

  const effectIcons = getCardKeywordIcons();
  
  // Card images now use placeholder logic (Cloudinary service removed)
  // Cards will display placeholder content instead of loading images
  
  // Internal ref to track our element
  const internalRef = useRef<HTMLDivElement | null>(null);
  
  // Register card position for animations on mount and updates
  useEffect(() => {
    if (internalRef.current && registerPosition) {
      const rect = internalRef.current.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      // Make sure card is a CardInstance before passing to registerPosition
      if ('card' in card && 'instanceId' in card) {
        // Also store this position on the card instance itself for death animations
        const cardInstance = card as CardInstance;
        cardInstance.animationPosition = position;
        
        // Register with the position system
        registerPosition(cardInstance, position);
      }
    }
  }, [card, registerPosition]);
  
  // Update position on resize
  useEffect(() => {
    const handleResize = () => {
      if (internalRef.current && registerPosition && 'card' in card && 'instanceId' in card) {
        const rect = internalRef.current.getBoundingClientRect();
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        
        // Update the stored position
        (card as CardInstance).animationPosition = position;
        
        // Register with the position system
        registerPosition(card as CardInstance, position);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [card, registerPosition]);
  

  return (
    <motion.div
      ref={(node) => {
        // Update our internal ref
        internalRef.current = node;
        
        // Also forward to the React.forwardRef
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          // Cast to avoid TypeScript readonly error
          (ref as any).current = node;
        }
      }}
      className={`card relative cursor-pointer ${cardData.type || 'minion'} ${cardData.rarity?.toLowerCase() || 'common'} ${hasKeywords ? 'has-keywords' : ''} ${isInHand ? 'hand-card' : ''} ${className}`}
      data-card-id={'card' in card ? card.instanceId : undefined}
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovered(true);
        if (onHover) onHover(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (onHover) onHover(false);
      }}
      onContextMenu={(e) => {
        // Prevent the default context menu
        e.preventDefault();
        // If onClick is defined, treat right-click the same as ctrl+click
        if (onClick) onClick();
      }}
      animate={{ scale: isHighlighted ? 1.08 : 1 }}
      /* Hover scaling now handled via CSS for better control */
      drag={isDraggable}
      dragConstraints={dragConstraints}
      style={{
        width: isInHand ? 'clamp(80px, 10vw, 120px)' : `clamp(90px, 12vw, 140px)`,
        aspectRatio: '230 / 342',
        height: 'auto',
        maxHeight: isInHand ? '140px' : '200px',
        transformOrigin: 'center bottom',
        opacity: 1,
      }}
    >
      {/* Summoning sickness "ZZZ" indicator */}
      {!isInHand && isSummoningSick && (
        <div className="absolute -top-3 -right-3 z-[1000] pointer-events-none">
          {/* Main sleep bubble container */}
          <div 
            className="relative w-16 h-16 flex justify-center items-center"
            style={{
              animation: 'float 3s ease-in-out infinite',
              transform: 'rotate(-5deg)'
            }}
          >
            {/* Sleeping bubble background with gradient and glow */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(59,130,246,0.9) 0%, rgba(37,99,235,0.9) 70%, rgba(29,78,216,0.85) 100%)',
                boxShadow: '0 0 15px 3px rgba(59,130,246,0.6), inset 0 0 8px rgba(255,255,255,0.6)',
                border: '2px solid rgba(147,197,253,0.8)',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            ></div>
            
            {/* Small decorative bubbles */}
            <div className="absolute w-3 h-3 bg-blue-200 rounded-full opacity-80 top-1 right-3"
              style={{animation: 'bubbleFloat 3s ease-in-out infinite'}}
            ></div>
            <div className="absolute w-2 h-2 bg-blue-200 rounded-full opacity-80 top-2 right-1"
              style={{animation: 'bubbleFloat 3s ease-in-out infinite 0.5s'}}
            ></div>
            
            {/* Inner highlight for bubble */}
            <div 
              className="absolute top-1 left-1 w-10 h-5 rounded-full opacity-40"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 100%)',
                filter: 'blur(1px)'
              }}
            ></div>
            
            {/* ZZZ text with animation and glow */}
            <div className="relative">
              <span 
                className="font-extrabold text-2xl text-white tracking-tighter drop-shadow-lg"
                style={{
                  textShadow: '0 0 5px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.4)',
                  animation: 'zzzFloat 2s ease-in-out infinite',
                  display: 'inline-block'
                }}
              >
                Z
              </span>
              <span 
                className="font-extrabold text-2xl text-white tracking-tighter drop-shadow-lg ml-1"
                style={{
                  textShadow: '0 0 5px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.4)',
                  animation: 'zzzFloat 2s ease-in-out infinite 0.3s',
                  display: 'inline-block'
                }}
              >
                Z
              </span>
              <span 
                className="font-extrabold text-2xl text-white tracking-tighter drop-shadow-lg ml-1"
                style={{
                  textShadow: '0 0 5px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.4)',
                  animation: 'zzzFloat 2s ease-in-out infinite 0.6s',
                  display: 'inline-block'
                }}
              >
                Z
              </span>
            </div>
            
            {/* Animation defined globally in index.css */}
          </div>
        </div>
      )}
      
      {/* AAA-quality Can Attack indicator with professional glow and arrow animation */}
      {!isInHand && !isSummoningSick && canAttack && (
        <div className="absolute inset-0 z-[800] pointer-events-none overflow-visible">
          {/* IMPROVED: Softer, more organic glow effect with no hard edges */}
          <div className="absolute inset-0 rounded-2xl overflow-visible" 
            style={{
              // Remove background image completely - use filter blur instead for natural glow
              background: "transparent",
              animation: "organic-glow 2s infinite ease-in-out",
              // CRITICAL FIX: Remove border completely to eliminate rigid box effect
              border: "none"
            }}>
            {/* Fully blurred inner glow for natural card illumination */}
            <div className="absolute inset-2 rounded-xl opacity-60 overflow-visible"
              style={{
                // More diffuse, softer shadow with increased blur
                boxShadow: "0 0 25px 15px rgba(0, 255, 0, 0.2)",
                animation: "inner-glow 3s infinite alternate ease-in-out",
                // Increase blur significantly for more natural glow
                filter: "blur(10px)"
              }}
            ></div>
            
            {/* Use multiple soft light sources instead of hard edges */}
            <div className="absolute inset-0 rounded-2xl overflow-visible"
              style={{
                // Remove inset shadow completely - use radial gradients for glow points
                boxShadow: "none",
                animation: "pulse-highlight 3s infinite alternate ease-in-out",
                opacity: "0.7"
              }}
            ></div>
            
            {/* Animated highlight streaks that circle the card like magic energy */}
            <div className="absolute w-[400%] h-[400%] top-[-150%] left-[-150%]" 
              style={{
                backgroundImage: "conic-gradient(from 0deg, transparent 0deg, rgba(0, 255, 0, 0.4) 5deg, transparent 10deg, transparent 355deg, rgba(0, 255, 0, 0.4) 360deg)",
                animation: "rotate-energy 8s linear infinite",
                opacity: "0.3",
                filter: "blur(2px)"
              }}
            ></div>
            
            {/* Particle effect element to add magical feeling */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden"
              style={{
                backgroundImage: "radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(0, 255, 0, 0.6) 0%, rgba(0, 255, 0, 0) 60%)",
                animation: "particle-move 6s infinite ease-in-out",
                opacity: "0.3",
                filter: "blur(5px)",
                transform: "scale(1.5)"
              }}
            ></div>
          </div>
          
          {/* Enhanced attack arrow with glowing effect */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2">
            <div className="h-16 w-12 flex justify-center items-center animate-bounce">
              {/* Arrow with gradient glow effect */}
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <filter id="glow-arrow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <path 
                  d="M5 12H19M19 12L13 6M19 12L13 18" 
                  stroke="rgba(0, 255, 0, 0.9)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  filter="url(#glow-arrow)"
                />
                <path 
                  d="M5 12H19M19 12L13 6M19 12L13 18" 
                  stroke="#00FF00" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          
          {/* Animations for the attack glow effects */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes organic-glow {
              0%, 100% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.02); }
            }
            
            @keyframes inner-glow {
              0% { opacity: 0.5; filter: blur(3px); }
              100% { opacity: 0.7; filter: blur(4px); }
            }
            
            @keyframes pulse-highlight {
              0% { opacity: 0.6; }
              100% { opacity: 0.9; }
            }
            
            @keyframes rotate-energy {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            @keyframes particle-move {
              0%, 100% { --x: 30%; --y: 30%; }
              25% { --x: 70%; --y: 30%; }
              50% { --x: 70%; --y: 70%; }
              75% { --x: 30%; --y: 70%; }
            }
          `}} />
        </div>
      )}
      
      {/* Enhanced AAA-quality Frozen Effect */}
      {isFrozen && (
        <div className="absolute inset-0 z-[900] pointer-events-none overflow-hidden rounded-lg">
          {/* Primary ice layer with realistic refraction */}
          <div className="absolute inset-0" 
            style={{
              background: 'linear-gradient(135deg, rgba(224, 242, 254, 0.4) 0%, rgba(186, 230, 253, 0.5) 25%, rgba(125, 211, 252, 0.4) 50%, rgba(56, 189, 248, 0.5) 75%, rgba(14, 165, 233, 0.4) 100%)',
              backdropFilter: 'blur(4px)',
              boxShadow: 'inset 0 0 30px rgba(2, 132, 199, 0.4), 0 0 20px rgba(186, 230, 253, 0.7)',
              animation: 'ice-shimmer 3s ease-in-out infinite alternate'
            }}>
          </div>
          
          {/* Ice crystal formations with 3D depth effect */}
          <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
            {/* Dynamic ice crystals - top left */}
            <div className="absolute top-[-20px] left-[-20px] w-[150px] h-[150px]"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, rgba(224, 242, 254, 0.8) 20%, rgba(186, 230, 253, 0.4) 40%, rgba(125, 211, 252, 0.2) 60%, transparent 80%)',
                transform: 'rotate(15deg)',
                animation: 'frost-pulse 4s ease-in-out infinite'
              }}>
            </div>
            
            {/* Dynamic ice crystals - bottom right */}
            <div className="absolute bottom-[-30px] right-[-30px] w-[170px] h-[170px]"
              style={{
                background: 'radial-gradient(circle at 60% 60%, rgba(255, 255, 255, 0.9) 0%, rgba(224, 242, 254, 0.8) 20%, rgba(186, 230, 253, 0.4) 40%, rgba(125, 211, 252, 0.2) 60%, transparent 80%)',
                transform: 'rotate(-20deg)',
                animation: 'frost-pulse 4s ease-in-out infinite 0.5s'
              }}>
            </div>
          </div>
          
          {/* Realistic ice cracks */}
          <div className="absolute inset-0">
            {/* Horizontal crack */}
            <div className="absolute top-1/2 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 20%, rgba(255, 255, 255, 0.9) 80%, transparent 100%)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 20px rgba(191, 219, 254, 0.6)',
                animation: 'ice-crack-horizontal 0.5s ease-out forwards'
              }}>
            </div>
            
            {/* Diagonal crack 1 */}
            <div className="absolute top-0 left-1/4 w-[2px] h-[70%]"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 255, 255, 0.9) 70%, transparent 100%)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 20px rgba(191, 219, 254, 0.6)',
                transform: 'rotate(45deg)',
                transformOrigin: 'top center',
                animation: 'ice-crack-diagonal 0.7s ease-out forwards 0.2s'
              }}>
            </div>
            
            {/* Diagonal crack 2 */}
            <div className="absolute top-0 right-1/3 w-[2px] h-[60%]"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 255, 255, 0.9) 70%, transparent 100%)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.8), 0 0 20px rgba(191, 219, 254, 0.6)',
                transform: 'rotate(-35deg)',
                transformOrigin: 'top center',
                animation: 'ice-crack-diagonal 0.6s ease-out forwards 0.4s'
              }}>
            </div>
          </div>
          
          {/* Frost particles */}
          <div className="absolute inset-0">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={`frost-particle-${i}`} 
                className="absolute w-[4px] h-[4px] rounded-full bg-white"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: 0.7 * Math.random() + 0.3,
                  boxShadow: '0 0 8px 2px rgba(255, 255, 255, 0.8)',
                  animation: `frost-float ${3 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          {/* Frozen text with enhanced 3D effect */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] z-10">
            <span className="text-3xl font-extrabold uppercase tracking-widest" 
              style={{
                color: 'transparent',
                backgroundImage: 'linear-gradient(135deg, #e0f2fe 10%, #ffffff 50%, #bae6fd 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                textShadow: '0 0 10px rgba(56, 189, 248, 0.8), 0 0 20px rgba(14, 165, 233, 0.6), 0 1px 0 #0284c7, 0 -1px 0 #0ea5e9, 1px 0 0 #0ea5e9, -1px 0 0 #0ea5e9',
                animation: 'frost-text-glow 3s ease-in-out infinite alternate'
              }}>
              Frozen
            </span>
          </div>
          
          {/* Bottom ice build-up */}
          <div className="absolute bottom-0 left-0 right-0 h-[25%]"
            style={{
              background: 'linear-gradient(to top, rgba(224, 242, 254, 0.8) 0%, rgba(186, 230, 253, 0.5) 40%, rgba(125, 211, 252, 0.2) 70%, transparent 100%)',
              boxShadow: 'inset 0 -5px 15px rgba(186, 230, 253, 0.7)',
              borderBottomLeftRadius: 'inherit',
              borderBottomRightRadius: 'inherit',
              animation: 'frost-climb 1s ease-out forwards'
            }}>
          </div>
        </div>
      )}
      
      {/* Add keyframes for new frost animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ice-shimmer {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.9; }
        }
        
        @keyframes frost-pulse {
          0%, 100% { transform: scale(1) rotate(var(--rotation, 0deg)); opacity: 0.6; }
          50% { transform: scale(1.1) rotate(var(--rotation, 0deg)); opacity: 0.8; }
        }
        
        @keyframes frost-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
        }
        
        @keyframes frost-text-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(56, 189, 248, 0.8), 0 0 20px rgba(14, 165, 233, 0.6), 0 1px 0 #0284c7, 0 -1px 0 #0ea5e9, 1px 0 0 #0ea5e9, -1px 0 0 #0ea5e9; }
          50% { text-shadow: 0 0 15px rgba(56, 189, 248, 1), 0 0 30px rgba(14, 165, 233, 0.8), 0 0 40px rgba(2, 132, 199, 0.6), 0 1px 0 #0284c7, 0 -1px 0 #0ea5e9, 1px 0 0 #0ea5e9, -1px 0 0 #0ea5e9; }
        }
        
        @keyframes frost-climb {
          0% { height: 0; opacity: 0.3; }
          100% { height: 25%; opacity: 0.8; }
        }
        
        @keyframes ice-crack-horizontal {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        
        @keyframes ice-crack-diagonal {
          0% { transform: scaleY(0) rotate(var(--rotation, 0deg)); opacity: 0; }
          100% { transform: scaleY(1) rotate(var(--rotation, 0deg)); opacity: 1; }
        }
      `}} />
      
      {/* Card Frame, Card Image, and descriptive elements */}
      
      {/* Stat gems in the corners - These need to be rendered with high z-index */}
      <div className={`card-corner-ornament card-corner-ornament-tl card-stat-gem ${cardData.rarity || 'common'}`} style={{ zIndex: 1100 }}>
        <span className="stat-value">{cardData.manaCost}</span>
      </div>
      
      {getAttack(cardData) !== 0 && (
        <div className={`card-corner-ornament card-corner-ornament-bl card-stat-gem ${cardData.rarity || 'common'}`} style={{ zIndex: 1100 }}>
          <span className="stat-value">{getAttack(cardData)}</span>
        </div>
      )}
      
      {cardData.type === 'minion' && getHealth(cardData) !== 0 && (
        <div className={`card-corner-ornament card-corner-ornament-br card-stat-gem ${cardData.rarity || 'common'}`} style={{ zIndex: 1100 }}>
          <span className="stat-value">{currentHealth}</span>
        </div>
      )}
      
      {cardData.type === 'weapon' && cardData.durability !== undefined && (
        <div className={`card-corner-ornament card-corner-ornament-br card-stat-gem ${cardData.rarity || 'common'}`} style={{ zIndex: 1100 }}>
          <span className="stat-value">{cardData.durability}</span>
        </div>
      )}
      
      {/* Effect Icons - Top Center for cards in HAND only (battlefield shows icons in description area) */}
      {isInHand && effectIcons.length > 0 && (
        <div 
          className="absolute top-1 left-1/2 transform -translate-x-1/2 flex gap-0.5 z-[1200] pointer-events-none"
          style={{ marginTop: '2px' }}
        >
          {effectIcons.map((effect, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center rounded-full shadow-md"
              style={{
                width: '16px',
                height: '16px',
                background: `linear-gradient(135deg, ${effect.color}33, ${effect.color}66)`,
                border: `1.5px solid ${effect.color}`,
                boxShadow: `0 1px 4px ${effect.color}88`,
                fontSize: '10px',
              }}
              title={effect.keyword}
            >
              <span>{effect.icon}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Norse Frame with integrated Arc Reactor energy system - this is our primary frame */}
      <NorseFrame
        rarity={cardData.rarity || 'common'}
        cardType={cardData.type || 'minion'} 
        hasKeywords={hasKeywords}
        className={`absolute inset-0 z-10 ${hasTaunt ? 'taunt-frame' : ''}`}
        isGolden={false} // Default to false since we don't have this property yet
        isPlayable={isPlayable} // Pass playable state for conditional highlighting
        heroClass={cardData.class || cardData.heroClass || 'neutral'} // For class-specific effects
        inHand={isInHand} // For special hand behaviors
      >
        {/* The proper way to use NorseFrame - pass all card content as children */}
        <div className="card-content-wrapper z-20 relative w-full h-full flex flex-col items-center justify-center">
          {/* Card image area */}
          {cardImage ? (
            <div className="card-image-container relative w-full h-[65%] overflow-hidden mt-7">
              <img
                src={cardImage}
                alt="Card Artwork" 
                className="w-full h-full object-cover rounded-lg"
                onLoad={() => setImageLoaded(true)}
                style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
              />
            </div>
          ) : (
            <div className="card-placeholder relative w-full h-[65%] flex items-center justify-center mt-7 bg-amber-50 rounded-lg">
              <span className="text-center text-amber-900 text-sm px-2">
                {imageError ? 'Image not available' : 'Loading...'}
              </span>
            </div>
          )}
          
          {/* Card name banner - SINGLE SOURCE OF TRUTH */}
          <div className="card-name-banner relative w-[90%] h-14 -mt-2 z-50 mb-2">
            <div 
              className="w-full h-full rounded-md flex items-center justify-center"
              style={{
                background: `linear-gradient(to bottom, 
                  ${cardData.rarity === 'legendary' ? '#d9c080' : '#ccc'}, 
                  ${cardData.rarity === 'legendary' ? '#b09550' : '#999'}, 
                  ${cardData.rarity === 'legendary' ? '#8f783f' : '#777'})`,
                boxShadow: `0 3px 5px rgba(0,0,0,0.5), 
                  inset 0 1px 2px rgba(255,255,255,0.7), 
                  inset 0 -1px 1px rgba(0,0,0,0.3)`,
                border: `1px solid ${
                  cardData.rarity === 'legendary' ? '#b39747' :
                  cardData.rarity === 'epic' ? '#9a76b7' : 
                  cardData.rarity === 'rare' ? '#6187a9' : '#8a7654'
                }`
              }}
            >
              <span 
                className="font-bold text-center px-2"
                style={{
                  color: '#4B2504',
                  textShadow: '0 1px 1px rgba(255,255,255,0.5)',
                  fontSize: `${cardData.name && cardData.name.length > 20 ? 0.9 : 
                    cardData.name && cardData.name.length > 15 ? 1.0 : 
                    cardData.name && cardData.name.length > 10 ? 1.1 : 1.2 * scale}rem`,
                  lineHeight: '1.1',
                  whiteSpace: cardData.name && cardData.name.length > 15 ? 'normal' : 'nowrap',
                  fontFamily: 'serif',
                }}
              >
                {cardData.name}
              </span>
            </div>
          </div>
          
          {/* Card Description - SINGLE SOURCE OF TRUTH */}
          {/* In hand: Show full text. On battlefield: Show icons only */}
          <div className="card-description-container relative w-[90%] mt-auto mb-6 z-30">
            {isInHand ? (
              /* Full text description for cards in hand */
              <div style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: '100%',
                fontSize: `${Math.min(0.78, 0.85 - (cardData.description?.length || 0) / 800) * scale}rem`,
                lineHeight: '1.2',
                paddingTop: '4px',
                paddingBottom: '0px',
                paddingLeft: '0px',
                paddingRight: '0px',
                margin: '0px',
                background: 'transparent',
                border: 'none',
                borderRadius: '0',
                outline: 'none',
                boxShadow: 'none',
                overflow: 'visible !important',
                clipPath: 'none !important',
                WebkitClipPath: 'none !important',
                maskImage: 'none !important',
                WebkitMaskImage: 'none !important'
              }}>
                {cardData.description ? formatCardText(
                  cardData.description, 
                  cardData.rarity || 'common',
                  { diagnosticMode: showDebugInfo }
                ) : null}
              </div>
            ) : (
              /* Icon-only display for minions on battlefield (Hearthstone style) */
              effectIcons.length > 0 && (
                <div 
                  className="flex flex-wrap justify-center gap-1 py-1"
                  style={{ minHeight: '24px' }}
                >
                  {effectIcons.map((effect, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-center rounded-full shadow-lg"
                      style={{
                        width: '22px',
                        height: '22px',
                        background: `linear-gradient(135deg, ${effect.color}44, ${effect.color}88)`,
                        border: `2px solid ${effect.color}`,
                        boxShadow: `0 2px 6px ${effect.color}99, inset 0 1px 2px rgba(255,255,255,0.3)`,
                        fontSize: '13px',
                      }}
                      title={effect.keyword}
                    >
                      <span>{effect.icon}</span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
          
          {/* Race text at the bottom if present */}
          {raceText && (
            <div className="absolute bottom-1 left-0 right-0 flex justify-center items-center">
              <div className="race-container flex items-center bg-black bg-opacity-20 px-2 py-1 rounded-full">
                <RaceIcon race={raceText} rarity={cardData.rarity || 'common'} />
                <span className="race-text ml-1 text-sm font-semibold" style={{
                  ...getRarityTextStyle(cardData.rarity || 'common'),
                  fontSize: '0.8rem', 
                  lineHeight: 1
                }}>
                  {raceText}
                </span>
              </div>
            </div>
          )}
        </div>
      </NorseFrame>
      
      {/* Special ability indicators - simplified as outlines only */}
      {(hasTaunt || isPoisonous || hasLifesteal || isRush) && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            zIndex: 60,
            border: hasTaunt 
              ? '3px solid #8B4513' 
              : isPoisonous
              ? '3px solid #00FF00'
              : hasLifesteal
              ? '3px solid #FF00FF'
              : isRush
              ? '3px solid #FFA500' 
              : '0px solid transparent',
            boxShadow: hasTaunt || isPoisonous || hasLifesteal || isRush 
              ? '0 0 10px rgba(255, 255, 255, 0.3)' 
              : 'none'
          }}
        />
      )}
      
      {/* Card inner glow effect and texture overlay */}
      <div className="card-inner-glow opacity-50"></div>
      <div className="card-texture-overlay opacity-50"></div>
      
      {/* Play button for cards in hand */}
      {isInHand && (
        <div className="absolute -bottom-10 left-0 right-0 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onClick && isPlayable) onClick();
            }}
            className={`px-4 py-1 text-sm font-bold rounded-md transition-colors shadow-md ${
              isPlayable 
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            style={{
              border: isPlayable ? '1px solid rgba(255,215,0,0.6)' : '1px solid rgba(128,128,128,0.4)',
              boxShadow: isPlayable ? '0 2px 6px rgba(255,215,0,0.4)' : 'none'
            }}
            disabled={!isPlayable}
          >
            {isPlayable ? 'PLAY' : `NEED ${(cardData.manaCost ?? 0) - ((card as any).currentMana || 0)} MANA`}
          </button>
        </div>
      )}
      
      {/* Divine Shield effect */}
      {hasDivineShield && (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-lg">
          {/* Golden shield bubble effect */}
          <div 
            className="absolute inset-0 animate-pulse"
            style={{
              border: '3px solid rgba(255, 215, 0, 0.7)',
              borderRadius: '12px',
              boxShadow: 'inset 0 0 15px rgba(255, 215, 0, 0.5), 0 0 15px rgba(255, 215, 0, 0.5)',
              animation: 'shield-glow 2s ease-in-out infinite',
              opacity: 0.7
            }}
          ></div>
          
          {/* Shimmer effect overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
              borderRadius: '12px'
            }}
          ></div>
        </div>
      )}
      
      {/* Health damage animation - commented out until we reimplement damage animation state
      {showDamageAnimation && (
        <div 
          className="absolute inset-0 z-50 pointer-events-none"
          style={{
            animation: 'damage-flash 0.5s ease-out',
            borderRadius: '12px'
          }}
        ></div>
      )}
      */}
    </motion.div>
  );
});

// Set display name for better debugging
Card.displayName = 'Card';

export default Card;
