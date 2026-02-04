/**
 * Additional legendary cards for Hearthstone clone
 * More powerful and unique cards with game-changing effects
 */
import { CardData } from '../types';

/**
 * Collection of additional legendary minions
 * Expanding the legendary roster with more class-specific and neutral options
 */
export const additionalLegendaryCards: CardData[] = [
{
    id: 20025,
    name: "Níðhöggr",
    manaCost: 9,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Set a hero's remaining Health to 15.",
    keywords: [
      "battlecry"
    ],
    heroClass: "neutral",
    class: "Neutral",
    race: "dragon",
    battlecry: {
      type: "set_health",
      value: 15,
      requiresTarget: true,
      targetType: "any_hero"
    },
    collectible: true
  },
{
    id: 20026,
    name: "Jörmungandr, Dream Serpent",
    manaCost: 9,
    attack: 4,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "At the end of your turn, add a Dream Card to your hand.",
    keywords: [],
    heroClass: "neutral",
    class: "Neutral",
    race: "dragon",
    collectible: true
  },
{
    id: 20027,
    name: "Apophis, World Ender",
    manaCost: 10,
    attack: 12,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy all other minions and discard your hand.",
    keywords: [
      "battlecry"
    ],
    heroClass: "neutral",
    class: "Neutral",
    race: "dragon",
    battlecry: {
      type: "destroy",
      requiresTarget: false,
      targetType: "all_minions",
      discardCount: -1,
      summonCardId: 20028
    },
    collectible: true
  },
{
    id: 20028,
    name: "Völva Bloodweaver",
    manaCost: 2,
    attack: 1,
    health: 1,
    type: "minion",
    rarity: "legendary",
    description: "Spell Damage +1. Deathrattle: Draw a card.",
    keywords: [
      "deathrattle"
    ],
    heroClass: "neutral",
    class: "Neutral",
    spellPower: 1,
    deathrattle: {
      type: "draw",
      value: 1,
      targetType: "none"
    },
    collectible: true
  },
{
    id: 20029,
    name: "Víðarr the Bold",
    manaCost: 5,
    attack: 6,
    health: 2,
    type: "minion",
    rarity: "legendary",
    description: "Charge. Battlecry: Summon two 1/1 Whelps for your opponent.",
    keywords: [
      "charge",
      "battlecry"
    ],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "summon",
      requiresTarget: false,
      targetType: "none",
      summonCount: 2,
      summonForOpponent: true,
      summonCardId: 20030
    },
    collectible: true
  },
{
    id: 20030,
    name: "Fáfnir, Spell Wyrm",
    manaCost: 9,
    attack: 4,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "Spell Damage +5",
    keywords: [],
    heroClass: "neutral",
    class: "Neutral",
    race: "dragon",
    spellPower: 5,
    collectible: true
  },
{
    id: 20042,
    name: "Perseus the Relic Hunter",
    manaCost: 5,
    attack: 5,
    health: 4,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy your opponent's weapon and draw cards equal to its Durability.",
    keywords: [
      "battlecry"
    ],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "destroy_weapon_draw",
      requiresTarget: false,
      targetType: "enemy_weapon"
    },
    collectible: true
  },
{
    id: 20043,
    name: "Níðhöggr's Champion",
    manaCost: 6,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy an enemy minion with Taunt.",
    keywords: [
      "battlecry"
    ],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "destroy",
      requiresTarget: true,
      targetType: "enemy_taunt"
    },
    collectible: true
  },
{
    id: 20044,
    name: "Nótt Stargazer",
    manaCost: 4,
    attack: 3,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Shuffle the 'Map to the Golden Monkey' into your deck.",
    keywords: [
      "battlecry"
    ],
    heroClass: "neutral",
    class: "Neutral",
    battlecry: {
      type: "shuffle_special",
      cardName: "Map to the Golden Monkey",
      requiresTarget: false
    },
    collectible: true
  },
{
    id: 20031,
    name: "Kalimos, Primal Lord",
    manaCost: 8,
    attack: 7,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: If you played an Elemental last turn, cast an Elemental Invocation.",
    keywords: [
      "battlecry",
      "discover"
    ],
    heroClass: "shaman",
    class: "Shaman",
    race: "elemental",
    battlecry: {
      type: "discover",
      requiresTarget: false,
      targetType: "none",
      discoveryType: "spell",
      discoveryCount: 4,
      discoveryClass: "shaman"
    },
    collectible: true
  },
{
    id: 20032,
    name: "Lyra the Sunshard",
    manaCost: 5,
    attack: 3,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Whenever you cast a spell, add a random Priest spell to your hand.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    race: "elemental",
    collectible: true
  },
{
    id: 20033,
    name: "Valeera the Hollow",
    manaCost: 9,
    type: "hero",
    rarity: "legendary",
    description: "Battlecry: Gain Stealth until your next turn. Passive Hero Power: During your turn, add a Shadow Reflection to your hand.",
    keywords: [
      "battlecry"
    ],
    heroClass: "rogue",
    class: "Rogue",
    armor: 5,
    battlecry: {
      type: "buff",
      requiresTarget: false,
      targetType: "none",
      buffAttack: 1,
      buffHealth: 1
    },
    collectible: true
  },
{
    id: 20034,
    name: "Khadgar",
    manaCost: 2,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "legendary",
    description: "Your cards that summon minions summon twice as many.",
    keywords: [],
    heroClass: "mage",
    class: "Mage",
    collectible: true
  },
{
    id: 20035,
    name: "Anub'arak",
    manaCost: 9,
    attack: 8,
    health: 4,
    type: "minion",
    rarity: "legendary",
    description: "Deathrattle: Return this to your hand and summon a 4/4 Nerubian.",
    keywords: [
      "deathrattle"
    ],
    heroClass: "rogue",
    class: "Rogue",
    deathrattle: {
      type: "summon",
      summonCardId: 40115,
      targetType: "none"
    },
    collectible: true
  },
{
    id: 20037,
    name: "Zul'jin",
    manaCost: 10,
    type: "hero",
    rarity: "legendary",
    description: "Battlecry: Cast all spells you've played this game (targets chosen randomly).",
    keywords: [
      "battlecry"
    ],
    heroClass: "hunter",
    class: "Hunter",
    armor: 5,
    battlecry: {
      type: "cast_all_spells",
      requiresTarget: false,
      targetType: "none"
    },
    collectible: true
  },
{
    id: 20038,
    name: "Skull of Gul'dan",
    manaCost: 6,
    type: "spell",
    rarity: "legendary",
    description: "Draw 3 cards. Outcast: Reduce their Cost by (3).",
    keywords: [
      "outcast"
    ],
    heroClass: "demonhunter",
    class: "Demonhunter",
    spellEffect: {
      type: "draw",
      value: 3,
      requiresTarget: false,
      targetType: "none"
    },
    outcastEffect: {
      type: "mana_reduction",
      value: 3,
      targetRequired: false
    },
    collectible: true
  }
];

// Export the additional legendary cards
export default additionalLegendaryCards;