import React, { useState } from 'react';
import HexagonBadge from './HexagonBadge';
import '../game/components/CardEnhancements.css'; // Import the exact same CSS used in the game
import '../game/components/HolographicEffect.css'; // Import the holographic effects CSS

interface BattlefieldCardFrameProps {
  attack: number;
  health: number;
  manaCost?: number; // Made optional
  name: string;
  imageSrc: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  type?: 'minion' | 'spell' | 'weapon';
  keywords?: string[];
  description?: string;
  onClick?: () => void;
}

/**
 * BattlefieldCardFrame
 * 
 * An optimized, compact card frame specifically designed for battlefield display.
 * Based on the CardFrame component but with a more space-efficient layout.
 */
const BattlefieldCardFrame: React.FC<BattlefieldCardFrameProps> = ({
  attack,
  health,
  manaCost,
  name,
  imageSrc,
  rarity = 'common',
  type = 'minion',
  keywords = [],
  description = '',
  onClick
}) => {
  // Rarity colors for the card border and effects
  const rarityColors = {
    common: '#8c8c8c', // gray
    rare: '#0070dd',   // blue
    epic: '#a335ee',   // purple
    legendary: '#ff8000' // orange/gold
  };
  
  // More compact dimensions for battlefield cards
  const cardWidth = 130; // Slightly wider for better proportions
  const cardHeight = 170; // Slightly taller for better proportions
  
  // Track image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Card glow based on rarity
  const getCardGlow = () => {
    if (rarity === 'legendary') return '0 0 15px rgba(255, 176, 0, 0.7)';
    if (rarity === 'epic') return '0 0 10px rgba(163, 53, 238, 0.7)';
    if (rarity === 'rare') return '0 0 8px rgba(0, 112, 221, 0.5)';
    return 'none';
  };

  return (
    <div 
      className="relative"
      style={{ 
        width: `${cardWidth}px`, 
        height: `${cardHeight}px`,
        cursor: onClick ? 'pointer' : 'default',
        transform: 'perspective(1000px)',
        transformStyle: 'preserve-3d'
      }}
      onClick={onClick}
    >
      {/* Base card with proper rarity styling */}
      <div 
        className={`${rarity === 'legendary' ? 'legendary-card' : ''} ${rarity === 'epic' ? 'epic-card' : ''}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: getCardGlow(),
          background: rarity === 'legendary' ? '#2a1a00' : 
                     rarity === 'epic' ? '#2a0a2a' : 
                     rarity === 'rare' ? '#001a33' : '#222',
          border: `2px solid ${rarityColors[rarity] || '#8c8c8c'}`,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Card background texture with rarity effect */}
        <div className="card-background absolute inset-0" 
          style={{
            backgroundImage: rarity === 'legendary' 
              ? 'linear-gradient(135deg, #2a1a00 0%, #4a3000 100%)' 
              : rarity === 'epic'
                ? 'linear-gradient(135deg, #2a0a2a 0%, #3a1a3a 100%)'
                : 'linear-gradient(135deg, #222 0%, #333 100%)',
            opacity: 0.9,
            zIndex: 1
          }}
        />
        
        {/* Full card background holographic effect for legendary cards - first layer */}
        {rarity === 'legendary' && (
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
              opacity: 0.4,
              mixBlendMode: 'color-dodge',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Main holographic effect overlay for legendary cards - second layer */}
        {rarity === 'legendary' && (
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
              opacity: 0.5,
              mixBlendMode: 'color-dodge',
              zIndex: 3,
              pointerEvents: 'none'
            }}
          />
        )}
        
        {/* Main holographic effect overlay for epic cards - second layer */}
        {rarity === 'epic' && (
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
              opacity: 0.7,
              mixBlendMode: 'color-dodge',
              zIndex: 3,
              pointerEvents: 'none',
              animation: 'prismatic-shift 8s infinite linear'
            }}
          />
        )}
        
        {/* Holographic shimmer overlay for legendary cards - third layer */}
        {rarity === 'legendary' && (
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
              backgroundImage: 'linear-gradient(135deg, rgba(255, 215, 0, 0) 25%, rgba(255, 215, 0, 0.2) 50%, rgba(255, 215, 0, 0) 75%)'
            }}
          />
        )}
        
        {/* Epic card shimmer effect - third layer */}
        {rarity === 'epic' && (
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
              backgroundImage: 'linear-gradient(135deg, rgba(148, 0, 211, 0) 25%, rgba(148, 0, 211, 0.2) 50%, rgba(148, 0, 211, 0) 75%)'
            }}
          />
        )}
        
        {/* Main card content */}
        <div className="relative flex flex-col h-full w-full z-20 p-1.5">
          {/* Upper area for card art */}
          <div className="card-art-container" style={{
            position: 'relative',
            width: '100%',
            height: '85px',
            marginTop: '20px', // Space for the attack/health badges
            borderRadius: '6px',
            overflow: 'hidden',
            backgroundColor: '#111', // Dark background
            border: `1px solid ${
              rarity === 'legendary' 
                ? 'rgba(255, 176, 0, 0.5)' 
                : rarity === 'epic' 
                  ? 'rgba(163, 53, 238, 0.4)' 
                  : 'rgba(100, 100, 100, 0.3)'
            }`,
            boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.5)'
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
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Art overlay with gradient */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)',
              zIndex: 1
            }}/>
            
            {/* Card name overlay at bottom of art */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              padding: '2px 5px',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(2px)',
              zIndex: 2
            }}>
              <div style={{
                color: rarity === 'legendary' 
                  ? '#ffde7a' 
                  : rarity === 'epic' 
                    ? '#d8abff' 
                    : 'white',
                fontSize: '9px',
                fontWeight: 'bold',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textShadow: '0px 1px 2px rgba(0,0,0,0.8)'
              }}>
                {name}
              </div>
            </div>
          </div>
          
          {/* Description Box */}
          <div style={{
            width: '100%',
            marginTop: '5px',
            padding: '3px 5px',
            minHeight: '40px',
            borderRadius: '5px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Keywords display */}
            {keywords.length > 0 && (
              <div style={{
                width: '100%',
                textAlign: 'center',
                color: rarity === 'legendary' ? '#ffde7a' : 
                       rarity === 'epic' ? '#d8abff' : 
                       '#ffffff',
                fontSize: '8px',
                fontWeight: 'bold',
                marginBottom: '2px',
                textShadow: '0px 1px 1px rgba(0,0,0,0.8)'
              }}>
                {keywords.join(' • ')}
              </div>
            )}
            
            {/* Description text */}
            <div style={{
              width: '100%',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '7px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              lineHeight: '1.3',
              textShadow: '0px 1px 1px rgba(0,0,0,0.8)'
            }}>
              {description}
            </div>
          </div>
          
          {/* Attack Value - Hexagonal badge at top left */}
          <HexagonBadge 
            value={attack} 
            color="#f8b700" 
            position="left" 
            size={30} // Slightly larger for better visibility
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'translate(-3px, -3px)',
              filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.6))',
              zIndex: 30
            }}
          />
          
          {/* Health Value - Hexagonal badge at top right */}
          <HexagonBadge 
            value={health} 
            color="#e61610" 
            position="right" 
            size={30} // Slightly larger for better visibility
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              transform: 'translate(3px, -3px)',
              filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.6))',
              zIndex: 30
            }}
          />
        </div>
      </div>
      
      {/* Card rarity effects and animations */}
      <style>
        {`
          @keyframes pulse-glow-gold {
            0% {
              box-shadow: 0 0 5px rgba(255, 215, 0, 0.4);
            }
            50% {
              box-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
            }
            100% {
              box-shadow: 0 0 5px rgba(255, 215, 0, 0.4);
            }
          }
          
          .legendary-card {
            animation: pulse-glow-gold 3s infinite;
            border-image: linear-gradient(to bottom, #ffcf40, #ffb60d) 1;
          }
          
          .card-holographic-effect {
            background-blend-mode: color-dodge;
            /* Removed mask image to allow effect to cover the entire card */
          }
          
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
          
          @keyframes pulse-glow-purple {
            0% {
              box-shadow: 0 0 5px rgba(163, 53, 238, 0.3);
            }
            50% {
              box-shadow: 0 0 12px rgba(163, 53, 238, 0.7);
            }
            100% {
              box-shadow: 0 0 5px rgba(163, 53, 238, 0.3);
            }
          }
          
          .epic-card {
            animation: pulse-glow-purple 3s infinite;
            border-image: linear-gradient(to bottom, #b36eec, #8126c0) 1;
          }
          
          .legendary-holographic {
            background-size: 150% 150%;
            animation: shine-gold 3s ease infinite;
          }
          
          @keyframes shine-gold {
            0% {
              background-position: 0% 0%;
            }
            25% {
              background-position: 100% 0%;
            }
            50% {
              background-position: 100% 100%;
            }
            75% {
              background-position: 0% 100%;
            }
            100% {
              background-position: 0% 0%;
            }
          }
          
          .epic-holographic {
            background-size: 200% 200%;
            animation: prismatic-shift 8s infinite linear;
          }
        `}
      </style>
    </div>
  );
};

export default BattlefieldCardFrame;