/**
 * kingDefinitions.ts
 * 
 * Definitions for the 9 Primordial Kings (Summoners) in Ragnarok Poker.
 * Kings provide passive army-wide buffs and do not participate in combat directly.
 */

import { NorseKing } from '../../types/NorseTypes';

export const NORSE_KINGS: Record<string, NorseKing> = {
  
  // ==================== 1. YMIR ====================
  'king-ymir': {
    id: 'king-ymir',
    name: 'Ymir',
    title: 'The Primordial Jotunn',
    description: 'The first being in Norse mythology, from whose body the world was created.',
    role: 'Tempo Pressure / Attack Skew',
    designIntent: 'Ymir forces combat. He compresses the game timeline and punishes slow setups. If you hesitate, Ymir wins.',
    hasSpells: false,
    passives: [
      {
        id: 'ymir-passive-1',
        name: "Jotunn's Might",
        description: 'All friendly minions gain +2 Attack.',
        trigger: 'always',
        effectType: 'buff_attack',
        value: 2,
        isAura: true
      },
      {
        id: 'ymir-passive-2',
        name: 'Chilling Presence',
        description: 'All enemy minions suffer -1 Attack.',
        trigger: 'always',
        effectType: 'debuff_attack',
        value: 1,
        isAura: true
      }
    ]
  },

  // ==================== 2. BURI ====================
  'king-buri': {
    id: 'king-buri',
    name: 'Buri',
    title: 'The First God',
    description: 'The first of the gods, licked free from the ice by the primordial cow Auðumbla.',
    role: 'Attrition / Scaling Defense',
    designIntent: 'Buri rewards patience and survival. You don\'t win quickly. You win by outlasting everything.',
    hasSpells: false,
    passives: [
      {
        id: 'buri-passive-1',
        name: 'Primordial Shield',
        description: 'All friendly minions gain +1 Armor.',
        trigger: 'always',
        effectType: 'buff_armor',
        value: 1,
        isAura: true
      },
      {
        id: 'buri-passive-2',
        name: 'Eternal Growth',
        description: 'At the start of your turn, all friendly minions gain +1 Health permanently.',
        trigger: 'start_of_turn',
        effectType: 'buff_health',
        value: 1,
        isAura: false  // Permanent, not removed when King dies
      }
    ]
  },

  // ==================== 3. SURTR ====================
  'king-surtr': {
    id: 'king-surtr',
    name: 'Surtr',
    title: 'The Fire Giant',
    description: 'The lord of Muspelheim who will set the world ablaze at Ragnarok.',
    role: 'Pressure / Board Erosion',
    designIntent: 'Surtr makes doing nothing lethal. If you don\'t act, the fire will.',
    hasSpells: false,
    passives: [
      {
        id: 'surtr-passive-1',
        name: 'Flame Touched',
        description: 'All friendly minions gain +1 Attack.',
        trigger: 'always',
        effectType: 'buff_attack',
        value: 1,
        isAura: true
      },
      {
        id: 'surtr-passive-2',
        name: "Muspelheim's Burn",
        description: 'At the end of your turn, deal 1 damage to all enemy minions.',
        trigger: 'end_of_turn',
        effectType: 'damage_all_enemies',
        value: 1,
        isAura: false
      }
    ]
  },

  // ==================== 4. BORR ====================
  'king-borr': {
    id: 'king-borr',
    name: 'Borr',
    title: 'The Primordial Father',
    description: 'Father of Odin, Vili, and Ve. The bridge between primordial beings and the Aesir.',
    role: 'Death Value / Board Persistence',
    designIntent: 'Borr denies clean victories. Death is not an ending — it\'s a delay.',
    hasSpells: false,
    passives: [
      {
        id: 'borr-passive-1',
        name: "Father's Blessing",
        description: 'All friendly minions gain +1 Health.',
        trigger: 'always',
        effectType: 'buff_health',
        value: 1,
        isAura: true
      },
      {
        id: 'borr-passive-2',
        name: 'Echo of Life',
        description: 'When a friendly minion dies, summon a 1/1 Echo of Borr with Taunt in its place.',
        trigger: 'on_minion_death',
        effectType: 'summon_token',
        value: 0,
        isAura: false,
        summonData: {
          name: 'Echo of Borr',
          attack: 1,
          health: 1,
          keywords: ['taunt']
        }
      }
    ]
  },

  // ==================== 5. YGGDRASIL ====================
  'king-yggdrasil': {
    id: 'king-yggdrasil',
    name: 'Yggdrasil',
    title: 'The World Tree',
    description: 'The immense sacred tree that connects the nine worlds of Norse cosmology.',
    role: 'Growth Engine / Scaling Power',
    designIntent: 'Yggdrasil converts survival into dominance. Growth is inevitable if left unchecked.',
    hasSpells: false,
    passives: [
      {
        id: 'yggdrasil-passive-1',
        name: 'Life Spring',
        description: 'At the start of your turn, restore 2 Health to all friendly minions.',
        trigger: 'start_of_turn',
        effectType: 'heal_all_friendly',
        value: 2,
        isAura: false
      },
      {
        id: 'yggdrasil-passive-2',
        name: 'Roots of Power',
        description: 'Whenever a friendly minion is healed, it gains +1 Attack permanently.',
        trigger: 'on_heal',
        effectType: 'grant_attack_on_heal',
        value: 1,
        isAura: false
      }
    ]
  },

  // ==================== 6. AUDUMBLA ====================
  'king-audumbla': {
    id: 'king-audumbla',
    name: 'Auðumbla',
    title: 'The Primordial Cow',
    description: 'The primordial cow whose milk nourished Ymir and who licked Buri free from the ice.',
    role: 'Sustain / Board Stability',
    designIntent: 'Auðumbla rewards presence and numbers. Life feeds life.',
    hasSpells: false,
    passives: [
      {
        id: 'audumbla-passive-1',
        name: 'Nourishing Presence',
        description: 'All friendly minions gain +1 Health.',
        trigger: 'always',
        effectType: 'buff_health',
        value: 1,
        isAura: true
      },
      {
        id: 'audumbla-passive-2',
        name: 'Gift of Life',
        description: 'Whenever you play a minion, restore 1 Health to all friendly minions.',
        trigger: 'on_minion_play',
        effectType: 'heal_all_friendly',
        value: 1,
        isAura: false
      }
    ]
  },

  // ==================== 7. BLAINN ====================
  'king-blainn': {
    id: 'king-blainn',
    name: 'Blainn',
    title: 'The Dark One',
    description: 'A primordial dwarf associated with darkness and the forging of fate.',
    role: 'Control / Disruption',
    designIntent: 'Blainn wins by denial, not force. You don\'t lose your army — you lose your momentum.',
    hasSpells: false,
    passives: [
      {
        id: 'blainn-passive-1',
        name: "Shadow's Embrace",
        description: 'All friendly minions gain +1 Health.',
        trigger: 'always',
        effectType: 'buff_health',
        value: 1,
        isAura: true
      },
      {
        id: 'blainn-passive-2',
        name: "Fate's Chains",
        description: 'At the start of your turn, a random enemy minion loses 1 Attack permanently.',
        trigger: 'start_of_turn',
        effectType: 'debuff_attack',
        value: 1,
        isAura: false
      }
    ]
  },

  // ==================== 8. BRIMIR ====================
  'king-brimir': {
    id: 'king-brimir',
    name: 'Brimir',
    title: 'The Bloody Moisture',
    description: 'A primordial being from whose blood and bones the world was shaped.',
    role: 'Aggression Through Death',
    designIntent: 'Brimir turns loss into pressure. Blood spills both ways.',
    hasSpells: false,
    passives: [
      {
        id: 'brimir-passive-1',
        name: 'Blood Rage',
        description: 'All friendly minions gain +1 Attack.',
        trigger: 'always',
        effectType: 'buff_attack',
        value: 1,
        isAura: true
      },
      {
        id: 'brimir-passive-2',
        name: "Death's Echo",
        description: 'When a friendly minion dies, deal 1 damage to all enemy minions.',
        trigger: 'on_minion_death',
        effectType: 'damage_all_enemies',
        value: 1,
        isAura: false
      }
    ]
  },

  // ==================== 9. GINNUNGAGAP ====================
  'king-ginnungagap': {
    id: 'king-ginnungagap',
    name: 'Ginnungagap',
    title: 'Primordial Chaos',
    description: 'The primordial void that existed before creation, from which all things emerged.',
    role: 'Chaos / Variance / Adaptation',
    designIntent: 'Ginnungagap rewards embracing uncertainty. Creation is chaos made solid.',
    hasSpells: false,
    passives: [
      {
        id: 'ginnungagap-passive-1',
        name: 'Void Spawn',
        description: 'At the end of your turn, summon a 1/1 Void Spawn with a random keyword.',
        trigger: 'end_of_turn',
        effectType: 'summon_token',
        value: 0,
        isAura: false,
        summonData: {
          name: 'Void Spawn',
          attack: 1,
          health: 1,
          randomKeyword: true
        }
      }
    ]
  }
};

export const KING_LIST = Object.values(NORSE_KINGS);

export const getKingById = (id: string): NorseKing | undefined => {
  return NORSE_KINGS[id];
};

export const getAllKings = (): NorseKing[] => {
  return KING_LIST;
};
