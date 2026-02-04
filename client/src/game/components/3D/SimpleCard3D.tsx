import React from 'react';
import { CardData, CardQuality } from '../../types';

interface SimpleCard3DProps {
  card: CardData;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  onClick?: () => void;
  isSelected?: boolean;
  isHovered?: boolean;
  quality?: CardQuality;
  showEffects?: boolean;
  showStats?: boolean;
  showText?: boolean;
  showFrame?: boolean;
  enableInteraction?: boolean;
  enableDrag?: boolean;
  enableHover?: boolean;
  onInteraction?: (type: 'drag' | 'hover' | 'click', value: boolean) => void;
}

export const SimpleCard3D: React.FC<SimpleCard3DProps> = ({
  card,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  isSelected = false,
  isHovered = false,
  quality,
  showEffects = false,
  showStats = true,
  showText = true,
  showFrame = true,
  enableInteraction = true,
  enableDrag = false,
  enableHover = true,
  onInteraction
}) => {
  const scaleArray = Array.isArray(scale) ? scale : [scale, scale, scale];
  
  return (
    <group position={position} rotation={rotation} scale={scaleArray as [number, number, number]}>
      <mesh onClick={onClick}>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial 
          color={isSelected ? '#ffcc00' : isHovered ? '#aaddff' : '#ffffff'} 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      {card.name && (
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[1.8, 0.3]} />
          <meshBasicMaterial color="#333333" />
        </mesh>
      )}
    </group>
  );
};

export default SimpleCard3D;
