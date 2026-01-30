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
- **Modular CSS System**: Refactored into a plug-and-play system with `tokens.css` (design tokens), `zones.css` (zone positioning variables), and `index.css` (master import). This system ensures a single source of truth for positioning and design tokens, with clear Z-index tiers for UI elements.

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