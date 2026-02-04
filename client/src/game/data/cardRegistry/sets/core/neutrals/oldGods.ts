/**
 * Old Gods Cards
 * 
 * Migrated from client/src/game/data/oldGodsCards.ts on 2026-02-02
 * Contains the powerful Old Gods legendary minions with unique effects:
 * - C'Thun: Grows stronger throughout the game and deals its damage when played
 * - N'Zoth: Resurrects friendly Deathrattle minions that died this game
 * - Yogg-Saron: Casts random spells for each spell you've cast this game
 * - Y'Shaarj: Summons a minion from your deck at the end of your turn
 * 
 * ID Range: 60001-60103
 */
import { CardData } from '../../../../../types';

export const oldGodsCards: CardData[] = [
  {
    id: 60001,
    name: "C'Thun",
    manaCost: 10,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal damage equal to this minion's Attack randomly split among all enemies.",
    flavorText: "The ancient one awakens, its eyes seeing across all dimensions.",
    keywords: ["battlecry"],
    class: "Neutral",
    set: "core",
    battlecry: {
      type: "cthun_damage",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  {
    id: 60002,
    name: "Beckoner of Evil",
    manaCost: 2,
    attack: 2,
    health: 3,
    type: "minion",
    rarity: "common",
    description: "Battlecry: Give your C'Thun +2/+2 (wherever it is).",
    flavorText: "The cultist calls to the sleeping god, offering power for power.",
    keywords: ["battlecry"],
    class: "Neutral",
    set: "core",
    battlecry: {
      type: "buff_cthun",
      requiresTarget: false,
      targetType: "none",
      buffAttack: 2,
      buffHealth: 2
    },
    collectible: true
  },
  {
    id: 60005,
    name: "Twilight Elder",
    manaCost: 3,
    attack: 3,
    health: 4,
    type: "minion",
    rarity: "common",
    description: "At the end of your turn, give your C'Thun +1/+1 (wherever it is).",
    flavorText: "Age has not dimmed his devotion to the Old Gods.",
    keywords: [],
    class: "Neutral",
    set: "core",
    effects: [
      {
        type: "end_of_turn",
        value: 1,
        endOfTurnEffect: "buff_cthun"
      }
    ],
    collectible: true
  },
  {
    id: 60008,
    name: "Jötun Shieldbearer",
    manaCost: 7,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: If your C'Thun has at least 10 Attack, gain 10 Armor.",
    flavorText: "The frost giant stands ready to defend the awakening god.",
    keywords: ["battlecry"],
    class: "Warrior",
    set: "core",
    battlecry: {
      type: "conditional_armor",
      requiresTarget: false,
      targetType: "none",
      condition: "cthun_attack_10",
      armorGain: 10
    },
    collectible: true
  },
  {
    id: 60010,
    name: "Emperor Vek'nilash",
    manaCost: 7,
    attack: 4,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Taunt",
    flavorText: "One of the Twin Emperors, summoned to guard the ancient temple.",
    keywords: ["taunt"],
    class: "Neutral",
    set: "core",
    collectible: false
  },
  {
    id: 60101,
    name: "N'Zoth, the Corruptor",
    manaCost: 10,
    attack: 5,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Summon your Deathrattle minions that died this game.",
    flavorText: "The master of corruption returns his servants from death.",
    keywords: ["battlecry"],
    class: "Neutral",
    set: "core",
    battlecry: {
      type: "resurrect_deathrattle",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  {
    id: 60102,
    name: "Yogg-Saron, Hope's End",
    manaCost: 10,
    attack: 7,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Cast a random spell for each spell you've cast this game (targets chosen randomly).",
    flavorText: "The god of death casts the chaos of a thousand spells.",
    keywords: ["battlecry"],
    class: "Neutral",
    set: "core",
    battlecry: {
      type: "yogg_saron",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
  {
    id: 60103,
    name: "Y'Shaarj, Rage Unbound",
    manaCost: 10,
    attack: 10,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "At the end of your turn, summon a minion from your deck.",
    flavorText: "The greatest of the Old Gods, rage incarnate.",
    keywords: [],
    class: "Neutral",
    set: "core",
    effects: [
      {
        type: "end_of_turn",
        value: 1,
        endOfTurnEffect: "summon_from_deck"
      }
    ],
    collectible: true
  }
];
