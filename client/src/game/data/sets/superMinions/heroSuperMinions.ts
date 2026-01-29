/**
 * heroSuperMinions.ts
 * 
 * Super Minions - One legendary minion per hero (76 total)
 * These minions gain +2/+2 when played by their linked hero.
 * 
 * ID Range: 95000-95999 (Super Minions)
 */

import { CardData, BattlecryTargetType } from '../../../types';

/**
 * Hero-to-Super Minion linking data
 * Maps hero IDs to their super minion IDs for the +2/+2 bonus
 */
export const HERO_SUPER_MINION_LINKS: Record<string, number> = {
  // QUEEN - Mage (10)
  'hero-odin': 95001,
  'hero-bragi': 95002,
  'hero-kvasir': 95003,
  'hero-eldrin': 95004,
  'hero-logi': 95005,
  'hero-zeus': 95006,
  'hero-athena': 95007,
  'hero-hyperion': 95008,
  'hero-uranus': 95009,
  'hero-chronos': 95010,
  
  // QUEEN - Warlock (7)
  'hero-forseti': 95011,
  'hero-mani': 95012,
  'hero-thryma': 95013,
  'hero-hades': 95014,
  'hero-dionysus': 95015,
  'hero-tartarus': 95016,
  'hero-persephone': 95017,
  
  // QUEEN - Necromancer (3)
  'hero-sol': 95018,
  'hero-sinmara': 95019,
  'hero-hel': 95020,
  
  // ROOK - Warrior (6)
  'hero-thor': 95021,
  'hero-thorgrim': 95022,
  'hero-valthrud': 95023,
  'hero-vili': 95024,
  'hero-ares': 95025,
  'hero-hephaestus': 95026,
  
  // ROOK - Death Knight (2)
  'hero-magni': 95027,
  'hero-brakki': 95028,
  
  // ROOK - Paladin (5)
  'hero-tyr': 95029,
  'hero-vidar': 95030,
  'hero-heimdall': 95031,
  'hero-baldur': 95032,
  'hero-solvi': 95033,
  
  // BISHOP - Priest (8)
  'hero-freya': 95034,
  'hero-eir': 95035,
  'hero-frey': 95036,
  'hero-hoenir': 95037,
  'hero-aphrodite': 95038,
  'hero-hera': 95039,
  'hero-eros': 95040,
  'hero-hestia': 95041,
  
  // BISHOP - Druid (6)
  'hero-idunn': 95042,
  'hero-ve': 95043,
  'hero-fjorgyn': 95044,
  'hero-sigyn': 95045,
  'hero-demeter': 95046,
  'hero-gaia': 95047,
  
  // BISHOP - Shaman (5)
  'hero-gerd': 95048,
  'hero-gefjon': 95049,
  'hero-ran': 95050,
  'hero-njord': 95051,
  'hero-poseidon': 95052,
  
  // KNIGHT - Rogue (6)
  'hero-loki': 95053,
  'hero-hoder': 95054,
  'hero-gormr': 95055,
  'hero-lirien': 95056,
  'hero-hermes': 95057,
  'hero-nyx': 95058,
  
  // KNIGHT - Hunter (6)
  'hero-skadi': 95059,
  'hero-aegir': 95060,
  'hero-fjora': 95061,
  'hero-ullr': 95062,
  'hero-apollo': 95063,
  'hero-artemis': 95064,
  
  // KNIGHT - Demon Hunter (2)
  'hero-myrka': 95065,
  'hero-ylva': 95066,
  
  // Japanese Heroes (5)
  'hero-izanami': 95067,
  'hero-tsukuyomi': 95068,
  'hero-fujin': 95069,
  'hero-sarutahiko': 95070,
  'hero-kamimusubi': 95071,
  
  // Egyptian Heroes (5)
  'hero-ammit': 95072,
  'hero-maat': 95073,
  'hero-serqet': 95074,
  'hero-khepri': 95075,
  'hero-shu': 95076,
};

/**
 * Reverse lookup: Super Minion ID to Hero ID
 */
export const SUPER_MINION_TO_HERO: Record<number, string> = Object.entries(HERO_SUPER_MINION_LINKS)
  .reduce((acc, [heroId, minionId]) => {
    acc[minionId] = heroId;
    return acc;
  }, {} as Record<number, string>);

/**
 * Check if a card is a super minion
 */
export function isSuperMinion(cardId: number): boolean {
  return cardId >= 95001 && cardId <= 95999;
}

/**
 * Get the linked hero for a super minion
 */
export function getLinkedHero(superMinionId: number): string | undefined {
  return SUPER_MINION_TO_HERO[superMinionId];
}

/**
 * Get the super minion for a hero
 */
export function getSuperMinionForHero(heroId: string): number | undefined {
  return HERO_SUPER_MINION_LINKS[heroId];
}

/**
 * Check if a super minion should get the hero bonus
 */
export function shouldGetHeroBonus(superMinionId: number, currentHeroId: string): boolean {
  const linkedHero = getLinkedHero(superMinionId);
  return linkedHero === currentHeroId;
}

/**
 * Super Minion Collection - 76 Legendary Minions
 * Each minion is linked to a specific hero and gains +2/+2 when played by that hero
 */
