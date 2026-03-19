import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { routes } from './lib/routes';
import { Button } from './components/ui/button';
import UnifiedCardSystem from "./game/components/UnifiedCardSystem";
import "./index.css";
import "./styles/homepage.css";
import { CardTransformProvider } from "./game/context/CardTransformContext";
import CardTransformBridgeInitializer from "./game/components/CardTransformBridgeInitializer";
import ragnarokLogo from "./assets/images/ragnarok-logo.jpg";
import LoadingScreen from "./game/components/ui/LoadingScreen";
import AssetDownloadButton from "./game/components/ui/AssetDownloadButton";
import GoldenCardFilter from "./game/animations/GoldenCardFilter";
import { useStarterStore } from "./game/stores/starterStore";

const HiveKeychainLogin = lazy(() => import("./game/components/HiveKeychainLogin").then(m => ({ default: m.HiveKeychainLogin })));
const DailyQuestPanel = lazy(() => import("./game/components/quests/DailyQuestPanel"));
const FriendsPanel = lazy(() => import("./game/components/social/FriendsPanel"));

const RagnarokChessGame = lazy(() => import('./game/components/chess/RagnarokChessGame'));
const MultiplayerGame = lazy(() => import('./game/components/multiplayer/MultiplayerGame').then(m => ({ default: m.MultiplayerGame })));
const PacksPage = lazy(() => import('./game/components/packs/PacksPage'));
const CollectionPage = lazy(() => import('./game/components/collection/CollectionPage'));
const RankedLadderPage = lazy(() => import('./game/components/ladder/RankedLadderPage'));
const CampaignPage = lazy(() => import('./game/components/campaign/CampaignPage'));
const TradingPage = lazy(() => import('./game/components/trading/TradingPage'));
const TournamentListPage = lazy(() => import('./game/components/tournament/TournamentListPage'));
const SpectatorView = lazy(() => import('./game/components/spectator/SpectatorView'));
const MatchHistoryPage = lazy(() => import('./game/components/replay/MatchHistoryPage'));
const SettingsPage = lazy(() => import('./game/components/settings/SettingsPage'));
const TreasuryPage = lazy(() => import('./game/components/treasury/TreasuryPage'));
const MarketplacePage = lazy(() => import('./game/components/marketplace/MarketplacePage'));
const AdminPanel = lazy(() => import('./game/components/admin/AdminPanel'));
const StarterPackCeremony = lazy(() => import('./game/components/StarterPackCeremony'));
const DuatClaimPopup = lazy(() => import('./game/components/DuatClaimPopup'));

// PWA install prompt
let deferredInstallPrompt: Event | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
}

