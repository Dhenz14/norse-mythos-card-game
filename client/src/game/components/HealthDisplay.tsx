import React, { useEffect, useState } from 'react';
// Using explicit import path to avoid case sensitivity issues
import { ThreeJSWrapper } from './3d/ThreeJSWrapper';
import { HealthHeart } from './3d/HealthHeart';

// Log model paths to verify they exist and that imports are working correctly
console.log('Health heart model path check:', '/models/health_heart_new.glb');
console.log('HealthHeart component loaded:', typeof HealthHeart === 'function');
console.log('ThreeJSWrapper component loaded:', typeof ThreeJSWrapper === 'function');

interface HealthDisplayProps {
  value: number;
  maxValue?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * HealthDisplay - Component for displaying health with 3D heart visualization
 * Used for hero health and minion health display
 */
export function HealthDisplay({ 
  value, 
  maxValue = 30, 
  size = 'md',
  className = '' 
}: HealthDisplayProps) {
  // Calculate the percentage of health remaining
  const healthPercentage = Math.max(0, Math.min(1, value / maxValue));
  
  // Size mapping - can be expanded for more size variants
  const sizeMap = {
    sm: { width: 40, height: 40, scale: [0.6, 0.6, 0.6], fontSize: 'text-sm' },
    md: { width: 60, height: 60, scale: [0.8, 0.8, 0.8], fontSize: 'text-base' },
    lg: { width: 80, height: 80, scale: [1, 1, 1], fontSize: 'text-lg' }
  };

  // Get size configuration
  const { width, height, scale, fontSize } = sizeMap[size];
  
  // Visual adjustments based on health percentage
  const getHeartPulseSpeed = () => {
    if (healthPercentage <= 0.25) return 2; // Fast pulse when low health
    if (healthPercentage <= 0.5) return 1.5; // Medium pulse when medium health
    return 1; // Normal pulse when high health
  };
  
  // Glow intensity increases as health decreases
  const getGlowIntensity = () => {
    if (healthPercentage <= 0.25) return 2;
    if (healthPercentage <= 0.5) return 1.5;
    return 1;
  };

  // Color based on health percentage
  const getTextColorClass = () => {
    if (healthPercentage <= 0.25) return 'text-red-500';
    if (healthPercentage <= 0.5) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="relative">
        <ThreeJSWrapper
          width={width}
          height={height}
          allowZoom={false}
          allowRotate={true}
          controlsEnabled={true}
        >
          <HealthHeart 
            scale={scale}
            pulseSpeed={getHeartPulseSpeed()}
            glowIntensity={getGlowIntensity()}
            healthPercentage={healthPercentage}
          />
        </ThreeJSWrapper>
        <div className={`absolute inset-0 flex items-center justify-center font-bold ${fontSize} ${getTextColorClass()}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default HealthDisplay;