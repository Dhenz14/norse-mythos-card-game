/**
 * Utility functions for Adapt mechanic
 * Adapt lets a minion Discover and immediately gain one of three random adaptations
 */

import { CardData, CardInstance, GameState, DiscoveryState } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Available adaptations that can be chosen with the Adapt keyword
 */
export const adaptations = [
  {
    id: 'adapt_poisonous',
    name: 'Poisonous',
    description: 'Destroy any minion damaged by this minion.',
    effect: (minion: CardInstance) => ({
      ...minion,
      isPoisonous: true,
      keywords: [...(minion.keywords || []), 'poisonous'],
      card: {
        ...minion.card,
        description: `${minion.card.description} Poisonous.`
      }
    })
  },
  {
    id: 'adapt_divine_shield',
    name: 'Divine Shield',
    description: 'Absorbs the first instance of damage taken.',
    effect: (minion: CardInstance) => ({
      ...minion,
      hasDivineShield: true,
      keywords: [...(minion.keywords || []), 'divine_shield'],
      card: {
        ...minion.card,
        description: `${minion.card.description} Divine Shield.`
      }
    })
  },
  {
    id: 'adapt_taunt',
    name: 'Taunt',
    description: 'Enemies must attack this minion first.',
    effect: (minion: CardInstance) => ({
      ...minion,
      keywords: [...(minion.keywords || []), 'taunt'],
      card: {
        ...minion.card,
        description: `${minion.card.description} Taunt.`
      }
    })
  },
  {
    id: 'adapt_windfury',
    name: 'Windfury',
    description: 'Can attack twice each turn.',
    effect: (minion: CardInstance) => ({
      ...minion,
      keywords: [...(minion.keywords || []), 'windfury'],
      card: {
        ...minion.card,
        description: `${minion.card.description} Windfury.`
      }
    })
  },
  {
    id: 'adapt_stats_1',
    name: '+1/+1',
    description: 'Gain +1/+1 stats.',
    effect: (minion: CardInstance) => ({
      ...minion,
      currentHealth: (minion.currentHealth || minion.card.health || 0) + 1,
      card: {
        ...minion.card,
        attack: (minion.card.attack || 0) + 1,
        health: (minion.card.health || 0) + 1,
        description: `${minion.card.description} +1/+1.`
      }
    })
  },
  {
    id: 'adapt_stats_3',
    name: '+3 Attack',
    description: 'Gain +3 Attack.',
    effect: (minion: CardInstance) => ({
      ...minion,
      card: {
        ...minion.card,
        attack: (minion.card.attack || 0) + 3,
        description: `${minion.card.description} +3 Attack.`
      }
    })
  },
  {
    id: 'adapt_health',
    name: '+3 Health',
    description: 'Gain +3 Health.',
    effect: (minion: CardInstance) => ({
      ...minion,
      currentHealth: (minion.currentHealth || minion.card.health || 0) + 3,
      card: {
        ...minion.card,
        health: (minion.card.health || 0) + 3,
        description: `${minion.card.description} +3 Health.`
      }
    })
  },
  {
    id: 'adapt_deathrattle',
    name: 'Deathrattle',
    description: 'Summon two 1/1 tokens when this minion dies.',
    effect: (minion: CardInstance) => ({
      ...minion,
      keywords: [...(minion.keywords || []), 'deathrattle'],
      card: {
        ...minion.card,
        description: `${minion.card.description} Deathrattle: Summon two 1/1 tokens.`,
        deathrattle: {
          type: 'summon',
          summonCardId: 9999, // Placeholder for a token card ID
          targetType: 'none',
          value: 2 // Number of tokens to summon
        }
      }
    })
  },
  {
    id: 'adapt_stealth',
    name: 'Stealth',
    description: 'Can\'t be attacked or targeted until it attacks.',
    effect: (minion: CardInstance) => ({
      ...minion,
      isStealth: true,
      keywords: [...(minion.keywords || []), 'stealth'],
      stealthUntilAttack: true,
      card: {
        ...minion.card,
        description: `${minion.card.description} Stealth.`
      }
    })
  },
  {
    id: 'adapt_elusive',
    name: 'Elusive',
    description: 'Can\'t be targeted by spells or Hero Powers.',
    effect: (minion: CardInstance) => ({
      ...minion,
      isElusive: true,
      keywords: [...(minion.keywords || []), 'elusive'],
      card: {
        ...minion.card,
        description: `${minion.card.description} Can't be targeted by spells or Hero Powers.`
      }
    })
  }
];

