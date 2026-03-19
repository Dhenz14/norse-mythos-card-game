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
- **[ATOMIC_NFT_PACKS_DESIGN.md](docs/ATOMIC_NFT_PACKS_DESIGN.md)** - Protocol v1.1: atomic transfers, pack NFTs, DNA lineage
- **[RAGNAROK_PROTOCOL_V1.md](docs/RAGNAROK_PROTOCOL_V1.md)** - Protocol v1.0 spec (14 canonical ops, authority matrix, finality)
- **[DECENTRALIZED_INDEXER_DESIGN.md](docs/DECENTRALIZED_INDEXER_DESIGN.md)** - "Light HAF": IPFS op-log index, WoT operators, zero servers
- **[PROTOCOL_V1_2_DESIGN.md](docs/PROTOCOL_V1_2_DESIGN.md)** - Protocol v1.2: marketplace, broadcast hardening, NFTLox integration, card visual overhaul
- **[DUAT_AIRDROP_DESIGN.md](docs/DUAT_AIRDROP_DESIGN.md)** - DUAT holder airdrop: 30% supply to 3,511 holders, claim window, treasury absorption

## Architecture Overview

Norse Mythos Card Game is a multi-mythology digital collectible card game combining poker mechanics with strategic card battling.

### Stack
- **Frontend**: React 18 + TypeScript + Vite 5
- **State**: Zustand 5 with specialized stores
- **Styling**: Tailwind CSS 3.4
- **3D/Effects**: React Three Fiber, Framer Motion, React Spring
- **Backend**: Express + TypeScript (optional for static deploy)
- **Database**: PostgreSQL with Drizzle ORM (optional) + IndexedDB for local chain replay
- **Blockchain**: Hive Layer 1 NFTs (custom_json ops, deterministic reader, Keychain auth)

### Game Features
- 2,400+ collectible cards across 5 mythological factions
- 80+ playable heroes across 12 classes
- Poker combat system with Texas Hold'em mechanics
- Ragnarok Chess (7x5 strategic board)
- Single-player campaign (49 missions across 5 factions)
- Tournament system (Swiss + single elimination brackets)
- Card crafting & trading (Eitr economy)
- NFT provenance viewer (on-chain history + Hive explorer links)
- Direct card gifting (one-click Keychain transfer)
- NFT ownership enforcement (deck building gated on chain-derived collection)
- Spectator mode (read-only P2P connection)
- Match replay viewer with playback controls
- Daily quest system (19 quest templates)
- Friends list with presence polling
- Deck import/export via shareable codes
- Settings with audio, visual, gameplay configuration
- Tutorial overlay for new players

## Project Structure

```
client/src/
├── core/                       # Pure game logic (migration in progress)
│   └── index.ts                # Re-exports from game/ for future separation
├── data/
│   ├── blockchain/             # Hive NFT system (29 op types, 16 IDB stores)
│   │   ├── replayEngine.ts     # Chain replay: fetch ops → apply rules → IndexedDB
│   │   ├── replayRules.ts      # Deterministic rules (hash-pinned at genesis)
│   │   ├── replayDB.ts         # IndexedDB v9: cards, matches, rewards, ELO, marketplace, duat_claims, etc.
│   │   ├── genesisAdmin.ts     # Admin: broadcastGenesis, broadcastSeal (one-time)
│   │   ├── hiveConfig.ts       # Config: HIVE_NODES, RAGNAROK_ACCOUNT, explorer URLs
│   │   ├── explorerLinks.ts    # Hive explorer URL builders (tx + block)
│   │   ├── tournamentRewards.ts # 11 milestone rewards (wins/ELO/matches → cards + RUNE)
│   │   ├── nftMetadataGenerator.ts # ERC-1155 metadata with attributes
│   │   ├── opSchemas.ts        # Zod runtime validation for all 21 chain op types
│   │   ├── ICardDataProvider.ts # Interface breaking reverse coupling (blockchain → game)
│   │   └── index.ts            # Barrel exports
│   ├── indexer/                # Decentralized index (Light HAF) — zero servers in production
│   │   ├── indexDB.ts          # IndexedDB v1: 4 stores (global_ops, leaderboard, supply, sync)
│   │   ├── indexSync.ts        # IPFS sync: 6-tier CID resolution, manifest validation, chunk download
│   │   ├── indexQueries.ts     # Local query API: leaderboard, match history, player profile, supply
│   │   └── index.ts            # Barrel exports
│   ├── HiveSync.ts             # Keychain: login, broadcast, transferCard, claimReward
│   ├── HiveDataLayer.ts        # Zustand store: collection, stats, tokens
│   ├── HiveEvents.ts           # Event emitter: card transfers, token updates, tx status
│   └── schemas/HiveTypes.ts    # Core Hive types (HiveCardAsset, HiveMatchResult, etc.)
├── game/
│   ├── components/         # Card, combat, chess, UI components
│   │   ├── campaign/       # CampaignPage (world map + mission briefing)
│   │   ├── collection/     # CollectionPage, NFT provenance viewer, card gifting
│   │   ├── crafting/       # CraftingPanel (Eitr forge/dissolve)
│   │   ├── replay/         # MatchHistoryPage + ReplayViewer
│   │   ├── settings/       # SettingsPage + SettingsPanel
│   │   ├── social/         # FriendsPanel (presence + challenges)
│   │   ├── spectator/      # SpectatorView (read-only P2P)
│   │   ├── tournament/     # TournamentListPage (brackets + standings)
│   │   ├── trading/        # TradingPage (card/Eitr trade offers)
│   │   ├── marketplace/   # MarketplacePage (on-chain NFT buy/sell/offer)
│   │   ├── tutorial/       # TutorialOverlay (step-by-step onboarding)
│   │   ├── quests/         # DailyQuestPanel (3 daily quests)
│   │   └── ui/             # LoadingScreen, CardIconsSVG (50+ SVG keyword icons), shared UI
│   ├── nft/                # NFT Bridge — clean contract boundary for blockchain access
│   │   ├── INFTBridge.ts   # Contract interface (26 methods)
│   │   ├── HiveNFTBridge.ts # Hive blockchain implementation (delegates to HiveSync/Events/DataLayer)
│   │   ├── LocalNFTBridge.ts # Local/test mode implementation (chain ops are no-ops)
│   │   ├── hooks.ts        # React hooks: useNFTUsername, useNFTCollection, useNFTStats, etc.
│   │   └── index.ts        # Factory: getNFTBridge(), initializeNFTBridge()
│   ├── stores/             # Zustand state stores
│   │   ├── gameStore.ts    # Main game store
│   │   ├── gameStoreIntegration.ts # Event-driven architecture init + NFT bridge event toasts
│   │   ├── heroDeckStore.ts # Deck building (NFT ownership via bridge)
│   │   ├── settingsStore.ts # Settings (audio, visual, gameplay)
│   │   ├── dailyQuestStore.ts # Daily quest progress + refresh + bridge reward claims
│   │   ├── friendStore.ts  # Friends list + online status
│   │   ├── tradeStore.ts   # Trade offers + bridge transfers on accept
│   │   └── replayStore.ts  # Match history + replay playback
│   ├── data/               # Card definitions, heroes
│   │   ├── allCards.ts     # Single source of truth (2,400+ cards)
│   │   ├── cardRegistry/   # Card sets by ID ranges
│   │   ├── dailyQuestPool.ts # 19 quest templates
│   │   ├── keywordDefinitions.ts # All keyword names + descriptions
│   │   └── norseHeroes/    # 77 playable heroes
│   ├── campaign/           # Campaign system
│   │   ├── campaignTypes.ts # Mission, chapter, AI profile types
│   │   ├── campaignStore.ts # Progress tracking (Zustand + persist)
│   │   ├── chapters/       # 5 faction chapters (49 missions total)
│   │   └── index.ts        # Barrel exports + ALL_CHAPTERS
│   ├── crafting/           # Crafting economy
│   │   ├── craftingConstants.ts # Eitr values + forge costs
│   │   └── craftingStore.ts # Eitr balance (Zustand + persist)
│   ├── tournament/         # Tournament system
│   │   ├── tournamentTypes.ts # Tournament, match, bracket types
│   │   └── tournamentStore.ts # Tournament state (Zustand)
│   ├── spectator/          # Spectator mode
│   │   ├── spectatorFilter.ts # Strip hidden info for spectators
│   │   └── useSpectatorSync.ts # Read-only PeerJS connection
│   ├── tutorial/           # Tutorial system
│   │   └── tutorialStore.ts # 15 steps (Zustand + persist)
│   ├── engine/             # WASM game engine (mandatory, no TS fallback)
│   │   ├── wasmLoader.ts   # Load + hash-verify WASM module
│   │   └── engineBridge.ts # TS ↔ WASM interface
│   ├── combat/             # Combat system + poker mechanics
│   │   ├── RagnarokCombatArena.tsx
│   │   ├── PokerCombatStore.ts
│   │   ├── styles/
│   │   │   ├── zones.css   # Zone positioning (single source)
│   │   │   └── tokens.css  # Design tokens
│   │   └── modules/        # Hand evaluator, betting
│   ├── effects/            # Effect handlers
│   │   └── handlers/       # battlecry/, deathrattle/, spellEffect/
│   ├── subscribers/        # BlockchainSubscriber (match packaging + IDB refresh), DailyQuestSubscriber
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Game utilities
│       ├── game/           # Game state utilities
│       ├── cards/          # Card level scaling, evolution tiers
│       ├── deckCode.ts     # Deck import/export (base64 encoding)
│       ├── battlecry/      # Battlecry utilities
│       └── spells/         # Spell utilities
├── components/ui/          # Shadcn/Radix UI components
└── lib/                    # Utilities and helpers

server/
├── routes.ts               # API routes + mount points
├── routes/
│   ├── chainRoutes.ts      # REST: leaderboard, ELO, cards, deck verify
│   ├── matchmakingRoutes.ts # ELO-proximity matchmaking queue
│   ├── socialRoutes.ts     # Friends: heartbeat, challenges, presence
│   ├── tradeRoutes.ts      # Trading: create/accept/decline/cancel offers
│   ├── tournamentRoutes.ts # Tournaments: CRUD, register, results, brackets
│   ├── treasuryRoutes.ts   # Treasury multisig: signers, WoT, transactions, freeze
│   └── mockBlockchainRoutes.ts # In-memory mock (dev only)
├── services/
│   ├── chainIndexer.ts     # Server-side chain replay (optional convenience)
│   ├── chainState.ts       # In-memory account state for global queries
│   ├── tournamentManager.ts # Swiss/elimination pairing logic
│   ├── hiveAuth.ts         # Hive signature verification for server auth
│   ├── treasuryCoordinator.ts # Multisig coordinator (signing, quorum, WoT, freeze)
│   ├── treasuryHive.ts     # Hive L1 treasury utilities (authority, balance, broadcast)
│   └── treasuryAnomalyDetector.ts # Anomaly detection (burst, spike, auto-freeze)
└── storage.ts              # Database interface

operator/
└── indexer.ts              # Standalone WoT operator binary (block scanner → NDJSON → IPFS)

shared/
├── protocol-core/          # Canonical protocol: normalize, apply, types, broadcast-utils
│   ├── apply.ts            # 28 canonical op handlers (v1.0 + v1.1 + v1.2 marketplace + DUAT)
│   ├── normalize.ts        # Legacy rp_* → canonical mapping (29 actions)
│   ├── types.ts            # StateAdapter, CardAsset, MarketListing, MarketOffer, DuatClaimRecord
│   ├── broadcast-utils.ts  # BuildResult<T>, batching, sanitization, deterministic UIDs, memos
│   ├── hash.ts             # SHA-256, canonical stringify
│   └── pow.ts              # PoW verification
├── indexer-types.ts        # Shared types for operator + client indexer
├── treasuryTypes.ts        # Treasury multisig types
└── schema.ts               # Drizzle DB schema
```

Card art lives in `client/public/art/` (2,700+ webp files). Art lookup uses 3-tier system: `CARD_ID_TO_ART` (2,459 ID-based entries) > `VERCEL_CARD_ART` (330 name matches) > `MINION_CARD_TO_ART` (85 creature maps). Effective coverage: 100% of cards — every card has art.

## Key Subsystems

### Card System (`game/data/`)
- **Single source**: `allCards.ts` contains all 2,242 cards (2,082 collectible NFTs + 160 tokens)
- Card registry with ID ranges in `cardRegistry/ID_RANGES.md`
- Ranges: 1000-3999 neutrals, 4000-8999 classes, 9000-9249 tokens, 20000-29967 Norse set, 30001-30410 Norse mechanics, 31001-31922 expansion gap-fill, 35001-40999 class expansions, 50000-50376 pets (38 families), 85001-86999 rogue/golems

### Decentralized Indexer (`data/indexer/` + `operator/`)

- **"Light HAF"**: IPFS op-log index replaces centralized server for leaderboard, match history, card ownership, supply queries
- **Operator binary**: `operator/indexer.ts` — standalone Node.js block scanner, outputs NDJSON chunks + manifest for IPFS
- **Client sync**: `indexSync.ts` — 5-tier resolution (on-chain CID → IPFS gateway → Hive fallback → HafSQL → bundled snapshot → P2P relay)
- **Client storage**: `indexDB.ts` — separate IndexedDB `ragnarok-index-v1` with 4 stores (global_ops, global_leaderboard, global_supply, index_sync)
- **Query API**: `indexQueries.ts` — all queries run against local IndexedDB, zero API calls
- **WoT operators**: Community members incentivized via 5% pack sale revenue share
- **Health status**: healthy (quorum) → degraded (partial) → snapshot-only (bundled) → offline
- **Optimistic updates**: Client applies ELO delta locally after match, before operator confirms
- **Design doc**: [DECENTRALIZED_INDEXER_DESIGN.md](docs/DECENTRALIZED_INDEXER_DESIGN.md)

### Combat System (`game/combat/`)
- `RagnarokCombatArena.tsx` - Main arena component with poker integration
- `PokerCombatStore.ts` - Poker-style betting and hand evaluation

### CSS Architecture (`game/combat/styles/`)
- **zones.css**: Single source of truth for all zone positioning variables
- **tokens.css**: Design tokens (spacing, colors, z-index tiers)
- **realm-boards.css**: 10 realm-specific board skins (backgrounds, glow colors, torch tints, fog)
- **norse-atmosphere.css**: Ambient effects (embers, dust motes, torch glow, vignette, battlefield divider)
- Z-index tiers: base(1) → battlefield(10) → minions(20) → hero(30) → hand(40) → betting(200) → tooltip(9000)

**To move any UI element:**
1. Open `styles/zones.css`
2. Find the `--zone-[name]-[position]` variable
3. Change the value - no other files need editing

**Realm board skins:**
- `GameState.activeRealm?.id` → `.game-viewport.realm-{id}` CSS class → unique board appearance
- Default realm is `midgard` when no `activeRealm` is set
- Each realm sets CSS custom properties: `--realm-bg-top`, `--realm-glow-color`, `--realm-divider-color`, `--realm-torch-color`, etc.
- `PixiParticleCanvas` receives `realm` prop for GPU ambient particles (snow, embers, sparkles per realm)
- Realm shift cards (IDs 30301-30309) trigger visual transition: board skin change + announcement banner

### Effect System (`game/effects/`)
- 94 battlecry handlers in `handlers/battlecry/`
- 16 deathrattle handlers in `handlers/deathrattle/`
- 71 spell effect handlers in `handlers/spellEffect/`
- All handlers export default functions and are indexed in their `index.ts`

### Type System (`game/types/`)
- `types.ts` - Main type definitions (CardData, GameState, Player, Prophecy, RealmState)
- `NorseTypes.ts` - Norse-specific types (NorseElement, NorseHero, NorseKing)
- `CardTypes.ts` - Card-specific types
- `PokerCombatTypes.ts` - Poker combat types

### Norse Mechanics (`game/data/cardRegistry/sets/core/neutrals/`)

Six unique Norse-themed mechanics with dedicated card files:

- **Blood Price** (`bloodPriceCards.ts`, IDs 30001-30008): Pay health instead of mana
- **Einherjar** (`einherjarCards.ts`, IDs 30201-30206): Die and return to deck with +1/+1 (max 3)
- **Prophecy** (`prophecyCards.ts`, IDs 30101-30107): Visible countdown timers on the board
- **Realm Shift** (`realmShiftCards.ts`, IDs 30301-30309): Change the active battlefield realm
- **Ragnarok Chain** (`ragnarokChainCards.ts`, IDs 30401-30410): Paired minions with linked destiny
- **Pet Evolution** (`pets/`, IDs 50000-50376): 38 Norse families, 3-3-1 evolution (Stage 2/3 cost 0 mana)

