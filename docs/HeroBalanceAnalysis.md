# Hero Balance Analysis - Ragnarok Poker

> **LEGACY NOTICE:** This document uses Hearthstone hero names (Gul'dan, Valeera, etc.) as references for class archetypes. The actual game uses Norse mythology hero names (Odin, Thor, Loki, etc.). See `docs/NorseHeroPowerSystem.md` for the current Norse hero roster and abilities.

## Overview

This document provides a comprehensive balance analysis of the per-hero card assignment system. Each of the 36 Norse heroes has 10 unique signature cards (from their class spell pool) that define their playstyle.

## Quick Norse Hero Mapping

| Hearthstone Class | Norse Heroes (Examples) |
|-------------------|------------------------|
| Mage | Odin, Bragi, Kvasir |
| Warlock | Forseti, Mani, Thryma |
| Necromancer | Sol, Sinmara |
| Warrior | Thor, Thorgrim, Valthrud, Vili |
| Death Knight | Magni, Brakki |
| Paladin | Tyr, Vidar, Heimdall |
| Priest | Freya, Eir, Frey |
| Druid | Idunn, Ve, Fjorgyn |
| Shaman | Gerd, Gefjon, Ran |
| Rogue | Loki, Hoder, Gormr, Lirien |
| Hunter | Skadi, Aegir, Fjora |
| Demon Hunter | Myrka, Ylva |

## Hero Power Tiers

### Tier 1 (Strongest)
- **Gul'dan (Warlock)** - Late game dominance with Lord Jaraxxus + Twisting Nether
- **Valeera (Rogue)** - Explosive combo potential with Edwin VanCleef + Preparation
- **Illidan (Demon Hunter)** - Card advantage with Skull of Gul'dan + Metamorphosis
- **Malfurion (Druid)** - Ramp into big threats with Innervate + Overgrowth

### Tier 2 (Strong)
- **Jaina (Mage)** - Consistent freeze control with Blizzard + Frost Nova
- **Garrosh (Warrior)** - Armor-based control with Shield Slam + Brawl
- **Anduin (Priest)** - Sustained value with Raza + Murozond
- **Rexxar (Hunter)** - Board flood with Call of the Wild + Unleash
- **Thrall (Shaman)** - Al'Akir finisher with elemental synergy
- **Arthas (Death Knight)** - Frostmourne legendary weapon

### Tier 3 (Balanced)
All remaining heroes (Medivh, Khadgar, Tamsin, Magni, Deathwing, Darion, Tyrande, Lazul, Lunara, Morgl, Maiev, Shaku, Alleria, Kayn)

---

## Detailed Analysis by Domain

### QUEEN HEROES (Freya's Domain - Magic/Death)

#### Mages

| Hero | Playstyle | Early Game (1-3) | Mid Game (4-6) | Late Game (7+) | Removal | Win Condition |
|------|-----------|------------------|----------------|----------------|---------|---------------|
| Jaina | Frost Control | Mana Wyrm (1), Ice Lance (1), Frost Nova (3) | Water Elemental (4), Polymorph (4) | Blizzard (6), Flame Strike (7) | Polymorph, Frost Nova | Freeze + Burn |
| Medivh | Arcane Secrets | Sorcerer's Apprentice (2), Kirin Tor (3) | Ethereal Arcanist (4), Polymorph (4) | - | Polymorph, Vaporize | Secret value |
| Khadgar | Fire Burst | Mana Wyrm (1), Arcane Missiles (1) | Polymorph (4), Flamecannon (2) | Antonidas (7), Flame Strike (7) | Polymorph | Fireball spam |

**Balance Notes:**
- Jaina has the most consistent control package
- Khadgar has high variance (Antonidas can run away with games)
- Medivh relies on secret synergies which can be inconsistent

#### Warlocks

| Hero | Playstyle | Key Cards | Mana Curve | Power Level |
|------|-----------|-----------|------------|-------------|
| Gul'dan | Demon Lord | Lord Jaraxxus (9), Twisting Nether (8), Doomguard (5) | Heavy late-game | HIGH |
| Tamsin | Discard Aggro | Soulfire (1), Doomguard (5), Fist of Jaraxxus | Fast curve | MEDIUM |

**Balance Notes:**
- Gul'dan may dominate long games with Jaraxxus infinite value
- Tamsin is high-risk/high-reward with discard mechanics

#### Necromancers

| Hero | Playstyle | Key Cards | Power Level |
|------|-----------|-----------|-------------|
| Lilian | Resurrection | Mass Resurrection, Eternal Servitude, Lich Queen | MEDIUM |
| Helcular | Swarm Undead | Undead Horde, Tombstone, Necrotic Plague | MEDIUM |

---

### ROOK HEROES (Thor's Domain - Strength)

#### Warriors

| Hero | Playstyle | Key Cards | Power Level |
|------|-----------|-----------|-------------|
| Garrosh | Armor Tank | Shield Slam, Brawl (5), Gorehowl (7), Armorsmith | HIGH |
| Magni | Weapon Master | Fiery War Axe (3), Grommash (8), Kor'kron Elite | MEDIUM |
| Deathwing | Berserker | Frothing Berserker (3), Inner Rage (0), Battle Rage | MEDIUM |

**Balance Notes:**
- Garrosh has excellent control tools (Brawl + Shield Slam)
- Magni is focused on charge finisher with Grommash
- Deathwing relies on damaged minion synergies

#### Death Knights

| Hero | Playstyle | Key Cards | Power Level |
|------|-----------|-----------|-------------|
| Arthas | Frost Lord | Frostmourne (8), Remorseless Winter, Chains of Ice | HIGH |
| Darion | Unholy Commander | Army of the Dead, Blood Boil, Death Strike | MEDIUM |

---

### BISHOP HEROES (Frigg's Domain - Wisdom)

#### Priests

| Hero | Playstyle | Key Cards | Power Level |
|------|-----------|-----------|-------------|
| Anduin | Holy Healer | Raza (5), Murozond (8), Holy Fire (6), Lightwell | HIGH |
| Tyrande | Mind Control | Shadow Madness (4), Mindflayer Kaahrj (5), Auchenai | MEDIUM |
| Lazul | Shadow Priest | Auchenai (4), Shadow Madness (4), Gandling (4) | MEDIUM |

#### Druids

| Hero | Playstyle | Key Cards | Power Level |
|------|-----------|-----------|-------------|
| Malfurion | Ramp Control | Innervate (0), Overgrowth (4), Cenarius (9), Nourish | HIGH |
| Lunara | Token Aggro | Force of Nature (5), Soul of the Forest (4), Cenarius | MEDIUM |

#### Shamans

| Hero | Playstyle | Key Cards | Power Level |
|------|-----------|-----------|-------------|
| Thrall | Elemental | Al'Akir (8), Fire Elemental (6), Lightning Bolt (1) | HIGH |
| Morgl | Totem Support | Flametongue Totem (2), same package as Thrall | MEDIUM |

---

### KNIGHT HEROES (Loki's Domain - Trickery/Speed)

#### Rogues

| Hero | Playstyle | Key Cards | Power Level |
|------|-----------|-----------|-------------|
| Valeera | Combo Tempo | Edwin VanCleef (3), Preparation (0), SI:7 Agent | HIGH |
| Maiev | Stealth/Weapons | Master of Disguise, Assassin's Blade (5), Perdition's | MEDIUM |
| Shaku | Aggro | Sinister Strike (1), Blade Flurry (2), Eviscerate | MEDIUM |

#### Hunters

| Hero | Playstyle | Key Cards | Power Level |
|------|-----------|-----------|-------------|
| Rexxar | Beast Swarm | Call of the Wild (8), Unleash the Hounds (3) | HIGH |
| Alleria | Secret Control | Explosive Trap, Freezing Trap, Eaglehorn Bow | MEDIUM |

#### Demon Hunters

| Hero | Playstyle | Key Cards | Power Level |
|------|-----------|-----------|-------------|
| Illidan | Outcast Master | Skull of Gul'dan (6), Metamorphosis (7), Altruis | HIGH |
| Kayn | Aggro Rush | Chaos Strike (2), Flamereaper (7), Imprisoned Antaen | MEDIUM |

---

### KING HEROES (Odin's Domain - Leadership)

**Paladins: NO SPELLS IN COMBAT**

Per game design, King pieces (Paladins) have no signature spells. They rely entirely on the 60-card shared neutral deck. This creates a unique strategic constraint where King pieces must be protected through minion-based strategies.

---

## Known Technical Issues

### Card ID Overlap: Shaman vs Necromancer

Both classes use the 4xxx ID range:
- **Shaman:** 4001, 4002, 4101-4105
- **Necromancer:** 4000-4014, 4100-4111

This causes registration collisions where the last-registered class overwrites shared IDs. **Future migration needed** to renumber one class (recommended: Shaman to 4300+ range).

---

## Balance Recommendations

1. **Monitor Tier 1 heroes** for overperformance in playtesting
2. **Consider buffing Tier 3 heroes** if they underperform
3. **Resolve Shaman/Necromancer ID conflict** to ensure all cards are available
4. **Legendary variance** (Jaraxxus, Antonidas, Frostmourne) creates exciting but high-variance games - this is intentional for card game depth
