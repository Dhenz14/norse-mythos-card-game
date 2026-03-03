# Ragnarok: Norse Mythos Card Game

<p align="center">
  <img src="client/public/ragnarok-logo.jpg" alt="Ragnarok" width="480" />
</p>

<p align="center">
  <strong>A strategic digital card game where gods collide on the battlefield.<br/>Poker combat. Chess tactics. Five mythologies. One war.</strong>
</p>

<p align="center">
  <a href="#the-game">The Game</a>&ensp;&bull;&ensp;
  <a href="#features">Features</a>&ensp;&bull;&ensp;
  <a href="#norse-mechanics">Norse Mechanics</a>&ensp;&bull;&ensp;
  <a href="#ragnarok-chess">Ragnarok Chess</a>&ensp;&bull;&ensp;
  <a href="#poker-combat">Poker Combat</a>&ensp;&bull;&ensp;
  <a href="#campaign">Campaign</a>&ensp;&bull;&ensp;
  <a href="#quick-start">Quick Start</a>&ensp;&bull;&ensp;
  <a href="#tech-stack">Tech Stack</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/cards-1%2C400%2B-gold?style=flat-square" />
  <img src="https://img.shields.io/badge/heroes-77-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/mythologies-5-red?style=flat-square" />
  <img src="https://img.shields.io/badge/campaign_missions-56-green?style=flat-square" />
  <img src="https://img.shields.io/badge/pet_families-38-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/typescript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/blockchain-hive-E31337?style=flat-square" />
</p>

---

## The Game

Ragnarok is a collectible card game that fuses three systems into one: **card battling with Norse-original mechanics**, a **7x5 strategic chess board**, and **Texas Hold'em poker combat** where HP is your betting currency. Choose your army of gods, maneuver them across the board, and when pieces collide — play poker with your life.

Five mythological pantheons clash for supremacy. Norse frost giants wage war against Greek Olympians. Egyptian pharaohs face Celtic druids. And when all four campaigns fall, a secret Eastern chapter awaits — where Chinese dragons, Japanese kami, and Hindu devas unite for the final battle.

---

## Features

### Core Gameplay
- **1,400+ collectible cards** with battlecry, deathrattle, combo, discover, and 47 keyword mechanics
- **77 playable heroes** across 12 classes — Mage, Warrior, Priest, Rogue, Paladin, Hunter, Druid, Warlock, Shaman, Berserker, Death Knight, Necromancer
- **6 unique Norse mechanics** — Blood Price, Einherjar, Prophecy, Realm Shift, Ragnarok Chain, Pet Evolution
- **Ragnarok Chess** — 7x5 board where god-pieces maneuver and collisions trigger poker combat
- **Texas Hold'em poker combat** — bet HP, read bluffs, and resolve battles with Norse-themed hand rankings
- **8 status effects** with themed visual overlays — Poison, Bleed, Burn, Freeze, Paralysis, Weakness, Vulnerable, Marked
- **Element system** — Fire, Water, Wind, Earth, Holy, Shadow with advantage bonuses

### Campaign: War of the Pantheons
- **56 hand-crafted missions** across 5 mythological chapters
- **Nine Realms constellation map** — navigate Asgard, Midgard, Niflheim, Muspelheim, Jotunheim, Vanaheim, Alfheim, Svartalfheim, Helheim
- **Greek Olympus world map** — 8 locations from Mount Olympus to the Underworld
- **Themed AI enemies** — fight gods and monsters matching each realm's mythology
- **Boss rules** — extra health, bonus mana, passive damage, minion summons
- **Secret Eastern chapter** — 12 boss-tier missions unlocked after completing all campaigns, featuring Chinese, Japanese, and Hindu mythology
- **Escalating difficulty** with unique AI behavior profiles per mission

### Multiplayer & Social
- **P2P multiplayer** via WebRTC (PeerJS) — no server bottleneck
- **Ranked matchmaking** with ELO-based ladder
- **Tournament system** — Swiss + single elimination brackets
- **Spectator mode** — watch live matches (read-only P2P)
- **Match replay viewer** — action timeline with playback controls
- **Friends list** with online presence and challenge invites
- **Deck import/export** via shareable base64 codes

