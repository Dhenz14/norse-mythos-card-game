/**
 * Transform Copy Battlecry Handler
 * 
 * Implements the "transform_copy" battlecry effect.
 * Example: Prince Taldaram (transforms into a 3/3 copy of a minion)
 */
import { debug } from '../../../config/debugConfig';
import { GameContext } from '../../../GameContext';
import { Card, BattlecryEffect, CardInstance } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';

/**
 * Execute a transform_copy battlecry effect
 * 
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns Updated game state
 */
export default function executeTransformCopyTransformCopy(
  context: GameContext, 
  effect: BattlecryEffect, 
  sourceCard: Card
): EffectResult {
  // Create a temporary CardInstance for targeting purposes
  const sourceCardInstance: any = {
    instanceId: 'temp-' + Date.now(),
    card: sourceCard,
    canAttack: false,
    isPlayed: true,
    isSummoningSick: false,
    attacksPerformed: 0
  };
  
  try {
    // Log the effect execution
    context.logGameEvent(`Executing battlecry:transform_copy for ${sourceCard.name}`);
    
    // Check if we need a target
    if (!effect.requiresTarget) {
      return { 
        success: false, 
        error: 'Transform copy effect requires a target' 
      };
    }
    
    // Get valid targets
    const targets = context.getTargets(effect.targetType || 'any_minion', sourceCardInstance);
    
    if (targets.length === 0) {
      context.logGameEvent(`No valid targets for transform_copy effect`);
      return { success: false, error: 'No valid targets' };
    }
    
    // Check for condition like "no_3_cost_cards" (for Prince Taldaram)
    if (effect.condition === 'no_3_cost_cards') {
      // Get all cards in the deck
      const deckCards = context.currentPlayer.deck;
      
      // Check if there are any 3-cost cards in the deck
      const has3CostCards = deckCards.some(card => card.card.manaCost === 3);
      
      if (has3CostCards) {
        context.logGameEvent(`Condition not met: Player has 3-cost cards in deck`);
        return { 
          success: false, 
          error: 'Player has 3-cost cards in deck - condition not met'
        };
      }
    }
    
    // Process the target (typically a minion to copy)
    const targetCard = targets[0]; // Assuming first valid target if multiple exist
    
    if (!targetCard || !targetCard.card) {
      context.logGameEvent(`Transform copy failed - invalid target`);
      return { success: false, error: 'Invalid target' };
    }
    
    // Find the source card in the battlefield to transform it
    let sourceInstance: CardInstance | undefined;
    
    for (let i = 0; i < context.currentPlayer.board.length; i++) {
      if (context.currentPlayer.board[i].card.id === sourceCard.id) {
        sourceInstance = context.currentPlayer.board[i];
        break;
      }
    }
    
    if (!sourceInstance) {
      context.logGameEvent(`Transform copy failed - source card not found on battlefield`);
      return { success: false, error: 'Source card not found on battlefield' };
    }
    
    // Create a copy of the target card with specific stats (e.g., 3/3 for Prince Taldaram)
    const copiedCardStats = {
      ...targetCard.card,
      attack: effect.attack || 3, // Default to 3 for Prince Taldaram
      health: effect.health || 3, // Default to 3 for Prince Taldaram
      
      // Keep original card ID and name to track that this card was transformed
      originalCardId: sourceCard.id,
      originalCardName: sourceCard.name
    };
    
    // Update the source card with the copied properties
    sourceInstance.card = {
      ...sourceInstance.card,
      ...copiedCardStats
    };
    
    // Update the current health to match the new health
    sourceInstance.currentHealth = copiedCardStats.health;
    
    context.logGameEvent(`${sourceCard.name} transformed into a ${effect.attack || 3}/${effect.health || 3} copy of ${targetCard.card.name}`);
    
    return { 
      success: true,
      additionalData: {
        transformedCard: sourceInstance,
        targetCard: targetCard
      }
    };
  } catch (error) {
    debug.error(`Error executing battlecry:transform_copy:`, error);
    return { 
      success: false, 
      error: `Error executing battlecry:transform_copy: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}