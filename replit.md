# Norse Mythos Card Game - Ragnarok Integration

## Architecture Tracking

### Jan 29, 2026 - Fork Comparison (enrique89ve)
- **Improvement**: Logic separation via `client/src/core/` (Engine/Entities/Effects).
- **Improvement**: Specialized Zustand slices for better state management.
- **Fix**: Poker combat freeze fixed with `showdownBackupTimerRef` backup timer.
- **Preference**: Maintain alignment with enrique89ve fork for collaborative consistency.

## Overview
A multi-mythology digital collectible card game, inspired by Hearthstone, integrating with the Ragnarok Play-to-Earn (P2E) strategy game system. The project aims to deliver an engaging and strategic card game experience through strategic deck building, card combat mechanics, AI opponents, and an advanced Pet Battle PvP system. It features 4 mythological factions (Norse, Greek, Japanese/Shinto, Egyptian), over 1000 collectible cards (neutral and class-specific), and 76 playable heroes across 12 classes, supporting diverse card effects like battlecry, deathrattle, spell, combo, aura, and passive abilities. The "Think Tools" AI assists with strategic analysis for deck recommendations and gameplay optimization.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript.
- **State Management**: Zustand.
- **Styling**: Tailwind CSS, extensive CSS variables, and strict layer ownership.
- **Animations**: Framer Motion, React Spring, React Three Fiber / WebGL for 3D effects.
- **Build Tool**: Vite.
- **UI/UX**: HUD overlay using React Portals, centralized `layoutTokens.ts` for consistent sizing and Z-index, portal-based tooltips, and a viewport lock system.
- **Responsive UI Architecture**: Fluid 100vw × 100vh layout with no scrollbars or letterboxing. The arena container uses `position: fixed; width: 100vw; height: 100vh; overflow: hidden;`. Grid rows are fixed, summing to 100% height. Player hero zones are anchored using `align-self: end; justify-content: flex-end; overflow: hidden; height: var(--hero-zone-height);`. Card sizing is constrained by `max-height: calc(var(--hero-zone-height) - 24px)`. CSS variables utilize `clamp()` with `vh` units for responsive sizing. `transform: scale()`, `overflow: auto/scroll`, and `minmax(..., 1fr)` are explicitly avoided.

### CSS Architecture (AAA-Quality Standards)

#### Modular CSS System (NEW)
The CSS architecture has been refactored into a modular, plug-and-play system:

```
client/src/game/combat/styles/
├── tokens.css    # Design tokens (spacing, colors, z-index, sizes)
├── zones.css     # Zone positioning variables (--zone-*-left, --zone-*-top, etc.)
└── index.css     # Master import file
```

#### Single Source of Truth for Positioning
- **`styles/zones.css`**: All zone position variables (--zone-community-left, --zone-pot-top, etc.)
- **`styles/tokens.css`**: Design tokens (spacing, colors, z-index tiers, sizes)

**To move any UI element:**
1. Open `styles/zones.css`
2. Find the `--zone-[name]-[position]` variable
3. Change the value
4. Done - no other files need editing

Example: Move community cards down 0.5 inch:
```css
/* In styles/zones.css */
--zone-community-top: 52%;  /* Changed from 48% */
```

#### CSS File Responsibilities
| File | Purpose | Scope |
|------|---------|-------|
| `styles/tokens.css` | Design tokens, responsive breakpoints | Global tokens |
| `styles/zones.css` | Zone positioning variables | All zone positions |
| `RagnarokCombatArena.css` | Core arena grid, component styles | Primary combat styles |
| `GameViewport.css` | 16:9 viewport, consumes zone variables | Viewport positioning |
| `PokerCombat.css` | Poker-specific UI | Poker overlay components |

#### Z-Index Tiers (Defined in tokens.css)
```
--token-z-base: 1          # Background
--token-z-battlefield: 10  # Arena floor
--token-z-minions: 20      # Minion fields
--token-z-community: 25    # Community cards
--token-z-hero: 30         # Hero zones
--token-z-hand: 40         # Player hand
--token-z-betting: 200     # Betting UI
--token-z-timer: 500       # Timer/HUD
--token-z-tooltip: 9000    # Tooltips
--token-z-overlay: 9500    # Full-screen overlays
```

#### Key Zone Variables (Quick Reference)
| Variable | Value | Purpose |
|----------|-------|---------|
| `--zone-community-left` | `262px` | Community cards horizontal position |
| `--zone-community-top` | `48%` | Community cards vertical position |
| `--zone-pot-left` | `8px` | Pot/betting info left position |
| `--zone-pot-top` | `48%` | Pot/betting info top position |
| `--zone-betting-left` | `clamp(320px, 30vw, 500px)` | Betting buttons horizontal position |
| `--zone-betting-bottom` | `8px` | Betting buttons vertical position |
| `--zone-player-hero-left` | `clamp(8px, 2%, 32px)` | Player hero left position |
| `--zone-hole-cards-offset-y` | `36px` | Hole cards vertical offset |

#### CSS Architecture Rules (IMPORTANT)
1. **Positioning ONLY in GameViewport.css**: The `.viewport-mode .unified-*` selectors consume zone variables
2. **Non-positional styling in RagnarokCombatArena.css**: Only flex, padding, gap - NO position/left/top/grid-area
3. **Never duplicate positioning**: Each zone has ONE selector that sets position properties
4. **Import chain**: `RagnarokCombatArena.css` → `styles/index.css` → `zones.css` + `tokens.css`

