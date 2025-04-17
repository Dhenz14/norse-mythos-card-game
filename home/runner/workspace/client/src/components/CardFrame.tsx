import React, { useState, useRef, useEffect } from 'react';
import HexagonBadge from './HexagonBadge';
import '../game/components/CardEnhancements.css'; // Import the exact same CSS used in the game
import '../game/components/HolographicEffect.css'; // Import the holographic effects CSS

interface CardFrameProps {
  attack: number;
  health: number;
  manaCost?: number; // Made optional
  name: string;
  imageSrc: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  type?: 'minion' | 'spell' | 'weapon';
  keywords?: string[];
  description?: string;
  isPlayed?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large'; // Added size property
  use3D?: boolean; // Added option to disable 3D transformations
}

const CardFrame: React.FC<CardFrameProps> = ({
  attack,
  health,
  manaCost,
  name,
  imageSrc,
  rarity = 'common',
  type = 'minion',
  keywords = [],
  description = '',
  isPlayed = false,
  onClick,
  size = 'medium',
  use3D = true
}) => {
  // Rarity colors for the card border
  const rarityColors = {
    common: '#8c8c8c', // gray
    rare: '#0070dd', // blue
    epic: '#a335ee', // purple
    legendary: '#ff8000' // orange
  };
  
  // Card dimensions based on size
  const getCardDimensions = () => {
    switch(size) {
      case 'small':
        return { width: 120, height: 170 }; // Matching the exact size of demo card
      case 'large':
        return { width: 200, height: 280 };
      case 'medium':
      default:
        return { width: 160, height: 230 };
    }
  };
  
  const { width: cardWidth, height: cardHeight } = getCardDimensions();
  
  // Card glow based on rarity
  const getCardGlow = () => {
    if (rarity === 'legendary') return '0 0 15px #ffb100';
    if (rarity === 'epic') return '0 0 10px #a335ee';
    if (rarity === 'rare') return '0 0 8px #0070dd';
    return 'none';
  };
  
  // Track hover state
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate the correct class name for the card based on rarity 
  // Using the exact same classes from CardEnhancements.css
  const getCardClasses = () => {
    let classes = 'card-container';
    
    // Add premium-card-container class for the 3D effect
    if (rarity === 'legendary' || rarity === 'epic' || rarity === 'rare') {
      classes += ' premium-card-container';
      
      // Add hover classes when hovered - exactly like in the game
      if (isHovered) {
        classes += ' hovered interactive';
      }
    }
    
    // Add the specific quality class based on rarity
    if (rarity === 'legendary') {
      classes += ' golden-quality';
    } else if (rarity === 'epic') {
      classes += ' diamond-quality';
    } else if (rarity === 'rare') {
      classes += ' premium-quality'; 
    }
    
    return classes;
  };

  // For holographic and 3D rotation effects like SimpleHolographicCard
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Handle mouse movement for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !use3D || rarity !== 'legendary') return;
    
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate the center of the card
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate the distance from the cursor to the center
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const distX = mouseX - centerX;
    const distY = mouseY - centerY;
    
    // Convert to rotation angles (limited to [-10, 10] degrees)
    const rotationY = Math.max(-10, Math.min(10, distX / rect.width * 20));
    const rotationX = Math.max(-10, Math.min(10, -distY / rect.height * 20));
    
    // Apply a Golden Ratio damping factor (1.618) for naturally pleasing motion
    const dampingFactor = 1.618;
    const easedRotationY = rotationY / dampingFactor;
    const easedRotationX = rotationX / dampingFactor;
    
    // Set the state
    setRotation({ x: easedRotationX, y: easedRotationY });
    setPosition({ x: distX / 20, y: distY / 20 });
  };
  
  // Animation ref for smooth return
  const returnAnimationRef = useRef<number | null>(null);
  
  // Handle mouse leave event - Smooth return to normal position
  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // Cancel any existing animation
    if (returnAnimationRef.current) {
      cancelAnimationFrame(returnAnimationRef.current);
    }
    
    // Starting values for animation
    const startRotation = { ...rotation };
    const startPosition = { ...position };
    const startTime = performance.now();
    const duration = 800; // Animation duration in ms
    
    // Smooth return animation function
    const animateReturn = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic bezier easing function for bouncy effect
      const easeOutBack = (t: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      
      // Apply easing
      const easedProgress = progress >= 1 ? 1 : easeOutBack(1 - progress);
      
      // Calculate new values
      const newRotationX = startRotation.x * easedProgress;
      const newRotationY = startRotation.y * easedProgress;
      const newPositionX = startPosition.x * easedProgress;
      const newPositionY = startPosition.y * easedProgress;
      
      // Update state with smooth interpolation
      setRotation({ x: newRotationX, y: newRotationY });
      setPosition({ x: newPositionX, y: newPositionY });
      
      // Continue animation if not complete
      if (progress < 1) {
        returnAnimationRef.current = requestAnimationFrame(animateReturn);
      } else {
        // Final reset to exact zero values
        setRotation({ x: 0, y: 0 });
        setPosition({ x: 0, y: 0 });
        returnAnimationRef.current = null;
      }
    };
    
    // Start animation
    returnAnimationRef.current = requestAnimationFrame(animateReturn);
  };

  // Clean up animation refs when component unmounts
  useEffect(() => {
    return () => {
      if (returnAnimationRef.current) {
        cancelAnimationFrame(returnAnimationRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className={`${getCardClasses()} holographic-card-container ${isHovered ? 'is-hovering card-container-glow' : ''}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        borderRadius: '12px',
        backgroundColor: '#f0d6b9',
        boxShadow: getCardGlow(),
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: isPlayed ? 'translateY(-10px)' : 'none',
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'hidden',
        perspective: '1200px', // Add depth perspective for 3D effect
        transformStyle: 'preserve-3d' // Enable 3D transformations
      }}
    >
      {/* Full card background holographic effect for legendary cards - first layer */}
      {rarity === 'legendary' && (
        <div 
          className="full-card-holographic" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            backgroundImage: `url('/textures/foil.png')`,
            backgroundSize: 'cover',
            opacity: 0.3,
            mixBlendMode: 'hard-light',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Full card background holographic effect for epic cards - first layer */}
      {rarity === 'epic' && (
        <div 
          className="full-card-holographic epic-holographic-bg" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            backgroundImage: `url('/textures/epic_holographic.png')`,
            backgroundSize: 'cover',
            opacity: 0.4,
            mixBlendMode: 'color-dodge',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Main Card Div with 3D transform for premium cards (legendary or epic) */}
      <div 
        className={`card-inner ${
          rarity === 'legendary' 
            ? 'legendary-card holographic-enabled' 
            : rarity === 'epic' 
              ? 'epic-card holographic-enabled' 
              : ''
        }`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          transformStyle: 'preserve-3d',
          transform: (use3D && (rarity === 'legendary' || rarity === 'epic')) ? 
            `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(5px)` : 
            'none',
          transition: isHovered ? 'none' : 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 2,
          overflow: 'hidden'
        }}
      >
        {/* Card Background - Standard background */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'linear-gradient(to bottom, #e8d0a9, #f0d6b9)',
            borderRadius: '12px',
            zIndex: 0
          }}
        />
        
        {/* Gold foil background texture for legendary cards - Full overlay now */}
        {rarity === 'legendary' && (
          <div className="holographic-card card-holographic-effect" data-rarity="legendary" style={{
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
            opacity: 0.5,
            mixBlendMode: 'color-dodge',
            zIndex: 3,
            pointerEvents: 'none'
          }}/>
        )}
        
        {/* Holographic overlay effect for legendary cards using additional effects from HolographicEffect.css */}
        {rarity === 'legendary' && (
          <div 
            className="holographic-overlay"
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
              backgroundImage: 'linear-gradient(135deg, rgba(255, 215, 0, 0) 25%, rgba(255, 215, 0, 0.2) 50%, rgba(255, 215, 0, 0) 75%)'
            }}
          />
        )}
        
        {/* Epic card holographic overlay with prismatic effect */}
        {rarity === 'epic' && (
          <div 
            className="holographic-card card-holographic-effect" 
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
              opacity: 0.7,
              mixBlendMode: 'color-dodge',
              zIndex: 3,
              pointerEvents: 'none',
              animation: 'prismatic-shift 8s infinite linear'
            }}
          />
        )}
        
        {/* Epic card shimmer effect */}
        {rarity === 'epic' && (
          <div 
            className="epic-holographic-overlay"
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
              backgroundImage: 'linear-gradient(135deg, rgba(148, 0, 211, 0) 25%, rgba(148, 0, 211, 0.2) 50%, rgba(148, 0, 211, 0) 75%)'
            }}
          />
        )}
        
        {/* Card Border/Frame - with different border colors for different rarities */}
        <div 
          className={rarity === 'epic' ? 'epic-card-border' : ''}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            border: `2px solid ${
              rarity === 'legendary' 
                ? '#ffb100' 
                : rarity === 'epic' 
                  ? '#a335ee' 
                  : '#FFD700'
            }`,
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 2,
            boxShadow: rarity === 'epic' 
              ? 'inset 0 0 10px rgba(163, 53, 238, 0.5)' 
              : 'inset 0 0 10px rgba(0, 0, 0, 0.3)'
          }} 
        />
        
        {/* Upper black box for card art - Clean section with spacing */}
        <div style={{
          position: 'absolute',
          top: size === 'small' ? '30px' : '40px', // Adjusted for small cards
          left: '8px',
          width: `${cardWidth - 16}px`,
          height: size === 'small' ? '60px' : '85px', // Adjusted height for small cards
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#333', // Dark background
          zIndex: 1,
          border: rarity === 'epic' 
            ? '1px solid rgba(163, 53, 238, 0.4)' 
            : '1px solid #222',
          boxShadow: rarity === 'epic'
            ? 'inset 0 0 5px rgba(163, 53, 238, 0.3)'
            : 'inset 0 0 5px rgba(0, 0, 0, 0.5)'
        }}>
          <img 
            src={imageSrc} 
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
        </div>
        
        {/* Name Banner - Clearly separated section between art and description */}
        <div style={{
          position: 'absolute',
          top: size === 'small' ? '95px' : '130px', // Adjusted for small cards
          left: '0',
          width: '100%',
          height: size === 'small' ? '20px' : '24px', // Smaller height for small cards
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
          backgroundColor: 'transparent'
        }}>
          <div style={{
            width: '80%',
            height: size === 'small' ? '18px' : '22px', // Smaller height for small cards
            backgroundColor: '#333',
            borderRadius: size === 'small' ? '9px' : '11px', // Adjusted radius
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: `1px solid ${
              rarity === 'legendary' 
                ? '#ffb100' 
                : rarity === 'epic' 
                  ? '#a335ee' 
                  : '#FFD700'
            }`,
            boxShadow: rarity === 'epic' 
              ? '0 1px 3px rgba(163, 53, 238, 0.6)' 
              : '0 1px 3px rgba(0,0,0,0.4)'
          }}>
            <span style={{
              color: rarity === 'legendary' 
                ? '#ffde7a' 
                : rarity === 'epic' 
                  ? '#c990fd' 
                  : '#FFD700',
              fontSize: size === 'small' ? '9px' : '11px', // Smaller font for small cards
              fontWeight: 'bold',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              padding: '0 8px'
            }}>
              {name}
            </span>
          </div>
        </div>
        
        {/* Description Box - Clean separated section at bottom */}
        <div style={{
          position: 'absolute',
          top: size === 'small' ? '120px' : '159px', // Adjusted for small cards
          left: '8px',
          width: `${cardWidth - 16}px`,
          height: size === 'small' ? '44px' : '62px', // Smaller height for small cards
          borderRadius: '8px',
          backgroundColor: '#333',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4px 6px',
          border: rarity === 'epic' 
            ? '1px solid rgba(163, 53, 238, 0.4)' 
            : '1px solid #222',
          boxShadow: rarity === 'epic'
            ? 'inset 0 0 5px rgba(163, 53, 238, 0.2)'
            : 'inset 0 0 5px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Keywords display at top of description box */}
          {keywords.length > 0 && (
            <div style={{
              width: '100%',
              textAlign: 'center',
              color: rarity === 'epic' ? '#c990fd' : '#ffde7a', // Purple for epic, gold for others
              fontSize: size === 'small' ? '8px' : '10px', // Smaller font for small cards
              fontWeight: 'bold',
              marginBottom: '2px'
            }}>
              {keywords.join(' • ')}
            </div>
          )}
          
          {/* Description text */}
          <div style={{
            width: '100%',
            textAlign: 'center',
            color: 'white',
            fontSize: size === 'small' ? '7px' : '9px', // Smaller font for small cards
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 4,
            lineHeight: '1.3'
          }}>
            {description}
          </div>
        </div>
        
        {/* Attack Value - Hexagonal badge at top left */}
        <HexagonBadge 
          value={attack} 
          color="#f8b700" 
          position="left" 
          size={size === 'small' ? 28 : 32} // Smaller badges for small cards
          style={{
            top: '5px',
            bottom: 'auto'
          }}
        />
        
        {/* Health Value - Hexagonal badge at top right */}
        <HexagonBadge 
          value={health} 
          color="#e61610" 
          position="right" 
          size={size === 'small' ? 28 : 32} // Smaller badges for small cards 
          style={{
            top: '5px',
            bottom: 'auto'
          }}
        />
      </div>
      
      {/* Add the exact same shimmer animation as in the existing game */}
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: -100% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          
          /* Add the exact same pulse-glow-gold animation from the game */
          @keyframes pulse-glow-gold {
            0% {
              box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
            }
            50% {
              box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
            }
            100% {
              box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
            }
          }
          
          /* Apply pulsing glow to legendary cards */
          .golden-quality {
            animation: pulse-glow-gold 2s infinite;
          }
          
          /* Ensure holographic effect covers the entire card */
          .card-holographic-effect {
            background-blend-mode: color-dodge;
            mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 100%);
            -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 100%);
          }
          
          /* Add prismatic shift animation for epic cards */
          @keyframes prismatic-shift {
            0% {
              filter: hue-rotate(0deg) saturate(1.5);
            }
            25% {
              filter: hue-rotate(90deg) saturate(1.7);
            }
            50% {
              filter: hue-rotate(180deg) saturate(1.9);
            }
            75% {
              filter: hue-rotate(270deg) saturate(1.7);
            }
            100% {
              filter: hue-rotate(360deg) saturate(1.5);
            }
          }
          
          /* Apply purple glow for epic cards */
          @keyframes pulse-glow-purple {
            0% {
              box-shadow: 0 0 5px rgba(163, 53, 238, 0.5);
            }
            50% {
              box-shadow: 0 0 15px rgba(163, 53, 238, 0.8);
            }
            100% {
              box-shadow: 0 0 5px rgba(163, 53, 238, 0.5);
            }
          }
          
          /* Epic card border animation */
          .epic-card-border {
            animation: pulse-glow-purple 2.5s infinite;
          }
        `}
      </style>
    </div>
  );
};

export default CardFrame;