# Holographic Card Effects Implementation Guide

This document explains the technical details of implementing the holographic card effects in the Norse Mythos card game.

## Overview

The project implements distinct holographic effects for different card rarities:

- **Legendary Cards**: Gold holographic effects with foil texture and shine-gold animation
- **Epic Cards**: Purple holographic effects with prismatic-shift animation

## Implementation Components

### Core Components

1. `HolographicCardEffect.tsx` - Base component for all holographic effects
2. `LegendaryCardEffect.tsx` - Specialized component for legendary card effects
3. `CardFrame.tsx` - Main card component that uses holographic effects
4. `BattlefieldCardFrame.tsx` - Optimized card for battlefield use

### Key CSS Properties

The effects use a 3-layer approach:

1. **Background effect** (z-index: 1)
2. **Main holographic effect** (z-index: 3)
3. **Shimmer animation** (z-index: 2)

## Legendary Card Effect (Gold)

```tsx
// LegendaryCardEffect.tsx
export const LegendaryCardEffect: React.FC<{ size?: string }> = ({ 
  size = 'full' 
}) => {
  const sizeClass = size === 'small' ? 'w-[120px] h-[170px]' : 'w-[240px] h-[340px]';
  
  return (
    <div className={`absolute inset-0 ${sizeClass} overflow-hidden rounded-lg pointer-events-none`}>
      {/* Background effect - subtle gold gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-amber-600 opacity-20 z-1"></div>
      
      {/* Main holographic effect - using foil.png texture */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60 z-3"
        style={{ 
          backgroundImage: `url('/textures/foil.png')`,
          mixBlendMode: 'color-dodge',
          filter: 'brightness(1.3)'
        }}
      >
        {/* Shine animation */}
        <div className="absolute inset-0 shine-gold-animation"></div>
      </div>
      
      {/* Shimmer effect - moving highlight */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-25 z-2 shimmer-animation"></div>
    </div>
  );
};
```

### CSS Animations for Legendary Cards

```css
/* In your CSS file */
@keyframes shine-gold {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.shine-gold-animation {
  background: linear-gradient(
    90deg, 
    transparent, 
    rgba(255, 215, 0, 0.5), 
    transparent
  );
  background-size: 200% 100%;
  animation: shine-gold 3s infinite linear;
}

.shimmer-animation {
  animation: shimmer 2.5s infinite linear;
  transform: skewX(-20deg);
}

@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-20deg); }
  100% { transform: translateX(100%) skewX(-20deg); }
}
```

## Epic Card Effect (Purple)

```tsx
// Purple Epic card effect usage in CardFrame.tsx
const renderHolographicEffect = () => {
  if (rarity === 'legendary') {
    return <LegendaryCardEffect size={isSmall ? 'small' : 'full'} />;
  } else if (rarity === 'epic') {
    return (
      <HolographicCardEffect 
        baseColor="rgba(128, 0, 128, 0.75)" 
        gradientColors={['purple', 'fuchsia', 'blue', 'purple']}
        blendMode="color-dodge"
        animationType="prismatic-shift"
        size={isSmall ? 'small' : 'full'}
      />
    );
  }
  return null;
};
```

### HolographicCardEffect Component

```tsx
// HolographicCardEffect.tsx
export const HolographicCardEffect: React.FC<{
  baseColor: string;
  gradientColors: string[];
  blendMode: string;
  animationType: 'prismatic-shift' | 'shine-gold';
  size?: 'small' | 'full';
}> = ({ 
  baseColor, 
  gradientColors, 
  blendMode, 
  animationType,
  size = 'full' 
}) => {
  const sizeClass = size === 'small' ? 'w-[120px] h-[170px]' : 'w-[240px] h-[340px]';
  
  return (
    <div className={`absolute inset-0 ${sizeClass} overflow-hidden rounded-lg pointer-events-none`}>
      {/* Base color layer */}
      <div 
        className="absolute inset-0 z-1" 
        style={{ backgroundColor: baseColor }}
      ></div>
      
      {/* Prismatic gradient effect */}
      <div 
        className={`absolute inset-0 bg-cover bg-center z-3 ${animationType === 'prismatic-shift' ? 'prismatic-shift' : ''}`}
        style={{ 
          background: `linear-gradient(90deg, ${gradientColors.join(', ')})`,
          backgroundSize: '400% 100%',
          mixBlendMode: blendMode as any,
        }}
      ></div>
      
      {/* Highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-25 z-2 shimmer-animation"></div>
    </div>
  );
};
```

### CSS Animations for Epic Cards

```css
/* In your CSS file */
@keyframes prismatic-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.prismatic-shift {
  animation: prismatic-shift 3s infinite linear;
}
```

## Integration in Card Components

```tsx
// In CardFrame.tsx
<div className="relative card-container">
  {/* Card base */}
  <div className="card-base rounded-lg overflow-hidden">
    {/* Card art */}
    <img src={cardArtUrl} alt={cardName} className="card-art" />
    
    {/* Apply holographic effect based on rarity */}
    {renderHolographicEffect()}
    
    {/* Card content (name, description, etc.) */}
    <div className="card-content z-10 relative">
      {/* Card elements go here */}
    </div>
  </div>
</div>
```

## Best Practices for Holographic Effects

1. **Z-Index Management**: 
   - Background effect: z-index 1
   - Main effect: z-index 3
   - Shimmer effect: z-index 2
   - Card content: z-index 10+

2. **Opacity Levels**:
   - Legendary effect: 0.6 (60%)
   - Epic effect: 0.75 (75%)

3. **Blend Modes**:
   - color-dodge provides the best holographic appearance
   - screen can be used for a more subtle effect

4. **Animation Performance**:
   - Use `will-change: transform` for better performance
   - Prefer CSS animations over JavaScript for smoother effects
   - Reduce animation complexity on small battlefield cards

5. **Responsive Considerations**:
   - Scale effects proportionally for different card sizes
   - Ensure effects cover the entire card with no "dead zones"