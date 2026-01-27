/**
 * additionalHeroes.ts
 * 
 * Definitions for 14 additional Norse Heroes in Ragnarok Poker.
 * These are Tier 2 heroes with simplified power sets.
 */

import { NorseHero } from '../../types/NorseTypes';

// ==================== ADDITIONAL HEROES (14 Heroes) ====================

export const ADDITIONAL_HEROES: Record<string, NorseHero> = {

  // ==================== 23. THORGRIM ====================
  'hero-thorgrim': {
    id: 'hero-thorgrim',
    name: 'Thorgrim',
    title: 'Thunder Warrior',
    element: 'electric',
    weakness: 'grass',
    startingHealth: 100,
    description: 'A mortal champion blessed by Thor.',
    lore: 'A warrior who stood against a lightning bolt to prove his worth. Thor\'s thunder now courses through his veins, marking him as the storm\'s chosen champion.',
    hasSpells: true,
    fixedCardIds: [5309], // Frey's Thunder - lightning legendary
    heroPower: {
      id: 'thorgrim-power',
      name: 'Lightning Strike',
      description: 'Deal 1 damage and Freeze target.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 1,
      grantKeyword: 'frozen'
    },
    weaponUpgrade: {
      id: 90023,
      name: 'Storm Hammer',
      heroId: 'hero-thorgrim',
      manaCost: 5,
      description: 'Deal 2 damage and Freeze all enemies. Permanently upgrade your hero power.',
      immediateEffect: { type: 'damage_and_freeze_all', value: 2, description: 'Deal 2 damage and Freeze all enemies.' },
      upgradedPowerId: 'thorgrim-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'thorgrim-power-upgraded',
      name: 'Lightning Strike+',
      description: 'Deal 2 damage and Freeze target.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 2,
      grantKeyword: 'frozen',
      isUpgraded: true,
      baseHeroPowerId: 'thorgrim-power'
    },
    passive: {
      id: 'thorgrim-passive',
      name: 'Static Field',
      description: 'Electric minions deal +1 damage to Frozen enemies.',
      trigger: 'on_minion_attack',
      condition: { minionElement: 'electric', requiresFrozen: true },
      effectType: 'buff_damage',
      value: 1
    }
  },

  // ==================== 24. GEFJON ====================
  'hero-gefjon': {
    id: 'hero-gefjon',
    name: 'Gefjon',
    title: 'Goddess of Plowing',
    element: 'grass',
    weakness: 'fire',
    startingHealth: 100,
    description: 'The goddess who plowed Zealand from Sweden.',
    lore: 'The tireless goddess who carved the island of Zealand from Swedish soil in a single night. Her divine oxen—her transformed sons—still guard the fertile lands she created.',
    hasSpells: true,
    fixedCardIds: [6222], // Elven Hart - earth/grass legendary
    heroPower: {
      id: 'gefjon-power',
      name: "Furrow's Gift",
      description: 'Summon a 0/3 Totem with Taunt and Deathrattle: Give a random friendly +2/+2.',
      cost: 2,
      targetType: 'none',
      effectType: 'summon',
      summonData: { name: 'Harvest Totem', attack: 0, health: 3, keywords: ['taunt'] }
    },
    weaponUpgrade: {
      id: 90024,
      name: 'Plow of Ages',
      heroId: 'hero-gefjon',
      manaCost: 5,
      description: 'Summon two 0/4 Totems with Taunt. Permanently upgrade your hero power.',
      immediateEffect: { type: 'summon_multiple', value: 2, description: 'Summon two 0/4 Totems with Taunt.' },
      upgradedPowerId: 'gefjon-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'gefjon-power-upgraded',
      name: "Furrow's Gift+",
      description: 'Summon a 0/4 Totem with Taunt and Deathrattle: Give a random friendly +3/+3.',
      cost: 2,
      targetType: 'none',
      effectType: 'summon',
      summonData: { name: 'Harvest Totem', attack: 0, health: 4, keywords: ['taunt'] },
      isUpgraded: true,
      baseHeroPowerId: 'gefjon-power'
    },
    passive: {
      id: 'gefjon-passive',
      name: 'Fertile Ground',
      description: 'Grass minions have +1 Health.',
      trigger: 'always',
      condition: { minionElement: 'grass' },
      effectType: 'buff_health',
      value: 1
    }
  },

  // ==================== 25. LOGI ====================
  'hero-logi': {
    id: 'hero-logi',
    name: 'Logi',
    title: 'Fire Giant',
    element: 'fire',
    weakness: 'water',
    startingHealth: 100,
    description: 'The personification of fire itself.',
    lore: 'The consuming flame given form, who once devoured an entire feast faster than Loki could eat. He is fire\'s hunger incarnate, never satisfied, always spreading.',
    hasSpells: true,
    fixedCardIds: [4352], // Flameheart Behemoth
    heroPower: {
      id: 'logi-power',
      name: 'Blazing Spark',
      description: 'Deal 2 damage to a random enemy minion.',
      cost: 2,
      targetType: 'random_enemy',
      effectType: 'damage_random',
      value: 2
    },
    weaponUpgrade: {
      id: 90025,
      name: 'Flame of Consumption',
      heroId: 'hero-logi',
      manaCost: 5,
      description: 'Deal 3 damage to all enemy minions. Permanently upgrade your hero power.',
      immediateEffect: { type: 'damage_aoe', value: 3, description: 'Deal 3 damage to all enemy minions.' },
      upgradedPowerId: 'logi-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'logi-power-upgraded',
      name: 'Blazing Spark+',
      description: 'Deal 3 damage to a random enemy minion.',
      cost: 2,
      targetType: 'random_enemy',
      effectType: 'damage_random',
      value: 3,
      isUpgraded: true,
      baseHeroPowerId: 'logi-power'
    },
    passive: {
      id: 'logi-passive',
      name: 'Consuming Flame',
      description: 'Fire minions have +1 Attack.',
      trigger: 'always',
      condition: { minionElement: 'fire' },
      effectType: 'buff_attack',
      value: 1
    }
  },

  // ==================== 26. FJORGYN ====================
  'hero-fjorgyn': {
    id: 'hero-fjorgyn',
    name: 'Fjorgyn',
    title: 'Earth Mother',
    element: 'grass',
    weakness: 'fire',
    startingHealth: 100,
    description: "Thor's mother, goddess of the earth.",
    lore: 'The ancient earth goddess who bore the thunder god himself. Her embrace is the soil beneath all living things, her heartbeat the rumble of distant storms.',
    hasSpells: true,
    fixedCardIds: [6211], // Gefjon's Ox - earth/grass rare
    heroPower: {
      id: 'fjorgyn-power',
      name: "Thunder's Call",
      description: 'Deal 1 damage to all enemy minions.',
      cost: 2,
      targetType: 'none',
      effectType: 'damage_aoe',
      value: 1
    },
    weaponUpgrade: {
      id: 90026,
      name: 'Staff of the Earth',
      heroId: 'hero-fjorgyn',
      manaCost: 5,
      description: 'Deal 2 damage to all enemies and restore 5 HP to hero. Permanently upgrade your hero power.',
      immediateEffect: { type: 'damage_and_heal', value: 2, description: 'Deal 2 damage to all enemies and restore 5 HP.' },
      upgradedPowerId: 'fjorgyn-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'fjorgyn-power-upgraded',
      name: "Thunder's Call+",
      description: 'Deal 2 damage to all enemy minions.',
      cost: 2,
      targetType: 'none',
      effectType: 'damage_aoe',
      value: 2,
      isUpgraded: true,
      baseHeroPowerId: 'fjorgyn-power'
    },
    passive: {
      id: 'fjorgyn-passive',
      name: 'Earthen Shield',
      description: 'Grass minions have +1 Health.',
      trigger: 'always',
      condition: { minionElement: 'grass' },
      effectType: 'buff_health',
      value: 1
    }
  },

  // ==================== 27. VALTHRUD ====================
  'hero-valthrud': {
    id: 'hero-valthrud',
    name: 'Valthrud',
    title: 'Storm Shaman',
    element: 'electric',
    weakness: 'grass',
    startingHealth: 100,
    description: 'A wise shaman who speaks with thunder.',
    lore: 'An ancient völva who learned to interpret the voice of storms themselves. Each thunderclap carries prophecy to those with ears to hear the storm\'s wisdom.',
    hasSpells: true,
    fixedCardIds: [5307], // Skoll's Storm - lightning legendary
    heroPower: {
      id: 'valthrud-power',
      name: 'Thunder Whisper',
      description: 'Deal 1 damage and give -1 Attack this turn.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 1,
      secondaryValue: 1,
      duration: 'this_turn'
    },
    weaponUpgrade: {
      id: 90027,
      name: 'Thunder Staff',
      heroId: 'hero-valthrud',
      manaCost: 5,
      description: 'Deal 2 damage to all enemies and give them -1 Attack. Permanently upgrade your hero power.',
      immediateEffect: { type: 'damage_and_debuff', value: 2, description: 'Deal 2 damage to all enemies and give them -1 Attack.' },
      upgradedPowerId: 'valthrud-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'valthrud-power-upgraded',
      name: 'Thunder Whisper+',
      description: 'Deal 2 damage and give -1 Attack permanently.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 2,
      secondaryValue: 1,
      duration: 'permanent',
      isUpgraded: true,
      baseHeroPowerId: 'valthrud-power'
    },
    passive: {
      id: 'valthrud-passive',
      name: 'Storm Calling',
      description: 'Electric minions have +1 Attack.',
      trigger: 'always',
      condition: { minionElement: 'electric' },
      effectType: 'buff_attack',
      value: 1
    }
  },

  // ==================== 28. YLVA ====================
  'hero-ylva': {
    id: 'hero-ylva',
    name: 'Ylva',
    title: 'Wolf Mother',
    element: 'grass',
    weakness: 'fire',
    startingHealth: 100,
    description: 'A fierce huntress who runs with wolves.',
    lore: 'Raised by wolves after her village fell to plague, she leads the greatest pack in Midgard. Her howl can summon any wolf within a hundred leagues to her side.',
    hasSpells: true,
    fixedCardIds: [6220], // Thorn Warden - protector of the forest
    heroPower: {
      id: 'ylva-power',
      name: 'Pack Call',
      description: 'Summon a 1/1 Wolf with Rush.',
      cost: 2,
      targetType: 'none',
      effectType: 'summon',
      summonData: { name: 'Wolf', attack: 1, health: 1, keywords: ['rush'] }
    },
    weaponUpgrade: {
      id: 90028,
      name: "Fenrir's Fang",
      heroId: 'hero-ylva',
      manaCost: 5,
      description: 'Summon two 2/2 Wolves with Rush. Permanently upgrade your hero power.',
      immediateEffect: { type: 'summon_multiple', value: 2, description: 'Summon two 2/2 Wolves with Rush.' },
      upgradedPowerId: 'ylva-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'ylva-power-upgraded',
      name: 'Pack Call+',
      description: 'Summon a 2/1 Wolf with Rush.',
      cost: 2,
      targetType: 'none',
      effectType: 'summon',
      summonData: { name: 'Wolf', attack: 2, health: 1, keywords: ['rush'] },
      isUpgraded: true,
      baseHeroPowerId: 'ylva-power'
    },
    passive: {
      id: 'ylva-passive',
      name: 'Pack Tactics',
      description: 'Grass minions have +1 Attack when attacking.',
      trigger: 'on_minion_attack',
      condition: { minionElement: 'grass' },
      effectType: 'buff_attack',
      value: 1
    }
  },

  // ==================== 29. BRAKKI ====================
  'hero-brakki': {
    id: 'hero-brakki',
    name: 'Brakki',
    title: 'Forge Master',
    element: 'fire',
    weakness: 'water',
    startingHealth: 100,
    description: 'A dwarf smith of legendary skill.',
    lore: 'His forge burns hotter than Surtr\'s flames, and his hammer never strikes false. The dwarven masters of Nidavellir whisper that his work rivals even Brokkr and Sindri.',
    hasSpells: true,
    fixedCardIds: [4353], // Gullinbursti, Golden Boar
    heroPower: {
      id: 'brakki-power',
      name: 'Forge Spark',
      description: 'Give a friendly minion +1/+1.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 1
    },
    weaponUpgrade: {
      id: 90029,
      name: "Brakki's Anvil",
      heroId: 'hero-brakki',
      manaCost: 5,
      description: 'Give all friendly minions +2/+2. Permanently upgrade your hero power.',
      immediateEffect: { type: 'buff_aoe', value: 2, description: 'Give all friendly minions +2/+2.' },
      upgradedPowerId: 'brakki-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'brakki-power-upgraded',
      name: 'Forge Spark+',
      description: 'Give a friendly minion +2/+2.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 2,
      isUpgraded: true,
      baseHeroPowerId: 'brakki-power'
    },
    passive: {
      id: 'brakki-passive',
      name: "Smith's Blessing",
      description: 'Fire minions have +1 Health.',
      trigger: 'always',
      condition: { minionElement: 'fire' },
      effectType: 'buff_health',
      value: 1
    }
  },

  // ==================== 30. LIRIEN ====================
  'hero-lirien': {
    id: 'hero-lirien',
    name: 'Lirien',
    title: 'Wave Priestess',
    element: 'water',
    weakness: 'grass',
    startingHealth: 100,
    description: 'A healer who draws power from the sea.',
    lore: 'A priestess of the deep who learned Aegir\'s healing arts beneath the waves. Saltwater runs through her veins, and her touch carries the ocean\'s restorative power.',
    hasSpells: true,
    fixedCardIds: [4380], // Abyssal Kraken
    heroPower: {
      id: 'lirien-power',
      name: 'Wave Thread',
      description: 'Restore 3 health to a friendly minion.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'heal_single',
      value: 3
    },
    weaponUpgrade: {
      id: 90030,
      name: 'Trident of Tides',
      heroId: 'hero-lirien',
      manaCost: 5,
      description: 'Restore 5 health to all friendly minions. Permanently upgrade your hero power.',
      immediateEffect: { type: 'heal_aoe', value: 5, description: 'Restore 5 health to all friendly minions.' },
      upgradedPowerId: 'lirien-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'lirien-power-upgraded',
      name: 'Wave Thread+',
      description: 'Restore 5 health to a friendly minion.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'heal_single',
      value: 5,
      isUpgraded: true,
      baseHeroPowerId: 'lirien-power'
    },
    passive: {
      id: 'lirien-passive',
      name: 'Tidal Healing',
      description: 'Water minions restore 1 HP to themselves at end of turn.',
      trigger: 'end_of_turn',
      condition: { minionElement: 'water' },
      effectType: 'heal',
      value: 1
    }
  },

  // ==================== 31. SOLVI ====================
  'hero-solvi': {
    id: 'hero-solvi',
    name: 'Solvi',
    title: 'Dawn Knight',
    element: 'light',
    weakness: 'dark',
    startingHealth: 100,
    description: 'A holy knight who fights at dawn.',
    lore: 'Blessed by Sol herself, his armor blazes with dawn\'s first light. He has sworn to stand against darkness until Ragnarok claims the sun forever.',
    hasSpells: true,
    fixedCardIds: [4395], // Valkyrie Commander
    heroPower: {
      id: 'solvi-power',
      name: 'Morning Glow',
      description: 'Give a friendly minion +1 Attack and Divine Shield.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 1,
      grantKeyword: 'divine_shield'
    },
    weaponUpgrade: {
      id: 90031,
      name: 'Blade of Dawn',
      heroId: 'hero-solvi',
      manaCost: 5,
      description: 'Give all friendly minions +2 Attack and Divine Shield. Permanently upgrade your hero power.',
      immediateEffect: { type: 'buff_and_shield_all', value: 2, description: 'Give all friendly minions +2 Attack and Divine Shield.' },
      upgradedPowerId: 'solvi-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'solvi-power-upgraded',
      name: 'Morning Glow+',
      description: 'Give a friendly minion +2 Attack and Divine Shield.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 2,
      grantKeyword: 'divine_shield',
      isUpgraded: true,
      baseHeroPowerId: 'solvi-power'
    },
    passive: {
      id: 'solvi-passive',
      name: 'Radiant Aura',
      description: 'Light minions have +1 Attack.',
      trigger: 'always',
      condition: { minionElement: 'light' },
      effectType: 'buff_attack',
      value: 1
    }
  },

  // ==================== 32. GORMR ====================
  'hero-gormr': {
    id: 'hero-gormr',
    name: 'Gormr',
    title: 'Venom Wyrm',
    element: 'dark',
    weakness: 'light',
    startingHealth: 100,
    description: 'A serpentine creature of darkness.',
    lore: 'A spawn of Nidhogg\'s venom, this wyrm slithers through the roots of Yggdrasil. Its poison corrodes both flesh and spirit, leaving only darkness in its wake.',
    hasSpells: true,
    fixedCardIds: [4301], // Garm, the Hellhound
    heroPower: {
      id: 'gormr-power',
      name: 'Venom Fang',
      description: 'Deal 1 damage and apply Poisonous this turn.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 1,
      grantKeyword: 'poisonous_temp'
    },
    weaponUpgrade: {
      id: 90032,
      name: 'Fang of Nidhogg',
      heroId: 'hero-gormr',
      manaCost: 5,
      description: 'Deal 2 damage to all enemies and give your minions Poisonous this turn. Permanently upgrade your hero power.',
      immediateEffect: { type: 'damage_and_poison_all', value: 2, description: 'Deal 2 damage to all enemies and give your minions Poisonous.' },
      upgradedPowerId: 'gormr-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'gormr-power-upgraded',
      name: 'Venom Fang+',
      description: 'Deal 2 damage and apply Poisonous this turn.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 2,
      grantKeyword: 'poisonous_temp',
      isUpgraded: true,
      baseHeroPowerId: 'gormr-power'
    },
    passive: {
      id: 'gormr-passive',
      name: 'Toxic Blood',
      description: 'Dark minions have Poisonous.',
      trigger: 'always',
      condition: { minionElement: 'dark' },
      effectType: 'grant_keyword',
      value: 0,
      grantKeyword: 'poisonous'
    }
  },

  // ==================== 33. THRYMA ====================
  'hero-thryma': {
    id: 'hero-thryma',
    name: 'Thryma',
    title: 'Storm Caller',
    element: 'electric',
    weakness: 'grass',
    startingHealth: 100,
    description: 'A mage who commands the storm.',
    lore: 'Born during the worst tempest in a thousand years, lightning struck her cradle. Now storms answer to her will, and thunder speaks her name across the sky.',
    hasSpells: true,
    fixedCardIds: [5308], // Sleipnir's Charge - lightning legendary
    heroPower: {
      id: 'thryma-power',
      name: 'Storm Step',
      description: 'Deal 2 damage; if target survives, return it to hand.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 2
    },
    weaponUpgrade: {
      id: 90033,
      name: 'Storm Orb',
      heroId: 'hero-thryma',
      manaCost: 5,
      description: 'Deal 3 damage to all enemies and return the weakest to hand. Permanently upgrade your hero power.',
      immediateEffect: { type: 'damage_and_bounce', value: 3, description: 'Deal 3 damage to all enemies and return the weakest to hand.' },
      upgradedPowerId: 'thryma-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'thryma-power-upgraded',
      name: 'Storm Step+',
      description: 'Deal 3 damage; if target survives, return it to hand.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 3,
      isUpgraded: true,
      baseHeroPowerId: 'thryma-power'
    },
    passive: {
      id: 'thryma-passive',
      name: 'Electrified',
      description: 'Electric minions have +1 Attack.',
      trigger: 'always',
      condition: { minionElement: 'electric' },
      effectType: 'buff_attack',
      value: 1
    }
  },

  // ==================== 34. ELDRIN ====================
  'hero-eldrin': {
    id: 'hero-eldrin',
    name: 'Eldrin',
    title: 'Ember Mage',
    element: 'fire',
    weakness: 'water',
    startingHealth: 100,
    description: 'A fire mage of great power.',
    lore: 'He walked into Muspelheim and emerged with fire in his soul. Flames dance at his fingertips, and even Surtr\'s servants pause at the heat of his presence.',
    hasSpells: true,
    fixedCardIds: [4354], // Magma Leviathan
    heroPower: {
      id: 'eldrin-power',
      name: 'Cinder Trail',
      description: 'Deal 1 damage and give -1 Health this turn.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 1,
      secondaryValue: 1,
      duration: 'this_turn'
    },
    weaponUpgrade: {
      id: 90034,
      name: 'Phoenix Feather',
      heroId: 'hero-eldrin',
      manaCost: 5,
      description: 'Deal 2 damage to all enemies and give them -1 Health. Permanently upgrade your hero power.',
      immediateEffect: { type: 'damage_and_debuff', value: 2, description: 'Deal 2 damage to all enemies and give them -1 Health.' },
      upgradedPowerId: 'eldrin-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'eldrin-power-upgraded',
      name: 'Cinder Trail+',
      description: 'Deal 2 damage and give -1 Health permanently.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'damage_single',
      value: 2,
      secondaryValue: 1,
      duration: 'permanent',
      isUpgraded: true,
      baseHeroPowerId: 'eldrin-power'
    },
    passive: {
      id: 'eldrin-passive',
      name: 'Burning Aura',
      description: 'Fire minions deal +1 damage.',
      trigger: 'always',
      condition: { minionElement: 'fire' },
      effectType: 'buff_damage',
      value: 1
    }
  },

  // ==================== 35. MYRKA ====================
  'hero-myrka': {
    id: 'hero-myrka',
    name: 'Myrka',
    title: 'Bog Witch',
    element: 'water',
    weakness: 'grass',
    startingHealth: 100,
    description: 'A witch who dwells in the marshes.',
    lore: 'The swamps whisper secrets to those who listen, and she has listened for centuries. Her cauldron bubbles with waters from every bog in Midgard.',
    hasSpells: true,
    fixedCardIds: [4383], // Nokken, the Water Spirit
    heroPower: {
      id: 'myrka-power',
      name: 'Bog Grasp',
      description: 'Reduce an enemy minion\'s Attack by 2 this turn.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'debuff_single',
      value: 2,
      duration: 'this_turn'
    },
    weaponUpgrade: {
      id: 90035,
      name: 'Swamp Cauldron',
      heroId: 'hero-myrka',
      manaCost: 5,
      description: 'Reduce all enemy Attack by 2 and Freeze them. Permanently upgrade your hero power.',
      immediateEffect: { type: 'debuff_and_freeze_all', value: 2, description: 'Reduce all enemy Attack by 2 and Freeze them.' },
      upgradedPowerId: 'myrka-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'myrka-power-upgraded',
      name: 'Bog Grasp+',
      description: 'Reduce an enemy minion\'s Attack by 3 permanently.',
      cost: 2,
      targetType: 'enemy_minion',
      effectType: 'debuff_single',
      value: 3,
      duration: 'permanent',
      isUpgraded: true,
      baseHeroPowerId: 'myrka-power'
    },
    passive: {
      id: 'myrka-passive',
      name: 'Murky Waters',
      description: 'Water minions have +1 Health.',
      trigger: 'always',
      condition: { minionElement: 'water' },
      effectType: 'buff_health',
      value: 1
    }
  },

  // ==================== 36. FJORA ====================
  'hero-fjora': {
    id: 'hero-fjora',
    name: 'Fjora',
    title: 'Nature Oracle',
    element: 'grass',
    weakness: 'fire',
    startingHealth: 100,
    description: 'A seer who communes with nature.',
    lore: 'Her visions flow through the roots of Yggdrasil itself. Every tree, every flower, every blade of grass carries memories she alone can read.',
    hasSpells: true,
    fixedCardIds: [6210], // Leaf Stag - grass rare
    heroPower: {
      id: 'fjora-power',
      name: 'Root Sight',
      description: 'Discover a Grass minion and give it +1/+1.',
      cost: 2,
      targetType: 'none',
      effectType: 'scry',
      value: 1
    },
    weaponUpgrade: {
      id: 90036,
      name: 'Yggdrasil Branch',
      heroId: 'hero-fjora',
      manaCost: 5,
      description: 'Discover 2 Grass minions and give them +2/+2. Permanently upgrade your hero power.',
      immediateEffect: { type: 'discover_and_buff', value: 2, description: 'Discover 2 Grass minions and give them +2/+2.' },
      upgradedPowerId: 'fjora-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'fjora-power-upgraded',
      name: 'Root Sight+',
      description: 'Discover a Grass minion and give it +2/+2.',
      cost: 2,
      targetType: 'none',
      effectType: 'scry',
      value: 2,
      isUpgraded: true,
      baseHeroPowerId: 'fjora-power'
    },
    passive: {
      id: 'fjora-passive',
      name: 'Deep Roots',
      description: 'Grass minions have +1/+1 when played.',
      trigger: 'on_minion_play',
      condition: { minionElement: 'grass' },
      effectType: 'buff',
      value: 1
    }
  },

  // ==================== 37. TYR ====================
  'hero-tyr': {
    id: 'hero-tyr',
    name: 'Tyr',
    title: 'God of War',
    element: 'light',
    weakness: 'dark',
    startingHealth: 100,
    description: 'The one-handed god of war and justice who bound Fenrir.',
    lore: 'The god who sacrificed his sword hand to bind the chaos wolf, knowing the cost before the chain was forged. His courage defines the very meaning of honor.',
    hasSpells: true,
    fixedCardIds: [5506], // Aurora Phoenix - light legendary
    heroPower: {
      id: 'tyr-power',
      name: "Warrior's Sacrifice",
      description: 'Give a friendly minion +2 Attack. Take 2 damage.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 2
    },
    weaponUpgrade: {
      id: 90037,
      name: 'Gleipnir Chain',
      heroId: 'hero-tyr',
      manaCost: 5,
      description: 'Give all friendly minions +2/+2 and Taunt. Permanently upgrade your hero power.',
      immediateEffect: { type: 'buff_aoe_and_taunt', value: 2, description: 'Give all friendly minions +2/+2 and Taunt.' },
      upgradedPowerId: 'tyr-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'tyr-power-upgraded',
      name: "Warrior's Sacrifice+",
      description: 'Give a friendly minion +3 Attack and Divine Shield. Take 2 damage.',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 3,
      grantKeyword: 'divine_shield',
      isUpgraded: true,
      baseHeroPowerId: 'tyr-power'
    },
    passive: {
      id: 'tyr-passive',
      name: 'Bound by Honor',
      description: 'When a friendly minion dies, gain +1 Armor.',
      trigger: 'on_minion_death',
      condition: { targetType: 'friendly' },
      effectType: 'damage_reduction',
      value: 1
    }
  },

  // ==================== 38. VIDAR ====================
  'hero-vidar': {
    id: 'hero-vidar',
    name: 'Vidar',
    title: 'God of Vengeance',
    element: 'light',
    weakness: 'dark',
    startingHealth: 100,
    description: 'The silent god destined to avenge Odin at Ragnarok.',
    lore: 'The most patient of gods, he speaks only when the world needs to hear. His legendary boot, forged from all discarded leather, will one day tear Fenrir\'s jaws apart.',
    hasSpells: true,
    fixedCardIds: [5505], // Daybreak Hawk - light rare
    heroPower: {
      id: 'vidar-power',
      name: 'Silent Fury',
      description: 'Give a friendly minion +1/+1 for each friendly minion that died this game (max +3/+3).',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 1
    },
    weaponUpgrade: {
      id: 90038,
      name: 'Iron Boot',
      heroId: 'hero-vidar',
      manaCost: 5,
      description: 'Deal 4 damage. If a friendly minion died this turn, deal 8 instead. Upgrade hero power.',
      immediateEffect: { type: 'conditional_damage', value: 4, description: 'Deal 4 damage (8 if ally died).' },
      upgradedPowerId: 'vidar-power-upgraded'
    },
    upgradedHeroPower: {
      id: 'vidar-power-upgraded',
      name: 'Silent Fury+',
      description: 'Give a friendly minion +2/+2 for each friendly minion that died this game (max +6/+6).',
      cost: 2,
      targetType: 'friendly_minion',
      effectType: 'buff_single',
      value: 2,
      isUpgraded: true,
      baseHeroPowerId: 'vidar-power'
    },
    passive: {
      id: 'vidar-passive',
      name: 'Avenging Presence',
      description: 'When a friendly minion dies, your next minion played gains +1/+1.',
      trigger: 'on_minion_death',
      condition: { targetType: 'friendly' },
      effectType: 'buff',
      value: 1
    }
  }
};

export const ADDITIONAL_HERO_LIST = Object.values(ADDITIONAL_HEROES);

export const getAdditionalHeroById = (id: string): NorseHero | undefined => {
  return ADDITIONAL_HEROES[id];
};

export const getAllAdditionalHeroes = (): NorseHero[] => {
  return ADDITIONAL_HERO_LIST;
};
