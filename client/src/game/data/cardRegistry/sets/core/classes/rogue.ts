import { CardData } from '../../../../../types';

export const rogueCards: CardData[] = [
  {
    id: 12101,
    name: "Shadow of Loki",
    manaCost: 0,
    description: "Deal 2 damage to an undamaged minion.",
    type: "spell",
    rarity: "common",
    class: "Rogue",
    spellEffect: {
      type: "damage",
      value: 2,
      targetType: "undamaged_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12102,
    name: "Óðinn's Foresight",
    manaCost: 0,
    description: "The next spell you cast this turn costs (3) less.",
    type: "spell",
    rarity: "rare",
    class: "Rogue",
    spellEffect: {
      type: "cost_reduction",
      value: 3,
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12103,
    name: "Hel's Path",
    manaCost: 0,
    description: "Return a friendly minion to your hand. It costs (2) less.",
    type: "spell",
    rarity: "common",
    class: "Rogue",
    spellEffect: {
      type: "return_to_hand",
      targetType: "friendly_minion",
      requiresTarget: true,
      value: 2
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12104,
    name: "Jörmungandr Venom",
    manaCost: 1,
    description: "Give your weapon +2 Attack.",
    type: "spell",
    rarity: "common",
    class: "Rogue",
    spellEffect: {
      type: "buff_weapon",
      value: 2,
      targetType: "player_weapon",
      requiresTarget: false
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12105,
    name: "Shadow Strike",
    manaCost: 1,
    description: "Deal 3 damage to the enemy hero.",
    type: "spell",
    rarity: "common",
    class: "Rogue",
    spellEffect: {
      type: "damage",
      value: 3,
      targetType: "enemy_hero",
      requiresTarget: false
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12106,
    name: "Mist of Niflheim",
    manaCost: 2,
    description: "Return an enemy minion to your opponent's hand.",
    type: "spell",
    rarity: "common",
    class: "Rogue",
    spellEffect: {
      type: "return_to_hand",
      targetType: "enemy_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12107,
    name: "Serpent's Fang",
    manaCost: 2,
    description: "Deal 2 damage. Combo: Deal 4 damage instead.",
    type: "spell",
    rarity: "common",
    class: "Rogue",
    keywords: ["combo"],
    spellEffect: {
      type: "damage",
      value: 2,
      targetType: "any",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12108,
    name: "Daggers of Víðarr",
    manaCost: 3,
    description: "Deal 1 damage to all enemy minions. Draw a card.",
    type: "spell",
    rarity: "common",
    class: "Rogue",
    spellEffect: {
      type: "aoe_damage",
      value: 1,
      targetType: "enemy_minions",
      drawCards: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12109,
    name: "Aegis Tempest",
    manaCost: 4,
    description: "Destroy your weapon and deal its damage to all enemy minions.",
    type: "spell",
    rarity: "rare",
    class: "Rogue",
    spellEffect: {
      type: "weapon_damage_aoe",
      targetType: "enemy_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12110,
    name: "Hel's Execution",
    manaCost: 5,
    description: "Destroy an enemy minion.",
    type: "spell",
    rarity: "common",
    class: "Rogue",
    spellEffect: {
      type: "destroy",
      targetType: "enemy_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12201,
    name: "Loki's Shadow Ringleader",
    manaCost: 2,
    attack: 2,
    health: 2,
    description: "Combo: Summon a 2/1 Shadow Thief.",
    flavorText: "The frost giants strike from the shadows of Jotunheim.",
    type: "minion",
    rarity: "common",
    class: "Rogue",
    keywords: ["combo"],
    collectible: true,
    set: "core"
  },
  {
    id: 12202,
    name: "Odin's Raven Scout",
    manaCost: 3,
    attack: 3,
    health: 3,
    description: "Combo: Deal 2 damage.",
    flavorText: "Trained by Odin's ravens, Huginn and Muninn, to strike unseen.",
    type: "minion",
    rarity: "rare",
    class: "Rogue",
    keywords: ["combo"],
    collectible: true,
    set: "core"
  },
  {
    id: 12203,
    name: "Loki's Disciple",
    manaCost: 4,
    attack: 4,
    health: 4,
    description: "Battlecry: Give a friendly minion Stealth until your next turn.",
    type: "minion",
    rarity: "rare",
    class: "Rogue",
    keywords: ["battlecry"],
    battlecry: {
      type: "give_stealth",
      targetType: "friendly_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12204,
    name: "Kidnapper",
    manaCost: 6,
    attack: 5,
    health: 3,
    description: "Combo: Return a minion to its owner's hand.",
    type: "minion",
    rarity: "epic",
    class: "Rogue",
    keywords: ["combo"],
    collectible: true,
    set: "core"
  },
  {
    id: 12404,
    name: "Erik the Shadow Lord",
    manaCost: 3,
    attack: 2,
    health: 2,
    description: "Combo: Gain +2/+2 for each card played earlier this turn.",
    flavorText: "Bound by chains of shadow, he grows stronger with each broken link.",
    type: "minion",
    rarity: "legendary",
    class: "Rogue",
    keywords: ["combo"],
    collectible: true,
    set: "core"
  },
  {
    id: 12303,
    name: "Assassin's Blade",
    manaCost: 5,
    attack: 3,
    durability: 4,
    description: "A lethal blade with a long reach.",
    type: "weapon",
    rarity: "common",
    class: "Rogue",
    collectible: true,
    set: "core"
  },
  {
    id: 12304,
    name: "Perdition's Blade",
    manaCost: 3,
    attack: 2,
    durability: 2,
    description: "Battlecry: Deal 1 damage. Combo: Deal 2 instead.",
    type: "weapon",
    rarity: "rare",
    class: "Rogue",
    keywords: ["battlecry", "combo"],
    collectible: true,
    set: "core"
  },
  {
    id: 12301,
    name: "Wicked Knife",
    manaCost: 1,
    attack: 1,
    durability: 2,
    description: "The Rogue's trusty dagger.",
    type: "weapon",
    rarity: "common",
    class: "Rogue",
    collectible: false,
    set: "core"
  },
  {
    id: 12501,
    name: "Shadow Thief",
    manaCost: 1,
    attack: 2,
    health: 1,
    description: "A shadow servant of Loki's realm.",
    flavorText: "Swift and deadly, like the winter wind.",
    type: "minion",
    rarity: "common",
    class: "Rogue",
    collectible: false,
    set: "core"
  },
  {
    id: 20033,
    name: "Nyx, Shadow Stalker",
    manaCost: 9,
    type: "hero",
    rarity: "legendary",
    description: "Battlecry: Gain Stealth until your next turn. Passive Hero Power: During your turn, add a Shadow Reflection to your hand.",
    flavorText: "Primordial goddess of night, she walks unseen.",
    keywords: ["battlecry"],
    class: "Rogue",
    armor: 5,
    collectible: true,
    set: "core",
    battlecry: {
      type: "buff",
      requiresTarget: false,
      targetType: "none"
    }
  },
  {
    id: 20035,
    name: "Arachne, Spider Lord",
    manaCost: 9,
    attack: 8,
    health: 4,
    type: "minion",
    rarity: "legendary",
    description: "Deathrattle: Return this to your hand and summon a 4/4 Nerubian.",
    flavorText: "The weaver transformed into a spider, she spins eternal schemes.",
    keywords: ["deathrattle"],
    class: "Rogue",
    collectible: true,
    set: "core",
    deathrattle: {
      type: "summon",
      summonCardId: 40115,
      targetType: "none"
    }
  },
  {
    id: 20708,
    name: "Eris, Mind Thief",
    manaCost: 4,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Replace spells in your hand with random spells (from your opponent's class).",
    flavorText: "Goddess of discord, she steals thoughts and schemes.",
    keywords: ["battlecry"],
    class: "Rogue",
    collectible: true,
    set: "core",
    battlecry: {
      type: "replace_spells",
      requiresTarget: false,
      targetType: "none",
      replaceWith: "opponent_class_spells"
    }
  },
  {
    id: 20807,
    name: "Proteus, Face Collector",
    manaCost: 3,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "legendary",
    description: "Echo. Battlecry: Add a random Legendary minion to your hand.",
    flavorText: "The shape-shifting sea god collects faces like trophies.",
    keywords: ["echo", "battlecry"],
    class: "Rogue",
    collectible: true,
    set: "core",
    battlecry: {
      type: "add_card",
      requiresTarget: false,
      targetType: "none",
      condition: "random_legendary_minion",
      value: 1
    }
  },
  {
    id: 20213,
    name: "Medusa's Bane",
    manaCost: 4,
    attack: 3,
    health: 2,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry and Deathrattle: Add a random Toxin card to your hand.",
    flavorText: "Touched by the gorgon's venom, it carries deadly gifts.",
    keywords: ["battlecry", "deathrattle"],
    race: "beast",
    class: "Rogue",
    collectible: true,
    set: "core",
    battlecry: {
      type: "give_cards",
      requiresTarget: false,
      targetType: "none",
      cardCount: 1,
      isRandom: true
    },
    deathrattle: {
      type: "draw",
      targetType: "none",
      value: 1
    }
  },
  // === Combo Cards ===
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
    class: "Rogue",
    collectible: true,
    set: "core",
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
    class: "Rogue",
    collectible: true,
    set: "core",
    spellEffect: {
      type: "buff_attack",
      value: 2,
      targetType: "any_minion",
      requiresTarget: true
    },
    comboEffect: {
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
    class: "Rogue",
    collectible: true,
    set: "core",
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
    class: "Rogue",
    collectible: true,
    set: "core",
    spellEffect: {
      type: "destroy_random",
      targetType: "enemy_minion"
    },
    comboEffect: {
      type: "destroy",
      targetType: "enemy_weapon"
    }
  },
  {
    id: 31005,
    name: "Helheim Valiant",
    manaCost: 2,
    attack: 3,
    health: 2,
    type: "minion",
    rarity: "common",
    description: "Combo: Deal 1 damage.",
    flavorText: "Those who serve in Hel's domain strike with cold fury.",
    keywords: ["combo"],
    class: "Rogue",
    collectible: true,
    set: "core",
    combo: {
      type: "damage",
      value: 1,
      targetType: "any",
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
    class: "Rogue",
    collectible: true,
    set: "core",
    spellEffect: {
      type: "damage",
      value: 4,
      targetType: "undamaged_character",
      requiresTarget: true
    },
    comboEffect: {
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
    class: "Rogue",
    collectible: true,
    set: "core",
    combo: {
      type: "add_card_to_hand",
      cardId: 31501,
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
    class: "Rogue",
    collectible: true,
    set: "core",
    spellEffect: {
      type: "give_stealth",
      targetType: "friendly_minions",
      duration: "next_turn"
    },
    comboEffect: {
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
    class: "Rogue",
    collectible: true,
    set: "core",
    combo: {
      type: "buff_weapon",
      attack: 1,
      effect: "poisonous"
    }
  },
  {
    id: 31010,
    name: "Nyxshade Assassin",
    manaCost: 9,
    type: "hero",
    rarity: "legendary",
    description: "Battlecry: Gain Stealth until your next turn and gain 5 Armor.",
    flavorText: "Blessed by Nyx, goddess of night, she moves unseen between worlds.",
    keywords: ["battlecry"],
    class: "Rogue",
    collectible: true,
    set: "core",
    battlecry: {
      type: "gain_stealth_and_armor",
      armor: 5
    },
    heroPower: {
      name: "Night's Embrace",
      description: "During your turn, add a Shadow Reflection to your hand.",
      cost: 0,
      used: false,
      effect: {
        type: "add_shadow_reflection"
      }
    }
  },
  {
    id: 31501,
    name: "The Coin",
    manaCost: 0,
    type: "spell",
    rarity: "common",
    description: "Gain 1 Mana Crystal this turn only.",
    keywords: [],
    class: "Neutral",
    collectible: false,
    set: "core",
    spellEffect: {
      type: "gain_temp_mana",
      value: 1
    }
  },
  // === Spellburst Card ===
  {
    id: 18001,
    name: "Wand Thief",
    manaCost: 1,
    attack: 1,
    health: 2,
    type: "minion",
    rarity: "common",
    description: "Spellburst: Discover a Mage spell.",
    keywords: ["spellburst"],
    class: "Rogue",
    spellburstEffect: {
      type: "discover",
      targetType: "self",
      consumed: false
    },
    collectible: true,
    set: "core"
  },
  // === Migrated from legacy rogueCards.ts ===
  {
    id: 12302,
    name: "Poisoned Blade",
    manaCost: 4,
    attack: 1,
    durability: 3,
    type: "weapon",
    rarity: "epic",
    description: "Your Hero Power gives this weapon +1 Attack instead of replacing it.",
    flavorText: "A blade coated in the venom of the shadow serpent.",
    class: "Rogue",
    weaponEffect: {
      type: "hero_power_enhances",
      interactsWithHeroPower: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12401,
    name: "Raven's Striking Curse",
    manaCost: 3,
    type: "spell",
    rarity: "rare",
    description: "Deal 2 damage to the enemy hero. Combo: Return this to your hand next turn.",
    flavorText: "A persistent pain that never truly goes away.",
    keywords: ["combo"],
    class: "Rogue",
    spellEffect: {
      type: "damage",
      value: 2,
      targetType: "enemy_hero",
      requiresTarget: false
    },
    comboEffect: {
      type: "return_to_hand_next_turn",
      targetType: "self"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12402,
    name: "Shadow Dancer",
    manaCost: 5,
    attack: 4,
    health: 4,
    type: "minion",
    rarity: "epic",
    description: "Stealth. After this attacks, gain Stealth.",
    flavorText: "In the darkness, she finds her strength.",
    keywords: ["stealth"],
    class: "Rogue",
    onAttack: {
      type: "gain_stealth"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12403,
    name: "Fade Shadow",
    manaCost: 0,
    type: "spell",
    rarity: "epic",
    description: "Give a friendly minion Stealth until your next turn. Combo: And +2/+2.",
    flavorText: "Now you see them, now you don't.",
    keywords: ["combo"],
    class: "Rogue",
    spellEffect: {
      type: "give_stealth",
      targetType: "friendly_minion",
      requiresTarget: true,
      duration: "next_turn"
    },
    comboEffect: {
      type: "buff",
      targetType: "friendly_minion",
      attack: 2,
      health: 2
    },
    collectible: true,
    set: "core"
  },
  {
    id: 12405,
    name: "Poison Master",
    manaCost: 4,
    attack: 4,
    health: 3,
    type: "minion",
    rarity: "epic",
    description: "Combo: Give your weapon Poisonous.",
    flavorText: "She learned her craft from the serpent goddess herself.",
    keywords: ["combo"],
    class: "Rogue",
    combo: {
      type: "give_weapon_effect",
      effect: "poisonous"
    },
    collectible: true,
    set: "core"
  },
  // === Quest Cards ===
  {
    id: 70003,
    name: "Descent to Hades",
    manaCost: 1,
    type: "spell",
    rarity: "legendary",
    description: "Quest: Play four minions with the same name. Reward: Core of Tartarus.",
    flavorText: "The path to the underworld reveals itself to those who walk in shadows.",
    keywords: ["quest"],
    class: "Rogue",
    spellEffect: {
      type: "quest",
      goal: 4,
      condition: "play_same_name_minions",
      rewardCardId: 70013
    },
    collectible: true,
    set: "core"
  },
  {
    id: 70013,
    name: "Core of Tartarus",
    manaCost: 5,
    type: "spell",
    rarity: "legendary",
    description: "For the rest of the game, your minions are 4/4.",
    flavorText: "The prison of the Titans transforms all who approach.",
    keywords: [],
    class: "Rogue",
    spellEffect: {
      type: "permanent_minion_buff",
      setAttack: 4,
      setHealth: 4
    },
    collectible: false,
    set: "core"
  },
  // === Yggdrasil Golem Card ===
  {
    id: 85004,
    name: "Yggdrasil Shadowblade",
    manaCost: 2,
    attack: 1,
    health: 1,
    type: "minion",
    rarity: "common",
    description: "Stealth. Deathrattle: Summon a Yggdrasil Golem.",
    flavorText: "Silent as jade, deadly as shadow.",
    keywords: ["stealth", "deathrattle", "jade_golem"],
    class: "Rogue",
    deathrattle: {
      type: "summon_jade_golem"
    },
    collectible: true,
    set: "core"
  },
  // === New Shadow Spell ===
  {
    id: 85020,
    name: "Spectral Howl",
    manaCost: 2,
    type: "spell",
    rarity: "rare",
    description: "Give a friendly minion +1 Attack and Stealth until your next turn.",
    flavorText: "A cry from the void cloaks its allies in shadow.",
    keywords: [],
    class: "Rogue",
    spellEffect: {
      type: "buff",
      buffAttack: 1,
      grantKeywords: ["stealth"],
      targetType: "friendly_minion",
      requiresTarget: true,
      duration: 1
    },
    collectible: true,
    set: "core"
  }
];
