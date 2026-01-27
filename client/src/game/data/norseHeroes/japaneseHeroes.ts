/**
 * japaneseHeroes.ts
 * 
 * Definitions for Japanese (Shinto) Heroes in Ragnarok Poker.
 * These heroes have unique mechanics not found in Norse/Greek heroes.
 */

import { NorseHero } from '../../types/NorseTypes';

// ==================== JAPANESE HEROES (5 Heroes) ====================

export const JAPANESE_HEROES: Record<string, NorseHero> = {

  // ==================== 1. IZANAMI - Sacrifice Mechanic ====================
  'hero-izanami': {
    id: 'hero-izanami',
    name: 'Izanami',
    title: 'Ruler of Yomi',
    element: 'dark',
    weakness: 'grass',
    startingHealth: 100,
    description: 'Goddess of the underworld who commands the dead with dark power.',
    lore: 'Once a creator goddess, Izanami now rules Yomi, the land of the dead. Her embrace transforms the living into shades that serve her eternally in the underworld.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'warlock',
    heroPower: {
      id: 'izanami-power',
      name: "Yomi's Call",
      description: 'Destroy a friendly minion and summon a 2/2 Shade in its place.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'sacrifice_summon',
      value: 2,
      summonData: {
        name: 'Shade',
        attack: 2,
        health: 2,
        keywords: []
      }
    },
    weaponUpgrade: {
      id: 90040,
      name: 'Gates of Yomi',
      heroId: 'hero-izanami',
      manaCost: 5,
      description: 'Destroy all friendly minions and summon 3/3 Shades in their place. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'sacrifice_all_summon',
        value: 3,
        description: 'Destroy all friendly minions and summon 3/3 Shades in their place.'
      },
      upgradedPowerId: 'izanami-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'izanami-power-upgraded',
      name: "Yomi's Call+",
      description: 'Destroy a friendly minion and summon a 3/3 Shade in its place.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'sacrifice_summon',
      value: 3,
      summonData: {
        name: 'Shade',
        attack: 3,
        health: 3,
        keywords: []
      },
      isUpgraded: true,
      baseHeroPowerId: 'izanami-power'
    },
    passive: {
      id: 'izanami-passive',
      name: "Underworld's Embrace",
      description: 'When a friendly Dark minion dies, give your other minions +1 Attack.',
      trigger: 'on_friendly_death',
      condition: { minionElement: 'dark' },
      effectType: 'buff_attack',
      value: 1
    }
  },

  // ==================== 2. TSUKUYOMI - Stealth Granting ====================
  'hero-tsukuyomi': {
    id: 'hero-tsukuyomi',
    name: 'Tsukuyomi',
    title: 'Moon God',
    element: 'dark',
    weakness: 'light',
    startingHealth: 100,
    description: 'The moon god who rules the night with mysterious lunar power.',
    lore: 'Brother of Amaterasu the sun goddess, Tsukuyomi governs the realm of night. His moonlight grants invisibility to those he favors, cloaking them from mortal sight.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'rogue',
    heroPower: {
      id: 'tsukuyomi-power',
      name: 'Lunar Dominion',
      description: 'Give a friendly minion Stealth until your next turn.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'grant_keyword',
      grantKeyword: 'stealth',
      duration: 'until_next_turn'
    },
    weaponUpgrade: {
      id: 90041,
      name: 'Mirror of Tsukuyomi',
      heroId: 'hero-tsukuyomi',
      manaCost: 5,
      description: 'Give all friendly minions Stealth and +1 Attack. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'stealth_and_buff_all',
        value: 1,
        description: 'Give all friendly minions Stealth and +1 Attack.'
      },
      upgradedPowerId: 'tsukuyomi-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'tsukuyomi-power-upgraded',
      name: 'Lunar Dominion+',
      description: 'Give a friendly minion Stealth and +2 Attack until your next turn.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'grant_keyword',
      grantKeyword: 'stealth',
      value: 2,
      duration: 'until_next_turn',
      isUpgraded: true,
      baseHeroPowerId: 'tsukuyomi-power'
    },
    passive: {
      id: 'tsukuyomi-passive',
      name: "Night's Embrace",
      description: 'Dark minions have +1 Health.',
      trigger: 'always',
      condition: { minionElement: 'dark' },
      effectType: 'buff_health',
      value: 1
    }
  },

  // ==================== 3. FUJIN - Bounce Mechanic ====================
  'hero-fujin': {
    id: 'hero-fujin',
    name: 'Fūjin',
    title: 'God of Wind',
    element: 'electric',
    weakness: 'grass',
    startingHealth: 100,
    description: 'The wind god who wields storms with electric speed.',
    lore: 'Carrying his legendary bag of winds, Fūjin commands every gale and breeze. His hurricanes can sweep enemies from the battlefield, returning them whence they came.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'mage',
    heroPower: {
      id: 'fujin-power',
      name: 'Windstorm Blitz',
      description: 'Return an enemy minion to its owner\'s hand.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'bounce',
      value: 1
    },
    weaponUpgrade: {
      id: 90042,
      name: 'Bag of Winds',
      heroId: 'hero-fujin',
      manaCost: 5,
      description: 'Return all enemy minions to their owner\'s hand. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'bounce_all',
        description: 'Return all enemy minions to their owner\'s hand.'
      },
      upgradedPowerId: 'fujin-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'fujin-power-upgraded',
      name: 'Windstorm Blitz+',
      description: 'Return an enemy minion to its owner\'s hand and deal 2 damage to it.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'bounce_damage',
      value: 2,
      isUpgraded: true,
      baseHeroPowerId: 'fujin-power'
    },
    passive: {
      id: 'fujin-passive',
      name: 'Hurricane Speed',
      description: 'Electric minions have +1 Attack.',
      trigger: 'always',
      condition: { minionElement: 'electric' },
      effectType: 'buff_attack',
      value: 1
    }
  },

  // ==================== 4. SARUTAHIKO - Taunt Granting ====================
  'hero-sarutahiko': {
    id: 'hero-sarutahiko',
    name: 'Sarutahiko',
    title: 'God of Guidance',
    element: 'light',
    weakness: 'dark',
    startingHealth: 100,
    description: 'The earthly kami who guides travelers and guards crossroads.',
    lore: 'With his towering presence and long nose, Sarutahiko stands at the crossroads between heaven and earth. He teaches warriors to stand firm as guardians against all threats.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'paladin',
    heroPower: {
      id: 'sarutahiko-power',
      name: 'Heavenly Guidance',
      description: 'Give a friendly minion +1 Attack and Taunt.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 1,
      grantKeyword: 'taunt'
    },
    weaponUpgrade: {
      id: 90043,
      name: 'Staff of Sarutahiko',
      heroId: 'hero-sarutahiko',
      manaCost: 5,
      description: 'Give all friendly minions +2 Attack and Taunt. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'buff_and_taunt_all',
        value: 2,
        description: 'Give all friendly minions +2 Attack and Taunt.'
      },
      upgradedPowerId: 'sarutahiko-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'sarutahiko-power-upgraded',
      name: 'Heavenly Guidance+',
      description: 'Give a friendly minion +2 Attack and Taunt.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 2,
      grantKeyword: 'taunt',
      isUpgraded: true,
      baseHeroPowerId: 'sarutahiko-power'
    },
    passive: {
      id: 'sarutahiko-passive',
      name: 'Crossroads Guardian',
      description: 'Light minions have +1 Health.',
      trigger: 'always',
      condition: { minionElement: 'light' },
      effectType: 'buff_health',
      value: 1
    }
  },

  // ==================== 5. KAMIMUSUBI - Heal + Buff Combo ====================
  'hero-kamimusubi': {
    id: 'hero-kamimusubi',
    name: 'Kamimusubi',
    title: 'Divine Creator',
    element: 'water',
    weakness: 'electric',
    startingHealth: 100,
    description: 'The divine creator who nurtures with water\'s flow.',
    lore: 'One of the first kami to emerge at creation, Kamimusubi embodies the nurturing power of water. Her tides heal wounds while empowering those she touches with renewed vigor.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'shaman',
    heroPower: {
      id: 'kamimusubi-power',
      name: 'Divine Tide',
      description: 'Restore 2 Health to a friendly minion and give it +1 Attack this turn.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'heal_and_buff',
      value: 2,
      secondaryValue: 1,
      duration: 'this_turn'
    },
    weaponUpgrade: {
      id: 90044,
      name: 'Wave of Creation',
      heroId: 'hero-kamimusubi',
      manaCost: 5,
      description: 'Restore 4 Health to all friendly minions and give them +2 Attack this turn. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'heal_and_buff_all',
        value: 4,
        secondaryValue: 2,
        description: 'Restore 4 Health to all friendly minions and give them +2 Attack this turn.'
      },
      upgradedPowerId: 'kamimusubi-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'kamimusubi-power-upgraded',
      name: 'Divine Tide+',
      description: 'Restore 3 Health to a friendly minion and give it +2 Attack this turn.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'heal_and_buff',
      value: 3,
      secondaryValue: 2,
      duration: 'this_turn',
      isUpgraded: true,
      baseHeroPowerId: 'kamimusubi-power'
    },
    passive: {
      id: 'kamimusubi-passive',
      name: 'Flow of Life',
      description: 'When a friendly minion is healed, it gains +1 Health permanently.',
      trigger: 'on_heal',
      condition: { targetType: 'friendly_minion' },
      effectType: 'buff_health',
      value: 1
    }
  }
};

// Helper function to get Japanese hero by ID
export function getJapaneseHeroById(id: string): NorseHero | undefined {
  return JAPANESE_HEROES[id];
}

// Get all Japanese heroes as an array
export function getAllJapaneseHeroes(): NorseHero[] {
  return Object.values(JAPANESE_HEROES);
}
