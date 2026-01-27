# Norse Mythos Card Game - Ragnarok Integration

## Overview

A multi-mythology digital collectible card game, similar to Hearthstone, that integrates with the Ragnarok Play-to-Earn (P2E) strategy game system. The project aims to deliver a highly engaging and strategic card game experience through strategic deck building, card combat mechanics, AI opponents, and an advanced Pet Battle PvP system with poker-inspired combat. It features **4 mythological factions** (Norse, Greek, Japanese/Shinto, Egyptian), **630+ neutral collectible cards** (core 551 + norse 79), **426 class-specific cards**, and **76 playable heroes** across 12 classes, supporting diverse effects like battlecry, deathrattle, spell, combo, aura, and passive abilities. The "Think Tools" AI assists with strategic analysis for deck recommendations and gameplay optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## Deck Building System (Hearthstone-Style)

Players build custom **30-card decks** for each of their 4 major chess piece heroes (Queen, Rook, Bishop, Knight). This replaces the old fixed 10-card system.

### Deck Building Rules
- **Deck Size**: Exactly 30 cards per hero
- **Copy Limit**: Maximum 2 copies of any card (1 for Legendaries)
- **Card Pool**: Hero's class cards + all neutral cards
- **Total Cards**: 120 cards across 4 hero decks (30 × 4)
- **Storage**: Persisted to localStorage via `heroDeckStore`

### Key Components
- **HeroDeckBuilder.tsx**: Full-screen deck building UI with card filtering, search, auto-fill, and validation
- **heroDeckStore.ts**: Zustand store managing deck state, validation, and persistence
- **sharedDeckStore.ts**: Loads user-built decks from heroDeckStore for combat

### Deck Builder Features
- Filter by card type (Minion/Spell/Weapon), mana cost range
- Search by card name or description
- Sort by cost, name, or type
- Auto-fill with random valid cards
- Rarity color coding (Common/Rare/Epic/Legendary)
- Visual deck list with card counts

## Hero System - 76 Playable Heroes (4 Factions)

Heroes are organized by chess piece type and class across 4 mythological factions: **Norse**, **Greek**, **Japanese (Shinto)**, and **Egyptian**. Each hero has access to their class's card pool + neutrals for deck building.

### QUEEN (Magic/Death) - 20 Heroes
| Class | Heroes | Shared Spells | Unique/Hero |
|-------|--------|---------------|-------------|
| **Mage** (10) | Odin, Bragi, Kvasir, Eldrin, Logi, Zeus, Athena, Hyperion, Uranus, Chronos | 8 | 1 |
| **Warlock** (7) | Forseti, Mani, Thryma, Hades, Dionysus, Tartarus, Persephone | 6 | 3 |
| **Necromancer** (3) | Sol, Sinmara, Hel | 3 | 6 |

### ROOK (Strength/Power) - 13 Heroes
| Class | Heroes | Shared Spells | Unique/Hero |
|-------|--------|---------------|-------------|
| **Warrior** (6) | Thor, Thorgrim, Valthrud, Vili, Ares, Hephaestus | 7 | 2 |
| **Death Knight** (2) | Magni, Brakki | 7 | 2 |
| **Paladin** (5) | Tyr, Vidar, Heimdall, Baldur, Solvi | 6 | 3 |

### BISHOP (Healing/Support) - 19 Heroes
| Class | Heroes | Shared Spells | Unique/Hero |
|-------|--------|---------------|-------------|
| **Priest** (8) | Freya, Eir, Frey, Hoenir, Aphrodite, Hera, Eros, Hestia | 8 | 1 |
| **Druid** (6) | Idunn, Ve, Fjorgyn, Sigyn, Demeter, Gaia | 6 | 3 |
| **Shaman** (5) | Gerd, Gefjon, Ran, Njord, Poseidon | 6 | 3 |

### KNIGHT (Stealth/Agility) - 14 Heroes
| Class | Heroes | Shared Spells | Unique/Hero |
|-------|--------|---------------|-------------|
| **Rogue** (6) | Loki, Hoder, Gormr, Lirien, Hermes, Nyx | 7 | 2 |
| **Hunter** (6) | Skadi, Aegir, Fjora, Ullr, Apollo, Artemis | 8 | 1 |
| **Demon Hunter** (2) | Myrka, Ylva | 8 | 1 |

