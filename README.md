# Norse Mythos Card Game

A strategic digital card game inspired by Norse mythology, featuring poker-style combat mechanics and Ragnarok Chess integration.

## Features

- **76 Playable Heroes** across 12 classes, each with unique abilities
- **1,300+ Cards** with battlecry, deathrattle, and spell effects
- **4 Mythological Factions**: Norse, Greek, Japanese/Shinto, Egyptian
- **Poker Combat System** - Texas Hold'em style betting integrated with card battles
- **Ragnarok Chess** - Strategic 7x5 chess variant with card-based combat
- **Premium Card Effects** - Holographic, legendary, and 3D card visuals

## Documentation

| Document | Description |
|----------|-------------|
| [RULEBOOK.md](docs/RULEBOOK.md) | Complete game rules, card keywords, and mechanics |
| [GAME_FLOW.md](docs/GAME_FLOW.md) | Game flow diagrams and state management |
| [CLAUDE.md](CLAUDE.md) | Technical documentation for AI assistants |

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# TypeScript check
npm run check
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| State | Zustand 5 |
| Styling | Tailwind CSS 3.4 |
| 3D/Effects | React Three Fiber, Framer Motion, React Spring |
| UI Components | Radix UI (shadcn/ui) |
| Backend | Express + TypeScript |
| Database | PostgreSQL + Drizzle ORM |

## Project Structure

```
client/src/
├── game/
│   ├── components/     # Card, combat, chess components
│   ├── stores/         # Zustand state management
│   ├── data/           # Card definitions, heroes
│   │   ├── allCards.ts     # 1,300+ cards (single source)
│   │   ├── cardRegistry/   # Cards organized by ID range
│   │   └── norseHeroes/    # 76 playable heroes
│   ├── combat/         # Poker combat system
│   │   ├── RagnarokCombatArena.tsx
│   │   ├── PokerCombatStore.ts
│   │   └── modules/    # Hand evaluator, betting
│   ├── effects/        # Effect handlers (182 total)
│   │   └── handlers/   # battlecry/, deathrattle/, spellEffect/
│   └── types/          # TypeScript definitions
├── components/ui/      # Shared UI components
└── lib/                # Utilities and helpers
```

## Game Modes

### Standard Play
Classic card game with battlecries, deathrattles, and spell effects.

### Poker Combat
Each round uses Texas Hold'em mechanics:
- **Faith** (Flop) - 3 community cards revealed
- **Foresight** (Turn) - 4th community card
- **Destiny** (River) - 5th community card
- Hand rankings determine damage multipliers

### Ragnarok Chess
7x5 board where chess pieces represent heroes with card decks.

## Card System

| ID Range | Type |
|----------|------|
| 1000-3999 | Neutral Cards |
| 4000-8999 | Class Cards |
| 9000-9999 | Tokens |
| 20000-29999 | Norse Set |
| 90000-99999 | Heroes |

## Hero Classes

- **Offensive**: Mage, Warrior, Hunter, Rogue, Demon Hunter
- **Support**: Priest, Paladin, Druid
- **Control**: Warlock, Shaman
- **Special**: Death Knight, Necromancer

## Card Effects

### Battlecry (96 handlers)
Effects triggered when a card is played from hand.

### Deathrattle (16 handlers)
Effects triggered when a minion dies.

### Spell Effects (70 handlers)
Immediate effects from spell cards.

## Development

### Key Files
- `game/stores/gameStore.ts` - Main game state
- `game/combat/RagnarokCombatArena.tsx` - Combat UI
- `game/combat/PokerCombatStore.ts` - Poker mechanics
- `game/effects/handlers/` - Effect implementations
- `game/data/allCards.ts` - Card database (single source)

### Coding Standards
- Tabs for indentation
- camelCase for functions/variables
- PascalCase for components
- Small functions (20-30 lines max)
- Avoid magic strings; use constants

For AI/Claude Code developers, see `CLAUDE.md` for detailed architecture documentation.

## Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Bundle Sizes (gzip)
| Chunk | Size |
|-------|------|
| Initial load | ~100KB |
| React vendor | ~53KB |
| UI vendor | ~28KB |
| Animation vendor | ~38KB |
| Three.js (lazy) | ~250KB |
| Full game | ~286KB |

## Roadmap

### Phase 2 (Planned)
- Hive Keychain authentication
- NFT card ownership on Hive blockchain
- Multiplayer via WebSocket/PartyKit

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards in `CLAUDE.md`
4. Ensure `npm run build` passes
5. Submit a pull request

---

Built with React, TypeScript, and Norse mythology.
