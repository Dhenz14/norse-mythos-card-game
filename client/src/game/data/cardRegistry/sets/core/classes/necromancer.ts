import { CardData } from '../../../../../types';

export const necromancerCards: CardData[] = [
  {
    id: 4000,
    name: "Bone Collector",
    manaCost: 2,
    attack: 1,
    health: 2,
    description: "Battlecry: Gain +1/+1 for each Undead in your graveyard.",
    flavorText: "The bones remember who they were in life. And they miss it.",
    type: "minion",
    rarity: "common",
    class: "Necromancer",
    race: "Undead",
    keywords: ["battlecry"],
    battlecry: {
      type: "buff_from_graveyard_count",
      condition: { check: "graveyard_count", race: "Undead", minimum: 1 },
      value: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4001,
    name: "Grave Robber",
    manaCost: 3,
    attack: 3,
    health: 3,
    description: "Battlecry: Discover a minion that died this game.",
    flavorText: "One man's grave is another man's treasure chest.",
    type: "minion",
    rarity: "rare",
    class: "Necromancer",
    keywords: ["battlecry"],
    battlecry: {
      type: "discover_from_graveyard",
      condition: { check: "graveyard_size", minimum: 1 },
      discoveryCount: 3
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4002,
    name: "Skeletal Lord",
    manaCost: 6,
    attack: 5,
    health: 5,
    description: "Battlecry: Summon a 2/2 Skeleton for each minion in your graveyard (up to 3).",
    flavorText: "He's assembled quite the workforce.",
    type: "minion",
    rarity: "epic",
    class: "Necromancer",
    race: "Undead",
    keywords: ["battlecry"],
    battlecry: {
      type: "summon_skeletons_based_on_graveyard",
      value: 3,
      summonCardId: 4900
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4003,
    name: "Death's Harvester",
    manaCost: 4,
    attack: 3,
    health: 5,
    description: "Whenever a friendly minion dies, gain +1/+1.",
    flavorText: "Death fuels his power. It's a sustainable resource.",
    type: "minion",
    rarity: "rare",
    class: "Necromancer",
    collectible: true,
    set: "core"
  },
  {
    id: 4004,
    name: "Grave Pact",
    manaCost: 5,
    attack: 4,
    health: 4,
    description: "Deathrattle: Summon the highest cost minion that died this game.",
    flavorText: "Death is just a temporary setback.",
    type: "minion",
    rarity: "epic",
    class: "Necromancer",
    keywords: ["deathrattle"],
    deathrattle: {
      type: "summon_highest_cost_from_graveyard",
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4006,
    name: "Skeletal Warrior",
    manaCost: 2,
    attack: 2,
    health: 1,
    description: "Deathrattle: Summon a 1/1 Skeleton.",
    flavorText: "Even in death, it raises more to serve.",
    type: "minion",
    rarity: "common",
    class: "Necromancer",
    race: "Undead",
    keywords: ["deathrattle"],
    deathrattle: {
      type: "summon_token",
      summonCardId: 4900,
      value: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4007,
    name: "Banshee",
    manaCost: 3,
    attack: 3,
    health: 2,
    description: "Battlecry: Silence a minion.",
    flavorText: "Her scream silences the living and the dead.",
    type: "minion",
    rarity: "common",
    class: "Necromancer",
    race: "Undead",
    keywords: ["battlecry"],
    battlecry: {
      type: "silence",
      targetType: "any_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4009,
    name: "Lich Queen",
    manaCost: 9,
    attack: 4,
    health: 8,
    description: "At the end of your turn, resurrect a friendly minion that died this game.",
    flavorText: "Her reign is eternal, her servants undying.",
    type: "minion",
    rarity: "legendary",
    class: "Necromancer",
    race: "Undead",
    collectible: true,
    set: "core"
  },
  {
    id: 4010,
    name: "Death Knight",
    manaCost: 5,
    attack: 4,
    health: 5,
    description: "Battlecry: Destroy a minion and gain its Attack and Health.",
    flavorText: "A warrior reborn, fueled by the souls of the slain.",
    type: "minion",
    rarity: "legendary",
    class: "Necromancer",
    race: "Undead",
    keywords: ["battlecry"],
    battlecry: {
      type: "consume_target",
      targetType: "any_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4011,
    name: "Ghoul",
    manaCost: 2,
    attack: 2,
    health: 2,
    description: "Battlecry: If your graveyard has at least 3 minions, gain +2/+2.",
    flavorText: "It feasts on the fallen, growing with each bite.",
    type: "minion",
    rarity: "common",
    class: "Necromancer",
    race: "Undead",
    keywords: ["battlecry"],
    battlecry: {
      type: "buff_conditional",
      condition: { check: "graveyard_size", minimum: 3 },
      buffAttack: 2,
      buffHealth: 2
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4100,
    name: "Raise Dead",
    manaCost: 2,
    description: "Summon a random minion that died this game.",
    flavorText: "Some say it's unnatural to raise the dead. Necromancers say it's recycling.",
    type: "spell",
    rarity: "common",
    class: "Necromancer",
    spellEffect: {
      type: "summon_from_graveyard",
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4105,
    name: "Soul Drain",
    manaCost: 4,
    description: "Deal 3 damage to a minion. If it dies, restore 3 health to your hero.",
    flavorText: "Life for life, death for power.",
    type: "spell",
    rarity: "common",
    class: "Necromancer",
    spellEffect: {
      type: "damage",
      targetType: "any_minion",
      value: 3,
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4106,
    name: "Undead Horde",
    manaCost: 6,
    description: "Summon three 2/2 Zombies.",
    flavorText: "The dead rise in numbers too great to count.",
    type: "spell",
    rarity: "rare",
    class: "Necromancer",
    spellEffect: {
      type: "summon_multiple",
      targetType: "none",
      summonCardId: 4901,
      count: 3
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4108,
    name: "Death's Embrace",
    manaCost: 2,
    description: "Give a minion +2/+2. If it's Undead, give it +3/+3 instead.",
    flavorText: "The touch of death empowers the lifeless.",
    type: "spell",
    rarity: "common",
    class: "Necromancer",
    spellEffect: {
      type: "buff",
      targetType: "any_minion",
      value: 2,
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4109,
    name: "Dark Ritual",
    manaCost: 1,
    description: "Sacrifice a minion to draw two cards.",
    flavorText: "Power demands sacrifice.",
    type: "spell",
    rarity: "rare",
    class: "Necromancer",
    spellEffect: {
      type: "sacrifice",
      targetType: "friendly_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4110,
    name: "Eternal Servitude",
    manaCost: 4,
    description: "Discover a minion from your graveyard and summon it.",
    flavorText: "Service beyond death is the ultimate loyalty.",
    type: "spell",
    rarity: "rare",
    class: "Necromancer",
    spellEffect: {
      type: "discover_and_summon_from_graveyard",
      targetType: "none",
      discoveryCount: 3
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4111,
    name: "Mass Resurrection",
    manaCost: 7,
    description: "Summon three random friendly minions that died this game.",
    flavorText: "The battlefield trembles as the dead return en masse.",
    type: "spell",
    rarity: "epic",
    class: "Necromancer",
    spellEffect: {
      type: "resurrect_multiple",
      targetType: "none",
      count: 3
    },
    collectible: true,
    set: "core"
  },
  // ===== NEW NECROMANCER SPELLS =====
  {
    id: 4112,
    name: "Corpse Explosion",
    manaCost: 3,
    description: "Destroy a friendly minion. Deal damage equal to its Attack to all enemies.",
    flavorText: "In death, they serve one final, explosive purpose.",
    type: "spell",
    rarity: "rare",
    class: "Necromancer",
    spellEffect: {
      type: "sacrifice_and_aoe_damage",
      targetType: "friendly_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4113,
    name: "Soul Siphon",
    manaCost: 3,
    description: "Lifesteal. Deal 3 damage to a minion.",
    flavorText: "The soul departs, and the necromancer grows stronger.",
    type: "spell",
    rarity: "common",
    class: "Necromancer",
    keywords: ["lifesteal"],
    spellEffect: {
      type: "damage",
      targetType: "any_minion",
      value: 3,
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4114,
    name: "Bone Armor",
    manaCost: 2,
    description: "Gain Armor equal to the number of minions in your graveyard.",
    flavorText: "The fallen shield the living... or what passes for living.",
    type: "spell",
    rarity: "common",
    class: "Necromancer",
    spellEffect: {
      type: "gain_armor_from_graveyard",
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4115,
    name: "Wither",
    manaCost: 1,
    description: "Give an enemy minion -3 Attack.",
    flavorText: "Flesh rots, strength fades, hope dies.",
    type: "spell",
    rarity: "common",
    class: "Necromancer",
    spellEffect: {
      type: "debuff_attack",
      targetType: "enemy_minion",
      value: -3,
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4116,
    name: "Plague of Undeath",
    manaCost: 5,
    description: "Give all enemy minions 'Deathrattle: Summon a 2/1 Skeleton for your opponent.'",
    flavorText: "Every death feeds the necromancer's army.",
    type: "spell",
    rarity: "epic",
    class: "Necromancer",
    spellEffect: {
      type: "grant_deathrattle_to_enemies",
      targetType: "all_enemy_minions",
      grantedDeathrattle: {
        type: "summon_for_opponent",
        summonCardId: 4900
      }
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4117,
    name: "Ghastly Visage",
    manaCost: 3,
    description: "Return an enemy minion to its owner's hand. It costs (2) more.",
    flavorText: "The terror of death made manifest sends even the bravest fleeing.",
    type: "spell",
    rarity: "rare",
    class: "Necromancer",
    spellEffect: {
      type: "bounce_and_cost_increase",
      targetType: "enemy_minion",
      value: 2,
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4118,
    name: "Necrotic Bolt",
    manaCost: 2,
    description: "Deal 2 damage. If a minion died this turn, deal 4 instead.",
    flavorText: "Death begets death.",
    type: "spell",
    rarity: "common",
    class: "Necromancer",
    spellEffect: {
      type: "damage_conditional",
      targetType: "any",
      value: 2,
      bonusValue: 4,
      condition: { check: "minion_died_this_turn" },
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4119,
    name: "Army of Bones",
    manaCost: 8,
    description: "Fill your board with 2/1 Skeletons with Rush.",
    flavorText: "The earth itself vomits forth an endless legion.",
    type: "spell",
    rarity: "legendary",
    class: "Necromancer",
    spellEffect: {
      type: "fill_board",
      targetType: "none",
      summonCardId: 4900
    },
    collectible: true,
    set: "core"
  },
  {
    id: 4200,
    name: "Soulbound Dagger",
    manaCost: 2,
    attack: 2,
    durability: 2,
    description: "After your hero attacks, add a random minion from your graveyard to your hand.",
    flavorText: "Bound to the souls it has claimed.",
    type: "weapon",
    rarity: "rare",
    class: "Necromancer",
    collectible: true,
    set: "core"
  },
  {
    id: 4900,
    name: "Skeleton",
    manaCost: 1,
    attack: 2,
    health: 1,
    description: "Rush",
    flavorText: "What it lacks in flesh, it makes up for in determination.",
    type: "minion",
    rarity: "common",
    class: "Necromancer",
    race: "Undead",
    keywords: ["rush"],
    collectible: false,
    set: "core"
  },
  {
    id: 4901,
    name: "Zombie",
    manaCost: 2,
    attack: 2,
    health: 2,
    description: "",
    flavorText: "It moves slowly, but it never stops coming.",
    type: "minion",
    rarity: "common",
    class: "Necromancer",
    race: "Undead",
    collectible: false,
    set: "core"
  }
];