Game logic for these mechanics lives in:

- `gameUtils.ts` — Blood Price payment, pet evolution triggers, chain partner effects, realm buffs
- `spellUtils.ts` — `realm_shift` and `create_prophecy` spell effect handlers
- `zoneUtils.ts` — Einherjar shuffle-on-death, chain partner death triggers, Helheim return-to-hand
- `elements/elementAdvantage.ts` — Pet element advantage/weakness calculations

### Blockchain/NFT System (`data/blockchain/`)

- **Chain Replay**: `replayEngine.ts` fetches ops from Hive → `replayRules.ts` applies deterministic rules → IndexedDB stores state
- **29 op types**: genesis, mint, seal, transfer, burn, pack_open, reward_claim, match_start, match_result, level_up, queue_join, queue_leave, slash_evidence, team_submit, card_transfer, pack_mint, pack_distribute, pack_transfer, pack_burn, card_replicate, card_merge, market_list, market_unlist, market_buy, market_offer, market_accept, market_reject, duat_airdrop_claim, duat_airdrop_finalize
- **16 IndexedDB stores**: cards, matches, reward_claims, elo_ratings, token_balances, sync_cursors, genesis_state, supply_counters, match_anchors, queue_entries, slashed_accounts, player_nonces, pending_slashes, market_listings, market_offers, duat_claims
- **Admin lifecycle**: genesis (one-time) → seal (permanent) → admin key irrelevant forever
- **Self-serve rewards**: 11 milestones in `tournamentRewards.ts`; players claim via Keychain
- **Supply caps**: ~2.7M total NFTs (2,000/common, 1,000/rare, 500/epic, 250/mythic per card)
- **NFT provenance**: `HiveCardAsset` stores `mintTrxId`, `mintBlockNum`, `lastTransferTrxId`, `lastTransferBlock` — full on-chain history per card
- **Explorer links**: `explorerLinks.ts` generates clickable URLs (hivehub.dev) for any trxId or block
- **Provenance viewer**: `NFTProvenanceViewer.tsx` shows full metadata + explorer links in collection
- **Direct transfer**: `SendCardModal.tsx` — one-click card gifting via Keychain, double-confirm safety
- **Ownership enforcement**: `heroDeckStore.ts` gates deck building on chain-derived NFT collection
- **Event bus**: `HiveEvents.ts` emits card:transferred, token:updated, transaction:confirmed/failed → toast notifications via `gameStoreIntegration.ts`
- **Post-match refresh**: `BlockchainSubscriber.ts` re-reads IndexedDB → HiveDataStore after each match (XP, levels, RUNE rewards)
- **Reward claiming**: campaign, daily quests broadcast `reward_claim` on chain via bridge `claimReward()`

### NFT Bridge (`game/nft/`)

Clean contract boundary between game code and the blockchain/NFT layer. Game code imports `getNFTBridge()` instead of directly importing from `data/`.

- **INFTBridge interface**: 26 methods covering mode, identity, collection, stats, tokens, auth, transactions, events, lifecycle
- **HiveNFTBridge**: Delegates to HiveSync, HiveEvents, HiveDataLayer — the ONE file allowed to import from `data/blockchain/`
- **LocalNFTBridge**: No-ops for chain operations, `getOwnedCopies()` returns `Infinity` (unlimited in local mode)
- **Factory**: `initializeNFTBridge()` dynamically imports the correct bridge based on `getDataLayerMode()`
- **React hooks**: `useNFTUsername()`, `useNFTCollection()`, `useNFTStats()`, `useNFTTokenBalance()`, `useIsHiveMode()`, `useNFTElo()`
- **Zod at boundaries**: `opSchemas.ts` validates all 15 chain op payloads in `applyOp()` before entering deterministic handlers
- **ICardDataProvider**: Interface that blockchain code uses instead of importing `allCards` directly (wired at app startup)
- **Shared featureFlags**: `client/src/config/featureFlags.ts` re-exports from `game/config/` so both `game/` and `data/` can import
- **Allowed direct imports**: `HiveKeychainLogin.tsx` (IS blockchain UI), `BlockchainSubscriber.ts` (IS blockchain layer), chain-specific ops in CollectionPage/PacksPage/useP2PSync

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

Note: `client/public/models/` (127MB .glb 3D models) and `client/public/geometries/` (.gltf) were deleted — unused assets removed from build.

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

# NFT Bridge - Contract interface, don't change signatures without review
client/src/game/nft/INFTBridge.ts
client/src/data/blockchain/opSchemas.ts
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

### Artifact & Armor System

- **Artifacts** (IDs 29800-29809, 29900-29967): Legendary hero-specific equipment with `heroId` field
- **Armor** (IDs 29810-29899): Equippable gear with `armorSlot` (helm/chest/greaves) and set bonuses
- Card type validation: `cardRegistry/validation.ts` validates both types
- Deck builder filtering: artifacts restricted to matching `heroId` via `filterCardsByClass(cards, heroClass, heroId)`
- Game logic: `artifactUtils.ts` (equip/destroy/attack bonus), `armorGearUtils.ts` (equip/unequip/set bonuses)

### Norse Mechanics Architecture

- **Blood Price**: `bloodPrice` field on `BaseCardData`; `playCard()` in `gameUtils.ts` handles health-vs-mana payment
- **Einherjar**: `einherjar` keyword; `destroyCard()` in `zoneUtils.ts` shuffles +1/+1 copy into deck (max 3 generations)
- **Prophecy**: `Prophecy` interface on `GameState.prophecies[]`; countdown ticks in `endTurn()`; `resolveProphecy()` handles 7 effect types
- **Realm Shift**: `RealmState` on `GameState.activeRealm`; `realm_shift` spell effect in `spellUtils.ts`; start/end-of-turn realm effects in `gameUtils.ts`
- **Ragnarok Chain**: `chainPartner` + `chainEffect` fields on `MinionCardData`; both-in-play buffs in `playCard()`; partner-death triggers in `destroyCard()`
- **Pet Evolution**: 3-3-1 family system (38 families, 266 cards); `petStage`, `petFamily`, `petFamilyTier`, `evolvesInto/From`, `evolutionCondition`, `stage3Variants` fields; Stage 2/3 cost 0 mana (free evolution); `attemptPetEvolution()` in `gameUtils.ts` handles transform + variant selection; `checkPetEvolutionTrigger()` fires on 15 triggers across gameUtils/spellUtils/battlecryUtils/zoneUtils; evolve info icon on Stage 2/3 cards in SimpleCard.tsx; Stage 3 cards show "?" for ATK/HP until evolved (cyan glow via `hasStage3Variants` flag); `PET_EVOLVED` event emitted via `GameEventBus`; AnimationSubscriber queues `pet_ascension` (Stage 2, 800ms, priority 8) and `pet_apotheosis` (Stage 3, 1500ms, priority 15); NotificationSubscriber shows evolution toasts; `ready-to-evolve` CSS class adds rotating conic gradient border + ⬆ icon on `petEvolutionMet` cards
- **Rune** (renamed from Secret): Description text says "Rune" but underlying keyword is still `secret` for backwards compatibility
- **Runic Bond** (renamed from Magnetic): Description says "Runic Bond" but keyword is still `magnetic`
- **Yggdrasil Golem** (renamed from Jade Golem): Effect key is `summon_yggdrasil_golem`; handlers still in files named `summonJadeGolemHandler.ts`
- **Berserker** (renamed from Demon Hunter): Class name updated across all card data

### Hive NFT System

- Chain replay is client-side (browser runs deterministic rules, builds IndexedDB)
- Server indexer is optional convenience (leaderboard, ELO lookup, cross-account queries)
- Admin authority ends at seal — no ongoing admin key needed
- Reward claims are self-serve (players verify own stats, no admin distribution)
- ELO is chain-derived (K=32, computed from match_result history)
- Supply caps hard-enforced by every reader (~2.7M: 2,000/common, 1,000/rare, 500/epic, 250/mythic per card)
- Every NFT stores mint + transfer trxIds — provenance viewer links directly to Hive explorer
- Direct gifting via `SendCardModal` + bridge `transferCard()` — no trade negotiation needed
- Deck builder enforces NFT ownership via bridge `getOwnedCopies()` (local mode = unlimited)
- NFT Bridge (`game/nft/`) is the single access point — game code imports `getNFTBridge()` instead of `data/` directly
- Zod validates all 20 chain op payloads at the `applyOp()` boundary (runtime protection for raw JSON from chain)
- `ICardDataProvider` breaks reverse coupling — blockchain code never imports `game/data/allCards` directly
- `HiveEvents` bus drives real-time toast notifications for transfers, token changes, tx status (wired through bridge)
- `BlockchainSubscriber` refreshes HiveDataStore from IndexedDB after each match (XP, RUNE, levels)
- Campaign + daily quest rewards broadcast `reward_claim` on chain via bridge
- **v1.1: Atomic transfers** — card/pack transfers bundle 0.001 HIVE native transfer for L1 explorer visibility
- **v1.1: Pack NFTs** — sealed packs as tradeable NFTs with deterministic DNA; `pack_mint`/`pack_transfer`/`pack_burn` ops
- **v1.1: DNA lineage** — every card has `originDna` (genotype) + `instanceDna` (phenotype); `card_replicate`/`card_merge` ops
- Design document: [ATOMIC_NFT_PACKS_DESIGN.md](docs/ATOMIC_NFT_PACKS_DESIGN.md)

## Known Issues & Fixes

### Poker Combat Freeze (Fixed)
- **Problem**: Game froze after resolving poker hand
- **Solution**: Three-layer safety net in `useRagnarokCombatController.ts`:
  1. `useCombatEvents` triggers showdown celebration (handles both showdown + fold via `foldWinner` check)
  2. `showdownBackupTimerRef` (4s) forces combat end if celebration animation hangs
  3. `resolutionEscapeRef` (3s) forces next hand if RESOLUTION phase is stuck without celebration
- **Details**: `handleCombatEnd` retries every 500ms if discovery selection is in progress

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

## Route Structure

