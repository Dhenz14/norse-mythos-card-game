/**
 * Echo mechanic cards for Hearthstone clone
 * Echo allows cards to be replayed multiple times in a turn
 */
import { CardData, HeroClass } from '../types';

/**
 * Cards with the Echo keyword
 * These cards can be replayed multiple times in a turn
 */
export const   echoCards: CardData[] = [{
      id: 47457,

      name: "Warpath",
      manaCost: 2,

      type: "spell",
      rarity: "common",

      description: "Deal 1 damage to all minions.\nEcho",
      keywords: ["echo"],

      heroClass: "warrior",
      spellEffect: {
        type: "aoe_damage",
      value: 1,

      requiresTarget: false,
      targetType: "all_minions"},
      collectible: true,
      class: "Warrior"
},
  {
      id: 47249,

      name: "Witch's Apprentice",
      manaCost: 1,

      attack: 0,
      health: 1,

      type: "minion",
      rarity: "common",

      description: "Taunt\nEcho\nBattlecry: Add a random Shaman spell to your hand.",
    keywords: ["taunt", "echo", "battlecry"],
      heroClass: "shaman",
      class: "Shaman",

                  battlecry: {
        type: "discover",

          requiresTarget: false,
      targetType: "none",

      discoveryType: "spell",
      discoveryCount: 1},
      collectible: true
  },
  {
  id: 47312,
  
  name: "Hunting Mastiff",
  manaCost: 2,
  
  attack: 2,
  health: 1,
  
  type: "minion",
  rarity: "common",
  
  description: "Echo\nRush",
  keywords: ["echo", "rush"],
  heroClass: "hunter",
      class: "Hunter",
      collectible: true
  },
  {
  id: 47431,
  
  name: "Sound the Bells!",
  manaCost: 2,
  
  type: "spell",
  rarity: "common",
  
  description: "Give a minion +1/+2.\nEcho",
  keywords: ["echo"],
  
  heroClass: "paladin",
      class: "Paladin",
    spellEffect: {
  type: "buff",
  
  
  requiresTarget: true,
  
  targetType: "any_minion",
  buffAttack: 1,
  
  buffHealth: 2
  },
      collectible: true
  }
];