### Economy & Progression
- **Card crafting** — dust economy with disenchant/craft (8:1 cost ratio)
- **Card trading** — P2P trade offers with cards and dust
- **Card evolution** — 3 tiers: Mortal (60-70%) → Ascended (80-90%) → Divine (100%)
- **Daily quest system** — 19 quest templates, 3 active per day
- **Pack opening** with rarity-weighted pulls and premium animations

### Blockchain (Hive Layer 1)
- **NFT card ownership** on Hive blockchain with deterministic client-side chain replay
- **15 operation types** — mint, transfer, burn, pack_open, match_result, level_up, and more
- **Dual-signature match results** with Merkle transcript anchoring
- **Self-serve tournament rewards** — 11 milestones, players claim via Keychain
- **Supply caps** — 16,000 total (10K common, 4K rare, 1.5K epic, 500 mythic)
- **Anti-cheat** — WASM engine hash verification, PoW, slash evidence, nonce anti-replay

---

## Norse Mechanics

Six original game mechanics rooted in Norse mythology — not found in any other card game.

### Blood Price (8 cards)
**Pay health instead of mana.** Blood Price minions can be played at full mana cost OR by sacrificing health equal to their blood price value. Right-click a card in hand to toggle payment mode. Risk your life for tempo.

### Einherjar (6 cards)
**Warriors who fall in battle return stronger.** When an Einherjar minion dies, it shuffles back into your deck with +1/+1. Each warrior can return up to 3 times — just like the fallen heroes of Valhalla who feast and fight for eternity.

### Prophecy (7 cards)
**Visible countdown timers on the board.** Play a Prophecy card to place a ticking timer that both players can see. When the countdown reaches zero, the prophecy resolves — dealing damage, buffing allies, summoning minions, or transforming the battlefield. 7 resolve effect types.

### Realm Shift (9 cards)
**Change the rules of the battlefield.** Shift the active realm to one of the Nine Realms, each imposing board-wide effects:
- **Asgard** — +1 Attack to all minions
- **Niflheim** — Freeze a random enemy each turn
- **Muspelheim** — 1 damage to all minions at turn end
- **Jotunheim** — -1 Health to all minions
- **Helheim** — Deathrattle minions return to hand
- And 4 more realms with unique effects

### Ragnarok Chain (10 cards)
**Linked-destiny pairs from Norse mythology.** 5 mythological pairs (Fenrir & Tyr, Jormungandr & Thor, etc.) share a linked fate. When both partners are on the battlefield, they gain powerful buffs. When one dies, the partner suffers a devastating penalty.

### Pet Evolution — 3-3-1 System (266 cards)

The crown jewel of Norse mechanics. **38 Norse-themed pet families** with a branching evolution system:

```
Stage 1 (Common)          Stage 2 (Rare)           Stage 3 (Mythic)
┌─ Fire Variant ──────── Fire Evolved ───┐
├─ Water Variant ─────── Water Evolved ──┼──── Ultimate Form
└─ Neutral Variant ───── Neutral Evolved ┘
```

- **3 Stage 1** pets per family (one per element variant)
- **3 Stage 2** evolutions (each Stage 1 evolves into its Stage 2)
- **1 Stage 3** ultimate form (all paths converge)
- **Stage 2 & 3 cost 0 mana** — evolution is free when triggered
- **15 evolution triggers** — deal damage, destroy a minion, survive a turn, cast a spell, and more
- **Stage 3 "?" stats** — unevolved Stage 3 cards show "?" for ATK/HP with a cyan glow until evolved, keeping final stats mysterious
- **Element advantage** — +2 bonus damage when attacking a weak element
- **Hero synergy** — +1 Health when pet element matches hero element

Families include: Fenrir Wolves, Jormungandr Serpents, Odin's Ravens, Yggdrasil Stags, Storm Drakes, Frost Giants, Valkyries, Draugr, Bifrost Guardians, Thor's Goats, Dwarven Forgemasters, Norns, and 26 more.

---

## Ragnarok Chess

A strategic chess variant on a 7x5 grid where your army of gods battles for supremacy.

