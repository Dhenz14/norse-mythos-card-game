# Ragnarok Combat Arena - Complete Rulebook

> A comprehensive guide to the Norse mythology card game combining strategic chess, poker combat, and Hearthstone-style card mechanics.

## Table of Contents

1. [Game Overview](#game-overview)
2. [Game Modes](#game-modes)
3. [Heroes & Classes](#heroes--classes)
4. [Card System](#card-system)
5. [Ragnarok Chess](#ragnarok-chess)
6. [Poker Combat System](#poker-combat-system)
7. [Standard Match Rules](#standard-match-rules)
8. [Keywords & Abilities](#keywords--abilities)
9. [Status Effects](#status-effects)
10. [Element System](#element-system)
11. [Deck Building](#deck-building)
12. [Glossary](#glossary)

---

## Game Overview

Ragnarok Combat Arena is a multi-mythology digital collectible card game featuring:

- **1,300+ collectible cards** across 4 mythological factions (Norse, Greek, Japanese/Shinto, Egyptian)
- **76 playable heroes** across 12 classes
- **Two distinct game modes**: Ragnarok Chess and Standard Match
- **Poker-inspired combat** with Texas Hold'em mechanics
- **Strategic deck building** with class-specific and neutral cards

### Core Concept

Players engage in strategic battles using heroes from various mythologies. Each hero has unique abilities, and combat is resolved through a hybrid poker/card battle system that rewards both skill and calculated risk.

---

## Game Modes

### Ragnarok Chess Mode

A strategic chess variant where pieces represent heroes. When pieces collide, combat is resolved through the Poker Combat System.

**Flow:**
```
Main Menu → Mode Selection → Ragnarok Chess → Army Selection → Chess Board → Attack → Poker Combat → Hero Death → Chess Victory
```

### Standard Match Mode

Classic Hearthstone-style 1v1 card battles without the chess layer.

**Flow:**
```
Main Menu → Mode Selection → Standard Match → Hero Selection → Deck Building → Combat Arena → Mulligan Phase → Turn Loop → Victory/Defeat
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

1. **Hero Power** (2 mana) - Repeatable ability usable once per turn
2. **Weapon Upgrade** (one-time) - Equips a weapon to the hero
3. **Passive Ability** - Always-active effect

### Mythological Factions

- **Norse**: Odin, Thor, Loki, Freya, Baldur, Hel, Fenrir, and more
- **Greek**: Zeus, Athena, Hades, Poseidon, Ares, Apollo, Artemis
- **Japanese (Shinto)**: Amaterasu, Susanoo, Tsukuyomi, Raijin, Fujin
- **Egyptian**: Ra, Anubis, Osiris, Isis, Set, Horus, Thoth

---

## Card System

### Card Types

| Type | Description |
|------|-------------|
| **Minion** | Creatures that can attack and be attacked. Have Attack and Health stats. |
| **Spell** | One-time effects that are cast and discarded. |
| **Weapon** | Equipment for heroes. Have Attack and Durability. |
| **Hero Card** | Replaces your hero with a new one (new hero power, armor). |

### Card Rarity

| Rarity | Color | Dust (Craft) | Dust (Disenchant) |
|--------|-------|--------------|-------------------|
| Common | Gray | 40 | 5 |
| Rare | Blue | 100 | 20 |
| Epic | Purple | 400 | 100 |
| Legendary | Orange | 1600 | 400 |
| Token | Gray (darker) | N/A | N/A |

### Card ID Ranges

| Range | Category |
|-------|----------|
| 1000-1999 | Base Neutral Minions |
| 2000-2999 | Rare/Epic Neutrals |
| 3000-3999 | Epic Neutrals & Giants |
| 4000-4499 | Necromancer Class |
| 4300-4399 | Norse Legendary Creatures |
| 4500-4999 | Neutral Spells |
| 5000-5999 | Warrior Class |
| 6000-6999 | Mage Class |
| 7000-7999 | Hunter Class |
| 8000-8999 | Other Classes |
| 9000-9999 | Tokens (non-collectible) |
| 20000-29999 | Norse Mythology Set |

---

## Ragnarok Chess

### Board Layout

The Ragnarok Chess board is a **7×5 grid**:
- Rows 0-1: Player's pieces
- Rows 2-4: Empty (strategic maneuvering space)
- Rows 5-6: Opponent's pieces

### Piece Types & Starting Positions

**Player (Rows 0-1):**
```
Row 0: Knight | Queen | King | Bishop | Rook
Row 1: Pawn  | Pawn  | Pawn | Pawn   | Pawn
```

**Opponent (Rows 5-6) - Mirrored:**
```
Row 5: Pawn  | Pawn  | Pawn | Pawn   | Pawn
Row 6: Rook  | Bishop| King | Queen  | Knight
```

### Piece Stats

| Piece | Base Health | Spell Slots | Has Spells |
|-------|-------------|-------------|------------|
| King | 100 HP | 0 | No |
| Queen | 100 HP | 33 | Yes |
| Rook | 100 HP | 30 | Yes |
| Bishop | 100 HP | 30 | Yes |
| Knight | 100 HP | 30 | Yes |
| Pawn | 100 HP | 0 | No |

### Movement Patterns

| Piece | Movement |
|-------|----------|
| **Queen** | Any direction (horizontal, vertical, diagonal), unlimited distance |
| **King** | Any direction, 1 square only |
| **Rook** | Horizontal and vertical only, unlimited distance |
| **Bishop** | Diagonal only, unlimited distance |
| **Knight** | L-shape (2+1 squares), can jump over pieces |
| **Pawn** | Forward only, 1 square |

### Combat Rules

When a piece moves to a square occupied by an enemy piece:

1. **Pawn vs Any / Any vs King**: Instant kill (Valkyrie Weapon rule)
2. **Major Piece vs Major Piece**: Triggers Poker Combat

### Stamina System

- Each piece has Stamina = Health ÷ 10 (e.g., 100 HP = 10 Stamina)
- Moving a piece grants +1 Stamina to ALL friendly pieces
- Stamina is used for betting in Poker Combat

### Check & Checkmate

- **Check**: King is threatened by enemy piece
- **Checkmate**: King cannot escape check = Game Over
- Kings cannot attack (they can only be captured via instant kill)

### Victory Conditions

- Capture the enemy King (checkmate)
- Eliminate all enemy pieces

---

## Poker Combat System

When major pieces collide in Ragnarok Chess, combat is resolved through a Texas Hold'em inspired system.

### Combat Phases

| Phase | Poker Equivalent | Description |
|-------|------------------|-------------|
| **Mulligan** | - | Replace cards from hand (optional) |
| **Spell/Pet** | Pre-deal | Cast spells, activate abilities |
| **Faith** | Flop | 3 community cards revealed |
| **Foresight** | Turn | 4th community card revealed |
| **Destiny** | River | 5th community card revealed |
| **Resolution** | Showdown | Compare hands, resolve damage |

### Hand Rankings (Norse Theme)

| Rank | Norse Name | Poker Name | Damage Multiplier |
|------|------------|------------|-------------------|
| 1 | High Card | High Card | 1.0× |
| 2 | Rune Mark | One Pair | 1.05× |
| 3 | Dual Runes | Two Pair | 1.1× |
| 4 | Thor's Hammer | Three of a Kind | 1.15× |
| 5 | Fate's Path | Straight | 1.2× |
| 6 | Odin's Eye | Flush | 1.3× |
| 7 | Valhalla's Blessing | Full House | 1.4× |
| 8 | Godly Power | Four of a Kind | 1.6× |
| 9 | Divine Alignment | Straight Flush | 1.8× |
| 10 | **RAGNAROK** | Royal Flush | 2.0× |

### Betting Actions

| Action | Poker Equivalent | Effect | Stamina Cost |
|--------|------------------|--------|--------------|
| **Attack** | Bet | Commit HP to deal damage | Variable (based on amount) |
| **Counter Attack** | Raise | Increase attack commitment | Variable |
| **Engage** | Call | Match opponent's attack | FREE |
| **Brace** | Fold | Defensive stance, take penalty | 1 Stamina |
| **Defend** | Check | No action, maintain position | FREE (+1 Stamina gain) |

### Blind Structure

- **Big Blind**: 5 HP
- **Small Blind**: 2.5 HP
- **Ante**: 0.2 HP per player

**Starting Pot**: ~7.9 HP (SB 2.7 + BB 5.2)

### Combat Resolution

1. Both players reveal their best 5-card hand (2 hole cards + 5 community cards)
2. Higher-ranked hand wins
3. Winner deals damage based on pot × hand multiplier
4. Loser takes the damage to their piece's HP
5. If piece HP reaches 0, the piece is eliminated

### Fold Penalty

Folding (Brace) results in:
- Immediate loss of the hand
- 3 HP penalty damage
- Opponent wins the pot

---

## Standard Match Rules

### Setup

1. Each player starts with 30 HP
2. Draw 3 cards (going first) or 4 cards + The Coin (going second)
3. Mulligan phase: Replace unwanted cards

### Turn Structure

1. **Start of Turn**
   - Draw a card
   - Gain a mana crystal (max 10)
   - Refresh mana crystals
   - Unfreeze frozen minions

2. **Main Phase**
   - Play cards (costs mana)
   - Attack with minions/hero
   - Use Hero Power (2 mana)
   - Activate effects

3. **End of Turn**
   - Trigger end-of-turn effects
   - Opponent's turn begins

### Mana System

- Start with 1 mana crystal
- Gain 1 mana crystal per turn
- Maximum 10 mana crystals
- All mana refreshes at start of turn

### Attack Rules

- Minions have **Summoning Sickness** (cannot attack the turn they're played)
- Exceptions: **Charge** (attack anything) and **Rush** (attack minions only)
- Must attack **Taunt** minions first if present
- Hero can attack with weapons

### Board Limit

- Maximum 7 minions per side
- Hand limit: 10 cards (excess cards are burned)
- Deck limit: 30 cards

---

## Keywords & Abilities

### Triggered Effects

| Keyword | Icon | Description |
|---------|------|-------------|
| **Battlecry** | ⚔️ | Triggers when you play this card from your hand |
| **Deathrattle** | 💀 | Triggers when this minion dies |
| **Combo** | 🎭 | Bonus effect if you played another card first this turn |
| **Inspire** | 💫 | Triggers each time you use your Hero Power |
| **Frenzy** | 😤 | Triggers the first time this survives damage |
| **Spellburst** | ✴️ | Triggers after you cast a spell (once per game) |
| **Overkill** | 💥 | Triggers when dealing excess lethal damage |
| **Outcast** | ↔️ | Bonus if this is the leftmost or rightmost card in hand |

### Persistent Effects

| Keyword | Icon | Description |
|---------|------|-------------|
| **Taunt** | 🛡️ | Enemies must attack this minion first |
| **Divine Shield** | ✨ | The first damage this minion takes is ignored |
| **Stealth** | 👁️ | Cannot be targeted until it attacks |
| **Windfury** | 🌪️ | Can attack twice each turn |
| **Lifesteal** | ❤️ | Damage dealt also heals your hero |
| **Poisonous** | ☠️ | Destroy any minion damaged by this |
| **Reborn** | ♻️ | Returns to life with 1 Health |

### Action Keywords

| Keyword | Icon | Description |
|---------|------|-------------|
| **Charge** | ⚡ | Can attack immediately |
| **Rush** | 🏃 | Can attack minions immediately |
| **Freeze** | ❄️ | Frozen characters lose their next attack |
| **Silence** | 🔇 | Removes all card text and enchantments |
| **Discover** | 🔍 | Choose one of three cards to add to your hand |
| **Adapt** | 🦎 | Choose one of three bonuses |

### Resource Keywords

| Keyword | Icon | Description |
|---------|------|-------------|
| **Overload** | ⚡ | Locks some mana crystals next turn |
| **Spell Damage** | 🔮 | Your spells deal extra damage |
| **Echo** | 🔊 | Can be played multiple times per turn |
| **Tradeable** | 🔄 | Drag to deck to spend 1 mana and draw a new card |

### Special Keywords

| Keyword | Icon | Description |
|---------|------|-------------|
| **Secret** | ❓ | Hidden until a specific action occurs |
| **Dormant** | 💤 | Starts asleep, awakens after 2 turns |
| **Colossal** | 🦑 | Summons additional appendage minions |
| **Corrupt** | 🌀 | Upgrades in hand after playing a higher-cost card |
| **Magnetic** | 🧲 | Attach to a friendly Mech |

---

## Status Effects

Status effects apply temporary conditions to pieces/heroes during combat.

| Effect | Icon | Duration | Description |
|--------|------|----------|-------------|
| **Poisoned** | ☠️ | Ticks | 3% max HP damage per turn |
| **Burning** | 🔥 | Ticks | 5% max HP damage per turn |
| **Frozen** | ❄️ | 1+ turns | Cannot attack or use abilities |
| **Blessed** | ✨ | Ticks | 2% max HP regeneration per turn |
| **Cursed** | 💀 | Varies | Reduced effectiveness |
| **Shielded** | 🛡️ | Until broken | Absorbs damage |
| **Enraged** | 😤 | Varies | Increased damage dealt |

---

## Element System

Heroes and pieces have elemental affinities that create strategic matchups.

### Element Wheel

```
Fire → Earth → Wind → Water → Fire
         
Holy ⟷ Shadow (mutual counter)
```

### Element Strengths

| Element | Strong Against | Weak Against |
|---------|----------------|--------------|
| 🔥 Fire | Earth | Water |
| 💧 Water | Fire | Wind |
| 🌪️ Wind | Water | Earth |
| 🌍 Earth | Wind | Fire |
| ✨ Holy | Shadow | Shadow |
| 🌑 Shadow | Holy | Holy |
| ⚪ Neutral | None | None |

### Elemental Advantage Bonus

When attacking with elemental advantage:
- **+2 Attack** bonus
- **+2 Health** bonus to minions

### Element Colors

| Element | Color Code |
|---------|------------|
| Fire | #ff6b35 (Orange-red) |
| Water | #4fc3f7 (Light blue) |
| Wind | #81c784 (Light green) |
| Earth | #a1887f (Brown) |
| Holy | #ffd54f (Gold) |
| Shadow | #9c27b0 (Purple) |
| Neutral | #9e9e9e (Gray) |

---

## Deck Building

### Basic Rules

- **30 cards** per deck
- Maximum **2 copies** of any card (except Legendaries)
- Maximum **1 copy** of Legendary cards
- Can include **class cards** and **neutral cards**
- Cannot include cards from other classes

### Highlander Decks

Special deck archetype with no duplicate cards:
- Enables powerful **Highlander effects** (Reno Jackson, Kazakus, etc.)
- Requires exactly 1 copy of each card
- Rewards unique deck building

### Deck Archetypes

| Archetype | Strategy |
|-----------|----------|
| **Aggro** | Fast, cheap minions. Win before turn 7. |
| **Midrange** | Balanced curve. Contest board, then finish. |
| **Control** | Removal and healing. Outlast opponent. |
| **Combo** | Build to specific card combination for massive damage. |
| **Tempo** | Efficient trades. Maximize mana each turn. |

### Army Selection (Ragnarok Chess)

For Ragnarok Chess mode, select heroes for each piece slot:

| Slot | Options |
|------|---------|
| **King** | Choose from 9 Norse Kings (passive abilities) |
| **Queen** | Mage, Warlock, or Necromancer heroes |
| **Rook** | Warrior or Paladin heroes |
| **Bishop** | Priest or Druid heroes |
| **Knight** | Rogue or Hunter heroes |

---

## Glossary

| Term | Definition |
|------|------------|
| **AoE** | Area of Effect - affects multiple targets |
| **Board** | The play area where minions are placed |
| **Buff** | Positive stat modification (+Attack, +Health) |
| **Burn** | Cards drawn with a full hand are destroyed |
| **Debuff** | Negative stat modification (-Attack, -Health) |
| **Face** | Attacking the enemy hero directly |
| **Fatigue** | Damage taken when drawing from empty deck |
| **Hand** | Cards currently held (max 10) |
| **Hole Cards** | Your 2 private poker cards |
| **HP** | Health Points |
| **Lethal** | Enough damage to kill the opponent |
| **Mana** | Resource used to play cards |
| **Minion** | A creature card on the board |
| **OTK** | One Turn Kill - winning in a single turn |
| **Pot** | Total HP committed in poker combat |
| **Showdown** | Final hand comparison in poker combat |
| **Stamina** | Resource for poker betting (HP ÷ 10) |
| **Token** | Non-collectible minion created by effects |
| **Trade** | Attacking enemy minion with your minion |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial rulebook release |

---

*This rulebook is part of the Ragnarok Combat Arena open-source project.*
*For technical documentation, see CLAUDE.md*