### KING (Passive Effects Only) - 9 Heroes
Ymir, Buri, Surtr, Borr, Yggdrasil, Auðumbla, Blainn, Brimir, Ginnungagap

## Spell Distribution by Class
| Class | Total Spells | Heroes | Min Shared | Unique/Hero |
|-------|-------------|--------|------------|-------------|
| Necromancer | 15 | 2 | 3 | **6** (best) |
| Warlock | 28 | 7 | 6 | 3 |
| Shaman | 19 | 4 | 6 | 3 |
| Paladin | 16 | 3 | 6 | 3 |
| Druid | 21 | 5 | 6 | 3 |
| Warrior | 21 | 6 | 7 | 2 |
| Death Knight | 11 | 2 | 7 | 2 |
| Rogue | 22 | 6 | 7 | 2 |
| Mage | 18 | 9 | 8 | 1 |
| Priest | 16 | 7 | 8 | 1 |
| Hunter | 13 | 5 | 8 | 1 |
| Demon Hunter | 10 | 2 | 8 | 1 |

## System Architecture

### Frontend
- **Framework**: React with TypeScript.
- **State Management**: Zustand.
- **Styling**: Tailwind CSS, extensive CSS variables, and strict layer ownership.
- **Animations**: Framer Motion, React Spring, React Three Fiber / WebGL for 3D effects.
- **Build Tool**: Vite.
- **UI/UX**: HUD overlay using React Portals, centralized `layoutTokens.ts` for consistent sizing and Z-index, portal-based tooltips, and a viewport lock system.

### Responsive UI Architecture (CRITICAL - DO NOT CHANGE)
The combat arena uses a **fluid 100vw × 100vh layout** with NO scrollbars and NO letterboxing:
- **Arena container**: `position: fixed; width: 100vw; height: 100vh; overflow: hidden;`
- **Grid layout**: `.battle-arena` uses fixed grid rows that sum to 100% height
- **Player hero zone**: Anchored to bottom with `align-self: end; justify-content: flex-end; overflow: hidden; height: var(--hero-zone-height);`
- **Hero card constraint**: `max-height: calc(var(--hero-zone-height) - 24px)` ensures card fits within zone
- **NEVER use**: `transform: scale()` for viewport scaling (causes letterboxing), `overflow: auto/scroll` (creates scrollbars), `minmax(..., 1fr)` for grid rows (can grow unbounded)
- **CSS Variables**: Zone heights use `clamp()` with vh units for responsive sizing across screen sizes

### Backend
- **Runtime**: Node.js with Express.
- **Language**: TypeScript.
- **API Design**: RESTful endpoints.
- **Real-time Communication**: WebSockets for AI integration.

### Core Game Systems
- **Card System**: Card Registry with Norse/Greek mythology theming. Card sets organized as:
  - **Core Set** (`sets/core/`): 12 class files (426 cards) + neutrals (630+ cards) + hero portraits (65 cards)
  - **Tokens** (`sets/tokens/`): Non-collectible cards (~130 tokens, summoned minions, transformed cards)
  - All cards use Norse/Greek mythology names and themes (Odin, Thor, Freya, Zeus, Athena, etc.). Universal CardRenderer component used across deck builder, binder, and gameplay.
  - **ID Ranges**: 1000-3999 (neutrals), 4000-4999 (Necromancer), 5000-5999 (Warrior), 6000-6999 (Mage), 7000-7999 (Hunter), 8000-8999 (Other classes), 9000-9999 (Tokens), 20000-29999 (mythology creatures), 30000-50000 (minions), 33200-33299 (combo/control/cheat engine cards), 33300-33499 (tokens for new cards), 70000-91999 (quests/Old Gods), 90001-90112 (heroes)
  - **Neutral Card Categories**: Combo Enablers (card draw, cost reduction, tutors), Control Tools (hard removal, silence, board clears), Cheat/Ramp (recruit from deck, mana manipulation), Synergy Packages (deathrattle triggers, handbuff, spell damage, tokens)
  - **Validation**: Type guards, duplicate detection, required field checking in `cardRegistry/validation.ts`
