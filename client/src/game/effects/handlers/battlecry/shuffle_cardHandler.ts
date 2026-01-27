/**
 * Shuffle Card Battlecry Handler
 * 
 * Implements the "shuffle_card" battlecry effect.
 * Example: Ancient Shade (shuffles a curse into your deck)
 */
import { GameContext } from '../../../GameContext';
import { Card, BattlecryEffect } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';

/**
 * Execute a shuffle_card battlecry effect
 * 
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns Updated game state
 */
export default function executeShuffleCardShuffleCard(
  context: GameContext, 
  effect: BattlecryEffect, 
  sourceCard: Card
): EffectResult {
  try {
    // Log the effect execution
    context.logGameEvent(`Executing battlecry:shuffle_card for ${sourceCard.name}`);
    
    // Get effect properties with defaults
    const cardType = effect.cardType || 'ancient_curse';
    const value = effect.value || 1; // Number of cards to shuffle
    
    // Create a card based on the cardType
    let cardToShuffle: Card;
    
    switch (cardType) {
      case 'ancient_curse':
        cardToShuffle = {
          id: 90001, // Using a high ID to avoid conflicts
          name: 'Ancient Curse',
          type: 'spell',
          manaCost: 0,
          rarity: 'common',
          heroClass: 'neutral',
          description: 'When drawn, deal 7 damage to your hero.',
          keywords: [],
          spellEffect: {
            type: 'self_damage',
            value: 7,
            requiresTarget: false,
            whenDrawn: true
          }
        };
        break;
        
      case 'scroll_of_wonder':
        cardToShuffle = {
          id: 90002,
          name: 'Scroll of Wonder',
          type: 'spell',
          manaCost: 0,
          rarity: 'epic',
          heroClass: 'neutral',
          description: 'Cast a random spell. Draw a card.',
          keywords: [],
          spellEffect: {
            type: 'random_spell',
            requiresTarget: false,
            whenDrawn: true,
            drawCard: true
          }
        };
        break;
        
      case 'bomb':
        cardToShuffle = {
          id: 90003,
          name: 'Bomb',
          type: 'spell',
          manaCost: 0,
          rarity: 'common',
          heroClass: 'neutral',
          description: 'When drawn, deal 5 damage to your hero.',
          keywords: [],
          spellEffect: {
            type: 'self_damage',
            value: 5,
            requiresTarget: false,
            whenDrawn: true
          }
        };
        break;
        
      default:
        return { 
          success: false, 
          error: `Unknown card type to shuffle: ${cardType}` 
        };
    }
    
    // Determine which player's deck to shuffle cards into
    // By default, shuffle into the current player's deck (the player who played the card)
    const targetDeck = effect.targetDeck === 'opponent' ? context.opponentPlayer.deck : context.currentPlayer.deck;
    
    // Shuffle the specified number of cards
    for (let i = 0; i < value; i++) {
      // Create a unique instance ID for the card
      const instanceId = `${cardType}-${Date.now()}-${i}`;
      
      // Create the card instance
      const cardInstance = {
        instanceId,
        card: cardToShuffle,
        currentHealth: cardToShuffle.health,
        canAttack: false,
        isPlayed: false,
        isSummoningSick: true,
        attacksPerformed: 0
      };
      
      // Add the card to a random position in the deck
      const insertPosition = Math.floor(Math.random() * (targetDeck.length + 1));
      targetDeck.splice(insertPosition, 0, cardInstance);
      
      context.logGameEvent(`Shuffled ${cardToShuffle.name} into the ${effect.targetDeck === 'opponent' ? 'opponent' : 'player'}'s deck`);
    }
    
    return { 
      success: true,
      additionalData: {
        cardType,
        cardShuffled: cardToShuffle,
        numberOfCards: value
      }
    };
  } catch (error) {
    console.error(`Error executing battlecry:shuffle_card:`, error);
    return { 
      success: false, 
      error: `Error executing battlecry:shuffle_card: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}