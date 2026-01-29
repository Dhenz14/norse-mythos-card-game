# Ragnarok: Pet Battle PvP System

## Game Design Document

### 1. Introduction

Welcome to Ragnarok - an NFT-based, Play-to-Earn (P2E) strategy game steeped in mythological themes and designed around skillful, strategic combat. This document outlines the integration of the advanced Pet Battle system with PvP combat using Poker-inspired mechanics.

**Source Repository:** https://github.com/Ragnaroknfthive/Ragnarok-Card- (TheycallmeDan branch)

> "Ragnarok wants to be the most advanced skill-based game in existence. People with lesser stats but greater skill can prevail. This game will stretch the limits of your creativity and mental capacity."

### 2. Game Concept

- **Genre/Setting:** A strategic, mythologically themed deck-builder that merges Chess, turn-based duels, and Poker-like combat mechanics.
- **NFT Integration:** All gods, titans, demigods, and legendary beings are tradable NFTs, each capable of leveling up and recording combat history permanently. The history of the cards is permanent - see the great wars fought.
- **P2E Economy:** Players can earn, stake, or spend in-game currency (HBD) to upgrade their characters and obtain powerful items, spells, or new pets. All HBD for in-game items is put into a SIP v1 where interest is paid out to players perpetually.
- **Capped Supply:** Limited NFT supply ensures rarity and value.

### 3. Setting, Story, and Key Themes

#### Mythological Inspiration
- **Initial Pantheon:** Norse mythology forms the starting roster, featuring deities like Odin, Thor, Freya, and more.
- **Future Pantheons:** Additional gods, titans, and legendary beings from other mythologies (Greek, Egyptian, Hindu, etc.) will be added.

#### Story Synopsis
Ragnarok, the end of the world, is here. All mythologies converge in an endless cycle of wars. From gods to mortals, each must choose sides and fight for glory, loot, and influence.

#### Themes
- **Eternal Struggle:** Life, death, and rebirth form the central loop.
- **Skill Over Stats:** Creative gameplay and skillful execution can trump numeric disadvantages.
- **Choice & Consequence:** Every battle is unique. Each decision in spells/pets used and in the Poker-style combat phase permanently changes outcomes.

---

## 4. Core Gameplay Systems

### 4.1. Pet Battle System

#### Pet Statistics
Each pet has the following core attributes:
- **Health Pool (HP):** 100-200 base, persists across multiple fights unless fully depleted. **HP is a DUAL STAT** - it serves as both your health AND your betting power in poker combat. Higher HP = higher betting potential = greater HP loss for opponents when you win.
- **Stamina Pool (STA):** 10 max, **CAPS YOUR MAXIMUM BET in poker combat**
- **Speed:** 0.00-10.00, determines attack order and reaction time
- **Rage:** 0-10, builds during combat, enables special abilities

#### STA Betting Cap System
**CRITICAL RULE:** Stamina (STA) limits how much HP you can bet in poker combat.
- **Formula:** 1 STA = 10 HP max bet
- **Example:** With 5 STA and 100 HP, you can only bet up to 50 HP per hand
- **Available HP = min(Current HP, Stamina × 10)**

This creates strategic tension:
- High HP + Low STA = Can't bet all your HP
- Low HP + High STA = Full betting power but less to work with
- Managing stamina becomes critical in prolonged battles

> **Design Philosophy:** By making HP a dual stat, we create meaningful poker dynamics. Betting high (committing HP) is risky because you lose your bet if you lose the hand, but also powerful because HP committed determines how much your opponent loses when you win.

#### Pet Levels (1-9)
- Level 1-3: Basic abilities, limited spell access
- Level 4-6: Intermediate abilities, unlock passive skills
- Level 7-9: Advanced abilities, full spell access, legendary passives

#### Pet Types & Classes
- **Pawns:** 0 spell slots - Valkyrie Weapon instant-kill attackers (see Combat Types below)
- **Standard Gods/Titans:** 30 spell slots
- **Queens:** 33 spell slots, enhanced mobility
- **Kings:** 35 spell slots, leadership abilities

### 4.2. Spell System

#### Mana Management (Hearthstone-style)
- **Purpose:** Mana is ONLY for playing cards and using hero powers
- **Starting Value:** Players start each match with 1 mana
- **Growth:** Gain +1 mana at end of each turn (when poker hand ends via fold/end turn)
- **Maximum:** 9 mana
- **Source of Truth:** Single mana pool shared between card game and poker combat
- **NO RELATION TO POKER:** Mana has nothing to do with poker betting mechanics

