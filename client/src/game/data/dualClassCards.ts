/**
 * Dual-Class cards for Hearthstone clone
 * Dual-Class cards belong to two different Hero classes
 */
import { CardData } from '../types';

export const dualClassCards: CardData[] = [
  {
    id: 14001,
    name: "Ace Hunter Kreen",
    manaCost: 3,
    attack: 2,
    health: 4,
    description: "Dual-Class: Hunter/Demon Hunter. Your other characters are Immune while attacking.",
    rarity: "legendary",
    type: "minion",
    keywords: ["dual_class"],
    // Special property for dual classes
    dualClassInfo: {
      classes: ["hunter", "demonhunter"]
    },
    collectible: true,
    class: "Neutral"
  },
  {
    id: 14002,
    name: "Druid of the Reef",
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "Dual-Class: Druid/Shaman. Choose One - Transform into a 3/1 Rush form; or a 1/3 form with Taunt.",
    rarity: "common",
    type: "minion",
    keywords: ["dual_class", "choose_one"],
    dualClassInfo: {
      classes: ["druid", "shaman"]
    },
    // The choose_one effect would be linked to transformation options
    class: "Neutral",
    collectible: true
  },
  {
    id: 14003,
    name: "Raise Dead",
    manaCost: 0,
    description: "Dual-Class: Priest/Warlock. Deal 3 damage to your hero. Return two friendly minions that died this game to your hand.",
    rarity: "common",
    type: "spell",
    keywords: ["dual_class"],
    dualClassInfo: {
      classes: ["priest", "warlock"]
    },
    spellEffect: {
      type: "damage",
      value: 3,
      targetType: "friendly_hero"
      // The return from dead effect would be handled in game logic
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 14004,
    name: "Wand Thief",
    manaCost: 1,
    attack: 1,
    health: 2,
    description: "Dual-Class: Mage/Rogue. Combo: Discover a Mage spell.",
    rarity: "common",
    type: "minion",
    keywords: ["dual_class", "combo"],
    dualClassInfo: {
      classes: ["mage", "rogue"]
    },
    comboEffect: {
      type: "discover",
      requiresTarget: false,
      targetType: "none"
      // The discovery would be filtered to Mage spells in the game logic
    },
    class: "Neutral",
    collectible: true
  },
  {
    id: 14005,
    name: "Devout Pupil",
    manaCost: 6,
    attack: 4,
    health: 5,
    description: "Dual-Class: Paladin/Priest. Divine Shield, Taunt. Costs (1) less for each spell you've cast on friendly characters this game.",
    rarity: "epic",
    type: "minion",
    keywords: ["dual_class", "divine_shield", "taunt"],
    dualClassInfo: {
      classes: ["paladin", "priest"]
    },
    // The cost reduction would be tracked in game state
    class: "Neutral",
    collectible: true
  }
];

export default dualClassCards;