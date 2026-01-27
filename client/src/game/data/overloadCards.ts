/**
 * Overload Cards Collection
 * 
 * Overload is a mechanic associated with the Shaman class in Hearthstone.
 * When cards with Overload are played, they lock a certain number of mana crystals 
 * on the player's next turn, limiting the amount of mana available.
 */
import { CardData, CardKeyword } from '../types';

/**
 * Collection of cards with the Overload mechanic
 * Most of these are Shaman cards, as Overload is their class-specific mechanic
 */
export const overloadCards: CardData[] = [
  {
      id: 35001,
      name: "Fenrir's Call",
      manaCost: 3,
      type: "spell",
      rarity: "rare",
      description: "Summon two 2/3 Spirit Wolves with Taunt. Overload: (2)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      spellEffect: {
        type: "summon",
        value: 2, // Number of wolves to summon
        requiresTarget: false,
        targetType: "none",
        summonCardId: 35003 // ID of the Spirit Wolf token
      },
      overload: {
        amount: 2
      },
      collectible: true
  },
  {
      id: 35004,
      name: "Forked Lightning",
      manaCost: 1,
      type: "spell",
      rarity: "common",
      description: "Deal 2 damage to 2 random enemy minions. Overload: (2)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      spellEffect: {
        type: "damage",
        value: 2,
        requiresTarget: false,
        targetType: "random_enemy_minions",
        targetCount: 2 // Number of targets to hit
      },
      overload: {
        amount: 2
      },
      collectible: true
  },
  {
      id: 35005,
      name: "Muspel Burst",
      manaCost: 3,
      type: "spell",
      rarity: "rare",
      description: "Deal 5 damage. Overload: (2)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      spellEffect: {
        type: "damage",
        value: 5,
        requiresTarget: true,
        targetType: "any"
      },
      overload: {
        amount: 2
      },
      collectible: true
  },
  {
      id: 35006,
      name: "Earth Elemental",
      manaCost: 5,
      attack: 7,
      health: 8,
      type: "minion",
      rarity: "epic",
      description: "Taunt. Overload: (3)",
      keywords: ["taunt", "overload"],
      heroClass: "shaman",
      class: "Shaman",
      race: "elemental",
      overload: {
        amount: 3
      },
      collectible: true
  },
  {
      id: 35007,
      name: "Mjölnir's Echo",
      manaCost: 5,
      attack: 2,
      durability: 8,
      type: "weapon",
      rarity: "epic",
      description: "Windfury, Overload: (2)",
      keywords: ["windfury", "overload"],
      heroClass: "shaman",
      class: "Shaman",
      overload: {
        amount: 2
      },
      collectible: true
  },
  {
      id: 35008,
      name: "Ragnarök Storm",
      manaCost: 3,
      type: "spell",
      rarity: "epic",
      description: "Deal 4-5 damage to all minions. Overload: (5)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      spellEffect: {
        type: "damage",
        value: 5, // Maximum damage
        minValue: 4, // Minimum damage
        isRandom: true,
        requiresTarget: false,
        targetType: "all_minions"
      },
      overload: {
        amount: 5
      },
      collectible: true
  },
  {
      id: 35009,
      name: "Lightning Surge",
      manaCost: 1,
      type: "spell",
      rarity: "common",
      description: "Deal 3 damage to a minion. Overload: (1)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      overload: {
        amount: 1
      },
      spellEffect: {
        type: "damage",
        value: 3,
        requiresTarget: true,
        targetType: "any_minion"
      },
      collectible: true
  },
  {
      id: 35010,
      name: "Storm Elemental",
      manaCost: 4,
      type: "minion",
      rarity: "rare",
      race: "Elemental",
      attack: 4,
      health: 4,
      description: "Battlecry: Deal 1 damage to all enemy minions. Overload: (1)",
      keywords: ["overload", "battlecry"],
      heroClass: "shaman",
      class: "Shaman",
      overload: {
        amount: 1
      },
      battlecry: {
        type: "damage",
        value: 1,
        targetType: "all_enemy_minions"
      },
      collectible: true
  },
  {
      id: 35011,
      name: "Tidal Surge",
      manaCost: 3,
      type: "spell",
      rarity: "common",
      description: "Restore 4 Health to all friendly characters. Overload: (1)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      overload: {
        amount: 1
      },
      spellEffect: {
        type: "heal",
        value: 4,
        requiresTarget: false,
        targetType: "all_friendly"
      },
      collectible: true
  },
  {
      id: 35012,
      name: "Chain Lightning",
      manaCost: 2,
      type: "spell",
      rarity: "rare",
      description: "Deal 2 damage to a minion and adjacent ones. Overload: (1)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      overload: {
        amount: 1
      },
      spellEffect: {
        type: "damage_adjacent",
        value: 2,
        requiresTarget: true,
        targetType: "any_minion"
      },
      collectible: true
  },
  {
      id: 35013,
      name: "Earth Revenant",
      manaCost: 5,
      type: "minion",
      rarity: "epic",
      race: "Elemental",
      attack: 3,
      health: 6,
      description: "Taunt. Battlecry: Deal 1 damage to all minions. Overload: (1)",
      keywords: ["overload", "taunt", "battlecry"],
      heroClass: "shaman",
      class: "Shaman",
      overload: {
        amount: 1
      },
      battlecry: {
        type: "damage",
        value: 1,
        targetType: "all_minions"
      },
      collectible: true
  },
  {
      id: 35014,
      name: "Mjölnir Storm",
      manaCost: 3,
      type: "spell",
      rarity: "rare",
      description: "Deal 2-3 damage to all enemy minions. Overload: (2)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      overload: {
        amount: 2
      },
      spellEffect: {
        type: "damage_random_range",
        minValue: 2,
        maxValue: 3,
        requiresTarget: false,
        targetType: "all_enemy_minions"
      },
      collectible: true
  },
  {
      id: 35015,
      name: "Thunderhead",
      manaCost: 4,
      type: "minion",
      rarity: "epic",
      race: "Elemental",
      attack: 3,
      health: 5,
      description: "After you play a card with Overload, summon two 1/1 Sparks with Rush.",
      heroClass: "shaman",
      class: "Shaman",
      collectible: true,
      onPlayCardEffect: {
        type: "summon",
        value: 2,
        summonCardId: 35016,
        triggerCondition: "play_overload_card"
      }
  },
  {
      id: 35016,
      name: "Spark",
      manaCost: 1,
      type: "minion",
      rarity: "common",
      attack: 1,
      health: 1,
      description: "Rush",
      keywords: ["rush"],
      heroClass: "shaman",
      class: "Shaman",
      collectible: false
  },
  {
      id: 35017,
      name: "Ancestral Call",
      manaCost: 4,
      type: "spell",
      rarity: "rare",
      description: "Summon a random minion from each player's hand. Overload: (2)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      overload: {
        amount: 2
      },
      spellEffect: {
        type: "summon_from_hand",
        value: 1,
        requiresTarget: false,
        targetType: "both_players_hand"
      },
      collectible: true
  },
  {
      id: 35018,
      name: "Stormbringer",
      manaCost: 6,
      type: "spell",
      rarity: "legendary",
      description: "Transform your minions into random Legendary minions. Overload: (3)",
      keywords: ["overload"],
      heroClass: "shaman",
      class: "Shaman",
      overload: {
        amount: 3
      },
      spellEffect: {
        type: "transform_all",
        requiresTarget: false,
        targetType: "friendly_minions",
        transformType: "random_legendary_minion"
      },
      collectible: true
  }
      ];

// Spirit Wolf token (summoned by Fenrir's Call)
export const overloadTokens: CardData[] = [
  {
      id: 35003,
      name: "Spirit Wolf",
      manaCost: 2,
      attack: 2,
      health: 3,
      type: "minion",
      rarity: "common",
      description: "Taunt",
      keywords: ["taunt"],
      heroClass: "shaman",
      class: "Shaman",
      race: "beast",
      collectible: false
  }
      ];

// Combined collection for export
export const allOverloadCards: CardData[] = [...overloadCards, ...overloadTokens];

// Default export
export default allOverloadCards;