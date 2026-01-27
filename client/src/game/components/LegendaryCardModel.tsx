import { useRef, useEffect, useState, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { CardData } from "../types";

// Preload models to improve performance
useGLTF.preload('/models/ragnaros.glb');
useGLTF.preload('/models/lich_king.glb');
useGLTF.preload('/models/sylvanas.glb');
useGLTF.preload('/models/neptulon.glb');
useGLTF.preload('/models/giga_fin.glb');
useGLTF.preload('/models/colossus_moon.glb');
useGLTF.preload('/models/fenrir_wolf.glb');

interface LegendaryCardModelProps {
  card: CardData;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  animate?: boolean;
}

// Map card IDs to their corresponding model files
const modelMap: Record<number, string> = {
  20024: '/models/ragnaros.glb',    // Ragnaros the Firelord
  20039: '/models/lich_king.glb',   // The Lich King
  20040: '/models/sylvanas.glb',    // Sylvanas Windrunner
  3001: '/models/neptulon.glb',     // Neptulon the Tidehunter
  3003: '/models/giga_fin.glb',     // Giga-Fin
  3006: '/models/colossus_moon.glb', // Colossus of the Moon
  20611: '/models/fenrir_wolf.glb', // Fenrir
  20612: '/models/fenrir_wolf.glb', // Fenrir, the Worldbreaker
  // Add more mappings as new models are created
};

export function LegendaryCardModel({ 
  card, 
  scale = 2.5, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  animate = true
}: LegendaryCardModelProps) {
  const modelRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelPath, setModelPath] = useState<string | null>(null);
  
  // Determine which model to use based on the card ID
  useEffect(() => {
    if (card && card.id) {
      const path = modelMap[card.id];
      setModelPath(path || null);
    }
  }, [card]);

  // If we don't have a model for this card, don't render anything
  if (!modelPath) return null;
  
  return (
    <ModelLoader
      modelPath={modelPath}
      scale={scale}
      position={position}
      rotation={rotation}
      animate={animate}
    />
  );
}

interface ModelLoaderProps {
  modelPath: string;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  animate: boolean;
}

function ModelLoader({ modelPath, scale, position, rotation, animate }: ModelLoaderProps) {
  const modelRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  // Load the 3D model
  const { scene: model } = useGLTF(modelPath) as GLTF & {
    scene: THREE.Group
  };
  
  // Update loading state when model is loaded
  useEffect(() => {
    if (model) {
      setModelLoaded(true);
      console.log(`Model loaded successfully: ${modelPath}`);
    }
  }, [model, modelPath]);
  
  // Add animation to the model
  useFrame((state, delta) => {
    if (modelRef.current && animate) {
      // Gentle floating animation
      modelRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
      
      // Slow rotation animation
      modelRef.current.rotation.y += delta * 0.3;
    }
  });
  
  return (
    <group 
      ref={modelRef} 
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {modelLoaded && model ? (
        <Suspense fallback={
          <mesh castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        }>
          <primitive object={model.clone()} castShadow receiveShadow />
          
          {/* Add a dramatic light specific to this model */}
          <pointLight
            position={[0, 2, 0]}
            intensity={1.5}
            color={modelPath.includes('ragnaros') ? '#ff7700' : 
                  modelPath.includes('lich_king') ? '#44aaff' : 
                  modelPath.includes('sylvanas') ? '#aa44ff' :
                  modelPath.includes('neptulon') ? '#00ddff' :
                  modelPath.includes('giga_fin') ? '#00ffaa' :
                  modelPath.includes('colossus_moon') ? '#aaccff' :
                  modelPath.includes('fenrir_wolf') ? '#cc3300' : // Red glow for Fenrir
                  '#ffffff'}
            distance={5}
            decay={2}
          />
        </Suspense>
      ) : (
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#CCCCCC" />
        </mesh>
      )}
    </group>
  );
}

export default LegendaryCardModel;