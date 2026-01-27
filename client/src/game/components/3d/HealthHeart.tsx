import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    [key: string]: THREE.Mesh;
  };
  materials: {
    [key: string]: THREE.Material;
  };
};

interface HealthHeartProps {
  scale?: number[];
  position?: number[];
  rotation?: number[];
  pulseSpeed?: number;
  glowIntensity?: number;
  healthPercentage?: number;
}

/**
 * HealthHeart - 3D heart model for health visualization
 * Features include pulsing animation and color changes based on health
 */
export function HealthHeart({
  scale = [1, 1, 1],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  pulseSpeed = 1,
  glowIntensity = 1,
  healthPercentage = 1
}: HealthHeartProps) {
  // Preload the heart model - using new model file
  useGLTF.preload('/models/health_heart_new.glb');
  console.log('Preloaded heart model at path: /models/health_heart_new.glb');
  
  // Load the 3D model - using new model file for better quality/compatibility
  const { nodes, materials } = useGLTF('/models/health_heart_new.glb') as GLTFResult;
  console.log('Loaded heart model nodes:', Object.keys(nodes).length, 'materials:', Object.keys(materials).length);
  
  // Create refs for animation
  const groupRef = useRef<THREE.Group>(null);
  const heartMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  
  // Configure material based on health percentage
  useEffect(() => {
    if (heartMaterialRef.current) {
      // Cast to MeshStandardMaterial to access properties
      const material = heartMaterialRef.current as THREE.MeshStandardMaterial;
      
      // Set color based on health
      if (healthPercentage <= 0.25) {
        // Critical - bright red
        material.color.set(new THREE.Color(0xff0000));
        material.emissive.set(new THREE.Color(0xff0000));
        material.emissiveIntensity = glowIntensity * 1.5;
      } else if (healthPercentage <= 0.5) {
        // Medium - orange red
        material.color.set(new THREE.Color(0xff3300));
        material.emissive.set(new THREE.Color(0xff3300));
        material.emissiveIntensity = glowIntensity * 1;
      } else {
        // Healthy - red
        material.color.set(new THREE.Color(0xcC0000));
        material.emissive.set(new THREE.Color(0xbb0000));
        material.emissiveIntensity = glowIntensity * 0.5;
      }
      
      // Adjust metalness and roughness
      material.metalness = 0.4;
      material.roughness = 0.4;
    }
  }, [healthPercentage, glowIntensity]);
  
  // Animation using useFrame hook
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Floating animation
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.0015 * pulseSpeed) * 0.1;
      
      // Gentle rotation
      groupRef.current.rotation.y += delta * 0.2;
      
      // Pulse animation
      const pulse = 1 + Math.sin(Date.now() * 0.003 * pulseSpeed) * 0.05;
      groupRef.current.scale.set(
        scale[0] * pulse,
        scale[1] * pulse,
        scale[2] * pulse
      );
    }
  });
  
  return (
    <group ref={groupRef} position={new THREE.Vector3(position[0], position[1], position[2])}>
      {Object.keys(nodes).map((nodeName) => {
        const node = nodes[nodeName];
        
        // Skip non-mesh nodes
        if (!(node instanceof THREE.Mesh)) return null;
        
        return (
          <mesh
            key={nodeName}
            geometry={node.geometry}
            rotation={[rotation[0], rotation[1], rotation[2]]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              ref={heartMaterialRef}
              color="#cc0000"
              emissive="#bb0000"
              emissiveIntensity={glowIntensity}
              metalness={0.4}
              roughness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default HealthHeart;