/**
 * Create an adaptation discovery state
 * @param state Current game state
 * @param sourceCardId ID of the card initiating the adapt
 * @param callback Function to call when an adaptation is selected
 * @returns Discovery state with three random adaptations
 */
export function createAdaptDiscovery(
  state: GameState,
  sourceCardId: string,
  callback: (selected: CardData | null) => void
): DiscoveryState {
  // Get three random adaptations
  const options = getRandomAdaptations(3);
  
  // Convert adaptations to card data format for discovery
  const cardOptions = options.map(adaptation => ({
    id: Number(adaptation.id.replace('adapt_', '')),
    name: adaptation.name,
    manaCost: 0,
    description: adaptation.description,
    rarity: 'common' as const,
    type: 'spell' as const,
    keywords: [],
    // Store the adaptation ID for reference when selected
    adaptationId: adaptation.id
  }));
  
  return {
    active: true,
    options: cardOptions,
    sourceCardId,
    callback,
    // Store all adaptations for reference
    allOptions: cardOptions
  };
}

/**
 * Get random adaptations from the available list
 * @param count Number of adaptations to get
 * @returns Array of random adaptations
 */
function getRandomAdaptations(count: number) {
  // Shuffle the adaptations array
  const shuffled = [...adaptations].sort(() => 0.5 - Math.random());
  
  // Return the first 'count' items
  return shuffled.slice(0, count);
}

/**
 * Apply an adaptation to a minion
 * @param state Current game state
 * @param minionId ID of the minion to adapt
 * @param playerType The player who owns the minion
 * @param adaptationId ID of the selected adaptation
 * @returns Updated game state with the adaptation applied
 */
export function applyAdaptation(
  state: GameState,
  minionId: string,
  playerType: 'player' | 'opponent',
  adaptationId: string
): GameState {
  // Create a deep copy of the state
  const newState = JSON.parse(JSON.stringify(state));
  
  // Find the minion on the battlefield
  const minion = newState.players[playerType].battlefield.find(
    card => card.instanceId === minionId
  );
  
  // If minion not found, return unchanged state
  if (!minion) {
    console.error(`Minion with ID ${minionId} not found for adaptation.`);
    return newState;
  }
  
  // Find the selected adaptation
  const adaptation = adaptations.find(adapt => adapt.id === adaptationId);
  
  // If adaptation not found, return unchanged state
  if (!adaptation) {
    console.error(`Adaptation with ID ${adaptationId} not found.`);
    return newState;
  }
  
  // Apply the adaptation effect to the minion
  const adaptedMinion = adaptation.effect(minion);
  
  // Update the minion on the battlefield
  const battlefield = newState.players[playerType].battlefield;
  const minionIndex = battlefield.findIndex(card => card.instanceId === minionId);
  
  if (minionIndex !== -1) {
    battlefield[minionIndex] = adaptedMinion;
    
    // Log the adaptation
    console.log(`${minion.card.name} adapted with ${adaptation.name}`);
  }
  
  return newState;
}

/**
 * Process an adapt effect (from battlecry, spell, etc.)
 * @param state Current game state
 * @param minionId ID of the minion to adapt
 * @param playerType The player who owns the minion
 * @returns Updated game state with adapt discovery active
 */
export function processAdapt(
  state: GameState,
  minionId: string,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a callback function to handle the selected adaptation
  const adaptCallback = (selected: CardData | null) => {
    if (selected && selected.adaptationId) {
      // Apply the selected adaptation
      return applyAdaptation(
        state,
        minionId,
        playerType,
        selected.adaptationId
      );
    }
    // If nothing selected, return unchanged state
    return state;
  };
  
  // Create the discovery state for adaptations
  const discoveryState = createAdaptDiscovery(
    state,
    minionId,
    adaptCallback
  );
  
  // Return updated state with discovery active
  return {
    ...state,
    discovery: discoveryState
  };
}