```
Row 6: Rook  │ Bishop│ King  │ Queen │ Knight    ← Opponent
Row 5: Pawn  │ Pawn  │ Pawn  │ Pawn  │ Pawn
Row 4: ░░░░░ │ ░░░░░ │ ░░░░░ │ ░░░░░ │ ░░░░░
Row 3: ░░░░░ │ ░░░░░ │ ░░░░░ │ ░░░░░ │ ░░░░░
Row 2: ░░░░░ │ ░░░░░ │ ░░░░░ │ ░░░░░ │ ░░░░░
Row 1: Pawn  │ Pawn  │ Pawn  │ Pawn  │ Pawn
Row 0: Knight│ Queen │ King  │ Bishop│ Rook      ← Player
```

### Army Selection

| Slot | Role | Hero Pool |
|------|------|-----------|
| **King** | 9 Primordial Norse Kings | Ymir, Buri, Surtr, Borr, Yggdrasil, Audumbla, Gaia, Brimir, Ginnungagap, Tartarus |
| **Queen** | Mage / Warlock / Necromancer | Zeus, Odin, Hades, Chronos, Izanami, Ammit... |
| **Rook** | Warrior / Paladin | Ares, Thor, Hephaestus, Sarutahiko... |
| **Bishop** | Priest / Druid | Poseidon, Aphrodite, Ma'at, Kamimusubi... |
| **Knight** | Rogue / Hunter | Hermes, Artemis, Nyx, Tsukuyomi, Serqet... |

### Combat Resolution

| Attacker → Defender | Result |
|---------------------|--------|
| Pawn or King → Any | Instant kill (Valkyrie Weapon) |
| Any → Pawn | Instant kill |
| Major → Major | **Poker Combat** |

### Stamina System

Each piece has **Stamina = HP / 10**. Moving a piece grants **+1 STA to all allies**. Stamina caps your maximum bet: **1 STA = 10 HP max wager**.

### King Divine Commands

Each King places invisible landmine traps that drain enemy Stamina:

| King | Mine Pattern | Penalty |
|------|-------------|---------|
| Ymir | Single tile | -2 STA |
| Surtr | 3x3 area | -2 center, -1 edges |
| Yggdrasil | Cross pattern | -2 STA |
| Ginnungagap | Random scatter | -3 STA |

---

## Poker Combat

When major pieces collide, combat is resolved through Texas Hold'em — but **HP is your chips**.

### Phases

| Phase | Name | What Happens |
|-------|------|------------|
| 0 | **First Strike** | Attacker deals 15 damage |
| 1 | **Mulligan** | Replace hole cards |
| 2 | **Blinds** | SB: 5 HP, BB: 10 HP, Ante: 0.5 HP each |
| 3 | **Faith** (Flop) | 3 community cards revealed |
| 4 | **Foresight** (Turn) | 4th card revealed |
| 5 | **Destiny** (River) | 5th card revealed |
| 6 | **Resolution** | Compare hands, heal winner, punish loser |

### Norse Hand Rankings

| Rank | Name | Poker Equivalent | Multiplier |
|------|------|------------------|------------|
| 10 | **RAGNAROK** | Royal Flush | 2.0x |
| 9 | **Divine Alignment** | Straight Flush | 1.8x |
| 8 | **Godly Power** | Four of a Kind | 1.6x |
| 7 | **Valhalla's Blessing** | Full House | 1.4x |
| 6 | **Odin's Eye** | Flush | 1.3x |
| 5 | **Fate's Path** | Straight | 1.2x |
| 4 | **Thor's Hammer** | Three of a Kind | 1.15x |
| 3 | **Dual Runes** | Two Pair | 1.1x |
| 2 | **Rune Mark** | One Pair | 1.05x |
| 1 | **High Card** | High Card | 1.0x |

### Betting Actions

| Action | Poker Term | Effect |
|--------|-----------|--------|
| **Attack** | Bet | Commit HP as wager |
| **Counter Attack** | Raise | Increase commitment |
| **Engage** | Call | Match opponent's wager |
| **Brace** | Fold | Forfeit committed HP, -1 STA |
| **Defend** | Check | Pass action, +1 STA |

### Resolution

The winner **heals back their committed HP**. The loser **keeps their loss permanently**. Folding forfeits all committed HP plus a stamina penalty.

