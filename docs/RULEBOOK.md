# Ragnarok Combat Arena - Complete Rulebook

> A comprehensive guide to the Norse mythology card game combining strategic chess, poker combat, and Hearthstone-style card mechanics.

## Table of Contents

1. [Game Overview](#game-overview)
2. [Game Modes](#game-modes)
3. [Heroes & Classes](#heroes--classes)
4. [Card System](#card-system)
5. [Ragnarok Chess](#ragnarok-chess)
   - [King Divine Command System](#king-divine-command-system)
6. [Poker Combat System](#poker-combat-system)
   - [Poker Spells](#poker-spells)
7. [Standard Match Rules](#standard-match-rules)
8. [Keywords & Abilities](#keywords--abilities)
9. [Norse Mechanics](#norse-mechanics)
   - [Blood Price](#blood-price)
   - [Einherjar](#einherjar)
   - [Prophecy](#prophecy)
   - [Realm Shift](#realm-shift)
   - [Ragnarok Chain](#ragnarok-chain)
   - [Pet Evolution System](#pet-evolution-system)
10. [Status Effects](#status-effects)
11. [Element System](#element-system)
12. [Deck Building](#deck-building)
13. [Glossary](#glossary)

---

## Game Overview

Ragnarok Combat Arena is a multi-mythology digital collectible card game featuring:

- **1,300+ collectible cards** across 2 mythological factions (Norse, Greek)
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
| **Berserker** | Attack buffs, outcast | Surtr, Muspel |
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
| 9000-9099 | Tokens (non-collectible) |
| 9100-9149 | Poker Spells |
| 9200-9249 | Pet Tokens |
| 20000-29799 | Norse Mythology Set |
| 29800-29809 | Hero Artifacts |
| 29810-29899 | Armor Gear |
| 29900-29967 | Hero Artifacts (Extended) |
| 30001-30008 | Blood Price Cards |
| 30101-30107 | Prophecy Cards |
| 30201-30206 | Einherjar Cards |
| 30301-30309 | Realm Shift Cards |
| 30401-30410 | Ragnarok Chain Cards |
| 50000-50699 | Pet Evolution Cards |

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

### King Divine Command System

Each of the 9 Primordial Norse Kings possesses a unique **Divine Command** ability - the power to place hidden landmine traps on the battlefield that drain enemy Stamina when triggered.

#### Core Mechanics

| Rule | Value |
|------|-------|
| **Uses Per Game** | 5 mines maximum |
| **Uses Per Turn** | 1 mine maximum |
| **Mine Duration** | 2 turns (expires if not triggered) |
| **STA Penalty** | 2-3 STA when enemy lands on affected tile |
| **Visibility** | Only visible to the placing player |

#### The 9 Primordial Kings

| King | Mine Shape | Description |
|------|------------|-------------|
| **Ymir** | Single Tile | Giant Reach: Place a trap on any single tile. -2 STA if triggered. |
| **Buri** | 4-Tile Line | Ice Emergence: 4-tile line trap (choose direction). -2 STA per tile landed. |
| **Surtr** | 3×3 Area | Flame Burst: 3×3 area trap centered on chosen tile. -2 STA center, -1 STA edges. |
| **Borr** | Full Rank/File | Ancestral Path: Full rank or file trap (7 tiles). -2 STA if triggered. |
| **Yggdrasil** | Cross Pattern | Root Spread: Cross-shaped trap (5 tiles). -2 STA if triggered. |
| **Auðumbla** | L-Shape | Primal Flow: L-shaped trap pattern. -2 STA if triggered. |
| **Blainn** | Diagonal Line | Shadow Forge: 4-tile diagonal line trap. -2 STA if triggered. |
| **Brimir** | Circle Pattern | Ocean Ring: Circular trap pattern around center. -2 STA if triggered. |
| **Ginnungagap** | Random Scatter | Void Whisper: Random tile scatter (unpredictable). -3 STA if triggered. |

#### Strategic Considerations

- Mines do NOT trigger on friendly pieces
- Mines are invisible to opponents until triggered
- Place mines on likely movement paths (center columns, advancement routes)
- Kings with larger patterns (Surtr, Borr) offer area denial
- Kings with precise patterns (Ymir, Blainn) offer tactical placement
- Triggered mines apply STA penalty before any combat resolution

### Victory Conditions

- Capture the enemy King (checkmate)
- Eliminate all enemy pieces

---

## Poker Combat System

When major pieces collide in Ragnarok Chess, combat is resolved through a Texas Hold'em inspired system.

### First Strike

The attacking piece deals **15 damage** before poker betting begins:

- Occurs at the start of combat, before Mulligan phase
- Represents the tactical advantage of initiating combat
- Cannot be blocked or reduced by armor
- Applied to defender's HP immediately

### Combat Phases

| Phase | Poker Equivalent | Description |
|-------|------------------|-------------|
| **First Strike** | - | Attacker deals 15 damage to defender |
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

- **Small Blind (SB)**: 5 HP
- **Big Blind (BB)**: 10 HP
- **Ante**: 0.5 HP per player

**Starting Pot**: 16 HP (SB 5 + BB 10 + Ante 0.5 × 2)

> **Source of Truth**: `client/src/game/combat/modules/BettingEngine.ts` - BLINDS constant

### Combat Resolution (Option A Rules)

This game uses a **survival-based poker system** where HP is deducted during betting:

1. **HP is deducted during betting** - When you commit HP to the pot, it's immediately subtracted from your health
2. Both players reveal their best 5-card hand (2 hole cards + 5 community cards)
3. Higher-ranked hand wins
4. **Winner heals** - Recovers only their own committed HP (not the opponent's)
5. **Loser keeps loss** - Does not recover their committed HP
6. If piece HP reaches 0, the piece is eliminated

**Example Showdown:**
```
Player commits 30 HP → Player HP: 100 → 70
AI commits 20 HP → AI HP: 100 → 80

Player wins with Odin's Eye (Flush):
- Player heals 30 HP → Player HP: 70 → 100
- AI keeps loss → AI HP: 80 (lost 20 HP permanently)
```

### Fold Penalty

Folding (Brace) results in:
- **Already committed HP is lost** - No recovery for the folder
- **Winner heals** - Recovers their own committed HP
- **Stamina Penalty**: -1 STA
- Armor absorbs damage first, then remaining damage applies to HP

**Example Fold:**
```
Player commits 20 HP, then folds:
- Player HP: 100 → 80 (20 HP lost permanently)
- Opponent recovers their committed HP
- Player loses 1 STA
```

> **Source of Truth**: `client/src/game/stores/combat/pokerCombatSlice.ts` - resolvePokerShowdown function

### Poker Spells

Poker Spells are a special card type that affects the psychological and informational aspects of poker combat **without changing pot odds or damage calculations**. They add strategic depth through bluffing, information asymmetry, and variance control.

#### Casting Timing

Poker Spells are cast during the **Spell/Pet Phase** (before the Faith phase). Each spell has a timing property:

| Timing | When Effect Applies |
|--------|---------------------|
| **pre_deal** | During Spell/Pet phase, before community cards |
| **on_bet** | When a betting action occurs |
| **on_fold** | When a player folds |
| **on_all_in** | When all-in is declared |
| **on_river** | During the Destiny (River) phase |

#### Spell Effects by Class

**Neutral Spells** (All Classes):

| Card | Mana | Effect |
|------|------|--------|
| **Bluff Rune** | 2 | Gain a Bluff token. Spend it to fake a raise - opponent sees increased pot but your actual commitment is unchanged |
| **Fate Peek** | 1 | Reveal 1 of opponent's hole cards for this combat |
| **Stamina Shield** | 1 | Your next fold costs 1 less STA |

**Rogue Spells** (Deception):

| Card | Mana | Effect |
|------|------|--------|
| **Hole Swap** | 2 | Swap 1 of your hole cards with 1 of opponent's (random) |
| **Echo Bet** | 2 | Your next bet action is repeated for free |
| **Shadow Fold** | 1 | If you fold, your hand stays hidden |

**Mage Spells** (Variance Control):

| Card | Mana | Effect |
|------|------|--------|
| **Run It Twice** | 3 | If all-in occurs, deal community cards twice and average hand strength |
| **River Rewrite** | 4 | After River is revealed, reroll it once |
| **Norns' Glimpse** | 2 | Peek at the next community card before it's revealed |

**Warlock Spells** (Punishment):

| Card | Mana | Effect |
|------|------|--------|
| **Fold Curse** | 3 | If opponent folds, they lose 1 additional STA |
| **Blood Bet** | 2 | Pay 1 STA: Force opponent to match your bet or fold immediately |
| **Void Stare** | 2 | Nullify opponent's next Bluff token |

**Legendary Spells** (Game Changers):

| Card | Mana | Effect |
|------|------|--------|
| **All-In Aura** | 5 | Your next all-in gains +0.1× damage multiplier |
| **Ragnarok Gambit** | 4 | Reveal all hole cards for both players. Skip remaining betting, go to showdown |
| **Destiny Override** | 5 | Choose the River card from 3 random options |

> **Source of Truth**: `client/src/game/data/pokerSpellCards.ts` - ID range 9100-9149

---

## Standard Match Rules

### Setup

1. Each player starts with 100 HP
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
| **Rune** | ❓ | Hidden enchantment that triggers when a specific condition is met |
| **Dormant** | 💤 | Starts asleep, awakens after 2 turns |
| **Colossal** | 🦑 | Summons additional appendage minions |
| **Corrupt** | 🌀 | Upgrades in hand after playing a higher-cost card |
| **Runic Bond** | 🧲 | Attach to a friendly Automaton to combine stats and abilities |
| **Yggdrasil Golem** | 🌲 | Summons an Yggdrasil Golem that grows stronger with each one summoned |
| **Einherjar** | 🔁 | When this dies, shuffle a copy into your deck with +1/+1 (max 3 returns) |
| **Blood Price** | 🩸 | Can be played by paying health instead of mana |
| **Prophecy** | ⏳ | Creates a visible countdown that triggers an effect when it reaches 0 |

---

## Norse Mechanics

Six unique mechanics inspired by Norse mythology, each adding a distinct strategic layer to gameplay.

### Blood Price

Cards with Blood Price can be played by sacrificing health instead of mana. Right-click a Blood Price card to toggle between mana and health payment.

| Rule | Detail |
|------|--------|
| **Payment** | Pay the card's `bloodPrice` value in hero health |
| **Survival** | Hero must have more health than the blood cost (cannot kill yourself) |
| **Toggle** | Right-click to switch between mana and blood payment |
| **Mana** | Blood payment skips mana cost entirely |

**Example**: *Odin's Sacrifice* (Blood Price 8) - Draw 3 cards, gain +2 Spell Damage. Pay 8 health instead of mana.

**Design Theme**: "Odin gave his eye for wisdom. Tyr gave his hand for peace. What will you sacrifice?"

### Einherjar

Einherjar minions embody the Norse warriors who fight, die, and rise again in Valhalla - stronger each time.

| Rule | Detail |
|------|--------|
| **On Death** | Shuffle a copy into your deck with +1/+1 |
| **Max Returns** | Each card can return up to 3 times |
| **Name Suffix** | Risen, Risen II, Risen III |
| **Generation Track** | Internal counter prevents infinite loops |

**Example**: *Einherjar Recruit* (1 mana, 1/1) dies, shuffles back as *Einherjar Recruit (Risen)* (1 mana, 2/2).

### Prophecy

Prophecy spells create visible countdown timers on the board. Both players can see and plan around them.

| Rule | Detail |
|------|--------|
| **Countdown** | Decrements by 1 at the end of each turn |
| **Trigger** | Effect fires automatically when countdown reaches 0 |
| **Visibility** | Both players see the prophecy and its remaining turns |
| **Owner** | The caster benefits from directional effects |

**Prophecy Cards:**

| Card | Cost | Countdown | Effect |
|------|------|-----------|--------|
| Norn's Decree | 3 | 3 turns | Destroy all minions with 3 or less Attack |
| Ragnarok Herald | 4 | 2 turns | Deal 5 damage to both heroes |
| Fimbulwinter's Grip | 3 | 3 turns | Freeze all minions |
| Twilight of the Gods | 8 | 4 turns | Destroy ALL minions and weapons |
| Idunn's Renewal | 5 | 3 turns | Heal friendly hero for 8 |
| Einherjar Summons | 6 | 3 turns | Summon a 5/5 Einherjar Champion with Taunt |
| Skadi's Storm | 4 | 2 turns | Deal 3 damage to all enemy minions |

### Realm Shift

Realm Shift spells change the active battlefield realm, applying board-wide rule changes that affect both players equally. Only one realm can be active at a time.

| Rule | Detail |
|------|--------|
| **Active Realm** | Only one realm at a time; new realm replaces old |
| **Symmetry** | Both players are affected by realm effects |
| **Persistence** | Realm stays active until replaced or cleared |
| **Clear** | Gate to Midgard removes the active realm |

**The Nine Realms:**

| Realm | Class | Cost | Effect |
|-------|-------|------|--------|
| **Niflheim** | Shaman | 3 | All minions have -2 Attack |
| **Muspelheim** | Mage | 3 | All minions take 1 damage at end of turn |
| **Asgard** | Paladin | 4 | Your minions +1 Attack, enemy spells cost (1) more |
| **Helheim** | Necromancer | 3 | Minions return to owner's hand costing (2) more when they die |
| **Vanaheim** | Druid | 3 | All minions restore 2 Health at start of turn |
| **Jotunheim** | Warrior | 4 | All minions +2 Attack but -1 Health |
| **Alfheim** | Neutral | 2 | All minions have Elusive (can't be targeted by spells) |
| **Svartalfheim** | Rogue | 3 | Newly played minions have Stealth |
| **Midgard** | Neutral | 2 | Remove active realm, restore minions to base stats |

### Ragnarok Chain

Paired minions with linked destiny mechanics. When one partner dies or triggers, the other transforms or activates. Both players can see chain links.

| Rule | Detail |
|------|--------|
| **Partner Link** | Each chain card references its partner by card ID |
| **On Both In Play** | Passive buff when both partners are on the battlefield |
| **On Partner Death** | Triggered effect when the linked partner dies |
| **Cross-Side** | Chain effects trigger regardless of which side the partner is on |

**The Five Mythological Pairs:**

| Pair | Cards | On Both In Play | On Partner Death |
|------|-------|-----------------|------------------|
| **Fenrir & Gleipnir** | 30401, 30402 | - | Fenrir: +5/+5 and Rush |
| **Skoll & Hati** | 30403, 30404 | - | Survivor: +3/+3 |
| **Huginn & Muninn** | 30405, 30406 | Both +2/+2 | Draw 2 cards |
| **Nidhogg & Ratatoskr** | 30407, 30408 | Nidhogg +3 Attack | Nidhogg: transform to 6/6 |
| **Ask & Embla** | 30409, 30410 | Both gain Divine Shield | Survivor: +2 Health, Taunt |

### Pet Evolution System

Elemental pet companions that evolve during gameplay when specific conditions are met.

#### Elements

| Element | Color | Weakness |
|---------|-------|----------|
| Fire | #ff6b35 | Water |
| Water | #4fc3f7 | Electric |
| Grass | #66bb6a | Fire |
| Electric | #fdd835 | Grass |
| Dark | #9c27b0 | Light |
| Light | #ffd54f | Dark |
| Neutral | #9e9e9e | None |

#### Evolution Rules

| Rule | Detail |
|------|--------|
| **Stages** | Basic -> Evolution (play evolution card when condition met) |
| **Condition Triggers** | on_deal_damage, on_heal_ally, on_survive_turn, on_destroy, on_summon, on_buff_ally |
| **Transform** | Evolution card replaces the basic pet on the battlefield |
| **Health Carry** | Damage taken by the basic form carries over to the evolved form |
| **Hero Synergy** | +1 Health bonus when pet element matches hero element |
| **Element Advantage** | +2 bonus damage when attacking a pet weak to your element |

#### Pet Families (by Element)

| Element | ID Range | Example Basic | Example Evolution |
|---------|----------|---------------|-------------------|
| Fire | 50001-50099 | Ember Pup | Inferno Hound |
| Water | 50100-50199 | Tide Sprite | Ocean Leviathan |
| Grass | 50200-50299 | Sprout Imp | Ancient Treant |
| Electric | 50300-50399 | Spark Mote | Thunder Drake |
| Dark | 50400-50499 | Shadow Wisp | Void Stalker |
| Light | 50500-50599 | Gleam Sprite | Radiant Seraph |
| Neutral | 50600-50699 | Stone Golem | Mountain Titan |

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

- **9 cards** per hand (max)
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
| **Hand** | Cards currently held (max 9) |
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
