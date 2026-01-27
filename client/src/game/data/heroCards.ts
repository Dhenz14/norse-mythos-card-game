/**
 * Hero cards for Hearthstone clone
 * Hero cards replace your current hero and hero power
 */
import { CardData, HeroPower } from '../types';

// Hero Powers for the hero cards
const   deathstalkerHeroPower: HeroPower = {,
    name: "Build-a-Beast",
      description: "Craft a custom Zombeast.",

      cost: 2,
      used: false,

      class: "hunter"
};

const   frostLichHeroPower: HeroPower = {,
    name: "Icy Touch",
    description: "Deal 1 damage. If this kills a minion, summon a Water Elemental.",
      cost: 2,

      used: false,
    class: "mage"
};

const   scourgelordHeroPower: HeroPower = {,
    name: "Bladestorm",
      description: "Deal 1 damage to all minions.",

      cost: 2,
      used: false,

      class: "warrior"
};

const   lightforgedHeroPower: HeroPower = {,
    name: "The Four Horsemen",
    description: "Summon a 2/2 Horseman. If you have all 4, destroy the enemy hero.",
      cost: 2,

      used: false,
    class: "paladin"
};

export const   heroCards: CardData[] = [
      armorGain: 5collectible: true, class: "Neutral", class: "Neutral" 
  }
armorGain: 5
  }
  collectible: true
];

// Token cards for hero card abilities
export const   heroCardTokens: CardData[] = [
       {
  id: 10502,
  
  name: "Shadowmourne",
  manaCost: 8,
  
  attack: 4,
  durability: 3,
  
  description: "Also damages minions adjacent to whomever your hero attacks.",
  rarity: "legendary",
  
  type: "weapon",
  keywords: [], class: "Neutral",
      collectible: true
  },

{
  id: 10503,
  
  name: "Grave Vengeance",
  manaCost: 9,
  
  attack: 5,
  durability: 3,
  description: "Wielded by Uther of the Ebon Blade.",
  
  rarity: "legendary",
  type: "weapon",
  
  keywords: [], class: "Neutral",
      collectible: true
  },

{
  id: 10504,
  
  name: "Horseman",
  manaCost: 2,
  
  attack: 2,
  health: 2,
  
  description: "Summoned by Uther of the Ebon Blade's hero power.",
  rarity: "legendary",
  
  type: "minion",
  keywords: [], class: "Neutral"
  }
  collectible: true
];

// Export all hero-related cards
export const allHeroCards: CardData[] = [...heroCards, ...heroCardTokens];