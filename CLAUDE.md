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
- 2,000+ collectible cards across 4 mythological factions
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
│   ├── blockchain/             # Hive NFT system (15 op types, 13 IDB stores)
│   │   ├── replayEngine.ts     # Chain replay: fetch ops → apply rules → IndexedDB
│   │   ├── replayRules.ts      # Deterministic rules (hash-pinned at genesis)
│   │   ├── replayDB.ts         # IndexedDB v6: cards, matches, rewards, ELO, etc.
│   │   ├── genesisAdmin.ts     # Admin: broadcastGenesis, broadcastSeal (one-time)
│   │   ├── hiveConfig.ts       # Config: HIVE_NODES, RAGNAROK_ACCOUNT, explorer URLs
│   │   ├── explorerLinks.ts    # Hive explorer URL builders (tx + block)
│   │   ├── tournamentRewards.ts # 11 milestone rewards (wins/ELO/matches → cards + RUNE)
│   │   ├── nftMetadataGenerator.ts # ERC-1155 metadata with attributes
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
│   │   ├── tutorial/       # TutorialOverlay (step-by-step onboarding)
│   │   ├── quests/         # DailyQuestPanel (3 daily quests)
│   │   └── ui/             # LoadingScreen + shared UI
│   ├── stores/             # Zustand state stores
│   │   ├── gameStore.ts    # Main game store
│   │   ├── gameStoreIntegration.ts # Event-driven architecture init + HiveEvents toasts
│   │   ├── heroDeckStore.ts # Deck building (NFT ownership enforcement in Hive mode)
│   │   ├── settingsStore.ts # Settings (audio, visual, gameplay)
│   │   ├── dailyQuestStore.ts # Daily quest progress + refresh + chain reward claims
│   │   ├── friendStore.ts  # Friends list + online status
│   │   ├── tradeStore.ts   # Trade offers + chain transfers on accept
│   │   └── replayStore.ts  # Match history + replay playback
│   ├── data/               # Card definitions, heroes
│   │   ├── allCards.ts     # Single source of truth (1400+ cards)
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
```

## Key Subsystems

### Card System (`game/data/`)
- **Single source**: `allCards.ts` contains all 2,242 cards (2,082 collectible NFTs + 160 tokens)
- Card registry with ID ranges in `cardRegistry/ID_RANGES.md`
- Ranges: 1000-3999 neutrals, 4000-8999 classes, 9000-9249 tokens, 20000-29967 Norse set, 30001-30410 Norse mechanics, 31001-31922 expansion gap-fill, 35001-40999 class expansions, 50000-50376 pets (38 families), 85001-86999 rogue/golems

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
- **15 op types**: genesis, mint, seal, transfer, burn, pack_open, reward_claim, match_start, match_result, level_up, queue_join, queue_leave, slash_evidence, team_submit, card_transfer
- **13 IndexedDB stores**: cards, matches, reward_claims, elo_ratings, token_balances, sync_cursors, genesis_state, supply_counters, match_anchors, queue_entries, slashed_accounts, player_nonces, pending_slashes
- **Admin lifecycle**: genesis (one-time) → seal (permanent) → admin key irrelevant forever
- **Self-serve rewards**: 11 milestones in `tournamentRewards.ts`; players claim via Keychain
- **Supply caps**: ~3.3M total NFTs (1,800/common, 1,250/rare, 750/epic, 500/mythic per card)
- **NFT provenance**: `HiveCardAsset` stores `mintTrxId`, `mintBlockNum`, `lastTransferTrxId`, `lastTransferBlock` — full on-chain history per card
- **Explorer links**: `explorerLinks.ts` generates clickable URLs (hivehub.dev) for any trxId or block
- **Provenance viewer**: `NFTProvenanceViewer.tsx` shows full metadata + explorer links in collection
- **Direct transfer**: `SendCardModal.tsx` — one-click card gifting via Keychain, double-confirm safety
- **Ownership enforcement**: `heroDeckStore.ts` gates deck building on chain-derived NFT collection
- **Event bus**: `HiveEvents.ts` emits card:transferred, token:updated, transaction:confirmed/failed → toast notifications via `gameStoreIntegration.ts`
- **Post-match refresh**: `BlockchainSubscriber.ts` re-reads IndexedDB → HiveDataStore after each match (XP, levels, RUNE rewards)
- **Reward claiming**: campaign, daily quests broadcast `reward_claim` on chain via `hiveSync.claimReward()`

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
- Supply caps hard-enforced by every reader (~3.3M: 1,800/common, 1,250/rare, 750/epic, 500/mythic per card)
- Every NFT stores mint + transfer trxIds — provenance viewer links directly to Hive explorer
- Direct gifting via `SendCardModal` + `hiveSync.transferCard()` — no trade negotiation needed
- Deck builder enforces NFT ownership in Hive mode (local mode = unlimited)
- `HiveEvents` bus drives real-time toast notifications for transfers, token changes, tx status
- `BlockchainSubscriber` refreshes HiveDataStore from IndexedDB after each match (XP, RUNE, levels)
- Campaign + daily quest rewards broadcast `reward_claim` on chain

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
/ladder        → RankedLadderPage (ELO leaderboard)
/history       → MatchHistoryPage (replay viewer)
/spectate/:id  → SpectatorView (read-only P2P)
/settings      → SettingsPage (audio, visual, gameplay)
/treasury      → TreasuryPage (multisig governance, WoT vouching)
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
- Keyword definitions (47 keywords with descriptions)

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
  - Random output prevents NFT supply hoarding (500 copies per mythic card, 750 epic, 1,250 rare, 1,800 common)
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
    - Kraken of Ginnungagap (40010): 8/8 mythic, Submerge 2, surface 8 AOE damage
    - Kraken Spawn (40011): 2/3 rare, Submerge 1, surface +2/+2
    - Depths of the Void (40012): 4-mana epic spell, Submerge friendly +3/+3
    - Ginnungagap's Hunger (40013): 2-mana rare tech counter — 5 damage to Submerged minion
  - **Coil**: Lock enemy minion's attack to 0 while Coil source lives (Deathrattle frees)
    - Lindworm, Wingless Terror (40020): 3/5 epic Dragon, Coil any enemy
    - Young Lindworm (40021): 1/3 common Dragon, Coil enemy ≤2 attack
  - **Bestla tokens**: Odin-Spark (9060), Vili-Spark (9061), Ve-Spark (9062) → merge into 6/6 Aesir Ascendant (9063)
  - **Gjoll Bridge-Keeper** (40025): 3/4 rare Undead, Deathrattle resurrect to hand (Hermod synergy)
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
- Updated `PIECE_SUPPLY` in `heroRarity.ts`: mythic 500, epic 750, rare 1,250, common 1,800 (per card)
- Final NFT supply: ~3.29M total (300×500 + 750×750 + 745×1,250 + 912×1,800)
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

- New player first-login ceremony: welcome screen → "Claim Your Birthright" → pack-opening animation → 25 starter cards added to collection
- `starterSet.ts`: 25 cards (3 basic vanillas + 22 common neutrals) across 1-6 mana curve with Taunt, Divine Shield, Windfury, Stealth, Lifesteal, Enrage, Battlecry
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

### Next (Genesis Launch)

- Create @ragnarok-genesis Hive account (2-of-3 multisig, no standalone keys)
- Create @ragnarok-treasury Hive account (2-of-3 initial, expandable)
- Upload card art to CDN
- Multisig genesis → mint batches → seal → brick genesis authority
- Treasury remains active for ongoing RUNE payouts
