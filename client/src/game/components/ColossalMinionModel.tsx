import { useRef, useEffect, useState, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";

// Preload the models
useGLTF.preload('/models/neptulon.glb');
useGLTF.preload('/models/giga_fin.glb');
useGLTF.preload('/models/colossus_moon.glb');

// Define card ID constants to match with our game data
const COLOSSAL_MODELS = {
  3001: '/models/neptulon.glb',    // Neptulon the Tidehunter
  3003: '/models/giga_fin.glb',    // Giga-Fin
  3006: '/models/colossus_moon.glb' // Colossus of the Moon
};

interface ColossalMinionModelProps {
  cardId: number;
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  onAnimationComplete?: () => void;
}

const ColossalMinionModel = ({ 
  cardId, 
  position = [0, 0, 0], 
  scale = [3, 3, 3], 
  rotation = [0, 0, 0],
  onAnimationComplete 
}: ColossalMinionModelProps) => {
  const modelRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Get the correct model path for this card ID
  const modelPath = COLOSSAL_MODELS[cardId as keyof typeof COLOSSAL_MODELS] || '/models/neptulon.glb';
  
  // Load the model
  const { scene: model } = useGLTF(modelPath) as GLTF & {
    scene: THREE.Group
  };
  
  // Update loading state when model is loaded
  useEffect(() => {
    if (model) {
      console.log(`Colossal minion model loaded: ${modelPath}`);
      setModelLoaded(true);
      
      // Clone the model so we can animate it independently
      if (modelRef.current) {
        modelRef.current.add(model.clone());
      }
      
      // Start a timer to auto-complete the animation after 4 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [model, modelPath, onAnimationComplete]);
  
  // Animation logic
  useFrame((_, delta) => {
    if (!modelRef.current || !isAnimating) return;
    
    // Update animation time
    setAnimationTime(prev => prev + delta);
    
    // Rotate the model
    modelRef.current.rotation.y += delta * 0.5;
    
    // Make the model float up and down
    const floatY = Math.sin(animationTime * 2) * 0.2;
    modelRef.current.position.y = floatY;
    
    // Scale the model up initially, then back down
    const scaleVal = 1 + Math.sin(Math.min(animationTime * 0.8, Math.PI/2)) * 0.2;
    modelRef.current.scale.set(scaleVal, scaleVal, scaleVal);
    
    // Emit particles or light effects (simplified with a point light)
    // In a real implementation, this would be a particle system
  });
  
  return (
    <group position={new THREE.Vector3(...position)} rotation={new THREE.Euler(...rotation)}>
      <Suspense fallback={null}>
        <group ref={modelRef} scale={scale}>
          {/* Dynamic point light for glow effect */}
          <pointLight
            color={cardId === 3001 ? "#00a2ff" : cardId === 3003 ? "#42f5a7" : "#f5d142"} 
            intensity={3}
            distance={10}
            decay={2}
          />
        </group>
        
        {/* Ambient lighting to ensure model is visible */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        
        {/* Optional orbit controls for development/debugging */}
        {process.env.NODE_ENV === 'development' && <OrbitControls />}
      </Suspense>
    </group>
  );
};

export default ColossalMinionModel;