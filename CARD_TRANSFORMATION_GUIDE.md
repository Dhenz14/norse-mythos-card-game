# Card Transformation Implementation Guide

This document explains the technical implementation of card transformations in the Norse Mythos card game, focusing on how cards change from full-sized versions in hand to optimized battlefield versions.

## Overview

The card transformation system allows cards to:
1. Display in full size with detailed art and information when in the player's hand
2. Transform to compact, optimized versions (120x170px) when played onto the battlefield
3. Maintain visual consistency and effects while optimizing performance

## Key Components

### Core Files

1. `useCardTransform.tsx` - Hook that manages the transformation logic
2. `CardTransformContext.tsx` - Context provider for sharing transform state
3. `CardFrame.tsx` - Primary component for hand cards
4. `BattlefieldCardFrame.tsx` - Optimized component for battlefield cards
5. `CardTransformationDemo.tsx` - Demo component showing the transformation

## Implementation Details

### Card Transform Hook

The `useCardTransform` hook manages the state and logic for transforming cards:

```tsx
// useCardTransform.tsx
import { useState, useCallback } from 'react';

export interface CardTransformOptions {
  duration?: number;
  initialSize?: 'full' | 'small';
  onTransformComplete?: () => void;
}

export const useCardTransform = (options: CardTransformOptions = {}) => {
  const {
    duration = 300,
    initialSize = 'full',
    onTransformComplete = () => {},
  } = options;
  
  const [size, setSize] = useState<'full' | 'small'>(initialSize);
  const [isTransforming, setIsTransforming] = useState(false);
  
  const transformToSmall = useCallback(() => {
    if (size === 'small' || isTransforming) return;
    
    setIsTransforming(true);
    
    // Start the transform animation
    setTimeout(() => {
      setSize('small');
      setIsTransforming(false);
      onTransformComplete();
    }, duration);
  }, [size, isTransforming, duration, onTransformComplete]);
  
  const transformToFull = useCallback(() => {
    if (size === 'full' || isTransforming) return;
    
    setIsTransforming(true);
    
    // Start the transform animation
    setTimeout(() => {
      setSize('full');
      setIsTransforming(false);
      onTransformComplete();
    }, duration);
  }, [size, isTransforming, duration, onTransformComplete]);
  
  return {
    size,
    isTransforming,
    transformToSmall,
    transformToFull,
  };
};
```

### Card Transform Context

The context provider allows transform state to be shared across components:

```tsx
// CardTransformContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface CardTransformContextType {
  transformCard: (cardId: string, targetSize: 'full' | 'small') => void;
  getCardSize: (cardId: string) => 'full' | 'small' | undefined;
  registerCard: (cardId: string, initialSize: 'full' | 'small') => void;
  unregisterCard: (cardId: string) => void;
}

const CardTransformContext = createContext<CardTransformContextType | undefined>(undefined);

export const CardTransformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cardSizes, setCardSizes] = useState<Record<string, 'full' | 'small'>>({});
  
  const registerCard = useCallback((cardId: string, initialSize: 'full' | 'small') => {
    setCardSizes(prev => ({
      ...prev,
      [cardId]: initialSize,
    }));
  }, []);
  
  const unregisterCard = useCallback((cardId: string) => {
    setCardSizes(prev => {
      const newSizes = { ...prev };
      delete newSizes[cardId];
      return newSizes;
    });
  }, []);
  
  const transformCard = useCallback((cardId: string, targetSize: 'full' | 'small') => {
    setCardSizes(prev => ({
      ...prev,
      [cardId]: targetSize,
    }));
  }, []);
  
  const getCardSize = useCallback((cardId: string) => {
    return cardSizes[cardId];
  }, [cardSizes]);
  
  return (
    <CardTransformContext.Provider value={{
      transformCard,
      getCardSize,
      registerCard,
      unregisterCard,
    }}>
      {children}
    </CardTransformContext.Provider>
  );
};

export const useCardTransformContext = () => {
  const context = useContext(CardTransformContext);
  
  if (!context) {
    throw new Error('useCardTransformContext must be used within a CardTransformProvider');
  }
  
  return context;
};
```

## Card Components

### Full-Sized Card Component

