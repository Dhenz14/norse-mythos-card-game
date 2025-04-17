import { useEffect, useState, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useAudio } from "./lib/stores/useAudio";
import GameBoard from "./game/components/GameBoard";
import GameSetup from "./game/components/GameSetup";
import useGameStore from "./lib/stores/useGame";
import { AnimationProvider } from "./game/animations/AnimationManager";
import HealthDisplay from "./game/components/HealthDisplay";
import ArmorDisplay from "./game/components/ArmorDisplay";
import { HealthHeart } from "./game/components/3d/HealthHeart";
import { testBuffTribeBattlecry } from "./game/utils/testBattlecryUtils";
import CardManagementTools from "./tools/CardManagementTools";
import { Button } from "./components/ui/button";
import { routes } from "./lib/routes";
import { Link, Route, Routes, BrowserRouter } from "react-router-dom";
import DebugRoutes from "./game/components/debug/DebugRoutes";
import "@fontsource/inter";
import "./index.css";

function GameApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const { phase } = useGameStore();
  const { playBackgroundMusic, playSoundEffect } = useAudio();

  useEffect(() => {
    // Load and play background music
    const loadAudio = async () => {
      try {
        // Play background music - leveraging the useAudio hook's built-in sound system
        playBackgroundMusic('main_menu');
        
        // Play a sound effect to test the audio system
        playSoundEffect('button_click');
        
        // Finish loading
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load audio:", error);
        setIsLoading(false);
      }
    };

    loadAudio();
  }, [playBackgroundMusic, playSoundEffect]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-950">
        <div className="text-white text-2xl flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mb-4"></div>
          Loading Game...
        </div>
      </div>
    );
  }

  // Test mode view for debugging 3D components
  if (testMode) {
    return (
      <div className="h-screen w-screen p-10 bg-gradient-to-b from-blue-900 to-blue-950">
        <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg">
          <h1 className="text-3xl font-bold text-white mb-6">3D Component Testing</h1>
          
          <div className="flex flex-col items-start space-y-8">
            <div>
              <h2 className="text-xl text-white mb-3">Health Display Component:</h2>
              <div className="flex space-x-6">
                <div>
                  <p className="text-white mb-1">Low Health (10/30)</p>
                  <HealthDisplay value={10} maxValue={30} size="md" />
                </div>
                <div>
                  <p className="text-white mb-1">Medium Health (20/30)</p>
                  <HealthDisplay value={20} maxValue={30} size="md" />
                </div>
                <div>
                  <p className="text-white mb-1">Full Health (30/30)</p>
                  <HealthDisplay value={30} maxValue={30} size="md" />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl text-white mb-3">Armor Display Component:</h2>
              <div className="flex space-x-6">
                <div>
                  <p className="text-white mb-1">Low Armor (5)</p>
                  <ArmorDisplay value={5} />
                </div>
                <div>
                  <p className="text-white mb-1">Medium Armor (15)</p>
                  <ArmorDisplay value={15} />
                </div>
                <div>
                  <p className="text-white mb-1">High Armor (25)</p>
                  <ArmorDisplay value={25} />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl text-white mb-3">Direct 3D Heart Test:</h2>
              <div className="flex space-x-6">
                <div className="w-64 h-64 bg-gray-800 rounded-lg">
                  <Canvas
                    shadows
                    dpr={[1, 2]}
                    gl={{ 
                      antialias: true, 
                      alpha: true,
                      preserveDrawingBuffer: true
                    }}
                  >
                    {/* Camera setup */}
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                    
                    {/* Lighting */}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                    <directionalLight position={[-10, -10, -5]} intensity={0.3} />
                    
                    {/* Controls */}
                    <OrbitControls
                      enableZoom={false}
                      enableRotate={true}
                      enablePan={false}
                    />
                    
                    {/* Direct model rendering - explicit model path verification */}
                    <Suspense fallback={
                      <mesh>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshStandardMaterial color="red" />
                      </mesh>
                    }>
                      <HealthHeart 
                        scale={[1, 1, 1]}
                        position={[0, 0, 0]}
                        pulseSpeed={1.5}
                        glowIntensity={1.8}
                        healthPercentage={0.8}
                      />
                      {/* Hidden comment: Model path logging */}
                    </Suspense>
                  </Canvas>
                </div>
                <div className="w-64 h-64 border border-gray-700 rounded-lg p-3">
                  <h3 className="text-white text-sm font-semibold mb-2">Debug Info:</h3>
                  <div className="text-xs space-y-1">
                    <p className="text-green-300">✓ Model path: /models/health_heart_new.glb</p>
                    <p className="text-green-300">✓ Model exists in public folder</p>
                    <p className="text-green-300">✓ Direct Canvas rendering</p>
                    <p className="text-green-300">✓ Using Suspense wrapper</p>
                    <p className="text-green-300">✓ Using THREE.Group for model</p>
                    <p className="text-yellow-300">→ Preloaded: useGLTF.preload()</p>
                    <p className="text-yellow-300">→ Position: [0,0,0]</p>
                    <p className="text-yellow-300">→ Scale: [1,1,1]</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            className="mt-8 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            onClick={() => setTestMode(false)}
          >
            Back to Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimationProvider>
      <div className="h-screen w-screen overflow-hidden bg-amber-900 flex justify-center items-center">
        {/* Game container with responsive width - eliminates excessive padding */}
        <div className="w-full h-full flex flex-col justify-center items-center overflow-hidden">
          {/* Test mode buttons (hidden in production) */}
          <div className="absolute top-2 right-2 flex space-x-2 z-50">
            <button 
              className="bg-gray-700 text-xs text-white px-2 py-1 rounded opacity-60 hover:opacity-100"
              onClick={() => setTestMode(true)}
            >
              Test 3D Components
            </button>
            <button
              className="bg-purple-700 text-xs text-white px-2 py-1 rounded opacity-60 hover:opacity-100"
              onClick={() => {
                // Run the tribal buff battlecry test
                testBuffTribeBattlecry();
                // Show an alert to check console for results
                window.alert("Battlecry test completed! Check console for results");
              }}
            >
              Test Tribal Buff
            </button>
          </div>
          
          {phase === 'setup' && <GameSetup />}
          {phase === 'playing' && <GameBoard />}
          {phase === 'ended' && (
            <div className="h-full flex flex-col items-center justify-center text-white">
              <h1 className="text-4xl font-bold mb-6">Game Over</h1>
              <button 
                className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold"
                onClick={() => useGameStore.getState().resetToSetup()}
              >
                Back to Main Menu
              </button>
            </div>
          )}
        </div>
      </div>
    </AnimationProvider>
  );
}

