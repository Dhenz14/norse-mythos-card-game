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
- 1,500+ collectible cards across 4 mythological factions
- 80 playable heroes across 12 classes
- Poker combat system with Texas Hold'em mechanics
- Ragnarok Chess (7x5 strategic board)
- Single-player campaign (49 missions across 5 factions)
- Tournament system (Swiss + single elimination brackets)
- Card crafting & trading (Eitr economy)
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
│   │   ├── hiveConfig.ts       # Config: HIVE_NODES, RAGNAROK_ACCOUNT, NFT_ART_BASE_URL
│   │   ├── tournamentRewards.ts # 11 milestone rewards (wins/ELO/matches → cards + RUNE)
│   │   ├── nftMetadataGenerator.ts # ERC-1155 metadata with attributes
│   │   └── index.ts            # Barrel exports
│   ├── HiveSync.ts             # Keychain: login, broadcast, claimReward
│   ├── HiveDataLayer.ts        # Zustand store: collection, stats, tokens
│   └── schemas/HiveTypes.ts    # Core Hive types
├── game/
│   ├── components/         # Card, combat, chess, UI components
│   │   ├── campaign/       # CampaignPage (world map + mission briefing)
│   │   ├── collection/     # CollectionPage (with crafting integration)
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
│   │   ├── settingsStore.ts # Settings (audio, visual, gameplay)
│   │   ├── dailyQuestStore.ts # Daily quest progress + refresh
│   │   ├── friendStore.ts  # Friends list + online status
│   │   ├── tradeStore.ts   # Trade offers + selections
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
│   ├── engine/             # WASM game engine (TypeScript fallback)
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
│   ├── subscribers/        # BlockchainSubscriber, DailyQuestSubscriber
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
│   └── mockBlockchainRoutes.ts # In-memory mock (dev only)
├── services/
│   ├── chainIndexer.ts     # Server-side chain replay (optional convenience)
│   ├── chainState.ts       # In-memory account state for global queries
│   ├── tournamentManager.ts # Swiss/elimination pairing logic
│   └── hiveAuth.ts         # Hive signature verification for server auth
└── storage.ts              # Database interface
```

## Key Subsystems

### Card System (`game/data/`)
- **Single source**: `allCards.ts` contains all 1,400+ cards
- Card registry with ID ranges in `cardRegistry/ID_RANGES.md`
- Ranges: 1000-3999 neutrals, 4000-8999 classes, 9000-9249 tokens, 20000-29967 Norse set, 30001-30410 Norse mechanics, 31001-31806 expansion gap-fill, 50000-50376 pets (38 families), 85001-85010 rogue

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
- **Supply caps**: 16,000 total (10K common, 4K rare, 1.5K epic, 500 mythic)

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
- **Pet Evolution**: 3-3-1 family system (38 families, 266 cards); `petStage`, `petFamily`, `petFamilyTier`, `evolvesInto/From`, `evolutionCondition`, `stage3Variants` fields; Stage 2/3 cost 0 mana (free evolution); `attemptPetEvolution()` in `gameUtils.ts` handles transform + variant selection; `checkPetEvolutionTrigger()` fires on 15 triggers across gameUtils/spellUtils/battlecryUtils/zoneUtils; evolve info icon on Stage 2/3 cards in SimpleCard.tsx; Stage 3 cards show "?" for ATK/HP until evolved (cyan glow via `hasStage3Variants` flag)
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
- Supply caps hard-enforced by every reader (16K: 10K common, 4K rare, 1.5K epic, 500 mythic)

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
- WASM engine infrastructure (loader, bridge, TypeScript fallback)
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
- Pet Evolution system (266 cards, 38 families, 3-3-1 evolution, Stage 2/3 cost 0 mana, evolve info icon, "?" stats on unevolved Stage 3)
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
  - Random output prevents NFT supply hoarding (500 mythic cap per card)
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

### Next (Genesis Launch)

- Create @ragnarok Hive account
- Upload card art to CDN
- Build AssemblyScript WASM module (deterministic game engine)
- Broadcast genesis + seal on Hive mainnet (two Keychain clicks, then admin key irrelevant)