```text
/              → HomePage (quests, friends, navigation)
/game          → RagnarokChessGame (single-player)
/campaign      → CampaignPage (49 missions, 5 factions)
/multiplayer   → MultiplayerGame (P2P ranked)
/tournaments   → TournamentListPage (brackets, registration)
/packs         → PacksPage (open card packs)
/collection    → CollectionPage (with crafting)
/trading       → TradingPage (card/Eitr trade offers)
/marketplace   → MarketplacePage (on-chain NFT listings, buy/sell/offer)
/ladder        → RankedLadderPage (ELO leaderboard)
/history       → MatchHistoryPage (replay viewer)
/spectate/:id  → SpectatorView (read-only P2P)
/settings      → SettingsPage (audio, visual, gameplay)
/treasury      → TreasuryPage (multisig governance, WoT vouching)
/admin         → AdminPanel (genesis ceremony, batch mint, seal, packs — @ragnarok only)
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

### Completed (Full Product Launch)

- Settings system (audio, visual, gameplay, keybindings)
- Deck import/export via shareable base64 codes
- Daily quest system (19 templates, 3 active, daily refresh)
- Friends list (presence polling, challenge invites)
- Single-player campaign (49 missions, 5 factions, difficulty scaling)
- Card crafting (Eitr economy: dissolve/forge, 8:1 cost ratio, random output)
- Card trading (P2P trade offers with Eitr + cards)
- Tournament system (Swiss + elimination, server-managed brackets)
- Spectator mode (filtered P2P read-only connection)
- Match replay viewer (action timeline, playback controls)
- WASM engine infrastructure (loader, bridge, mandatory — no TS fallback)
- Block reference cache (3s Hive polling, per-move anchoring)
- Per-move state hashing (SHA-256 state hash after each action)
- Loading screen (Norse lore quotes, rune spinner)
- Tutorial overlay (15-step onboarding walkthrough)
- Keyword definitions (48 keywords with descriptions, including Wager)

### Completed (Norse Mechanics Expansion)

- Blood Price system (8 cards, health-as-mana payment)
- Einherjar system (6 cards, shuffle-on-death with +1/+1, max 3 returns)
- Prophecy system (7 cards, visible countdown timers, 7 resolve effect types)
- Realm Shift system (9 cards, board-wide rule changes across the Nine Realms)
- Ragnarok Chain system (10 cards, 5 mythological pairs with linked destiny)
- Pet Evolution system (266 cards, 38 families, 3-3-1 evolution, Stage 2/3 cost 0 mana, evolve info icon, "?" stats on unevolved Stage 3, PET_EVOLVED event, ascension/apotheosis animations, ready-to-evolve battlefield indicator)
- Vanilla Minions (7 baseline stat cards for evaluation benchmarks)
- Berserker class rename (formerly Demon Hunter)
- Rune keyword rename (formerly Secret, display text only)
- Runic Bond keyword rename (formerly Magnetic, display text only)
- Yggdrasil Golem rename (formerly Jade Golem, effect key + handlers updated)
- Element advantage system for pet combat (+2 bonus damage)
- Hero-pet element synergy (+1 Health when elements match)
- Warcraft/Hearthstone IP purge (72 card renames to Norse equivalents)
- Mech → Automaton, Murloc → Naga terminology cleanup (45 cards)
- Card balance pass (Apollo, Gate to Alfheim, Stubborn Turtle, Warrior's Will, Gate to Jotunheim)

### Completed (Card Gap-Fill Expansion)

- Fixed broken battlecry handlers: `summon_dead_einherjar`, `summon_copy_if_blood`, `gain_armor`, `deal_damage` alias
- Fixed broken spell handler: `reveal_hand` (Mimir's Eye Blood Price bonus)
- Berserker class expansion (+12 cards: cheap weapons, removal, board clear, draw, overkill)
- Neutral Mythic tech minions (8 cards: Mimir, Hoenir, Forseti, Kvasir, Lodur, Vili, Bragi, Ull)
- Hunter board clear (Rain of Arrows AOE, Skadi's Mark targeted removal)
- Druid board clear (Wrath of Yggdrasil Choose One AOE, Thorns of Jotunheim AOE + draw)
- Rogue Combo keyword expansion (+6 cards: Loki's Sleight, Shadow Viper, Niflheim Cutthroat, Shadowstep of Hel, Loki's Grand Scheme, Svartalf Combo Master)
- Pet-matters neutral cards (5 cards: Beast Tamer, Elemental Harmony, Rune of Wild Bond, Yggdrasil Beastkeeper, Fenrir's Chosen Alpha)
- Dragon-holding conditional cards (4 cards: Nidhogg's Disciple, Dragonscale Warden, Fafnir's Hoardkeeper, Jormungandr's Envoy)
- Cross-Norse-mechanic synergy cards (5 cards: Weaver of Fates, Seidr Channeler, Bifrost Resonator, Einherjar Oath-Keeper, Ragnarok Harbinger)
- Deepened thin keywords: Overkill +3, Frenzy +3, Inspire +4, Echo +3 cards
- Expansion card IDs: 31001-31806 (see ID_RANGES.md)

### Completed (Card Data Integrity Audit)

- Fixed 22 duplicate card IDs: rogue combo cards re-IDed to 85001-85010, The Coin to 9050, mechanicCards to 40050-40051, Jötunn Thornback to 8501
- Fixed Runic Bond (Magnetic) race check: `magneticUtils.ts` and `gameUtils.ts` now accept both `'mech'` and `'Automaton'` (case-insensitive)
- Fixed DeathKnight class casing: 26 cards `"Deathknight"` → `"DeathKnight"`, heroes.ts `"deathknight"` → `"DeathKnight"`
- Renamed remaining Warcraft IP: Deathstalker Rexxar → Skoll Death-Hunter, Uther of the Ebon Blade → Baldr Fallen Radiance, Shadowmourne → Helgrind's Cleaver, Morgl → Aegir the Tidecaller, Stranglethorn Tiger → Skogkatt Stalker, Ancient of Lore → Ancient of Wisdom (sub-options)
- Fixed all murloc→naga effect references: 15 edits across 9 files (battlecry conditions, targetTypes, cardTypes, drawTypes, adapt handler)
- Renamed `isMurlocCard()` → `isNagaCard()` in cardUtils.ts + all callers in battlecryUtils.ts
- Fixed `silence_or_destroy_mech` → `silence_or_destroy_automaton` on card 27004 + added handler in battlecryUtils.ts
- Fixed Krul/The Unshackled in highlanderUtils.ts: demon → titan race check (case-insensitive)
- All race comparisons in effect handlers made case-insensitive: 10 handler files + battlecryUtils + spellUtils
- Standardized race casing to Title Case: ~300+ fixes across 20+ files (Beast, Dragon, Automaton, Naga, Elemental, Titan, Einherjar, Spirit, Undead)
- Updated tribe targets and targetTypeValidation in battlecryUtils.ts: added automaton, naga, titan, einherjar, spirit, draugr, undead
- Summoned totem race `'totem'` → `'Spirit'` (Norse rename)
- Created Ivaldi's Constructs pet family (#38): 7 cards, IDs 50370-50376, Fire/Electric/Neutral Automaton evolution
- Renamed `hearthstoneInspired*` variables → `mythology*` in neutrals/index.ts (7 variable renames)
- Added 13 missing keyword definitions: choose_one, outcast, quest, sidequest, spellburst, enrage, tradeable, recruit, cleave, aura, flying

### Completed (Rarity & IP Cleanup)

- Renamed `legendary` → `mythic` in 20+ code files (audio, animations, notifications, quests, UI effects, stores, subscribers, deck builder)
- Updated `SoundType`, `CardSummonEffectProps`, `SummonEffect` interfaces from 'legendary' to 'mythic'
- Renamed `isCardLegendary()` → `isCardMythic()`, `MAX_LEGENDARY_COPIES` → `MAX_MYTHIC_COPIES`
- Renamed ~60 Warcraft hero names to Norse equivalents in heroes.ts (Valeera→Nótt, Anduin→Eir, Malfurion→Idunn, all alternates)
- Renamed "Demon Claws" hero power → "Berserker Claws" (heroes.ts, heroPowerUtils.ts, heroes/index.ts, replaceHeroPowerHandler.ts)
- Renamed "Demonic Blast" upgraded power → "Berserker Fury"
- Fixed enrageUtils.ts: updated 5 dead Warcraft card name cases (Grommash→Tyr God of War, Tauren Warrior→Enraged Berserker)
- Fixed cardDatabase.ts: Grommash Hellscream→Tyr God of War, Tirion Fordring→Týr Champion of Justice
- Renamed `HEARTHSTONE_DECKS` → `RAGNAROK_DECKS` storage key (storageKeys.ts, useGame.tsx, gameUtils.ts)
- Fixed "Secret" → "Rune" in card descriptions (deepKeywordCards.ts, additionalSpellCards.ts)
- Fixed "Magnetic" → "Runic Bond" in card descriptions (commonNeutralMinions.ts)

### Completed (System Audit & Balance Pass)

- React.memo + Map-based O(1) lookups in Hand.tsx, shakeTimerRef cleanup in HandFan.tsx
- P2PContext.tsx: separated actions ref from gameState to reduce context broadcasts
- Fixed 8 duplicate IDs in 85xxx range (shaman 85201-85211, druid 85301, rogue 85021-85022)
- Fixed broken summonCardId/targetCardId cross-references in yggdrasilGolems.ts
- Card balance: nerfed Loki's Spark, Earth Elemental, Svartalf Combo Master, Baldur's Doom, Gate to Helheim
- Card balance: buffed Young Hippogriff, Ironbeak Owl, Rider of Sleipnir, Crusader of Valhalla
- Renamed Al'Akir → Kari, Lord of Storms; Magtheridon → Thrymr the Imprisoned
- Added 5 neutral Lifesteal minions (IDs 31901-31905, 2-6 mana curve)
- Added 2 Paladin 2-mana class minions (IDs 8530-8531: Baldur's Acolyte, Shieldbearer of Tyr)
- Fixed vanilla stat formula comment: `(mana cost × 2) + 1`
- Fixed `VALID_RARITIES` in cardSchemaValidator.ts: added `'mythic'` + `'basic'` (was rejecting all mythic cards)
- Fixed `getLegendaryCards` → `getMythicCards` in useCardDatabase.ts (was returning empty)
- Fixed tournament rewards `rarity: 'legendary'` → `'mythic'` (3 instances)
- Fixed "Demon's Bite" → "Berserker's Bite" hero power in heroPowerUtils.ts
- Fixed "Secret Active" → "Rune Active" display text in BattlefieldHero.tsx + NotificationSubscriber.ts
- Fixed "Frostmourne" → "Helgrind" weapon name in equipFrostmourneHandler.ts
- Fixed `hearthstone-deck-builder` → `ragnarok-deck-builder` localStorage key
- Fixed `hearthstone-card-play` → `ragnarok-card-play` DOM event name
- Fixed DeathKnight casing: remaining `"Deathknight"` → `"DeathKnight"` in cards.ts, heroes/index.ts, tokens/index.ts, deathknightCards.ts
- Nerfed 0-cost Charge pets: Freyja's Chosen, Einherjar Eternal, Fenrir Reborn all changed Charge → Rush
- Nerfed Doomed Guardian (warlock): Charge → Rush
- Nerfed Thrymr the Imprisoned (ex-Magtheridon): 12/12 → 8/8
- Deleted Aeolus, Wind Tyrant (exact dupe of Kari, Lord of Storms)
- Deleted 4 duplicate Old God cards (32087-32089, 32094) — canonical versions in oldGods.ts

### Completed (Alpha Readiness)

- Implemented 5 stub handlers: armor_based_on_missing_health, replay spells, summon spell, Yogg casting, highlander potions
- Renamed demon race → Titan across 67+ card data files (names, descriptions, effects, targets)
- Purged all Hearthstone/Blizzard IP from source (200+ comment references → 0)
- Fixed DeathKnight casing in remaining files (superMinions, artifacts, equipFrostmourneHandler)
- Documented no-fatigue-damage as intentional design in RULEBOOK.md
- Fixed duplicate case labels (CollectionPage, conditionalDrawHandler)
- Removed invalid react-hooks/exhaustive-deps comments
- Optimized Vite build chunking (20+ granular chunks, NODE_OPTIONS safety net for CI)

### Completed (Campaign Lore Rewrite)

- Rewrote Norse chapter as chronological Prose Edda campaign (Gylfaginning ch. 5-9)
- 9 missions: Ginnungagap → Ymir's Slaying → World Forging → Ask/Embla → Asgard → Alfheim → Vanir War → Jotunheim → Ragnarok Omen
- Added Ginnungagap as primordial realm (pre-Nine Realms void)
- Added AI profiles: ymir (brutal aggro), bergelmir (vengeful), vanirWarlord (nature-magic)
- Boss rules scale from none (mission 1) to triple-stacked modifiers (finale)
- Cinematic intro preserved (12-scene Ymir creation/slaying sequence)

### Completed (Eitr Crafting & Forge Implementation)

- Renamed dust → Eitr (primordial essence from Niflheim) across 14 files
- `craftingConstants.ts`: `EITR_VALUES` + `getEitrValue()` + `getCraftCost()`
- `craftingStore.ts`: `eitr` state, `addEitr()`, `spendEitr()` (Zustand + persist)
- `CraftingPanel.tsx`: "Dissolve" (destroy card → gain Eitr) / "Forge" (spend Eitr → random card)
- `CollectionPage.tsx`: Full forge/dissolve implementation with inventory state updates
  - Dissolve: decrements card quantity, removes from HiveDataStore, adds Eitr
  - Forge: spends Eitr, picks random non-hero card of matching rarity from `cardRegistry`, adds to local state + HiveDataStore
  - Random output prevents NFT supply hoarding (250 copies per mythic card, 500 epic, 1,000 rare, 2,000 common)
- `CampaignPage.tsx`, `TradingPage.tsx`: Eitr display labels
- `campaignTypes.ts`: `CampaignReward.type` includes `'eitr'`
- All 5 campaign chapters: reward type `'dust'` → `'eitr'`

### Completed (Campaign & Security Polish)

- Mapped all 49 campaign `aiHeroId` values to real hero registry IDs across 5 chapters
- Remapped Greek/Egyptian/Celtic/Eastern AI deck generators from sparse 1000-3000 ranges to dense 20000+ range
- Fixed Eastern chapter deck ID collision with Greek (both were using `1000+n`)
- Replaced 12 non-existent reward `cardId` values with real cards from the registry
- Fixed Hydra `start_with_minion` boss rule to reference real card 20203 (Hydra, Many Heads)
- Added `helmet` middleware for CSP, HSTS, X-Frame-Options security headers
- Removed 9 unused dependencies (express-session, passport, passport-local, connect-pg-simple, memorystore + @types)
- Deleted 4 dead legacy pet files (firePets, waterPets, grassPets, electricPets — 48 duplicate IDs)
- Fixed `getMission()` double-counting easternChapter in `ALL_CHAPTERS`
- Re-IDed paladin Luminous Blade from 8501 to 8540 (conflict with berserker Jötunn Thornback)

### Completed (Greek Campaign & Class Completeness)

- Rewrote Greek chapter as "Echoes of Chaos: Blood of the Olympians" (Hesiod/Apollodorus sources)
- 10 Greek campaign missions: Chaos → Uranus → Cronus → Zeus → Titanomachy → Prometheus → Typhon → Giants → Heroic Age → Seeds of Strife
- Added 6 Greek AI profiles (uranus, atlas, typhon, porphyrion, gaiaRemnant + existing)
- Added 3 new heroes: Prometheus (druid), Heracles (warrior), Rhea (priest) with lore-accurate powers
- Artemis hero power reworked: "Silver Arrow" (+1 damage to hero + buff all pets)
- Added 6 Greek mythic minion cards (32101-32106): Cerberus, Typhon, Porphyrion, Atlas, Campe, Medusa
- Added NorseTypes.ts: damage_hero_and_buff_pets, self_damage_and_buff, buff_random_friendly, heal_bonus
- Fixed EnhancedCard.tsx taunt border (broken borderImage → CSS-only)
- Fixed LocalStorageAdapter.ts silent error swallowing (10 catch blocks)
- Deleted duplicate setHealthHandler.ts spell effect file
- Class completeness expansion: 82 new cards across all 12 classes (IDs 38001-39104)
  - Mage: Arcane package + Spell Damage synergy (10 cards)
  - DeathKnight: Blood/Frost/Unholy Rune spells + Corpse mechanic (10 cards)
  - Shaman: Evolve, totem generation, Bloodlust equivalent (8 cards)
  - Paladin: Token generation (Muster), Divine Shield synergy (8 cards)
  - Druid: Permanent ramp, Innervate, first weapon, Force of Nature (8 cards)
  - Hunter: Kill Command, Tracking, Multi-Shot, Explosive Trap (8 cards)
  - Necromancer: Shadow damage spells, mass resurrection (7 cards)
  - Priest: Shadow Word spells, mind control, Shadow Priest archetype (6 cards)
  - Berserker: Lifesteal minions, Outcast payoffs (5 cards)
  - Warlock: Zoo 1-drops, discard payoffs (4 cards)
  - Rogue: Burgle/thief archetype, card draw (4 cards)
  - Warrior: Whirlwind effects, Enrage enablers (4 cards)

### Completed (WASM Anti-Cheat Enforcement)

- Removed all TypeScript fallbacks from WASM engine (wasmInterface, engineBridge, wasmLoader)
- All engine functions (`hashGameState`, `calculateFinalDamage`, `getNextPhase`, etc.) throw if WASM not loaded
- `loadWasmEngine()` throws on failure (was silently returning `false`)
- `getWasmBinaryHash()` throws if not loaded (was returning `'unavailable'`)
- `getEngineVersion()` throws if not loaded (was returning `'typescript-fallback'`)
- `computeStateHash()` calls WASM directly — no `crypto.subtle` fallback
- `computeStateHashSync()` returns `string` (was `string | null`)
- `EngineResult` no longer has `engine` field (always WASM)
- Removed `isWasmAvailable()` export entirely
- P2P hash check no longer accepts `'dev'` or `'unavailable'` as valid hashes
- `useP2PSync` shows error toast if WASM fails to load (was silent)
- `gameStore.updateStateHash` logs WASM errors (was silently swallowing)
- Added 33 anti-cheat tests (vitest): enforcement, determinism, tamper detection

### Completed (Animation Rendering Bridge)

- Created `useEventAnimationBridge` hook bridging `AnimationSubscriber` (event bus queue) to `AnimationLayer` (Framer Motion renderer)
- Event flow: `GameEventBus.emit()` -> `AnimationSubscriber` queues -> `onAnimation()` fires -> bridge resolves `[data-instance-id]` DOM positions -> pushes to `GlobalAnimationQueue` -> `AnimationLayer` renders
- Added 7 new visual effect renderers in `AnimationLayer.tsx`: BattlecryEffect, DeathrattleEffect, SummonEffect, BuffEffect, PetAscensionEffect, PetApotheosisEffect
- Mapped 13 event animation types to rendering pipeline: card_play, mythic_entrance, card_draw, card_burn, death, spell_cast, battlecry, deathrattle, summon, buff, pet_ascension, pet_apotheosis, turn_start
- Bridge mounted in both `GameBoard.tsx` (single-player) and `RagnarokCombatArena.tsx` (poker combat)

### Completed (AAA Animation Upgrade)

- Golden card surface effect: SVG `feTurbulence`+`feDisplacementMap` filter for mythic/epic card art displacement, CSS `golden-flow` gradient overlay, `golden-hue-shift` foil animation, `golden-warp` perspective hover — zero JS cost
- Realm-aware ambient GPU particles: 10 realm configs in `PixiParticleCanvas.tsx` (niflheim snow, muspelheim embers, alfheim sparkles, etc.), `startAmbientParticles(realm)`/`stopAmbientParticles()` exports
- Upgraded all AnimationLayer effects from basic Framer Motion divs to GPU-accelerated Pixi particle bursts + premium Framer Motion composites (battlecry shockwave+beam, deathrattle vortex+skull, summon light pillar, buff aura+value, pet ascension/apotheosis with triple rings+screen flash)
- Card play arc animation: parabolic arc from hand to board with spell/minion color variants, Pixi burst on landing
- Spell projectile travel: animated orb from source→target with spell-type-aware colors, Pixi burst+ring on impact
- Critical hit system: damage ≥10 triggers white screen flash, oversized golden damage number, 50-particle GPU burst+impact ring
- Victory cinematic: golden screen flash, 3 staggered GPU particle bursts, "VICTORY" text with glow animation
- Defeat cinematic: dark overlay, shadow/fire particles, "DEFEAT" text with dramatic scale animation
- LegendaryEntrance: replaced placeholder div with real `SimpleCard` component (preview size), migrated 40 DOM particles to 3 staggered Pixi GPU bursts
- EnhancedDeathAnimation: migrated 80 DOM particles + injected CSS keyframes to 3 staggered Pixi GPU bursts+embers+impact ring
- `GoldenCardFilter.tsx`: portal-mounted SVG filter definitions for golden/epic displacement effects

### Completed (Rendering Performance Optimization)

- Converted 20+ CSS keyframe animations from box-shadow/text-shadow to opacity-only (GPU compositor, zero repaints)
  - SimpleBattlefield: 8 status effects (poison, bleed, burn, freeze, paralysis, weakness, vulnerable, marked) + evolve-ready pulse
  - AttackStyles: ready-pulse, target-pulse
  - RagnarokCombatArena: end-turn-glow, upgrade-pulse, end-turn-pulse
  - end-turn-button: end-turn-glow
  - HUDOverlay: hud-end-turn-glow
  - SimpleCard: evolve-pulse
  - DeckPile: low-deck-pulse
  - HeroPowerButton: hero-power-upgrade-glow
  - ChessPiece: matchup-pulse animations + inline matchup glow styles moved to CSS classes
  - glow-effects: premiumGlowPulse removed (static box-shadow)
  - RaceIcon: subtle-glow removed (7-layer box-shadow animation on every card hover)
  - constellation-map: realm-pulse (9 always-visible nodes)
  - combat-animations: glow-pulse
  - GameOverScreen: victory-title-pulse (text-shadow → opacity)
- Removed unnecessary `will-change` declarations (z-index, filter not GPU-compositable; hover-only buttons; deck builder)
- Removed `backdrop-filter: blur()` from RaceIcon (36px element) and reduced GameOverScreen blur
- React.memo added to SimpleCard named export (most-rendered component, was unmemoized), CardWithDrag, MulliganCard, CollectionCard
- Hoisted inline style/animation objects to module-level constants across 6 components (SimpleCard, CardRenderer, CardWithDrag, MulliganCard, CollectionCard, CardDragAnimation)
- Fixed `style = {}` default parameter pattern (creates new ref every render, breaks memo) with `EMPTY_STYLE` constants
- Fixed `() => {}` default callback pattern with stable `NOOP` constants
- Added `useCallback` for event handlers in CardWithDrag, CollectionCard
- Added `useMemo` for derived card data in MulliganCard, CollectionCard
- Net result: ~255 fewer lines, eliminated ~60 repaints/sec per animated element

### Completed (Build & Deploy Fixes)

- Fixed lint-staged pre-commit hooks: `eslint --fix --max-warnings=-1` tolerates pre-existing warnings
- Removed legacy `.eslintrc.js` (superseded by `eslint.config.js` flat config)
- Fixed art/image paths for local downloads: Vite `base` now defaults to `'./'` (relative) for builds
- Downloaded games work as self-contained CDNs — local art files resolve correctly without a server
- GitHub Pages deploy sets `VITE_BASE_PATH=/norse-mythos-card-game/` via env var in deploy.yml
- `assetPath()` automatically adapts to both GitHub Pages (`/norse-mythos-card-game/...`) and local (`./...`) deployments

### Completed (Holographic Card Effects)

- Rewrote holographic card system using Pokemon Cards CSS architecture (simeydotme/pokemon-cards-css)
- Shine layer: `color-dodge` blend with `brightness(0.7) contrast(2.75) saturate(0.5)` — rainbow only tints bright highlights, dark areas stay dark
- Foil layer: switched from `screen` (additive wash) to `soft-light` (midtone shimmer) blend mode
- Glare layer: tight radial spotlight (10%/20% bright area vs old 15%/35%), `overlay` blend with `brightness(0.8)`
- Added `--card-opacity` variable (0 idle → 1 hovering) driving all layer opacities via `calc(var(--card-opacity) * factor)`
- Added `--pointer-from-center` calculation for edge-intensity effects
- Per-rarity scaling: common (no holo), rare (subtle), epic (medium), mythic (full)
- Applied to both HeroDetailPopup (clicked card) and ArmySelection grid (deck builder)
- Scanline bars + luminosity mask focus rainbow near cursor position
- Glare `::after` edge highlight ring with `brightness(0.6) contrast(3)` filter chain
- Element-themed holo effects: 7 element palettes (fire, ice, water, grass, electric, light, shadow) replace default rainbow spectrum
- Theme detection: explicit `element` field on card data, or name-regex fallback (ICE_RE, FIRE_RE, etc.)
- Stage 3 evolved pets (`petStage === 'master'`) get boosted holo intensity (shine 0.9, glare 0.65, foil 0.75)
- CSS classes: `element-holo-{theme}` for palette, `stage3-evolved` for intensity boost
- Neutral element uses default rainbow holo (no override needed)

### Completed (Realm Board Skins & Ambient Overhaul)

- Created `realm-boards.css` with 10 unique board skins: Midgard (warm stone), Asgard (golden marble + god-rays), Niflheim (blue-black ice + frost mist), Muspelheim (volcanic obsidian + lava glow), Helheim (green-purple spectral), Jotunheim (glacier blue), Alfheim (lavender bloom), Vanaheim (forest green + dappled light), Svartalfheim (bronze forge), Ginnungagap (cosmic void + stars)
- Each realm sets CSS custom properties: `--realm-bg-top`, `--realm-bg-mid`, `--realm-glow-color`, `--realm-divider-color`, `--realm-fog-color`, `--realm-vignette-color`, `--realm-torch-color`, `--realm-ember-filter`, `--realm-dust-opacity`
- Wired `GameState.activeRealm?.id` → `.game-viewport.realm-{id}` CSS class in `RagnarokCombatArena.tsx`
- Wired `PixiParticleCanvas realm` prop for realm-specific GPU ambient particles (snow, embers, sparkles, etc.)
- Default board is Midgard when no `activeRealm` is set
- Realm shift announcement banner: Framer Motion overlay with slam-in realm name + fade on realm change
- Norse knotwork board border ornament div
- Realm indicator HUD badge showing current realm name
- Boosted ambient effect visibility: 2-3x larger dust motes (1-1.5px → 3-4px), stronger torch glow (8% → 25% opacity), brighter embers, denser fog (0.3 → 0.7 opacity), sharper battlefield divider with triple glow layers
- Hero health reactions: idle breathing (4s scale pulse), low HP desaturation + red vignette (≤40%), critical HP faster pulse (≤20%)

### Completed (Pre-NFT Card & IP Audit)

- Renamed Old Gods to Norse Elder Titans: C'Thun → Gullveig the Thrice-Burned, N'Zoth → Hyrrokkin Launcher of the Dead, Yogg-Saron → Utgarda-Loki Lord of Illusions, Y'Shaarj → Fornjot the Primordial (internal effect keys preserved)
- Renamed Arcane terminology to Norse magic: Arcane → Seidr/Rune/Galdor across 5 spell card files + mage class cards
- Renamed non-Norse heroes: Mordecai → Logi the Living Flame, Apophis → Hrungnir the Stone-Hearted
- Renamed Void references → Ginnungagap (3 cards: Wind of Ginnungagap, Crab of Ginnungagap, Silencer of Ginnungagap)
- Renamed Discover keyword display text → "Völva's Vision" (tooltip) / "Foresee" (card text verb form), 121 replacements across 36 files
- Deleted 2 duplicate Elder Titan cards (91101, 91102) that used taken names (Nidhogg, Loki)
- Updated Elder Titan support card descriptions: Gullveig synergy (91002, 91003, 91005)
- Added 16 Norse mechanic payoff cards (IDs 31906-31921):
  - Blood Price payoffs (4): Wound-Drinker (Warlock), Grimnir the Hooded One (Neutral mythic), Sanguine Rune (Mage), Vithar the Silent God (Priest)
  - Prophecy payoffs (4): Skuld Norn of the Future (Neutral mythic), Doom-Reader (Warlock), Verdandi's Anchor (Warrior), Echoes of Urd (Shaman)
  - Realm Shift payoffs (4): Wanderer of the Nine (Shaman), Ratatoskr Realm-Runner (Neutral mythic), Realm-Torn Veil (Mage), Gullintanni Bifrost Sentinel (Paladin)
  - Einherjar payoffs (4): Valkyrja Chooser of the Slain (Warrior), Horn of Gjallarhorn (Paladin), Herjan Lord of Hosts (Neutral mythic), Feast of the Fallen (Priest)
- Added Eitri the Unmaker (31922): neutral 3-mana tech card, destroys enemy weapon or artifact
- Paladin gap-fill (3 cards, IDs 36407-36409): Rune of Forseti (cheap draw), Mjolnir's Echo (conditional destroy), Saga-Keeper (buff-draw trigger)
- Berserker Outcast payoffs (3 cards, IDs 38806-38808): Svartalf Exile, Ulfhednar Howl, Bolthorn the Twice-Banished (mythic bouncer)
- Necromancer early game (3 cards, IDs 38708-38710): Grave Whisperer (1-mana Undead), Bone Reaper (2-mana deathrattle), Draugr Apprentice (deathrattle cost reduction)
- New card data file: `cardRegistry/sets/core/neutrals/norseMechanicPayoffCards.ts`
- Updated ID_RANGES.md with new expansion ranges

### Completed (Deck Builder UX Overhaul)

- Left-click cards to add directly to deck (was: click to open popup)
- Right-click opens card detail flip view for full info
- Hover tooltip (300ms delay) shows name, description, keywords, race
- Card tiles now display 2-line description snippet inline
- Count badge shows `x/max` format (e.g. `1/2`)
- Added rarity filter dropdown (All/Common/Rare/Epic/Mythic)
- Card grid enlarged: 195px min (210px on wide screens, 155px mobile)
- Click-to-add press feedback (scale 0.96), deck card slide + press feedback
- Fixed deck builder z-index: was z-50 (hidden behind army sidebar z-60), now z-200
- Card detail flip z-210, hover tooltip z-205

### Completed (Combat Layout — Virtual Canvas Fix)

- Converted all zone positions from viewport-relative (vw/vh/%) to fixed px within 1920×1080 virtual canvas
- GameViewport.tsx scales entire canvas via scaleX/scaleY — internal px positions stay consistent on all screens
- Player area: fixed 280px height, `align-items: flex-end` (was flex-start causing dead space)
- Hand section: removed `margin-top: 60px` that pushed cards up, now bottom-aligned
- Removed 200+ lines of conflicting vw/vh responsive breakpoints from responsive.css
- Only mobile (<768px) stacked layout breakpoint remains
- Player field at `bottom: 310px`, opponent field at `top: 260px` (fixed px, not %)
- Follows Hearthstone approach: fixed virtual resolution, all px, uniform scaling

### Completed (Pre-Launch Code Audit)

- Deleted dead `initializeEffects.ts` (empty handler dictionaries, never imported)
- Fixed z-index chaos: `99999` → `var(--z-topmost, 10000)` in HeroDetailPopup, DamageIndicator, HeroPowerButton
- Fixed localhost:5000 hardcoded fallbacks → `window.location.origin` in chainAPI.ts, useMatchmaking.ts
- Wired Elder Titan battlecries to real implementations (were returning state unchanged):
  - `yogg_saron` → `executeYoggSaronBattlecry()` (random spell replay per spells cast)
  - `cthun_damage` → `executeCThunBattlecry()` (damage split among enemies)
  - `buff_cthun` / `cthun_cultist_damage` → `buffCThun()` (buff Elder Titan stats)
  - `resurrect_deathrattle` → `executeNZothBattlecry()` (resurrect deathrattle minions)
  - `cast_all_spells` → real spell replay (was placeholder returning unchanged state)
- Removed deprecated `showSpellNotification()` / `showMinionNotification()` from gameStore.ts
  - NotificationSubscriber already handles card play notifications via GameEventBus
  - Saga feed logging preserved, battlecry announcements preserved
- Fixed silent error swallowing in BlockchainSubscriber (`catch(() => {})` → `catch(err => debug.warn())`)
- Removed dead `spellSchool` parameter and empty filter from `filterDiscoverOptions()` in mechanicsUtils.ts

### Completed (AI Upgrade + Type Safety)

- Upgraded `simulateOpponentTurn()` in gameUtils.ts from greedy bot to heuristic AI:
  - Knapsack mana solver: finds card combination that spends the most mana (was: play highest cost first)
  - Smart play order: removal spells first (if enemy has taunts), then AoE (if 3+ enemy minions), then minions
  - AoE gating: AoE spells skipped if enemy has fewer than 2 minions
  - Spell targeting: damage prefers killable high-attack targets, heals target most-damaged, buffs go on highest-attack
  - Battlecry targeting: same intelligence as spell targeting
  - Lethal detection: checks total attack vs enemy HP before any attacks; if lethal, all go face
  - Value trades: prefer killing enemy minions while surviving (score 500+)
  - Efficient trades: overkill penalized (don't waste 7/7 on 1/1)
  - Attacker sorting: lowest attack first for trades, save big minions
- Hive Keychain `broadcastCustomJson` was already fully implemented — fixed stale "stub" comment in transactionProcessor.ts
- Added 4 typed interfaces replacing `any` in core type definitions:
  - `Enchantment` (type, effect, source, buffAttack, buffHealth)
  - `BuffInstance` (attack, health, source)
  - `ChooseOneOption` (id, name, description, effect)
  - `ActiveEffect` (type, player, source, duration, value, etc.)
- Replaced 11 `: any` fields in types.ts: comboEffect, chooseOneOptions (×2), enchantments, buffs, heroPower.effect, passiveAbility.effect (×2), stage3Variants.battlecry/deathrattle
- Replaced `activeEffects: any[]` → `ActiveEffect[]` in GameContext.ts

### Completed (Campaign System Overhaul)

- Added `campaignArmy` to all 9 Norse missions with lore-accurate heroes (Ymir/Surtr/Brimir/Yggdrasil kings + faction pieces)
- Fixed `BASE_CHAPTER_MISSION_IDS` missing 'eastern' key in campaign index
- Wired boss rules into RagnarokChessGame.tsx: `extra_health` boosts opponent piece HP/maxHP, `passive_damage` hits player king each turn
- Wired reward distribution: Eitr awarded on first mission completion (double-claim prevention via `rewardsClaimed`)
- Difficulty scaling: heroic +20 HP to opponents, mythic +40 HP + 1 passive damage per turn
- Built CinematicCrawl component: Star Wars-style story crawl with title card, scene-by-scene narration, progress dots, skip button
- Cinematic plays once per chapter (tracked in campaignStore `seenCinematics`, persisted to localStorage)
- Added `markCinematicSeen`/`hasCinematicBeenSeen` to campaignStore
- Added `cinematic` game phase to RagnarokChessGame flow (before chess phase)
- Added cinematicIntro + realm fields to Egyptian, Celtic, Eastern chapters

### Completed (Base Starter Heroes)

- Created 5 free base-tier heroes (one per chess piece slot) — weaker than premium gods but fully playable
- **King — Leif the Wayfinder** (grass): +1 Health aura, start-of-turn heal to most damaged piece
- **Queen — Erik Flameheart** (fire, mage): Scorching Burst (2 dmg + 1 self-dmg), Ember's Fury weapon (3 AoE + 2 self-dmg), spell damage passive on hero damage
- **Rook — Ragnar Ironside** (water, warrior): Iron Guard (3 Armor), Tidal Bulwark weapon (6 Armor + 2 AoE), gain 1 Armor on hero damage passive
- **Bishop — Brynhild** (light, priest): Defiant Light (heal 3), Radiant Chains weapon (heal 4 all), healed target gains +1 Attack passive
- **Knight — Sigurd** (fire, rogue): Dragon's Mark (2 targeted dmg), Gram weapon (4 dmg + cleave on kill), +1 damage on minion attack passive
- All heroes: 100 HP, no summons, no minion-like mechanics
- Base heroes are index [0] in every CHESS_PIECE_HEROES array → `getDefaultArmySelection()` returns them as defaults
- New file: `client/src/game/data/norseHeroes/baseHeroes.ts` (4 NorseHero definitions)
- Registered in index.ts: ALL_NORSE_HEROES, HERO_ID_TO_CLASS, HERO_ID_TO_CONFIG_KEY, getAnyHeroById()
- Weapon upgrade IDs: 90100-90103

### Completed (Common-Tier Demigod Heroes)

- Created 10 common-tier heroes (2 demigods/saga figures per chess piece slot)
- **Queen**: Gullveig the Thrice-Burned (warlock, draw+self-damage), Groa the Seeress (mage, freeze)
- **Rook**: Hervor Bearer of Tyrfing (warrior, hero attack), Bjorn Ironside (paladin, Divine Shield)
- **Bishop**: Nanna Wife of Baldur (priest, heal+devotion), Völva the Prophetess (shaman, scry)
- **Knight**: Gudrun the Avenger (hunter, hero damage), Starkad the Eight-Armed (berserker, cleave)
- **King**: Askr First Man (+1 Attack aura), Embla First Woman (+1 Health aura + end-turn heal)
- All 100 HP, no summons, Norse saga/demigod lore
- New file: `client/src/game/data/norseHeroes/commonHeroes.ts` (8 NorseHero definitions)
- Common kings added to ChessPieceConfig.ts (passive-only, no NorseHero needed)
- Weapon upgrade IDs: 90110-90117
- All default to 'common' rarity in heroRarity.ts (fallthrough)

### Completed (Primordial Expansion — Heroes & Mechanics)

- Added 3 new common-tier heroes with unique mechanics:
  - **Frigg** (Queen/Priest): Oath mechanic — `grant_divine_shield` with `healOnBreak` (heals when shield breaks), passive draws on shield break
  - **Bestla** (Bishop/Shaman): Primordial Frost — freeze + health buff, gains armor when freezing enemies, Bolthorn's Rime weapon
  - **Hermod** (Knight/Rogue): Ride to Hel — `resurrect_to_hand` from graveyard at HP cost, passive reduces cost of resurrected cards
- Added 11 new cards introducing 2 novel mechanics:
  - **Submerge**: Card enters play face-down/untargetable for N turns, surfaces with powerful effect
    - Kraken of Ginnungagap (40100): 8/8 mythic, Submerge 2, surface 8 AOE damage
    - Kraken Spawn (40101): 2/3 rare, Submerge 1, surface +2/+2
    - Depths of the Void (40102): 4-mana epic spell, Submerge friendly +3/+3
    - Ginnungagap's Hunger (40103): 2-mana rare tech counter — 5 damage to Submerged minion
  - **Coil**: Lock enemy minion's attack to 0 while Coil source lives (Deathrattle frees)
    - Lindworm, Wingless Terror (40110): 3/5 epic Dragon, Coil any enemy
    - Young Lindworm (40111): 1/3 common Dragon, Coil enemy ≤2 attack
  - **Bestla tokens**: Odin-Spark (9060), Vili-Spark (9061), Ve-Spark (9062) → merge into 6/6 Aesir Ascendant (9063)
  - **Gjoll Bridge-Keeper** (40115): 3/4 rare Undead, Deathrattle resurrect to hand (Hermod synergy)
- New card data file: `cardRegistry/sets/core/neutrals/primordialExpansionCards.ts`
- Type extensions in NorseTypes.ts: `resurrect_to_hand` effect, `graveyard` target, `on_shield_break`/`on_freeze`/`on_card_play` triggers, `healOnBreak`/`costHealth`/`buffAttack` fields
- Weapon upgrade IDs: 90118-90120
- All heroes registered in index.ts (HERO_ID_TO_CLASS, HERO_ID_TO_CONFIG_KEY) and ChessPieceConfig.ts

### Completed (Common Card Gap-Fill for Starter Decks)

- Added 15 common cards to 4 underserved classes for 10-card spell deck viability
- **Berserker** (+5, IDs 39201-39205): Ulfhednar's Howl (1-mana AoE+draw), Reckless Charge (rush buff), Blood Frenzy (draw+self-damage), Fury Slash (4 dmg removal), Fenrir's Bite (weapon)
- **DeathKnight** (+5, IDs 39206-39210): Frost Strike (conditional dmg), Blood Tap (draw+corpse), Unholy Grasp (drain), Runic Shield (armor+draw), Helheim's Grasp (conditional destroy)
- **Hunter** (+3, IDs 39211-39213): Skadi's Arrow (3 dmg removal), Tracker's Instinct (draw 2), Venomous Trap (Rune/secret)
- **Priest** (+2, IDs 39214-39215): Norn's Counsel (conditional draw 2), Hel's Rebuke (2 AoE + hero heal)
- Post-fill counts: Berserker 21, DeathKnight 21, Hunter 30, Priest 20 common cards
- All classes now have enough common spells for viable 10-card starter decks

### Completed (NFT Rarity Audit & Supply Lock-down)

- Audited all 1,400+ cards for rarity accuracy, targeting ~300 mythic core cards + mythic artifacts/pets/super minions
- Demoted 371 over-classified mythics (362→epic, 9→rare) via `scripts/demoteMythics.mjs` across 32 card data files
- Kept ~312 mythic cards: iconic gods (Odin, Thor, Zeus, Hades), primordial entities, Elder Titans, flagship minions
- Demoted generic creatures, excess deity variants (3+ Fenrir, 5+ Nidhogg, 5+ Surtr), companion animals, tokens
- Updated `PIECE_SUPPLY` in `heroRarity.ts`: mythic 250, epic 500, rare 1,000, common 2,000 (per card)
- Final NFT supply: ~2.7M total (300×250 + 750×500 + 745×1,000 + 912×2,000)
- Base/basic rarity cards (3) excluded from NFT supply — free for all players
- Mythic artifacts and pets match their hero's rarity separately (~900 total mythic cards across all categories)

### Completed (NFT Compliance Audit)

- Fixed broken Yggdrasil Golem IDs: 85001001→85011, 85001002→85012 (typos that would have been rejected by mint)
- Expanded `VALID_CARD_RANGES` in `replayRules.ts` from 11 narrow ranges to 13 broad ranges covering all 2,242 cards
- 962 cards were outside valid mint ranges (would have been rejected by chain replay) — now all covered
- Added explicit `collectible: true` to 47 cards with undefined collectible across 4 files
- Final audit: 2,242/2,242 cards have `id`, `name`, `type`, `rarity`, `collectible` (100% coverage)
- `getCardById()` resolves all 2,242 cards (0 lookup failures)
- 2,082 collectible (mintable NFTs), 160 non-collectible (tokens/generated)
- Full NFT pipeline verified: cardRegistry → getCardById → nftMetadataGenerator → broadcastMint → replayRules → IndexedDB → HiveDataLayer → Game UI

### Completed (NFT End-to-End Wiring)

- Added `refreshHiveDataStoreFromIDB()` in BlockchainSubscriber: re-reads IndexedDB → Zustand after match (XP, levels, cards, ELO)
- Added RUNE token update after ranked matches: +10 win, +3 loss, emits `token:updated` event
- Added NFT ownership enforcement in `heroDeckStore.ts`: `getOwnedCopies()` gates deck building in Hive mode
- Deck validation rejects cards exceeding owned NFT copies in Hive mode
- Wired `tradeStore.ts` `acceptOffer` to broadcast `card_transfer` on Hive (per-card via `hiveSync.transferCard()`)
- Wired `CollectionPage.tsx` dissolve to broadcast `rp_burn` on chain for NFT destruction
- Wired `campaignStore.ts` `claimReward` to broadcast `reward_claim` via `hiveSync.claimReward()`
- Wired `dailyQuestStore.ts` `claimReward` to broadcast `reward_claim` via `hiveSync.claimReward()`
- Added HiveEvents toast notifications in `gameStoreIntegration.ts`: card transfers, token updates, tx confirmed/failed
- Removed stale "BLUEPRINT ONLY" labels from `HiveEvents.ts` and `HiveDataLayer.ts`
- All changes gated behind `isHiveMode()` — zero impact on local/test mode
- TypeScript: 0 errors

### Completed (NFT Provenance Viewer & Direct Transfer)

- Extended `HiveCardAsset` with `lastTransferTrxId`, `mintBlockNum`, `mintTrxId` fields for on-chain provenance
- `replayRules.ts` now captures `trxId` on mint and transfer ops (stored alongside blockNum)
- Added `HIVE_EXPLORER_URL` and `HIVE_BLOCK_EXPLORER_URL` to `hiveConfig.ts`
- Created `explorerLinks.ts`: `getTransactionUrl(trxId)` and `getBlockUrl(blockNum)` utilities
- Created `NFTProvenanceViewer.tsx`: modal showing full NFT metadata (UID, edition, foil, level/XP, rarity, race) + clickable explorer links for mint and transfer transactions
- Created `SendCardModal.tsx`: one-click card gifting with recipient validation, memo field, double-confirm safety, Keychain signing, local store update + event emission
- Added "View on Chain" and "Send to Friend" buttons to CollectionPage card detail modal
- Provenance viewer has "Send to Friend" button that flows directly into the send modal
- TypeScript: 0 errors

### Completed (NFT Pre-Launch Audit & Hardening)

- Full 6-subsystem audit: replay rules, genesis/admin, metadata/provenance, card data, pack/trading/anti-cheat, data layer/events
- Added `lastTransferTrxId`, `mintBlockNum`, `mintTrxId` to `applyRewardClaim` in replayRules.ts (provenance was incomplete for reward cards)
- Added genesis guard to `applyPackOpen` — rejects pack opens before genesis broadcast
- Added genesis guard to `applyMatchResult` — rejects match results before genesis broadcast
- Wired `transactionProcessor.ts` to emit `transaction:confirmed`/`transaction:failed` via HiveEvents (users now see toast on all chain confirmations)
- Added HiveEvents `token:updated` emissions to crafting dissolve (+Eitr) and forge (-Eitr) in CollectionPage
- Added `transaction:confirmed` emissions to campaign reward claims and daily quest reward claims
- Gated Test Mint button behind `user.hiveUsername === RAGNAROK_ACCOUNT` (no longer visible to regular players)
- Added payload validation to all event toast handlers in `gameStoreIntegration.ts` (prevents `undefined` in toast text)
- Removed dead `user:login`/`user:logout` event types from HiveEvents (never emitted anywhere)
- Changed `emitTransactionConfirmed`/`emitTransactionFailed` to accept `Partial<HiveTransaction>` for flexible callers
- TypeScript: 0 errors

### Completed (NFT Stamp Provenance System)

- Implemented self-describing NFT provenance: each card carries its complete ownership history as `ProvenanceStamp[]`
- `ProvenanceStamp` interface: `from`, `to`, `trxId`, `block`, `timestamp` — each stamp links to immutable Hive L1 transaction
- Replay engine populates stamps on all card creation paths: `applyMint`, `applyPackOpen`, `applyRewardClaim`
- `applyCardTransfer` appends stamps on every transfer with previous owner captured
- `NFTProvenanceViewer.tsx` shows full stamp timeline with clickable hivehub.dev explorer links
- Zero API calls needed for ownership verification — card object has everything
- Falls back to legacy `mintTrxId`/`lastTransferTrxId` fields for pre-upgrade cards
- Blueprint document: `docs/HIVE_NFT_STAMPS_BLUEPRINT.md`

### Completed (Stamp Anti-Spam & Optimization)

- Stamp compaction: `CompactedProvenance` summary when chain exceeds 50 stamps (~6KB max per card forever)
  - `totalTransfers`, `firstMint` (preserved forever), `compactedAt`, `compactedCount`
  - Older stamps trimmed from local storage; full history remains on-chain immutably
- Transfer cooldown: 10-block (~30s) minimum between transfers of same card (kills ping-pong spam)
- Batch transfers: `applyCardTransfer` accepts `cards[]` array for multi-card single-op transfers
  - `hiveSync.transferCards(uids[], recipient)` — one Keychain signature for multiple cards
  - Hive `custom_json` supports 4KB per op (~50 cards per batch)
- `NFTProvenanceViewer` shows compacted summary with total transfer count + original mint link
- Hive RC (resource credits) acts as natural Layer 3 rate limiting — spam costs real HIVE POWER
- TypeScript: 0 errors

### Completed (Click-to-Play UX)

- Replaced drag-and-drop as primary card play method with single-click
- Normal minions: click in hand → plays immediately at end of battlefield
- Positional minions (magnetic, cleave, buff_adjacent): click card → glowing insertion gaps appear between minions → click gap to place
- Position picker only shown when 2+ minions on board (otherwise position is obvious)
- Escape key or turn end cancels position selection
- Drag-and-drop still works as secondary input method
- Cursor changed from `grab` to `pointer` on playable cards
- New utility: `positionUtils.ts` — `needsPositionChoice(card)` detects positional cards
- SimpleBattlefield: `showPositionPicker` + `onPositionSelect` props for clickable insertion gaps
- GameBoard: `pendingPositionalCard` state manages two-step positional flow
- Battlecry targeting, spells, and other existing flows unchanged

### Completed (GSAP Battlecry/Deathrattle VFX)

- Replaced all battlecry/deathrattle toast popup notifications with GSAP-powered visual animations
- New `BattlecryVFX.ts` engine (380+ lines): timeline-based VFX for 10+ effect types
  - `playAoeDamageVFX()` — shockwave ring + staggered damage numbers + screen shake
  - `playTargetedDamageVFX()` — projectile orb source→target + impact burst
  - `playHealVFX()` — green aura pulse + nature particles + floating +number
  - `playBuffVFX()` — golden aura + floating stat label
  - `playSummonVFX()` — portal rift → ground slam with dust + crack lines
  - `playDrawVFX()` — cards fly from deck with arc
  - `playFreezeVFX()` — ice crystals converge on target
  - `playDivineShieldVFX()` — golden bubble materializes
  - `playMinionEntryVFX()` — ground slam + shockwave (scales with rarity)
  - `playDeathrattleVFX()` — dark vortex + skull rise + shadow particles
- AnimationLayer effects (battlecry, deathrattle, summon, buff) replaced from Framer Motion to GSAP
- GameBoard battlecry/deathrattle toast blocks replaced with `emitBattlecryTriggered()`/`emitDeathrattleTriggered()` event emissions
- NotificationSubscriber: `showBattlecries` and `showDeathrattles` defaults set to `false`
- GSAP installed as npm dependency (`gsap`)
- All VFX render into `#battlecry-vfx-layer` div with auto-cleanup

