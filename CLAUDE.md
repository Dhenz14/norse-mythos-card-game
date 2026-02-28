# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Development server (Vite + Express) — http://localhost:5000
npm run dev:game  # Alias for dev
npm run build     # Production build
npm run check     # TypeScript type checking
npm run lint      # ESLint
npm run lint:fix  # ESLint with auto-fix
```

## Documentation

- **[RULEBOOK.md](docs/RULEBOOK.md)** - Complete game rules, mechanics, and keywords
- **[GAME_FLOW.md](docs/GAME_FLOW.md)** - Game flow diagrams and state management
- **[HIVE_BLOCKCHAIN_BLUEPRINT.md](docs/HIVE_BLOCKCHAIN_BLUEPRINT.md)** - Hive NFT architecture, chain replay, anti-cheat

## Architecture Overview

Norse Mythos Card Game is a multi-mythology digital collectible card game combining poker mechanics with Hearthstone-style card battling.

### Stack
- **Frontend**: React 18 + TypeScript + Vite 5
- **State**: Zustand 5 with specialized stores
- **Styling**: Tailwind CSS 3.4
- **3D/Effects**: React Three Fiber, Framer Motion, React Spring
- **Backend**: Express + TypeScript (optional for static deploy)
- **Database**: PostgreSQL with Drizzle ORM (optional) + IndexedDB for local chain replay
- **Blockchain**: Hive Layer 1 NFTs (custom_json ops, deterministic reader, Keychain auth)

### Game Features
- 1,300+ collectible cards across 4 mythological factions
- 76 playable heroes across 12 classes
- Poker combat system with Texas Hold'em mechanics
- Ragnarok Chess (7x5 strategic board)

## Project Structure

```
client/src/
├── core/                       # Pure game logic (migration in progress)
│   └── index.ts                # Re-exports from game/ for future separation
├── data/
│   ├── blockchain/             # Hive NFT system (15 op types, 13 IDB stores)
│   │   ├── replayEngine.ts     # Chain replay: fetch ops → apply rules → IndexedDB
│   │   ├── replayRules.ts      # Deterministic rules (hash-pinned at genesis)
│   │   ├── replayDB.ts         # IndexedDB v6: cards, matches, rewards, ELO, etc.
│   │   ├── genesisAdmin.ts     # Admin: broadcastGenesis, broadcastSeal (one-time)
│   │   ├── hiveConfig.ts       # Config: HIVE_NODES, RAGNAROK_ACCOUNT, NFT_ART_BASE_URL
│   │   ├── tournamentRewards.ts # 11 milestone rewards (wins/ELO/matches → cards + RUNE)
│   │   ├── nftMetadataGenerator.ts # ERC-1155 metadata with attributes
│   │   └── index.ts            # Barrel exports
│   ├── HiveSync.ts             # Keychain: login, broadcast, claimReward
│   ├── HiveDataLayer.ts        # Zustand store: collection, stats, tokens
│   └── schemas/HiveTypes.ts    # Core Hive types
├── game/
│   ├── components/         # Card, combat, chess components
│   ├── stores/             # Zustand state stores
│   │   └── gameStore.ts    # Main game store
│   ├── data/               # Card definitions, heroes
│   │   ├── allCards.ts     # Single source of truth (1300 cards)
│   │   ├── cardRegistry/   # Card sets by ID ranges
│   │   └── norseHeroes/    # 76 playable heroes
│   ├── combat/             # Combat system + poker mechanics
│   │   ├── RagnarokCombatArena.tsx
│   │   ├── PokerCombatStore.ts
│   │   ├── styles/
│   │   │   ├── zones.css   # Zone positioning (single source)
│   │   │   └── tokens.css  # Design tokens
│   │   └── modules/        # Hand evaluator, betting
│   ├── effects/            # Effect handlers
│   │   └── handlers/       # battlecry/, deathrattle/, spellEffect/
│   ├── subscribers/        # BlockchainSubscriber (game end → chain packaging)
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Game utilities
│       ├── game/           # Game state utilities
│       ├── cards/          # Card level scaling, evolution tiers
│       ├── battlecry/      # Battlecry utilities
│       └── spells/         # Spell utilities
├── components/ui/          # Shadcn/Radix UI components
└── lib/                    # Utilities and helpers