> **IMPORTANT:** Mana and STA are completely separate systems:
> - **Mana** = For cards and hero powers (Hearthstone-style)
> - **STA** = For poker betting caps (poker-only)

#### Spell Properties
- **Mana Cost:** 1-9
- **Spell Level:** 1-9 (indicates power)
- **Target Types:** Self, Ally, Enemy, All

#### Spell Categories
1. **Offensive Spells:** Direct damage, debuffs
2. **Defensive Spells:** Shields, heals, buffs
3. **Utility Spells:** Card draw, mana manipulation
4. **Ultimate Spells:** High-cost, game-changing effects

---

## 5. Combat Types

When pieces attack in Ragnarok, the combat type depends on both the attacker AND defender:

### 5.0. Valkyrie Weapon System (Instant-Kill)

Certain attacks result in instant elimination - no poker combat required.

**Instant-Kill Attackers:**
- **Pawns**: Expendable foot soldiers wielding divine Valkyrie weapons. When a pawn captures any piece, the defender is instantly eliminated.
- **Kings**: Primordial cosmic entities. Their attacks represent absolute divine power - instant elimination of any piece they attack.

**Instant-Kill Defenders (Weak Targets):**
- **Pawns**: As foot soldiers with no defensive training, pawns cannot engage in poker combat. ANY attack on a pawn results in instant elimination.

**Summary:**
| Attacker | Defender | Result |
|----------|----------|--------|
| Pawn/King | Any piece | Instant kill |
| Any piece | Pawn | Instant kill |
| Major piece | Major piece | PvP poker combat |

**Design Philosophy:**
- Pawns have 0 spell slots, so poker combat would be pure RNG with no strategic depth
- Pawns are symmetrically vulnerable: they can instant-kill AND be instant-killed
- Encourages strategic pawn positioning - use them aggressively but protect them
- Kings are passive summoners with army buffs, but their rare direct attacks are devastating

### 5.1. PvP Poker Combat

Major pieces (Queen, Rook, Bishop, Knight) trigger full poker combat when attacking:

When two characters engage in combat, the battle comprises two phases:
1. **Spell & Pet Phase**
2. **Attack Phase (Poker-Inspired)**

#### Poker Combat Mechanics

The attack phase uses No-Limit Hold 'em poker analogy. **HP is your betting currency AND your attack power** - the loser of a showdown loses their HP commitment.

| Poker Term | Combat Action | Description |
|------------|--------------|-------------|
| **Bet** | **Attack** | Commit HP as your wager |
| **Reraise** | **Counter Attack** | Increase HP commitment |
| **Call** | **Engage** | Match opponent's HP wager |
| **Fold** | **Brace** | Exit combat (lose 5% of committed HP) |
| **Check** | **Defend** | No action, maintain position |
| **Chips** | **Hit Points (HP)** | Your betting resource and health |

### 5.2. Community Cards: Faith / Foresight / Destiny

Like Texas Hold 'em's Flop/Turn/River, combat reveals information in stages:

#### Faith (The Flop)
- **3 cards revealed**
- Initial combat information
- Sets the tone of the engagement
- Players can assess initial advantage

#### Foresight (The Turn)
- **1 additional card revealed**
- More information available
- Strategies can adjust
- Tension builds

#### Destiny (The River)
- **Final card revealed**
- Complete information
- Final decisions made
- Combat resolves

### 5.3. Combat Flow

```
┌─────────────────────────────────────────┐
│            COMBAT INITIATION            │
│     Two characters meet on field        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          SPELL & PET PHASE              │
│  - Cast spells (costs mana)             │
│  - Deploy pets (active abilities)       │
│  - Apply buffs/debuffs                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         ATTACK PHASE: FAITH             │
│  - 3 combat cards revealed              │
│  - Initial betting round                │
│  - Attack / Defend / Brace options      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│       ATTACK PHASE: FORESIGHT           │
│  - 1 additional card revealed           │
│  - Second betting round                 │
│  - Adjust strategy based on info        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        ATTACK PHASE: DESTINY            │
│  - Final card revealed                  │
│  - Final betting round                  │
│  - Combat resolution                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          COMBAT RESOLUTION              │
│  - Compare hands                        │
│  - Loser loses HP commitment            │
│  - Winner takes zero HP loss            │
│  - Update HP pools                      │
└─────────────────────────────────────────┘
```

---

## 6. Combat Card Hands

### Hand Rankings (Highest to Lowest)

Hand strength determines who wins the showdown:
- **Winner:** Takes ZERO HP loss
- **Loser:** Loses their full HP commitment (what they bet)

