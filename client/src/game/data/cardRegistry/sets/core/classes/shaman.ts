import { CardData } from '../../../../../types';

export const shamanCards: CardData[] = [
  {
    id: 5201,
    name: "Muspel's Ember",
    manaCost: 6,
    attack: 6,
    health: 5,
    description: "Battlecry: Deal 3 damage.",
    flavorText: "A living fragment of Muspelheim's eternal flame.",
    type: "minion",
    rarity: "common",
    class: "Shaman",
    race: "Elemental",
    keywords: ["battlecry"],
    battlecry: {
      type: "damage",
      value: 3,
      requiresTarget: true,
      targetType: "any"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5202,
    name: "Surtr's Totem",
    manaCost: 2,
    attack: 0,
    health: 3,
    description: "Adjacent minions have +2 Attack.",
    type: "minion",
    rarity: "common",
    class: "Shaman",
    race: "Totem",
    aura: {
      type: "attack_buff",
      value: 2,
      targetType: "adjacent_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5115,
    name: "Nerida, Wave Keeper",
    manaCost: 3,
    attack: 4,
    health: 3,
    description: "Spell Damage +1. Deathrattle: Shuffle 'Nerida Prime' into your deck.",
    type: "minion",
    rarity: "legendary",
    class: "Shaman",
    race: "Naga",
    keywords: ["spell_damage", "deathrattle"],
    deathrattle: {
      type: "shuffle_into_deck",
      summonCardId: 5252,
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5116,
    name: "Leviathan's Child",
    manaCost: 6,
    attack: 6,
    health: 5,
    description: "Battlecry: Deal 3 damage to an enemy minion. If it dies, repeat on one of its neighbors.",
    type: "minion",
    rarity: "legendary",
    class: "Shaman",
    race: "Beast",
    keywords: ["battlecry"],
    battlecry: {
      type: "damage",
      value: 3,
      targetType: "enemy_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5117,
    name: "Aeolus, Wind Tyrant",
    manaCost: 8,
    attack: 3,
    health: 5,
    description: "Charge, Divine Shield, Taunt, Windfury",
    type: "minion",
    rarity: "legendary",
    class: "Shaman",
    race: "Elemental",
    keywords: ["charge", "divine_shield", "taunt", "windfury"],
    collectible: true,
    set: "core"
  },
  {
    id: 5221,
    name: "Thor's Strike",
    manaCost: 1,
    description: "Deal 3 damage. Overload: (1)",
    type: "spell",
    rarity: "common",
    class: "Shaman",
    keywords: ["overload"],
    spellEffect: {
      type: "damage",
      value: 3,
      targetType: "any",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5222,
    name: "Thor's Fury",
    manaCost: 3,
    description: "Deal 2-3 damage to all enemy minions. Overload: (2)",
    type: "spell",
    rarity: "rare",
    class: "Shaman",
    keywords: ["overload"],
    spellEffect: {
      type: "aoe_damage",
      value: 2,
      targetType: "all_enemy_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5223,
    name: "Loki's Trick",
    manaCost: 4,
    description: "Transform a minion into a 0/1 Frog with Taunt.",
    type: "spell",
    rarity: "common",
    class: "Shaman",
    spellEffect: {
      type: "transform",
      targetType: "any_minion",
      requiresTarget: true,
      summonCardId: 5251
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5118,
    name: "Berserker's Rage",
    manaCost: 5,
    description: "Give your minions +3 Attack this turn.",
    type: "spell",
    rarity: "common",
    class: "Shaman",
    spellEffect: {
      type: "buff",
      buffAttack: 3,
      targetType: "friendly_minions",
      duration: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5119,
    name: "Gaia's Tremor",
    manaCost: 1,
    description: "Silence a minion, then deal 1 damage to it.",
    type: "spell",
    rarity: "common",
    class: "Shaman",
    spellEffect: {
      type: "silence_and_damage",
      value: 1,
      targetType: "any_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5120,
    name: "Surtr's Flame",
    manaCost: 3,
    description: "Deal 5 damage. Overload: (2)",
    type: "spell",
    rarity: "rare",
    class: "Shaman",
    keywords: ["overload"],
    spellEffect: {
      type: "damage",
      value: 5,
      targetType: "any",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5121,
    name: "Eir's Touch",
    manaCost: 2,
    description: "Give a minion 'Deathrattle: Resummon this minion.'",
    type: "spell",
    rarity: "rare",
    class: "Shaman",
    spellEffect: {
      type: "grant_deathrattle",
      targetType: "any_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5122,
    name: "Fenrir's Spirit",
    manaCost: 3,
    description: "Summon two 2/3 Spirit Wolves with Taunt. Overload: (2)",
    type: "spell",
    rarity: "rare",
    class: "Shaman",
    keywords: ["overload"],
    spellEffect: {
      type: "summon",
      count: 2,
      summonCardId: 5253,
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5123,
    name: "Aesir's Wrath",
    manaCost: 2,
    description: "Give a minion Windfury.",
    type: "spell",
    rarity: "common",
    class: "Shaman",
    spellEffect: {
      type: "grant_keyword",
      keyword: "windfury",
      targetType: "any_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5124,
    name: "Stone Breaker",
    manaCost: 2,
    description: "Give a friendly character +3 Attack this turn.",
    type: "spell",
    rarity: "common",
    class: "Shaman",
    spellEffect: {
      type: "buff",
      buffAttack: 3,
      targetType: "friendly_character",
      requiresTarget: true,
      duration: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5125,
    name: "Odin's Eye",
    manaCost: 3,
    description: "Draw a card. That card costs (3) less.",
    type: "spell",
    rarity: "rare",
    class: "Shaman",
    spellEffect: {
      type: "draw",
      value: 1,
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 5253,
    name: "Spirit Wolf",
    manaCost: 2,
    attack: 2,
    health: 3,
    description: "Taunt",
    type: "minion",
    rarity: "common",
    class: "Shaman",
    race: "Beast",
    keywords: ["taunt"],
    collectible: false,
    set: "core"
  },
  {
    id: 5251,
    name: "Frog",
    manaCost: 0,
    attack: 0,
    health: 1,
    description: "Taunt",
    type: "minion",
    rarity: "common",
    class: "Shaman",
    race: "Beast",
    keywords: ["taunt"],
    collectible: false,
    set: "core"
  },
  {
    id: 5252,
    name: "Nerida Prime",
    manaCost: 7,
    attack: 5,
    health: 4,
    description: "Spell Damage +1. Battlecry: Draw 3 spells. Reduce their Cost by (3).",
    type: "minion",
    rarity: "legendary",
    class: "Shaman",
    race: "Naga",
    keywords: ["spell_damage", "battlecry"],
    collectible: false,
    set: "core"
  },
  {
    id: 20102,
    name: "Jormungandr, Echo Serpent",
    manaCost: 9,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Repeat all other Battlecries from cards you played this game (targets chosen randomly).",
    flavorText: "The World Serpent echoes all that came before.",
    keywords: ["battlecry"],
    class: "Shaman",
    collectible: true,
    set: "core",
    battlecry: {
      type: "replay_battlecries",
      requiresTarget: false,
      targetType: "none",
      isRandom: true
    }
  },
  {
    id: 20119,
    name: "Poseidon, Tidal Healer",
    manaCost: 5,
    attack: 4,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Whenever your spells deal damage, restore that much Health to your hero.",
    flavorText: "God of the seas, his waves both destroy and restore.",
    keywords: [],
    race: "elemental",
    class: "Shaman",
    collectible: true,
    set: "core"
  },
  {
    id: 20126,
    name: "Argus, Storm Watcher",
    manaCost: 5,
    attack: 5,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Deathrattle: Shuffle 'The Storm Guardian' into your deck.",
    flavorText: "The hundred-eyed giant watches over the storm's power.",
    keywords: ["taunt", "deathrattle"],
    class: "Shaman",
    collectible: true,
    set: "core",
    deathrattle: {
      type: "shuffle",
      targetType: "none",
      summonCardId: 20127
    }
  },
  {
    id: 20127,
    name: "The Storm Guardian",
    manaCost: 5,
    attack: 10,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Taunt",
    flavorText: "Born of lightning and thunder, it guards the realm.",
    keywords: ["taunt"],
    class: "Shaman",
    collectible: false,
    set: "core"
  },
  {
    id: 20702,
    name: "Boreas, Ice Collector",
    manaCost: 6,
    attack: 4,
    health: 4,
    type: "minion",
    rarity: "legendary",
    description: "Whenever another minion is Frozen, add a copy of it to your hand.",
    flavorText: "The north wind god collects frozen souls.",
    keywords: [],
    class: "Shaman",
    collectible: true,
    set: "core"
  },
  {
    id: 20407,
    name: "Proteus, Mist Shaper",
    manaCost: 5,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Add a Mass Polymorph to your hand. It costs (1).",
    flavorText: "The old sea god shapes mist into sheep.",
    keywords: ["battlecry"],
    class: "Shaman",
    collectible: true,
    set: "core",
    battlecry: {
      type: "add_card",
      requiresTarget: false,
      targetType: "none",
      cardName: "Mass Polymorph",
      costReduction: 1
    }
  },
  {
    id: 20408,
    name: "Gaia, Stone Mother",
    manaCost: 8,
    attack: 5,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. At the end of your turn, summon a 2/3 Elemental with Taunt.",
    flavorText: "Mother Earth herself defends her children.",
    keywords: ["taunt"],
    race: "elemental",
    class: "Shaman",
    collectible: true,
    set: "core"
  },
  {
    id: 50031,
    name: "Talos, Elemental Titan",
    manaCost: 8,
    attack: 7,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: If you played an Elemental last turn, cast an Elemental Invocation.",
    flavorText: "The bronze giant guards the elements' power.",
    keywords: ["battlecry", "discover"],
    race: "elemental",
    class: "Shaman",
    collectible: true,
    set: "core",
    battlecry: {
      type: "discover",
      requiresTarget: false,
      targetType: "none",
      discoveryType: "spell",
      discoveryCount: 4,
      discoveryClass: "shaman"
    }
  },
  // === Overload Cards ===
  {
    id: 35004,
    name: "Zeus' Fork",
    manaCost: 1,
    type: "spell",
    rarity: "common",
    description: "Deal 2 damage to 2 random enemy minions. Overload: (2)",
    keywords: ["overload"],
    class: "Shaman",
    spellEffect: {
      type: "damage",
      value: 2,
      requiresTarget: false,
      targetType: "random_enemy_minions",
      targetCount: 2
    },
    overload: { amount: 2 },
    collectible: true,
    set: "core"
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
    class: "Shaman",
    race: "elemental",
    overload: { amount: 3 },
    collectible: true,
    set: "core"
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
    class: "Shaman",
    overload: { amount: 2 },
    collectible: true,
    set: "core"
  },
  {
    id: 35008,
    name: "Ragnarok's Wrath",
    manaCost: 3,
    type: "spell",
    rarity: "epic",
    description: "Deal 4-5 damage to all minions. Overload: (5)",
    keywords: ["overload"],
    class: "Shaman",
    spellEffect: {
      type: "damage",
      value: 5,
      minValue: 4,
      isRandom: true,
      requiresTarget: false,
      targetType: "all_minions"
    },
    overload: { amount: 5 },
    collectible: true,
    set: "core"
  },
  {
    id: 35009,
    name: "Thor's Surge",
    manaCost: 1,
    type: "spell",
    rarity: "common",
    description: "Deal 3 damage to a minion. Overload: (1)",
    keywords: ["overload"],
    class: "Shaman",
    overload: { amount: 1 },
    spellEffect: {
      type: "damage",
      value: 3,
      requiresTarget: true,
      targetType: "any_minion"
    },
    collectible: true,
    set: "core"
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
    class: "Shaman",
    overload: { amount: 1 },
    battlecry: {
      type: "damage",
      value: 1,
      targetType: "all_enemy_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 35011,
    name: "Tidal Surge",
    manaCost: 3,
    type: "spell",
    rarity: "common",
    description: "Restore 4 Health to all friendly characters. Overload: (1)",
    keywords: ["overload"],
    class: "Shaman",
    overload: { amount: 1 },
    spellEffect: {
      type: "heal",
      value: 4,
      requiresTarget: false,
      targetType: "all_friendly"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 35012,
    name: "Chain of Mjolnir",
    manaCost: 2,
    type: "spell",
    rarity: "rare",
    description: "Deal 2 damage to a minion and adjacent ones. Overload: (1)",
    keywords: ["overload"],
    class: "Shaman",
    overload: { amount: 1 },
    spellEffect: {
      type: "damage_adjacent",
      value: 2,
      requiresTarget: true,
      targetType: "any_minion"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 35013,
    name: "Stone Guardian",
    manaCost: 5,
    type: "minion",
    rarity: "epic",
    race: "Elemental",
    attack: 3,
    health: 6,
    description: "Taunt. Battlecry: Deal 1 damage to all minions. Overload: (1)",
    keywords: ["overload", "taunt", "battlecry"],
    class: "Shaman",
    overload: { amount: 1 },
    battlecry: {
      type: "damage",
      value: 1,
      targetType: "all_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 35015,
    name: "Thunder Titan",
    manaCost: 4,
    type: "minion",
    rarity: "epic",
    race: "Elemental",
    attack: 3,
    health: 5,
    description: "After you play a card with Overload, summon two 1/1 Rune Sparks with Rush.",
    class: "Shaman",
    collectible: true,
    set: "core",
    onPlayCardEffect: {
      type: "summon",
      value: 2,
      summonCardId: 35016,
      triggerCondition: "play_overload_card"
    }
  },
  {
    id: 35016,
    name: "Rune Spark",
    manaCost: 1,
    type: "minion",
    rarity: "common",
    attack: 1,
    health: 1,
    description: "Rush",
    keywords: ["rush"],
    class: "Shaman",
    collectible: false,
    set: "core"
  },
  {
    id: 35017,
    name: "Spirit Summons",
    manaCost: 4,
    type: "spell",
    rarity: "rare",
    description: "Summon a random minion from each player's hand. Overload: (2)",
    keywords: ["overload"],
    class: "Shaman",
    overload: { amount: 2 },
    spellEffect: {
      type: "summon_from_hand",
      value: 1,
      requiresTarget: false,
      targetType: "both_players_hand"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 35018,
    name: "Storm Weaver",
    manaCost: 6,
    type: "spell",
    rarity: "legendary",
    description: "Transform your minions into random Legendary minions. Overload: (3)",
    keywords: ["overload"],
    class: "Shaman",
    overload: { amount: 3 },
    spellEffect: {
      type: "transform_all",
      requiresTarget: false,
      targetType: "friendly_minions",
      transformType: "random_legendary_minion"
    },
    collectible: true,
    set: "core"
  },
  // === Echo Card ===
  {
    id: 47249,
    name: "Valkyrie's Apprentice",
    manaCost: 1,
    attack: 0,
    health: 1,
    type: "minion",
    rarity: "common",
    description: "Taunt. Echo. Battlecry: Add a random Shaman spell to your hand.",
    keywords: ["taunt", "echo", "battlecry"],
    class: "Shaman",
    battlecry: {
      type: "discover",
      requiresTarget: false,
      targetType: "none",
      discoveryType: "spell",
      discoveryCount: 1
    },
    collectible: true,
    set: "core"
  },
  // === Spellburst Card ===
  {
    id: 18002,
    name: "Rune Scholar",
    manaCost: 2,
    attack: 2,
    health: 3,
    type: "minion",
    rarity: "rare",
    description: "Spellburst: Return the spell to your hand.",
    keywords: ["spellburst"],
    class: "Shaman",
    spellburstEffect: {
      type: "draw",
      targetType: "spell",
      consumed: false
    },
    collectible: true,
    set: "core"
  },
  // === Migrated from additionalClassMinions.ts ===
  {
    id: 40015,
    name: "Primordial Fury",
    manaCost: 3,
    attack: 2,
    health: 4,
    type: "minion",
    rarity: "common",
    race: "elemental",
    description: "Whenever you play a card with Overload, gain +1/+1.",
    flavorText: "The storm's fury made manifest.",
    class: "Shaman",
    minionEffect: {
      type: "buff_on_overload",
      buffAttack: 1,
      buffHealth: 1
    },
    collectible: true,
    set: "core"
  },
  // === Yggdrasil Golem Cards ===
  {
    id: 85001,
    name: "Emerald Strike",
    manaCost: 4,
    type: "spell",
    rarity: "common",
    description: "Deal 4 damage. Summon an Emerald Golem.",
    flavorText: "Lightning infused with jade's mystical power.",
    keywords: ["jade_golem"],
    class: "Shaman",
    spellEffect: {
      type: "damage",
      value: 4,
      targetType: "any",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 85003,
    name: "Emerald Talons",
    manaCost: 2,
    attack: 2,
    durability: 2,
    type: "weapon",
    rarity: "rare",
    description: "Battlecry: Summon an Emerald Golem. Overload: (1)",
    flavorText: "Claws carved from the purest jade.",
    keywords: ["battlecry", "overload", "jade_golem"],
    class: "Shaman",
    overload: { amount: 1 },
    battlecry: {
      type: "summon_jade_golem"
    },
    collectible: true,
    set: "core"
  },
  // === New Elemental Spells ===
  {
    id: 85010,
    name: "Thunderstrike",
    manaCost: 4,
    type: "spell",
    rarity: "rare",
    description: "Deal 4 damage to an enemy minion. If it survives, deal 2 damage to your hero.",
    flavorText: "A bolt from the sky, reckless and fierce.",
    keywords: [],
    class: "Shaman",
    spellEffect: {
      type: "damage",
      value: 4,
      targetType: "enemy_minion",
      requiresTarget: true,
      selfDamageOnSurvive: 2
    },
    collectible: true,
    set: "core"
  },
  {
    id: 85011,
    name: "Tide's Grace",
    manaCost: 2,
    type: "spell",
    rarity: "common",
    description: "Restore 4 Health to a friendly minion. If you discarded a Water Energy this turn, restore 6 Health instead.",
    flavorText: "The ocean's embrace heals all wounds.",
    keywords: [],
    class: "Shaman",
    spellEffect: {
      type: "heal",
      value: 4,
      bonusValue: 6,
      targetType: "friendly_minion",
      requiresTarget: true,
      bonusCondition: "discarded_water_energy"
    },
    collectible: true,
    set: "core"
  }
];
