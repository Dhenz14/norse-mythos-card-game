import { CardData } from '../../../../../types';

export const mageCards: CardData[] = [
  {
    id: 14001,
    name: "Ymir's Mana Wyrm",
    manaCost: 1,
    attack: 1,
    health: 3,
    description: "Whenever you cast a spell, gain +1 Attack.",
    flavorText: "The frost giant's magical serpent feeds on arcane energy.",
    type: "minion",
    rarity: "common",
    class: "Mage",
    keywords: ["spell_trigger"],
    collectible: true,
    set: "core"
  },
  {
    id: 14002,
    name: "Runescribe Initiate",
    manaCost: 2,
    attack: 3,
    health: 2,
    description: "Your spells cost (1) less.",
    flavorText: "A student of Norse rune magic, channeling ancient power.",
    type: "minion",
    rarity: "common",
    class: "Mage",
    aura: {
      type: "spell_cost_reduction",
      value: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 14003,
    name: "Bifrost Arcanist",
    manaCost: 3,
    attack: 4,
    health: 3,
    description: "Battlecry: The next Secret you play this turn costs (0).",
    flavorText: "A sorcerer who draws power from the rainbow bridge between realms.",
    type: "minion",
    rarity: "rare",
    class: "Mage",
    keywords: ["battlecry"],
    collectible: true,
    set: "core"
  },
  {
    id: 14004,
    name: "Æther Weaver",
    manaCost: 4,
    attack: 3,
    health: 3,
    description: "If you control a Secret at the end of your turn, gain +2/+2.",
    type: "minion",
    rarity: "rare",
    class: "Mage",
    collectible: true,
    set: "core"
  },
  {
    id: 14005,
    name: "Prometheus the Firebringer",
    manaCost: 7,
    attack: 5,
    health: 7,
    description: "Whenever you cast a spell, add a 'Muspel Flame' spell to your hand.",
    flavorText: "Master of fire magic, he channels the flames of Muspelheim.",
    type: "minion",
    rarity: "legendary",
    class: "Mage",
    keywords: ["spell_trigger"],
    collectible: true,
    set: "core"
  },
  {
    id: 14006,
    name: "Frostweaver Spirit",
    manaCost: 4,
    attack: 3,
    health: 6,
    description: "Freeze any character damaged by this minion.",
    flavorText: "Born from the icy mists of Niflheim, it weaves frost into every strike.",
    type: "minion",
    rarity: "common",
    class: "Mage",
    race: "elemental",
    keywords: ["freeze_on_damage"],
    collectible: true,
    set: "core"
  },
  {
    id: 14009,
    name: "Circe's Curse",
    manaCost: 4,
    description: "Transform a minion into a 1/1 Sheep.",
    flavorText: "The trickster god delights in humiliating transformations.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "transform",
      targetType: "any_minion",
      requiresTarget: true,
      summonCardId: 14010
    },
    collectible: true,
    set: "core"
  },
  {
    id: 14010,
    name: "Sheep",
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "",
    flavorText: "Baaaaaaa.",
    type: "minion",
    rarity: "common",
    class: "Neutral",
    race: "beast",
    collectible: false,
    set: "core"
  },
  {
    id: 14012,
    name: "Vaporize",
    manaCost: 3,
    description: "Secret: When a minion attacks your hero, destroy it.",
    type: "spell",
    rarity: "rare",
    class: "Mage",
    keywords: ["secret"],
    collectible: true,
    set: "core"
  },
  {
    id: 14013,
    name: "Ice Lance",
    manaCost: 1,
    description: "Freeze a character. If it was already Frozen, deal 4 damage instead.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    keywords: ["freeze"],
    spellEffect: {
      type: "conditional_freeze_or_damage",
      value: 4,
      targetType: "any",
      requiresTarget: true,
      condition: "is_frozen"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32001,
    name: "Rune Burst",
    manaCost: 1,
    description: "Deal 2 damage to a minion. This spell gets +2 damage from Spell Damage.",
    flavorText: "Ancient runes shatter with explosive force.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "damage",
      value: 2,
      targetType: "any_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32002,
    name: "Runic Barrage",
    manaCost: 1,
    description: "Deal 3 damage randomly split among all enemy characters.",
    flavorText: "Fragments of celestial fire rain down from the heavens.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "damage",
      value: 3,
      targetType: "random_enemies",
      requiresTarget: false
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32003,
    name: "Surtr's Wrath",
    manaCost: 4,
    description: "Deal 6 damage.",
    flavorText: "Fire from Muspelheim, the realm of flames.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "damage",
      value: 6,
      targetType: "any_character",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32004,
    name: "Jötunheim Freeze",
    manaCost: 3,
    description: "Freeze all enemy minions.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "aoe_damage",
      value: 0,
      targetType: "all_enemy_minions",
      requiresTarget: false
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32005,
    name: "Skadi's Arrow",
    manaCost: 2,
    description: "Deal 3 damage to a character and Freeze it.",
    flavorText: "A frozen lance from the realm of ice and mist.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "damage",
      value: 3,
      targetType: "any_character",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32006,
    name: "Athena's Wisdom",
    manaCost: 3,
    description: "Draw 2 cards.",
    flavorText: "Wisdom flows from the well of knowledge.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "draw",
      value: 2,
      targetType: "none",
      requiresTarget: false
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32008,
    name: "Gemini Illusion",
    manaCost: 1,
    description: "Summon two 0/2 minions with Taunt.",
    flavorText: "Spectral shieldmaidens answer the call to battle.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "summon",
      summonCardId: 32031,
      count: 2,
      targetType: "none",
      requiresTarget: false
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32009,
    name: "Niflheim's Embrace",
    manaCost: 6,
    description: "Deal 2 damage to all enemy minions and Freeze them.",
    type: "spell",
    rarity: "rare",
    class: "Mage",
    spellEffect: {
      type: "aoe_damage",
      value: 2,
      targetType: "all_enemy_minions",
      requiresTarget: false
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32010,
    name: "Muspelheim's Fury",
    manaCost: 7,
    description: "Deal 4 damage to all enemy minions.",
    flavorText: "The fire giant's passage leaves only ashes behind.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "aoe_damage",
      value: 4,
      targetType: "all_enemy_minions",
      requiresTarget: false
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32011,
    name: "Thrymr's Breath",
    manaCost: 4,
    description: "Deal 1 damage to a minion and the minions next to it, and Freeze them.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "cleave_damage",
      value: 1,
      targetType: "any_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32012,
    name: "Runic Detonation",
    manaCost: 2,
    description: "Deal 1 damage to all enemy minions.",
    flavorText: "The runes pulse once, then shatter violently.",
    type: "spell",
    rarity: "common",
    class: "Mage",
    spellEffect: {
      type: "aoe_damage",
      value: 1,
      targetType: "all_enemy_minions",
      requiresTarget: false
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32013,
    name: "Helios Inferno",
    manaCost: 10,
    description: "Deal 10 damage.",
    flavorText: "The flames that will consume the world at the end of days.",
    type: "spell",
    rarity: "epic",
    class: "Mage",
    spellEffect: {
      type: "damage",
      value: 10,
      targetType: "any_character",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 32019,
    name: "Ward of Gjallarhorn",
    manaCost: 3,
    description: "Secret: When your opponent casts a spell, Counter it.",
    flavorText: "Heimdall's horn sounds, negating all hostile magic.",
    type: "secret",
    rarity: "rare",
    class: "Mage",
    keywords: ["secret"],
    collectible: true,
    set: "core"
  },
  {
    id: 32018,
    name: "Mirror Entity",
    manaCost: 3,
    description: "Secret: After your opponent plays a minion, summon a copy of it.",
    type: "secret",
    rarity: "common",
    class: "Mage",
    keywords: ["secret"],
    collectible: true,
    set: "core"
  },
  {
    id: 32031,
    name: "Gemini Illusion",
    manaCost: 0,
    attack: 0,
    health: 2,
    description: "Taunt",
    flavorText: "A spectral shieldmaiden stands ready.",
    type: "minion",
    rarity: "common",
    class: "Mage",
    keywords: ["taunt"],
    collectible: false,
    set: "core"
  },
  {
    id: 20015,
    name: "Helios, Sun Strider",
    manaCost: 7,
    attack: 4,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Every third spell you cast each turn costs (0).",
    flavorText: "The sun god's chariot crosses the sky, empowering the arcane.",
    keywords: [],
    class: "Mage",
    collectible: true,
    set: "core"
  },
  {
    id: 20117,
    name: "Typhon, Chaos Elemental",
    manaCost: 8,
    attack: 8,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Deathrattle: Deal 8 damage to all minions.",
    flavorText: "Father of monsters, his death unleashes primordial chaos.",
    keywords: ["deathrattle"],
    race: "elemental",
    class: "Mage",
    collectible: true,
    set: "core",
    deathrattle: {
      type: "damage",
      targetType: "all_minions",
      value: 8
    }
  },
  {
    id: 20405,
    name: "Prometheus, Fire Bringer",
    manaCost: 6,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "After you cast a spell, deal 2 damage to a random enemy.",
    flavorText: "He who stole fire from the gods now wields it freely.",
    keywords: [],
    class: "Mage",
    collectible: true,
    set: "core"
  },
  {
    id: 20808,
    name: "Hermes, Divine Messenger",
    manaCost: 8,
    attack: 7,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Deathrattle: Add 3 copies of Starfire Shards to your hand.",
    flavorText: "Swift messenger of the gods, he carries arcane gifts.",
    keywords: ["deathrattle"],
    class: "Mage",
    collectible: true,
    set: "core",
    deathrattle: {
      type: "add_card",
      targetType: "none",
      condition: "starfire_shards",
      value: 3
    }
  },
  {
    id: 20034,
    name: "Apollo, Light Weaver",
    manaCost: 2,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "legendary",
    description: "Your cards that summon minions summon twice as many.",
    flavorText: "God of light and prophecy, he doubles all blessings.",
    keywords: [],
    class: "Mage",
    collectible: true,
    set: "core"
  },
  {
    id: 20030,
    name: "Skadi, Frost Queen",
    manaCost: 9,
    type: "hero",
    rarity: "legendary",
    description: "Battlecry: Summon a 3/6 Water Elemental. Your Elementals have Lifesteal this game.",
    flavorText: "The Norse goddess of winter brings eternal frost.",
    keywords: ["battlecry", "lifesteal"],
    class: "Mage",
    armorGain: 5,
    collectible: true,
    set: "core",
    battlecry: {
      type: "summon",
      requiresTarget: false,
      targetType: "none",
      summonCardId: 20031
    }
  },
  {
    id: 20031,
    name: "Frost Wraith",
    manaCost: 4,
    attack: 3,
    health: 6,
    type: "minion",
    rarity: "common",
    description: "Freeze any character damaged by this minion.",
    flavorText: "A spectral being of pure cold, summoned by Skadi.",
    keywords: [],
    race: "elemental",
    class: "Mage",
    collectible: false,
    set: "core"
  },
  // === Dormant Card ===
  {
    id: 10001,
    name: "Bound Watcher",
    manaCost: 3,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "rare",
    race: "demon",
    description: "Dormant for 2 turns. When this awakens, deal 2 damage to all enemy minions.",
    flavorText: "Argus Panoptes, the hundred-eyed giant, sealed by Hermes' lullaby.",
    keywords: ["dormant"],
    class: "Mage",
    collectible: true,
    set: "core",
    dormantTurns: 2,
    awakenEffect: {
      type: "damage",
      targetType: "all_enemy_minions",
      value: 2
    }
  },
  // === Discover Cards ===
  {
    id: 5011,
    name: "Primordial Glyph",
    manaCost: 2,
    type: "spell",
    rarity: "epic",
    description: "Discover a spell. Reduce its cost by (2).",
    keywords: ["discover"],
    class: "Mage",
    spellEffect: {
      type: "discover",
      requiresTarget: false,
      discoveryType: "spell",
      manaDiscount: 2,
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 29003,
    name: "Arcanologist",
    manaCost: 2,
    attack: 2,
    health: 3,
    type: "minion",
    rarity: "common",
    description: "Battlecry: Draw a Secret from your deck.",
    keywords: ["battlecry"],
    class: "Mage",
    battlecry: {
      type: "draw",
      value: 1,
      requiresTarget: false,
      targetType: "none",
      conditionalTarget: "secret"
    },
    collectible: true,
    set: "core"
  },
  // === Spellburst Card ===
  {
    id: 18004,
    name: "Firebrand",
    manaCost: 3,
    attack: 3,
    health: 4,
    type: "minion",
    rarity: "common",
    description: "Spellburst: Deal 4 damage randomly split among all enemy minions.",
    keywords: ["spellburst"],
    class: "Mage",
    spellburstEffect: {
      type: "damage",
      value: 4,
      targetType: "enemy_minion",
      consumed: false
    },
    collectible: true,
    set: "core"
  },
  // === Migrated from additionalClassMinions.ts ===
  {
    id: 40002,
    name: "Runescribe Initiate",
    manaCost: 2,
    attack: 3,
    health: 2,
    type: "minion",
    rarity: "common",
    description: "Your spells cost (1) less.",
    flavorText: "A student of Norse rune magic, channeling ancient power.",
    class: "Mage",
    aura: {
      type: "spell_cost_reduction",
      value: 1
    },
    collectible: true,
    set: "core"
  },
  // === Quest Cards ===
  {
    id: 70001,
    name: "Chronos's Gateway",
    manaCost: 1,
    type: "spell",
    rarity: "legendary",
    description: "Quest: Cast 8 spells that didn't start in your deck. Reward: Time Warp.",
    flavorText: "The god of time opens pathways through reality itself.",
    keywords: ["quest"],
    class: "Mage",
    questProgress: {
      goal: 8,
      current: 0,
      condition: "cast_spells_not_in_deck"
    },
    questReward: {
      cardId: 70011
    },
    collectible: true,
    set: "core"
  },
  {
    id: 70011,
    name: "Time Warp of Chronos",
    manaCost: 5,
    type: "spell",
    rarity: "legendary",
    description: "Take an extra turn.",
    flavorText: "Chronos bends time to grant mortals a second chance.",
    keywords: [],
    class: "Mage",
    spellEffect: {
      type: "extra_turn"
    },
    collectible: false,
    set: "core"
  },
  // === Highlander Card ===
  {
    id: 80001,
    name: "Sibyl of Delphi",
    manaCost: 7,
    attack: 5,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: If your deck has no duplicates, the next spell you cast this turn costs (0).",
    flavorText: "The Greek oracle's prophecies favor those who walk a unique path.",
    keywords: ["battlecry"],
    class: "Mage",
    battlecry: {
      type: "reduce_next_spell_cost",
      condition: "no_duplicates",
      value: 0
    },
    collectible: true,
    set: "core"
  },
  // === New Elemental Spells ===
  {
    id: 80010,
    name: "Ember Shower",
    manaCost: 3,
    type: "spell",
    rarity: "rare",
    description: "Deal 2 damage to a minion and 1 damage to all adjacent minions.",
    flavorText: "Sparks rain down, igniting the battlefield.",
    keywords: [],
    class: "Mage",
    spellEffect: {
      type: "damage",
      value: 2,
      targetType: "minion",
      requiresTarget: true,
      adjacentDamage: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 80011,
    name: "Ember Storm",
    manaCost: 5,
    type: "spell",
    rarity: "epic",
    description: "Deal 3 damage to all enemy minions. Apply Burn to each.",
    flavorText: "A tempest of flame sweeps the battlefield.",
    keywords: [],
    class: "Mage",
    spellEffect: {
      type: "damage",
      value: 3,
      targetType: "all_enemy_minions",
      requiresTarget: false,
      applyStatus: "burn"
    },
    collectible: true,
    set: "core"
  }
];
