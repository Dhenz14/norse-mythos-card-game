import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { routes } from './lib/routes';
import { Button } from './components/ui/button';
import UnifiedCardSystem from "./game/components/UnifiedCardSystem";
import "@fontsource/inter";
import "./index.css";
import { CardTransformProvider } from "./game/context/CardTransformContext";
import CardTransformBridgeInitializer from "./game/components/CardTransformBridgeInitializer";
import RagnarokChessGame from "./game/components/chess/RagnarokChessGame";
import PacksPage from "./game/components/packs/PacksPage";
import CollectionPage from "./game/components/packs/CollectionPage";

function HomePage() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-700 to-purple-900">
      <div className="max-w-2xl w-full bg-gray-100 p-8 rounded-lg shadow-xl text-center">
        <h1 className="text-4xl font-bold text-indigo-800 mb-6">Ragnarok Card Game</h1>
        
        <p className="text-lg text-gray-700 mb-8">
          A mythology-themed trading card game combining poker mechanics with Hearthstone-style gameplay.
        </p>

        <div className="space-y-4">
          <Link to={routes.game} className="transform transition-transform hover:scale-105 block">
            <Button className="w-full py-10 text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-xl border-2 border-amber-400">
              Play Game
            </Button>
          </Link>

          <Link to={routes.packs} className="transform transition-transform hover:scale-105 block">
            <Button className="w-full py-6 text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white shadow-lg border-2 border-yellow-400">
              📦 Card Packs
            </Button>
          </Link>

          <Link to={routes.collection} className="transform transition-transform hover:scale-105 block">
            <Button className="w-full py-6 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg border-2 border-blue-400">
              📚 My Collection
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
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
