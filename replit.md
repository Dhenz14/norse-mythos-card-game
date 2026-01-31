# Norse Mythos Card Game - Ragnarok Integration

## Overview
This project is a digital collectible card game inspired by Hearthstone, integrating with the Ragnarok Play-to-Earn (P2E) system. It offers a strategic card game experience through deck building, card combat, AI opponents, and a Pet Battle PvP system. The game features four mythological factions (Norse, Greek, Japanese/Shinto, Egyptian), over 1000 collectible cards, and 76 playable heroes across 12 classes. It supports diverse card effects (battlecry, deathrattle, spell, combo, aura, passive) and uses an AI called "Think Tools" for strategic analysis. The project also incorporates P2E mechanics via Hive blockchain integration, inspired by Splinterlands.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React with TypeScript.
- **State Management**: Zustand.
- **Styling**: Tailwind CSS, extensive CSS variables, and a strict layer ownership system. Utilizes a modular CSS architecture with a defined layer order for maintainability.
- **Animations**: Framer Motion, React Spring, React Three Fiber/WebGL.
- **Build Tool**: Vite.
- **UI/UX**: Features a HUD overlay using React Portals, centralized `layoutTokens.ts` for consistent sizing and Z-index, portal-based tooltips, and a viewport lock system.
- **Responsive UI**: Fluid 100vw × 100vh layout using CSS `clamp()` with `vh` units for responsive sizing, avoiding scrollbars or letterboxing.

### Backend
- **Runtime**: Node.js with Express.
- **Language**: TypeScript.
- **API Design**: RESTful endpoints.
- **Real-time Communication**: WebSockets for AI integration.

### Core Game Systems
- **Card System**: Comprehensive Card Registry with Norse/Greek mythology theming, categorized by IDs, and including card validation.
- **Status Effects**: 8 distinct status effects (Poison, Bleed, Paralysis, Weakness, Vulnerable, Marked, Burn, Freeze).
- **Chess Board Layout**: A 7x5 grid for strategic piece movement.
- **Combat System**: PvP poker combat for major pieces and instant-kill mechanics for Pawns/Kings.
- **Hero System**: 76 heroes across 12 classes, each with unique Hero Powers, weapon upgrades, and passive abilities.
- **Deck Building**: UI for hero selection, deck construction (filtering, search, auto-fill, validation), and persistence.
- **Tooltip Systems**: Unified, portal-based tooltips for cards and hero powers, integrating keyword definitions.
- **Think Tools**: AI-powered strategic analysis via WebSockets.
- **Animation System**: `UnifiedAnimationOrchestrator` (Zustand) and `AnimationOverlay` (React Portals).
- **Event-Driven Architecture**: Uses a `GameEventBus` for decoupled game logic, UI updates, and subscriptions, supporting typed events (Phase, Card, Effect, Mana, Poker, UI). Includes subscribers for Audio, Notifications, and Animations, plus a `gameActions.ts` bridge module for event emission.
- **Resource Systems**: Hearthstone-style Mana and Poker-specific STA.
- **Element Weakness**: Gods/heroes with elements (Fire, Water, Electric, Grass, Light, Dark) for strategic advantages.

### Pure TypeScript Game Logic (AAA Architecture)
Follows a pattern of TSX Components → Pure TS Modules → Zustand Stores.
- **Game Flow**: `GameFlowManager.ts` defines a state machine for game phases, `TurnManager.ts` handles turn order, and `TurnOrchestrator.ts` coordinates combat phase sequencing.
- **Consolidated Zustand Stores**: `gameFlowStore.ts`, `unifiedCombatStore.ts`, `unifiedUIStore.ts`, and `heroDeckStore.ts` manage global game, combat, UI, and deck building states respectively. All legacy stores have been migrated to these unified stores.
- **Combat Modules**: `BettingEngine.ts` handles poker betting, `CombatResolver.ts` manages damage calculation, and `PhaseManager.ts` controls poker phase states.
- **Combat Arena Architecture**: `RagnarokCombatArena.tsx` uses a modular approach with custom hooks for AI, phase management, timers, and event handling, alongside presentational UI components.

### Abilities System Architecture
- **Hero Power EffectType System**: Manages 40+ hero power effect types.
- **Battlecry System**: Implements 25+ battlecry types, including Highlander effects.
- **Deathrattle System**: Handles various effects upon minion death.
- **Turn Effects System**: Processes start-of-turn and end-of-turn minion and status effects.

### Data Storage
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM.

### Hive Blockchain Integration (P2E)
- **Architecture**: Modeled after Splinterlands for Play-to-Earn data.
- **Data Layer Pattern**: Adapter-based architecture with three modes controlled by feature flags:
  - `local`: localStorage only (default, offline mode)
  - `test`: localStorage + JSON export for testing
  - `hive`: localStorage + blockchain sync (requires Keychain)
- **Key Files**:
  - `client/src/game/config/featureFlags.ts`: DATA_LAYER_MODE, BATTLE_HISTORY_ENABLED, etc.
  - `client/src/game/config/storageKeys.ts`: Centralized localStorage keys
  - `client/src/game/data/hive/adapters/AdapterFactory.ts`: Creates appropriate adapter based on mode
  - `client/src/game/data/hive/adapters/LocalStorageAdapter.ts`: Base adapter used by all modes
  - `client/src/game/data/battleHistory/battleHistoryStore.ts`: Tracks last 5 battles with Zustand persist
- **Battle History**: Uses consistent ID format `battle_[timestamp]_[random]_[mode]`
- **Game Actions Module**: `client/src/game/actions/gameActions.ts` provides typed wrappers for event emission
- **On-Chain Data**: Includes User Records, Player Stats, Match Results, Card Ownership, and Token Balances (RUNE, VALKYRIE, SEASON_POINTS).
- **Transaction Types**: Defined custom_json transactions for submitting battle teams, recording match outcomes, card transfers, pack opening, and reward claiming.

### Combat UI Styling (Norse Theme)
- **Modular CSS Architecture**: Located in `client/src/game/combat/styles/`
  - `tokens.css`: CSS custom properties for colors, sizes, z-index
  - `zones.css`: Battlefield zone positioning
  - `pot-display.css`: Norse-themed poker pot display
  - `index.css`: Import aggregator
- **Norse Aesthetic**: Gold accents, dark atmospheric backgrounds, runic styling elements

## Recent Changes (Jan 31, 2026)
- **Enrique Fork Integration**: Audited and integrated all changes from https://github.com/enrique89ve/norse-mythos-card-game
- **Dead Code Cleanup**: Removed ~4000 lines of orphaned code (AIGameSimulator, ThinkTools, RootCause, etc.)
- **Event-Driven Architecture**: Connected GameStoreIntegration in App.tsx, deprecated direct toast/audio calls
- **Hive Data Layer**: Implemented adapter pattern with LocalStorageAdapter, feature flags, and battle history store
- **gameActions.ts**: Created typed event emission wrappers for decoupled game logic
- **Norse Combat UI**: Integrated pot-display.css and updated tokens/zones for Norse theming

## External Dependencies

### Database
- **Neon PostgreSQL**

### AI Services
- **Smithery AI** (via WebSockets)

### Blockchain
- **Hive Keychain** (browser extension)

### Build & Development Tools
- **Vite**
- **Drizzle Kit**
- **TypeScript**
- **ESLint**