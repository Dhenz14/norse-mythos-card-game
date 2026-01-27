/**
 * EnhancedCard3D.tsx
 * 
 * A 3D card component that leverages techniques inspired by TripoSR's rendering approach 
 * for more detailed and visually impressive card rendering.
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { useCursor } from '@react-three/drei';
import { CardData } from '../../types';
import * as THREE from 'three';

// Prop types
interface EnhancedCard3DProps {
  card: CardData;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  hoverable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  className?: string;
}

// Base component with TripoSR-inspired 3D rendering enhancements
export const EnhancedCard3D: React.FC<EnhancedCard3DProps> = ({
  card,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  hoverable = true,
  selected = false,
  onClick,
  onHover
}) => {
  // Refs and state
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  
  // Change cursor on hover
  useCursor(hovered);
  
  // Set up animation springs for hover and selection effects
  const { cardScale, cardRotation, cardPosition, cardEmissive } = useSpring({
    cardScale: hovered ? 1.1 : selected ? 1.05 : 1.0,
    cardRotation: hovered ? [rotation[0] - 0.1, rotation[1] + 0.1, rotation[2]] : rotation,
    cardPosition: hovered ? [position[0], position[1] + 0.1, position[2]] : position,
    cardEmissive: hovered ? 0.1 : selected ? 0.05 : 0.0,
    config: { mass: 1, tension: 280, friction: 60 }
  });
  
  // Add subtle continuous animation
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Subtle breathing animation
    const breathingSpeed = 1.5;
    const breathingAmplitude = 0.01;
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * breathingSpeed) * breathingAmplitude;
    
    // Subtle rotation
    const rotationSpeed = 0.3;
    const rotationAmplitude = 0.01;
    meshRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * rotationSpeed) * rotationAmplitude;
  });
  
  // Handle pointer events for interactivity
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    if (onHover) onHover();
  };
  
  const handlePointerOut = () => {
    setHovered(false);
  };
  
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onClick) onClick();
  };
  
  // Generate card color based on class/rarity
  const getCardColor = (): THREE.Color => {
    // Class-based color tints
    const classColors: { [key: string]: THREE.Color } = {
      Mage: new THREE.Color(0.3, 0.5, 0.8),
      Warrior: new THREE.Color(0.8, 0.3, 0.3),
      Priest: new THREE.Color(0.9, 0.9, 0.9),
      Paladin: new THREE.Color(0.9, 0.8, 0.3),
      Shaman: new THREE.Color(0.3, 0.7, 0.8),
      Warlock: new THREE.Color(0.6, 0.3, 0.7),
      Hunter: new THREE.Color(0.4, 0.7, 0.4),
      Druid: new THREE.Color(0.7, 0.5, 0.3),
      Rogue: new THREE.Color(0.4, 0.4, 0.4),
      Neutral: new THREE.Color(0.7, 0.7, 0.7)
    };
    
    // Default to neutral if class not found
    return classColors[card.class || 'Neutral'] || classColors.Neutral;
  };
  
  // Get card emissive color based on rarity
  const getEmissiveColor = (): THREE.Color => {
    // Rarity-based emissive colors
    const rarityColors: { [key: string]: THREE.Color } = {
      common: new THREE.Color(0.1, 0.1, 0.1),
      rare: new THREE.Color(0.2, 0.2, 0.6),
      epic: new THREE.Color(0.5, 0.2, 0.5),
      legendary: new THREE.Color(0.8, 0.6, 0.2)
    };
    
    return rarityColors[card.rarity?.toLowerCase() || 'common'] || rarityColors.common;
  };
  
  // Generate a rich material for the card
  const cardColor = getCardColor();
  const emissiveColor = getEmissiveColor();
  
  return (
    <animated.mesh
      ref={meshRef}
      position={cardPosition as any}
      rotation={cardRotation as any}
      scale={cardScale.to(s => [s * scale[0], s * scale[1], s * scale[2]]) as any}
      onClick={hoverable ? handleClick : undefined}
      onPointerOver={hoverable ? handlePointerOver : undefined}
      onPointerOut={hoverable ? handlePointerOut : undefined}
    >
      {/* Card geometry (plane with increased segments for better visuals) */}
      <planeGeometry args={[1, 1.4, 32, 32]} />
      
      {/* Enhanced physically-based material */}
      <meshStandardMaterial
        ref={materialRef}
        color={cardColor}
        roughness={0.6}
        metalness={0.4}
        emissive={emissiveColor}
        emissiveIntensity={cardEmissive}
        side={THREE.DoubleSide}
      />
    </animated.mesh>
  );
};

// Export both default and named for compatibility during transition
export default EnhancedCard3D;