---

## Campaign

### War of the Pantheons

Five mythological campaigns with 56 hand-crafted missions featuring unique narratives, themed AI armies, and escalating boss mechanics.

#### Norse — The Nine Realms
Navigate the World Tree through Asgard, Midgard, Jotunheim, Niflheim, Muspelheim, and more. Face Fenrir, the Midgard Serpent, frost giants, and ultimately Odin himself.

#### Greek — Olympus
Journey from the Underworld to Mount Olympus across 8 locations. Battle Cerberus, the Minotaur, Medusa, the Hydra, Ares, Poseidon, Hades, Athena, the Titan Kronos, and Zeus.

#### Egyptian — The Afterlife
Walk the path of the dead through Ma'at's judgment hall, Ra's sun barge, and the throne of the Pharaoh. Face Ammit the Devourer, Set's storms, the serpent Apophis.

#### Celtic — The Otherworld
Enter the misty realm of druids, the Morrigan's battlefield, Cu Chulainn's rage, Balor's evil eye, and the Wild Hunt. End at the Battle of Mag Tuired.

#### Eastern — The Celestial Gate (Secret)
*Unlocked after completing all four base campaigns.* 12 boss-tier missions spanning Chinese dragons, Japanese kami (Amaterasu, Susanoo, Izanami), Hindu devas (Ganesha, Kali), and a final battle where ALL mythologies collide: **Ragnarok of All Worlds**.

---

## Status Effects

Every status effect has full visual feedback — themed glows, overlays, and icon badges on affected minions.

| Icon | Effect | Damage/Impact | Visual |
|------|--------|---------------|--------|
| ☠️ | **Poison** | 3 damage per turn | Toxic green mist rising |
| 🩸 | **Bleed** | +3 damage taken on hit | Crimson drip pulse |
| 🔥 | **Burn** | +3 Attack, 3 self-damage on attack | Orange flame flicker |
| ❄️ | **Freeze** | Cannot act (clears end of turn) | Ice blue frost overlay |
| ⚡ | **Paralysis** | 50% chance to fail actions | Electric indigo crackle |
| ⬇️ | **Weakness** | -3 Attack | Muted purple dim |
| 🎯 | **Vulnerable** | +3 damage taken from all sources | Red vignette glow |
| 👁️ | **Marked** | Can always be targeted (ignores Stealth) | Gold highlight |

---

## Keywords & Abilities

### Triggered
| Keyword | Effect |
|---------|--------|
| **Battlecry** | Triggers when played from hand |
| **Deathrattle** | Triggers when the minion dies |
| **Combo** | Bonus if another card was played first |
| **Inspire** | Triggers on Hero Power use |
| **Frenzy** | Triggers first time this survives damage |
| **Spellburst** | Triggers once after you cast a spell |
| **Overkill** | Triggers on excess lethal damage |
| **Outcast** | Bonus if leftmost or rightmost in hand |

### Persistent
| Keyword | Effect |
|---------|--------|
| **Taunt** | Enemies must attack this first |
| **Divine Shield** | First damage is ignored |
| **Stealth** | Cannot be targeted until it attacks |
| **Windfury** | Can attack twice per turn |
| **Lifesteal** | Damage dealt heals your hero |
| **Poisonous** | Destroys any minion damaged by this |
| **Reborn** | Returns to life with 1 Health |
| **Charge** | Can attack immediately |
| **Rush** | Can attack minions immediately |

### Norse-Original
| Keyword | Effect |
|---------|--------|
| **Blood Price** | Pay health instead of mana to play this card |
| **Einherjar** | Returns to deck with +1/+1 when destroyed (max 3) |
| **Prophecy** | Visible countdown timer; resolves when it hits zero |
| **Rune** | Hidden trap that triggers on specific enemy actions |
| **Runic Bond** | Attach this to a friendly Automaton to fuse stats |
| **Pet Evolution** | Transform into a stronger form when trigger is met |

---

## Card System

### 1,400+ Cards Across 5 Sets