export const heroSuperMinions: CardData[] = [
  // ═══════════════════════════════════════════════════════════════
  // QUEEN - MAGE CLASS (10 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95001,
    name: "Huginn & Muninn, the All-Seeing",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Reveal opponent's entire hand. Draw 2 cards. Your spells cost (1) less this turn.",
    keywords: ["battlecry"],
    heroClass: "mage",
    class: "Mage",
    race: "beast",
    linkedHeroId: "hero-odin",
    isSuperMinion: true,
    battlecry: {
      type: "reveal_and_draw",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95002,
    name: "Skald of the Endless Saga",
    manaCost: 10,
    attack: 7,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Discover 3 spells. Give them +2 Spell Damage. Aura: Your spells deal +2 damage.",
    keywords: ["battlecry"],
    heroClass: "mage",
    class: "Mage",
    linkedHeroId: "hero-bragi",
    isSuperMinion: true,
    battlecry: {
      type: "discover_spells",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    aura: {
      type: "spell_damage",
      value: 2
    },
    collectible: true
  },
  {
    id: 95003,
    name: "The Mead of Poetry",
    manaCost: 10,
    attack: 6,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Draw 4 cards. Gain +1/+1 for each card drawn this game.",
    keywords: ["battlecry"],
    heroClass: "mage",
    class: "Mage",
    linkedHeroId: "hero-kvasir",
    isSuperMinion: true,
    battlecry: {
      type: "draw_and_buff_self",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95004,
    name: "Phoenix of Alfheim",
    manaCost: 11,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal 6 damage to all enemy minions. Deathrattle: Return to your hand with +2/+2.",
    keywords: ["battlecry", "deathrattle"],
    heroClass: "mage",
    class: "Mage",
    race: "elemental",
    linkedHeroId: "hero-eldrin",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_enemies",
      value: 6,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    deathrattle: {
      type: "return_to_hand_buffed",
      value: 2
    },
    collectible: true
  },
  {
    id: 95005,
    name: "Muspelheim's Inferno",
    manaCost: 10,
    attack: 9,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal 8 damage randomly split among all enemies.",
    keywords: ["battlecry"],
    heroClass: "mage",
    class: "Mage",
    race: "elemental",
    linkedHeroId: "hero-logi",
    isSuperMinion: true,
    battlecry: {
      type: "damage_split",
      value: 8,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95006,
    name: "Keraunos, Living Lightning",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal 3 damage to all enemies. Overload: (2). When you cast a spell, deal 1 damage to a random enemy.",
    keywords: ["battlecry", "overload"],
    heroClass: "mage",
    class: "Mage",
    race: "elemental",
    linkedHeroId: "hero-zeus",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_enemies",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    triggeredEffect: {
      trigger: "on_spell_cast",
      type: "damage_random_enemy",
      value: 1
    },
    collectible: true
  },
  {
    id: 95007,
    name: "Aegis, the Divine Shield",
    manaCost: 10,
    attack: 7,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Give all friendly minions Divine Shield and +2 Health.",
    keywords: ["battlecry", "divine_shield"],
    heroClass: "mage",
    class: "Mage",
    linkedHeroId: "hero-athena",
    isSuperMinion: true,
    battlecry: {
      type: "buff_all_friendly_divine_shield",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95008,
    name: "Titan of the Blazing Sun",
    manaCost: 12,
    attack: 10,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal 5 damage to all enemies. At the end of each turn, deal 2 damage to all enemies.",
    keywords: ["battlecry"],
    heroClass: "mage",
    class: "Mage",
    race: "elemental",
    linkedHeroId: "hero-hyperion",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_enemies",
      value: 5,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    triggeredEffect: {
      trigger: "end_of_turn",
      type: "damage_all_enemies",
      value: 2
    },
    collectible: true
  },
  {
    id: 95009,
    name: "Celestial Primordial",
    manaCost: 11,
    attack: 8,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Freeze all enemy minions for 2 turns. Discover a spell. Your spells cost (2) less.",
    keywords: ["battlecry"],
    heroClass: "mage",
    class: "Mage",
    race: "elemental",
    linkedHeroId: "hero-uranus",
    isSuperMinion: true,
    battlecry: {
      type: "freeze_all_and_discover",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95010,
    name: "Eternity's Hourglass",
    manaCost: 10,
    attack: 7,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Take an extra turn after this one. Your cards cost (1) more next turn.",
    keywords: ["battlecry"],
    heroClass: "mage",
    class: "Mage",
    linkedHeroId: "hero-chronos",
    isSuperMinion: true,
    battlecry: {
      type: "extra_turn",
      value: 1,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // QUEEN - WARLOCK CLASS (7 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95011,
    name: "Glitnir's Final Judgment",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy a random enemy minion. If it had 5+ Attack, destroy another. Draw a card for each.",
    keywords: ["battlecry"],
    heroClass: "warlock",
    class: "Warlock",
    linkedHeroId: "hero-forseti",
    isSuperMinion: true,
    battlecry: {
      type: "destroy_and_draw",
      value: 5,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95012,
    name: "Hati, the Moon-Devourer",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Give all friendly minions Stealth. Summon a 4/4 Shadow Wolf with Lifesteal.",
    keywords: ["battlecry"],
    heroClass: "warlock",
    class: "Warlock",
    race: "beast",
    linkedHeroId: "hero-mani",
    isSuperMinion: true,
    battlecry: {
      type: "stealth_all_and_summon",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95013,
    name: "Stormwyrm Tempest",
    manaCost: 10,
    attack: 7,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal 4 damage to all enemies. Return the two weakest enemy minions to their hand.",
    keywords: ["battlecry"],
    heroClass: "warlock",
    class: "Warlock",
    race: "dragon",
    linkedHeroId: "hero-thryma",
    isSuperMinion: true,
    battlecry: {
      type: "damage_and_bounce",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95014,
    name: "Cerberus, Guardian of the Dead",
    manaCost: 11,
    attack: 9,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy all enemy minions with 4 or less Attack. Summon 2/2 Shades for each destroyed.",
    keywords: ["battlecry"],
    heroClass: "warlock",
    class: "Warlock",
    race: "demon",
    linkedHeroId: "hero-hades",
    isSuperMinion: true,
    battlecry: {
      type: "conditional_destroy_summon",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95015,
    name: "Maenads' Frenzy",
    manaCost: 9,
    attack: 6,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Give all minions +3 Attack. At end of turn, deal 2 damage to all minions.",
    keywords: ["battlecry"],
    heroClass: "warlock",
    class: "Warlock",
    linkedHeroId: "hero-dionysus",
    isSuperMinion: true,
    battlecry: {
      type: "buff_all_attack",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    triggeredEffect: {
      trigger: "end_of_turn",
      type: "damage_all_minions",
      value: 2
    },
    collectible: true
  },
  {
    id: 95016,
    name: "Abyss of Eternal Night",
    manaCost: 11,
    attack: 8,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy the highest and lowest Attack enemy minions. Gain their combined stats.",
    keywords: ["battlecry"],
    heroClass: "warlock",
    class: "Warlock",
    race: "demon",
    linkedHeroId: "hero-tartarus",
    isSuperMinion: true,
    battlecry: {
      type: "destroy_extremes_gain_stats",
      value: 0,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95017,
    name: "Queen of the Underworld",
    manaCost: 10,
    attack: 7,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Resurrect 3 random friendly minions that died this game. Give them +1/+1 and Rush.",
    keywords: ["battlecry"],
    heroClass: "warlock",
    class: "Warlock",
    linkedHeroId: "hero-persephone",
    isSuperMinion: true,
    battlecry: {
      type: "resurrect_buff",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // QUEEN - NECROMANCER CLASS (3 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95018,
    name: "Skoll, the Sun-Devourer",
    manaCost: 10,
    attack: 9,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal 4 damage to all enemies. Deathrattle: Summon a 6/6 Solar Eclipse that deals 2 damage to all enemies at end of turn.",
    keywords: ["battlecry", "deathrattle"],
    heroClass: "necromancer",
    class: "Necromancer",
    race: "beast",
    linkedHeroId: "hero-sol",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_enemies",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    deathrattle: {
      type: "summon_with_triggered",
      summonName: "Solar Eclipse",
      summonAttack: 6,
      summonHealth: 6
    },
    collectible: true
  },
  {
    id: 95019,
    name: "Lævateinn, Blade of Ruin",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal 10 damage to a minion. If it dies, deal excess damage to adjacent minions. Give Fire minions +2 Attack.",
    keywords: ["battlecry"],
    heroClass: "necromancer",
    class: "Necromancer",
    race: "elemental",
    linkedHeroId: "hero-sinmara",
    isSuperMinion: true,
    battlecry: {
      type: "overkill_cleave",
      value: 10,
      requiresTarget: true,
      targetType: BattlecryTargetType.ANY_MINION
    },
    collectible: true
  },
  {
    id: 95020,
    name: "Garmr, Hound of Helheim",
    manaCost: 11,
    attack: 9,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy all minions with 3 or less Health. Summon a 2/2 Draugr with Rush for each. Deathrattle: Resurrect this at 1 Health.",
    keywords: ["battlecry", "deathrattle"],
    heroClass: "necromancer",
    class: "Necromancer",
    race: "beast",
    linkedHeroId: "hero-hel",
    isSuperMinion: true,
    battlecry: {
      type: "destroy_low_health_summon",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    deathrattle: {
      type: "resurrect_self",
      value: 1
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // ROOK - WARRIOR CLASS (6 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95021,
    name: "Tanngrisnir & Tanngnjóstr",
    manaCost: 12,
    attack: 10,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Deal 5 damage to all enemies. Deathrattle: Summon two 4/4 Goats with Rush. Gain 5 Armor.",
    keywords: ["rush", "battlecry", "deathrattle"],
    heroClass: "warrior",
    class: "Warrior",
    race: "beast",
    linkedHeroId: "hero-thor",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_enemies_armor",
      value: 5,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    deathrattle: {
      type: "summon_multiple",
      summonName: "Thunder Goat",
      summonAttack: 4,
      summonHealth: 4,
      count: 2
    },
    collectible: true
  },
  {
    id: 95022,
    name: "Hrungnir's Heart",
    manaCost: 11,
    attack: 9,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Battlecry: Gain +1/+1 for each damaged character. Deal 3 damage to a random enemy for each friendly minion.",
    keywords: ["taunt", "battlecry"],
    heroClass: "warrior",
    class: "Warrior",
    race: "elemental",
    linkedHeroId: "hero-thorgrim",
    isSuperMinion: true,
    battlecry: {
      type: "buff_from_damaged",
      value: 1,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95023,
    name: "Jörmungandr, World Serpent",
    manaCost: 12,
    attack: 8,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Poisonous. Battlecry: Deal 2 damage to all enemies. Gain +1 Attack for each enemy damaged.",
    keywords: ["taunt", "poisonous", "battlecry"],
    heroClass: "warrior",
    class: "Warrior",
    race: "beast",
    linkedHeroId: "hero-valthrud",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_buff_self",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95024,
    name: "Whetstone of Ymir",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Give all friendly minions +3 Attack this turn. Draw a card for each that attacks and kills.",
    keywords: ["rush", "battlecry"],
    heroClass: "warrior",
    class: "Warrior",
    linkedHeroId: "hero-vili",
    isSuperMinion: true,
    battlecry: {
      type: "buff_attack_draw_on_kill",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95025,
    name: "Phobos & Deimos",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Summon a 4/4 Fear (can't be attacked) and a 4/4 Terror with Windfury.",
    keywords: ["rush", "battlecry"],
    heroClass: "warrior",
    class: "Warrior",
    linkedHeroId: "hero-ares",
    isSuperMinion: true,
    battlecry: {
      type: "summon_pair",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95026,
    name: "Automatons of Olympus",
    manaCost: 10,
    attack: 7,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Battlecry: Equip a 4/2 Divine Hammer. Summon two 3/3 Bronze Automatons with Reborn.",
    keywords: ["taunt", "battlecry"],
    heroClass: "warrior",
    class: "Warrior",
    race: "mech",
    linkedHeroId: "hero-hephaestus",
    isSuperMinion: true,
    battlecry: {
      type: "equip_weapon_summon",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // ROOK - DEATH KNIGHT CLASS (2 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95027,
    name: "Hammer of the Forge-Father",
    manaCost: 11,
    attack: 9,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Deal 4 damage to all enemies. Gain 8 Armor. Deathrattle: Summon a 5/5 Spectral Forger.",
    keywords: ["rush", "battlecry", "deathrattle"],
    heroClass: "deathknight",
    class: "DeathKnight",
    linkedHeroId: "hero-magni",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_enemies_armor",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    deathrattle: {
      type: "summon",
      summonName: "Spectral Forger",
      summonAttack: 5,
      summonHealth: 5
    },
    collectible: true
  },
  {
    id: 95028,
    name: "Völundr's Masterwork",
    manaCost: 10,
    attack: 8,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Discover a weapon and equip it with +2/+2. Give all friendly minions +2/+2.",
    keywords: ["battlecry"],
    heroClass: "deathknight",
    class: "DeathKnight",
    linkedHeroId: "hero-brakki",
    isSuperMinion: true,
    battlecry: {
      type: "discover_weapon_buff_all",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // ROOK - PALADIN CLASS (5 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95029,
    name: "Gleipnir, the Binding Chain",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Divine Shield. Battlecry: Silence and Freeze all enemy minions. Draw cards equal to silenced minions.",
    keywords: ["divine_shield", "battlecry"],
    heroClass: "paladin",
    class: "Paladin",
    linkedHeroId: "hero-tyr",
    isSuperMinion: true,
    battlecry: {
      type: "silence_freeze_draw",
      value: 0,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95030,
    name: "Iron Boot of Ragnarok",
    manaCost: 11,
    attack: 10,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Destroy an enemy minion. Gain its Attack as Armor. Deathrattle: Summon a 5/5 Avenging Vidar.",
    keywords: ["rush", "battlecry", "deathrattle"],
    heroClass: "paladin",
    class: "Paladin",
    linkedHeroId: "hero-vidar",
    isSuperMinion: true,
    battlecry: {
      type: "destroy_gain_armor",
      value: 0,
      requiresTarget: true,
      targetType: BattlecryTargetType.ENEMY_MINION
    },
    deathrattle: {
      type: "summon",
      summonName: "Avenging Vidar",
      summonAttack: 5,
      summonHealth: 5
    },
    collectible: true
  },
  {
    id: 95031,
    name: "Gjallarhorn, Doom's Herald",
    manaCost: 10,
    attack: 7,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Battlecry: Give all friendly minions +2 Health and Taunt. Reveal opponent's hand. Draw 2 cards.",
    keywords: ["taunt", "battlecry"],
    heroClass: "paladin",
    class: "Paladin",
    linkedHeroId: "hero-heimdall",
    isSuperMinion: true,
    battlecry: {
      type: "buff_taunt_reveal_draw",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95032,
    name: "Mistletoe's Redemption",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Divine Shield. Battlecry: Give all friendly minions Divine Shield. Your hero is Immune until next turn. Deathrattle: Restore all friendly minions to full Health.",
    keywords: ["divine_shield", "battlecry", "deathrattle"],
    heroClass: "paladin",
    class: "Paladin",
    linkedHeroId: "hero-baldur",
    isSuperMinion: true,
    battlecry: {
      type: "divine_shield_all_immune",
      value: 0,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    deathrattle: {
      type: "heal_all_friendly",
      value: 99
    },
    collectible: true
  },
  {
    id: 95033,
    name: "Dawn's First Light",
    manaCost: 10,
    attack: 7,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Give all friendly minions +2/+2 and Divine Shield. Deal 3 damage to all enemy minions.",
    keywords: ["battlecry"],
    heroClass: "paladin",
    class: "Paladin",
    linkedHeroId: "hero-solvi",
    isSuperMinion: true,
    battlecry: {
      type: "buff_divine_shield_damage",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // BISHOP - PRIEST CLASS (8 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95034,
    name: "Brísingamen, Necklace of Flame",
    manaCost: 10,
    attack: 7,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Give all friendly minions +2/+2 and Lifesteal. Restore 10 Health to your hero. Aura: Double healing.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    linkedHeroId: "hero-freya",
    isSuperMinion: true,
    battlecry: {
      type: "buff_lifesteal_heal",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    aura: {
      type: "double_healing"
    },
    collectible: true
  },
  {
    id: 95035,
    name: "Chalice of Eternal Life",
    manaCost: 10,
    attack: 6,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Restore all characters to full Health. Your minions can't be reduced below 1 Health this turn.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    linkedHeroId: "hero-eir",
    isSuperMinion: true,
    battlecry: {
      type: "heal_all_protect",
      value: 99,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95036,
    name: "Gullinbursti, the Golden Boar",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Summon a copy of this minion. Deathrattle: Give a random friendly minion +4/+4.",
    keywords: ["rush", "battlecry", "deathrattle"],
    heroClass: "priest",
    class: "Priest",
    race: "beast",
    linkedHeroId: "hero-frey",
    isSuperMinion: true,
    battlecry: {
      type: "summon_copy",
      value: 0,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    deathrattle: {
      type: "buff_random_friendly",
      value: 4
    },
    collectible: true
  },
  {
    id: 95037,
    name: "Breath of the Creator",
    manaCost: 10,
    attack: 7,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Give all friendly minions 'Deathrattle: Summon a 2/2 copy of this minion.' Draw 2 cards.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    linkedHeroId: "hero-hoenir",
    isSuperMinion: true,
    battlecry: {
      type: "grant_deathrattle_draw",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95038,
    name: "Eros's Bow of Enchantment",
    manaCost: 9,
    attack: 6,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Take control of an enemy minion with 4 or less Attack. Give all friendly minions +1/+1 and Lifesteal.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    linkedHeroId: "hero-aphrodite",
    isSuperMinion: true,
    battlecry: {
      type: "mind_control_conditional_buff",
      value: 4,
      requiresTarget: true,
      targetType: BattlecryTargetType.ENEMY_MINION
    },
    collectible: true
  },
  {
    id: 95039,
    name: "Peacock Throne of Olympus",
    manaCost: 11,
    attack: 8,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Silence all enemy minions. Give your other minions +2/+2. Your hero power costs (0) next turn.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    linkedHeroId: "hero-hera",
    isSuperMinion: true,
    battlecry: {
      type: "silence_buff_discount",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95040,
    name: "Arrow of True Love",
    manaCost: 8,
    attack: 6,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Take control of the enemy minion with the highest Attack. It gains +2/+2 and Rush.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    linkedHeroId: "hero-eros",
    isSuperMinion: true,
    battlecry: {
      type: "mind_control_highest",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95041,
    name: "Eternal Hearth Flame",
    manaCost: 10,
    attack: 5,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Battlecry: Restore 15 Health to your hero. At end of each turn, restore 3 Health to all friendly characters.",
    keywords: ["taunt", "battlecry"],
    heroClass: "priest",
    class: "Priest",
    race: "elemental",
    linkedHeroId: "hero-hestia",
    isSuperMinion: true,
    battlecry: {
      type: "heal_hero",
      value: 15,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    triggeredEffect: {
      trigger: "end_of_turn",
      type: "heal_all_friendly",
      value: 3
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // BISHOP - DRUID CLASS (6 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95042,
    name: "Golden Apple Tree",
    manaCost: 10,
    attack: 6,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Battlecry: Give all friendly minions +3 Health and 'Deathrattle: Restore 5 Health to your hero.' Draw 3 cards.",
    keywords: ["taunt", "battlecry"],
    heroClass: "druid",
    class: "Druid",
    linkedHeroId: "hero-idunn",
    isSuperMinion: true,
    battlecry: {
      type: "buff_grant_deathrattle_draw",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95043,
    name: "Askr & Embla",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Summon a 4/4 Askr with Taunt and a 4/4 Embla with Rush. They gain +2/+2 at end of each turn.",
    keywords: ["battlecry"],
    heroClass: "druid",
    class: "Druid",
    linkedHeroId: "hero-ve",
    isSuperMinion: true,
    battlecry: {
      type: "summon_growing_pair",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95044,
    name: "Heart of the World Tree",
    manaCost: 10,
    attack: 7,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Battlecry: Gain +1/+1 for each friendly Treant. Summon three 2/2 Treants with Taunt.",
    keywords: ["taunt", "battlecry"],
    heroClass: "druid",
    class: "Druid",
    linkedHeroId: "hero-fjorgyn",
    isSuperMinion: true,
    battlecry: {
      type: "buff_from_treants_summon",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95045,
    name: "Tears of the Faithful",
    manaCost: 9,
    attack: 6,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Restore 8 Health to your hero. Give all friendly minions 'Deathrattle: Restore 3 Health to your hero.'",
    keywords: ["battlecry"],
    heroClass: "druid",
    class: "Druid",
    linkedHeroId: "hero-sigyn",
    isSuperMinion: true,
    battlecry: {
      type: "heal_grant_deathrattle",
      value: 8,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95046,
    name: "Cornucopia of Abundance",
    manaCost: 10,
    attack: 7,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Fill your hand with random Druid spells. They cost (2) less. Gain 5 Armor.",
    keywords: ["battlecry"],
    heroClass: "druid",
    class: "Druid",
    linkedHeroId: "hero-demeter",
    isSuperMinion: true,
    battlecry: {
      type: "fill_hand_discount_armor",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95047,
    name: "Titan of the Primordial Earth",
    manaCost: 12,
    attack: 10,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Battlecry: Gain +2/+2 for each friendly minion. Summon a 3/3 Elemental for each enemy minion.",
    keywords: ["taunt", "battlecry"],
    heroClass: "druid",
    class: "Druid",
    race: "elemental",
    linkedHeroId: "hero-gaia",
    isSuperMinion: true,
    battlecry: {
      type: "buff_self_summon_from_enemies",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // BISHOP - SHAMAN CLASS (5 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95048,
    name: "Frost Giant's Heart",
    manaCost: 10,
    attack: 8,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Freeze Immunity. Battlecry: Freeze all enemy minions. Summon two 3/3 Frost Totems with Taunt.",
    keywords: ["battlecry"],
    heroClass: "shaman",
    class: "Shaman",
    race: "elemental",
    linkedHeroId: "hero-gerd",
    isSuperMinion: true,
    battlecry: {
      type: "freeze_all_summon",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95049,
    name: "Four Oxen of Zealand",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Summon four 2/2 Oxen with Taunt. When any Ox dies, give your other minions +1/+1.",
    keywords: ["battlecry"],
    heroClass: "shaman",
    class: "Shaman",
    race: "beast",
    linkedHeroId: "hero-gefjon",
    isSuperMinion: true,
    battlecry: {
      type: "summon_with_death_buff",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95050,
    name: "The Golden Net",
    manaCost: 10,
    attack: 7,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Return all enemy minions with 3 or less Attack to their hand. Summon 2/2 Drowned Sailors with Rush for each.",
    keywords: ["battlecry"],
    heroClass: "shaman",
    class: "Shaman",
    linkedHeroId: "hero-ran",
    isSuperMinion: true,
    battlecry: {
      type: "bounce_weak_summon",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95051,
    name: "Skidbladnir, Ship of the Gods",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Windfury. Battlecry: Summon all four basic Totems. Give your Totems +2/+2.",
    keywords: ["windfury", "battlecry"],
    heroClass: "shaman",
    class: "Shaman",
    linkedHeroId: "hero-njord",
    isSuperMinion: true,
    battlecry: {
      type: "summon_all_totems_buff",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95052,
    name: "Trident of the Deep",
    manaCost: 11,
    attack: 9,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal 4 damage to all enemies. Summon a 4/4 Hippocampus with Lifesteal and Rush.",
    keywords: ["battlecry"],
    heroClass: "shaman",
    class: "Shaman",
    race: "elemental",
    linkedHeroId: "hero-poseidon",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_summon",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // KNIGHT - ROGUE CLASS (6 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95053,
    name: "Fenrir, the Unbound Wolf",
    manaCost: 12,
    attack: 10,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Transform into a copy of the strongest enemy minion. Gain +2/+2 and 'Can't be targeted by spells.' Deathrattle: Return to hand.",
    keywords: ["rush", "battlecry", "deathrattle"],
    heroClass: "rogue",
    class: "Rogue",
    race: "beast",
    linkedHeroId: "hero-loki",
    isSuperMinion: true,
    battlecry: {
      type: "copy_strongest_buff",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    deathrattle: {
      type: "return_to_hand"
    },
    collectible: true
  },
  {
    id: 95054,
    name: "Mistletoe Arrow",
    manaCost: 10,
    attack: 8,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Stealth. Battlecry: Deal 8 damage randomly split among enemies. If any die, gain Stealth again.",
    keywords: ["stealth", "battlecry"],
    heroClass: "rogue",
    class: "Rogue",
    linkedHeroId: "hero-hoder",
    isSuperMinion: true,
    battlecry: {
      type: "damage_split_restealth",
      value: 8,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95055,
    name: "Níðhöggr, Corpse-Gnawer",
    manaCost: 11,
    attack: 9,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Poisonous. Battlecry: Destroy all enemy minions with Deathrattle. Gain +1/+1 for each destroyed.",
    keywords: ["poisonous", "battlecry"],
    heroClass: "rogue",
    class: "Rogue",
    race: "dragon",
    linkedHeroId: "hero-gormr",
    isSuperMinion: true,
    battlecry: {
      type: "destroy_deathrattle_buff",
      value: 1,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95056,
    name: "Serpent of the Nine Waves",
    manaCost: 10,
    attack: 7,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Stealth. Battlecry: Copy the lowest-cost card in opponent's hand 3 times. Your copies cost (0).",
    keywords: ["stealth", "battlecry"],
    heroClass: "rogue",
    class: "Rogue",
    race: "beast",
    linkedHeroId: "hero-lirien",
    isSuperMinion: true,
    battlecry: {
      type: "copy_lowest_free",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95057,
    name: "Caduceus, Staff of Messengers",
    manaCost: 9,
    attack: 6,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Return a friendly minion to your hand. It costs (0). Draw 3 cards. Combo: Take an extra turn.",
    keywords: ["rush", "battlecry", "combo"],
    heroClass: "rogue",
    class: "Rogue",
    linkedHeroId: "hero-hermes",
    isSuperMinion: true,
    battlecry: {
      type: "bounce_free_draw",
      value: 3,
      requiresTarget: true,
      targetType: BattlecryTargetType.FRIENDLY_MINION
    },
    collectible: true
  },
  {
    id: 95058,
    name: "Primordial Shadow of Night",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Stealth. Battlecry: Give all friendly minions Stealth. Deal 2 damage to all enemies for each Stealthed minion.",
    keywords: ["stealth", "battlecry"],
    heroClass: "rogue",
    class: "Rogue",
    linkedHeroId: "hero-nyx",
    isSuperMinion: true,
    battlecry: {
      type: "stealth_all_damage",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // KNIGHT - HUNTER CLASS (6 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95059,
    name: "Fenrisúlfr, Winter's Maw",
    manaCost: 11,
    attack: 9,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Freeze all enemy minions. Deal 2 damage to each. Gain +2/+2 for each Frozen minion.",
    keywords: ["rush", "battlecry"],
    heroClass: "hunter",
    class: "Hunter",
    race: "beast",
    linkedHeroId: "hero-skadi",
    isSuperMinion: true,
    battlecry: {
      type: "freeze_damage_buff",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95060,
    name: "Wave Daughters of the Deep",
    manaCost: 10,
    attack: 7,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Summon 3 random Beasts from your deck. Give them +2/+2 and Rush.",
    keywords: ["battlecry"],
    heroClass: "hunter",
    class: "Hunter",
    linkedHeroId: "hero-aegir",
    isSuperMinion: true,
    battlecry: {
      type: "recruit_beasts_buff",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95061,
    name: "Hawk of Thrymheim",
    manaCost: 9,
    attack: 8,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Rush, Windfury. Battlecry: Deal 4 damage to the enemy hero. If they're at 15 or less Health, deal 8 instead.",
    keywords: ["rush", "windfury", "battlecry"],
    heroClass: "hunter",
    class: "Hunter",
    race: "beast",
    linkedHeroId: "hero-fjora",
    isSuperMinion: true,
    battlecry: {
      type: "damage_hero_execute",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95062,
    name: "Bow of Ydalir",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Deal 5 damage. If it kills, repeat on another random enemy until you miss.",
    keywords: ["battlecry"],
    heroClass: "hunter",
    class: "Hunter",
    linkedHeroId: "hero-ullr",
    isSuperMinion: true,
    battlecry: {
      type: "chain_damage",
      value: 5,
      requiresTarget: true,
      targetType: BattlecryTargetType.ANY
    },
    collectible: true
  },
  {
    id: 95063,
    name: "Chariot of the Sun",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Deal 3 damage to all enemies. Your hero is Immune to minion damage this turn.",
    keywords: ["rush", "battlecry"],
    heroClass: "hunter",
    class: "Hunter",
    linkedHeroId: "hero-apollo",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_immune",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95064,
    name: "Huntress of the Moon",
    manaCost: 10,
    attack: 7,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Stealth. Battlecry: Summon a 5/5 Moonlit Wolf with Rush. Both gain +1 Attack for each Beast you control.",
    keywords: ["stealth", "battlecry"],
    heroClass: "hunter",
    class: "Hunter",
    race: "beast",
    linkedHeroId: "hero-artemis",
    isSuperMinion: true,
    battlecry: {
      type: "summon_beast_synergy",
      value: 5,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // KNIGHT - DEMON HUNTER CLASS (2 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95065,
    name: "Fel-Bound Behemoth",
    manaCost: 11,
    attack: 10,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Rush, Lifesteal. Battlecry: Deal 6 damage to all enemies. Draw cards equal to enemy minions killed.",
    keywords: ["rush", "lifesteal", "battlecry"],
    heroClass: "demonhunter",
    class: "DemonHunter",
    race: "demon",
    linkedHeroId: "hero-myrka",
    isSuperMinion: true,
    battlecry: {
      type: "damage_all_draw_on_kill",
      value: 6,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95066,
    name: "Alpha of the Twilight Pack",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Rush. Battlecry: Summon a 3/3 Wolf with Rush for each Beast that died this game (max 5). Give all Wolves +2 Attack.",
    keywords: ["rush", "battlecry"],
    heroClass: "demonhunter",
    class: "DemonHunter",
    race: "beast",
    linkedHeroId: "hero-ylva",
    isSuperMinion: true,
    battlecry: {
      type: "summon_from_dead_beasts",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // JAPANESE HEROES (5 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95067,
    name: "Yomotsu-Shikome",
    manaCost: 10,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy all friendly minions. Summon a 4/4 Shade with Rush for each. Deathrattle: Summon 3 Shades.",
    keywords: ["battlecry", "deathrattle"],
    heroClass: "warlock",
    class: "Warlock",
    linkedHeroId: "hero-izanami",
    isSuperMinion: true,
    battlecry: {
      type: "sacrifice_all_summon",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    deathrattle: {
      type: "summon_multiple",
      summonName: "Shade",
      summonAttack: 4,
      summonHealth: 4,
      count: 3
    },
    collectible: true
  },
  {
    id: 95068,
    name: "Moonlit Palace",
    manaCost: 10,
    attack: 7,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Stealth. Battlecry: Give all friendly minions Stealth and +2 Attack. Draw 2 cards.",
    keywords: ["stealth", "battlecry"],
    heroClass: "rogue",
    class: "Rogue",
    linkedHeroId: "hero-tsukuyomi",
    isSuperMinion: true,
    battlecry: {
      type: "stealth_all_buff_draw",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95069,
    name: "Divine Wind Storm",
    manaCost: 10,
    attack: 8,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Return all enemy minions to their hand. They cost (2) more.",
    keywords: ["battlecry"],
    heroClass: "mage",
    class: "Mage",
    race: "elemental",
    linkedHeroId: "hero-fujin",
    isSuperMinion: true,
    battlecry: {
      type: "bounce_all_increase_cost",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95070,
    name: "Crossroads Guardian",
    manaCost: 11,
    attack: 9,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Taunt, Divine Shield. Battlecry: The next 3 minions your opponent plays cost (3) more.",
    keywords: ["taunt", "divine_shield", "battlecry"],
    heroClass: "paladin",
    class: "Paladin",
    linkedHeroId: "hero-sarutahiko",
    isSuperMinion: true,
    battlecry: {
      type: "loatheb_effect",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95071,
    name: "Spirit of Creation",
    manaCost: 10,
    attack: 7,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Summon all 4 basic Totems with +2/+2. Draw a card for each Totem you control.",
    keywords: ["battlecry"],
    heroClass: "shaman",
    class: "Shaman",
    linkedHeroId: "hero-kamimusubi",
    isSuperMinion: true,
    battlecry: {
      type: "summon_totems_draw",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },

  // ═══════════════════════════════════════════════════════════════
  // EGYPTIAN HEROES (5 Super Minions)
  // ═══════════════════════════════════════════════════════════════
  
  {
    id: 95072,
    name: "Scales of Ma'at",
    manaCost: 11,
    attack: 9,
    health: 9,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy all enemy minions with 4 or less Attack. Gain +2/+2 for each destroyed.",
    keywords: ["battlecry"],
    heroClass: "warlock",
    class: "Warlock",
    linkedHeroId: "hero-ammit",
    isSuperMinion: true,
    battlecry: {
      type: "destroy_weak_buff",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95073,
    name: "Feather of Truth",
    manaCost: 10,
    attack: 6,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Set all minions' Attack and Health to 3. Draw a card for each enemy affected.",
    keywords: ["battlecry"],
    heroClass: "priest",
    class: "Priest",
    linkedHeroId: "hero-maat",
    isSuperMinion: true,
    battlecry: {
      type: "set_all_stats_draw",
      value: 3,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95074,
    name: "Scorpion's Tail",
    manaCost: 9,
    attack: 8,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Stealth, Poisonous. Battlecry: Deal 4 damage randomly split among enemies. Apply Poison to survivors.",
    keywords: ["stealth", "poisonous", "battlecry"],
    heroClass: "rogue",
    class: "Rogue",
    race: "beast",
    linkedHeroId: "hero-serqet",
    isSuperMinion: true,
    battlecry: {
      type: "damage_split_poison",
      value: 4,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95075,
    name: "Scarab of Eternal Dawn",
    manaCost: 10,
    attack: 6,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. Battlecry: Restore all friendly characters to full Health. Give all friendly minions Reborn.",
    keywords: ["taunt", "battlecry"],
    heroClass: "priest",
    class: "Priest",
    race: "beast",
    linkedHeroId: "hero-khepri",
    isSuperMinion: true,
    battlecry: {
      type: "heal_all_grant_reborn",
      value: 99,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  },
  {
    id: 95076,
    name: "Wind of the Void",
    manaCost: 10,
    attack: 7,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Return 2 random enemy minions to their hand. Deal 4 damage to the enemy hero for each.",
    keywords: ["battlecry"],
    heroClass: "mage",
    class: "Mage",
    race: "elemental",
    linkedHeroId: "hero-shu",
    isSuperMinion: true,
    battlecry: {
      type: "bounce_random_damage_hero",
      value: 2,
      requiresTarget: false,
      targetType: BattlecryTargetType.NONE
    },
    collectible: true
  }
];

export default heroSuperMinions;
