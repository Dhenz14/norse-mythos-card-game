import React from 'react';
import { ThreeJSWrapper } from './ThreeJSWrapper';

interface ArmorShieldProps {
  armor: number;
  maxArmor?: number;
  size?: number;
  className?: string;
  scale?: number | number[];
  glowIntensity?: number;
}

export const ArmorShield: React.FC<ArmorShieldProps> = ({ 
  armor, 
  maxArmor = 10, 
  size = 40,
  className = '',
  scale = 1,
  glowIntensity = 0
}) => {
  const scaleValue = Array.isArray(scale) ? scale[0] : scale;
  const armorPercent = Math.min(100, (armor / maxArmor) * 100);
  
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-300 to-gray-500 border-2 border-gray-600"
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
      >
        <div 
          className="absolute inset-1 bg-gradient-to-b from-blue-300 to-blue-600 opacity-80"
          style={{ 
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            height: `${armorPercent}%`,
            bottom: 0,
            top: 'auto'
          }}
        />
      </div>
      <span className="relative z-10 text-white font-bold text-sm drop-shadow-lg">
        {armor}
      </span>
    </div>
  );
};

export default ArmorShield;
