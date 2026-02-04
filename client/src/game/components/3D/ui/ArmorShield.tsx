/**
 * ArmorShield - 3D shield model for armor visualization
 * Features include glow effects and color changes based on armor value
 */
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ArmorShieldProps {
  armor?: number;
  maxArmor?: number;
  scale?: number | number[];
  position?: number[];
  rotation?: number[];
  glowIntensity?: number;
}

export function ArmorShield({
  armor = 0,
  maxArmor = 10,
  scale = [1, 1, 1],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  glowIntensity = 1
}: ArmorShieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  const scaleArray = Array.isArray(scale) ? scale : [scale, scale, scale];
  const armorPercent = Math.min(1, armor / maxArmor);
  
  // Calculate color based on armor amount
  const getShieldColor = () => {
    if (armorPercent >= 0.8) return '#4a90d9'; // High armor - bright blue
    if (armorPercent >= 0.5) return '#3a7ac9'; // Medium armor
    if (armorPercent >= 0.25) return '#2a6ab9'; // Low armor
    return '#1a5aa9'; // Very low armor
  };
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Subtle floating animation
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.05;
    }
    
    if (materialRef.current) {
      // Pulsing glow effect
      const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
      materialRef.current.emissiveIntensity = glowIntensity * pulse * armorPercent;
    }
  });
  
  return (
    <group 
      ref={groupRef} 
      position={new THREE.Vector3(position[0], position[1], position[2])}
      rotation={new THREE.Euler(rotation[0], rotation[1], rotation[2])}
      scale={new THREE.Vector3(scaleArray[0], scaleArray[1], scaleArray[2])}
    >
      {/* Shield base - hexagonal shape */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 1, 0.15, 6]} />
        <meshStandardMaterial
          ref={materialRef}
          color={getShieldColor()}
          emissive={getShieldColor()}
          emissiveIntensity={glowIntensity * 0.3}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      {/* Shield rim */}
      <mesh position={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.9, 0.08, 8, 6]} />
        <meshStandardMaterial
          color="#c0c0c0"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      
      {/* Center emblem */}
      <mesh position={[0, 0, 0.1]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#aaddff"
          emissiveIntensity={glowIntensity * 0.5}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

export default ArmorShield;
