/**
 * Helper module to break circular dependencies between discover pools, cards and other systems
 * This file serves as an intermediary layer between different card systems
 */
import { CardData } from '../types';

// Interface for simplified discover pool options
export interface DiscoverPoolOption {
      id: string;

      name: string;
    description: string;
}

// We store the pool options here to avoid circular imports
const poolOptions: DiscoverPoolOption[] = [
   { id: 'dragon', name: 'Dragon',   description: 'Discover a Dragon' },

{ id: 'beast', name: 'Beast',   description: 'Discover a Beast' },

{ id: 'mech', name: 'Mech',   description: 'Discover a Mech' },

{ id: 'murloc', name: 'Murloc',   description: 'Discover a Murloc' },

{ id: 'demon', name: 'Demon',   description: 'Discover a Demon' },

{ id: 'elemental', name: 'Elemental',   description: 'Discover an Elemental' },

{ id: 'pirate', name: 'Pirate',   description: 'Discover a Pirate' },

{ id: 'totem', name: 'Totem',   description: 'Discover a Totem' },

{ id: 'deathrattle', name: 'Deathrattle',   description: 'Discover a minion with Deathrattle' },

{ id: 'battlecry', name: 'Battlecry',   description: 'Discover a minion with Battlecry' },

{ id: 'taunt', name: 'Taunt',   description: 'Discover a minion with Taunt' },

{ id: 'divine_shield', name: 'Divine Shield',   description: 'Discover a minion with Divine Shield' },

{ id: 'spell_damage', name: 'Spell Damage',   description: 'Discover a minion with Spell Damage' },

{ id: 'rush', name: 'Rush',   description: 'Discover a minion with Rush' },

{ id: 'charge', name: 'Charge',   description: 'Discover a minion with Charge' },

{ id: 'lifesteal', name: 'Lifesteal',   description: 'Discover a card with Lifesteal' },

{ id: 'windfury', name: 'Windfury',   description: 'Discover a minion with Windfury' },

{ id: 'legendary', name: 'Legendary',   description: 'Discover a Legendary minion' },

{ id: 'epic', name: 'Epic',   description: 'Discover an Epic card' },

{ id: 'one_cost', name: '1-Cost',   description: 'Discover a 1-Cost card' },

{ id: 'two_cost', name: '2-Cost',   description: 'Discover a 2-Cost card' },

{ id: 'three_cost', name: '3-Cost',   description: 'Discover a 3-Cost card' },

{ id: 'damaged_minion', name: 'Damaged Minion',   description: 'Discover a minion that has been damaged' },

{ id: 'secret', name: 'Secret',   description: 'Discover a Secret' },

{ id: 'spell', name: 'Spell',   description: 'Discover a Spell' },

{ id: 'weapon', name: 'Weapon', description: 'Discover a Weapon' }
];

/**
 * Returns all discovery pool options as an array
 * This avoids circular dependencies with the card system
 */
export function getAllDiscoverPoolOptions(): DiscoverPoolOption[] {
  return poolOptions;
}

// Helper function to safely check if card.race matches a specific race
export function hasRace(card: CardData, race: string): boolean {
   // Add case-insensitive comparison for race
  return card.race !== undefined && card.race.toLowerCase() === race.toLowerCase();
}