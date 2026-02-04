import React, { useEffect } from 'react';
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
import PacksPage from "./game/components/packs/PacksPage";
import CollectionPage from "./game/components/collection/CollectionPage";
import ragnarokLogo from "./assets/images/ragnarok-logo.jpg";
import { initializeGameStoreIntegration } from "./game/stores/gameStoreIntegration";

function HomePage() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 50%, #050508 100%)'
      }}
    >
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${ragnarokLogo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.3)'
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-12 group">
          <div 
            className="absolute inset-0 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"
            style={{
              background: 'radial-gradient(circle, rgba(200,50,50,0.4) 0%, transparent 70%)'
            }}
          />
          <img 
            src={ragnarokLogo} 
            alt="Ragnarok" 
            className="w-[600px] max-w-[90vw] relative z-10 drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(255,50,50,0.3)) drop-shadow(0 0 60px rgba(150,150,170,0.2))'
            }}
          />
        </div>

        <div className="flex flex-col gap-4 w-full max-w-md px-4">
          <Link to={routes.game}>
            <Button className="homepage-btn-primary w-full py-8 text-2xl font-bold tracking-wider uppercase border-2">
              Play Game
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
      
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(200,50,50,0.1) 0%, transparent 100%)'
        }}
      />
    </div>
  );
}

function App() {
  // Initialize event-driven architecture on app startup (Enrique integration)
  useEffect(() => {
    const cleanup = initializeGameStoreIntegration();
    return cleanup;
  }, []);

  return (
    <CardTransformProvider>
      <CardTransformBridgeInitializer />
      <UnifiedCardSystem />
      
      <BrowserRouter>
        <Routes>
          <Route path={routes.home} element={<HomePage />} />
          <Route path={routes.game} element={<RagnarokChessGame />} />
          <Route path={routes.packs} element={<PacksPage />} />
          <Route path={routes.collection} element={<CollectionPage />} />
        </Routes>
      </BrowserRouter>
    </CardTransformProvider>
  );
}

export default App;