### Completed (Comprehensive Audit & Popup Purge)

- Fixed array bounds crash in gameUtils.ts:761 (empty battlefield after play)
- Added GSAP `killAllVFX()` cleanup on AnimationLayer unmount + orphan DOM sweep (5s max age)
- New `GameStatusBanner` component: ephemeral in-game banners replace all corner toast popups
  - `showStatus(text, type, duration)` API, Zustand micro-store, auto-dismiss
  - Styled per type: info (blue), error (red), success (green), warning (amber)
- All 48 GameBoard `showNotification()` calls now route through inline banner (no code changes needed per-call)
- Replaced 5 HandFan `toast.error/info` Blood Price calls with `showStatus()`
- Replaced 4 SimpleGame `alert()` calls with `showStatus()`
- Removed 8 redundant NotificationSubscriber toasts (game start/end, discovery, pet evolution, showdown)
- Battlecry VFX now fires 150ms before card lands (eliminates 400ms animation gap)
- Added visible cancel button during spell/battlecry target selection mode
- Fixed attack deselect: clicking friendly minion while attacker selected deselects first
- Removed duplicate summoning sickness / already-attacked notification handlers
- Added prophecy countdown tracker UI (right sidebar with pulsing turn count pip)
- CSS performance: hero-damage-flash, hero-heal-glow, armor-gain-flash switched from filter animations to transform/opacity-only
- CSS performance: game-over-fade-in no longer animates `backdrop-filter` (static blur, opacity-only)
- CSS performance: victoryTitlePulse switched from text-shadow animation to opacity
- Removed 8 unnecessary `will-change` declarations from combat-animations.css + norse-atmosphere.css (kept ambient elements)
- Replaced 3 remaining `toast` calls in gameStore.ts with inline `showStatus()` banner
- Fixed P2PContext.tsx `P2PActions.playCard` type to include `insertionIndex?: number`

