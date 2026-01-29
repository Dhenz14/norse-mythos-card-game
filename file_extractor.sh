#!/bin/bash

# Create a directory to store the extracted files
mkdir -p norse-card-game

# Extract the key files
cd norse-card-game

# Create component structure
mkdir -p src/components
mkdir -p src/game/components
mkdir -p src/game/hooks
mkdir -p src/game/context
mkdir -p public/textures

# Create essential card component files

cat > src/components/CardFrame.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { HolographicCardEffect } from '../game/components/HolographicCardEffect';
import { LegendaryCardEffect } from '../game/components/LegendaryCardEffect';

interface CardFrameProps {
  name: string;
  type?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  description?: string;
  attack?: number;
  health?: number;
  cost?: number;
  cardClass?: string;
  art?: string;
  id?: string;
  collectible?: boolean;
  isActive?: boolean;
}

export const CardFrame: React.FC<CardFrameProps> = ({
  name,
  type = 'Minion',
  rarity = 'common',
  description = '',
  attack = 0,
  health = 0,
  cost = 0,
  cardClass = 'Neutral',
  art = '/assets/images/cards/1001.png',
  id = '1001',
  collectible = true,
  isActive = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  useEffect(() => {
    const savedPref = localStorage.getItem('cardAnimationEnabled');
    if (savedPref !== null) {
      setAnimationEnabled(savedPref === 'true');
    }
  }, []);

  const handleToggleAnimation = () => {
    const newValue = !animationEnabled;
    setAnimationEnabled(newValue);
    localStorage.setItem('cardAnimationEnabled', String(newValue));
  };

  const getCardFrameClass = () => {
    switch (rarity) {
      case 'legendary':
        return 'card-frame-legendary';
      case 'epic':
        return 'card-frame-epic';
      case 'rare':
        return 'card-frame-rare';
      default:
        return 'card-frame-common';
    }
  };

  const getCardClassColor = () => {
    switch (cardClass.toLowerCase()) {
      case 'warrior':
        return 'text-red-600';
      case 'mage':
        return 'text-blue-500';
      case 'priest':
        return 'text-white';
      case 'rogue':
        return 'text-yellow-500';
      case 'paladin':
        return 'text-yellow-400';
      case 'hunter':
        return 'text-green-600';
      case 'shaman':
        return 'text-blue-400';
      case 'warlock':
        return 'text-purple-600';
      case 'druid':
        return 'text-orange-700';
      case 'necromancer':
        return 'text-emerald-400';
      default:
        return 'text-gray-200';
    }
  };

  const getAttackColor = () => {
    if (attack > 5) return 'bg-orange-500 text-white';
    return 'bg-yellow-500 text-white';
  };

  const getHealthColor = () => {
    if (health <= 2) return 'bg-red-700 text-white';
    return 'bg-red-600 text-white';
  };

  return (
    <div 
      className={`relative card-container ${isActive ? 'active-card' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative card ${getCardFrameClass()} transform transition-transform duration-300 ${isHovered && animationEnabled ? 'scale-110' : ''}`}>
        {/* Holographic effect for epic and legendary cards */}
        {rarity === 'epic' && animationEnabled && (
          <HolographicCardEffect intensity={0.75} color="purple" />
        )}
        {rarity === 'legendary' && animationEnabled && (
          <LegendaryCardEffect intensity={0.6} />
        )}
        
        {/* Card cost */}
        <div className="absolute top-1 left-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold z-10 border-2 border-yellow-300 shadow-lg">
          {cost}
        </div>
        
        {/* Card art */}
        <div className="card-art-container overflow-hidden rounded-lg">
          <img src={art} alt={name} className="card-art object-cover w-full h-full" />
        </div>
        
        {/* Card name */}
        <div className="card-name-container bg-gradient-to-r from-gray-800 to-gray-700 p-1 text-center">
          <h3 className={`card-name text-base font-bold truncate ${getCardClassColor()}`}>{name}</h3>
        </div>
        
        {/* Card description */}
        <div className="card-description-container bg-gradient-to-b from-gray-700 to-gray-800 p-2">
          <div className="card-type text-xs text-gray-400 text-center mb-1">{type} • {cardClass}</div>
          <p className="card-description text-center text-xs text-white">{description}</p>
        </div>
        
        {/* Attack and health */}
        {type === 'Minion' && (
          <>
            <div className={`absolute bottom-2 left-2 w-8 h-8 ${getAttackColor()} rounded-full flex items-center justify-center text-xl font-bold z-10 border-2 border-gray-800 shadow-lg`}>
              {attack}
            </div>
            <div className={`absolute bottom-2 right-2 w-8 h-8 ${getHealthColor()} rounded-full flex items-center justify-center text-xl font-bold z-10 border-2 border-gray-800 shadow-lg`}>
              {health}
            </div>
          </>
        )}
        
        {/* Rarity gem */}
        <div className={`absolute top-0 right-0 w-6 h-6 rounded-full z-10 ${
          rarity === 'legendary' ? 'bg-orange-400' : 
          rarity === 'epic' ? 'bg-purple-500' : 
          rarity === 'rare' ? 'bg-blue-400' : 
          'bg-gray-400'
        }`}></div>
      </div>
      
      {/* Toggle animation button */}
      <button 
        onClick={handleToggleAnimation}
        className="absolute bottom-[-25px] left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700"
      >
        {animationEnabled ? 'Disable Effects' : 'Enable Effects'}
      </button>
    </div>
  );
};

export default CardFrame;
EOF

cat > src/components/BattlefieldCardFrame.tsx << 'EOF'
import React from 'react';
import { HolographicCardEffect } from '../game/components/HolographicCardEffect';
import { LegendaryCardEffect } from '../game/components/LegendaryCardEffect';

interface BattlefieldCardFrameProps {
  name: string;
  type?: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  description?: string;
  attack?: number;
  health?: number;
  cost?: number;
  cardClass?: string;
  art?: string;
  id?: string;
  collectible?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export const BattlefieldCardFrame: React.FC<BattlefieldCardFrameProps> = ({
  name,
  type = 'Minion',
  rarity = 'common',
  description = '',
  attack = 0,
  health = 0,
  cost = 0,
  cardClass = 'Neutral',
  art = '/assets/images/cards/1001.png',
  id = '1001',
  collectible = true,
  isActive = false,
  onClick,
}) => {
  const getCardFrameClass = () => {
    switch (rarity) {
      case 'legendary':
        return 'bf-card-frame-legendary';
      case 'epic':
        return 'bf-card-frame-epic';
      case 'rare':
        return 'bf-card-frame-rare';
      default:
        return 'bf-card-frame-common';
    }
  };

  const getAttackColor = () => {
    if (attack > 5) return 'bg-orange-500 text-white';
    return 'bg-yellow-500 text-white';
  };

  const getHealthColor = () => {
    if (health <= 2) return 'bg-red-700 text-white';
    return 'bg-red-600 text-white';
  };

  return (
    <div 
      className={`relative battlefield-card-container ${isActive ? 'battlefield-active-card' : ''}`}
      onClick={onClick}
    >
      <div className={`relative battlefield-card ${getCardFrameClass()}`}>
        {/* Holographic effect for epic and legendary cards */}
        {rarity === 'epic' && (
          <HolographicCardEffect intensity={0.75} color="purple" />
        )}
        {rarity === 'legendary' && (
          <LegendaryCardEffect intensity={0.6} />
        )}
        
        {/* Card cost */}
        <div className="absolute top-1 left-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold z-10 border border-yellow-300 shadow-sm">
          {cost}
        </div>
        
        {/* Card art */}
        <div className="battlefield-card-art-container overflow-hidden rounded">
          <img src={art} alt={name} className="battlefield-card-art object-cover w-full h-full" />
        </div>
        
        {/* Attack and health */}
        {type === 'Minion' && (
          <>
            <div className={`absolute bottom-1 left-1 w-7 h-7 ${getAttackColor()} hex-badge flex items-center justify-center text-sm font-bold z-10 border border-black`}>
              {attack}
            </div>
            <div className={`absolute bottom-1 right-1 w-7 h-7 ${getHealthColor()} hex-badge flex items-center justify-center text-sm font-bold z-10 border border-black`}>
              {health}
            </div>
          </>
        )}
        
        {/* Rarity indicator (small dot) */}
        <div className={`absolute top-0 right-0 w-3 h-3 rounded-full z-10 ${
          rarity === 'legendary' ? 'bg-orange-400' : 
          rarity === 'epic' ? 'bg-purple-500' : 
          rarity === 'rare' ? 'bg-blue-400' : 
          'bg-gray-400'
        }`}></div>
      </div>
    </div>
  );
};

export default BattlefieldCardFrame;
EOF

cat > src/game/components/HolographicCardEffect.tsx << 'EOF'
import React, { useEffect, useRef } from 'react';

interface HolographicCardEffectProps {
  intensity?: number;
  speed?: number;
  color?: 'purple' | 'blue' | 'gold';
}

export const HolographicCardEffect: React.FC<HolographicCardEffectProps> = ({ 
  intensity = 0.75, 
  speed = 1,
  color = 'purple'
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const overlay = overlayRef.current;
    const gradient = gradientRef.current;
    
    if (!overlay || !gradient) return;
    
    let startTime = Date.now();
    let animationFrameId: number;
    
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!overlay.parentElement) return;
      
      const rect = overlay.parentElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Update the gradient position based on mouse
      gradient.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    };
    
    const animate = () => {
      const elapsedTime = (Date.now() - startTime) * speed * 0.001;
      
      // Update overlay opacity with sine wave for subtle pulse
      const pulseIntensity = (Math.sin(elapsedTime) * 0.1) + 0.9; // 0.8 to 1.0 range
      overlay.style.opacity = (intensity * pulseIntensity).toString();
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Add event listener
    document.addEventListener('mousemove', mouseMoveHandler);
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, speed, color]);
  
  const getColorStyles = () => {
    switch (color) {
      case 'purple':
        return {
          background: `linear-gradient(45deg, 
                      rgba(128, 0, 128, 0.3) 0%, 
                      rgba(200, 100, 250, 0.5) 25%, 
                      rgba(128, 0, 255, 0.3) 50%, 
                      rgba(180, 100, 220, 0.5) 75%, 
                      rgba(128, 0, 128, 0.3) 100%)`,
          backgroundSize: '200% 200%',
          mixBlendMode: 'color-dodge' as const
        };
      case 'blue':
        return {
          background: `linear-gradient(45deg, 
                      rgba(0, 50, 128, 0.3) 0%, 
                      rgba(100, 150, 250, 0.5) 25%, 
                      rgba(0, 100, 255, 0.3) 50%, 
                      rgba(100, 180, 220, 0.5) 75%, 
                      rgba(0, 50, 128, 0.3) 100%)`,
          backgroundSize: '200% 200%',
          mixBlendMode: 'color-dodge' as const
        };
      case 'gold':
        return {
          background: `linear-gradient(45deg, 
                      rgba(128, 100, 0, 0.3) 0%, 
                      rgba(250, 220, 100, 0.5) 25%, 
                      rgba(255, 215, 0, 0.3) 50%, 
                      rgba(220, 180, 100, 0.5) 75%, 
                      rgba(128, 100, 0, 0.3) 100%)`,
          backgroundSize: '200% 200%',
          mixBlendMode: 'color-dodge' as const
        };
      default:
        return {
          background: `linear-gradient(45deg, 
                      rgba(128, 0, 128, 0.3) 0%, 
                      rgba(200, 100, 250, 0.5) 25%, 
                      rgba(128, 0, 255, 0.3) 50%, 
                      rgba(180, 100, 220, 0.5) 75%, 
                      rgba(128, 0, 128, 0.3) 100%)`,
          backgroundSize: '200% 200%',
          mixBlendMode: 'color-dodge' as const
        };
    }
  };
  
  return (
    <>
      {/* Base holographic effect */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 rounded-lg overflow-hidden z-1"
        style={{ 
          opacity: intensity,
          filter: 'brightness(1.2)',
          pointerEvents: 'none'
        }}
      >
        {/* Dynamic gradient overlay */}
        <div 
          ref={gradientRef}
          className="absolute inset-0 w-full h-full z-3"
          style={getColorStyles()}
        />
        
        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 w-full h-full z-2"
          style={{
            background: 'url(/textures/epic_holographic.png)',
            backgroundSize: 'cover',
            opacity: 0.5,
            mixBlendMode: 'overlay'
          }}
        />
      </div>
    </>
  );
};
EOF

cat > src/game/components/LegendaryCardEffect.tsx << 'EOF'
import React, { useEffect, useRef } from 'react';

interface LegendaryCardEffectProps {
  intensity?: number;
  speed?: number;
}

export const LegendaryCardEffect: React.FC<LegendaryCardEffectProps> = ({ 
  intensity = 0.6, 
  speed = 1
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const overlay = overlayRef.current;
    const shine = shineRef.current;
    const foil = foilRef.current;
    
    if (!overlay || !shine || !foil || !overlay.parentElement) return;
    
    let startTime = Date.now();
    let animationFrameId: number;
    
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!overlay.parentElement) return;
      
      const rect = overlay.parentElement.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Update the shine position based on mouse
      const shineX = (x - 0.5) * 2; // -1 to 1
      const shineY = (y - 0.5) * 2; // -1 to 1
      
      // Calculate the angle based on mouse position
      const angle = Math.atan2(shineY, shineX) * (180 / Math.PI);
      const distance = Math.sqrt(shineX * shineX + shineY * shineY);
      
      // Update the shine gradient position
      shine.style.background = `linear-gradient(${angle}deg, 
                               rgba(255, 215, 0, ${0.8 * distance}) 0%, 
                               rgba(255, 255, 220, ${0.9 * distance}) 50%, 
                               rgba(255, 215, 0, ${0.8 * distance}) 100%)`;
      
      // Move the foil texture
      foil.style.backgroundPosition = `${x * 100}% ${y * 100}%`;
    };
    
    const animate = () => {
      const elapsedTime = (Date.now() - startTime) * speed * 0.001;
      
      // Update overlay opacity with sine wave for subtle pulse
      const pulseIntensity = (Math.sin(elapsedTime) * 0.1) + 0.9; // 0.8 to 1.0 range
      overlay.style.opacity = (intensity * pulseIntensity).toString();
      
      // Animate the shine
      if (!shine.parentElement) return;
      const shineAngle = (elapsedTime * 30) % 360;
      
      shine.style.transform = `rotate(${shineAngle}deg) translateX(${Math.sin(elapsedTime) * 50}%)`;
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Add event listener
    document.addEventListener('mousemove', mouseMoveHandler);
    
    // Start animation
    animate();
    
    // Cleanup
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, speed]);
  
  return (
    <>
      {/* Base legendary effect */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 rounded-lg overflow-hidden z-1"
        style={{ 
          opacity: intensity,
          filter: 'brightness(1.3)',
          pointerEvents: 'none'
        }}
      >
        {/* Gold foil texture */}
        <div 
          ref={foilRef}
          className="absolute inset-0 w-full h-full z-3"
          style={{
            background: 'url(/textures/foil.png)',
            backgroundSize: '200% 200%',
            opacity: 0.8,
            mixBlendMode: 'color-dodge'
          }}
        />
        
        {/* Gold shine effect */}
        <div 
          ref={shineRef}
          className="absolute inset-0 w-full h-full z-2"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 255, 220, 0.6) 50%, rgba(255, 215, 0, 0.3) 100%)',
            opacity: 0.8,
            mixBlendMode: 'overlay',
            animation: 'shine-gold 8s infinite'
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes shine-gold {
          0% { transform: translateX(-100%) translateY(-100%); }
          25% { transform: translateX(100%) translateY(-100%); }
          50% { transform: translateX(100%) translateY(100%); }
          75% { transform: translateX(-100%) translateY(100%); }
          100% { transform: translateX(-100%) translateY(-100%); }
        }
      `}</style>
    </>
  );
};
EOF

cat > README.md << 'EOF'
# Norse Mythology Card Game

A sophisticated Norse mythology-themed digital card game that delivers an immersive strategic experience through advanced interactive design and dynamic rendering techniques.

## Key Features

1. **Holographic Card Effects:**
   - Gold holographic effect for Legendary cards
   - Purple holographic effect for Epic cards
   - Interactive effects that respond to mouse movement
   - Professional multi-layer design with background effect, holographic overlay, and shimmer

2. **Card Transformation System:**
   - Cards transform from full size in hand to optimized compact versions on the battlefield
   - Optimized attack/health badges with hexagonal designs
   - Proportionally scaled text elements for battlefield cards
   
3. **Professional Card Layout:**
   - Attack values in orange/gold hexagons on the left
   - Health values in red hexagons on the right
   - Card name in dedicated area between art and description
   - Professional sectioning with Norse-themed design elements
   
4. **Technical Implementations:**
   - React for interactive frontend
   - TypeScript for type-safe logic
   - Tailwind CSS for responsive design
   - Framer Motion for animations
   - React Spring for card animations

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## Card Effects Implementation

The holographic effects use a 3-layer approach:
1. Background effect (z-index: 1)
2. Shimmer effect (z-index: 2)
3. Main holographic overlay (z-index: 3)

### Legendary Card Effect
- Gold color scheme
- Foil.png texture
- Shine-gold animation
- Opacity: 0.6
- Mix-blend-mode: color-dodge
- Brightness filter: 1.2-1.3x

### Epic Card Effect
- Purple color scheme
- Epic_holographic.png texture
- Prismatic-shift animation
- Opacity: 0.75
- Mix-blend-mode: color-dodge
- Increased gradient intensity

## Notes
- The battlefield cards are exactly 120x170px to match the design requirements
- Hex badges scaled to 28px (vs 32px for full cards) with proportionally reduced font sizes
- Z-index management is crucial for proper layer rendering
EOF

# Create CSS file with hexagonal badge styling
cat > src/game/components/CardFrameOverride.css << 'EOF'
/* CardFrameOverride.css */

/* Base Card Styles */
.card-container {
  width: 240px;
  height: 340px;
  margin: 15px;
  perspective: 1000px;
}

.card {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.card-art-container {
  height: 160px;
  overflow: hidden;
  border-bottom: 2px solid #333;
}

.card-name-container {
  padding: 5px;
  border-bottom: 2px solid #333;
}

.card-description-container {
  flex-grow: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

/* Battlefield Card Styles */
.battlefield-card-container {
  width: 120px;
  height: 170px;
  margin: 8px;
  perspective: 1000px;
}

.battlefield-card {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.battlefield-card-art-container {
  height: 100%;
  overflow: hidden;
}

/* Hexagon Badge Styling */
.hex-badge {
  -webkit-clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Card Rarity Frames */
.card-frame-common {
  border: 2px solid #9d9d9d;
  background-color: #1a1a1a;
}

.card-frame-rare {
  border: 2px solid #4a8dd8;
  background-color: #1a1a1a;
}

.card-frame-epic {
  border: 2px solid #9e3ebb;
  background-color: #1e1425;
}

.card-frame-legendary {
  border: 2px solid #d68f00;
  background-color: #2a1e0e;
}

/* Battlefield Card Rarity Frames */
.bf-card-frame-common {
  border: 1px solid #9d9d9d;
  background-color: #1a1a1a;
}

.bf-card-frame-rare {
  border: 1px solid #4a8dd8;
  background-color: #1a1a1a;
}

.bf-card-frame-epic {
  border: 1px solid #9e3ebb;
  background-color: #1e1425;
}

.bf-card-frame-legendary {
  border: 1px solid #d68f00;
  background-color: #2a1e0e;
}

/* Active Card State */
.active-card .card {
  transform: translateY(-10px);
  box-shadow: 0 8px 16px rgba(255, 215, 0, 0.4);
}

.battlefield-active-card .battlefield-card {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(255, 215, 0, 0.4);
}
EOF

cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #121212;
  color: white;
}

/* Import Card Frame Override Styles */
@import './game/components/CardFrameOverride.css';

/* Animation Keyframes */
@keyframes prismatic-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes shine-gold {
  0% { transform: translateX(-100%) translateY(-100%); }
  25% { transform: translateX(100%) translateY(-100%); }
  50% { transform: translateX(100%) translateY(100%); }
  75% { transform: translateX(-100%) translateY(100%); }
  100% { transform: translateX(-100%) translateY(-100%); }
}

/* Card Container Layout */
.cards-showcase {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;
}

.battlefield-showcase {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background-color: #234;
  border-radius: 8px;
  margin: 20px;
}

.card-transformation-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.transformation-controls {
  margin: 20px 0;
  display: flex;
  gap: 20px;
}
EOF

cat > src/App.tsx << 'EOF'
import React from 'react';
import './index.css';
import CardFrame from './components/CardFrame';
import BattlefieldCardFrame from './components/BattlefieldCardFrame';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <header className="w-full py-6 bg-gray-800 mb-8 text-center">
        <h1 className="text-4xl font-bold text-yellow-500">Norse Mythology Card Game</h1>
        <p className="text-gray-300 mt-2">Holographic Card Demo</p>
      </header>
      
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center text-white mb-6">Full-Size Cards</h2>
        <div className="cards-showcase">
          <CardFrame 
            name="Fenrir, Devourer of Gods" 
            type="Minion" 
            rarity="legendary" 
            description="Battlecry: Consume an enemy minion and gain its Attack and Health."
            attack={6} 
            health={6} 
            cost={8} 
            cardClass="Warrior"
          />
          
          <CardFrame 
            name="Valkyrie's Chosen" 
            type="Minion" 
            rarity="epic" 
            description="Whenever a friendly minion dies, add a random Legendary minion to your hand."
            attack={4} 
            health={5} 
            cost={5} 
            cardClass="Paladin"
          />
          
          <CardFrame 
            name="Mjölnir's Wrath" 
            type="Spell" 
            rarity="rare" 
            description="Deal 5 damage to an enemy minion. If it survives, deal 2 damage to all enemy minions."
            cost={6} 
            cardClass="Shaman"
          />
          
          <CardFrame 
            name="Nordic Warrior" 
            type="Minion" 
            rarity="common" 
            description="Taunt. Battlecry: Gain +1/+1 for each other minion with Taunt."
            attack={3} 
            health={4} 
            cost={4} 
            cardClass="Neutral"
          />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white my-6">Battlefield Cards</h2>
        <div className="battlefield-showcase">
          <BattlefieldCardFrame 
            name="Fenrir, Devourer of Gods" 
            rarity="legendary" 
            attack={6} 
            health={6} 
            cost={8} 
            cardClass="Warrior"
          />
          
          <BattlefieldCardFrame 
            name="Valkyrie's Chosen" 
            rarity="epic" 
            attack={4} 
            health={5} 
            cost={5} 
            cardClass="Paladin"
          />
          
          <BattlefieldCardFrame 
            name="Mjölnir's Wrath" 
            type="Spell" 
            rarity="rare" 
            cost={6} 
            cardClass="Shaman"
          />
          
          <BattlefieldCardFrame 
            name="Nordic Warrior" 
            rarity="common" 
            attack={3} 
            health={4} 
            cost={4} 
            cardClass="Neutral"
          />
          
          <BattlefieldCardFrame 
            name="Heimdall, Guardian" 
            rarity="legendary" 
            attack={4} 
            health={8} 
            cost={7} 
            cardClass="Neutral"
            isActive={true}
          />
        </div>
        
        <div className="text-center mt-8 mb-12">
          <p className="text-gray-300 mb-4">This demo showcases the holographic effects for different card rarities.</p>
          <p className="text-gray-400 text-sm">Hover over cards to see animations. Toggle effects with the button below each card.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
EOF

cat > package.json << 'EOF'
{
  "name": "norse-card-game",
  "version": "1.0.0",
  "description": "Norse Mythology Card Game with Holographic Effects",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-three/drei": "^9.88.4",
    "@react-three/fiber": "^8.15.12",
    "framer-motion": "^10.16.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.18.0",
    "react-spring": "^9.7.3",
    "tailwind-merge": "^2.0.0",
    "tailwindcss": "^3.3.5",
    "three": "^0.158.0",
    "zustand": "^4.4.6"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@types/three": "^0.158.2",
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "typescript": "^5.2.2",
    "vite": "^4.5.0"
  }
}
EOF

cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Norse Card Game</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
EOF

cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

cat > src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# Create texture placeholder files (these would be replaced with actual textures)
mkdir -p public/textures
touch public/textures/foil.png
touch public/textures/epic_holographic.png
touch public/textures/epic_holographic2.png

echo "File structure created successfully!"
echo "To use this project:"
echo "1. npm install"
echo "2. npm run dev"

# Create a zip file for easy download
zip -r norse-card-game.zip .

echo "Download the norse-card-game.zip file to get started!"