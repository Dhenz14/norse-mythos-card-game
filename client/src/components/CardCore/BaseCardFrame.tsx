import React, { useState, useRef, useEffect } from 'react';
import HexagonBadge from './HexagonBadge';
import { CardBaseProps } from './types';
import { assetPath } from '../../game/utils/assetPath';
import '../../game/components/CardEnhancements.css';
import '../../game/components/HolographicEffect.css';

/**
 * BaseCardFrame Component
 * 
 * A foundational card component that implements the consistent Norse card style.
 * All card implementations should extend or use this component to ensure a unified look.
 */
const BaseCardFrame: React.FC<CardBaseProps> = ({
  // Card data props
  name = 'Unknown Card',
  attack = 0,
  health = 0,
  manaCost = 0,
  imageSrc = '',
  description = '',
  rarity = 'common',
  type = 'minion',
  keywords = [],
  
  // Card state props
  isPlayed = false,
  isPlayable = false,
  isHighlighted = false,
  
  // Display options
  size = 'medium',
  use3D = true,
  className = '',
  style = {},
  
  // Event handlers
  onClick,
  onHover,
}) => {
  // Rarity colors for the card border and effects
  const rarityColors = {
    common: '#8c8c8c', // gray
    rare: '#0070dd',   // blue
    epic: '#a335ee',   // purple
    legendary: '#ff8000' // orange/gold
  };
  
  // Card dimensions based on size
  const getCardDimensions = () => {
    switch(size) {
      case 'small':
        return { width: 130, height: 170 }; // Matching the exact size of demo card
      case 'large':
        return { width: 240, height: 340 };
      case 'medium':
      default:
        return { width: 180, height: 260 };
    }
  };
  
  const { width: cardWidth, height: cardHeight } = getCardDimensions();
  
  // Card glow based on rarity and state
  const getCardGlow = () => {
    if (isHighlighted) return '0 0 15px rgba(255, 255, 0, 0.8)';
    if (isPlayable) return '0 0 10px rgba(0, 255, 0, 0.7)';
    
    if (rarity === 'legendary') return '0 0 15px rgba(255, 176, 0, 0.7)';
    if (rarity === 'epic') return '0 0 10px rgba(163, 53, 238, 0.7)';
    if (rarity === 'rare') return '0 0 8px rgba(0, 112, 221, 0.5)';
    
    return 'none';
  };
  
  // Track hover state
  const [isHovered, setIsHovered] = useState(false);
  
  // For holographic and 3D rotation effects
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Handle mouse movement for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !use3D) return;
    
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
    
    // Apply a natural damping factor
    const dampingFactor = 1.618;
    const easedRotationY = rotationY / dampingFactor;
    const easedRotationX = rotationX / dampingFactor;
    
    // Set the rotation state
    setRotation({ x: easedRotationX, y: easedRotationY });
    setPosition({ x: distX / 20, y: distY / 20 });
    
    // Call the onHover handler if provided
    if (onHover) {
      onHover(true);
    }
  };
  
  // Animation ref for smooth return
  const returnAnimationRef = useRef<number | null>(null);
  
  // Handle mouse leave event - Smooth return to normal position
  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // Call the onHover handler if provided
    if (onHover) {
      onHover(false);
    }
    
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
  
  // Generate the correct class name for the card based on rarity 
  const getCardClasses = () => {
    let classes = 'card-container';
    
    // Add premium-card-container class for the 3D effect
    if (rarity === 'legendary' || rarity === 'epic' || rarity === 'rare') {
      classes += ' premium-card-container';
      
      // Add hover classes when hovered
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

  return (
    <div 
      ref={cardRef}
      className={`${getCardClasses()} ${className} ${isHovered ? 'is-hovering card-container-glow' : ''}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        borderRadius: '12px',
        backgroundColor: rarity === 'legendary' ? '#2a1a00' : 
                       rarity === 'epic' ? '#2a0a2a' : 
                       rarity === 'rare' ? '#001a33' : '#222',
        boxShadow: getCardGlow(),
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: isPlayed ? 'translateY(-10px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        overflow: 'hidden',
        ...style,
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
            backgroundImage: `url('${assetPath('/textures/foil.png')}')`,
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
            backgroundImage: `url('${assetPath('/textures/epic_holographic.png')}')`,
            backgroundSize: 'cover',
            opacity: 0.4,
            mixBlendMode: 'color-dodge',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Main Card Div with 3D transform for premium cards */}
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
          overflow: 'hidden',
          border: `2px solid ${rarityColors[rarity] || '#8c8c8c'}`,
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
            backgroundImage: rarity === 'legendary' 
              ? 'linear-gradient(135deg, #2a1a00 0%, #4a3000 100%)' 
              : rarity === 'epic'
                ? 'linear-gradient(135deg, #2a0a2a 0%, #3a1a3a 100%)'
                : 'linear-gradient(135deg, #222 0%, #333 100%)',
            borderRadius: '12px',
            zIndex: 0
          }}
        />
        
        {/* Gold foil background texture for legendary cards */}
        {rarity === 'legendary' && (
          <div className="holographic-card card-holographic-effect" data-rarity="legendary" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url('${assetPath('/textures/foil.png')}')`,
            backgroundSize: 'cover',
            borderRadius: '12px',
            opacity: 0.5,
            mixBlendMode: 'color-dodge',
            zIndex: 3,
            pointerEvents: 'none'
          }}/>
        )}
        
        {/* Holographic overlay effect for legendary cards */}
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
              backgroundImage: `url('${assetPath('/textures/epic_holographic.png')}')`,
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
        
        {/* Card content container */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px',
          boxSizing: 'border-box',
          zIndex: 10
        }}>
          {/* Card Art */}
          <div style={{
            width: '100%',
            height: `${size === 'small' ? '70px' : '100px'}`,
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#111',
            border: `1px solid ${
              rarity === 'legendary' 
                ? 'rgba(255, 176, 0, 0.5)' 
                : rarity === 'epic' 
                  ? 'rgba(163, 53, 238, 0.4)' 
                  : 'rgba(100, 100, 100, 0.3)'
            }`,
            boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            marginTop: '15px', // Space for mana cost
          }}>
            {imageSrc ? (
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
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2em',
                color: '#666'
              }}>
                {name.charAt(0)}
              </div>
            )}
            
            {/* Gradient overlay on image */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.7) 100%)',
              zIndex: 1
            }}/>
          </div>
          
          {/* Card Name */}
          <div style={{
            width: '90%',
            backgroundColor: '#333',
            borderRadius: '10px',
            marginTop: '5px',
            padding: '4px 0',
            border: `1px solid ${
              rarity === 'legendary' 
                ? '#ffb100' 
                : rarity === 'epic' 
                  ? '#a335ee' 
                  : '#FFD700'
            }`,
            boxShadow: rarity === 'epic' 
              ? '0 1px 3px rgba(163, 53, 238, 0.6)' 
              : '0 1px 3px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}>
            <div style={{
              color: 'white',
              fontSize: size === 'small' ? '10px' : '12px',
              fontWeight: 'bold',
              padding: '0 5px',
              textShadow: '0 1px 2px rgba(0,0,0,0.9)',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: 1.2
            }}>
              {name}
            </div>
          </div>
          
          {/* Card Description with keywords */}
          <div style={{
            width: '90%',
            marginTop: '5px',
            padding: '5px',
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '5px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Keywords */}
            {keywords.length > 0 && (
              <div style={{
                color: rarity === 'legendary' ? '#ffde7a' : 
                      rarity === 'epic' ? '#d8abff' : 
                      '#ffffff',
                fontSize: size === 'small' ? '8px' : '10px',
                fontWeight: 'bold',
                marginBottom: '3px',
                textAlign: 'center',
                textShadow: '0 1px 1px rgba(0,0,0,0.8)'
              }}>
                {keywords.join(' • ')}
              </div>
            )}
            
            {/* Description */}
            <div style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: size === 'small' ? '7px' : '9px',
              textAlign: 'center',
              overflow: 'visible',
              lineHeight: '1.3',
              textShadow: '0 1px 1px rgba(0,0,0,0.8)',
              wordWrap: 'break-word'
            }}>
              {description}
            </div>
          </div>
          
          {/* Mana Cost Badge */}
          {manaCost !== undefined && (
            <div style={{
              position: 'absolute',
              top: '5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#0070dd', // Blue for mana
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              border: '1px solid #0050aa',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
              zIndex: 20
            }}>
              {manaCost}
            </div>
          )}
          
          {/* Attack Badge */}
          {attack !== undefined && type === 'minion' && (
            <HexagonBadge 
              value={attack} 
              color="#f8b700" 
              position="left" 
              size={size === 'small' ? 28 : 32}
              style={{
                position: 'absolute',
                bottom: '5px',
                left: '5px',
                zIndex: 20
              }}
            />
          )}
          
          {/* Health Badge */}
          {health !== undefined && type === 'minion' && (
            <HexagonBadge 
              value={health} 
              color="#e61610" 
              position="right" 
              size={size === 'small' ? 28 : 32}
              style={{
                position: 'absolute', 
                bottom: '5px',
                right: '5px',
                zIndex: 20
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// To ensure this component is well-documented 
BaseCardFrame.displayName = 'BaseCardFrame';

export default BaseCardFrame;