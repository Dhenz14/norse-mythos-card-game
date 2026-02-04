/**
 * Legendary Cards - Core Set
 * Migrated from multiple source files on 2026-02-02:
 * - client/src/game/data/legendaryCards.ts
 * - client/src/game/data/additionalLegendaryCards.ts
 * - client/src/game/data/modernLegendaryCards.ts
 * - client/src/game/data/iconicLegendaryCards.ts
 * - client/src/game/data/finalLegendaryCards.ts
 * - client/src/game/data/expansionLegendaryCards.ts
 * 
 * Powerful unique cards with game-changing effects.
 * ID Range: 20003-20999
 * 
 * Note: Duplicate IDs removed on 2026-02-02 to avoid conflicts with existing cardRegistry entries.
 */

import { CardData } from '../../../../../types';

// ============================================
// NEUTRAL LEGENDARY MINIONS (from legendaryCards.ts)
// ============================================
export const neutralLegendaryMinions: CardData[] = [];

// ============================================
// CLASS LEGENDARY MINIONS (from legendaryCards.ts)
// ============================================
export const classLegendaryMinions: CardData[] = [
  {
    id: 20006,
    name: "Týr, Champion of Justice",
    manaCost: 8,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Divine Shield. Taunt. Deathrattle: Equip a 5/3 Ashbringer.",
    keywords: ["divine_shield", "taunt", "deathrattle"],
    heroClass: "paladin",
    class: "Paladin",
    set: "core",
    collectible: true,
    deathrattle: {
      type: "summon",
      targetType: "none",
      summonCardId: 20019
    }
  },
  {
    id: 20011,
    name: "Al'Akir the Windlord",
    manaCost: 8,
    attack: 3,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Windfury, Charge, Divine Shield, Taunt",
    keywords: ["windfury", "charge", "divine_shield", "taunt"],
    heroClass: "shaman",
    race: "elemental",
    class: "Shaman",
    set: "core",
    collectible: true
  },
  {
    id: 20012,
    name: "Erik the Shadow Lord",
    manaCost: 3,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "legendary",
    description: "Combo: Gain +2/+2 for each other card you've played this turn.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    set: "core",
    collectible: true,
    comboEffect: {
      type: "buff",
      buffAttack: 2,
      buffHealth: 2,
      targetType: "self",
      requiresTarget: false
    }
  }
];

// ============================================
// LEGENDARY HERO CARDS
// ============================================
export const legendaryHeroCards: CardData[] = [];

// ============================================
// LEGENDARY WEAPONS
// ============================================
export const legendaryWeapons: CardData[] = [];

// ============================================
// LEGENDARY SPELLS
// ============================================
export const legendarySpells: CardData[] = [];

// ============================================
// LEGENDARY TOKENS
// ============================================
export const legendaryTokens: CardData[] = [];

export const allLegendaryCards: CardData[] = [
  ...neutralLegendaryMinions,
  ...classLegendaryMinions,
  ...legendaryHeroCards,
  ...legendaryWeapons,
  ...legendarySpells,
  ...legendaryTokens
];

export default allLegendaryCards;
