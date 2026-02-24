import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { routes } from './lib/routes';
import { Button } from './components/ui/button';
import UnifiedCardSystem from "./game/components/UnifiedCardSystem";
import "@fontsource/inter";
import "./index.css";
import "./styles/homepage.css";
import { CardTransformProvider } from "./game/context/CardTransformContext";
import CardTransformBridgeInitializer from "./game/components/CardTransformBridgeInitializer";
import RagnarokChessGame from "./game/components/chess/RagnarokChessGame";
import { MultiplayerGame } from "./game/components/multiplayer/MultiplayerGame";
import PacksPage from "./game/components/packs/PacksPage";
import CollectionPage from "./game/components/collection/CollectionPage";
import ragnarokLogo from "./assets/images/ragnarok-logo.jpg";
import { initializeGameStoreIntegration } from "./game/stores/gameStoreIntegration";
import initEffectSystem from "./game/effects/initEffectSystem";
import { HiveKeychainLogin } from "./game/components/HiveKeychainLogin";

function HomePage() {
  const bgOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bgOverlayRef.current) {
      bgOverlayRef.current.style.backgroundImage = `url(${ragnarokLogo})`;
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden homepage-container">
      <div
        ref={bgOverlayRef}
        className="absolute inset-0 opacity-20 homepage-bg-overlay"
      />

      {/* Hive Wallet — top-right corner */}
      <div className="absolute top-4 right-4 z-20">
        <HiveKeychainLogin />
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-12 group">
          <div className="absolute inset-0 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700 homepage-logo-glow" />
          <img 
            src={ragnarokLogo} 
            alt="Ragnarok" 
            className="w-[600px] max-w-[90vw] relative z-10 drop-shadow-2xl homepage-logo-image"
          />
        </div>

        <div className="flex flex-col gap-4 w-full max-w-md px-4">
          <Link to={routes.game}>
            <Button className="homepage-btn-primary w-full py-8 text-2xl font-bold tracking-wider uppercase border-2">
              Play Game
            </Button>
          </Link>

          <Link to={routes.multiplayer}>
            <Button className="homepage-btn-secondary w-full py-5 text-lg font-semibold tracking-wide uppercase border">
              Ranked
            </Button>
          </Link>

          <Link to={routes.packs}>
            <Button className="homepage-btn-secondary w-full py-5 text-lg font-semibold tracking-wide uppercase border">
              Card Packs
            </Button>
          </Link>

          <Link to={routes.collection}>
            <Button className="homepage-btn-secondary w-full py-5 text-lg font-semibold tracking-wide uppercase border">
              My Collection
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none homepage-bottom-gradient" />
    </div>
  );
}

function App() {
  // Initialize event-driven architecture on app startup (Enrique integration)
  useEffect(() => {
    initEffectSystem();
    const cleanup = initializeGameStoreIntegration();
    return cleanup;
  }, []);

  return (
    <CardTransformProvider>
      <CardTransformBridgeInitializer />
      <UnifiedCardSystem />
      
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path={routes.home} element={<HomePage />} />
          <Route path={routes.game} element={<RagnarokChessGame />} />
          <Route path={routes.multiplayer} element={<MultiplayerGame />} />
          <Route path={routes.packs} element={<PacksPage />} />
          <Route path={routes.collection} element={<CollectionPage />} />
        </Routes>
      </BrowserRouter>
    </CardTransformProvider>
  );
}

export default App;