| Rank | Hand | Special Effect |
|------|------|----------------|
| 1 | **Ragnarok (Royal Flush)** | Loser's armor does not reduce HP loss |
| 2 | **Divine Alignment (Straight Flush)** | Loser loses an extra 10% of bet |
| 3 | **Godly Power (Four of a Kind)** | Standard outcome |
| 4 | **Valhalla's Blessing (Full House)** | Standard outcome |
| 5 | **Odin's Eye (Flush)** | Standard outcome |
| 6 | **Fate's Path (Straight)** | Standard outcome |
| 7 | **Thor's Hammer (Three of a Kind)** | Standard outcome |
| 8 | **Dual Runes (Two Pair)** | Standard outcome |
| 9 | **Rune Mark (One Pair)** | Standard outcome |
| 10 | **High Card** | Standard outcome |

> **Key Concept:** Stronger hands help you WIN, not increase losses. In standard outcomes, the loser simply loses their HP commitment. Only special hands like Ragnarok and Divine Alignment add extra effects.

---

## 7. Status Effects

Status effects are debuffs that can be applied to minions through legendary minion attacks and certain spells. Each god's legendary minion applies a unique status effect on attack.

### 7.1. Status Effect List

| Icon | Effect | Damage/Impact | Trigger | Duration |
|------|--------|---------------|---------|----------|
| ☠️ | **Poison (DoT)** | 3 damage | Turn start | Until cleared |
| 🩸 | **Bleed** | +3 damage taken when damaged | On damage | Until cleared |
| ⚡ | **Paralysis** | 50% chance to fail actions | On action attempt | Until cleared |
| ⬇️ | **Weakness** | -3 Attack | Continuous | Until cleared |
| 🎯 | **Vulnerable** | +3 damage taken | Continuous | Until cleared |
| 👁️ | **Marked** | Can always be targeted (ignores Stealth) | Continuous | Until cleared |
| 🔥 | **Burn** | +3 Attack, take 3 self-damage on attack | On attack | Until cleared |
| ❄️ | **Freeze** | Cannot act | Continuous | Clears at end of turn |

### 7.2. Status Effect Details

#### Poison (DoT) ☠️
- **Effect:** At the start of your turn, deal 3 damage to this minion
- **Theme:** Associated with Dark, Grass, and corrupted creatures
- **Counter:** Healing, Silence

#### Bleed 🩸
- **Effect:** Whenever this minion takes damage, it takes 3 additional damage
- **Theme:** Associated with Dark warriors, blood magic
- **Synergy:** Stacks with Vulnerable for devastating damage

#### Paralysis ⚡
- **Effect:** 50% chance to fail when attempting to attack or use abilities
- **Theme:** Associated with Lightning/Electric creatures
- **Note:** Each action attempt is rolled independently

#### Weakness ⬇️
- **Effect:** Reduce Attack by 3 (minimum 0)
- **Theme:** Associated with debilitating magic
- **Counter:** Attack buffs can overcome this

#### Vulnerable 🎯
- **Effect:** Take 3 additional damage from all sources
- **Theme:** Associated with Fire, precision attacks
- **Synergy:** Stacks with Bleed for +6 extra damage when hit

#### Marked 👁️
- **Effect:** This minion can always be targeted, ignoring Stealth
- **Theme:** Associated with Light, hunters
- **Counter:** Stealth is useless while Marked

#### Burn 🔥
- **Effect:** +3 Attack but take 3 damage to self after each attack
- **Theme:** Associated with Fire creatures
- **Risk/Reward:** High damage output but self-destructive

#### Freeze ❄️
- **Effect:** Cannot attack or use abilities
- **Theme:** Associated with Water/Ice creatures
- **Duration:** Automatically clears at the end of the affected player's turn

### 7.3. Status Effect Interactions

#### Damage Stacking
When a minion is both Vulnerable and Bleeding, incoming damage is amplified twice:
- Base damage + 3 (Vulnerable) + 3 (Bleed) = +6 extra damage

#### Action Prevention Priority
1. **Freeze** - Complete prevention, no roll
2. **Paralysis** - 50% chance roll

If frozen, the minion cannot act. If not frozen but paralyzed, roll 50% chance.

#### Burn Mechanics
- Burn increases outgoing attack damage by 3
- After dealing damage, the burning minion takes 3 self-damage
- This self-damage can kill the attacker

### 7.4. Legendary Minion Status Effects

Each god's legendary signature minion applies a status effect on attack:

