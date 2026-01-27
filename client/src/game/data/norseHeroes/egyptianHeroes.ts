/**
 * egyptianHeroes.ts
 * 
 * Definitions for Egyptian Heroes in Ragnarok Poker.
 * These heroes have unique mechanics not found in Norse/Greek/Japanese heroes.
 */

import { NorseHero } from '../../types/NorseTypes';

// ==================== EGYPTIAN HEROES (5 Heroes) ====================

export const EGYPTIAN_HEROES: Record<string, NorseHero> = {

  // ==================== 1. AMMIT - Conditional Destruction ====================
  'hero-ammit': {
    id: 'hero-ammit',
    name: 'Ammit',
    title: 'Devourer of Souls',
    element: 'dark',
    weakness: 'light',
    startingHealth: 100,
    description: 'The fearsome devourer who consumes unworthy souls in the Hall of Judgment.',
    lore: 'Part crocodile, part lion, part hippopotamus—Ammit waits in the Hall of Two Truths. Those whose hearts outweigh the feather of Ma\'at are devoured, their souls erased from existence forever.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'warlock',
    heroPower: {
      id: 'ammit-power',
      name: 'Devour Soul',
      description: 'Destroy an enemy minion with 2 or less Attack.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'conditional_destroy',
      condition: { maxAttack: 2 }
    },
    weaponUpgrade: {
      id: 90050,
      name: 'Jaws of Ammit',
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
      name: 'Devour Soul+',
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
      name: "Judgment's Hunger",
      description: 'Restore 1 health to your hero when an enemy minion dies.',
      trigger: 'on_enemy_death',
      effectType: 'heal_hero',
      value: 1
    }
  },

  // ==================== 2. MA'AT - Stat Transformation ====================
  'hero-maat': {
    id: 'hero-maat',
    name: "Ma'at",
    title: 'Goddess of Balance',
    element: 'light',
    weakness: 'dark',
    startingHealth: 100,
    description: 'The goddess of truth and balance who weighs all souls against her sacred feather.',
    lore: 'Ma\'at embodies cosmic order and universal balance. Her feather is the ultimate measure—no deception can hide from her scales, and all things must find equilibrium before her.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'priest',
    heroPower: {
      id: 'maat-power',
      name: 'Balance Scales',
      description: 'Set a minion\'s Attack and Health to 2.',
      cost: 2,
      targetType: 'any_minion',
      effectType: 'set_stats',
      value: 2
    },
    weaponUpgrade: {
      id: 90051,
      name: 'Feather of Ma\'at',
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
      name: 'Balance Scales+',
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
      name: 'Cosmic Harmony',
      description: 'At the end of your turn, if you have an even number of minions, draw a card.',
      trigger: 'end_of_turn',
      condition: { evenMinions: true },
      effectType: 'draw_card',
      value: 1
    }
  },

  // ==================== 3. SERQET - Poison Application ====================
  'hero-serqet': {
    id: 'hero-serqet',
    name: 'Serqet',
    title: 'Scorpion Goddess',
    element: 'dark',
    weakness: 'light',
    startingHealth: 100,
    description: 'The scorpion goddess whose venom both kills and heals.',
    lore: 'Serqet commands all venomous creatures. Pharaohs sought her protection against scorpions and snakes, for only she could cure what her creatures inflicted upon the unwary.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'rogue',
    heroPower: {
      id: 'serqet-power',
      name: 'Venomous Sting',
      description: 'Deal 1 damage to an enemy minion and apply Poison (destroy it if damaged again this turn).',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_and_poison',
      value: 1
    },
    weaponUpgrade: {
      id: 90052,
      name: 'Scorpion\'s Tail',
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
      name: 'Venomous Sting+',
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
      name: 'Healing Venom',
      description: 'Restore 1 health to your hero when an enemy minion has Poison applied.',
      trigger: 'on_poison_applied',
      effectType: 'heal_hero',
      value: 1
    }
  },

  // ==================== 4. KHEPRI - Dawn Regeneration ====================
  'hero-khepri': {
    id: 'hero-khepri',
    name: 'Khepri',
    title: 'Scarab of Dawn',
    element: 'light',
    weakness: 'dark',
    startingHealth: 100,
    description: 'The scarab god who rolls the sun across the sky each morning.',
    lore: 'Khepri represents the rising sun and rebirth. Each dawn, he pushes Ra\'s solar barque from the underworld, bringing light and renewal to all the world above.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'priest',
    heroPower: {
      id: 'khepri-power',
      name: 'Dawn Renewal',
      description: 'Restore 2 health to a friendly minion.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'heal',
      value: 2
    },
    weaponUpgrade: {
      id: 90053,
      name: 'Scarab of Renewal',
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
      name: 'Dawn Renewal+',
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
      name: 'Morning Sun',
      description: 'At the start of your turn, restore 1 health to all friendly minions.',
      trigger: 'start_of_turn',
      effectType: 'heal_all_friendly',
      value: 1
    }
  },

  // ==================== 5. SHU - Bounce Mechanic ====================
  'hero-shu': {
    id: 'hero-shu',
    name: 'Shu',
    title: 'God of Air',
    element: 'electric',
    weakness: 'grass',
    startingHealth: 100,
    description: 'The god of air who separates heaven from earth with his breath.',
    lore: 'Shu holds Nut the sky above Geb the earth, maintaining the cosmic order. His winds are irresistible—nothing can stand before the primordial breath that shaped creation.',
    hasSpells: true,
    fixedCardIds: [],
    heroClass: 'mage',
    heroPower: {
      id: 'shu-power',
      name: 'Gale Force',
      description: 'Return an enemy minion to its owner\'s hand.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'bounce_to_hand'
    },
    weaponUpgrade: {
      id: 90054,
      name: 'Breath of Shu',
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
      name: 'Gale Force+',
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
      name: "Wind's Swiftness",
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