### Completed (New Player Starter Experience & Combat Polish)

- New player first-login ceremony: welcome screen → "Claim Your Birthright" → pack-opening animation → 45 class-matched base cards + 4 auto-built starter decks → "Play Your First Game" button
- `starterSet.ts`: 45 class-matched base cards (10 per hero class + 5 neutrals), `baseCards.ts` has 135 base edition cards total (IDs 100-234)
- `starterStore.ts`: Zustand + persist tracks whether starter pack claimed (`ragnarok-starter-claimed` localStorage key)
- `StarterPackCeremony.tsx`: two-phase flow (welcome → pack opening), reuses `PackOpeningAnimation`, adds cards to HiveDataStore
- HomePage: "Start Game" button for new players (triggers ceremony), switches to "Play Game" after claiming, "Dev Test" button always visible
- Fixed card playability glow: minion cards no longer glow green when battlefield is full (5 max)
- Fixed damage popup positioning: `data-hero-role` attributes + multi-selector fallback chain for hero element lookup
- Fixed battlefield card hover popup clipping: CSS `:has(.bf-card-wrapper:hover)` promotes parent z-index to escape stacking context
- Fixed keyword icon overlap with ATK/HP stat badges (z-index 30 on stats, above icon z-index 20)
- HP bar readability overhaul: 22px height, 0.9rem text with 6-layer text-shadow, glass highlight, removed distracting animations
- Game log moved from bottom-left to right side of screen (mirrored panel, toggle, badge, and animation direction)
- TypeScript: 0 errors

### Completed (Multisig Treasury System)