| Range | Category |
|-------|----------|
| 1000-3999 | Neutral minions (common → epic) |
| 4000-8999 | Class cards (12 classes) |
| 9000-9249 | Tokens (non-collectible) |
| 20000-29967 | Norse Mythology set |
| 29800-29967 | Artifacts & Armor |
| 30001-30410 | Norse Mechanics (Blood Price, Einherjar, Prophecy, Realm Shift, Chain) |
| 31001-31806 | Expansion gap-fill (synergy, deep keywords) |
| 50000-50376 | Pet Evolution (38 families, 266 cards) |
| 85001-85010 | Rogue specialty |
| 90000-99999 | Hero cards |

### Rarities

| Rarity | Deck Limit | Craft Cost | Disenchant |
|--------|-----------|------------|------------|
| Common | 2 copies | 40 dust | 5 dust |
| Rare | 2 copies | 100 dust | 20 dust |
| Epic | 2 copies | 400 dust | 100 dust |
| Mythic | 1 copy | 1,600 dust | 400 dust |

### Races

| Race | Description |
|------|-------------|
| Beast | Natural creatures and beasts of Norse legend |
| Dragon | Wyrms, drakes, and serpents |
| Elemental | Spirits of fire, ice, storm, and earth |
| Automaton | Dwarven constructs and mechanical beings |
| Naga | Sea-dwelling serpent folk |
| Titan | Ancient primordial giants |
| Einherjar | Fallen warriors chosen for Valhalla |
| Spirit | Totemic and spectral entities |
| Undead | Draugr, revenants, and the restless dead |
| Pirate | Raiders and seafarers |

---

## Element System

Every hero and minion has an element. Each element is **strong against 2** and **weak against 2**, creating a web of matchups — not a simple circle.

| Element | Strong Against | Weak Against | Color |
|---------|---------------|-------------|-------|
| 🔥 **Fire** | Earth, Wind | Water, Holy | `#ff6b35` |
| 💧 **Water** | Fire, Shadow | Earth, Wind | `#4fc3f7` |
| 🌪️ **Wind** | Water, Holy | Fire, Earth | `#81c784` |
| 🌍 **Earth** | Wind, Shadow | Fire, Water | `#a1887f` |
| ✨ **Holy** | Fire, Shadow | Wind, Shadow | `#ffd54f` |
| 🌑 **Shadow** | Holy, Wind | Water, Earth | `#9c27b0` |
| ⚪ **Neutral** | — | — | `#9e9e9e` |

Attacking with elemental advantage grants **+2 Attack, +2 Health, +20 Armor**.

---

## Blockchain: Hive NFT System

All card ownership, match results, and rewards live on Hive Layer 1 as `custom_json` operations. The client runs a deterministic chain replay engine — no centralized server needed.

```
Genesis → Seal → Admin key irrelevant forever
              ↓
    Players claim rewards via Keychain
    ELO derived from match_result history
    Supply caps hard-enforced by every reader
```

- **Chain replay**: Browser fetches ops from Hive → applies deterministic rules → builds IndexedDB
- **Merkle transcripts**: SHA-256 tree root anchored in each match_result
- **Dual signatures**: Host signs → client counter-signs → both on-chain
- **Supply**: 16,000 total NFTs (10K common / 4K rare / 1.5K epic / 500 mythic)

---

## Quick Start

```bash
git clone https://github.com/Dhenz14/norse-mythos-card-game.git
cd norse-mythos-card-game
npm install
npm run dev
```

Opens at `http://localhost:5000`. No database required for single-player — PostgreSQL is optional for server features.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Vite + Express) |
| `npm run build` | Production build |
| `npm run check` | TypeScript type checking |
| `npm run build:wasm` | Build WASM anti-cheat engine |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **State** | Zustand 5 (20+ specialized stores) |
| **Styling** | Tailwind CSS 3.4, CSS custom properties |
| **Effects** | Framer Motion, React Spring, React Three Fiber |
| **UI** | Radix UI (shadcn/ui) |
| **Multiplayer** | PeerJS (WebRTC P2P) |
| **Backend** | Express + TypeScript |
| **Database** | PostgreSQL + Drizzle ORM (optional) |
| **Local Storage** | IndexedDB (13 stores for chain replay) |
| **Blockchain** | Hive Layer 1 via hive-tx v7 |
| **Anti-Cheat** | AssemblyScript WASM (35KB binary, SHA-256 hash verification) |
| **Caching** | Service Worker asset cache |

