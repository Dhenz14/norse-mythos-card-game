import { CardData } from '../../../../../types';

export const demonhunterCards: CardData[] = [
  {
    id: 9101,
    name: "Chaos Strike",
    manaCost: 2,
    description: "Give your hero +2 Attack this turn. Draw a card.",
    flavorText: "First lesson of Demon Hunter training: Hit face.",
    type: "spell",
    rarity: "common",
    class: "Demonhunter",
    spellEffect: {
      type: "hero_attack_buff",
      value: 2
    },
    collectible: true,
    set: "core"
  },
  {
    id: 9102,
    name: "Soul Cleave",
    manaCost: 3,
    description: "Deal 2 damage to two random enemy minions. Restore 2 Health to your hero.",
    flavorText: "It's like a hot knife through butter, except the knife is demonic.",
    type: "spell",
    rarity: "common",
    class: "Demonhunter",
    spellEffect: {
      type: "multi_target_damage_heal",
      value: 2,
      targetType: "random_enemy_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 9103,
    name: "Blur",
    manaCost: 0,
    description: "Your hero can't take damage this turn.",
    flavorText: "The first rule of Demon Hunter fight club is: you can't hit what you can't see.",
    type: "spell",
    rarity: "rare",
    class: "Demonhunter",
    spellEffect: {
      type: "grant_immunity",
      targetType: "friendly_hero"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 9104,
    name: "Rune Burn",
    manaCost: 1,
    description: "Your opponent has 2 fewer Mana Crystals next turn.",
    flavorText: "The best defense is a good offense.",
    type: "spell",
    rarity: "rare",
    class: "Demonhunter",
    spellEffect: {
      type: "reduce_opponent_mana",
      value: 2
    },
    collectible: true,
    set: "core"
  },
  {
    id: 9105,
    name: "Skull of Prometheus",
    manaCost: 6,
    description: "Draw 3 cards. Outcast: Reduce their Cost by (3).",
    flavorText: "The skull of the Titan who defied the gods still pulses with forbidden knowledge.",
    type: "spell",
    rarity: "legendary",
    class: "Demonhunter",
    keywords: ["outcast"],
    spellEffect: {
      type: "draw",
      value: 3
    },
    collectible: true,
    set: "core"
  },
  {
    id: 9111,
    name: "Glaivebound Adept",
    manaCost: 5,
    attack: 6,
    health: 4,
    description: "Battlecry: If your hero attacked this turn, deal 4 damage.",
    flavorText: "She bound her glaives so she would stop losing them around the house.",
    type: "minion",
    rarity: "rare",
    class: "Demonhunter",
    keywords: ["battlecry"],
    battlecry: {
      type: "damage",
      value: 4,
      targetType: "any",
      requiresTarget: true,
      condition: "hero_attacked_this_turn"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 9112,
    name: "Prometheus the Outcast",
    manaCost: 4,
    attack: 4,
    health: 3,
    description: "After you play the left- or right-most card in your hand, deal 1 damage to all enemies.",
    flavorText: "Cast out by the gods, his fire still burns against all who oppose him.",
    type: "minion",
    rarity: "legendary",
    class: "Demonhunter",
    keywords: ["outcast"],
    collectible: true,
    set: "core"
  },
  {
    id: 9113,
    name: "Metamorphosis",
    manaCost: 5,
    description: "Swap your Hero Power to \"Deal 4 damage.\" After 2 uses, swap back.",
    flavorText: "It's just a phase.",
    type: "spell",
    rarity: "legendary",
    class: "Demonhunter",
    spellEffect: {
      type: "swap_hero_power"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 9116,
    name: "Coordinated Strike",
    manaCost: 3,
    description: "Summon three 1/1 Illidari with Rush.",
    flavorText: "The Illidari coordinate all their attacks because otherwise they look very silly.",
    type: "spell",
    rarity: "common",
    class: "Demonhunter",
    spellEffect: {
      type: "summon",
      value: 3,
      summonCardId: 9117
    },
    collectible: true,
    set: "core"
  },
  {
    id: 50001,
    name: "Fenrir's Gaze",
    manaCost: 3,
    description: "Lifesteal. Deal 3 damage to a minion. Outcast: This costs (1).",
    flavorText: "The great wolf's eyes pierce through the darkness of Ragnarok.",
    type: "spell",
    rarity: "rare",
    class: "Demonhunter",
    keywords: ["outcast", "lifesteal"],
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
    id: 50002,
    name: "Odin's Vision",
    manaCost: 2,
    description: "Draw a card. Outcast: Draw another.",
    flavorText: "He sacrificed his eye for wisdom - but gained sight beyond mortal ken.",
    type: "spell",
    rarity: "common",
    class: "Demonhunter",
    keywords: ["outcast"],
    spellEffect: {
      type: "draw",
      value: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 10008,
    name: "Flamereaper",
    manaCost: 7,
    attack: 3,
    durability: 2,
    description: "Also attacks the minions next to whomever your hero attacks.",
    flavorText: "It's a whirlwind of burning fel destruction. Doubles as a pizza cutter.",
    type: "weapon",
    rarity: "epic",
    class: "Demonhunter",
    collectible: true,
    set: "core"
  },
  {
    id: 10009,
    name: "Bound Titan-Spawn",
    manaCost: 5,
    attack: 10,
    health: 6,
    description: "Dormant for 2 turns. When this awakens, deal 10 damage randomly split among all enemies.",
    flavorText: "Chained by the Olympians, the spawn of the Titans awaits its moment of vengeance.",
    type: "minion",
    rarity: "rare",
    class: "Demonhunter",
    race: "titan",
    keywords: ["dormant"],
    collectible: true,
    set: "core"
  },
  {
    id: 9114,
    name: "Demonic Blast",
    manaCost: 1,
    description: "Deal 4 damage.",
    flavorText: "After 2 uses, swap back.",
    type: "spell",
    rarity: "legendary",
    class: "Demonhunter",
    spellEffect: {
      type: "damage",
      value: 4,
      targetType: "any",
      requiresTarget: true
    },
    collectible: false,
    set: "core"
  },
  {
    id: 9117,
    name: "Illidari Initiate",
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "Rush",
    flavorText: "They're very eager to prove themselves.",
    type: "minion",
    rarity: "common",
    class: "Demonhunter",
    keywords: ["rush"],
    collectible: false,
    set: "core"
  },
  {
    id: 20013,
    name: "Thanatos, Demon Form",
    manaCost: 8,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Transform into Demon Form, gaining +5 Attack and Lifesteal this turn.",
    flavorText: "Death incarnate, transformed by demonic power.",
    keywords: ["battlecry"],
    class: "Demonhunter",
    collectible: true,
    set: "core",
    battlecry: {
      type: "buff",
      requiresTarget: false,
      targetType: "none",
      buffAttack: 5,
      buffHealth: 0
    }
  },
  // === Dormant Card ===
  {
    id: 10005,
    name: "Bound Forge-Imp",
    manaCost: 1,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "common",
    race: "titan",
    description: "Dormant for 2 turns. When this awakens, equip a 3/2 Flamereaper.",
    flavorText: "Shackled in the forges of Hephaestus, it yearns to craft once more.",
    keywords: ["dormant"],
    class: "Demonhunter",
    collectible: true,
    set: "core",
    dormantTurns: 2,
    awakenEffect: {
      type: "equip_weapon",
      value: 3,
      durability: 2
    }
  },
  // === Migrated from additionalClassMinions.ts ===
  {
    id: 40019,
    name: "Battlefiend",
    manaCost: 1,
    attack: 1,
    health: 2,
    type: "minion",
    rarity: "common",
    race: "titan",
    description: "After your hero attacks, gain +1 Attack.",
    flavorText: "Born for battle, it grows stronger with each strike.",
    class: "Demonhunter",
    minionEffect: {
      type: "buff_on_hero_attack",
      buffAttack: 1
    },
    collectible: true,
    set: "core"
  },
  // === Migrated Outcast Cards ===
  {
    id: 50005,
    name: "Einherjar Berserker",
    manaCost: 4,
    attack: 5,
    health: 3,
    type: "minion",
    rarity: "rare",
    description: "Rush. Outcast: Gain +2/+2.",
    flavorText: "Chosen warriors from Valhalla, eternally hungry for battle.",
    class: "Demonhunter",
    keywords: ["rush", "outcast"],
    collectible: true,
    set: "core"
  },
  {
    id: 50006,
    name: "Priestess of Nemesis",
    manaCost: 7,
    attack: 6,
    health: 7,
    type: "minion",
    rarity: "rare",
    description: "At the end of your turn, deal 6 damage randomly split among all enemies.",
    flavorText: "She serves the goddess of divine retribution with unyielding fury.",
    class: "Demonhunter",
    collectible: true,
    set: "core"
  },
  {
    id: 50007,
    name: "Jötunn Thornback",
    manaCost: 5,
    attack: 2,
    health: 6,
    type: "minion",
    rarity: "common",
    description: "Taunt. Whenever this minion takes damage, deal 1 damage to all enemies.",
    flavorText: "Touch his spines at your own peril - the frost giant feels no pain.",
    class: "Demonhunter",
    keywords: ["taunt"],
    collectible: true,
    set: "core"
  }
];