| Element | Status Effect | Example Gods |
|---------|---------------|--------------|
| Fire | Burn, Vulnerable | Surtr, Prometheus, Hephaestus |
| Water/Ice | Freeze | Aegir, Poseidon, Njord |
| Lightning | Paralysis | Thor, Zeus, Raijin |
| Dark | Bleed, Poison | Hel, Hades, Fenrir |
| Light | Marked | Apollo, Baldur, Hemera |
| Grass/Nature | Poison | Freya (nature), Demeter |
| Neutral | Weakness | Various |

---

## 8. Combat Actions

### 7.1. Attack (Bet)
- **Cost:** Variable HP commitment
- **Effect:** Loser loses their HP commitment. Winner takes zero HP loss.
- **Risk:** If opponent has better hand, you lose your committed HP
- **Note:** HP is your betting power - committing more HP means higher stakes

### 7.2. Counter Attack (Reraise)
- **Cost:** Must exceed opponent's HP wager
- **Effect:** Force higher stakes - both players risk more HP
- **Risk:** If you lose, you lose your larger commitment

### 7.3. Engage (Call)
- **Cost:** Match opponent's HP commitment
- **Effect:** Force showdown at current stakes
- **Risk:** Even engagement, hand strength determines who loses HP

### 7.4. Brace (Fold)
- **Cost:** Lose 5% of committed HP
- **Effect:** Exit combat early, forfeiting small HP penalty
- **Benefit:** Minimize losses when outmatched

### 7.5. Defend (Check)
- **Cost:** None (when no active bet)
- **Effect:** Pass action, maintain defensive posture
- **Benefit:** See more cards without committing

---

## 9. Elemental System

### Element Types
- **Fire** 🔥
- **Water** 💧
- **Earth** 🌍
- **Wind** 🌬️
- **Holy** ✨
- **Shadow** 🌑
- **Neutral** ⚫

### Elemental Interactions (Core Cycle)
| Element | Strong Against | Weak To |
|---------|---------------|---------|
| Fire | Earth | Water |
| Water | Fire | Wind |
| Wind | Water | Earth |
| Earth | Wind | Fire |

### Special Element Interactions
| Element | Strong Against | Weak To |
|---------|---------------|---------|
| Holy | Shadow | Shadow |
| Shadow | Holy | Holy |
| Neutral | - | - |

### Elemental Bonus (Poker Combat)
When fighting an opponent you are **strong against**, you receive combat buffs:
- **+2 Attack** (added to base attack stat)
- **+2 Health** (added to current HP for combat)
- **+20 Hero Armor** (absorbs damage before HP, like Hearthstone armor)

**Armor Mechanics:**
- Armor absorbs damage BEFORE HP is reduced
- Armor is consumed as it absorbs damage
- Armor applies to: losing poker hands, fold penalties, ability damage
- Armor does NOT affect betting (HP is still deducted when committing to pot)

> **Note:** Poker hand evaluation is UNAFFECTED by elements. Only base stats and armor receive the buff.

---

## 10. Pet Abilities

### Passive Abilities
- Trigger automatically under specific conditions
- No stamina cost
- Examples: Regeneration, Thorns, Lifesteal

### Active Abilities
- Require stamina to activate
- Manually triggered by player
- Examples: Special attacks, buffs, summons

### Ultimate Abilities (Level 7+)
- Require full rage meter
- Powerful game-changing effects
- One use per combat

---

## 11. Combat Modifiers

### HP Loss Modifiers (Poker Combat)
| Modifier | Effect |
|----------|--------|
| **Extra HP Loss** | Loser loses additional flat HP |
| **Reduced Stakes** | Opponent's maximum HP bet is capped |
| **Slower Opp Stamina** | Opponent gains stamina slower |
| **Critical Win** | Loser loses 2x their HP commitment |

### Status Effects
- **Stunned:** Skip next action
- **Poisoned:** Lose HP each turn
- **Blessed:** Increased healing received
- **Cursed:** Reduced HP commitment limit

---

## 12. Turn Structure

### Turn Timer
- Default: 27 seconds per turn
- Actions must be completed within timer

### Turn Actions
1. **Draw Phase:** Draw a card
2. **Main Phase:** Play cards, cast spells
3. **Combat Phase:** Resolve attacks
4. **End Phase:** Apply end-of-turn effects

### End Turn Button
- Ends current turn
- Passes priority to opponent
- Any unspent mana is lost

---

## 13. Victory Conditions

### Primary Victory
- Reduce opponent's HP to 0
- Eliminate all enemy pieces/pets

### Alternative Victory
- Opponent concedes
- Opponent disconnects (after timeout)

---

## 14. Progression System

### Experience (EXP Coins)
- Earned after every match
- Stake EXP to level up pets (Levels 1-9)
- Higher levels unlock more spells and better stats

