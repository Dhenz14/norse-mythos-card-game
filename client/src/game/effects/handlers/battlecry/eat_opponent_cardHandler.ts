/**
 * Eat Opponent Card Effect Handler
 * 
 * This handler implements the battlecry:eat_opponent_card effect.
 * Used by Mutanus the Devourer: "Battlecry: Eat a minion in your opponent's hand. Gain its stats."
 */
import { debug } from '../../../config/debugConfig';
import { GameContext } from '../../../GameContext';
import { Card, BattlecryEffect, CardInstance } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';

/**
 * Execute an Eat Opponent Card effect
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns An object indicating success or failure and any additional data
 */
export default function executeEatOpponentCardEatOpponentCard(
  context: GameContext, 
  effect: BattlecryEffect, 
  sourceCard: Card
): EffectResult {
  try {
    // Log the effect execution
    context.logGameEvent(`Executing battlecry:eat_opponent_card for ${sourceCard.name}`);
    
    // Get opponent's hand
    const opponentHand = context.opponentPlayer.hand;
    
    // Filter for minions in the opponent's hand
    const minionsInHand = opponentHand.filter(card => card.card.type === 'minion');
    
    // If there are no minions in the opponent's hand, return with no effect
    if (minionsInHand.length === 0) {
      context.logGameEvent(`No minions found in opponent's hand for ${sourceCard.name} to eat`);
      return { success: true, additionalData: { message: "No minions to eat" } };
    }
    
    // Get a random minion from the opponent's hand if isRandom is true (default behavior for Mutanus)
    const isRandom = effect.isRandom === undefined ? true : effect.isRandom;
    let targetMinion: CardInstance;
    
    if (isRandom) {
      // Pick a random minion
      const randomIndex = Math.floor(Math.random() * minionsInHand.length);
      targetMinion = minionsInHand[randomIndex];
    } else if (effect.targetIndex !== undefined) {
      // Use a specific index if provided
      targetMinion = minionsInHand[effect.targetIndex];
    } else {
      // Default to the first minion if no random or specific index
      targetMinion = minionsInHand[0];
    }
    
    if (!targetMinion) {
      context.logGameEvent(`Failed to find a valid target minion for ${sourceCard.name}`);
      return { success: false, error: "Invalid target" };
    }
    
    // Get the target minion's stats
    const targetAttack = targetMinion.card.attack || 0;
    const targetHealth = targetMinion.card.health || 0;
    
    // Log the action
    context.logGameEvent(`${sourceCard.name} devours ${targetMinion.card.name} (${targetAttack}/${targetHealth}) from opponent's hand`);
    
    // Remove the eaten minion from opponent's hand
    context.opponentPlayer.hand = context.opponentPlayer.hand.filter(
      card => card.instanceId !== targetMinion.instanceId
    );
    
    // Find the Mutanus card on the battlefield to buff it
    const currentPlayerBoard = context.currentPlayer.board;
    const sourceCardOnBoard = currentPlayerBoard.find(
      card => card.card.id === sourceCard.id && card.isPlayed
    );
    
    if (sourceCardOnBoard) {
      // Get current stats
      const currentAttack = sourceCardOnBoard.card.attack || 0;
      const currentHealth = sourceCardOnBoard.card.health || 0;
      const currentHealthValue = sourceCardOnBoard.currentHealth || currentHealth;
      
      // Update card stats
      sourceCardOnBoard.card = {
        ...sourceCardOnBoard.card,
        attack: currentAttack + targetAttack,
        health: currentHealth + targetHealth
      };
      
      // Update current health
      sourceCardOnBoard.currentHealth = currentHealthValue + targetHealth;
      
      context.logGameEvent(`${sourceCard.name} gains +${targetAttack}/+${targetHealth} stats`);
    } else {
      context.logGameEvent(`Warning: Could not find ${sourceCard.name} on the battlefield to apply stat buff`);
    }
    
    return { 
      success: true,
      additionalData: {
        message: `Ate ${targetMinion.card.name} and gained +${targetAttack}/+${targetHealth}`,
        eatenCard: targetMinion.card,
        statsGained: { attack: targetAttack, health: targetHealth }
      }
    };
  } catch (error) {
    debug.error(`Error executing battlecry:eat_opponent_card:`, error);
    return { 
      success: false, 
      error: `Error executing battlecry:eat_opponent_card: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}