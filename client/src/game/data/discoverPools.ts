/**
 * Predefined discovery pools for different types of discoveries
 * This is similar to how Hearthstone implements "discover a dragon" or "discover a deathrattle minion"
 */
import { CardData } from '../types';
// Use allCards as the single source of truth for card data (1300+ cards)
import allCards from './allCards';
// Alias for backward compatibility within this file
const fullCardDatabase = allCards;
// Import helpers from discoveryHelper to avoid circular dependencies
import { DiscoverPoolOption, hasRace, getAllDiscoverPoolOptions } from './discoveryHelper';

// Type for the discovery pool
export interface DiscoveryPool {
      id: string;

      name: string;
      description: string;

      filter: (card: CardData) => boolean;
}

// Base discovery pools
const createDiscoveryPools = (): DiscoveryPool[] => [
  {
      id: 'dragon',

      name: 'Dragon',
      description: 'Discover a Dragon',

      filter: (card: CardData): boolean => Boolean(hasRace(card, 'dragon'))
  },

{
      id: 'beast',

      name: 'Beast',
      description: 'Discover a Beast',

      filter: (card: CardData): boolean => Boolean(hasRace(card, 'beast'))
  },

{
      id: 'mech',

      name: 'Mech',
      description: 'Discover a Mech',

      filter: (card: CardData): boolean => Boolean(hasRace(card, 'mech'))
  },

{
      id: 'murloc',

      name: 'Murloc',
      description: 'Discover a Murloc',

      filter: (card: CardData): boolean => Boolean(hasRace(card, 'murloc'))
  },

{
      id: 'demon',

      name: 'Demon',
      description: 'Discover a Demon',

      filter: (card: CardData): boolean => Boolean(hasRace(card, 'demon'))
  },

{
      id: 'elemental',

      name: 'Elemental',
      description: 'Discover an Elemental',

      filter: (card: CardData): boolean => Boolean(hasRace(card, 'elemental'))
  },

{
      id: 'pirate',

      name: 'Pirate',
      description: 'Discover a Pirate',

      filter: (card: CardData): boolean => Boolean(hasRace(card, 'pirate'))
  },

{
      id: 'totem',

      name: 'Totem',
      description: 'Discover a Totem',

      filter: (card: CardData): boolean => Boolean(hasRace(card, 'totem'))
  },

{
      id: 'deathrattle',

      name: 'Deathrattle',
      description: 'Discover a minion with Deathrattle',

      filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
      typeof keyword === 'string' && keyword.toLowerCase() === 'deathrattle'))
  },

{
      id: 'battlecry',

      name: 'Battlecry',
      description: 'Discover a minion with Battlecry',

      filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
      typeof keyword === 'string' && keyword.toLowerCase() === 'battlecry'))
  },

{
      id: 'taunt',

      name: 'Taunt',
      description: 'Discover a minion with Taunt',

      filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
      typeof keyword === 'string' && keyword.toLowerCase() === 'taunt'))
  },

{
      id: 'divine_shield',

      name: 'Divine Shield',
      description: 'Discover a minion with Divine Shield',

      filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
      typeof keyword === 'string' && keyword.toLowerCase() === 'divine shield'))
  },

{
      id: 'spell_damage',

      name: 'Spell Damage',
      description: 'Discover a minion with Spell Damage',

      filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
      typeof keyword === 'string' && keyword.toLowerCase() === 'spell damage'))
  },

{
      id: 'rush',

      name: 'Rush',
      description: 'Discover a minion with Rush',

      filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
      typeof keyword === 'string' && keyword.toLowerCase() === 'rush'))
  },

{
      id: 'charge',

      name: 'Charge',
      description: 'Discover a minion with Charge',

      filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
      typeof keyword === 'string' && keyword.toLowerCase() === 'charge'))
  },

{
      id: 'lifesteal',

      name: 'Lifesteal',
      description: 'Discover a card with Lifesteal',

      filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
      typeof keyword === 'string' && keyword.toLowerCase() === 'lifesteal'))
  },

{
      id: 'windfury',

      name: 'Windfury',
      description: 'Discover a minion with Windfury',

      filter: (card: CardData): boolean => Boolean(card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
      typeof keyword === 'string' && keyword.toLowerCase() === 'windfury'))
  },

{
      id: 'legendary',

      name: 'Legendary',
      description: 'Discover a Legendary minion',

      filter: (card: CardData): boolean => Boolean(card.type === 'minion' && card.rarity === 'legendary')
  },

{
      id: 'epic',

      name: 'Epic',
      description: 'Discover an Epic card',

      filter: (card: CardData): boolean => Boolean(card.rarity === 'epic')
  },

