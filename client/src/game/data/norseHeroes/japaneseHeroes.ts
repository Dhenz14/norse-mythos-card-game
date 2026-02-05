/**
 * japaneseHeroes.ts
 * 
 * Definitions for Japanese (Shinto) Heroes in Ragnarok Poker.
 * These heroes have unique mechanics not found in Norse/Greek heroes.
 */

import { NorseHero } from '../../types/NorseTypes';

// ==================== NORSE/GREEK HEROES (5 Heroes) ====================

export const JAPANESE_HEROES: Record<string, NorseHero> = {

  // ==================== 1. NYX - Sacrifice Mechanic ====================
  'hero-izanami': {
    id: 'hero-izanami',
    name: 'Nyx',
    title: 'Goddess of Night',
    element: 'dark',
    weakness: 'grass',
    startingHealth: 100,
    description: 'The Greek primordial goddess of the night, feared even by Zeus.',
    lore: 'Nyx is one of the first beings to emerge from Chaos. She dwells in Tartarus, and even the king of the gods avoids her wrath, for her power predates Olympus itself.',
    gender: 'female',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'warlock',
    heroPower: {
      id: 'izanami-power',
      name: "Underworld's Call",
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
      name: 'Veil of Darkness',
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
      name: "Underworld's Call+",
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
      name: "Night's Embrace",
      description: 'When a friendly Dark minion dies, give your other minions +1 Attack.',
      trigger: 'on_friendly_death',
      condition: { minionElement: 'dark' },
      effectType: 'buff_attack',
      value: 1
    }
  },

  // ==================== 2. SELENE - Stealth Granting ====================
  'hero-tsukuyomi': {
    id: 'hero-tsukuyomi',
    name: 'Selene',
    title: 'Goddess of the Moon',
    element: 'dark',
    weakness: 'light',
    startingHealth: 100,
    description: 'The Greek Titaness who personifies the moon and drives her silver chariot across the night sky.',
    lore: 'Selene rises each night to illuminate the world with her gentle silver light. Her moonbeams grant concealment to those who walk in shadow.',
    gender: 'female',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'rogue',
    heroPower: {
      id: 'tsukuyomi-power',
      name: 'Lunar Veil',
      description: 'Give a friendly minion Stealth until your next turn.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'grant_keyword',
      grantKeyword: 'stealth',
      duration: 'next_turn'
    },
    weaponUpgrade: {
      id: 90041,
      name: 'Silver Chariot',
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
      name: 'Lunar Veil+',
      description: 'Give a friendly minion Stealth and +2 Attack until your next turn.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'grant_keyword',
      grantKeyword: 'stealth',
      value: 2,
      duration: 'next_turn',
      isUpgraded: true,
      baseHeroPowerId: 'tsukuyomi-power'
    },
    passive: {
      id: 'tsukuyomi-passive',
      name: "Selene's Shroud",
      description: 'Dark minions have +1 Health.',
      trigger: 'always',
      condition: { minionElement: 'dark' },
      effectType: 'buff_health',
      value: 1
    }
  },

  // ==================== 3. MANI - Bounce Mechanic ====================
  'hero-fujin': {
    id: 'hero-fujin',
    name: 'Mani',
    title: 'God of the Moon',
    element: 'electric',
    weakness: 'grass',
    startingHealth: 100,
    description: 'The Norse personification of the moon who drives the lunar chariot.',
    lore: 'Mani guides the moon across the sky, pursued eternally by the wolf Hati. His silvery light reveals hidden paths and grants his followers the ability to move unseen through the night.',
    gender: 'male',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'mage',
    heroPower: {
      id: 'fujin-power',
      name: 'Lunar Pulse',
      description: 'Return an enemy minion to its owner\'s hand.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'bounce_to_hand'
    },
    weaponUpgrade: {
      id: 90042,
      name: 'Moonlight Chariot',
      heroId: 'hero-fujin',
      manaCost: 5,
      description: 'Return all enemy minions to their owner\'s hand. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'bounce_all_enemies',
        description: 'Return all enemy minions to their owner\'s hand.'
      },
      upgradedPowerId: 'fujin-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'fujin-power-upgraded',
      name: 'Lunar Pulse+',
      description: 'Return an enemy minion to its owner\'s hand and deal 2 damage to their hero.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'bounce_and_damage_hero',
      value: 2,
      isUpgraded: true,
      baseHeroPowerId: 'fujin-power'
    },
    passive: {
      id: 'fujin-passive',
      name: 'Lunar Shadow',
      description: 'Electric minions have +1 Attack.',
      trigger: 'always',
      condition: { minionElement: 'electric' },
      effectType: 'buff_attack',
      value: 1
    }
  },

  // ==================== 4. HERMES - Taunt Granting ====================
  'hero-sarutahiko': {
    id: 'hero-sarutahiko',
    name: 'Hermes',
    title: 'Messenger of the Gods',
    element: 'light',
    weakness: 'dark',
    startingHealth: 100,
    description: 'The Greek god of trade, thieves, and travelers, known for his speed.',
    lore: 'Hermes is the herald of the gods, wearing winged sandals that grant him unparalleled swiftness. He protects travelers and guides souls to the afterlife with his caduceus.',
    gender: 'male',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'paladin',
    heroPower: {
      id: 'sarutahiko-power',
      name: 'Divine Swiftness',
      description: 'Give a friendly minion +1 Attack and Taunt.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 1,
      grantKeyword: 'taunt'
    },
    weaponUpgrade: {
      id: 90043,
      name: 'Caduceus of Speed',
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
      name: 'Divine Swiftness+',
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
      name: 'Divine Messenger',
      description: 'Light minions have +1 Health.',
      trigger: 'always',
      condition: { minionElement: 'light' },
      effectType: 'buff_health',
      value: 1
    }
  },

  // ==================== 5. BALDUR - Heal + Buff Combo ====================
  'hero-kamimusubi': {
    id: 'hero-kamimusubi',
    name: 'Baldur',
    title: 'The Shining God',
    element: 'water',
    weakness: 'electric',
    startingHealth: 100,
    description: 'The Norse god of light, joy, and purity.',
    lore: 'Baldur the Good, the second son of Odin. He is so fair and bright that light shines from him, and he is loved by all living things for his kindness and wisdom.',
    gender: 'male',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'shaman',
    heroPower: {
      id: 'kamimusubi-power',
      name: 'Shining Touch',
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
      name: 'Light of Baldur',
      heroId: 'hero-kamimusubi',
      manaCost: 5,
      description: 'Restore 4 Health to all friendly minions and give them +2 Attack this turn. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'heal_and_buff_all',
        value: 4,
        description: 'Restore 4 Health to all friendly minions and give them +2 Attack this turn.'
      },
      upgradedPowerId: 'kamimusubi-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'kamimusubi-power-upgraded',
      name: 'Shining Touch+',
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
      name: 'Shining Grace',
      description: 'When a friendly minion is healed, it gains +1 Health permanently.',
      trigger: 'on_heal',
      condition: { targetType: 'friendly' },
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