### Equipment System
- **Weapons:** Provide bonus effects (extra HP loss on wins, stamina refunds, etc.)
- **Armor:** Increase max HP pool
- **Accessories:** Special bonuses

### NFT Ownership
- Each pet is a unique NFT with recorded history
- Trade, buy, or sell on supported marketplaces

---

## 15. UI Layout Reference

Based on the Ragnarok poker combat UI (HP = dual stat design):

```
┌──────────────────────────────────────────────────────────────┐
│                         OPPONENT AREA                         │
│  ┌─────┐ ┌─────┐    [Speed][Stamina][PET CARD][Rage]         │
│  │Card │ │Card │         0.00  10/10    🃏      0             │
│  │Back │ │Back │                                              │
│  └─────┘ └─────┘    [Bonus: 0] [Modifier: 0%]                │
│                     HP: 131/150 (betting power)               │
├──────────────────────────────────────────────────────────────┤
│                           VS                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               BATTLEFIELD / BOARD                        │ │
│  │  ┌──────┐                                   [7 slots]    │ │
│  │  │Active│  Pet displays HP (dual stat)                   │ │
│  │  │ Pet  │  [HP][Armor]                                   │ │
│  │  └──────┘                                                │ │
│  └─────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│                         PLAYER AREA                           │
│  [End Turn: 27]                                               │
│                                                               │
│  ┌───┐ ┌───┐    [Speed][Stamina][PET CARD][Rage]             │
│  │ A♣│ │ 6♠│         0.00  10/10    🃏      0                 │
│  └───┘ └───┘                                                  │
│                 [Bonus: 0%] [Modifier: 0%]                   │
│  [Attack] [Brace]   HP: 134/150 (betting power)              │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [Hand Cards - Multiple face down cards with stats]      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                     Player_113                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 16. Card Types in Ragnarok

### Playing Cards (Poker Element)
- Standard 52-card deck
- Used for combat hand evaluation
- Suits: ♠ ♥ ♦ ♣
- Values: A, 2-10, J, Q, K

### Pet Cards
- Represent your battle pets
- Display: Image, Stats, Abilities
- Rarity tiers: Common, Rare, Epic, Legendary

### Spell Cards
- One-time use abilities
- Mana cost varies
- Can target self, allies, or enemies

---

## 17. Quick Reference: Action Buttons

| Button | Action | Effect |
|--------|--------|--------|
| **Attack** | Initiate attack phase | Commit HP as your wager |
| **Brace** | Defensive stance | Exit combat early, lose 5% of committed HP |
| **End Turn** | Finish turn | Pass to opponent |

---

## 18. Stat Display Guide

### Pet Card Stats (Poker Combat)
- **Top Left:** Mana/Stamina cost
- **Center:** HP (serves as both health AND betting power)
- **Card Frame:** Rarity indicator (Gold=Legendary, Silver=Epic, etc.)

> **Note:** In poker combat, pets do not have a separate attack stat. HP is the dual stat that represents both survivability and wagering potential.

### Resource Bars
- **Health Bar:** Current HP / Max HP (Green)
- **Stamina Bar:** Current / Max (Blue/Cyan)
- **Rage Bar:** Current / Max (Red)

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Ragnarok** | The mythological end of the world; best poker hand |
| **Faith** | First 3 community cards revealed |
| **Foresight** | 4th community card |
| **Destiny** | 5th and final community card |
| **Brace** | Defensive action (like poker fold) |
| **Counter Attack** | Increase attack commitment (reraise) |
| **Engage** | Match opponent's bet (call) |

---

## Appendix B: Combat Resolution

**HP = Dual Stat Design:** In Ragnarok poker combat, your HP serves as both your health AND your betting power. There is no separate attack stat for heroes/pets in poker combat.

```
Combat Resolution:
- Winner: Takes ZERO HP loss
- Loser: Loses their HP commitment (what they bet)
- Draw: No one loses HP
- Check-through (no bets): Loser loses 2 HP penalty

Hand Strength:
- Stronger hands help you WIN the showdown
- Hand rankings determine the winner, not HP loss amounts
- See Section 6 for special hand effects (armor bypass, extra HP loss)

Modifiers (apply to loser's HP loss):
- Elemental advantage: +25% extra HP loss
- Critical Win: 2x HP loss
- Special hand effects: See Section 6

Weapon Bonuses:
- Weapons provide bonus effects rather than raw attack values
- Examples: +1 HP extra loss on wins, stamina refund on wins, etc.
```

---

*This document combines the original Ragnarok GDD with the Pet Battle PvP system, creating a unified ruleset for the integrated game experience.*
