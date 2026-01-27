/**
 * Discover From Graveyard Battlecry Handler
 * 
 * This handler allows a player to discover a minion from the graveyard.
 * Used by Necromancer cards like Grave Robber.
 */
import { GameContext } from '../../../GameContext';
import { Card } from '../../../types/CardTypes';
import { BattlecryEffect } from '../../../types';
import { EffectResult } from '../../../types/EffectTypes';
import { getGraveyard, GraveyardMinion } from '../../../data/cardManagement/graveyardTracker';
import { triggerDiscovery } from '../../../utils/discoveryUtils';

/**
 * Execute a battlecry that discovers a minion from the graveyard
 */
function executeDiscoverFromGraveyardDiscoverFromGraveyard(
  context: GameContext, 
  effect: BattlecryEffect, 
  sourceCard: Card
): EffectResult {
  // Get all minions from the graveyard
  const graveyard = getGraveyard();
  
  // Check if graveyard is empty
  if (graveyard.length === 0) {
    console.log('Cannot discover from empty graveyard');
    return { 
      success: false,
      error: 'The graveyard is empty - no minions have died yet' 
    };
  }
  
  // Check if we have a condition to check
  if (effect.condition && typeof effect.condition === 'object') {
    // Check for minimum graveyard size
    if (effect.condition.check === 'graveyard_size' && 
        effect.condition.minimum && 
        graveyard.length < effect.condition.minimum) {
      console.log(`Not enough minions in graveyard (${graveyard.length} < ${effect.condition.minimum})`);
      return { 
        success: false,
        error: `Not enough minions have died yet (${graveyard.length}/${effect.condition.minimum})` 
      };
    }
  }
  
  // Convert graveyard minions to card format for discovery
  const discoveryCards = graveyard.map((minion: GraveyardMinion) => ({
    id: minion.id,
    name: minion.name,
    manaCost: minion.manaCost,
    type: minion.type,
    attack: minion.attack,
    health: minion.health,
    rarity: minion.rarity,
    class: minion.class,
    race: minion.race,
    description: minion.description || '',
    keywords: minion.keywords || [],
    battlecry: minion.effects.battlecry,
    deathrattle: minion.effects.deathrattle,
    // Copy other properties as needed
  }));
  
  try {
    // Determine how many cards to offer in discovery
    const count = effect.discoveryCount || 3;
    
    // Choose random options if we have more than count
    let discoveryOptions = discoveryCards;
    if (discoveryCards.length > count) {
      // Shuffle and take first 'count' items
      discoveryOptions = [...discoveryCards]
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
    }
    
    // Trigger the discovery UI
    triggerDiscovery(context, discoveryOptions, (selectedCard) => {
      if (selectedCard) {
        // Add the selected card to the player's hand
        context.addCardToHand(selectedCard, 'player');
        
        // Log the selection
        console.log(`Discovered ${selectedCard.name} from graveyard`);
      }
    });
    
    return { 
      success: true, 
      info: `Discovering from ${graveyard.length} minions in graveyard`
    };
  } catch (error) {
    console.error('Error in discover_from_graveyard effect:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export default executeDiscoverFromGraveyardDiscoverFromGraveyard;