{
      id: 'one_cost',

      name: '1-Cost',
      description: 'Discover a 1-Cost card',

      filter: (card: CardData): boolean => Boolean(card.manaCost === 1)
  },

{
      id: 'two_cost',

      name: '2-Cost',
      description: 'Discover a 2-Cost card',

      filter: (card: CardData): boolean => Boolean(card.manaCost === 2)
  },

{
      id: 'three_cost',

      name: '3-Cost',
      description: 'Discover a 3-Cost card',

      filter: (card: CardData): boolean => Boolean(card.manaCost === 3)
  },

{
      id: 'damaged_minion',

      name: 'Damaged Minion',
      description: 'Discover a minion that has been damaged',

      filter: (card: CardData): boolean => Boolean(card.type === 'minion' && 
      card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
        typeof keyword === 'string' && keyword.toLowerCase() === 'battlecry') && 
      card.name.toLowerCase().includes('damaged'))
  },

{
      id: 'secret',

      name: 'Secret',
      description: 'Discover a Secret',

      filter: (card: CardData): boolean => Boolean(card.type === 'secret')
  },

{
      id: 'spell',

      name: 'Spell',
      description: 'Discover a Spell',

      filter: (card: CardData): boolean => Boolean(card.type === 'spell')
  },

{
      id: 'weapon',

      name: 'Weapon',
      description: 'Discover a Weapon',

      filter: (card: CardData): boolean => Boolean(card.type === 'weapon')
  }
];

// Initialize discoveryPools using our creator function
export const discoveryPools: DiscoveryPool[] = createDiscoveryPools();

/**
 * Get cards that match a specific discovery pool
 */
export function getCardsFromPool(poolId: string): CardData[] {
          // Find the pool
  const pool = discoveryPools.find((p: DiscoveryPool) => p.id === poolId);
  if (!pool) {
  console.error(`Discovery pool with ID ${poolId} not found`);
    return [];
  }
  
  // Log total cards in the database for debugging
  console.log(`Total cards in   database: ${fullCardDatabase.length}`);
   // Enhanced debug for beast cards
  if (poolId === 'beast') {
            console.log('Searching for beast cards in database...');
    // Find cards with race 'Beast' (case-insensitive)
    const beasts = fullCardDatabase.filter(card => 
      card.race && card.race.toLowerCase() === 'beast'
    );
    console.log(`Found ${beasts.length} beast cards in the card database`);
    
    // Log beast cards for debugging
    beasts.forEach(card => {
              console.log(`Beast card found: ${card.name}
ID: ${card.id}
Race: ${card.race}`);
    });
    
    return beasts;
    }
  
  // Enhanced debug for taunt minions
  if (poolId === 'taunt') {
            console.log('Searching for taunt minions in card database...');
    const taunts = fullCardDatabase.filter(card => 
      card.keywords && Array.isArray(card.keywords) && card.keywords.some(keyword => 
        typeof keyword === 'string' && keyword.toLowerCase() === 'taunt')
    );
    console.log(`Found ${taunts.length} taunt minions with proper taunt keyword`);
    
    // Log some sample taunt cards
    taunts.slice(0, 3).forEach(card => {
              console.log(`Taunt card found: ${card.name}
ID: ${card.id}
Keywords: ${card.keywords}`);
    });
    
    return taunts;
    }
  
  // Filter cards based on the pool's filter
  const result = fullCardDatabase.filter(pool.filter);
  console.log(`Found ${result.length} cards for discovery   pool: ${poolId}`);
   return result;
}

/**
 * Get formatted pool options for use in card selection UIs
 */
export function getDiscoverPoolOptions(): DiscoverPoolOption[] {
  return discoveryPools.map((pool: DiscoveryPool) => ({
      id: pool.id,

      name: pool.name,
    description: pool.description
  }));
}

// Note: We're now using the getAllDiscoverPoolOptions from discoveryHelper,

export function getRandomCardsFromPool(poolId: string,   count: number = 3): CardData[] {
   // Get all cards that match the pool
  const allCards = getCardsFromPool(poolId);
  
  // If we don't have enough cards, return all we have
  if (allCards.length <= count) {
  return allCards;
  }
  
  // Select random cards
  const   result: CardData[] = [];
   const usedIndices = new Set<number>();
  
  while (result.length < count && usedIndices.size < allCards.length) {
            const randomIndex = Math.floor(Math.random() * allCards.length);
    
    if (!usedIndices.has(randomIndex)) {
              usedIndices.add(randomIndex);
      result.push(allCards[randomIndex]);
    }
  }
  
  return result;
}