import { CardData } from '../../../../../types';

export const paladinCards: CardData[] = [
  {
    id: 8001,
    name: "Baldur's Champion",
    manaCost: 8,
    attack: 6,
    health: 6,
    description: "Divine Shield. Taunt. Deathrattle: Equip a 5/3 Luminous Blade.",
    type: "minion",
    rarity: "legendary",
    class: "Paladin",
    keywords: ["divine_shield", "taunt", "deathrattle"],
    collectible: true,
    set: "core"
  },
  {
    id: 8002,
    name: "Heimdall's Judgment",
    manaCost: 4,
    description: "Deal 2 damage to all enemies.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    spellEffect: {
      type: "aoe_damage",
      value: 2,
      targetType: "all_enemy_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8003,
    name: "Sword of Tyr",
    manaCost: 4,
    attack: 4,
    durability: 2,
    description: "Whenever your hero attacks, restore 2 Health to it.",
    type: "weapon",
    rarity: "common",
    class: "Paladin",
    collectible: true,
    set: "core"
  },
  {
    id: 8004,
    name: "Blessing of Odin",
    manaCost: 4,
    description: "Give a minion +4/+4.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    spellEffect: {
      type: "buff",
      buffAttack: 4,
      buffHealth: 4,
      requiresTarget: true,
      targetType: "friendly_minion"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8005,
    name: "Balance of Themis",
    manaCost: 2,
    description: "Change the Health of ALL minions to 1.",
    type: "spell",
    rarity: "rare",
    class: "Paladin",
    spellEffect: {
      type: "buff",
      targetType: "all_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8006,
    name: "Touch of Eir",
    manaCost: 8,
    description: "Restore 8 Health. Draw 3 cards.",
    type: "spell",
    rarity: "epic",
    class: "Paladin",
    spellEffect: {
      type: "heal",
      value: 8,
      drawCards: 3
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8007,
    name: "Baldur's Radiance",
    manaCost: 2,
    description: "Restore 6 Health.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    spellEffect: {
      type: "heal",
      value: 6,
      targetType: "any"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8008,
    name: "Blessing of Freya",
    manaCost: 3,
    description: "Draw cards until you have as many in hand as your opponent.",
    type: "spell",
    rarity: "rare",
    class: "Paladin",
    collectible: true,
    set: "core"
  },
  {
    id: 8009,
    name: "Thor's Wrath",
    manaCost: 4,
    description: "Deal 3 damage. Draw a card.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    spellEffect: {
      type: "damage",
      value: 3,
      drawCards: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8010,
    name: "Odin's Vengeance",
    manaCost: 6,
    description: "Deal 8 damage randomly split among all enemies.",
    type: "spell",
    rarity: "epic",
    class: "Paladin",
    spellEffect: {
      type: "random_damage",
      missiles: 8,
      damagePerMissile: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8011,
    name: "Strength of Thor",
    manaCost: 1,
    description: "Give a minion +3 Attack.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    spellEffect: {
      type: "buff",
      buffAttack: 3,
      targetType: "friendly_minion"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8012,
    name: "Baldur's Ward",
    manaCost: 1,
    description: "Give a minion Divine Shield.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    spellEffect: {
      type: "grant_keyword",
      keyword: "divine_shield",
      targetType: "friendly_minion"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8013,
    name: "Rune of Submission",
    manaCost: 1,
    description: "Change a minion's Attack to 1.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    spellEffect: {
      type: "set_attack",
      value: 1,
      targetType: "any_minion"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 8014,
    name: "Divine Retribution",
    manaCost: 1,
    description: "Secret: When your opponent plays a minion, reduce its Health to 1.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    keywords: ["secret"],
    collectible: true,
    set: "core"
  },
  {
    id: 8015,
    name: "Resurrection Rune",
    manaCost: 1,
    description: "Secret: When a friendly minion dies, return it to life with 1 Health.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    keywords: ["secret"],
    collectible: true,
    set: "core"
  },
  {
    id: 8016,
    name: "Einherjar's Valor",
    manaCost: 1,
    description: "Secret: When an enemy attacks, summon a 2/1 Defender as the new target.",
    type: "spell",
    rarity: "common",
    class: "Paladin",
    keywords: ["secret"],
    collectible: true,
    set: "core"
  },
  {
    id: 8501,
    name: "Luminous Blade",
    manaCost: 5,
    attack: 5,
    durability: 3,
    description: "Legendary weapon wielded by Baldur's Champion.",
    type: "weapon",
    rarity: "legendary",
    class: "Paladin",
    collectible: false,
    set: "core"
  },
  {
    id: 8502,
    name: "Einherjar Recruit",
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "Summoned by the Paladin Hero Power.",
    type: "minion",
    rarity: "common",
    class: "Paladin",
    collectible: false,
    set: "core"
  },
  {
    id: 20018,
    name: "Baldur the Radiant",
    manaCost: 8,
    attack: 6,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Deathrattle: Equip a 5/2 Corrupted Ashbringer that gives your other minions +2 Attack.",
    flavorText: "The beloved god of light, whose death heralds Ragnarok.",
    keywords: ["taunt", "deathrattle"],
    class: "Paladin",
    collectible: true,
    set: "core",
    deathrattle: {
      type: "summon",
      targetType: "none"
    }
  },
  {
    id: 20023,
    name: "Athena, War Maiden",
    manaCost: 7,
    attack: 4,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Add a copy of each spell you've cast on friendly characters this game to your hand.",
    flavorText: "Goddess of wisdom and warfare, she remembers every blessing.",
    keywords: ["battlecry"],
    class: "Paladin",
    collectible: true,
    set: "core",
    battlecry: {
      type: "draw",
      requiresTarget: false,
      targetType: "none",
      value: 1
    }
  },
  {
    id: 20404,
    name: "Pegasus, the Immortal",
    manaCost: 7,
    attack: 7,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Rush, Divine Shield. Can't be targeted by spells or Hero Powers.",
    flavorText: "The divine winged horse born from Medusa's blood.",
    keywords: ["rush", "divine_shield"],
    race: "beast",
    class: "Paladin",
    cantBeTargetedBySpells: true,
    collectible: true,
    set: "core"
  },
  {
    id: 20406,
    name: "Theseus, the Equalizer",
    manaCost: 6,
    attack: 3,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Set all other minions' Attack and Health to 3.",
    flavorText: "The hero who slew the Minotaur brought balance to the arena.",
    keywords: ["battlecry"],
    class: "Paladin",
    collectible: true,
    set: "core",
    battlecry: {
      type: "set_stats",
      requiresTarget: false,
      targetType: "all_other_minions",
      setAttack: 3,
      setHealth: 3
    }
  },
  // === Echo Card ===
  {
    id: 47431,
    name: "Sound the Bells!",
    manaCost: 2,
    type: "spell",
    rarity: "common",
    description: "Give a minion +1/+2. Echo",
    keywords: ["echo"],
    class: "Paladin",
    spellEffect: {
      type: "buff",
      requiresTarget: true,
      targetType: "any_minion",
      buffAttack: 1,
      buffHealth: 2
    },
    collectible: true,
    set: "core"
  },
  // === Dormant Card ===
  {
    id: 10006,
    name: "Bound Sun-Serpent",
    manaCost: 1,
    attack: 2,
    health: 1,
    type: "minion",
    rarity: "common",
    race: "murloc",
    description: "Dormant for 2 turns. When this awakens, summon two 1/1 Murlocs.",
    flavorText: "Apollo's golden serpent, coiled in slumber beneath the waves.",
    keywords: ["dormant"],
    class: "Paladin",
    collectible: true,
    set: "core",
    dormantTurns: 2,
    awakenEffect: {
      type: "summon",
      summonCount: 2,
      value: 1
    }
  },
  // === Reborn Card ===
  {
    id: 19004,
    name: "Ancestral Guardian",
    manaCost: 4,
    attack: 4,
    health: 2,
    type: "minion",
    rarity: "common",
    description: "Lifesteal, Reborn",
    keywords: ["lifesteal", "reborn"],
    class: "Paladin",
    collectible: true,
    set: "core"
  },
  // === Spellburst Card ===
  {
    id: 18003,
    name: "Goody Two-Shields",
    manaCost: 3,
    attack: 4,
    health: 2,
    type: "minion",
    rarity: "epic",
    description: "Divine Shield. Spellburst: Gain Divine Shield.",
    keywords: ["divine_shield", "spellburst"],
    class: "Paladin",
    spellburstEffect: {
      type: "buff",
      targetType: "self",
      consumed: false
    },
    collectible: true,
    set: "core"
  },
  // === Magnetic Card ===
  {
    id: 20008,
    name: "Glow-Tron",
    manaCost: 1,
    attack: 1,
    health: 3,
    type: "minion",
    rarity: "common",
    race: "mech",
    description: "Magnetic",
    keywords: ["magnetic"],
    class: "Paladin",
    collectible: true,
    set: "core"
  },
  // === Migrated from additionalClassMinions.ts ===
  {
    id: 40005,
    name: "Heimdall's Warden",
    manaCost: 3,
    attack: 3,
    health: 3,
    type: "minion",
    rarity: "rare",
    description: "Battlecry: Change an enemy minion's Attack to 1.",
    flavorText: "The guardian of the rainbow bridge enforces peace—or brings divine judgment.",
    keywords: ["battlecry"],
    class: "Paladin",
    battlecry: {
      type: "debuff",
      requiresTarget: true,
      targetType: "enemy_minion",
      setAttack: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 40006,
    name: "Sol's Walker",
    manaCost: 6,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "rare",
    description: "Taunt, Divine Shield",
    flavorText: "She walks in the radiant light of Sol, the Norse sun goddess.",
    keywords: ["taunt", "divine_shield"],
    class: "Paladin",
    collectible: true,
    set: "core"
  },
  // === Migrated from additionalSpellCards.ts ===
  {
    id: 8509,
    name: "Odin's Vengeance",
    manaCost: 6,
    type: "spell",
    rarity: "epic",
    description: "Deal 8 damage randomly split among all enemies.",
    flavorText: "Divine fury rains from above.",
    class: "Paladin",
    spellEffect: {
      type: "damage",
      value: 8,
      requiresTarget: false,
      targetType: "all_enemy_minions_and_hero",
      isRandom: true,
      isSplit: true
    },
    collectible: true,
    set: "core"
  },
  // === New Holy Spell ===
  {
    id: 8520,
    name: "Gleaming Aura",
    manaCost: 3,
    type: "spell",
    rarity: "rare",
    description: "Give a friendly minion +2 Health and Divine Shield.",
    flavorText: "A shimmering light guards the worthy.",
    keywords: [],
    class: "Paladin",
    spellEffect: {
      type: "buff",
      buffHealth: 2,
      grantKeywords: ["divine_shield"],
      targetType: "friendly_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  }
];