server/
├── routes.ts               # API routes + mount points
├── routes/
│   ├── chainRoutes.ts      # REST: leaderboard, ELO, cards, deck verify
│   ├── matchmakingRoutes.ts # ELO-proximity matchmaking queue
│   └── mockBlockchainRoutes.ts # In-memory mock (dev only)
├── services/
│   ├── chainIndexer.ts     # Server-side chain replay (optional convenience)
│   ├── chainState.ts       # In-memory account state for global queries
│   └── hiveAuth.ts         # Hive signature verification for server auth
└── storage.ts              # Database interface
```

## Key Subsystems

### Card System (`game/data/`)
- **Single source**: `allCards.ts` contains all 1,300 cards
- Card registry with ID ranges in `cardRegistry/ID_RANGES.md`
- Ranges: 1000-3999 neutrals, 4000-8999 classes, 9000-9999 tokens, 20000-29999 Norse set

### Combat System (`game/combat/`)
- `RagnarokCombatArena.tsx` - Main arena component with poker integration
- `PokerCombatStore.ts` - Poker-style betting and hand evaluation

### CSS Architecture (`game/combat/styles/`)
- **zones.css**: Single source of truth for all zone positioning variables
- **tokens.css**: Design tokens (spacing, colors, z-index tiers)
- Z-index tiers: base(1) → battlefield(10) → minions(20) → hero(30) → hand(40) → betting(200) → tooltip(9000)

**To move any UI element:**
1. Open `styles/zones.css`
2. Find the `--zone-[name]-[position]` variable
3. Change the value - no other files need editing

### Effect System (`game/effects/`)
- 96 battlecry handlers in `handlers/battlecry/`
- 16 deathrattle handlers in `handlers/deathrattle/`
- 70 spell effect handlers in `handlers/spellEffect/`
- All handlers export default functions and are indexed in their `index.ts`

### Type System (`game/types/`)
- `types.ts` - Main type definitions (CardData, GameState, Player)
- `CardTypes.ts` - Card-specific types
- `PokerCombatTypes.ts` - Poker combat types

### Blockchain/NFT System (`data/blockchain/`)

- **Chain Replay**: `replayEngine.ts` fetches ops from Hive → `replayRules.ts` applies deterministic rules → IndexedDB stores state
- **15 op types**: genesis, mint, seal, transfer, burn, pack_open, reward_claim, match_start, match_result, level_up, queue_join, queue_leave, slash_evidence, team_submit, card_transfer
- **13 IndexedDB stores**: cards, matches, reward_claims, elo_ratings, token_balances, sync_cursors, genesis_state, supply_counters, match_anchors, queue_entries, slashed_accounts, player_nonces, pending_slashes
- **Admin lifecycle**: genesis (one-time) → seal (permanent) → admin key irrelevant forever
- **Self-serve rewards**: 11 milestones in `tournamentRewards.ts`; players claim via Keychain
- **Supply caps**: 16,000 total (10K common, 4K rare, 1.5K epic, 500 legendary)

## Bundle Architecture

Code splitting with manual chunks in `vite.config.ts`:

| Chunk | Size (gzip) |
|-------|-------------|
| Initial load | ~100KB |
| React vendor | ~53KB |
| UI vendor | ~28KB |
| Animation vendor | ~38KB |
| Three.js (lazy) | ~250KB |
| Full game | ~286KB |

## Coding Standards

- Tabs for indentation
- camelCase for functions/variables, PascalCase for components
- Small functions (20-30 lines max)
- Avoid magic strings; use constants
- Prefer Zustand over React Context
- Edit existing files over creating new ones
- No comments unless explicitly requested

## Critical Files (Handle with Care)

```
# Core game logic - Only fix syntax, don't change behavior without review
client/src/game/stores/gameStore.ts
client/src/game/combat/PokerCombatStore.ts
client/src/game/combat/RagnarokCombatArena.tsx
client/src/game/effects/EffectRegistry.ts
client/src/game/data/allCards.ts

# Type definitions - Extensions OK, breaking changes need review
client/src/game/types.ts
client/src/game/types/CardTypes.ts

# CSS Architecture - Only zones.css for positioning changes
client/src/game/combat/styles/zones.css
client/src/game/combat/styles/tokens.css

# Blockchain layer - Deterministic rules locked at genesis
client/src/data/blockchain/replayRules.ts
client/src/data/blockchain/replayDB.ts
client/src/data/blockchain/tournamentRewards.ts
```

## Known Architecture Decisions

### Card Database
- `allCards.ts` is the single source of truth for all cards
- 9 files import from it - do not create duplicate card sources

### Type Adapters
- `adaptLegacyPlayerToContextPlayer` bridges old/new player types
- Has placeholders for hero/heroPower - replace with proper state mappings for production

### Highlander Support
- `highlanderUtils.ts` implements deck duplicate checking
- Supports Reno/Kazakus/Solia/Raza/Krul effects

### Hive NFT System

- Chain replay is client-side (browser runs deterministic rules, builds IndexedDB)
- Server indexer is optional convenience (leaderboard, ELO lookup, cross-account queries)
- Admin authority ends at seal — no ongoing admin key needed
- Reward claims are self-serve (players verify own stats, no admin distribution)
- ELO is chain-derived (K=32, computed from match_result history)
- Supply caps hard-enforced by every reader

## Known Issues & Fixes

### Poker Combat Freeze (Fixed)
- **Problem**: Game froze after resolving poker hand
- **Solution**: Added backup timer in `RagnarokCombatArena.tsx` (line ~1541)
- **Details**: `showdownBackupTimerRef` ensures `handleCombatEnd` is called even if ShowdownCelebration unmounts

### Type Adapter Placeholders
- **File**: `client/src/game/utils/typeAdapters.ts`
- **Issue**: `adaptLegacyPlayerToContextPlayer` has placeholder values for hero/heroPower
- **Status**: Needs production mappings to proper state

## Deploy

```bash
npm run build                 # Creates dist/
vercel --prod                 # Deploy to Vercel
# or upload dist/ to any static host
```

## Roadmap

### Completed (Phase 2A-2E)

- Hive Keychain authentication + login
- NFT card ownership on Hive Layer 1 (chain replay engine)
- P2P multiplayer via WebRTC (PeerJS)
- Commit-reveal seed exchange + seeded PRNG
- Dual-signature match results + Merkle transcripts
- On-chain matchmaking (queue_join/leave, ELO ladder)
- Card XP/leveling/evolution system (chain-derived)
- Self-serve tournament rewards (11 milestones)
- Server-side chain indexer (leaderboard, ELO, deck verify)
- Anti-cheat: PoW, slash evidence, nonce anti-replay

### Next (Genesis Launch)

- Create @ragnarok Hive account
- Upload card art to CDN
- Broadcast genesis + seal on Hive mainnet (two Keychain clicks, then admin key irrelevant)
