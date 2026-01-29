# Ragnarok Combat Arena - Game Flow Documentation

This document details the complete game flow, state management, and system interactions.

## Game Flow Diagram

```
┌─────────────┐
│  Main Menu  │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Mode Selection  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────────┐  ┌────────────────┐
│ Ragnarok │  │ Standard Match │
│  Chess   │  └───────┬────────┘
└────┬─────┘          │
     │                ▼
     ▼         ┌──────────────┐
┌──────────┐   │Hero Selection│
│  Army    │   └──────┬───────┘
│Selection │          │
└────┬─────┘          ▼
     │         ┌──────────────┐
     ▼         │Deck Building │
┌──────────┐   └──────┬───────┘
│  Chess   │          │
│  Board   │          ▼
└────┬─────┘   ┌──────────────┐
     │         │Combat Arena  │
┌────┴────┐    └──────┬───────┘
│         │           │
▼         ▼           ▼
Attack  Winner ┌──────────────┐
 │             │Mulligan Phase│
 ▼             └──────┬───────┘
┌──────────┐          │
│  Poker   │          ▼
│ Combat   │   ┌──────────────┐
└────┬─────┘   │  Turn Loop   │◄────┐
     │         └──────┬───────┘     │
     ▼                │             │
Hero Death            ▼             │
     │         ┌──────────────┐     │
     ▼         │Victory/Defeat│─────┘
┌──────────┐   └──────────────┘   (if not)
│  Chess   │
│ Victory  │
└──────────┘
```

---

## Core State Management

### State Stores

| Store | File | Purpose | Lines |
|-------|------|---------|-------|
| **gameStore** | `gameStore.ts` | Card game state, turns, attacks | ~1,300 |
| **PokerCombatStore** | `PokerCombatStore.ts` | Poker phases, betting, resolution | ~2,500 |
| **ChessBoardStore** | `ChessBoardStore.ts` | Chess positions, moves, collisions | ~1,000 |
| **heroDeckStore** | `heroDeckStore.ts` | User-built decks per hero | ~400 |
| **animationStore** | `animationStore.ts` | Animation state orchestration | ~300 |
| **sharedDeckStore** | `sharedDeckStore.ts` | Shared deck for Ragnarok Chess | ~200 |
| **activityLogStore** | `activityLogStore.ts` | Event logging/history | ~150 |

---

## Mode 1: Ragnarok Chess Flow

### 1. Army Selection

```typescript
interface ArmySelection {
  king: ChessPieceHero;    // Choose from 9 Kings
  queen: ChessPieceHero;   // Mage/Warlock/Necromancer
  rook: ChessPieceHero;    // Warrior/Paladin
  bishop: ChessPieceHero;  // Priest/Druid
  knight: ChessPieceHero;  // Rogue/Hunter
}
```

**UI Component**: `ArmySelection.tsx`

### 2. Chess Board Initialization

```typescript
// Board: 7 rows × 5 columns
const BOARD_ROWS = 7;
const BOARD_COLS = 5;

// Player positions (rows 0-1)
const PLAYER_INITIAL_POSITIONS = [
  { type: 'knight', col: 0, row: 0 },
  { type: 'queen', col: 1, row: 0 },
  { type: 'king', col: 2, row: 0 },
  { type: 'bishop', col: 3, row: 0 },
  { type: 'rook', col: 4, row: 0 },
  { type: 'pawn', col: 0, row: 1 },
  // ... 5 pawns total
];

// Opponent positions (rows 5-6) - mirrored
```

**UI Component**: `RagnarokChessGame.tsx`, `ChessBoard.tsx`

### 3. Piece Movement

```typescript
// Movement patterns
PIECE_MOVEMENT_PATTERNS = {
  queen: { type: 'line', directions: [all 8 directions] },
  king: { type: 'surround', maxDistance: 1 },
  rook: { type: 'line', directions: [horizontal, vertical] },
  bishop: { type: 'line', directions: [diagonal] },
  knight: { type: 'l_shape' },
  pawn: { type: 'point', direction: forward, maxDistance: 1 }
}
```

### 4. Collision Detection

When piece moves to occupied square:

