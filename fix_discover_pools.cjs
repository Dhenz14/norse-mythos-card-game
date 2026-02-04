/**
 * A specialized script to fix the discover pools file.
 * This removes all the incorrect collectible properties in the discover pools.
 */
const fs = require('fs');

const filePath = './client/src/game/data/discoverPools.ts';

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

console.log(`Processing ${filePath}...`);

// Create backup
const backupPath = `${filePath}.backup.${Date.now()}`;
const originalContent = fs.readFileSync(filePath, 'utf8');
fs.writeFileSync(backupPath, originalContent);

// Correct interface definition (without extra commas)
const correctInterface = `// Type for the discovery pool
export interface DiscoveryPool {
  id: string;
  name: string;
  description: string;
  filter: (card: CardData) => boolean;
}`;

// Start with the correct interface
const content = originalContent.replace(
  /\/\/ Type for the discovery pool[\s\S]*?filter: \(card: CardData\) => boolean;[\s\S]*?\}/,
  correctInterface
);

// Properly define the discovery pools
const correctPools = `// Base discovery pools
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
];`;

// Replace the pools definition
const fixedContent = content.replace(
  /\/\/ Base discovery pools[\s\S]*?];/,
  correctPools
);

// Fix any indentation issues in the helper functions
const fixedContentWithHelpers = fixedContent.replace(
  /export function getCardsFromPool[\s\S]*?}/,
  (match) => {
    // Fix indentation in the match
    return match.replace(/\n\s{6,}(\w+)/g, '\n  $1')
      .replace(/\n\s{10,}(\w+)/g, '\n    $1')
      .replace(/\n\s{14,}(\w+)/g, '\n      $1');
  }
);

// Fix the rest of the functions
const finalContent = fixedContentWithHelpers.replace(
  /export function getDiscoverPoolOptions[\s\S]*?}/,
  (match) => {
    return match.replace(/\n\s{6,}(\w+)/g, '\n  $1')
      .replace(/\n\s{10,}(\w+)/g, '\n    $1');
  }
).replace(
  /export function getRandomCardsFromPool[\s\S]*?}/,
  (match) => {
    return match.replace(/\n\s{6,}(\w+)/g, '\n  $1')
      .replace(/\n\s{10,}(\w+)/g, '\n    $1')
      .replace(/\n\s{14,}(\w+)/g, '\n      $1');
  }
);

// Write the fixed content back to the file
fs.writeFileSync(filePath, finalContent);
console.log(`Successfully fixed ${filePath}`);