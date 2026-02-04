/**
 * egyptianHeroes.ts
 * 
 * Definitions for Egyptian Heroes in Ragnarok Poker.
 * These heroes have unique mechanics not found in Norse/Greek/Japanese heroes.
 */

import { NorseHero } from '../../types/NorseTypes';

// ==================== NORSE/GREEK HEROES (5 Heroes) ====================

export const EGYPTIAN_HEROES: Record<string, NorseHero> = {

  // ==================== 1. HECATE - Conditional Destruction ====================
  'hero-ammit': {
    id: 'hero-ammit',
    name: 'Hecate',
    title: 'Goddess of Magic',
    element: 'dark',
    weakness: 'light',
    startingHealth: 100,
    description: 'The Greek goddess of magic, crossroads, and the restless dead.',
    lore: 'Hecate stands at the crossroads between worlds, wielding power over magic and spirits. She guides lost souls and punishes the wicked with her spectral torches.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'warlock',
    heroPower: {
      id: 'ammit-power',
      name: 'Claim Soul',
      description: 'Destroy an enemy minion with 2 or less Attack.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'conditional_destroy',
      condition: { maxAttack: 2 }
    },
    weaponUpgrade: {
      id: 90050,
      name: 'Torches of Hecate',
      heroId: 'hero-ammit',
      manaCost: 5,
      description: 'Destroy all enemy minions with 3 or less Attack. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'conditional_destroy_all',
        condition: { maxAttack: 3 },
        description: 'Destroy all enemy minions with 3 or less Attack.'
      },
      upgradedPowerId: 'ammit-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'ammit-power-upgraded',
      name: 'Claim Soul+',
      description: 'Destroy an enemy minion with 3 or less Attack.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'conditional_destroy',
      condition: { maxAttack: 3 },
      isUpgraded: true,
      baseHeroPowerId: 'ammit-power'
    },
    passive: {
      id: 'ammit-passive',
      name: "Crossroads' Curse",
      description: 'Restore 1 health to your hero when an enemy minion dies.',
      trigger: 'on_enemy_death',
      effectType: 'heal_hero',
      value: 1
    }
  },

  // ==================== 2. SKADI - Stat Transformation ====================
  'hero-maat': {
    id: 'hero-maat',
    name: 'Skadi',
    title: 'Goddess of Winter',
    element: 'light',
    weakness: 'dark',
    startingHealth: 100,
    description: 'The Norse goddess of winter, mountains, and bowhunting.',
    lore: 'Skadi dwells in the highest peaks, where the snow never melts. She is a fierce huntress who brought justice to the gods, securing her place among the Aesir with her icy resolve.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'priest',
    heroPower: {
      id: 'maat-power',
      name: 'Icy Resolve',
      description: 'Set a minion\'s Attack and Health to 2.',
      cost: 2,
      targetType: 'any_minion',
      effectType: 'set_stats',
      value: 2
    },
    weaponUpgrade: {
      id: 90051,
      name: 'Spear of the North',
      heroId: 'hero-maat',
      manaCost: 5,
      description: 'Set all enemy minions\' Attack and Health to 2. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'set_stats_all_enemies',
        value: 2,
        description: 'Set all enemy minions\' Attack and Health to 2.'
      },
      upgradedPowerId: 'maat-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'maat-power-upgraded',
      name: 'Icy Resolve+',
      description: 'Set a minion\'s Attack and Health to 3.',
      cost: 2,
      targetType: 'any_minion',
      effectType: 'set_stats',
      value: 3,
      isUpgraded: true,
      baseHeroPowerId: 'maat-power'
    },
    passive: {
      id: 'maat-passive',
      name: 'Glacial Chill',
      description: 'At the end of your turn, if you have an even number of minions, draw a card.',
      trigger: 'end_of_turn',
      condition: { evenMinions: true },
      effectType: 'draw_card',
      value: 1
    }
  },

  // ==================== 3. VIDAR - Poison Application ====================
  'hero-serqet': {
    id: 'hero-serqet',
    name: 'Vidar',
    title: 'The Silent God',
    element: 'dark',
    weakness: 'light',
    startingHealth: 100,
    description: 'The Norse god of silence and vengeance, known for his immense strength.',
    lore: 'Vidar is the son of Odin and the giantess Gríðr. He is destined to avenge his father during Ragnarok by slaying the wolf Fenrir. His silence hides a strength that rivals even Thor, and his vengeance is as certain as the turning of the ages.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'rogue',
    heroPower: {
      id: 'serqet-power',
      name: 'Silent Strike',
      description: 'Deal 1 damage to an enemy minion and apply Poison (destroy it if damaged again this turn).',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_and_poison',
      value: 1
    },
    weaponUpgrade: {
      id: 90052,
      name: 'Iron Shoe of Vidar',
      heroId: 'hero-serqet',
      manaCost: 5,
      description: 'Deal 2 damage to all enemy minions and apply Poison. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'aoe_damage_poison',
        value: 2,
        description: 'Deal 2 damage to all enemy minions and apply Poison.'
      },
      upgradedPowerId: 'serqet-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'serqet-power-upgraded',
      name: 'Silent Strike+',
      description: 'Deal 2 damage to an enemy minion and apply Poison.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_and_poison',
      value: 2,
      isUpgraded: true,
      baseHeroPowerId: 'serqet-power'
    },
    passive: {
      id: 'serqet-passive',
      name: "Silent Vengeance",
      description: 'Restore 1 health to your hero when an enemy minion has Poison applied.',
      trigger: 'on_poison_applied',
      effectType: 'heal_hero',
      value: 1
    }
  },

  // ==================== 4. HELIOS - Dawn Regeneration ====================
  'hero-khepri': {
    id: 'hero-khepri',
    name: 'Helios',
    title: 'Titan of the Sun',
    element: 'light',
    weakness: 'dark',
    startingHealth: 100,
    description: 'The Greek Titan who drives the sun chariot across the sky each day.',
    lore: 'Helios sees all from his golden chariot. Each dawn he rises from the east, bringing light and warmth to the world, and each night he descends into the western sea.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'priest',
    heroPower: {
      id: 'khepri-power',
      name: 'Divine Radiance',
      description: 'Restore 2 health to a friendly minion.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'heal',
      value: 2
    },
    weaponUpgrade: {
      id: 90053,
      name: 'Chariot of the Sun',
      heroId: 'hero-khepri',
      manaCost: 5,
      description: 'Restore 4 health to all friendly minions. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'heal_all_friendly',
        value: 4,
        description: 'Restore 4 health to all friendly minions.'
      },
      upgradedPowerId: 'khepri-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'khepri-power-upgraded',
      name: 'Divine Radiance+',
      description: 'Restore 3 health to a friendly minion.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'heal',
      value: 3,
      isUpgraded: true,
      baseHeroPowerId: 'khepri-power'
    },
    passive: {
      id: 'khepri-passive',
      name: 'Solar Blessing',
      description: 'At the start of your turn, restore 1 health to all friendly minions.',
      trigger: 'start_of_turn',
      effectType: 'heal_all_friendly',
      value: 1
    }
  },

  // ==================== 5. NJORD - Bounce Mechanic ====================
  'hero-shu': {
    id: 'hero-shu',
    name: 'Njord',
    title: 'God of Sea and Wind',
    element: 'electric',
    weakness: 'grass',
    startingHealth: 100,
    description: 'The Norse god of the sea, seafaring, and the winds.',
    lore: 'Njord is the patriarch of the Vanir, bringing prosperity and calm waters. He stills the tempests and guides the fleets of those who honor the rhythms of the ocean.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'mage',
    heroPower: {
      id: 'shu-power',
      name: 'Oceanic Blast',
      description: 'Return an enemy minion to its owner\'s hand.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'bounce_to_hand'
    },
    weaponUpgrade: {
      id: 90054,
      name: 'Trident of Tides',
      heroId: 'hero-shu',
      manaCost: 5,
      description: 'Return all enemy minions to their owner\'s hand. Permanently upgrade your hero power.',
      immediateEffect: {
        type: 'bounce_all_enemies',
        description: 'Return all enemy minions to their owner\'s hand.'
      },
      upgradedPowerId: 'shu-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'shu-power-upgraded',
      name: 'Oceanic Blast+',
      description: 'Return an enemy minion to its owner\'s hand and deal 2 damage to their hero.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'bounce_and_damage_hero',
      value: 2,
      isUpgraded: true,
      baseHeroPowerId: 'shu-power'
    },
    passive: {
      id: 'shu-passive',
      name: "Tidecaller's Aura",
      description: 'Your Electric minions have +1 Attack.',
      trigger: 'passive',
      condition: { minionElement: 'electric' },
      effectType: 'buff_attack',
      value: 1
    }
  }
};

// Export hero count for validation
export const EGYPTIAN_HERO_COUNT = Object.keys(EGYPTIAN_HEROES).length;

// Helper function to get Egyptian hero by ID
export function getEgyptianHeroById(id: string): NorseHero | undefined {
  return EGYPTIAN_HEROES[id];
}

// Get all Egyptian heroes as an array
export function getAllEgyptianHeroes(): NorseHero[] {
  return Object.values(EGYPTIAN_HEROES);
}