#### Best Practices
1. **Edit zones.css ONLY for position changes**: All other files consume these variables.
2. **Use tokens for consistency**: Spacing, colors, and z-index from tokens.css.
3. **BEM-style naming**: Descriptive class names like `.zone-community`, `.zone-player-hero`.
4. **No duplicate position rules**: Each zone has ONE authoritative variable in zones.css.
5. **Responsive overrides in tokens.css**: All breakpoint-specific token changes centralized.

### Backend
- **Runtime**: Node.js with Express.
- **Language**: TypeScript.
- **API Design**: RESTful endpoints.
- **Real-time Communication**: WebSockets for AI integration.

### Core Game Systems
- **Card System**: A comprehensive Card Registry with Norse/Greek mythology theming. Cards are organized into Core Sets (class-specific and neutral), Tokens, and use a Universal CardRenderer component. Card IDs are categorized by ranges for neutrals, classes, tokens, and specific creature types. Neutral cards include Combo Enablers, Control Tools, Cheat/Ramp, and Synergy Packages. Card validation is implemented via type guards, duplicate detection, and required field checking.
- **Status Effects System**: 8 distinct status effects (Poison, Bleed, Paralysis, Weakness, Vulnerable, Marked, Burn, Freeze) with flat damage values, influencing damage calculation, turn phases, and action gating. God legendary minions apply unique status effects.
- **Chess Board Layout**: A 7x5 grid for strategic piece movement and combat.
- **Combat System**: Valkyrie Weapon Rules dictate PvP poker combat for major pieces and instant-kill mechanics for Pawns and Kings.
- **Hero System**: 76 playable heroes across 12 classes, assignable to chess piece types (Queen/Rook/Bishop/Knight). Each hero has a custom 30-card deck from their class pool + neutrals, unique Hero Powers, one-time Weapon Upgrades, and Personal Passive abilities.
- **Hero Selection & Deck Building UI**: `ArmySelection.tsx` for hero display and `HeroDetailPopup.tsx` for lore and abilities. `HeroDeckBuilder.tsx` provides full deck construction features (filtering, search, auto-fill, validation). All decks are persisted in localStorage.
- **Hero Power Hover System**: Consolidated display via `HeroPowerButton.tsx` for full Ragnarok combat with portal-based tooltips and weapon upgrade buttons, used across combat arenas.
- **Unified Card Tooltip System**: A single, portal-based `UnifiedCardTooltip.tsx` handles all card tooltips, integrating `KEYWORD_DEFINITIONS` (30+ keywords with icons, colors, descriptions) for a Hearthstone-style display. This system is responsive across mobile, tablet, and desktop.
- **Think Tools System**: AI-powered strategic analysis for deck building and gameplay optimization, integrated via WebSockets.
- **Animation System**: `UnifiedAnimationOrchestrator` (Zustand) for state management and `AnimationOverlay` (React Portals) for rendering.
- **Combat Event System**: Blizzard-inspired event-driven system for synchronized HP updates, attack resolution, and visual feedback for combat events.
- **User Feedback System**: Non-blocking visual notifications for combat events, Highlander effect failures, and game state changes via `animationStore`.
- **Shared Deck System (Ragnarok Poker)**: Manages deck shrinking, permanent card removal, and burning remaining cards upon hero death.
- **Resource Systems**: Hearthstone-style Mana system and a Poker-specific STA system (10 HP = 1 STA).
- **Element Weakness System**: Gods/heroes have unique elements (Fire, Water, Electric, Grass, Light, Dark), creating strategic counter-picks. Elemental advantage provides +2 Attack and +2 Health to minions.

### Abilities System Architecture

#### Hero Power EffectType System
- **File**: `client/src/game/utils/norseHeroPowerUtils.ts`
- **Routing**: `heroPowerUtils.ts` checks if hero ID exists in `ALL_NORSE_HEROES` and routes to Norse system, otherwise uses class defaults
- **Coverage**: 40+ effect types implemented including damage, heal, buff, debuff, summon, freeze, stealth, draw, copy, scry, reveal, grant_keyword, silence, bounce, equip_weapon, discover, and more
- **Hero Definitions**: Located in `client/src/game/data/norseHeroes/` with heroDefinitions.ts, egyptianHeroes.ts, additionalHeroes.ts

#### Battlecry System
- **File**: `client/src/game/utils/battlecryUtils.ts`
- **Coverage**: 25+ battlecry types including damage, heal, buff, summon, draw, discover, transform, silence, freeze, mind_control, Highlander effects (conditional_full_heal, kazakus_potion, etc.)
- **Highlander Support**: `highlanderUtils.ts` implements deck duplicate checking and Reno/Kazakus/Solia/Raza/Krul effects

#### Deathrattle System
- **File**: `client/src/game/utils/deathrattleUtils.ts`
- **Coverage**: summon, draw, damage, heal, buff, give_divine_shield, mind_control effects
- **Integration**: Called from combat resolution when minion dies with deathrattle keyword

#### Turn Effects System
- **File**: `client/src/game/utils/turnEffectsUtils.ts`
- **Start of Turn**: Processes minion effects like Nat Pagle, Automaton of Hephaestus
- **End of Turn**: Processes effects like Jormungandr's Coil, status effect cleanup

### Data Storage
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM.

## External Dependencies

### Database
- **Neon PostgreSQL**

### AI Services
- **Smithery AI** (via WebSockets)

### Build & Development
- **Vite**
- **Drizzle Kit**
- **TypeScript**
- **ESLint**