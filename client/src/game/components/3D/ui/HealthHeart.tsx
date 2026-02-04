/**
 * HealthHeart - 3D heart model for health visualization
 * Features include pulsing animation and color changes based on health
 * 
 * Moved from components/3d/ to components/3D/ui/ for folder consolidation
 */
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

export function HealthHeart({
  scale = [1, 1, 1],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  pulseSpeed = 1,
  glowIntensity = 1,
  healthPercentage = 1
}: HealthHeartProps) {
  useGLTF.preload('/models/health_heart_new.glb');
  
  const { nodes } = useGLTF('/models/health_heart_new.glb') as GLTFResult;
  
  const groupRef = useRef<THREE.Group>(null);
  const heartMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  
  useEffect(() => {
    if (heartMaterialRef.current) {
      const material = heartMaterialRef.current as THREE.MeshStandardMaterial;
      
      if (healthPercentage <= 0.25) {
        material.color.set(new THREE.Color(0xff0000));
        material.emissive.set(new THREE.Color(0xff0000));
        material.emissiveIntensity = glowIntensity * 1.5;
      } else if (healthPercentage <= 0.5) {
        material.color.set(new THREE.Color(0xff3300));
        material.emissive.set(new THREE.Color(0xff3300));
        material.emissiveIntensity = glowIntensity * 1;
      } else {
        material.color.set(new THREE.Color(0xcC0000));
        material.emissive.set(new THREE.Color(0xbb0000));
        material.emissiveIntensity = glowIntensity * 0.5;
      }
      
      material.metalness = 0.4;
      material.roughness = 0.4;
    }
  }, [healthPercentage, glowIntensity]);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.0015 * pulseSpeed) * 0.1;
      groupRef.current.rotation.y += delta * 0.2;
      
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
