# Norse Mythos Card Game - Ragnarok Integration

## Overview
This project is a digital collectible card game inspired by Hearthstone, integrating with the Ragnarok Play-to-Earn (P2E) system. It aims to offer an engaging strategic card game experience through deck building, card combat, AI opponents, and a Pet Battle PvP system. The game features four mythological factions (Norse, Greek, Japanese/Shinto, Egyptian), over 1000 collectible cards, and 76 playable heroes across 12 classes. It supports diverse card effects (battlecry, deathrattle, spell, combo, aura, passive) and uses an AI called "Think Tools" for strategic analysis. The project also lays the groundwork for P2E mechanics via Hive blockchain integration, inspired by Splinterlands.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React with TypeScript.
- **State Management**: Zustand.
- **Styling**: Tailwind CSS, extensive CSS variables, and a strict layer ownership system.
- **Animations**: Framer Motion, React Spring, React Three Fiber/WebGL.
- **Build Tool**: Vite.
- **UI/UX**: HUD overlay using React Portals, centralized `layoutTokens.ts` for consistent sizing and Z-index, portal-based tooltips, and a viewport lock system.
- **Responsive UI**: Fluid 100vw × 100vh layout without scrollbars or letterboxing, utilizing CSS `clamp()` with `vh` units for responsive sizing, avoiding `transform: scale()`, `overflow: auto/scroll`, and `minmax(..., 1fr)`.
- **Modular CSS System**: AAA-quality modular architecture with 25+ CSS files across 6 directories.

### CSS Architecture (Jan 31, 2026)
**Location**: `client/src/game/combat/styles/`

**Layer Order** (Critical - Do Not Reorder):
| Layer | Directory | Purpose |
|-------|-----------|---------|
| 1 | tokens.css | Design tokens (colors, spacing, z-index) |
| 2 | base/ | Reset, responsive breakpoints, pointer events |
| 3 | zones.css | Zone positioning variables |
| 4 | layout/ | Grid structure, arena, panels, battlefield |
| 5 | components/ | Individual UI elements (14 files) |
| 6 | cards/ | Card-specific styling (3 files) |
| 7 | effects/ | Animations, glows, transitions (4 files) |
| 8 | themes/ | Faction-specific overrides (future) |

**File Structure**:
```
styles/
├── index.css          # Master import (load order)
├── tokens.css         # CSS variables
├── zones.css          # Zone positioning
├── pot-display.css    # Pot component
├── base/
│   ├── reset.css
│   ├── responsive.css
│   └── pointer-events.css
├── layout/
│   ├── arena-grid.css
│   ├── poker-panel.css
│   └── battlefield.css
├── components/
│   ├── timer.css
│   ├── hp-bar.css
│   ├── sta-bar.css
│   ├── hero-portrait.css
│   ├── end-turn-button.css
│   ├── betting-controls.css
│   ├── hand-strength.css
│   ├── phase-indicator.css
│   ├── activity-log.css
│   ├── community-cards.css
│   ├── hole-cards.css
│   ├── blind-toggle.css
│   └── weapon-slots.css
├── cards/
│   ├── card-frame.css
│   ├── card-highlight.css
│   └── face-down.css
├── effects/
│   ├── glow-effects.css
│   ├── elemental-glows.css
│   ├── showdown.css
│   └── hero-death.css
└── themes/           # Future: norse.css, greek.css, etc.
```

**Architecture Principles**:
- Single source of truth: All values reference CSS tokens
- Zone separation: Positioning in zones.css, styling in components
- No magic numbers: Everything uses CSS variables
- Responsive via tokens: Media queries update tokens, not rules
- Legacy fallback: RagnarokCombatArena.css imports modular system
- Tailwind Animation: tailwindcss-animated available for pre-built animation utilities

### Backend
- **Runtime**: Node.js with Express.
- **Language**: TypeScript.
- **API Design**: RESTful endpoints.
- **Real-time Communication**: WebSockets for AI integration.