// Offline wrapper for routes that need a server
function OnlineOnly({ children, label }: { children: React.ReactNode; label: string }) {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!online) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-center px-8">
        <div>
          <p className="text-amber-400 text-xl font-bold mb-2">Offline Mode</p>
          <p className="text-gray-400 text-sm">{label} requires an internet connection.</p>
          <p className="text-gray-600 text-xs mt-4">Campaign, Collection, Deck Builder, and Settings work offline.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function HomePage() {
  const bgOverlayRef = useRef<HTMLDivElement>(null);
  const starterClaimed = useStarterStore(s => s.claimed);
  const [showCeremony, setShowCeremony] = useState(false);
  const [canInstall, setCanInstall] = useState(!!deferredInstallPrompt);

  useEffect(() => {
    if (bgOverlayRef.current) {
      bgOverlayRef.current.style.backgroundImage = `url(${ragnarokLogo})`;
    }
    const handler = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden homepage-container">
      <div
        ref={bgOverlayRef}
        className="absolute inset-0 opacity-20 homepage-bg-overlay"
      />

      {/* Hive Wallet — top-right corner */}
      <div className="absolute top-4 right-4 z-20">
        <Suspense fallback={<div className="animate-pulse h-8 w-32 bg-gray-700 rounded" />}>
          <HiveKeychainLogin />
        </Suspense>
      </div>

      {/* Daily Quests — top-left corner */}
      <div className="absolute top-4 left-4 z-20">
        <Suspense fallback={<div className="animate-pulse h-8 w-32 bg-gray-700 rounded" />}>
          <DailyQuestPanel />
        </Suspense>
      </div>

      {/* Friends — bottom-right corner */}
      <div className="absolute bottom-8 right-4 z-20">
        <Suspense fallback={<div className="animate-pulse h-8 w-32 bg-gray-700 rounded" />}>
          <FriendsPanel />
        </Suspense>
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
          <AssetDownloadButton />
          {canInstall && (
            <button
              onClick={() => {
                if (deferredInstallPrompt && 'prompt' in deferredInstallPrompt) {
                  (deferredInstallPrompt as any).prompt();
                  setCanInstall(false);
                }
              }}
              className="w-full py-2 text-sm font-semibold text-amber-400 border border-amber-700/40 bg-amber-900/20 rounded-lg hover:bg-amber-900/40 transition-colors"
            >
              Install as Desktop App
            </button>
          )}

          {!starterClaimed ? (
            <Button
              className="homepage-btn-primary w-full py-8 text-2xl font-bold tracking-wider uppercase border-2"
              onClick={() => setShowCeremony(true)}
            >
              Start Game
            </Button>
          ) : (
            <Link to={routes.game}>
              <Button className="homepage-btn-primary w-full py-8 text-2xl font-bold tracking-wider uppercase border-2">
                Play Game
              </Button>
            </Link>
          )}

          {/* ── Core Gameplay (large buttons) ── */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Link to={routes.campaign}>
              <Button className="homepage-btn-secondary w-full py-4 text-base font-semibold tracking-wide uppercase border">
                Campaign
              </Button>
            </Link>
            <Link to={routes.multiplayer}>
              <Button className="homepage-btn-secondary w-full py-4 text-base font-semibold tracking-wide uppercase border">
                Ranked
              </Button>
            </Link>
          </div>

          {/* ── Collection & Economy (medium buttons) ── */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <Link to={routes.packs}>
              <Button className="homepage-btn-secondary w-full py-3 text-sm font-semibold tracking-wide uppercase border">
                Packs
              </Button>
            </Link>
            <Link to={routes.collection}>
              <Button className="homepage-btn-secondary w-full py-3 text-sm font-semibold tracking-wide uppercase border">
                Collection
              </Button>
            </Link>
            <Link to={routes.trading}>
              <Button className="homepage-btn-secondary w-full py-3 text-sm font-semibold tracking-wide uppercase border">
                Trading
              </Button>
            </Link>
          </div>

          {/* ── Competitive (medium buttons) ── */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <Link to={routes.tournaments}>
              <Button className="homepage-btn-secondary w-full py-3 text-sm font-semibold tracking-wide uppercase border">
                Tournaments
              </Button>
            </Link>
            <Link to={routes.ladder}>
              <Button className="homepage-btn-secondary w-full py-3 text-sm font-semibold tracking-wide uppercase border">
                Ladder
              </Button>
            </Link>
          </div>

          {/* ── Utility (small buttons) ── */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <Link to={routes.history}>
              <Button className="homepage-btn-secondary w-full py-2 text-xs font-medium tracking-wide uppercase border opacity-70 hover:opacity-100">
                History
              </Button>
            </Link>
            <Link to={routes.settings}>
              <Button className="homepage-btn-secondary w-full py-2 text-xs font-medium tracking-wide uppercase border opacity-70 hover:opacity-100">
                Settings
              </Button>
            </Link>
            <Link to={routes.treasury}>
              <Button className="homepage-btn-secondary w-full py-2 text-xs font-medium tracking-wide uppercase border opacity-70 hover:opacity-100">
                Treasury
              </Button>
            </Link>
          </div>

          {import.meta.env.DEV && (
            <Link to={routes.game}>
              <Button className="homepage-btn-secondary w-full py-2 text-xs font-medium tracking-wide uppercase border opacity-30 hover:opacity-60 transition-opacity">
                Dev Test
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none homepage-bottom-gradient" />

      {showCeremony && (
        <Suspense fallback={null}>
          <StarterPackCeremony onComplete={() => setShowCeremony(false)} />
        </Suspense>
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#ff6b6b', background: '#1a1a2e', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1>Runtime Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 20 }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10, color: '#888', fontSize: 12 }}>{this.state.error.stack}</pre>
          <button onClick={() => { this.setState({ error: null }); window.location.hash = '/'; }} style={{ marginTop: 20, padding: '10px 20px', background: '#c9a84c', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#1a1a2e', fontWeight: 'bold' }}>Back to Home</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const [
        { default: initEffectSystem },
        { initializeGameStoreIntegration },
        { loadWasmEngine },
        { initGameStoreSubscriptions },
        { initGameFlowSubscription },
        { initializeNFTBridge },
        { setCardDataProvider },
        allCardsModule,
        artMappingModule,
      ] = await Promise.all([
        import("./game/effects/initEffectSystem"),
        import("./game/stores/gameStoreIntegration"),
        import("./game/engine/wasmLoader"),
        import("./game/stores/gameStore"),
        import("./game/stores/gameFlowStore"),
        import("./game/nft"),
        import("./data/blockchain/ICardDataProvider"),
        import("./game/data/allCards"),
        import("./game/utils/art/artMapping"),
      ]);
      setCardDataProvider({
        getCardById: (id: number) => allCardsModule.getCardById(id) as any,
        getAllCards: () => allCardsModule.default as any,
        getCardArtPath: (name: string, cardId?: number) => artMappingModule.getRawCardArtPath(name, cardId),
      });
      await initializeNFTBridge();
      initEffectSystem();
      initGameStoreSubscriptions();
      initGameFlowSubscription();
      cleanup = initializeGameStoreIntegration();
      loadWasmEngine().catch(err => console.warn('WASM engine load deferred:', err.message));
    })();
    return () => {
      cleanup?.();
      import("./game/stores/gameStore").then(m => m.disposeGameStoreSubscriptions());
      import("./game/stores/gameFlowStore").then(m => m.disposeGameFlowSubscription());
      import("./game/animations/BattlecryVFX").then(m => m.stopOrphanSweep());
    };
  }, []);

  return (
    <ErrorBoundary>
      <CardTransformProvider>
        <CardTransformBridgeInitializer />
        <UnifiedCardSystem />
        <GoldenCardFilter />

        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path={routes.home} element={<HomePage />} />
              <Route path={routes.game} element={<RagnarokChessGame />} />
              <Route path={routes.campaign} element={<CampaignPage />} />
              <Route path={routes.multiplayer} element={<MultiplayerGame />} />
              <Route path={routes.packs} element={<PacksPage />} />
              <Route path={routes.collection} element={<CollectionPage />} />
              <Route path={routes.ladder} element={<RankedLadderPage />} />
              <Route path={routes.trading} element={<OnlineOnly label="Trading"><TradingPage /></OnlineOnly>} />
              <Route path={routes.marketplace} element={<OnlineOnly label="Marketplace"><MarketplacePage /></OnlineOnly>} />
              <Route path={routes.treasury} element={<OnlineOnly label="Treasury"><TreasuryPage /></OnlineOnly>} />
              <Route path={routes.admin} element={<AdminPanel />} />
              <Route path={routes.tournaments} element={<OnlineOnly label="Tournaments"><TournamentListPage /></OnlineOnly>} />
              <Route path={routes.spectate} element={<SpectatorView />} />
              <Route path={routes.history} element={<MatchHistoryPage />} />
              <Route path={routes.settings} element={<SettingsPage />} />
              <Route path="*" element={
                <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
                  <h1 className="text-5xl font-bold text-amber-400 mb-4">404</h1>
                  <p className="text-gray-400 text-lg mb-8">Page not found</p>
                  <Link to={routes.home} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors">
                    Back to Home
                  </Link>
                </div>
              } />
            </Routes>
          </Suspense>
        </HashRouter>
        <Suspense fallback={null}><DuatClaimPopup /></Suspense>
      </CardTransformProvider>
    </ErrorBoundary>
  );
}

export default App;