```tsx
// CardFrame.tsx (simplified)
import React, { useEffect } from 'react';
import { useCardTransformContext } from '../context/CardTransformContext';
import { LegendaryCardEffect } from './LegendaryCardEffect';
import { HolographicCardEffect } from './HolographicCardEffect';

interface CardFrameProps {
  id: string;
  name: string;
  artUrl: string;
  description: string;
  attack: number;
  health: number;
  manaCost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isTransforming?: boolean;
}

export const CardFrame: React.FC<CardFrameProps> = ({
  id,
  name,
  artUrl,
  description,
  attack,
  health,
  manaCost,
  rarity,
  isTransforming = false,
}) => {
  const { registerCard, unregisterCard, getCardSize } = useCardTransformContext();
  const size = getCardSize(id) || 'full';
  
  useEffect(() => {
    registerCard(id, 'full');
    return () => unregisterCard(id);
  }, [id, registerCard, unregisterCard]);
  
  // If card is transforming to small size, use the small card component
  if (size === 'small') {
    return (
      <BattlefieldCardFrame
        id={id}
        name={name}
        artUrl={artUrl}
        description={description}
        attack={attack}
        health={health}
        manaCost={manaCost}
        rarity={rarity}
      />
    );
  }
  
  // Render holographic effect based on rarity
  const renderHolographicEffect = () => {
    if (rarity === 'legendary') {
      return <LegendaryCardEffect />;
    } else if (rarity === 'epic') {
      return (
        <HolographicCardEffect
          baseColor="rgba(128, 0, 128, 0.75)"
          gradientColors={['purple', 'fuchsia', 'blue', 'purple']}
          blendMode="color-dodge"
          animationType="prismatic-shift"
        />
      );
    }
    return null;
  };
  
  return (
    <div className={`relative card-frame ${isTransforming ? 'transforming' : ''}`}>
      {/* Card frame with width 240px and height 340px */}
      <div className="w-[240px] h-[340px] bg-gray-800 rounded-lg overflow-hidden">
        {/* Card art */}
        <div className="card-art h-[140px] overflow-hidden">
          <img src={artUrl} alt={name} className="w-full object-cover" />
        </div>
        
        {/* Holographic effect overlay */}
        {renderHolographicEffect()}
        
        {/* Card name */}
        <div className="card-name text-white font-bold text-center py-2 px-3 text-lg">
          {name}
        </div>
        
        {/* Card stats */}
        <div className="card-stats flex justify-between px-3">
          {/* Attack hex badge */}
          <div className="attack-badge w-[32px] h-[32px] bg-orange-500 flex items-center justify-center text-white font-bold">
            {attack}
          </div>
          
          {/* Health hex badge */}
          <div className="health-badge w-[32px] h-[32px] bg-red-600 flex items-center justify-center text-white font-bold">
            {health}
          </div>
        </div>
        
        {/* Card description */}
        <div className="card-description text-white text-sm p-3 bg-gray-900 bg-opacity-80 mt-2">
          {description}
        </div>
      </div>
    </div>
  );
};
```

### Battlefield-Sized Card Component

```tsx
// BattlefieldCardFrame.tsx (simplified)
import React, { useEffect } from 'react';
import { useCardTransformContext } from '../context/CardTransformContext';
import { LegendaryCardEffect } from './LegendaryCardEffect';
import { HolographicCardEffect } from './HolographicCardEffect';

interface BattlefieldCardFrameProps {
  id: string;
  name: string;
  artUrl: string;
  description: string;
  attack: number;
  health: number;
  manaCost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BattlefieldCardFrame: React.FC<BattlefieldCardFrameProps> = ({
  id,
  name,
  artUrl,
  description,
  attack,
  health,
  manaCost,
  rarity,
}) => {
  const { registerCard, unregisterCard, getCardSize } = useCardTransformContext();
  const size = getCardSize(id) || 'small';
  
  useEffect(() => {
    registerCard(id, 'small');
    return () => unregisterCard(id);
  }, [id, registerCard, unregisterCard]);
  
  // If card should be full size, use the full card component
  if (size === 'full') {
    return (
      <CardFrame
        id={id}
        name={name}
        artUrl={artUrl}
        description={description}
        attack={attack}
        health={health}
        manaCost={manaCost}
        rarity={rarity}
      />
    );
  }
  
  // Render holographic effect based on rarity
  const renderHolographicEffect = () => {
    if (rarity === 'legendary') {
      return <LegendaryCardEffect size="small" />;
    } else if (rarity === 'epic') {
      return (
        <HolographicCardEffect
          baseColor="rgba(128, 0, 128, 0.75)"
          gradientColors={['purple', 'fuchsia', 'blue', 'purple']}
          blendMode="color-dodge"
          animationType="prismatic-shift"
          size="small"
        />
      );
    }
    return null;
  };
  
  return (
    <div className="relative battlefield-card-frame">
      {/* Card frame with width 120px and height 170px - EXACTLY as specified */}
      <div className="w-[120px] h-[170px] bg-gray-800 rounded-lg overflow-hidden">
        {/* Card art (proportionally smaller) */}
        <div className="card-art h-[70px] overflow-hidden">
          <img src={artUrl} alt={name} className="w-full object-cover" />
        </div>
        
        {/* Holographic effect overlay */}
        {renderHolographicEffect()}
        
        {/* Card name (smaller font) */}
        <div className="card-name text-white font-bold text-center py-1 px-2 text-xs">
          {name}
        </div>
        
        {/* Card stats (smaller badges) */}
        <div className="card-stats flex justify-between px-2">
          {/* Attack hex badge (28px vs 32px in full size) */}
          <div className="attack-badge w-[28px] h-[28px] bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
            {attack}
          </div>
          
          {/* Health hex badge (28px vs 32px in full size) */}
          <div className="health-badge w-[28px] h-[28px] bg-red-600 flex items-center justify-center text-white font-bold text-xs">
            {health}
          </div>
        </div>
        
        {/* Card description (smaller text, fewer lines) */}
        <div className="card-description text-white text-xs p-2 bg-gray-900 bg-opacity-80 mt-1 overflow-hidden" style={{ maxHeight: '40px' }}>
          {description}
        </div>
      </div>
    </div>
  );
};
```