### Core Game Systems
- **Card System**: Comprehensive Card Registry with Norse/Greek mythology theming, categorized by IDs for neutrals, classes, tokens, and creature types. Includes card validation.
- **Status Effects**: 8 distinct status effects (Poison, Bleed, Paralysis, Weakness, Vulnerable, Marked, Burn, Freeze) influencing combat and turn phases.
- **Chess Board Layout**: A 7x5 grid for strategic piece movement.
- **Combat System**: PvP poker combat for major pieces (Valkyrie Weapon Rules) and instant-kill mechanics for Pawns/Kings.
- **Hero System**: 76 heroes across 12 classes, assignable to chess pieces, each with unique Hero Powers, weapon upgrades, and passive abilities.
- **Deck Building**: UI for hero selection, deck construction (filtering, search, auto-fill, validation), and persistence in localStorage.
- **Tooltip Systems**: Unified, portal-based `UnifiedCardTooltip.tsx` for cards and `HeroPowerButton.tsx` for hero powers, integrating keyword definitions for rich display.
- **Think Tools**: AI-powered strategic analysis via WebSockets.
- **Animation System**: `UnifiedAnimationOrchestrator` (Zustand) and `AnimationOverlay` (React Portals).
- **Combat Event System**: Blizzard-inspired event-driven system for synchronized combat updates.
- **User Feedback**: Non-blocking visual notifications via `animationStore`.
- **Shared Deck System**: Manages deck shrinking, permanent card removal, and burning upon hero death in Ragnarok Poker.
- **Resource Systems**: Hearthstone-style Mana and Poker-specific STA.
- **Element Weakness**: Gods/heroes with elements (Fire, Water, Electric, Grass, Light, Dark) providing strategic advantages.

### Pure TypeScript Game Logic (AAA Architecture)
**Pattern**: TSX Components → Pure TS Modules → Zustand Stores

#### Game Flow Module (`client/src/game/flow/`)
- **GameFlowManager.ts**: State machine for game phases: `MAIN_MENU → ARMY_SELECTION → LOADING_MATCH → CHESS_BOARD → POKER_COMBAT → MINION_COMBAT → MATCH_END → REWARDS`
- **TurnManager.ts**: Turn order, timers, time limits, and turn-based effects
- **TurnOrchestrator.ts**: Thin coordination layer for combat phase sequencing (POKER_RESOLUTION → MINION_COMBAT → END_OF_TURN → COMPLETE). Does NOT contain combat logic - only phase state and transitions. React hook: `useTurnOrchestrator`
- **MinionBattleResolver.ts**: Combat resolution for minion-vs-minion and minion-vs-hero attacks with status effects

#### Consolidated Zustand Stores (`client/src/game/stores/`)
| Store | Purpose | Absorbs |
|-------|---------|---------|
| `gameFlowStore.ts` | Game phase, screen transitions, match state, army selection | gameStore |
| `unifiedCombatStore.ts` | Poker, chess, minions, attacks, shared deck | PokerCombatStore, ChessBoardStore, attackStore, sharedDeckStore |
| `unifiedUIStore.ts` | Animations, targeting, activity log, tooltips, modals | animationStore, targetingStore, activityLogStore, aiAttackAnimationStore, summonEffectStore |
| `heroDeckStore.ts` | Deck building (separate concern) | - |

#### Combat Modules (`client/src/game/combat/`)
- **BettingEngine.ts**: Poker betting logic (Faith/Foresight/Destiny phases)
- **CombatResolver.ts**: Damage calculation and combat outcomes
- **PhaseManager.ts**: Poker phase state machine

#### Combat Arena Modular Architecture (Jan 31, 2026)
**Pattern**: Container Component → Custom Hooks → Presentational Components

The main combat arena (`RagnarokCombatArena.tsx`) follows a modular architecture for maintainability:

**Custom Hooks** (`client/src/game/combat/hooks/`):
| Hook | Purpose | Lines |
|------|---------|-------|
| `usePokerAI.ts` | AI response effects, SmartAI decisions | ~140 |
| `usePokerPhases.ts` | Phase transitions, betting round closure, all-in automation | ~150 |
| `useCombatTimer.ts` | Turn timer countdown, auto-actions | ~85 |
| `useCombatEvents.ts` | CombatEventBus subscriptions, event handling | ~75 |

**UI Components** (`client/src/game/combat/components/`):
| Component | Purpose |
|-----------|---------|
| `TargetingPrompt.tsx` | Spell/battlecry target selection overlay |
| `HeroPowerPrompt.tsx` | Hero power target selection overlay |
| `ShowdownCelebration.tsx` | Poker showdown result animation |
| `HeroDeathAnimation.tsx` | Hero death crumble effect |

**Architecture Benefits**:
- Each hook is independently testable
- UI components are presentational only (no business logic)
- Main container (~2500 lines) orchestrates hooks and components
- New features can be added by creating new hooks
- Reduces coupling and improves code navigation

