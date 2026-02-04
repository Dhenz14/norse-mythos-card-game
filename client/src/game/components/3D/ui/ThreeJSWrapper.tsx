/**
 * ThreeJSWrapper - A wrapper component for Three.js scenes in the game
 * Provides a standardized canvas with appropriate lighting and camera setup
 * 
 * Moved from components/3d/ to components/3D/ui/ for folder consolidation
 */
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

interface ThreeJSWrapperProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
  allowZoom?: boolean;
  allowRotate?: boolean;
  controlsEnabled?: boolean;
  cameraPosition?: [number, number, number];
}

export function ThreeJSWrapper({
  children,
  width = 300,
  height = 300,
  className = '',
  allowZoom = false,
  allowRotate = true,
  controlsEnabled = true,
  cameraPosition = [0, 0, 5]
}: ThreeJSWrapperProps) {
  return (
    <div 
      className={`overflow-hidden ${className}`} 
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        legacy={false}
        gl={{ 
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={50}
          near={0.1}
          far={1000}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={0.3}
        />
        
        {controlsEnabled && (
          <OrbitControls
            enableZoom={allowZoom}
            enableRotate={allowRotate}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            minDistance={2}
            maxDistance={10}
          />
        )}
        
        {children}
      </Canvas>
    </div>
  );
}

export default ThreeJSWrapper;
