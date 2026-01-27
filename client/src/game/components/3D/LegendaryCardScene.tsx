import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { Card3D } from './Card3D';
import { CardInstance, CardData } from '../../types';
import * as THREE from 'three';

// Component for creating a spotlight effect around legendary cards
const Spotlight = ({ position = [0, 5, 3] }: { position?: [number, number, number] }) => {
  const lightRef = useRef<THREE.SpotLight>(null);
  
  useFrame(({ clock }) => {
    if (lightRef.current) {
      // Subtle movement of the spotlight
      const t = clock.getElapsedTime() * 0.5;
      lightRef.current.position.x = position[0] + Math.sin(t) * 2;
      lightRef.current.position.z = position[2] + Math.cos(t) * 2;
    }
  });
  
  return (
    <spotLight
      ref={lightRef}
      position={position}
      angle={0.3}
      penumbra={0.8}
      intensity={1.5}
      color="#ffd700"
      castShadow
    />
  );
};

// Component to create particles for a magical effect
const MagicParticles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  
  // Generate random positions for particles
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 6;
    positions[i + 1] = (Math.random() - 0.5) * 6;
    positions[i + 2] = (Math.random() - 0.5) * 6;
  }
  
  useFrame(({ clock }) => {
    if (particlesRef.current) {
      // Rotate the particle system
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.1;
      
      // Update particles positions for a sparkling effect
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const time = clock.getElapsedTime();
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        // Add subtle movement to particles
        positions[i3 + 1] += Math.sin(time + i * 0.1) * 0.005;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffcc00"
        transparent
        opacity={0.8}
      />
    </points>
  );
};

interface LegendaryCardSceneProps {
  card: CardInstance | CardData;
  width?: number;
  height?: number;
}

export const LegendaryCardScene: React.FC<LegendaryCardSceneProps> = ({
  card,
  width = 300,
  height = 400
}) => {
  // Only show fancy 3D effects for legendary cards
  const cardData = 'card' in card ? card.card : card;
  const isLegendary = cardData.rarity === 'legendary';
  
  return (
    <div style={{ width, height, position: 'relative' }}>
      <Canvas 
        shadows
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: isLegendary ? 'radial-gradient(circle, #2a1a05 0%, #0a0a0f 100%)' : 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Environment lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={0.5} castShadow />
          
          {/* Special effects for legendary cards */}
          {isLegendary && (
            <>
              <Spotlight />
              <MagicParticles />
              <Environment preset="sunset" />
            </>
          )}
          
          {/* The card */}
          <Card3D 
            card={card}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={[1.8, 1.8, 1.8]}
            hoverable={true}
            selected={false}
          />
          
          {/* Allow the user to orbit around the card */}
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.5}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default LegendaryCardScene;