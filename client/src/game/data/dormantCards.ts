/**
 * Dormant Cards Implementation
 * 
 * The Dormant keyword was introduced in Ashes of Outland expansion.
 * Dormant minions can't attack, be attacked, or take damage for a specified number of turns.
 * After the dormant period is over, they "awaken" and gain their full abilities.
 */
import { CardData } from '../types';

/**
 * Collection of minions with the Dormant keyword
 */
const dormantCards: CardData[] = [
  {
    id: 10001,
    name: "Imprisoned Observer",
    manaCost: 3,
    attack: 4,
    health: 5,
    type: 'minion',
    rarity: 'rare',
    heroClass: 'mage',
    class: 'Mage',
    race: 'demon',
    keywords: ['dormant'],
    description: "Dormant for 2 turns. When this awakens, deal 2 damage to all enemy minions.",
    collectible: true,
    dormantTurns: 2,
    awakenEffect: {
      type: 'damage',
      targetType: 'all_enemy_minions',
      value: 2
    }
  },
  {
    id: 10002,
    name: "Imprisoned Satyr",
    manaCost: 3,
    attack: 3,
    health: 3,
    type: 'minion',
    rarity: 'rare',
    heroClass: 'druid',
    class: 'Druid',
    race: 'demon',
    keywords: ['dormant'],
    description: "Dormant for 2 turns. When this awakens, reduce the Cost of a random minion in your hand by (5).",
    collectible: true,
    dormantTurns: 2,
    awakenEffect: {
      type: 'mana_discount',
      targetType: 'hand_minion',
      value: 5,
      isRandom: true
    }
  },
  {
    id: 10003,
    name: "Imprisoned Vilefiend",
    manaCost: 2,
    attack: 3,
    health: 5,
    type: 'minion',
    rarity: 'common',
    heroClass: 'neutral',
    class: 'Neutral',
    race: 'demon',
    keywords: ['dormant', 'rush'],
    description: "Dormant for 2 turns. Rush",
    dormantTurns: 2,
    // No special awaken effect, just becomes active with Rush
    collectible: true
  },
  {
    id: 10004,
    name: "Imprisoned Felmaw",
    manaCost: 2,
    attack: 5,
    health: 4,
    type: 'minion',
    rarity: 'rare',
    heroClass: 'hunter',
    class: 'Hunter',
    race: 'beast',
    keywords: ['dormant', 'rush'],
    description: "Dormant for 2 turns. Rush. Attacks a random enemy after this awakens.",
    collectible: true,
    dormantTurns: 2,
    awakenEffect: {
      type: 'random_damage',
      targetType: 'random_enemy',
      useAttackValue: true
    }
  },
  {
    id: 10005,
    name: "Imprisoned Gan'arg",
    manaCost: 1,
    attack: 2,
    health: 2,
    type: 'minion',
    rarity: 'common',
    heroClass: 'demonhunter',
    class: 'Demonhunter',
    race: 'demon',
    keywords: ['dormant'],
    description: "Dormant for 2 turns. When this awakens, equip a 3/2 Flamereaper.",
    collectible: true,
    dormantTurns: 2,
    awakenEffect: {
      type: 'equip_weapon',
      // Special handling for the Flamereaper weapon
      value: 3, // Attack value of the Flamereaper
      durability: 2 // Durability of the Flamereaper
    }
  },
  {
    id: 10006,
    name: "Imprisoned Sungill",
    manaCost: 1,
    attack: 2,
    health: 1,
    type: 'minion',
    rarity: 'common',
    heroClass: 'paladin',
    class: 'Paladin',
    race: 'murloc',
    keywords: ['dormant'],
    description: "Dormant for 2 turns. When this awakens, summon two 1/1 Murlocs.",
    collectible: true,
    dormantTurns: 2,
    awakenEffect: {
      type: 'summon',
      summonCount: 2,
      // Special handling for Murloc tokens
      value: 1 // Indicates 1/1 stats
    }
  },
  {
    id: 10007,
    name: "Magtheridon",
    manaCost: 4,
    attack: 12,
    health: 12,
    type: 'minion',
    rarity: 'legendary',
    heroClass: 'neutral',
    class: 'Neutral',
    race: 'demon',
    keywords: ['dormant'],
    description: "Dormant. After you play 3 minions in a turn, destroy all other minions and awaken.",
    collectible: true,
    dormantTurns: -1, // Special value for conditional awakening
    awakenCondition: {
      type: 'play_minions',
      count: 3,
      inOneTurn: true
    },
    awakenEffect: {
      type: 'damage',
      targetType: 'all_other_minions',
      value: 1000 // Special value indicating destruction
    }
  },
  {
    id: 10008,
    name: "Flamereaper",
    manaCost: 7,
    attack: 3,
    durability: 2,
    type: 'weapon',
    rarity: 'epic',
    heroClass: 'demonhunter',
    class: 'Demonhunter',
    description: "Also attacks the minions next to whomever your hero attacks.",
    keywords: [],
    collectible: true
  },
  {
    id: 10009,
    name: "Imprisoned Antaen",
    manaCost: 5,
    attack: 10,
    health: 6,
    type: 'minion',
    rarity: 'rare',
    heroClass: 'demonhunter',
    class: 'Demonhunter',
    race: 'demon',
    keywords: ['dormant'],
    description: "Dormant for 2 turns. When this awakens, deal 10 damage randomly split among all enemies.",
    collectible: true,
    dormantTurns: 2,
    awakenEffect: {
      type: 'damage',
      targetType: 'all_enemy_minions_and_hero',
      value: 1,
      isSplit: true,
      targetsCount: 10,
      isRandom: true
    }
  },
  {
    id: 10010,
    name: "Imprisoned Scrap Imp",
    manaCost: 2,
    attack: 3,
    health: 3,
    type: 'minion',
    rarity: 'rare',
    heroClass: 'warlock',
    class: 'Warlock',
    race: 'demon',
    keywords: ['dormant'],
    description: "Dormant for 2 turns. When this awakens, give all minions in your hand +2/+2.",
    collectible: true,
    dormantTurns: 2,
    awakenEffect: {
      type: 'buff_hand',
      targetType: 'none',
      buffAttack: 2,
      buffHealth: 2
    }
  },
  {
    id: 10011,
    name: "Imprisoned Homunculus",
    manaCost: 1,
    attack: 2,
    health: 5,
    type: 'minion',
    rarity: 'common',
    heroClass: 'priest',
    class: 'Priest',
    race: 'demon',
    keywords: ['dormant', 'taunt'],
    description: "Dormant for 2 turns. Taunt",
    dormantTurns: 2,
    // No special awaken effect, just becomes active with Taunt
    collectible: true
  }
];

export default dormantCards;