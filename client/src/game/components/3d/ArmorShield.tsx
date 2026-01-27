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

interface ArmorShieldProps {
  scale?: number[];
  position?: number[];
  rotation?: number[];
  glowIntensity?: number;
}

/**
 * ArmorShield - 3D shield model for armor visualization
 * Features include rotation animation and metallic materials
 */
export function ArmorShield({
  scale = [1, 1, 1],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  glowIntensity = 1
}: ArmorShieldProps) {
  // Preload the shield model
  useGLTF.preload('/models/armor_shield.glb');
  
  // Load the 3D model
  const { nodes, materials } = useGLTF('/models/armor_shield.glb') as GLTFResult;
  
  // Create refs for animation
  const groupRef = useRef<THREE.Group>(null);
  const shieldMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  
  // Configure material
  useEffect(() => {
    if (shieldMaterialRef.current) {
      // Cast to MeshStandardMaterial to access properties
      const material = shieldMaterialRef.current as THREE.MeshStandardMaterial;
      
      // Set shield appearance
      material.color.set(new THREE.Color(0x888888)); // Silver-gray
      material.emissive.set(new THREE.Color(0x446688)); // Blue-ish glow
      material.emissiveIntensity = glowIntensity * 0.8;
      
      // Make it look metallic
      material.metalness = 0.9;
      material.roughness = 0.2;
    }
  }, [glowIntensity]);
  
  // Animation using useFrame hook
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.001) * 0.05;
      
      // Slow rotation
      groupRef.current.rotation.y += delta * 0.1;
    }
  });
  
  return (
    <group 
      ref={groupRef} 
      position={new THREE.Vector3(position[0], position[1], position[2])}
      scale={[scale[0], scale[1], scale[2]]}
    >
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
              ref={shieldMaterialRef}
              color="#888888"
              emissive="#446688"
              emissiveIntensity={glowIntensity * 0.8}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default ArmorShield;