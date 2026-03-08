/**
 * Elder Titans Cards
 *
 * Migrated from client/src/game/data/oldGodsCards.ts on 2026-02-02
 * Contains the powerful Elder Titan mythic minions with unique effects:
 * - Gullveig: Grows stronger throughout the game and deals her damage when played
 * - Hyrrokkin: Resurrects friendly Deathrattle minions that died this game
 * - Utgarda-Loki: Casts random spells for each spell you've cast this game
 * - Fornjot: Summons a minion from your deck at the end of your turn
 *
 * ID Range: 60001-60103
 *
 * Internal effect keys (cthun_damage, buff_cthun, yogg_saron, etc.) kept for
 * backwards compatibility with existing game logic and save data.
 */
import { CardData } from '../../../../../types';

export const oldGodsCards: CardData[] = [
  {
    id: 60001,
    name: "Gullveig, the Thrice-Burned",
    manaCost: 10,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "mythic",
    description: "Battlecry: Deal damage equal to this minion's Attack randomly split among all enemies.",
    flavorText: "They burned her thrice upon Odin's pyre. Thrice she rose, and thrice the Aesir trembled.",
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
    name: "Seidr Acolyte",
    manaCost: 2,
    attack: 2,
    health: 3,
    type: "minion",
    rarity: "common",
    description: "Battlecry: Give your Gullveig +2/+2 (wherever she is).",
    flavorText: "She channels the forbidden art of seidr, feeding power to the sleeping goddess.",
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
    name: "Gullveig's Ember-Keeper",
    manaCost: 3,
    attack: 3,
    health: 4,
    type: "minion",
    rarity: "common",
    description: "At the end of your turn, give your Gullveig +1/+1 (wherever she is).",
    flavorText: "He tends the embers of her third burning, feeding them with his own life-force.",
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
    name: "Jotun Shieldbearer",
    manaCost: 7,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: If your Gullveig has at least 10 Attack, gain 10 Armor.",
    flavorText: "The frost giant stands ready to defend the reborn goddess with his life.",
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
    name: "Thrall of Gullveig",
    manaCost: 7,
    attack: 4,
    health: 6,
    type: "minion",
    rarity: 'epic',
    description: "Taunt",
    flavorText: "A warrior enslaved by Gullveig's burning gaze, doomed to serve beyond death.",
    keywords: ["taunt"],
    class: "Neutral",
    set: "core",
    collectible: false
  },
  {
    id: 60101,
    name: "Hyrrokkin, Launcher of the Dead",
    manaCost: 10,
    attack: 5,
    health: 7,
    type: "minion",
    rarity: "mythic",
    description: "Battlecry: Summon your Deathrattle minions that died this game.",
    flavorText: "She pushed Baldur's ship to sea with a single hand. Now she pushes the dead back from their graves.",
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
    name: "Utgarda-Loki, Lord of Illusions",
    manaCost: 10,
    attack: 7,
    health: 5,
    type: "minion",
    rarity: "mythic",
    description: "Battlecry: Cast a random spell for each spell you've cast this game (targets chosen randomly).",
    flavorText: "He made Thor drink the sea, wrestle Old Age, and lift the World Serpent. Imagine what his spells could do to you.",
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
    name: "Fornjot, the Primordial",
    manaCost: 10,
    attack: 10,
    health: 10,
    type: "minion",
    rarity: "mythic",
    description: "At the end of your turn, summon a minion from your deck.",
    flavorText: "Before the gods, before the Nine Realms, Fornjot stirred. From his blood came fire, sea, and wind.",
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