### Store Migration Status

**Adapter Hooks** (`client/src/game/hooks/`):
Components use adapter hooks during migration. Feature flags control old vs new store usage.

| Adapter Hook | Unified Store | Status |
|--------------|---------------|--------|
| `useAnimationAdapter` | unifiedUIStore | COMPLETE |
| `useTargetingAdapter` | unifiedUIStore | COMPLETE |
| `useGamePhaseAdapter` | gameFlowStore | COMPLETE |
| `useChessCombatAdapter` | unifiedCombatStore | COMPLETE |
| `usePokerCombatAdapter` | unifiedCombatStore | COMPLETE |

**Migration Status** (Jan 30, 2026): **COMPLETE**
- All migration flags removed (permanently enabled)
- Legacy stores deleted: `ChessBoardStore.ts`, `PokerCombatStore.ts`
- Adapters simplified: 31% code reduction in both combat adapters
- All components now use unified stores as single source of truth

**gameStore.ts** (1120 lines):
- Handles Hearthstone-style card game mechanics (distinct domain from poker/chess)
- Contains: deck, hand, battlefield, mana, minion combat, card effects
- Future optimization: UI selection state (selectedCard, attackingCard, hoveredCard, heroTargetMode) could move to unifiedUIStore
- Not a consolidation target - different subsystem from unified combat stores

**Adapter Exports**:
- `getChessCombatStoreActions()`: Direct access to unified combat store chess actions
- `getPokerCombatAdapterState()`: Direct access to unified combat store poker state
- Battlefield debug monitor gated behind `debugConfig.logBattlefieldChanges` (default: false)

### Abilities System Architecture
- **Hero Power EffectType System**: Manages 40+ hero power effect types (damage, heal, buff, summon, freeze, etc.) routed via `norseHeroPowerUtils.ts`.
- **Battlecry System**: Implements 25+ battlecry types (damage, heal, buff, summon, draw, Highlander effects) via `battlecryUtils.ts` and `highlanderUtils.ts`.
- **Deathrattle System**: Handles summon, draw, damage, heal, buff, divine shield, and mind control effects upon minion death.
- **Turn Effects System**: Processes start-of-turn and end-of-turn minion and status effects.

### Data Storage
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM.

### Hive Blockchain Integration (P2E) - BLUEPRINT

**STATUS**: Foundation built, awaiting Hive integration to begin implementation.

- **Architecture**: Modeled after Splinterlands for Play-to-Earn data.
- **Data Layers**: `client/src/data/` for centralized Hive-ready data architecture including `HiveDataLayer.ts`, `HiveSync.ts`, `HiveEvents.ts`, and `schemas/HiveTypes.ts`.

#### On-Chain Data (5 Core Items)
1. **User Records**: hiveUsername, displayName, accountTier
2. **Player Stats**: odinsEloRating, wins, losses, winStreak
3. **Match Results**: matchId, players, winner, damage, seed
4. **Card Ownership**: cardId, ownerId, edition, foil, level
5. **Token Balances**: RUNE, VALKYRIE, SEASON_POINTS

#### Off-Chain Data (Local Only)
- Combat state, animations, UI preferences
- Deck building drafts, temporary session data

#### Transaction Types (Hive custom_json)
| ID | Purpose | Key |
|----|---------|-----|
| `rp_team_submit` | Submit battle team | Posting |
| `rp_match_result` | Record match outcome | Posting |
| `rp_card_transfer` | Transfer card | Active |
| `rp_pack_open` | Open card pack | Posting |
| `rp_reward_claim` | Claim rewards | Posting |

#### Implementation Phases (When Ready)
1. **Phase 1**: Hive Keychain authentication
2. **Phase 2**: Match result recording on-chain
3. **Phase 3**: Card ownership sync
4. **Phase 4**: Token economy (RUNE, VALKYRIE)

#### Future Extensions (Add When Needed)
- Card rentals/delegations (`rp_market_rent`)
- P2P marketplace (`rp_market_list`, `rp_market_buy`)
- Quests (`rp_quest_start`, `rp_quest_complete`)
- Tournaments (`rp_tournament_join`)

## External Dependencies

### Database
- **Neon PostgreSQL**

### AI Services
- **Smithery AI** (via WebSockets)

### Blockchain
- **Hive Keychain** (browser extension required for users)

### Build & Development
- **Vite**
- **Drizzle Kit**
- **TypeScript**
- **ESLint**