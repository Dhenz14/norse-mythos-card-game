/**
 * Mechanic Cards - Battlecry, Deathrattle, and Other Mechanics
 * Migrated from client/src/game/data/mechanicCards.ts on 2026-02-02
 * 
 * Contains cards focused on Battlecry, Deathrattle, Combo, and other core mechanics.
 * ID Range: 40003-40999
 * 
 * Note: Duplicate IDs removed on 2026-02-02 to avoid conflicts with existing cardRegistry entries.
 */

import { CardData } from '../../../../../types';

// ============================================
// BATTLECRY MINIONS
// ============================================
export const battlecryMinions: CardData[] = [
  {
    id: 40003,
    name: "Ironbeak Owl",
    manaCost: 3,
    attack: 2,
    health: 1,
    type: "minion",
    rarity: "common",
    description: "Battlecry: Silence a minion.",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    race: "beast",
    set: "core",
    collectible: true,
    battlecry: {
      type: "silence",
      requiresTarget: true,
      targetType: "any_minion"
    }
  },
  {
    id: 40004,
    name: "Spellbreaker",
    manaCost: 4,
    attack: 4,
    health: 3,
    type: "minion",
    rarity: "common",
    description: "Battlecry: Silence a minion.",
    keywords: ["battlecry"],
    heroClass: "neutral",
    class: "Neutral",
    set: "core",
    collectible: true,
    battlecry: {
      type: "silence",
      requiresTarget: true,
      targetType: "any_minion"
    }
  }
];

// ============================================
// DEATHRATTLE MINIONS
// ============================================
export const deathrattleMinions: CardData[] = [
  {
    id: 40011,
    name: "Fáfnir's Thrall",
    manaCost: 2,
    attack: 2,
    health: 1,
    type: "minion",
    rarity: "common",
    description: "Deathrattle: Draw a card.",
    keywords: ["deathrattle"],
    heroClass: "neutral",
    class: "Neutral",
    set: "core",
    collectible: true,
    deathrattle: {
      type: "draw",
      value: 1,
      targetType: "none"
    }
  },
  {
    id: 40014,
    name: "Auðumbla the Primordial",
    manaCost: 6,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Deathrattle: Summon a 4/5 Primordial Calf.",
    keywords: ["deathrattle"],
    heroClass: "neutral",
    class: "Neutral",
    set: "core",
    collectible: true,
    deathrattle: {
      type: "summon",
      summonCardId: 40114,
      targetType: "none"
    }
  },
  {
    id: 40016,
    name: "Mechanical Whelp",
    manaCost: 6,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "rare",
    description: "Deathrattle: Summon a 7/7 Mechanical Dragon.",
    keywords: ["deathrattle"],
    heroClass: "neutral",
    class: "Neutral",
    race: "automaton",
    set: "core",
    collectible: true,
    deathrattle: {
      type: "summon",
      summonCardId: 40116,
      targetType: "none"
    }
  },
  {
    id: 40017,
    name: "Explosive Sheep",
    manaCost: 2,
    attack: 1,
    health: 1,
    type: "minion",
    rarity: "common",
    description: "Deathrattle: Deal 2 damage to all minions.",
    keywords: ["deathrattle"],
    heroClass: "neutral",
    class: "Neutral",
    race: "automaton",
    set: "core",
    collectible: true,
    deathrattle: {
      type: "damage",
      value: 2,
      targetType: "all"
    }
  },
  {
    id: 40018,
    name: "Khartut Defender",
    manaCost: 6,
    attack: 3,
    health: 4,
    type: "minion",
    rarity: "rare",
    description: "Taunt, Reborn. Deathrattle: Restore 3 Health to your hero.",
    keywords: ["deathrattle", "taunt", "reborn"],
    heroClass: "neutral",
    class: "Neutral",
    set: "core",
    collectible: true,
    deathrattle: {
      type: "heal",
      value: 3,
      targetType: "friendly_hero"
    }
  }
];

// ============================================
// CLASS-SPECIFIC MECHANIC CARDS
// ============================================
export const classMechanicCards: CardData[] = [];

// ============================================
// MECHANIC TOKENS
// ============================================
export const mechanicTokens: CardData[] = [];

export const allMechanicCards: CardData[] = [
  ...battlecryMinions,
  ...deathrattleMinions,
  ...classMechanicCards,
  ...mechanicTokens
];

export default allMechanicCards;