```typescript
interface ChessCollision {
  attacker: ChessPiece;
  defender: ChessPiece;
  attackerPosition: ChessBoardPosition;
  defenderPosition: ChessBoardPosition;
  instantKill?: boolean;  // Pawn attacks or King attacks
}
```

**Instant Kill Conditions:**
- Pawn attacks any piece → Instant kill
- Any piece attacks King → Instant kill
- All other collisions → Poker Combat

### 5. Poker Combat Flow

```
┌────────────┐
│  Mulligan  │ ← Replace hole cards
└─────┬──────┘
      ▼
┌────────────┐
│ Spell/Pet  │ ← Cast spells, use abilities
└─────┬──────┘
      ▼
┌────────────┐
│   Faith    │ ← 3 community cards (Flop)
│  (Flop)    │   Betting round
└─────┬──────┘
      ▼
┌────────────┐
│ Foresight  │ ← 4th card (Turn)
│  (Turn)    │   Betting round
└─────┬──────┘
      ▼
┌────────────┐
│  Destiny   │ ← 5th card (River)
│  (River)   │   Betting round
└─────┬──────┘
      ▼
┌────────────┐
│ Resolution │ ← Compare hands
│ (Showdown) │   Apply damage
└────────────┘
```

### 6. Hand Evaluation

```typescript
enum PokerHandRank {
  HIGH_CARD = 1,           // 1.0×
  RUNE_MARK = 2,           // One Pair - 1.05×
  DUAL_RUNES = 3,          // Two Pair - 1.1×
  THORS_HAMMER = 4,        // Three of a Kind - 1.15×
  FATES_PATH = 5,          // Straight - 1.2×
  ODINS_EYE = 6,           // Flush - 1.3×
  VALHALLAS_BLESSING = 7,  // Full House - 1.4×
  GODLY_POWER = 8,         // Four of a Kind - 1.6×
  DIVINE_ALIGNMENT = 9,    // Straight Flush - 1.8×
  RAGNAROK = 10            // Royal Flush - 2.0×
}
```

### 7. Combat Resolution

```typescript
interface CombatResolution {
  winner: 'player' | 'opponent' | 'draw';
  resolutionType: 'fold' | 'showdown';
  playerHand: EvaluatedHand;
  opponentHand: EvaluatedHand;
  playerDamage: number;
  opponentDamage: number;
  playerFinalHealth: number;
  opponentFinalHealth: number;
  foldPenalty?: number;      // 3 HP if folded
  whoFolded?: 'player' | 'opponent';
}
```

### 8. Chess Victory

- Capture enemy King
- Eliminate all enemy pieces
- Enemy cannot make legal move (stalemate = draw)

---

## Mode 2: Standard Match Flow

### 1. Hero Selection

Choose from 76 heroes across 12 classes.

**UI Component**: `HeroDetailPopup.tsx`

### 2. Deck Building

```typescript
// Deck constraints
const DECK_SIZE = 30;
const MAX_COPIES = 2;           // Per card
const MAX_LEGENDARY_COPIES = 1; // Legendaries only
const MAX_HAND_SIZE = 10;
const MAX_BOARD_SIZE = 7;
```

**UI Component**: `HeroDeckBuilder.tsx`

### 3. Mulligan Phase

- Draw initial hand (3 cards first, 4 cards second)
- Going second receives The Coin (0-cost, +1 mana)
- Replace unwanted cards

### 4. Turn Loop

```typescript
// Turn structure
interface TurnPhase {
  drawCard: boolean;           // Draw 1 card
  gainManaCrystal: boolean;    // +1 mana (max 10)
  refreshMana: boolean;        // Restore all mana
  unfreezeMinions: boolean;    // Thaw frozen minions
  mainPhase: boolean;          // Play cards, attack
  endOfTurn: boolean;          // Trigger effects
}
```

### 5. Combat System

