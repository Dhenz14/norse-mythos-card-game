/**
 * Combo Cards Collection
 * 
 * This file contains cards with the Combo mechanic, primarily associated with the Rogue class.
 * Combo cards activate special effects when played after another card in the same turn.
 */
import { CardData, BattlecryTargetType } from '../types';

/**
 * Collection of cards with the Combo mechanic
 * Most of these are Rogue cards, as Combo is their class-specific mechanic
 * Card IDs: 31xxx series
 */
export const comboCards: CardData[] = [
  {
    id: 31001,
    name: "Shady Dealer",
    manaCost: 3,
    attack: 3,
    health: 3,
    type: "minion",
    rarity: "rare",
    description: "Combo: If you control a Pirate, gain +2/+2.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    combo: {
      type: "buff_conditional",
      condition: "control_pirate",
      attack: 2,
      health: 2
    }
  },
  {
    id: 31002,
    name: "Niflheim's Touch",
    manaCost: 1,
    type: "spell",
    rarity: "common",
    description: "Give a minion +2 Attack. Combo: +4 Attack instead.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    spellEffect: {
      type: "buff_attack",
      value: 2,
      targetType: "any_minion",
      requiresTarget: true
    },
    combo: {
      type: "buff_attack",
      value: 4,
      targetType: "any_minion"
    }
  },
  {
    id: 31003,
    name: "Shadow Panther",
    manaCost: 4,
    attack: 4,
    health: 3,
    type: "minion",
    race: "beast",
    rarity: "common",
    description: "Combo: Gain Stealth until your next turn.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    combo: {
      type: "gain_stealth",
      duration: "next_turn"
    }
  },
  {
    id: 31004,
    name: "Sabotage",
    manaCost: 4,
    type: "spell",
    rarity: "epic",
    description: "Destroy a random enemy minion. Combo: And their weapon.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    spellEffect: {
      type: "destroy_random",
      targetType: "enemy_minion"
    },
    combo: {
      type: "destroy",
      targetType: "enemy_weapon"
    }
  },
  {
    id: 31005,
    name: "Undercity Valiant",
    manaCost: 2,
    attack: 3,
    health: 2,
    type: "minion",
    rarity: "common",
    description: "Combo: Deal 1 damage.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    combo: {
      type: "damage",
      value: 1,
      targetType: BattlecryTargetType.ANY,
      requiresTarget: true
    }
  },
  {
    id: 31006,
    name: "Shadow Strike",
    manaCost: 3,
    type: "spell",
    rarity: "rare",
    description: "Deal 4 damage to an undamaged character. Combo: And 2 damage to adjacent minions.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    spellEffect: {
      type: "damage",
      value: 4,
      targetType: "undamaged_character",
      requiresTarget: true
    },
    combo: {
      type: "adjacent_damage",
      value: 2
    }
  },
  {
    id: 31007,
    name: "Cutpurse",
    manaCost: 2,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "rare",
    description: "Combo: Add a Coin to your hand.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    combo: {
      type: "add_card_to_hand",
      cardId: 31501, // Coin token
      count: 1
    }
  },
  {
    id: 31008,
    name: "Loki's Veil",
    manaCost: 1,
    type: "spell",
    rarity: "common",
    description: "Give your minions Stealth until your next turn. Combo: Draw a card.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    spellEffect: {
      type: "give_stealth",
      targetType: "friendly_minions",
      duration: "next_turn"
    },
    combo: {
      type: "draw",
      value: 1
    }
  },
  {
    id: 31009,
    name: "Swift Poisoner",
    manaCost: 3,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "common",
    description: "Combo: Give your weapon +1 Attack and Poisonous.",
    keywords: ["combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    combo: {
      type: "buff_weapon",
      attack: 1,
      effect: "poisonous"
    }
  },
  {
    id: 31010,
    name: "Valeera the Hollow",
    manaCost: 9,
    type: "hero",
    rarity: "legendary",
    description: "Battlecry: Gain Stealth until your next turn. Combo: Also gain 5 Armor.",
    keywords: ["battlecry", "combo"],
    heroClass: "rogue",
    class: "Rogue",
    collectible: true,
    battlecry: {
      type: "gain_stealth_until_next_turn"
    },
    combo: {
      type: "gain_armor",
      value: 5
    },
    heroPower: {
      name: "Death's Shadow",
      description: "During your turn, add a Shadow Reflection to your hand.",
      effect: {
        type: "add_shadow_reflection"
      }
    }
  },
  
  // TOKEN CARDS
  {
    id: 31501,
    name: "The Coin",
    manaCost: 0,
    type: "spell",
    rarity: "common",
    description: "Gain 1 Mana Crystal this turn only.",
    keywords: [],
    heroClass: "neutral",
    class: "Neutral",
    collectible: false,
    spellEffect: {
      type: "gain_temp_mana",
      value: 1
    }
  }
];

// Export the array to be used in other files
export default comboCards;