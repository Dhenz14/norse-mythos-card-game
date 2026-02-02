# Norse Mythos Card Game

<p align="center">
  <strong>A strategic digital card game combining Norse mythology, poker combat, and Hearthstone-style mechanics</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#game-rules">Game Rules</a> •
  <a href="#poker-combat">Poker Combat</a> •
  <a href="#heroes--classes">Heroes</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Overview

Norse Mythos Card Game is a multi-mythology digital collectible card game featuring:

- **76 Playable Heroes** across 12 classes, each with unique Hero Powers
- **1,300+ Collectible Cards** with battlecry, deathrattle, combo, and spell effects
- **2 Mythological Factions**: Norse, Greek
- **Poker Combat System**: Texas Hold'em inspired betting using HP as stakes
- **Ragnarok Chess**: Strategic 7x5 chess variant where piece collisions trigger poker combat
- **Premium Card Effects**: Holographic, legendary, and 3D card visuals

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Game Rules](#game-rules)
   - [Game Modes](#game-modes)
   - [Standard Match Rules](#standard-match-rules)
   - [Ragnarok Chess](#ragnarok-chess)
3. [Poker Combat System](#poker-combat-system)
   - [Combat Phases](#combat-phases)
   - [Betting Actions](#betting-actions)
   - [Hand Rankings](#hand-rankings)
   - [HP & Damage Resolution](#hp--damage-resolution)
   - [Fold Penalty](#fold-penalty)
4. [Heroes & Classes](#heroes--classes)
5. [Card System](#card-system)
6. [Keywords & Abilities](#keywords--abilities)
7. [Status Effects](#status-effects)
8. [Element System](#element-system)
9. [Deck Building](#deck-building)
10. [Tech Stack](#tech-stack)
11. [Project Structure](#project-structure)
12. [Contributing](#contributing)
13. [License](#license)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Ragnaroknfthive/Ragnarok-Card-.git

# Install dependencies
npm install

# Start development server
npm run dev

# TypeScript check
npm run check

# Production build
npm run build
```

---

## Game Rules

### Game Modes

#### Ragnarok Chess Mode

A strategic chess variant where pieces represent heroes. When major pieces collide, combat is resolved through the Poker Combat System.

```
Main Menu → Mode Selection → Ragnarok Chess → Army Selection → Chess Board → Attack → Poker Combat → Resolution → Victory
```

#### Standard Match Mode

Classic Hearthstone-style 1v1 card battles without the chess layer.

```
Main Menu → Mode Selection → Standard Match → Hero Selection → Deck Building → Mulligan → Turn Loop → Victory/Defeat
```

---

### Standard Match Rules

#### Setup

1. Each player starts with **100 HP**
2. Draw **3 cards** (going first) or **4 cards + The Coin** (going second)
3. **Mulligan phase**: Replace unwanted cards

#### Turn Structure

| Phase | Actions |
|-------|---------|
| **Start of Turn** | Draw a card, gain a mana crystal (max 10), refresh mana, unfreeze minions |
| **Main Phase** | Play cards, attack with minions/hero, use Hero Power (2 mana), activate effects |
| **End of Turn** | Trigger end-of-turn effects, opponent's turn begins |

#### Mana System

- Start with **1 mana crystal**
- Gain **+1 mana crystal** per turn
- Maximum **10 mana crystals**
- All mana refreshes at start of turn

#### Board Limits

| Limit | Value |
|-------|-------|
| Minions per side | 7 |
| Hand limit | 10 cards |
| Deck size | 30 cards |

---

### Ragnarok Chess

#### Board Layout (7x5 Grid)

```
Rows 0-1: Player's pieces
Rows 2-4: Empty (strategic maneuvering)
Rows 5-6: Opponent's pieces

Player Starting Position (Row 0-1):
Row 0: Knight | Queen | King | Bishop | Rook
Row 1: Pawn  | Pawn  | Pawn | Pawn   | Pawn

Opponent Position (Row 5-6) - Mirrored:
Row 5: Pawn  | Pawn  | Pawn | Pawn   | Pawn
Row 6: Rook  | Bishop| King | Queen  | Knight
```

#### Piece Stats

| Piece | Base HP | Spell Slots | Movement |
|-------|---------|-------------|----------|
| **King** | 100 | 0 | Any direction, 1 square |
| **Queen** | 100 | 33 | Any direction, unlimited |
| **Rook** | 100 | 30 | Horizontal/vertical, unlimited |
| **Bishop** | 100 | 30 | Diagonal only, unlimited |
| **Knight** | 100 | 30 | L-shape (2+1), can jump |
| **Pawn** | 100 | 0 | Forward only, 1 square |

#### Combat Rules

| Attacker | Defender | Result |
|----------|----------|--------|
| Pawn or King | Any piece | **Instant kill** (Valkyrie Weapon) |
| Any piece | Pawn | **Instant kill** |
| Major piece | Major piece | **Poker Combat** |

#### Stamina System

- **Stamina = HP ÷ 10** (e.g., 100 HP = 10 Stamina)
- Moving a piece grants **+1 Stamina** to ALL friendly pieces
- Stamina caps maximum bet: **1 STA = 10 HP max bet**

#### Victory Conditions

- Capture the enemy King (checkmate)
- Eliminate all enemy pieces

---

## Poker Combat System

When major pieces collide in Ragnarok Chess, combat is resolved through a Texas Hold'em inspired system where **HP is your betting currency**.

### First Strike

When a piece attacks in Ragnarok Chess, the **attacker deals 15 damage** before poker betting begins. This represents the tactical advantage of striking first.

- First Strike damage is dealt at the start of combat
- Applies before any poker betting or showdown
- Cannot be blocked or reduced

### Combat Phases

| Phase | Poker Equivalent | Description |
|-------|------------------|-------------|
| **First Strike** | - | Attacker deals 15 damage |
| **Mulligan** | Pre-game | Replace hole cards (optional) |
| **Blinds** | Blinds | Forced bets posted |
| **Faith** | Flop | 3 community cards revealed |
| **Foresight** | Turn | 4th community card revealed |
| **Destiny** | River | 5th community card revealed |
| **Resolution** | Showdown | Compare hands, resolve HP changes |

### Blind Structure

| Blind | HP Cost |
|-------|---------|
| Small Blind (SB) | 5 HP |
| Big Blind (BB) | 10 HP |
| Ante (per player) | 0.5 HP |

**Starting Pot**: 16 HP (SB 5 + BB 10 + Ante 0.5 × 2)

### Betting Actions

| Action | Poker Term | Effect | Cost |
|--------|------------|--------|------|
| **Attack** | Bet | Commit HP as wager | Variable |
| **Counter Attack** | Raise | Increase HP commitment | Variable |
| **Engage** | Call | Match opponent's wager | Match amount |
| **Brace** | Fold | Exit combat, forfeit committed HP | -1 STA |
| **Defend** | Check | Pass action (no active bet) | Free (+1 STA) |

### Hand Rankings

Norse-themed hand rankings from highest to lowest:

| Rank | Norse Name | Poker Equivalent | Multiplier |
|------|------------|------------------|------------|
| 10 | **RAGNAROK** | Royal Flush | 2.0× |
| 9 | **Divine Alignment** | Straight Flush | 1.8× |
| 8 | **Godly Power** | Four of a Kind | 1.6× |
| 7 | **Valhalla's Blessing** | Full House | 1.4× |
| 6 | **Odin's Eye** | Flush | 1.3× |
| 5 | **Fate's Path** | Straight | 1.2× |
| 4 | **Thor's Hammer** | Three of a Kind | 1.15× |
| 3 | **Dual Runes** | Two Pair | 1.1× |
| 2 | **Rune Mark** | One Pair | 1.05× |
| 1 | **High Card** | High Card | 1.0× |

### HP & Damage Resolution

**Option A Rules** (Current Implementation):

This is a **survival-based** poker system where the winner recovers and the loser suffers:

| Outcome | Winner | Loser |
|---------|--------|-------|
| **Showdown** | Heals own committed HP | Loses own committed HP |
| **Fold** | Heals own committed HP | Loses own committed HP + fold penalty |

**Key Mechanics**:

1. **HP is deducted during betting** - When you commit HP to the pot, it's immediately subtracted from your health
2. **Winner heals own HP** - The winner recovers only what they personally committed
3. **Loser keeps their loss** - The loser does not recover their committed HP
4. **Pot is for tracking only** - The pot shows total stakes but isn't "won" by either player

**Example Showdown**:
```
Player commits: 30 HP → Player HP: 100 → 70
AI commits: 20 HP → AI HP: 100 → 80

Player wins with Odin's Eye (Flush):
- Player heals 30 HP → Player HP: 70 → 100
- AI keeps loss → AI HP: 80 (lost 20 HP permanently)
```

### Fold Penalty

When a player folds (Brace):

1. **Immediate loss of committed HP** - Already deducted during betting
2. **No recovery** - Folder does not get their HP back
3. **Winner heals** - Winner recovers their own committed HP
4. **Stamina penalty** - Folder loses 1 STA
5. **Armor absorbs first** - Any fold-specific penalty is absorbed by armor before HP

**Example Fold**:
```
Player commits 20 HP, then folds:
- Player HP: 100 → 80 (20 HP lost permanently)
- Winner heals their committed HP
- Player loses 1 STA
```

---

## Heroes & Classes

### The 12 Classes

| Class | Primary Role | Hero Examples |
|-------|--------------|---------------|
| **Mage** | Spell damage, AoE | Odin, Zeus, Athena |
| **Warrior** | Armor, weapons | Thor, Ares, Tyr |
| **Priest** | Healing, buffs | Baldur, Apollo, Eir |
| **Rogue** | Stealth, combos | Loki, Hermes, Heimdall |
| **Paladin** | Divine shield, buffs | Freyr, Helios |
| **Hunter** | Beast synergy, direct damage | Skadi, Artemis, Ullr |
| **Druid** | Ramp, choose one | Freya, Demeter |
| **Warlock** | Self-damage, demons | Hel, Hades, Fenrir |
| **Shaman** | Overload, totems | Njord, Poseidon |
| **Demon Hunter** | Attack buffs, outcast | Surtr, Muspel |
| **Death Knight** | Undead, corpses | Angrboda, Thanatos |
| **Necromancer** | Resurrection, death synergy | Sinmara, Persephone |

### Hero Components

Each hero has three unique abilities:

| Ability | Cost | Description |
|---------|------|-------------|
| **Hero Power** | 2 mana | Repeatable, once per turn |
| **Weapon Upgrade** | One-time | Equips a weapon to the hero |
| **Passive Ability** | Free | Always-active effect |

### Mythological Factions

- **Norse**: Odin, Thor, Loki, Freya, Baldur, Hel, Fenrir, Tyr, Heimdall
- **Greek**: Zeus, Athena, Hades, Poseidon, Ares, Apollo, Artemis, Hermes

---

## Card System

### Card Types

| Type | Description |
|------|-------------|
| **Minion** | Creatures with Attack and Health. Can attack and be attacked. |
| **Spell** | One-time effects, discarded after use. |
| **Weapon** | Hero equipment with Attack and Durability. |
| **Hero Card** | Replaces your hero with a new one (new power, armor). |

### Card Rarity

| Rarity | Color | Deck Limit |
|--------|-------|------------|
| Common | Gray | 2 copies |
| Rare | Blue | 2 copies |
| Epic | Purple | 2 copies |
| Legendary | Orange | 1 copy |
| Token | Dark Gray | Non-collectible |

### Card ID Ranges

| Range | Category |
|-------|----------|
| 1000-1999 | Base Neutral Minions |
| 2000-2999 | Rare/Epic Neutrals |
| 3000-3999 | Epic Neutrals & Giants |
| 4000-4999 | Class Cards (Necromancer, Spells) |
| 5000-8999 | Class Cards (Warrior, Mage, Hunter, etc.) |
| 9000-9999 | Tokens (non-collectible) |
| 20000-29999 | Norse Mythology Set |
| 90000-99999 | Hero Cards |

---

## Keywords & Abilities

### Triggered Effects

| Keyword | Description |
|---------|-------------|
| **Battlecry** | Triggers when played from hand |
| **Deathrattle** | Triggers when the minion dies |
| **Combo** | Bonus effect if another card was played first |
| **Inspire** | Triggers when you use your Hero Power |
| **Frenzy** | Triggers first time this survives damage |
| **Spellburst** | Triggers once after you cast a spell |
| **Overkill** | Triggers when dealing excess lethal damage |
| **Outcast** | Bonus if leftmost or rightmost in hand |

### Persistent Effects

| Keyword | Description |
|---------|-------------|
| **Taunt** | Enemies must attack this first |
| **Divine Shield** | First damage is ignored |
| **Stealth** | Cannot be targeted until it attacks |
| **Windfury** | Can attack twice per turn |
| **Lifesteal** | Damage dealt heals your hero |
| **Poisonous** | Destroys any minion damaged by this |
| **Reborn** | Returns to life with 1 Health |

### Action Keywords

| Keyword | Description |
|---------|-------------|
| **Charge** | Can attack immediately (any target) |
| **Rush** | Can attack minions immediately |
| **Freeze** | Target loses next attack |
| **Silence** | Removes all card text and enchantments |
| **Discover** | Choose one of three random cards |

### Resource Keywords

| Keyword | Description |
|---------|-------------|
| **Overload** | Locks mana crystals next turn |
| **Spell Damage** | Your spells deal extra damage |
| **Echo** | Can be played multiple times per turn |

---

## Status Effects

| Effect | Icon | Description | Duration |
|--------|------|-------------|----------|
| **Poison** | ☠️ | 3% max HP damage per turn | Until cleared |
| **Bleed** | 🩸 | +3 damage taken when damaged | Until cleared |
| **Paralysis** | ⚡ | 50% chance to fail actions | Until cleared |
| **Weakness** | ⬇️ | -3 Attack | Until cleared |
| **Vulnerable** | 🎯 | +3 damage taken | Until cleared |
| **Marked** | 👁️ | Can always be targeted (ignores Stealth) | Until cleared |
| **Burn** | 🔥 | +3 Attack, take 3 self-damage on attack | Until cleared |
| **Freeze** | ❄️ | Cannot act | Clears end of turn |

---

## Element System

### Element Wheel

```
Fire → Earth → Wind → Water → Fire

Holy ⟷ Shadow (mutual counter)
Neutral → No advantage
```

### Elemental Matchups

| Element | Strong Against | Weak Against | Color |
|---------|----------------|--------------|-------|
| Fire 🔥 | Earth | Water | #ff6b35 |
| Water 💧 | Fire | Wind | #4fc3f7 |
| Wind 🌪️ | Water | Earth | #81c784 |
| Earth 🌍 | Wind | Fire | #a1887f |
| Holy ✨ | Shadow | Shadow | #ffd54f |
| Shadow 🌑 | Holy | Holy | #9c27b0 |
| Neutral ⚪ | None | None | #9e9e9e |

### Elemental Advantage Bonus

When attacking with elemental advantage:
- **+2 Attack** bonus
- **+2 Health** bonus to minions
- **+20 Armor** (absorbs damage before HP)

---

## Deck Building

### Basic Rules

| Rule | Value |
|------|-------|
| Hand size | 9 cards (max) |
| Card copies | 2 per card (1 for Legendaries) |
| Class restriction | Own class + Neutral only |
| Deck size | 30 cards |

### Deck Archetypes

| Archetype | Strategy |
|-----------|----------|
| **Aggro** | Fast, cheap minions. Win before turn 7. |
| **Midrange** | Balanced curve. Contest board, then finish. |
| **Control** | Removal and healing. Outlast opponent. |
| **Combo** | Build to specific card combination. |
| **Tempo** | Efficient trades. Maximize mana each turn. |

### Army Selection (Ragnarok Chess)

| Slot | Class Options |
|------|---------------|
| King | Choose from 9 Norse Kings (passive abilities) |
| Queen | Mage, Warlock, or Necromancer |
| Rook | Warrior or Paladin |
| Bishop | Priest or Druid |
| Knight | Rogue or Hunter |

### King Divine Command System

Each of the 9 Primordial Norse Kings possesses a unique **Divine Command** - the power to place hidden landmine traps that drain enemy Stamina.

| King | Mine Shape | STA Penalty |
|------|------------|-------------|
| **Ymir** | Single Tile | -2 STA |
| **Buri** | 4-Tile Line | -2 STA |
| **Surtr** | 3×3 Area | -2 center, -1 edges |
| **Borr** | Full Rank/File | -2 STA |
| **Yggdrasil** | Cross Pattern | -2 STA |
| **Auðumbla** | L-Shape | -2 STA |
| **Blainn** | Diagonal Line | -2 STA |
| **Brimir** | Circle Pattern | -2 STA |
| **Ginnungagap** | Random Scatter | -3 STA |

**Rules:** 5 uses per game, 1 per turn, mines expire after 2 turns if not triggered, invisible to opponents.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5 |
| **State** | Zustand 5 |
| **Styling** | Tailwind CSS 3.4 |
| **3D/Effects** | React Three Fiber, Framer Motion, React Spring |
| **UI Components** | Radix UI (shadcn/ui) |
| **Backend** | Express + TypeScript |
| **Database** | PostgreSQL + Drizzle ORM |

---

## Project Structure

```
client/src/
├── game/
│   ├── components/        # Card, combat, chess components
│   ├── stores/            # Zustand state management
│   │   └── combat/        # Combat store slices
│   ├── data/              # Card definitions, heroes
│   │   ├── allCards.ts    # 1,300+ cards (single source)
│   │   ├── cardRegistry/  # Cards organized by ID range
│   │   └── norseHeroes/   # 76 playable heroes
│   ├── combat/            # Poker combat system
│   │   ├── RagnarokCombatArena.tsx
│   │   ├── hooks/         # Combat hooks
│   │   └── modules/       # Hand evaluator, betting
│   ├── effects/           # Effect handlers (182 total)
│   │   └── handlers/      # battlecry/, deathrattle/, spellEffect/
│   └── types/             # TypeScript definitions
├── components/ui/         # Shared UI components
└── lib/                   # Utilities and helpers

server/
├── routes.ts              # API routes
└── storage.ts             # Database operations

docs/
├── RULEBOOK.md            # Detailed rulebook
├── GAME_FLOW.md           # Game flow diagrams
├── DESIGN_PHILOSOPHY.md   # Design decisions
└── RAGNAROK_GAME_RULES.md # P2E integration rules
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [RULEBOOK.md](docs/RULEBOOK.md) | Complete game rules with examples |
| [GAME_FLOW.md](docs/GAME_FLOW.md) | Game flow diagrams and state management |
| [DESIGN_PHILOSOPHY.md](docs/DESIGN_PHILOSOPHY.md) | Design decisions and architecture |
| [CLAUDE.md](CLAUDE.md) | Technical documentation for AI assistants |
| [replit.md](replit.md) | Project configuration and preferences |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow coding standards in `CLAUDE.md` and `replit.md`
4. Ensure `npm run check` passes (TypeScript validation)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Coding Standards

- **Tabs** for indentation
- **camelCase** for functions/variables
- **PascalCase** for components
- **Small functions** (20-30 lines max)
- **No magic strings** - use constants
- **Feature-First Architecture** - 4-5 files max per feature

### Architecture Pattern

```
TSX Component (presentation only)
     ↓ imports from
Custom Hook (React logic)
     ↓ imports from
Zustand Store (global state)
     ↓ imports from
Pure Utilities (business logic)
```

---

## Roadmap

### Current (Phase 1)

- [x] Core card game mechanics
- [x] 76 heroes across 12 classes
- [x] 1,300+ cards with effects
- [x] Poker combat system
- [x] Ragnarok Chess mode
- [x] AI opponents
- [x] Deck builder

### Planned (Phase 2)

- [ ] Hive Keychain authentication
- [ ] NFT card ownership on Hive blockchain
- [ ] Multiplayer via WebSocket/PartyKit
- [ ] Tournament system
- [ ] Ranked matchmaking

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with React, TypeScript, and Norse mythology.
</p>