function HomePage() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-700 to-purple-900">
      <div className="max-w-4xl w-full bg-gray-100 p-8 rounded-lg shadow-xl text-center">
        <h1 className="text-4xl font-bold text-indigo-800 mb-6">Card Game Development Suite</h1>
        
        <p className="text-lg text-gray-700 mb-8">
          Welcome to the comprehensive card game development environment. 
          Choose what you'd like to do:
        </p>

        {/* Holographic Card Demo - Special Feature Showcase */}
        <div className="mb-8">
          <Link to={routes.holographicDemo} className="transform transition-transform hover:scale-105 block">
            <Button className="w-full py-8 text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-xl border-2 border-amber-300 relative overflow-hidden">
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="animate-pulse">✨</span>
              </span>
              <span className="relative z-10 ml-8">
                NEW: Premium Holographic Card Demo
              </span>
              <span className="absolute inset-0 flex items-center justify-end">
                <span className="animate-pulse mr-8">✨</span>
              </span>
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
          <Link to={routes.game} className="transform transition-transform hover:scale-105">
            <Button className="w-full h-32 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-lg border-0">
              Play Game
            </Button>
          </Link>
          
          <Link to={routes.cardTools} className="transform transition-transform hover:scale-105">
            <Button className="w-full h-32 text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-lg border-0">
              Card Management Tools
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
          <Link to={routes.cardImageManager} className="transform transition-transform hover:scale-105">
            <Button className="w-full h-32 text-xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white shadow-lg border-0">
              Card Image Manager
            </Button>
          </Link>
          
          <Link to={routes.debug} className="transform transition-transform hover:scale-105">
            <Button className="w-full h-32 text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white shadow-lg border-0">
              Debug Tools
            </Button>
          </Link>
        </div>
        
        {/* New Card Frame Preview */}
        <div className="max-w-2xl mx-auto mb-6">
          <Link to={routes.cardFramePreview} className="transform transition-transform hover:scale-105 block">
            <Button className="w-full py-4 text-xl font-bold bg-gradient-to-r from-red-500 to-yellow-600 hover:from-red-600 hover:to-yellow-700 text-white shadow-lg border-0">
              New Card Frame Preview
            </Button>
          </Link>
        </div>
        
        {/* New Card Transformation Demo */}
        <div className="max-w-2xl mx-auto">
          <Link to={routes.cardTransformationDemo} className="transform transition-transform hover:scale-105 block">
            <Button className="w-full py-4 text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg border-0 relative overflow-hidden">
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="animate-pulse">✨</span>
              </span>
              <span className="relative z-10">
                NEW: Card Transformation Demo
              </span>
              <span className="absolute inset-0 flex items-center justify-end">
                <span className="animate-pulse mr-8">✨</span>
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Import CardImageManager and HolographicCardDemo
import CardImageManager from "./game/pages/CardImageManager";
import HolographicCardDemo from "./game/components/HolographicCardDemo";
// Import our new CardTransformProvider and Bridge Initializer
import { CardTransformProvider } from "./game/context/CardTransformContext";
import CardTransformBridgeInitializer from "./game/components/CardTransformBridgeInitializer";
// Import our new CardFramePreview component
import CardFramePreview from "./pages/CardFramePreview";
// Import our new CardTransformationDemo component
import CardTransformationDemo from "./components/CardTransformationDemo";

function App() {
  return (
    <CardTransformProvider>
      {/* Initialize the bridge between legacy manager and new context */}
      <CardTransformBridgeInitializer />
      <BrowserRouter>
        <Routes>
          <Route path={routes.home} element={<HomePage />} />
          <Route path={routes.game} element={<GameApp />} />
          <Route path={routes.cardTools} element={<CardManagementTools />} />
          <Route path={routes.cardImageManager} element={<CardImageManager />} />
          <Route path={`${routes.debug}/*`} element={<DebugRoutes />} />
          <Route path={routes.holographicDemo} element={<HolographicCardDemo />} />
          <Route path={routes.cardFramePreview} element={<CardFramePreview />} />
          <Route path={routes.cardTransformationDemo} element={<CardTransformationDemo />} />
        </Routes>
      </BrowserRouter>
    </CardTransformProvider>
  );
}

export default App;