### Architecture

```
client/src/
├── game/
│   ├── campaign/          # 56 missions, 5 chapters, 2 world maps
│   ├── combat/            # Poker combat arena + hooks
│   ├── components/        # Card, chess, campaign, collection, trading UI
│   ├── crafting/          # Dust economy
│   ├── data/              # 1,400+ cards + 77 heroes + 38 pet families
│   ├── effects/           # 181 effect handlers (battlecry, deathrattle, spell)
│   ├── engine/            # WASM loader + TypeScript fallback
│   ├── spectator/         # Read-only P2P viewer
│   ├── stores/            # 20+ Zustand stores
│   ├── tournament/        # Swiss + elimination brackets
│   └── tutorial/          # 15-step onboarding
├── data/blockchain/       # Hive NFT replay engine (15 op types, 13 IDB stores)
└── components/ui/         # Radix/shadcn components

server/
├── routes/                # Matchmaking, social, trading, tournaments
└── services/              # Chain indexer, tournament manager, auth
```

---

## Roadmap

### Completed

- [x] 1,400+ cards with 181 effect handlers (94 battlecry, 16 deathrattle, 71 spell)
- [x] 77 heroes across 12 classes and 5 mythological factions
- [x] 6 Norse-original mechanics (Blood Price, Einherjar, Prophecy, Realm Shift, Ragnarok Chain, Pet Evolution)
- [x] Pet Evolution 3-3-1 system (38 families, 266 cards, element advantage, hero synergy)
- [x] Ragnarok Chess (7x5 board with poker combat collisions)
- [x] Texas Hold'em poker combat with Norse hand rankings
- [x] 56-mission campaign across 5 mythological chapters
- [x] Nine Realms constellation map + Greek Olympus world map
- [x] Secret Eastern chapter (Chinese/Japanese/Hindu)
- [x] P2P multiplayer via WebRTC
- [x] Ranked matchmaking with ELO ladder
- [x] Tournament system (Swiss + elimination)
- [x] Card crafting & trading
- [x] Spectator mode + match replay viewer
- [x] Daily quest system (19 templates)
- [x] Friends list with presence + challenges
- [x] Hive NFT blockchain integration
- [x] WASM anti-cheat engine with hash verification
- [x] 8 status effects with visual overlays
- [x] Service Worker asset caching
- [x] Deck import/export via shareable codes
- [x] Tutorial overlay (15-step onboarding)
- [x] Settings system (audio, visual, gameplay, keybindings)
- [x] Card evolution (Mortal → Ascended → Divine)
- [x] Artifact & armor equipment system
- [x] 47 keyword definitions with descriptions
- [x] Norse terminology throughout (Rune, Runic Bond, Yggdrasil Golem, Automaton, Naga)

### Next: Genesis Launch

- [ ] Create @ragnarok Hive account
- [ ] Upload card art to CDN
- [ ] Broadcast genesis + seal on Hive mainnet
- [ ] Public beta

---

## Documentation

| Document | Description |
|----------|-------------|
| [RULEBOOK.md](docs/RULEBOOK.md) | Complete game rules with examples |
| [GAME_FLOW.md](docs/GAME_FLOW.md) | Game flow diagrams and state management |
| [RAGNAROK_GAME_RULES.md](docs/RAGNAROK_GAME_RULES.md) | Detailed P2E rules and status effects |
| [HIVE_BLOCKCHAIN_BLUEPRINT.md](docs/HIVE_BLOCKCHAIN_BLUEPRINT.md) | Hive NFT architecture and chain replay |
| [CLAUDE.md](CLAUDE.md) | Technical architecture reference |

---

## Contributing

```bash
# Fork → Clone → Branch
git checkout -b feature/your-feature

# Develop
npm run dev       # Hot reload at localhost:5000
npm run check     # TypeScript validation
npm run build     # Production build test

# Submit
git push origin feature/your-feature
# Open a Pull Request
```

**Standards**: Tabs, camelCase, PascalCase components, 20-30 line functions, Zustand over Context.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with React, TypeScript, and the fury of the Norse gods.</sub>
</p>
