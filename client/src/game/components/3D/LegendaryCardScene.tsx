import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { SimpleCard3D } from './SimpleCard3D';
import { CardData, CardInstance } from '../../types';

interface LegendaryCardSceneProps {
  card: CardData | CardInstance;
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

export const LegendaryCardScene: React.FC<LegendaryCardSceneProps> = ({
  card,
  width = 300,
  height = 400,
  autoRotate = true
}) => {
  const cardData = 'card' in card ? card.card : card;
  
  return (
    <div style={{ width, height }} className="rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffcc00" />
        
        <Suspense fallback={null}>
          <SimpleCard3D 
            card={cardData} 
            position={[0, 0, 0]}
            scale={1.2}
          />
        </Suspense>
        
        <OrbitControls 
          autoRotate={autoRotate} 
          autoRotateSpeed={2}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
};

export default LegendaryCardScene;