- **Blueprint**: `docs/HIVE_BLOCKCHAIN_BLUEPRINT.md` §17-18 (adapted from [HivePoA](https://github.com/Dhenz14/HivePoA))
- **Genesis multisig**: `genesisAdmin.ts` — `buildUnsignedGenesisTx()`, `buildUnsignedSealTx()`, `buildAuthorityBrickTx()`, `GENESIS_SIGNERS` array, `requireGenesisSigner()` guard
- **Treasury coordinator**: `server/services/treasuryCoordinator.ts` — signer join/leave, transfer submission, multi-step signing flow, authority sync, freeze/unfreeze/veto, WoT vouching, audit logging
- **Anomaly detection**: `server/services/treasuryAnomalyDetector.ts` — burst (>5 tx/10min), amount spike (>3x avg), rapid succession, new recipient checks, auto-freeze after 3 anomalies/hour
- **Hive L1 utilities**: `server/services/treasuryHive.ts` — authority management, threshold computation, witness rank lookup, balance queries, unsigned tx building, broadcast
- **Treasury routes**: `server/routes/treasuryRoutes.ts` — 13 REST endpoints with Hive signature auth middleware (`X-Hive-Username` + `X-Hive-Signature` + `X-Hive-Timestamp`)
- **Treasury UI**: `client/src/game/components/treasury/TreasuryPage.tsx` — Norse-themed page with signer ring SVG, transactions list, join/leave, WoT vouching, emergency controls, pending signing
- **Shared types**: `shared/treasuryTypes.ts` — `SigningRequest`, `TreasuryStatus`, `TreasurySignerInfo`, `TreasuryTransaction`, `VouchCandidate`, all constants
- **DB schema**: `shared/schema.ts` — 5 Drizzle tables: `treasurySigners`, `treasuryVouches`, `treasuryTransactions`, `treasuryAuditLog`, `treasuryFreezeState`
- **Config**: `hiveConfig.ts` — `RAGNAROK_GENESIS_ACCOUNT`, `RAGNAROK_TREASURY_ACCOUNT`
- **Dual quorum**: 60% for transfers, 80% for authority updates
- **WoT vouching**: Top-150 witnesses join directly; non-witnesses need 3+ vouches from existing signers
- **Self-healing**: 10-minute authority sync checks, auto-removes deranked witnesses
- **Route**: `/treasury` added to client routes + App.tsx lazy import
- TypeScript: 0 errors

### Completed (Card Art Integration — Part 1)

- Imported 479 card art files from external art pack (531 total, 17 king art skipped per policy, 13 duplicates skipped, 1 concept skipped)
- Art covers: 314 pets (50000-50615), 118 artifacts/armor (29800-29967), 36 Norse/Greek deity minion cards, 8 tokens (9200-9207), 3 misc
- New `CARD_ID_TO_ART` map (479 entries) in `artMapping.ts` — ID-based lookup takes highest priority
- `getCardArtPath(name, cardId?)` now accepts optional card ID parameter — checks ID map first, falls back to name-based lookup
- All callers updated: SimpleCard, HeroDeckBuilder, nftMetadataGenerator, replayRules
- Deleted `client/public/models/` (127MB unused .glb 3D models) and `client/public/geometries/` (unused .gltf)
- Removed `.glb`/`.gltf` from service worker cache extensions and asset manifest generator
- Total art files: 560 → 1,039; Asset manifest: 650 files/220.6MB → 1,129 files/255.6MB
- Art coverage: ~16% → ~38% of cards now have dedicated art (was 356, now 835 cards with art)
- TypeScript: 0 errors

### Completed (Self-Describing NFTs)

- Every NFT now carries its complete on-chain locator — no external indexer (HAF) needed
- `ProvenanceStamp` extended with `txUrl`, `blockUrl`, `signer` fields (explorer links baked at creation)
- New `OfficialMint` interface: signer, trxId, blockNum, timestamp, txUrl, blockUrl — proves card was minted by authorized account
- `buildStampWithUrls()` and `buildOfficialMint()` helpers in `explorerLinks.ts` — all stamp/mint creation uses these
- `replayRules.ts`: all 4 card creation paths (applyMint, applyPackOpen, applyRewardClaim, transferSingleCard) now use `buildStampWithUrls` + `buildOfficialMint`
- `HiveCardAsset` extended with `artPath` (relative path for local resolution) and `officialMint` (proof of official mint)
- `NFTMetadata` type extended with `artPath` and `provenance` fields
- `nftMetadataGenerator.ts`: accepts optional `MintProvenance` parameter, populates `artPath` and `provenance` with explorer URLs
- `NFTProvenanceViewer.tsx`: displays `officialMint` section (green badge with signer + explorer links), uses stored stamp URLs with fallback, shows signer when it differs from `from`
- `CompactedSummary` uses stored `txUrl` from firstMint stamp with fallback
- Zero API calls needed for ownership verification — card object has everything
- TypeScript: 0 errors

### Completed (Hero Art Fix & Collection Art Wiring)

- Fixed hero art not showing in deck builder after old portraits were sidelined
- Root cause: `HERO_TO_CHARACTER` had heroes commented out ("have dedicated portraits"), but portrait files were moved to `art/old-portraits/` and `portrait:` fields removed from ChessPieceConfig
- Three-category fix:
  - **Category A (~45 Norse gods)**: Art works via `CHARACTER_ART_IDS` — no changes needed (Odin, Thor, Freya, Loki, etc.)
  - **Category B (20 Greek/misc heroes)**: Restored `portrait: '/portraits/heroes/{name}.png'` in ChessPieceConfig + moved files back from `art/old-portraits/`
  - **Category C (~15 base/common heroes)**: No art exists — show placeholder icon (expected)
- Moved 20 portrait files: `art/old-portraits/{name}.png` → `portraits/heroes/{name}.png` (aphrodite, apollo, ares, athena, brakki, chronos, hades, hephaestus, hera, hestia, hyperion, kvasir, logi, magni, myrka, nyx, persephone, poseidon, ran, zeus)
- 17 superseded portraits archived in `art/old-portraits/` (baldur, eir, freya, heimdall, loki, odin, thor, tyr, etc.)
- Re-added `hero-aegir` → `'aegir'` mapping in `HERO_TO_CHARACTER` (has CHARACTER_ART_IDS entry)
- Wired real card art into `CollectionCard.tsx`: `getCardArtPath()` renders actual art with name/stats overlay, falls back to `CardRenderer` holographic when no art
- Three-tier minion art lookup confirmed working: `CARD_ID_TO_ART` (484 IDs) → `VERCEL_CARD_ART` (331 names) → `MINION_CARD_TO_ART` (86 creature maps) via `getCardArtPath(name, id)`
- TypeScript: 0 errors

### Completed (Battle Screen UX Overhaul)

- **AI Art UI Layers**: Wired 8 AI-generated art assets to game UI via `ragnarok-art-ui.css`
  - Background, card frame, hero frame, battlefield divider, board frame, action buttons, mana tray, HP bar
  - All use `mix-blend-mode: overlay` at low opacity for subtle layering
- **Auto-Attack with Toggle**: Hero mode (go face) and Minion mode (attack lowest HP first)
  - Taunt overrides both modes (must attack lowest HP taunt)
  - Lowest-attack minions attack first to save big hitters
  - Toggle UI in `end-turn-button.css` with `.auto-attack-group` component
- **Click-Only Card Play**: Removed drag-and-drop entirely from SimpleBattlefield + GameBoard
  - Positional minions (magnetic, cleave, adjacent) placed at random index
  - `CardWithDrag` simplified to click-only wrapper
- **Battlecry Targeting Highlights**: Darken non-targetable side, highlight targetable side
  - `.targeting-friendly`, `.targeting-enemy`, `.targeting-any` CSS classes on SimpleBattlefield
- **LoadingScreen HMR Fix**: Rewrote as class component (immune to Vite HMR hook dispatcher null bug)
- **Damage Popup Fix**: Moved `data-hero-role` attributes to tight hero wrapper divs

### Completed (Hero Art Pipeline Fix — HERO_ART_OVERRIDE)

- Root cause: `HERO_TO_CHARACTER` had key mismatches (`'hero-bjorn'` vs `'hero-bjorn-ironside'`), 27 heroes missing, and old portrait PNGs overriding new art
- Created `HERO_ART_OVERRIDE` map (89 entries) — direct heroId → art file ID lookup, highest priority
- 35 heroes use new AI-generated art from `ragnarok-art-export.json` (Odin, Thor, Zeus, Athena, all major gods)
- 54 heroes use best-match local character art as proxies
- Changed `resolveHeroPortrait()` priority: HERO_ART_OVERRIDE > CHARACTER_ART_IDS > portrait PNG
- 89/89 heroes now have art, all files verified on disk
- Removed all CDN references — art is 100% local, bundled with game (no external dependencies)
- TypeScript: 0 errors

### Completed (Procedural Pet Sound Effects)

- 38 unique procedural audio signatures for pet families using Web Audio API
- Each family has biologically-appropriate synthesis (wolves howl, snakes hiss, bears roar, eagles screech, etc.)
- `proceduralAudio.playPetSound(family)` public method + `petSoundHandlers` lookup table + `petGenericBeast()` fallback
- AudioSubscriber plays pet family sound on CARD_PLAYED (if card has petFamily) and PET_EVOLVED events
- Zero sound files — all synthesized in real-time via oscillators, noise buffers, filters, LFOs, waveshapers

### Completed (Hero Art Override Priority Fix)

- Fixed 20 heroes showing old art instead of new AI art (Zeus, Hades, Athena, etc.)
- Root cause: `ChessPieceConfig.ts` had hardcoded `portrait: '/portraits/heroes/X.png'` that bypassed `HERO_ART_OVERRIDE`
- Removed 20 hero portrait fields from ChessPieceConfig (heroes now resolve through override system)
- Fixed `useHeroArt` hook priority: delegates to `resolveHeroPortrait()` (override > explicit portrait)
- Kings are OFF LIMITS — all 14 king portraits remain hardcoded in ChessPieceConfig + KingPassivePopup
- Emptied `KING_TO_CHARACTER` map so kings bypass AI art override system entirely

### Completed (Art Audit & Cleanup)

- Removed Artwork (406) tab from HeroDeckBuilder (was showing unused art stockpile)
- Fixed 7 wrong hero art assignments: Hera/Eros/Hestia had weapon art, Fujin/Shu shared wrong character, Brynhild had pet art, Tsukuyomi had female art
- Swapped Mani → Borr's art (masculine), gave Mani's old art → Hestia
- Consolidated old-portraits/ (17 files) + portraits/heroes/ (20 files) into `art/unused/`
- 82 hero art overrides verified clean (no weapons, no pets, no missing files)
- Art stockpile: 804 unused .webp files + 37 unused PNGs in `art/unused/`
- 48 art files listed in export JSON but not on disk (need re-generation)
- Heroes still needing god art: Hera, Eros, Fujin, Shu, Brynhild, Tsukuyomi

### Completed (Pokemon-151 Holographic Overhaul)

- Replaced 3 inconsistent holo systems (~740 lines) with unified Pokemon-cards-151 style
- New shared hook: `useHoloTracking.ts` — sets 9 CSS variables (`--pointer-x/y`, `--rotate-x/y`, `--bg-x/y`, `--pointer-from-center/left/top`) + toggles `.holo-active` class
- New unified CSS: `holoEffect.css` — sunpillar rainbow gradients (6 HSL colors), 2 layers (`.holo-shine` + `.holo-glare`) down from 4-5
- Rarity tiers: common/basic (none), rare (overlay blend, 0.35 opacity), epic (color-dodge + scanlines, 0.45), mythic (color-dodge + cross-hatch + gloss, 0.55)
- 7 element variant classes override sunpillar colors (fire, ice, electric, shadow, light, water, grass)
- Applied uniformly: SimpleCard, ArmySelection, HeroDeckBuilder (interactive holo for first time), HeroDetailPopup, SimpleHolographicCard
- Deck builder CardDetailFlip popup: replaced broken texture PNGs + deleted keyframes with sunpillar gradient shimmer animation
- Deleted: ~470 lines from SimpleCard.css, ~220 lines from ArmySelectionNorse.css, ~50 lines from deckbuilder.css
- Pure CSS gradients (no texture HTTP requests), `contain: strict` + `will-change` for GPU compositing
- `@media (prefers-reduced-motion: reduce)` hides all effects

### Completed (Pet Stage Indicators)

- Added roman numeral badges to all pet cards (top-right corner) in SimpleCard
- Stage 1 (`petStage === 'basic'`): **I** — bronze metallic gradient
- Stage 2 (`petStage === 'adept'`): **II** — platinum/silver metallic gradient
- Stage 3 (`petStage === 'master'`): **III** — glossy gold gradient with glow
- Badge auto-shifts down when element badge is present (no overlap)
- Scales proportionally on small card sizes

### Completed (Combat UX & Production Build Fix)

- **Poker UI overhaul**: Renamed "Pot" → "Risk" throughout display text and CSS (internal code keeps `combatState.pot`)
- **RiskDisplay**: Simplified PotDisplay from 3-section layout to compact single "RISK" center badge
- **Hero risk chips**: PokerStars-style HP commitment shown as chip badges on hero portraits
- **Dealer button**: Gold Norse coin SVG on the small blind player each round
- **Hourglass timer**: Replaced plain number timer with animated SVG hourglass (sand physics, glass shine, low-time/critical states)
- **Auto-attack moved**: Button now inside `.action-buttons-group` next to Brace (was floating separately)
- **Removed turn counter** badge from GameHUD
- **Removed summoning sick dotted outline** from SimpleBattlefield.css
- **Game limits reduced**: Hand size 7→6, battlefield size 5→4 via `gameConstants.ts`
  - Fixed 3 local `MAX_HAND_SIZE = 7` overrides (drawUtils.ts, gameStore.ts, deckUtils.ts)
  - Fixed hardcoded battlefield checks in spellUtils, comboUtils, artifactTriggerProcessor, gameUtils
- **Realm background art**: 7 realm board skins use actual art images from `art/realms/` (asgard, niflheim, muspelheim, helheim, jotunheim, alfheim, vanaheim)
- **Behemoth card** (ID 31923): 0-mana 9/14 mythic Beast with Taunt, requires sacrificing 2 non-summoning-sick friendly minions to play. Battlecry: destroy all other minions (+2/+2 per kill), opponent discards highest cost card. Art: `art/behemoth.webp`
- **Production build circular dependency fix**: Broke 3 circular chunk chains that caused `Cannot access 'Er' before initialization` TDZ error on GitHub Pages
  - `blockchain ↔ campaign`: Converted `campaignStore.ts` hiveSync/hiveEvents to dynamic `import()`
  - `blockchain ↔ game-engine`: Removed static `useHiveDataStore` import from gameUtils.ts, replaced with `globalThis.__ragnarokHiveDataStore` lazy access
  - `blockchain ↔ card-data`: Assigned `allCards.ts` to explicit `card-data` chunk (was floating, Rollup placed it in blockchain)
  - Added `hive-data` chunk for shared data layer files (`HiveSync`, `HiveEvents`, `HiveDataLayer`, `schemas/`)
  - Deferred `transactionQueueStore` auto-cleanup from immediate to `setTimeout(0)`
- TypeScript: 0 errors

### Completed (Card Art Batch 2 + God-Minion Rename)

- Imported 317 new card art files (webp) from external art pack, mapped 307 new entries to `CARD_ID_TO_ART`
- Total art files on disk: 1,358; total `CARD_ID_TO_ART` entries: ~783 (8 removed for god-minions)
- Renamed 23 god-minion cards that shared names with playable heroes (e.g., "Odin, Allfather" → "Echo of the Allfather")
- Pattern: Norse/Greek gods use "Echo of [Title]" naming; demigods/heroes use generic titles (e.g., "Gorgon Slayer", "Immortal Warrior")
- Removed 8 hero-art mappings from god-minion cards (IDs 20001-20004, 20020, 20106, 20116, 28002) — hero art reserved for playable heroes only
- Renamed tokens: "Aegir's Hand" → "Tidal Hand" (90202), "Spirit of Vidar" → "Undying Spirit" (32077)
- TypeScript: 0 errors

### Completed (Authentic 90s Holographic Foil)

- Replaced 10-variant Pokemon-cards-css port (1,292 lines) with physics-accurate 4-tier foil system (~300 lines)
- 3 holo layers: `.holo-foil` (rainbow diffraction), `.holo-glitter` (tiled PNG sparkle), `.holo-glare` (specular highlight)
- `color-dodge` mix-blend on foil layer — only brightens bright art areas, dark areas stay readable
- Luminosity mask (`::after`) with `brightness(0.55) contrast(3.5)` restricts rainbow to tight cursor area
- Art-window `mask-image` — foil/glitter restricted to art rectangle only (border + text stay clean)
- Dynamic brightness: `calc((var(--pointer-from-center) * 0.3) + 0.4)` — brighter at center, dimmer at edges
- Parallax `::before` second rainbow at -47deg (epic+) — shifts at 1.5x rate for dimensional depth
- 256x256 glitter PNG texture (tiled `soft-light` blend) replaces SVG feTurbulence — more convincing sparkle
- Epic: scanline groove pattern overlay. Mythic: crosshatch diamond grid (secret rare embossing)
- Mythic glare `::after` screen-blend halo for metallic sheen
- Mythic art parallax: card art shifts 3px based on tilt via CSS `transform`
- Idle shimmer via CSS `@property --holo-idle-x/y` — cards glint without interaction (rare 0.1, epic 0.15, mythic 0.22 opacity)
- `getHoloVariant()` → `getHoloTier()`: returns `null | 'holo-rare' | 'holo-epic' | 'holo-mythic'`
- `stage3-evolved` override: max intensity (foil 0.8, glitter 0.45, glare 0.55)
- 7 element themes preserved (fire, ice, electric, shadow, light, water, grass) — override `--foil-*` palette
- Applied to SimpleCard, ArmySelection, HeroDeckBuilder (all now use `holo-foil` + `holo-glitter` + `holo-glare`)
- Removed 3 dead `HolographicEffect.css` imports (BattlefieldCardFrame, CardFrame, BaseCardFrame)
- Spring physics unchanged (SPRING_STIFFNESS=0.066, SPRING_DAMPING=0.25)
- `@media (prefers-reduced-motion: reduce)` hides all effects
- TypeScript: 0 errors

### Completed (Card Art Batch 3 + Full Ability Audit)

- Imported 691 new card art files (webp) from `ragnarok-art-691` art drop
- Added 689 new entries to `CARD_ID_TO_ART` (2 duplicates skipped)
- Total art files on disk: 2,054; total `CARD_ID_TO_ART` entries: 1,458
- Art coverage: ~38% → ~75% effective (ID-based 58.5% + name-based ~16.2% = 1,517/2,031 cards)
- 269 orphan art map entries point to non-existent card IDs (stale mappings from art batch)
- 514 cards still missing art, mostly expansions (32000-39999: 192), weapons (90000: 74), core (1000-9999: 77)
- ID ranges covered: 1000-9999 (108), 10000-19999 (82), 20000-29999 (26), 30000-39999 (309), 40000-49999 (22), 60000-69999 (4), 80000-89999 (11), 90000-99999 (129)
- All UI components already pass cardId to `getCardArtPath()` — no component changes needed
- Implemented 24 missing deathrattle handlers (103 cards were silently failing)
- Fixed 3 battlecry bugs: `cast_opponent_spell` stub, hardcoded `MAX_BOARD_SIZE=5`, `executeBuffTribeBattlecry` wrong field
- Implemented 3 missing keywords: Outcast (hand edge bonus), Flying (bypass taunt), Cant Attack (attack prevention)
- TypeScript: 0 errors

### Completed (Architecture Consolidation)

- Removed 4 unused dependencies: wouter, react-use-gesture, react-use, @tanstack/react-query (~180KB bundle savings)
- Deleted dead `queryClient.ts`, removed `QueryClientProvider` from main.tsx
- Removed all DOM manipulation from gameStore.ts: querySelector, createElement, innerHTML, GSAP timeline — replaced with GameEventBus.emit() calls
- gameStore.ts is now a pure state machine (zero DOM, zero GSAP, zero animation timing)
- Extracted 5 hooks from GameBoard.tsx (~2,541 → ~2,370 lines): useCardPositioning, useTargetingArrows, useCardDetailModal, useAttackVisualization, useGameAnimationEffects
- Extracted 5 hooks from RagnarokCombatArena.tsx (~1,650 → ~1,200 lines): useDamageAnimations, usePokerCardClickHandlers, usePokerKeyboardShortcuts, useRealmAnnouncement, useHeroHealthEffects
- Extracted 3 sub-stores from gameStore.ts: mulliganStore, discoveryStore, pokerRewardStore (220 lines moved)
- Made chain indexer optional: gated behind `ENABLE_CHAIN_INDEXER` env var in server/routes.ts
- Added 7 Zustand slice selectors: usePlayerHand, usePlayerBattlefield, useOpponentBattlefield, useGamePhase, useCurrentTurn, usePlayerMana, usePlayerHeroHealth
- Removed P2PContext wrapper from MultiplayerGame.tsx (was unused indirection over Zustand)
- TypeScript: 0 errors

### Completed (NFT SDK Separation)

- Created `INFTBridge` contract interface (26 methods) in `game/nft/INFTBridge.ts`
- Implemented `HiveNFTBridge` (delegates to HiveSync/Events/DataLayer) and `LocalNFTBridge` (chain ops are no-ops)
- Factory with dynamic imports: `initializeNFTBridge()` code-splits HiveNFTBridge vs LocalNFTBridge based on mode
- React hooks: `useNFTUsername`, `useNFTCollection`, `useNFTStats`, `useNFTTokenBalance`, `useIsHiveMode`, `useNFTElo`
- Migrated 18 game files from direct blockchain imports to bridge: heroDeckStore, dailyQuestStore, campaignStore, tournamentStore, tradeStore, gameStoreIntegration, useMatchmaking, FriendsPanel, TradingPage, TournamentListPage, StarterPackCeremony, SendCardModal, CollectionPage, PacksPage, RankedLadderPage, useP2PSync
- Created Zod schemas for all 21 chain op types in `opSchemas.ts`, wired into `replayRules.ts` `applyOp()` dispatch
- Created `ICardDataProvider` interface to break reverse coupling (blockchain → game card data)
- Migrated `replayRules.ts`, `packDerivation.ts`, `nftMetadataGenerator.ts` to use `ICardDataProvider` instead of direct `allCards` imports
- Created shared `config/featureFlags.ts` re-export so `data/` doesn't import from `game/`
- Migrated `transactionProcessor.ts`, `deckVerification.ts` to shared featureFlags path
- Deleted abandoned `game/data/hive/` adapter infrastructure (6 files with incompatible types)
- Removed `export * from './blockchain'` barrel from `data/index.ts`
- Wired `setCardDataProvider()` and `initializeNFTBridge()` at app startup in `App.tsx`
- Updated vite.config.ts: `game/nft/` assigned to `game-types` shared chunk
- TypeScript: 0 errors, build succeeds

### Completed (Card Soul Audit — Phases 1-6)

- **Phase 1: Lore-Inaccurate Mechanics**
  - Helheim realm effect (30304): `return_to_hand_on_death` → `banish_on_death` — skips ALL death effects (deathrattle, reborn, einherjar, chain)
  - Added `'banish_on_death'` to `RealmEffect.type` union in `types.ts`
  - Removed old `return_to_hand_on_death` handler block from `zoneUtils.ts`
  - 4 text renames: Eitri Forge-Breaker, Gjallarhorn, Norn's Demand, Valkyrie's Tithe
- **Phase 2: Soulless Card Renames** (10 cards)
  - Norse payoffs: Geirskögul, Gróa's Vision, Blóðrún, Veðrfölnir's Flight
  - Prophecy: Ragnarok Herald → Heimdall's Warning
  - Einherjar: 5 named saga warriors (Hadding, Hervor, Bödvar Bjarki, Helgi, Sigmund)
  - Vanilla: Svartalfheim Titan → Svartalfheim Construct (race Giant → Automaton)
- **Phase 3: Super Minion Battlecry Fixes** (9 cards)
  - Remapped 9 broken battlecry types to working handlers (were silently failing)
  - Sigyn→give_divine_shield, Hoenir→buff, Aphrodite→mind_control_random, Hera→mind_control_random, Eros→freeze, Solvi→give_divine_shield, Blainn→fill_board, Tsukuyomi→grant_stealth, Sarutahiko→discover
- **Phase 4: Elder Titan Text Rework**
  - Renamed `oldGods.ts` → `elderTitans.ts`, variable `oldGodsCards` → `elderTitanCards`
  - 4 support cards renamed with Gullveig/Völuspá references
  - All 4 titan flavor texts updated with Eddic sources
- **Phase 5: Artifact Renames** (14 cards + 1 field fix)
  - 14 artifacts renamed to mythology-accurate names (Lævateinn, The Aegis, Enyalios, etc.)
  - Master Bolt (29801): `norse_artifact` → `greek_artifact`
- **Phase 6: Artifact Cost Diversity**
  - 35 artifacts re-costed from uniform 5 mana to 4-7 mana range
- TypeScript: 0 errors, production build succeeds

### Completed (Card Soul Audit — Phases 7-9)

- **Phase 7: Pet Evolution Variety**
  - Diversified triggers in 8 families: wolves→`on_destroy`, bears→`on_gain_health`, drakes→`on_apply_burn`, hellhounds→`on_apply_burn`, stormkin→`on_summon`, giants→`on_reduce_attack`, draugr→`on_silence`, dwarven forgemasters→`on_return_to_hand`
  - Stage 3 stat outliers: wolves 10/3 (glass cannon), serpents 3/12 (wall), ents 2/11, stormkin 9/4, draugr 8/6
  - All 38 Stage 3 pets now have unique thematic descriptions (was all "The final form depends on its evolution path")
  - Element fixes: Bifrost electric→light, Einherjar Warriors fire→light
- **Phase 8: Class Identity Renames** (12 cards)
  - Warlock: 5 "Void" cards → Ginnungagap/Hel/Muspel equivalents
  - Hunter: 5 generic animal names → Svartalfheim Stalker, Fenrir's Packleader, Garmr's Kin, Freya's Pride, Skadi's Huntmaster
  - Rogue: 2 generic thief names → Svartalfheim Trader, Loki's Pickpocket
- **Phase 9: Greek Card Gaps**
  - Added 7 Greek mythic/epic minions (IDs 32207-32213): Hydra, Minotaur, Sphinx, Chimera, Scylla, Pegasus, The Furies
  - Race fixes: Typhon + Porphyrion Elemental→Titan, Porphyrion epic→mythic, Medusa added Spirit race
- TypeScript: 0 errors

### Completed (Poker Combat Drama System)

- GSAP-powered VFX engine (`PokerDramaVFX.ts`): card deal slams, betting action animations, showdown damage, Ragnarok cinematic
- Re-raise pressure system: escalating screen shake, bass hit audio, hero slam + opponent recoil, risk badge pulse, edge glow (stacks per re-raise level)
- Community card reveals: suit-colored particle impacts, river slow-mo + screen flash, flop staggered slams
- Betting action VFX: Attack (hero lunge + gold flash), Counter-Attack (pressure shake + time dilation), Engage (center clash spark), Defend (shield tint), Brace (retreat + desaturate)
- Phase banner overhaul: FIRST BLOOD, THE NORNS SPEAK, THE VEIL THINS, RAGNAROK'S EDGE — with phase-specific CSS colors and horizontal slash VFX
- Hand strength indicator: live display of current best poker hand with 4-tier coloring (low/mid/high/godly), pulse on improvement
- Tension-reactive CSS: `data-tension-level` vignette, `data-player-hp-zone` board darkening, momentum/streak glow on hero wrappers
- Win streak announcements: DOMINATION / DEFIANCE / LAST STAND text slams
- Procedural audio: bass hits (re-raise), card slam thump (noise burst + lowpass), steel clash (call action)
- Ragnarok (Royal Flush) cinematic: white-out flash, 3 staggered fire particle bursts, heavy screen shake, 6rem text slam
- Showdown damage: flying damage number from winner to loser, scaled by hand rank gap, crushing wins get screen flash + extra particles
- `@media (prefers-reduced-motion: reduce)` disables all effects
- All VFX non-critical (wrapped in try/catch at wiring points)
- TypeScript: 0 errors

### Completed (Super Minion Battlecry Full Implementation)

- Implemented 67 missing composite battlecry handlers in `battlecryUtils.ts` (~700 lines)
- All 81 super minion battlecries now functional (was: 8 working, 73 silently failing)
- Each handler composes existing primitives (dealDamage, healTarget, destroyCard, createCardInstance, addKeyword, etc.)
- Handler categories: damage variants (13), buff variants (10), destroy variants (8), summon variants (8), stealth (4), freeze (3), bounce (3), copy (2), mind control (1), draw/discover (4), misc (11)
- Every handler is faithful to its card's description text — no design compromises
- Deck draw operations properly wrap CardData with `createCardInstance()` before pushing to hand
- TypeScript: 0 errors

### Completed (Asset Optimization — PNG→WebP + Zip Packs)

- Converted all PNG assets to WebP q95 (visually lossless): kings (32.7→4.9MB), icons (17.3→2.7MB), elements (6.5→0.8MB), board texture, glitter
- Fixed 7 misnamed PNG-as-webp files (art/ and portraits/kings/) — were PNG bytes with .webp extension
- Deleted 18 dead texture files (old holo foils, 3D card textures, unused materials) — 14.6MB freed
- Updated all code references (.png→.webp) across 12 files: KingPassivePopup, ChessPieceConfig, ChessPiece, classAttackIcons, artMapping, ChessBoardEnhanced.css, NorseBackground, holoEffect.css, RagnarokChessGame
- Built zip-based asset download system: `scripts/buildAssetPacks.mjs` splits assets into <80MB zips (GitHub Pages 100MB limit)
- Rewrote `assetCacheStore.ts` to download zip packs → fflate extracts → Cache API stores (4 requests instead of 2,114)
- Added `fflate` (8KB browser unzip) and `archiver` (build-time zip creation) dependencies
- Deploy pipeline: `build:packs` npm script, CI runs before Vite build, packs gitignored
- **Total active assets: 388MB → 256MB (132MB saved, zero quality loss)**
- TypeScript: 0 errors

### Completed (PWA + Performance Optimization)

- **PWA manifest**: `manifest.json` with standalone display, landscape orientation, Norse gold theme — installable as desktop app
- **index.html**: proper meta tags (theme-color, apple-mobile-web-app-capable, viewport-fit), manifest link
- **GameBoard store subscriptions**: hoisted 8 stable action refs to module-level `getState()`, reduced from 13 to 5 reactive subscriptions (30% fewer rerenders)
- **Hand → CardWithDrag callbacks**: replaced per-card `() => fn(card)` closures with stable `onPlay` callback prop — memo no longer broken on every render
- **CardWithDrag inline styles**: moved 10-property inline style object to CSS classes (`.card-with-drag`, `.playable`, `.not-playable`, `.is-hovering`, `.in-hand`) — zero JS style allocation
- **SimpleCard keyword badges**: replaced per-badge `{borderColor, boxShadow}` inline style with single `--badge-color` CSS variable + `color-mix()` for glow
- **will-change purge**: removed from 11 static/interaction-only elements, kept only on 4 ambient particle layers + 3 holo layers — eliminated 50-100MB GPU memory creep over long sessions
- **backdrop-filter removal**: replaced with solid `rgba` backgrounds on 5 hot-path combat elements (game-over overlay, realm indicators) — eliminated 60→30fps drops during transitions
- **P2PContext**: eliminated double-useMemo wrapper (11 deps, always invalidated) — now uses mutable ref, context identity never changes
- TypeScript: 0 errors, 95/95 tests pass, production build clean

### Completed (Protocol v1.0 — 5 Launch Gates)

- **Spec frozen**: `docs/RAGNAROK_PROTOCOL_V1.md` — 14 canonical ops, authority matrix, finality rules
- **Conformance suite**: 37 golden vectors + 38 replay traces (170 total tests)
- **Gate 1**: Shared `protocol-core` module — one replay engine, client + server both call it
- **Gate 2**: Server indexer rewritten to `get_ops_in_block` + LIB cursor (block-complete, crash-safe)
- **Gate 3**: Pack commit-reveal with delayed irreversible entropy + auto-finalize on 200-block deadline
- **Gate 4**: `match_anchor` with pinned pubkeys — post-seal verification uses anchored keys only
- **Gate 5**: Eitr removed from P2P trade offers and scarce card forging until replay-derived
- Real Hive signature verification on server (hive-tx ECDSA recovery, not stubbed)
- Legacy `rp_pack_open` valid pre-seal only; `rp_match_start` aliased to `match_anchor` indefinitely
- Eitr dissolve remains as cosmetic display; forge button hidden; trade Eitr inputs removed

### Completed (100% Art Coverage & Production Polish)

- Card art batch 4: 657 new art files imported, 559 new card mappings
- Visual art scan: manually matched 83 remaining cards from 372 unmapped art files
- Total: 2,459 CARD_ID_TO_ART entries, 0 cards missing art
- Pack opening animation: wired real card art (was emoji placeholders)
- NFT bridge: eagerly initialized LocalNFTBridge (fixed race condition crash)
- Trade store: crash-safe batch transfers, error toasts on all failures
- Renamed `offeredDust`/`requestedDust` → `offeredEitr`/`requestedEitr` (server + client)
- Poker reward store: retry counter moved into Zustand state
- Console cleanup: all stores use `debug.*` instead of `console.*`
- Deleted 5 dead files (4 dev scripts + empty CSS stub)
- God-name rename: 104 minion cards renamed to not pose as gods (heroes locked)
- 17 empty card descriptions filled (vanilla + token cards)
- Deleted browse-available/ duplicate art folder (112MB savings)
- All documentation updated to reflect 2,400+ cards, 5 factions, 100% art

### Completed (Protocol v1.1 — Atomic Transfers, Pack NFTs, DNA Lineage)

- **Design document**: [ATOMIC_NFT_PACKS_DESIGN.md](docs/ATOMIC_NFT_PACKS_DESIGN.md) — 1,500+ line protocol upgrade spec
- **External audit**: NFTLox protocol comparison validated our replay engine, commit-reveal, PoW, dual-sig as "extremely robust"
- **Atomic transfers**: `card_transfer`, `pack_transfer`, `pack_mint` validate companion 0.001 HIVE native transfer in same Hive tx
- **L1 visibility**: Transfers now show on any Hive explorer (PeakD, HiveScan) — no custom indexer needed for provenance
- **Pack NFTs**: Sealed packs are first-class NFTs with deterministic DNA (`sha256(trxId:index:packType)`)
  - `pack_mint`: Admin creates sealed pack NFTs (atomic, 0.001 HIVE to recipient)
  - `pack_transfer`: Trade/gift sealed packs (atomic, 10-block cooldown)
  - `pack_burn`: Burns pack → derives cards from `sha256(dna|burnTrxId|entropyBlockId)` — unpredictable until burn
  - Pack supply tracking (minted/burned/cap per type)
- **DNA lineage (Seed/Instance/Replica)**: Every card carries `originDna` (genotype) + `instanceDna` (phenotype)
  - `card_replicate`: Clone a card — same genotype, new phenotype, generation+1 (max 3 replicas, max 3 generations, 100-block cooldown)
  - `card_merge`: Sacrifice 2 same-origin cards → 1 ascended card (foil:'ascended', level+1, combined XP, generation reset)
  - Replicas inherit `originDna`, get unique `instanceDna` via `sha256(origin|parent|trxId)`
  - Merged cards store `mergedFrom: [uidA, uidB]` for provenance
- **Zod schemas**: All 5 new ops validated at `applyOp()` boundary
- **Protocol constants**: `ATOMIC_TRANSFER_AMOUNT`, `MAX_REPLICAS_PER_CARD`, `MAX_GENERATION`, `REPLICA_COOLDOWN_BLOCKS`, `PACK_SIZES`
- **StateAdapter extended**: `getPack/putPack/deletePack/getPacksByOwner`, `getPackSupply/putPackSupply`, `getCompanionTransfer/setTrxSiblings`
- **HiveSync broadcast**: `mintPack()`, `transferPack()`, `burnPack()`, `replicateCard()`, `mergeCards()`
- **Hive vs ETH analysis**: Zero-fee continuous mutation, NFT-owns-NFT composability, DNA as decentralized access key
- 192/192 tests pass, 0 TypeScript errors, backward compatible (v1.0 ops unchanged)

### Completed (v1.1 Protocol Hardening + UI)

- 22 conformance tests for all 7 v1.1 ops (pack_mint, pack_distribute, pack_transfer, pack_burn, card_replicate, card_merge + normalization)
- IndexedDB v7: `packs` + `pack_supply` stores (persisted, not in-memory)
- Replay engine: sibling op caching for companion transfer validation during chain replay
- Normalize.ts: 6 new actions in canonical set + `rp_*` legacy mappings
- clientStateAdapter: pack ops backed by IndexedDB (was in-memory Maps)
- INFTBridge: `getPackCollection()`, `addPack()`, `removePack()`, `transferPack()`, `burnPack()`, `replicateCard()`, `mergeCards()`
- HiveDataLayer: `packCollection[]` in Zustand state (persisted, hydrated, cleared on logout)
- PacksPage: "Your Sealed Packs" section with Open/Send actions per pack type
- CollectionPage: "Genetic Heritage" panel (generation, replicas, DNA hashes), Replicate + Merge buttons
- SendPackModal: inline modal with recipient input + atomic 0.001 HIVE transfer

### Completed (Gameplay Expansion — Heroes, Wager, Stealth, Mechanics)

- **Gefjon, Fortune's Edge**: Reworked from "Goddess of Plowing" → gambling/luck hero
  - Hero Power: "Roll the Dice" (2 mana) — deal 1-6 random damage to random enemy
  - Upgraded: "Fortune's Favor" — roll twice, keep higher (player's design)
  - Passive: roll a 6 → draw a card
- **Verdandi, Norn of the Present**: Combo archetype hero (Priest/Bishop)
  - "Fate Strand" hero power: adds free 0-cost damage spell to hand
  - Passive: draw after playing 3+ cards per turn
- **Vali, Son of Vengeance**: Escalating archetype hero (Berserker/Knight)
  - "Blood Debt" hero power: damage increases +1 per use across the game
  - Passive: hero power costs (1) less after taking minion damage
- **Rogue stealth expansion**: 8 new cards (IDs 39005-39012) — Mist-Walker, Svartalfheim Shade, Daggers of Niflheim, Ambush Predator, Veil of Hel, Shadow Ambusher, Hel's Unseen, Nótt's Cloak
- **Wager keyword**: 16 new minion cards (IDs 31924-31939) — poker combat passives while on battlefield
  - Bridges card game + poker systems (game's USP)
  - Cards across 8 classes: Bluff Master (hide actions), Fate Reader (peek cards), Loki's Loaded Dice (hand rank +1), Odin's All-Seeing Stake (see hole cards), Surtr's Final Bet (double showdown stakes)
- **Submerge expansion**: 6 new cards (IDs 40104-40109) — Diving Serpent, Deep Lurker, Abyssal Guardian, Ginnungagap Diver, Tidal Ambusher, Emerge from Depths
- **Coil expansion**: 6 new cards (IDs 40112-40118) — Binding Serpent, Jormungandr's Grip, Constrictor Wyrm, Nidhogg's Chains, Serpent Pit, Freedom Strike
- **Inspire expansion**: 6 new cards (IDs 31414-31419) — Valkyrie Herald, Odin's Chronicler, Runic Amplifier, Einherjar Standard-Bearer, Seidr Resonator, Allfather's Chosen
- Art mapped for all 8 stealth cards from orphaned art pool
- Type extensions: `wagerEffect` on MinionCardData, `generate_fate_strand`/`escalating_damage` effectTypes, `on_cards_played_3`/`on_take_minion_damage` triggers
- 192/192 tests pass, 0 TypeScript errors

### Completed (Static Page & Production Hardening)

- Fixed TDZ crash on GitHub Pages: `PACK_ENTROPY_DELAY_BLOCKS` constant moved from chunk-split file to `protocol-core/types.ts`
- Global `unhandledrejection` handler catches async crashes outside React error boundaries
- Service worker auto-update: checks every 30 min, auto-reloads on new version (prevents stale cached builds)
- Full production audit: 0 `console.log` in client, 0 `alert()`, 0 hardcoded `localhost`, 0 TODO/FIXME
- Collection/Packs pages have proper fallbacks for static hosting (no backend): `loadLocalCollection()`, `FALLBACK_PACKS`, `openPackLocally()`
- All 12 routes lazy-loaded with Suspense, heavy libs (GSAP, Pixi, Framer Motion) in separate chunks
- Card data deferred to `useEffect` (not on critical render path)
- Error boundary wraps entire app, all lazy routes have Suspense fallbacks
- PWA manifest with icons verified on disk (192x192, 512x512)

### Completed (Protocol Security Hardening)

- **Winner injection blocked**: `applyMatchResult` rejects winner not in {p1, p2} — prevents third-party account injection
- **Card merge DNA validation**: `applyCardMerge` requires both cards share same `originDna` — prevents cross-lineage exploit
- **Per-card supply cap fixed**: `applyMintBatch` was using rarity-level cap for per-card check; now uses correct caps (2000/1000/500/250)
- **Full SHA-256 compact hash**: Was `.slice(0,16)` (64-bit, birthday attack at ~4B); now full 64 hex chars in both `apply.ts` and `matchResultPackager.ts`
- **Pack entropy delay 3→20 blocks**: `PACK_ENTROPY_DELAY_BLOCKS` increased from 3 (~9s) to 20 (~60s) to prevent block producer manipulation
- **Magic numbers replaced**: Hardcoded `+3` and `+200` in apply.ts now use `PACK_ENTROPY_DELAY_BLOCKS` and `PACK_REVEAL_DEADLINE_BLOCKS` constants
- **Match type detection**: `BlockchainSubscriber.ts` derives matchType from P2P state + Hive username check (was hardcoded `'ranked'`)
- **Dual-sig enforcement**: Ranked matches without counterparty signature are NOT broadcast (was sending with empty sig that protocol rejects, wasting transactions)
- **P2P cross-verification wired**: `deck_verify` auto-sent on P2P connection open — both clients exchange NFT collection IDs for on-chain cross-verification via IndexedDB + server fallback
- **Server deck verify multi-copy fix**: `/verify-deck` endpoint now counts copies (was boolean existence check via `Set.has`)

### Completed (TCG Rarity Rebalance & Supply Recalibration)

- **Rarity pyramid fixed** to match Pokemon/MTG industry standards (was flat, now proper cascade)
- **Mythic**: 290 → 160 cards (12.7% → 7.0%) — demoted 68 artifacts, 28 pets, 34 generic minions to epic
- **Epic**: 630 → 410 cards (27.7% → 18.0%) — demoted 350 generic/simple cards to rare
- **Rare**: 604 → 640 cards (26.5% → 28.1%) — gained from epic demotions, demoted 314 simple cards to common
- **Common**: 614 → 928 cards (27.0% → 40.8%) — now properly the largest tier for new player accessibility
- **Supply caps recalibrated**: mythic 500→250, epic 750→500, rare 1,250→1,000, common 1,800→2,000
- **Total NFT supply**: ~2.74M (was incorrectly reported as ~3.3M due to inflated rarity counts)
- Fixed 48 class casing inconsistencies (`priest` → `Priest`, etc.) across card data files
- Fixed 3 duplicate card IDs (40112/40114/40116 → 40200-40202, tokens vs Coil expansion)
- Fixed `import type` TDZ crash in `neutrals/index.ts` (production build circular dependency)
- Updated supply caps in: `heroRarity.ts`, `apply.ts`, `genesisAdmin.ts`, 2 test files, 7 doc files, CLAUDE.md
- 794 rarity changes across 90 card data files, 0 duplicate IDs, production build clean

### Completed (Protocol v1.2 — NFTLox Integration & Marketplace)

- Extracted 8 production patterns from NFTLox SDK/Playground protocol audit
- BuildResult<T> structured broadcast errors (all validation errors at once, typed codes)
- Operation size estimation + auto-batch splitting (8KB limit enforcement, wired into broadcastCustomJson)
- Input sanitization (HTML entity + control char stripping) wired into every broadcast
- Deterministic UID generation (FNV-1a) with fallback in applyMintBatch for anti-duplication
- Structured transfer memos (`ragnarok:action:uid:cardId:edition:dna`) wired into transferCard
- Mint session crash recovery (localStorage persistence, AdminPanel resume flow)
- HafSQL as tier-6 fallback indexer in indexSync.ts (zero infrastructure, queries public API)
- On-chain marketplace: 6 new ops (market_list, market_unlist, market_buy, market_offer, market_accept, market_reject)
- Marketplace IndexedDB v8: market_listings + market_offers stores with seller/nft/buyer indexes
- 6 applyOp handlers with ownership verification, payment cross-reference, auto-reject pending offers
- MarketplacePage.tsx: 3-tab UI (Browse/My Listings/My Offers) with list/offer modals at `/marketplace`
- HiveSync: 6 new marketplace broadcast methods
- Card visual overhaul: 50+ SVG keyword icons (CardIconsSVG.tsx), SVG stat emblems (hexagonal ATK, shield HP, crystal mana)
- Rarity gem indicator (rare=blue, epic=purple, mythic=gold with pulse animation)
- Name banner upgraded to dimensional ribbon with scroll ornaments
- Race/tribe line visible on card face
- Design document: [PROTOCOL_V1_2_DESIGN.md](docs/PROTOCOL_V1_2_DESIGN.md)
- 192/192 conformance tests passing, 0 TypeScript errors

### Completed (DUAT Airdrop System)

- Frozen DUAT snapshot: 3,511 eligible holders from live API (SHA-256 verified, bundled at `client/public/data/duat-snapshot.json`)
- Log-linear distribution formula: `packs = floor(min(500, 1 + log2(balance) × 5.347))` — calibrated via binary search
- 164,460 standard packs (822,300 cards = exactly 30.00% of 2,741,000 supply)
- Every holder gets 1-125 packs (avg 47, median 47, no zero-pack holders)
- 2 new protocol ops: `duat_airdrop_claim` (posting key, validates formula + window) and `duat_airdrop_finalize` (admin, sweeps unclaimed to treasury)
- IndexedDB v9: `duat_claims` store for tracking claimed accounts
- `DuatClaimPopup.tsx`: gold-themed overlay on login, shows DUAT balance + pack count, one-click Keychain claim
- `duatClaimStore.ts`: Zustand + persist, loads snapshot, checks account, manages claim flow
- `HiveSync.claimDuatAirdrop()` broadcast method
- 90-day claim window — unclaimed packs absorbed by treasury for pack sales (~50-70% expected unclaimed)
- `scripts/freezeDuatSnapshot.mjs`: fetch → filter → sort → hash → save
- `scripts/calibrateDuatAirdrop.mjs`: binary search calibration against live data
- `scripts/testDuatClaim.mjs`: 26-test validation suite (all passing)
- Design document: [DUAT_AIRDROP_DESIGN.md](docs/DUAT_AIRDROP_DESIGN.md)

### Completed (Campaign Story Mode)

- Per-mission narrative intro phase: immersive fullscreen overlay before chess (realm icon, title, narrative, boss rules)
- Chapter cinematic upgrade: "In the age before ages..." prelude, letterbox bars, ambient particles, scene counter
- Realm-colored mission intros (15 realm palettes with matching text + glow colors)
- Campaign page lore blurbs (chapter name + opening narrative when no realm selected)
- Fixed 5 infinite re-render loops in boss rule effects (React #185: merged per-turn effects with turn-tracking ref)
- 49 missions across 5 chapters audited: all hero IDs, card IDs, king IDs, AI profiles verified

### Completed (P2P Multiplayer Hardening)

- STUN/TURN ICE servers: 7 STUN (Google ×5, stunprotocol, Nextcloud) + TURN relay (metered.ca free tier)
- Cross-continent NAT traversal: ~85% success rate globally (was ~10% without TURN)
- Connection timeout: 10s → 25s per attempt, 2 retries with 3s backoff
- Exponential backoff reconnection: 3 attempts at 2s → 5s → 10s delays (92s total budget)
- 15-second grace period (Madden-style): opponent drops → game pauses with countdown → resumes if they return
- Heartbeat keepalive: 5s ping interval, 12s silence threshold triggers grace period
- Message buffer: 50-message queue during disconnect, flushed in order on reconnect (no lost actions)
- P2PStatusBadge upgraded: connected (green), reconnecting (amber + countdown), grace period (orange), error (red)
- Semi-transparent reconnecting overlay with countdown timer + "Game state preserved" message
- Anti-exploit: symmetric grace, FIFO buffer replay, host remains authoritative

### Next (Genesis Launch)

- Admin panel built: `/admin` → Genesis Command Center (step-by-step ceremony UI with checklist)
- Create @ragnarok Hive account (2-of-3 multisig, no standalone keys)
- Create @ragnarok-genesis Hive account (2-of-3 multisig, same signers)
- Create @ragnarok-treasury Hive account (2-of-3 initial, expandable via WoT)
- Ceremony flow: `/admin` → Step 1: Genesis → Step 2: Batch Mint → Step 3: Seal → Step 4: Mint Packs → Step 5: Distribute
- Treasury remains active for ongoing RUNE payouts
- Full ceremony procedures: [GENESIS_RUNBOOK.md](docs/GENESIS_RUNBOOK.md)