```typescript
// Attack resolution
function resolveAttack(attacker: Minion, defender: Minion) {
  // Check for Stealth
  if (defender.hasKeyword('stealth')) {
    throw new Error('Cannot target stealthed minion');
  }
  
  // Check for Taunt
  if (boardHasTaunt() && !defender.hasKeyword('taunt')) {
    throw new Error('Must attack Taunt first');
  }
  
  // Deal damage
  defender.health -= attacker.attack;
  attacker.health -= defender.attack;
  
  // Lifesteal
  if (attacker.hasKeyword('lifesteal')) {
    healHero(attacker.owner, attacker.attack);
  }
  
  // Poisonous
  if (attacker.hasKeyword('poisonous') && defender.health > 0) {
    defender.health = 0;
  }
  
  // Divine Shield
  if (defender.hasKeyword('divine_shield')) {
    defender.health += attacker.attack; // Negate damage
    defender.removeKeyword('divine_shield');
  }
  
  // Check deaths
  if (defender.health <= 0) triggerDeathrattle(defender);
  if (attacker.health <= 0) triggerDeathrattle(attacker);
}
```

---

## Effect System

### Effect Handlers

```
client/src/game/effects/handlers/
├── battlecry/     # 96 handlers
├── deathrattle/   # 16 handlers
└── spellEffect/   # 70 handlers
```

### Battlecry Examples

```typescript
// Example battlecry types
type BattlecryType =
  | 'damage'           // Deal damage to target
  | 'heal'             // Heal target
  | 'buff'             // Give +Attack/+Health
  | 'summon'           // Summon minion(s)
  | 'draw'             // Draw card(s)
  | 'discover'         // Discover a card
  | 'silence'          // Silence a minion
  | 'freeze'           // Freeze target(s)
  | 'mind_control'     // Take control of minion
  | 'transform'        // Transform minion
  | 'conditional_full_heal'  // Reno effect
  | 'kazakus_potion';        // Kazakus effect
```

### Deathrattle Examples

```typescript
type DeathrattleType =
  | 'summon'            // Summon on death
  | 'draw'              // Draw on death
  | 'damage'            // Deal damage on death
  | 'heal'              // Heal on death
  | 'buff'              // Buff friendly minions
  | 'give_divine_shield'// Grant divine shield
  | 'mind_control';     // N'Zoth style effects
```

---

## Animation System

### Animation Orchestrator

```typescript
interface AnimationState {
  activeAnimations: Animation[];
  pendingEffects: Effect[];
  isBlocked: boolean;
}

// Animation types
type AnimationType =
  | 'card_play'
  | 'attack'
  | 'damage'
  | 'heal'
  | 'death'
  | 'summon'
  | 'spell_cast'
  | 'poker_card_reveal'
  | 'showdown';
```

### Animation Flow

1. Action triggers animation
2. AnimationOverlay renders visual
3. Animation completes
4. State updates
5. Next animation or unlock

---

## Activity Logging

### Event Types

```typescript
type ActivityEventType =
  | 'spell_cast'
  | 'minion_played'
  | 'minion_summoned'
  | 'minion_attack'
  | 'minion_death'
  | 'hero_attack'
  | 'hero_damage'
  | 'hero_power'
  | 'card_draw'
  | 'card_burn'
  | 'battlecry'
  | 'deathrattle'
  | 'poker_bet'
  | 'poker_check'
  | 'poker_fold'
  | 'poker_phase'
  | 'poker_resolution'
  | 'heal'
  | 'buff'
  | 'secret_triggered'
  | 'weapon_equipped'
  | 'turn_start'
  | 'turn_end';
```

### Event Categories

- **Minion Events**: Card game actions
- **Poker Events**: Poker combat actions

---

## File Structure Reference

```
client/src/
├── core/                       # Pure game logic module
│   └── index.ts                # Re-exports for separation
├── game/
│   ├── components/             # UI Components
│   │   ├── chess/              # Chess board, pieces
│   │   ├── 3D/                 # 3D card effects
│   │   ├── packs/              # Pack opening
│   │   └── ui/                 # Tooltips, buttons
│   ├── stores/                 # Zustand state
│   ├── data/                   # Card/hero definitions
│   │   ├── allCards.ts         # 1,300+ cards
│   │   └── norseHeroes/        # 76 heroes
│   ├── combat/                 # Combat system
│   │   ├── RagnarokCombatArena.tsx
│   │   ├── PokerCombatStore.ts
│   │   └── styles/             # CSS architecture
│   ├── effects/                # Effect handlers
│   ├── types/                  # TypeScript types
│   └── utils/                  # Game utilities
└── pages/                      # Route pages
```

---

*This document is part of the Ragnarok Combat Arena open-source project.*