## Animation CSS

The transition animations are defined in CSS:

```css
/* In CardFrameOverride.css */
.card-frame {
  transition: all 0.3s ease-out;
}

.card-frame.transforming {
  transform: scale(0.5);
  opacity: 0.8;
}

.battlefield-card-frame {
  transition: all 0.3s ease-in;
}

/* Hex badge styling */
.attack-badge, .health-badge {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  transition: width 0.3s, height 0.3s;
}
```

## Demo Implementation

```tsx
// CardTransformationDemo.tsx
import React, { useState } from 'react';
import { CardFrame } from '../components/CardFrame';
import { CardTransformProvider } from '../context/CardTransformContext';

export const CardTransformationDemo: React.FC = () => {
  const [cardPlayed, setCardPlayed] = useState(false);
  const demoCardId = 'demo-card-1';
  
  const playCard = () => {
    setCardPlayed(true);
  };
  
  const returnCardToHand = () => {
    setCardPlayed(false);
  };
  
  return (
    <CardTransformProvider>
      <div className="flex flex-col items-center p-5">
        <h2 className="text-2xl font-bold mb-4">Card Transformation Demo</h2>
        
        <div className="flex gap-10">
          <div className="hand-area border p-4 rounded">
            <h3 className="text-lg font-bold mb-2">Hand</h3>
            {!cardPlayed && (
              <div onClick={playCard} className="cursor-pointer hover:scale-105 transition-transform">
                <CardFrame
                  id={demoCardId}
                  name="Legendary Valkyrie"
                  artUrl="/card-art/valkyrie.jpg"
                  description="Battlecry: Choose an enemy minion. Deal 3 damage to it and adjacent minions."
                  attack={5}
                  health={5}
                  manaCost={6}
                  rarity="legendary"
                />
              </div>
            )}
          </div>
          
          <div className="battlefield-area border p-4 rounded">
            <h3 className="text-lg font-bold mb-2">Battlefield</h3>
            <div className="flex gap-2">
              {cardPlayed && (
                <div onClick={returnCardToHand} className="cursor-pointer hover:scale-105 transition-transform">
                  <CardFrame
                    id={demoCardId}
                    name="Legendary Valkyrie"
                    artUrl="/card-art/valkyrie.jpg"
                    description="Battlecry: Choose an enemy minion. Deal 3 damage to it and adjacent minions."
                    attack={5}
                    health={5}
                    manaCost={6}
                    rarity="legendary"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-5">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={cardPlayed ? returnCardToHand : playCard}
          >
            {cardPlayed ? 'Return to Hand' : 'Play Card'}
          </button>
        </div>
      </div>
    </CardTransformProvider>
  );
};
```

## Best Practices

1. **Exact Dimensions**: 
   - Hand cards: 240px × 340px
   - Battlefield cards: 120px × 170px (exactly half size)

2. **Proportional Scaling**:
   - All elements (text, badges, margins) scale proportionally
   - Maintain consistent aspect ratios

3. **Performance Optimization**:
   - Use CSS transitions instead of JavaScript animations when possible
   - Only animate necessary properties (transform, opacity)
   - Consider using `will-change` for smoother animations

4. **Visual Consistency**:
   - Ensure holographic effects look identical at both sizes
   - Maintain consistent color schemes and visual hierarchy

5. **Responsive Considerations**:
   - Test transformations on different screen sizes
   - Ensure battlefield layout accommodates multiple cards