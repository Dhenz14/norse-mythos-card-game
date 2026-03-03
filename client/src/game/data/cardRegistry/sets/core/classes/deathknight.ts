import { CardData } from '../../../../../types';

export const deathknightCards: CardData[] = [
  {
    id: 3001,
    name: "Death Coil",
    manaCost: 2,
    description: "Deal 3 damage to an enemy, or restore 3 Health to a friendly undead minion.",
    flavorText: "The prime currency of Helheim. Trades particularly well against life.",
    type: "spell",
    rarity: "common",
    class: "DeathKnight",
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
    flavorText: "Like a good neighbor, the undead are there!",
    type: "spell",
    rarity: "epic",
    class: "DeathKnight",
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
    flavorText: "The bitter cold of Niflheim seeps into the marrow of its victims' bones.",
    type: "spell",
    rarity: "rare",
    class: "DeathKnight",
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
    name: "Hel's Edge",
    manaCost: 7,
    attack: 5,
    durability: 3,
    description: "After your hero attacks and kills a minion, summon that minion to your side.",
    flavorText: "Whomsoever takes up this blade shall wield power eternal.",
    type: "weapon",
    rarity: "mythic",
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    name: "The Draugr King",
    manaCost: 9,
    description: "Battlecry: Equip Hel's Edge and gain 5 Armor.",
    flavorText: "When a prince becomes a death knight, it's a royal pain.",
    type: "hero",
    rarity: "mythic",
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    flavorText: "Frost death knights bring the bitter cold of Niflheim with them.",
    type: "spell",
    rarity: "rare",
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    class: "DeathKnight",
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
    name: "Draugr Champion",
    manaCost: 4,
    attack: 3,
    health: 3,
    description: "Battlecry: Give a friendly minion +2/+2 and Taunt.",
    flavorText: "Champions of Helheim command legions of undead.",
    type: "minion",
    rarity: "rare",
    class: "DeathKnight",
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
    class: "DeathKnight",
    collectible: false,
    set: "core"
  },
  {
    id: 3031,
    name: "Frozen Acolyte",
    manaCost: 1,
    attack: 1,
    health: 2,
    description: "Battlecry: Freeze a minion.",
    flavorText: "She once prayed to the Aesir for warmth. Now she answers with frost.",
    type: "minion",
    rarity: "common",
    class: "DeathKnight",
    keywords: ["battlecry"],
    battlecry: {
      type: "freeze",
      targetType: "any_minion",
      requiresTarget: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3032,
    name: "Plague Spreader",
    manaCost: 2,
    attack: 2,
    health: 3,
    description: "Deathrattle: Give adjacent minions -1 Attack.",
    flavorText: "The draugr carry plagues that felled entire villages along the fjords.",
    type: "minion",
    rarity: "common",
    class: "DeathKnight",
    race: "Undead",
    keywords: ["deathrattle"],
    deathrattle: {
      type: "debuff_adjacent",
      buffAttack: -1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3033,
    name: "Runebound Ghoul",
    manaCost: 3,
    attack: 3,
    health: 3,
    description: "Gains +1/+1 when an enemy minion dies.",
    flavorText: "Carved with runes of binding, it feeds on the passing of the slain.",
    type: "minion",
    rarity: "rare",
    class: "DeathKnight",
    race: "Undead",
    keywords: [],
    minionEffect: {
      type: "buff_on_enemy_death",
      buffAttack: 1,
      buffHealth: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3034,
    name: "Frost Revenant",
    manaCost: 3,
    attack: 2,
    health: 4,
    description: "Your frozen enemies take +1 damage.",
    flavorText: "Born in the howling winds of Niflheim, where even the dead shiver.",
    type: "minion",
    rarity: "rare",
    class: "DeathKnight",
    keywords: [],
    aura: {
      type: "frozen_damage_bonus",
      value: 1,
      targetType: "frozen_enemies"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3035,
    name: "Abomination Smith",
    manaCost: 4,
    attack: 3,
    health: 5,
    description: "Battlecry: Destroy a friendly Undead to gain its stats.",
    flavorText: "In Helheim's forges, the dead are not mourned — they are repurposed.",
    type: "minion",
    rarity: "epic",
    class: "DeathKnight",
    keywords: ["battlecry"],
    battlecry: {
      type: "consume_friendly",
      targetType: "friendly_minion",
      requiresTarget: true,
      raceFilter: "Undead",
      gainStats: true
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3036,
    name: "Deathcharger",
    manaCost: 4,
    attack: 5,
    health: 2,
    description: "Charge. Deathrattle: Deal 3 damage to your hero.",
    flavorText: "Sleipnir's shadow breeds steeds that gallop between the realms of the living and the dead.",
    type: "minion",
    rarity: "common",
    class: "DeathKnight",
    race: "Undead",
    keywords: ["charge", "deathrattle"],
    deathrattle: {
      type: "damage_hero",
      value: 3,
      targetType: "friendly_hero"
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3037,
    name: "Val'kyr Shadowguard",
    manaCost: 5,
    attack: 4,
    health: 5,
    description: "Deathrattle: Resummon this minion with 1 Health.",
    flavorText: "The Valkyries of shadow do not choose the slain — they refuse to become them.",
    type: "minion",
    rarity: "epic",
    class: "DeathKnight",
    keywords: ["deathrattle"],
    deathrattle: {
      type: "resummon_self",
      health: 1
    },
    collectible: true,
    set: "core"
  },
  {
    id: 3038,
    name: "Frost Wyrm",
    manaCost: 8,
    attack: 6,
    health: 8,
    description: "Battlecry: Freeze all enemy minions.",
    flavorText: "Nidhogg's lesser kin, reborn in ice atop the peaks of Jotunheim.",
    type: "minion",
    rarity: "mythic",
    class: "DeathKnight",
    race: "Dragon",
    keywords: ["battlecry"],
    battlecry: {
      type: "freeze",
      targetType: "all_enemy_minions"
    },
    collectible: true,
    set: "core"
  }
];
