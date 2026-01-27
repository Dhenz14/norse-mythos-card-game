/**
 * Card3D.tsx
 * 
 * A 3D card component using @react-three/fiber for rendering
 * Cards with animations, hover effects, and other interactive visuals.
 */

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Card3DProps {
  cardId: string;
  position: { x: number; y: number };
  isHovered?: boolean;
  isPlayed?: boolean;
  isLegendary?: boolean;
  frontTexture: string;
  backTexture: string;
  onClick?: () => void;
  onHover?: () => void;
}

export const Card3D: React.FC<Card3DProps> = ({
  cardId,
  position,
  isHovered = false,
  isPlayed = false,
  isLegendary = false,
  frontTexture,
  backTexture,
  onClick,
  onHover
}) => {
  // Try to load textures, use fallbacks if needed
  const textures = useTexture({
    front: frontTexture || '/assets/images/card-front-default.png',
    back: backTexture || '/assets/images/card-back.png',
    glow: '/assets/images/glow-effect.png',
  }, (textures) => {
    // Improve texture quality
    Object.values(textures).forEach(texture => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16;
    });
  });
  
  // Card mesh reference
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Animation state
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [animating, setAnimating] = useState(false);
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0, z: 0 });
  const [glowIntensity, setGlowIntensity] = useState(0);
  
  // Effect for hover state
  useEffect(() => {
    if (isHovered && !isPlayed) {
      setTargetRotation({ x: -0.1, y: 0.1, z: 0 });
      setGlowIntensity(0.6);
    } else if (!isPlayed) {
      setTargetRotation({ x: 0, y: 0, z: 0 });
      setGlowIntensity(0);
    }
    
    setAnimating(true);
  }, [isHovered, isPlayed]);
  
  // Effect for play animation
  useEffect(() => {
    if (isPlayed) {
      // Animate to played position
      setTargetRotation({ x: 0, y: 0, z: 0 });
      setGlowIntensity(0);
    }
    
    setAnimating(true);
  }, [isPlayed]);
  
  // Effect for legendary animation
  useEffect(() => {
    if (isLegendary) {
      // Start legendary animation
      const animation = () => {
        setTargetRotation({ x: 0, y: Math.PI * 2, z: 0 });
        setGlowIntensity(1);
        
        // After rotation, reset
        const timer = setTimeout(() => {
          setTargetRotation({ x: 0, y: 0, z: 0 });
          setGlowIntensity(isHovered ? 0.6 : 0);
        }, 2000);
        
        return () => clearTimeout(timer);
      };
      
      animation();
    }
  }, [isLegendary, isHovered]);
  
  // Animation frame handler
  useFrame(() => {
    if (!meshRef.current || !animating) return;
    
    // Smoothly interpolate to target rotation
    const newRotation = {
      x: THREE.MathUtils.lerp(rotation.x, targetRotation.x, 0.1),
      y: THREE.MathUtils.lerp(rotation.y, targetRotation.y, 0.1),
      z: THREE.MathUtils.lerp(rotation.z, targetRotation.z, 0.1)
    };
    
    // Update rotation state
    setRotation(newRotation);
    
    // Apply rotation to mesh
    meshRef.current.rotation.x = newRotation.x;
    meshRef.current.rotation.y = newRotation.y;
    meshRef.current.rotation.z = newRotation.z;
    
    // Update glow intensity
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, glowIntensity, 0.1);
    }
    
    // Check if we've reached the target (with small epsilon)
    if (
      Math.abs(rotation.x - targetRotation.x) < 0.001 &&
      Math.abs(rotation.y - targetRotation.y) < 0.001 &&
      Math.abs(rotation.z - targetRotation.z) < 0.001
    ) {
      setAnimating(false);
    }
  });
  
  // Card dimensions (roughly matching Hearthstone card proportions)
  const width = 1;
  const height = 1.4;
  const depth = 0.05;
  
  return (
    <group position={[position.x, position.y, 0]}>
      {/* Glow effect */}
      <mesh 
        ref={glowRef}
        position={[0, 0, -0.1]}
        scale={[1.2, 1.6, 1]}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial 
          map={textures.glow} 
          transparent={true} 
          opacity={0}
          color={isLegendary ? 0xffcc00 : 0xffffff}
          depthWrite={false}
        />
      </mesh>
      
      {/* Card mesh */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onClick={onClick}
        onPointerOver={onHover}
      >
        {/* Card geometry */}
        <boxGeometry args={[width, height, depth]} />
        
        {/* Card materials - using children for boxGeometry */}
        <meshStandardMaterial map={textures.front} attach="material-0" />
        <meshStandardMaterial map={textures.front} attach="material-1" />
        <meshStandardMaterial map={textures.front} attach="material-2" />
        <meshStandardMaterial map={textures.front} attach="material-3" />
        <meshStandardMaterial map={textures.front} attach="material-4" />
        <meshStandardMaterial map={textures.back} attach="material-5" />
      </mesh>
      
      {/* Legendary border effect for legendary cards */}
      {isLegendary && (
        <mesh position={[0, 0, 0.03]} scale={[1.02, 1.42, 1]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial 
            color={0xffcc00} 
            transparent={true} 
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default Card3D;