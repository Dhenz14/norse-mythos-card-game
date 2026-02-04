/**
 * Frenzy Cards Implementation
 * 
 * The Frenzy keyword was introduced in the Forged in the Barrens expansion.
 * Frenzy effects trigger the first time a minion survives damage.
 */
import { CardData } from '../types';

// Collection of minions with the Frenzy keyword
const frenzyCards: CardData[] = [{
      id: 9002,

      name: "Death's Head Cultist",
      manaCost: 3,

      attack: 2,
      health: 4,

      type: 'minion',
      rarity: 'common',

      heroClass: 'warlock',
      class: 'Warlock',
      race: '',

      keywords: ['frenzy', 'taunt'],
      description: "Taunt. Frenzy: Restore 4 Health to your hero.\n\nThe cult provides excellent health benefits, though the deductible is your soul.",
      collectible: true,

      frenzyEffect: {
        type: "heal",
        targetType: 'friendly_hero',
        value: 4,
        triggered: false
      }
  },

{
      id: 9003,

      name: "Druid of the Plains",
      manaCost: 5,

      attack: 3,
      health: 6,

      type: 'minion',
      rarity: 'rare',

      heroClass: 'druid',
      class: 'Druid',
      race: '',

      keywords: ['frenzy'],
      description: "Frenzy: Transform into a 6/7 Dire Cat Form with Rush.\n\nHis teacher asked 'Why so angry?' He replied, 'Haven't you seen the price of housing these days?'",
      collectible: true,

      frenzyEffect: {
        type: "transform",
        transformId: 9004,
        triggered: false
      }
  },

{
  id: 9004,
  
  name: "Dire Cat Form",
  manaCost: 5,
  
  attack: 6,
  health: 7,
  
  type: 'minion',
  rarity: 'common',
  
  heroClass: 'druid',
  class: 'Druid',
  race: 'beast',
  
  keywords: ['rush'],
  description: "Rush",
  collectible: false
  },

{
      id: 9005,

      name: "Razormane Raider",
      manaCost: 3,

      attack: 2,
      health: 3,

      type: 'minion',
      rarity: 'common',

      heroClass: 'neutral',
      class: 'Neutral',
      race: 'beast',

      keywords: ['frenzy'],
      description: "Frenzy: Attack a random enemy.\n\nIf you thought he was quick to anger before, just wait until you see him wounded!",
      collectible: true,

      frenzyEffect: {
        type: "attack_random",
        targetType: 'random_enemy',
        triggered: false
      }
  },

{
      id: 9006,

      name: "Peon",
      manaCost: 1,

      attack: 1,
      health: 2,

      type: 'minion',
      rarity: 'common',

      heroClass: 'neutral',
      class: 'Neutral',
      race: '',

      keywords: ['frenzy'],
      description: "Frenzy: Add a random spell to your hand.\n\n'Work work.' - Official company policy",
      collectible: true,
      frenzyEffect: {
        type: "add_to_hand",
        cardType: 'spell',
        isRandom: true,
        count: 1,
        triggered: false
      }
  },

{
      id: 9007,

      name: "Kargal Battlescar",
      manaCost: 8,

      attack: 6,
      health: 6,

      type: 'minion',
      rarity: 'legendary',

      heroClass: 'neutral',
      class: 'Neutral',
      race: '',

      keywords: ['frenzy'],
      description: "Frenzy: Summon a 5/5 Watcher for each Watch Post you've summoned this game.\n\nRespect is earned through rigorous discipline. That, and his sweet facial scars.",
      collectible: true,

      frenzyEffect: {
        type: "summon",
        summonCardId: 9008,
        summonBasedOnCondition: 'watch_posts_summoned',
        triggered: false
      }
  },

{
  id: 9008,
  
  name: "Battlescar Watcher",
  manaCost: 5,
  
  attack: 5,
  health: 5,
  
  type: 'minion',
  rarity: 'common',
  
  heroClass: 'neutral',
  class: 'Neutral',
  race: '',
  
  keywords: [],
  description: "Summoned by Kargal Battlescar's Frenzy effect.",
  collectible: false
  },

{
      id: 9009,

      name: "Goretusk Ravager",
      manaCost: 4,

      attack: 4,
      health: 3,

      type: 'minion',
      rarity: 'rare',

      heroClass: 'hunter',
      class: 'Hunter',
      race: 'beast',

      keywords: ['frenzy'],
      description: "Frenzy: Deal 1 damage to all enemy minions.\n\nGoretusks are very peaceful unless you startle them, anger them, or exist near them.",
      collectible: true,

      frenzyEffect: {
        type: "damage",
        targetType: 'all_enemy_minions',
        value: 1,
        triggered: false
      }
  },

{
      id: 9010,

      name: "Toad of the Wilds",
      manaCost: 2,

      attack: 2,
      health: 2,

      type: 'minion',
      rarity: 'common',

      heroClass: 'druid',
      class: 'Druid',
      race: 'beast',

      keywords: ['frenzy', 'taunt'],
      description: "Taunt. Frenzy: Gain +2/+2.\n\nMuch like its non-magical relatives, this toad secretes a hallucinogenic substance. Unlike them, it will ALSO tear your face off.",
      collectible: true,

      frenzyEffect: {
        type: "buff",
        buffAttack: 2,
        buffHealth: 2,
        triggered: false
      }
  }];

export default frenzyCards;