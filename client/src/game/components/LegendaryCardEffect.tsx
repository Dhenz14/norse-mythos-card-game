import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import LegendaryCardModel from './LegendaryCardModel';
import { CardData, CardInstance } from '../types';

interface LegendaryCardEffectProps {
  card: CardData | CardInstance;
  position?: { x: number, y: number };
  size?: { width: number, height: number };
  onComplete?: () => void;
  duration?: number;
}

/**
 * Component that displays a 3D model effect when a legendary card is played
 */
export const LegendaryCardEffect = ({ 
  card, 
  position = { x: 0, y: 0 }, 
  size = { width: 300, height: 300 },
  onComplete,
  duration = 5000 
}: LegendaryCardEffectProps) => {
  const [visible, setVisible] = useState(true);
  const [effectData, setEffectData] = useState<CardData | null>(null);
  
  // Extract card data from CardInstance if needed
  useEffect(() => {
    if (!card) return;
    
    if ('card' in card) {
      // It's a CardInstance
      setEffectData(card.card);
    } else {
      // It's already a CardData
      setEffectData(card);
    }
  }, [card]);
  
  // Auto-hide the effect after duration
  useEffect(() => {
    if (!visible) return;
    
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [visible, duration, onComplete]);
  
  // Don't render if not a legendary card
  if (!effectData || effectData.rarity !== 'legendary') return null;
  
  // Don't render if effect is no longer visible
  if (!visible) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: position.y - size.height / 2,
        left: position.x - size.width / 2,
        width: size.width,
        height: size.height,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Environment provides nice reflections and ambient lighting */}
        <Environment preset="sunset" />
        
        {/* The legendary card 3D model */}
        <LegendaryCardModel 
          card={effectData} 
          scale={2.5}
          position={[0, 0, 0]}
          animate={true}
        />
        
        {/* Allow camera movement for debugging, remove in production */}
        {/* <OrbitControls /> */}
      </Canvas>
    </div>
  );
};

export default LegendaryCardEffect;