- **Status Effects System**: 8 status effects with flat 3 damage values: Poison (☠️ 3 DoT), Bleed (🩸 +3 on damage), Paralysis (⚡ 50% action fail), Weakness (⬇️ -3 ATK), Vulnerable (🎯 +3 damage taken), Marked (👁️ bypass stealth), Burn (🔥 +3 ATK, 3 self-damage), Freeze (❄️ cannot act). All god legendary minions apply unique status effects on attack. Status effects integrated into damage calculation, turn phases, and action gating.
- **Chess Board Layout**: 7x5 grid designed for strategic piece movement and combat.
- **Combat System (Valkyrie Weapon Rules)**: Major pieces initiate PvP poker combat, while Pawns and Kings have instant-kill mechanics.
- **Hero System**: 58 playable heroes across 12 classes. Each hero can be assigned to their chess piece type (Queen/Rook/Bishop/Knight) with a custom 30-card deck built from class cards + neutrals. Heroes have unique Hero Powers, one-time Weapon Upgrades, and Personal Passive abilities.
- **Hero Selection & Deck Building UI**: `ArmySelection.tsx` displays heroes by chess piece type with hero power previews on thumbnails. Clicking a hero opens `HeroDetailPopup.tsx` showing mythological lore, stats, hero power, passive abilities, and weapon upgrades. `HeroDeckBuilder.tsx` provides full deck building with filtering, search, auto-fill, and validation. All decks persist to localStorage.
- **Hero Power Hover System (Consolidated)**: Two components handle hero power display:
  - `HeroPower.tsx`: Basic component for standard GameBoard with simple CSS hover tooltip (used in Hero.tsx, GameBoard.tsx)
  - `HeroPowerButton.tsx`: Full Norse hero power for Ragnarok combat with portal-based tooltip and weapon upgrade button (used in RagnarokCombatArena.tsx)
  - Conflicting hover effects removed from NorseTheme.css and RagnarokCombatArena.css; all hover styling consolidated in HeroPowerButton.css
- **Unified Card Tooltip System**: Single source of truth for all card tooltips using React Portal:
  - `UnifiedCardTooltip.tsx`: Centralized component with KEYWORD_DEFINITIONS (30+ keywords with icons, colors, descriptions)
  - All card components route through UnifiedCardTooltip: SimpleCard, Card.tsx, CardHoverPreview, SimpleBattlefield
  - Hearthstone-style display: keyword icon badges on cards, hover tooltips with full descriptions
  - Responsive CSS: media queries for mobile (480px), tablet (768px), desktop
  - Deprecated: CardHoverPreview.css (old tooltip styles, kept for reference)
- **Think Tools System**: AI-powered strategic analysis for deck building and gameplay optimization, integrated via WebSockets.
- **Animation System**: `UnifiedAnimationOrchestrator` (Zustand) for state management and `AnimationOverlay` (React Portals) for rendering.
- **Combat Event System**: Blizzard-inspired event-driven system for synchronized HP updates and attack resolution. Includes visual feedback notifications for blocked attacks (Taunt, summoning sickness, already attacked) and failed card effects.
- **User Feedback System**: Non-blocking visual notifications via `animationStore` for combat events, Highlander effect failures (Reno Jackson, Kazakus, Inkmaster Solia, Raza, Krul show "Deck contains duplicate cards" when conditions aren't met), and other game state changes.
- **Shared Deck System (Ragnarok Poker)**: Manages deck shrinking, permanently removing played cards, and burning remaining cards upon hero death.
- **Resource Systems**: Hearthstone-style Mana system and a Poker-specific STA system (10 HP = 1 STA).
- **Element Weakness System**: Gods/heroes have unique elements (Fire, Water, Electric, Grass, Light, Dark) creating strategic counter-picks. Elemental advantage provides +2 Attack and +2 Health to minions.

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