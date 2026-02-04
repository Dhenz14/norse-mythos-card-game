/**
 * Adapt Mechanic Cards
 * Migrated from client/src/game/data/adaptCards.ts on 2026-02-02
 * 
 * Adapt allows players to choose one of three adaptations to enhance a minion.
 * ID Range: 16001-16299
 */

import { CardData } from '../../../../../types';

// ============================================
// ADAPTATION OPTIONS (16001-16010)
// ============================================
export const adaptationOptions: CardData[] = [
  {
    id: 16001,
    name: "Crackling Shield",
    manaCost: 0,
    description: "Give a friendly minion Divine Shield (prevents the next damage it takes)",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
    }
  },
  {
    id: 16002,
    name: "Flaming Claws",
    manaCost: 0,
    description: "Give a friendly minion +3 Attack",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      buffAttack: 3,
      targetType: "friendly_minion",
      requiresTarget: true
    }
  },
  {
    id: 16003,
    name: "Living Spores",
    manaCost: 0,
    description: "Give a friendly minion 'Deathrattle: Summon two 1/1 Plants'",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
    }
  },
  {
    id: 16004,
    name: "Lightning Speed",
    manaCost: 0,
    description: "Give a friendly minion Windfury (can attack twice per turn)",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
    }
  },
  {
    id: 16005,
    name: "Massive",
    manaCost: 0,
    description: "Give a friendly minion Taunt (must be attacked first)",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
    }
  },
  {
    id: 16006,
    name: "Poison Spit",
    manaCost: 0,
    description: "Give a friendly minion Poisonous (kills any minion it damages)",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
    }
  },
  {
    id: 16007,
    name: "Rocky Carapace",
    manaCost: 0,
    description: "Give a friendly minion +3 Health",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      buffHealth: 3,
      targetType: "friendly_minion",
      requiresTarget: true
    }
  },
  {
    id: 16008,
    name: "Shrouding Mist",
    manaCost: 0,
    description: "Stealth until your next turn",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
    }
  },
  {
    id: 16009,
    name: "Volcanic Might",
    manaCost: 0,
    description: "Give a friendly minion +1/+1",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      buffAttack: 1,
      buffHealth: 1,
      targetType: "friendly_minion",
      requiresTarget: true
    }
  },
  {
    id: 16010,
    name: "Liquid Membrane",
    manaCost: 0,
    description: "Can't be targeted by spells or Hero Powers",
    rarity: "common",
    type: "spell",
    keywords: ["adapt_option"],
    class: "Neutral",
    set: "core",
    collectible: false,
    spellEffect: {
      type: "buff",
      targetType: "friendly_minion",
      requiresTarget: true
    }
  }
];

// ============================================
// ADAPT MINIONS & SPELLS (16101-16199)
// ============================================
export const adaptMinions: CardData[] = [
  {
    id: 16101,
    name: "Verdant Longneck",
    manaCost: 5,
    attack: 5,
    health: 4,
    description: "Battlecry: Adapt.",
    rarity: "common",
    type: "minion",
    keywords: ["battlecry", "adapt"],
    class: "Neutral",
    set: "core",
    collectible: true,
    battlecry: {
      type: "transform",
      requiresTarget: false,
      targetType: "none"
    }
  },
  {
    id: 16102,
    name: "Elder Longneck",
    manaCost: 3,
    attack: 3,
    health: 1,
    description: "Battlecry: If you're holding a minion with 5 or more Attack, Adapt.",
    rarity: "common",
    type: "minion",
    keywords: ["battlecry", "adapt"],
    class: "Neutral",
    set: "core",
    collectible: true,
    battlecry: {
      type: "transform",
      requiresTarget: false,
      targetType: "none"
    }
  },
  {
    id: 16103,
    name: "Volcanosaur",
    manaCost: 7,
    attack: 5,
    health: 6,
    description: "Battlecry: Adapt, then Adapt.",
    rarity: "rare",
    type: "minion",
    keywords: ["battlecry", "adapt"],
    class: "Neutral",
    set: "core",
    collectible: true,
    battlecry: {
      type: "transform",
      requiresTarget: false,
      targetType: "none"
    }
  },
  {
    id: 16104,
    name: "Ravenous Pterrordax",
    manaCost: 4,
    attack: 4,
    health: 4,
    description: "Battlecry: Destroy a friendly minion to Adapt twice.",
    rarity: "common",
    type: "minion",
    keywords: ["battlecry", "adapt"],
    class: "Neutral",
    set: "core",
    collectible: true,
    battlecry: {
      type: "transform",
      requiresTarget: true,
      targetType: "friendly_minion"
    }
  },
  {
    id: 16105,
    name: "Adapt",
    manaCost: 1,
    description: "Adapt a friendly minion.",
    rarity: "common",
    type: "spell",
    keywords: ["adapt"],
    class: "Neutral",
    set: "core",
    collectible: true,
    spellEffect: {
      type: "transform",
      targetType: "friendly_minion",
      requiresTarget: true
    }
  }
];

// ============================================
// ADAPT TOKENS (16201-16299)
// ============================================
export const adaptTokens: CardData[] = [
  {
    id: 16201,
    name: "Plant",
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "Summoned by Living Spores.",
    rarity: "common",
    type: "minion",
    keywords: [],
    class: "Neutral",
    set: "core",
    collectible: false
  }
];

export const allAdaptCards: CardData[] = [
  ...adaptationOptions,
  ...adaptMinions,
  ...adaptTokens
];

export default allAdaptCards;
