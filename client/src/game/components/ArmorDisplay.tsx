import React from 'react';
// Consolidated 3D UI components from components/3D/ui/
import { ThreeJSWrapper, ArmorShield } from './3D/ui';

interface ArmorDisplayProps {
  value: number;
  className?: string;
}

export function ArmorDisplay({ value, className = '' }: ArmorDisplayProps) {
  // Only render if there's armor to show
  if (value <= 0) return null;
  
  // Calculate glow intensity based on armor value
  const getGlowIntensity = () => {
    if (value >= 20) return 2; // Strong glow for high armor
    if (value >= 10) return 1.5; // Medium glow for medium armor
    return 1; // Normal glow for low armor
  };

  // Get text color class based on armor value
  const getTextColorClass = () => {
    if (value >= 20) return 'text-blue-400';
    if (value >= 10) return 'text-blue-300';
    return 'text-blue-200';
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="relative">
        <ThreeJSWrapper 
          width={60} 
          height={60}
          allowZoom={false}
          allowRotate={true}
          controlsEnabled={true}
        >
          <ArmorShield
            armor={value}
            scale={[0.8, 0.8, 0.8]}
            glowIntensity={getGlowIntensity()}
          />
        </ThreeJSWrapper>
        <div className={`absolute inset-0 flex items-center justify-center font-bold text-base ${getTextColorClass()}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default ArmorDisplay;