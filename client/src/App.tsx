import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
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
import {
  BridgeRuntimeBoundary,
  CardDataRuntimeBoundary,
  GameplayRuntimeBoundary,
} from "./game/runtime/RuntimeBoundary";

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
const ExplorerPage = lazy(() => import('./game/components/explorer/ExplorerPage'));
const AdminPanel = lazy(() => import('./game/components/admin/AdminPanel'));
const StarterPackCeremony = lazy(() => import('./game/components/StarterPackCeremony'));
const DuatClaimPopup = lazy(() => import('./game/components/DuatClaimPopup'));
const FactionPledgePopup = lazy(() =>
	import('./game/pvp').then(m => ({ default: m.FactionPledgePopup }))
);

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

// PWA install prompt
let deferredInstallPrompt: DeferredInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e as DeferredInstallPromptEvent;
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
  const modeCards = [
    {
      title: 'Ranked PvP',
      eyebrow: 'Competitive',
      description: 'Queue into live opponents, hold your nerve, and climb with the full combat ruleset.',
      to: routes.multiplayer,
      tone: 'crimson',
    },
    {
      title: 'Campaign',
      eyebrow: 'Adventure',
      description: 'Push through faction storylines, boss phases, and realm-driven encounters.',
      to: routes.campaign,
      tone: 'emerald',
    },
    {
      title: 'Collection',
      eyebrow: 'Deckbuilding',
      description: 'Review your cards, inspect rarity treatments, and tune the pieces behind your army.',
      to: routes.collection,
      tone: 'azure',
    },
  ];
  const utilityLinks = [
    { label: 'Packs', to: routes.packs },
    { label: 'Trading', to: routes.trading },
    { label: 'Tournaments', to: routes.tournaments },
    { label: 'Ladder', to: routes.ladder },
    { label: 'History', to: routes.history },
    { label: 'Settings', to: routes.settings },
    { label: 'Treasury', to: routes.treasury },
    { label: 'Explorer', to: routes.explorer },
  ];

  useEffect(() => {
    if (bgOverlayRef.current) {
      bgOverlayRef.current.style.backgroundImage = `url(${ragnarokLogo})`;
    }
    const handler = () => setCanInstall(true);
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return (
    <div className="h-screen w-screen relative overflow-hidden homepage-container">
      <div
        ref={bgOverlayRef}
        className="absolute inset-0 opacity-20 homepage-bg-overlay"
      />

      <div className="homepage-scaffold">
        <div className="homepage-top-rail">
          <div className="homepage-top-widget homepage-top-widget-wide">
            <Suspense fallback={<div className="animate-pulse h-8 w-40 bg-gray-700 rounded" />}>
              <DailyQuestPanel />
            </Suspense>
          </div>
          <div className="homepage-top-widget-group">
            <div className="homepage-top-widget">
              <Suspense fallback={<div className="animate-pulse h-8 w-32 bg-gray-700 rounded" />}>
                <FriendsPanel />
              </Suspense>
            </div>
            <div className="homepage-top-widget">
              <Suspense fallback={<div className="animate-pulse h-8 w-32 bg-gray-700 rounded" />}>
                <HiveKeychainLogin />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="homepage-shell">
          <section className="homepage-hero-panel">
            <div className="relative group homepage-logo-block">
              <div className="absolute inset-0 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700 homepage-logo-glow" />
              <img
                src={ragnarokLogo}
                alt="Ragnarok"
                className="homepage-logo-image"
              />
            </div>

            <div className="homepage-kicker">Norse Mythos Card Game</div>
            <h1 className="homepage-title">Choose the lane. Enter with intent.</h1>
            <p className="homepage-copy">
              Solo battles, ranked PvP, and long-form campaign now read as distinct paths instead of one wall of buttons.
              Start where you want to play, then move into the rest of the ecosystem.
            </p>

            {!starterClaimed ? (
              <Button
                className="homepage-hero-cta"
                onClick={() => setShowCeremony(true)}
              >
                Claim Starter Deck
              </Button>
            ) : (
              <Link to={routes.game} className="homepage-cta-link">
                <Button className="homepage-hero-cta">
                  Enter Solo Arena
                </Button>
              </Link>
            )}

            <div className="homepage-hero-meta">
              <span>Solo AI battles</span>
              <span>Army builder</span>
              <span>Poker combat</span>
            </div>

            <div className="homepage-support-actions">
              <AssetDownloadButton />
              {canInstall && (
                <button
                  onClick={() => {
                    if (deferredInstallPrompt) {
                      deferredInstallPrompt.prompt();
                      setCanInstall(false);
                    }
                  }}
                  className="homepage-install-btn"
                >
                  Install Desktop App
                </button>
              )}
            </div>
          </section>

          <section className="homepage-destination-panel">
            <div className="homepage-section-header">
              <span className="homepage-section-kicker">Core Modes</span>
              <span className="homepage-section-note">The fastest way into a clean play flow.</span>
            </div>
            <div className="homepage-mode-grid">
              {modeCards.map((mode) => (
                <Link
                  key={mode.title}
                  to={mode.to}
                  className={`homepage-mode-card homepage-mode-card-${mode.tone}`}
                >
                  <span className="homepage-mode-eyebrow">{mode.eyebrow}</span>
                  <span className="homepage-mode-title">{mode.title}</span>
                  <span className="homepage-mode-copy">{mode.description}</span>
                  <span className="homepage-mode-arrow">Open</span>
                </Link>
              ))}
            </div>

            <div className="homepage-section-header homepage-section-header-utility">
              <span className="homepage-section-kicker">Utility Dock</span>
              <span className="homepage-section-note">Collection, progression, and system surfaces.</span>
            </div>
            <div className="homepage-utility-grid">
              {utilityLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="homepage-utility-link"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {import.meta.env.DEV && (
              <Link to={routes.game} className="homepage-dev-link">
                Dev Test Route
              </Link>
            )}
          </section>
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

/*
  ViewTransitionBridge — triggers the View Transitions API on route changes.
  This pairs with the ::view-transition-old/new CSS in index.css to create
  a subtle fade+scale between pages. Falls back silently on browsers that
  don't support the API (Safari, older Firefox).
*/
function ViewTransitionBridge() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;
    if (typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => {});
    }
  }, [location.pathname]);

  return null;
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

function GlobalOverlaysLayout() {
  return (
    <>
      <Outlet />
      <Suspense fallback={null}><DuatClaimPopup /></Suspense>
      <Suspense fallback={null}><FactionPledgePopup /></Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <CardTransformProvider>
        <CardTransformBridgeInitializer />
        <UnifiedCardSystem />
        <GoldenCardFilter />

        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ViewTransitionBridge />
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route element={<BridgeRuntimeBoundary />}>
                <Route element={<GlobalOverlaysLayout />}>
                  <Route path={routes.home} element={<HomePage />} />
                  <Route path={routes.campaign} element={<CampaignPage />} />
                  <Route path={routes.collection} element={<CollectionPage />} />
                  <Route path={routes.ladder} element={<RankedLadderPage />} />
                  <Route path={routes.trading} element={<OnlineOnly label="Trading"><TradingPage /></OnlineOnly>} />
                  <Route path={routes.marketplace} element={<OnlineOnly label="Marketplace"><MarketplacePage /></OnlineOnly>} />
                  <Route path={routes.treasury} element={<OnlineOnly label="Treasury"><TreasuryPage /></OnlineOnly>} />
                  <Route path={routes.explorer} element={<ExplorerPage />} />
                  <Route path={routes.admin} element={<AdminPanel />} />
                  <Route path={routes.tournaments} element={<OnlineOnly label="Tournaments"><TournamentListPage /></OnlineOnly>} />
                  <Route path={routes.history} element={<MatchHistoryPage />} />
                  <Route path={routes.settings} element={<SettingsPage />} />

                  <Route element={<CardDataRuntimeBoundary />}>
                    <Route path={routes.packs} element={<PacksPage />} />
                  </Route>

                  <Route element={<GameplayRuntimeBoundary />}>
                    <Route path={routes.game} element={<RagnarokChessGame />} />
                    <Route path={routes.multiplayer} element={<MultiplayerGame />} />
                    <Route path={routes.spectate} element={<SpectatorView />} />
                  </Route>
                </Route>
              </Route>

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
      </CardTransformProvider>
    </ErrorBoundary>
  );
}

export default App;
