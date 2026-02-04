import { CardData } from '../../../../../types';

export const deathknightCards: CardData[] = [
  {
    id: 3001,
    name: "Death Coil",
    manaCost: 2,
    description: "Deal 3 damage to an enemy, or restore 3 Health to a friendly undead minion.",
    flavorText: "The prime currency of the Scourge. Trades particularly well against life.",
    type: "spell",
    rarity: "common",
    class: "Deathknight",
    spellEffect: {
      type: "death_coil",
      value: 3,
      targetType: "any",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3005,
    name: "Army of the Dead",
    manaCost: 6,
    description: "Summon three 2/2 Ghouls with Taunt.",
    flavorText: "Like a good neighbor, the Scourge is there!",
    type: "spell",
    rarity: "epic",
    class: "Deathknight",
    spellEffect: {
      type: "summon",
      summonCardId: 3003,
      value: 3,
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3007,
    name: "Remorseless Winter",
    manaCost: 4,
    description: "Freeze all enemy minions. Deal 2 damage to all Frozen enemies.",
    flavorText: "The bitter cold of Northrend seeps into the marrow of its victims' bones.",
    type: "spell",
    rarity: "rare",
    class: "Deathknight",
    spellEffect: {
      type: "freeze_and_damage",
      value: 2,
      targetType: "all_enemy_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3009,
    name: "Frostmourne",
    manaCost: 7,
    attack: 5,
    durability: 3,
    description: "After your hero attacks and kills a minion, summon that minion to your side.",
    flavorText: "Whomsoever takes up this blade shall wield power eternal.",
    type: "weapon",
    rarity: "legendary",
    class: "Deathknight",
    collectible: true,
    set: "core"
  },
  {
    id: 3011,
    name: "Blood Boil",
    manaCost: 2,
    description: "Deal 1 damage to all minions. If any die, restore 3 Health to your hero.",
    flavorText: "Boiling blood is a staple in the death knight diet.",
    type: "spell",
    rarity: "rare",
    class: "Deathknight",
    spellEffect: {
      type: "aoe_with_on_kill",
      value: 1,
      targetType: "all_minions"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3012,
    name: "Runeforged Blade",
    manaCost: 3,
    attack: 2,
    durability: 3,
    description: "Your weapon has +1 Attack for each Rune you have active.",
    flavorText: "Enchanted with runes of power.",
    type: "weapon",
    rarity: "epic",
    class: "Deathknight",
    collectible: true,
    set: "core"
  },
  {
    id: 3013,
    name: "Icebound Fortitude",
    manaCost: 4,
    description: "Give your hero +5 Armor and Immunity this turn.",
    flavorText: "Death knights can encase themselves in an icy fortress of invulnerability.",
    type: "spell",
    rarity: "epic",
    class: "Deathknight",
    spellEffect: {
      type: "gain_armor_and_immunity",
      value: 5,
      targetType: "friendly_hero"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3014,
    name: "Dark Command",
    manaCost: 3,
    description: "Take control of an enemy minion with 3 or less Attack until end of turn.",
    flavorText: "Death knights are masters of manipulation.",
    type: "spell",
    rarity: "rare",
    class: "Deathknight",
    spellEffect: {
      type: "mind_control_temporary",
      targetType: "enemy_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3015,
    name: "Arthas Menethil",
    manaCost: 9,
    description: "Battlecry: Equip Frostmourne and gain 5 Armor.",
    flavorText: "When a prince becomes a death knight, it's a royal pain.",
    type: "hero",
    rarity: "legendary",
    class: "Deathknight",
    keywords: ["battlecry"],
    collectible: true,
    set: "core"
  },
  {
    id: 3017,
    name: "Death Gate",
    manaCost: 4,
    description: "Summon a random friendly minion that died this game.",
    flavorText: "Death knights can open portals to the realm of the dead.",
    type: "spell",
    rarity: "rare",
    class: "Deathknight",
    spellEffect: {
      type: "resurrect_random",
      value: 1,
      targetType: "none"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3018,
    name: "Bone Shield",
    manaCost: 2,
    description: "Give a minion +2 Health and \"After this minion survives damage, summon a 1/1 Skeleton.\"",
    flavorText: "A shield made of bones. Pretty self-explanatory, actually.",
    type: "spell",
    rarity: "common",
    class: "Deathknight",
    spellEffect: {
      type: "buff_and_enchant",
      buffHealth: 2,
      targetType: "any_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3021,
    name: "Blood Presence",
    manaCost: 3,
    description: "Give your hero +4 Armor and Lifesteal this turn.",
    flavorText: "Blood death knights are vampiric fighters.",
    type: "spell",
    rarity: "rare",
    class: "Deathknight",
    spellEffect: {
      type: "gain_armor_and_lifesteal",
      value: 4,
      targetType: "friendly_hero"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3022,
    name: "Frost Presence",
    manaCost: 3,
    description: "Freeze an enemy and all adjacent minions.",
    flavorText: "Frost death knights bring the bitter cold of Northrend with them.",
    type: "spell",
    rarity: "rare",
    class: "Deathknight",
    spellEffect: {
      type: "freeze_adjacent",
      targetType: "enemy_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3024,
    name: "Runeblade",
    manaCost: 2,
    attack: 2,
    durability: 2,
    description: "",
    flavorText: "A basic runeblade, the iconic weapon of the death knight.",
    type: "weapon",
    rarity: "common",
    class: "Deathknight",
    collectible: true,
    set: "core"
  },
  {
    id: 3025,
    name: "Chains of Ice",
    manaCost: 2,
    description: "Freeze an enemy. Draw a card.",
    flavorText: "Death knights can conjure chains of pure ice to bind their opponents.",
    type: "spell",
    rarity: "common",
    class: "Deathknight",
    spellEffect: {
      type: "freeze_and_draw",
      targetType: "any_enemy",
      requiresTarget: true,
      drawCards: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3027,
    name: "Death Knight Initiate",
    manaCost: 2,
    attack: 2,
    health: 3,
    description: "Battlecry: Give your weapon +1/+1.",
    flavorText: "Every death knight starts somewhere.",
    type: "minion",
    rarity: "common",
    class: "Deathknight",
    keywords: ["battlecry"],
    battlecry: {
      type: "buff_weapon",
      buffAttack: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3029,
    name: "Scourge Champion",
    manaCost: 4,
    attack: 3,
    health: 3,
    description: "Battlecry: Give a friendly minion +2/+2 and Taunt.",
    flavorText: "Champions of the Scourge command legions of undead.",
    type: "minion",
    rarity: "rare",
    class: "Deathknight",
    keywords: ["battlecry"],
    battlecry: {
      type: "buff_and_taunt",
      buffAttack: 2,
      buffHealth: 2,
      targetType: "friendly_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3019,
    name: "Skeleton",
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "",
    flavorText: "Just your average, run-of-the-mill undead skeleton.",
    type: "minion",
    rarity: "common",
    class: "Deathknight",
    collectible: false,
    set: "core"
  }
];
