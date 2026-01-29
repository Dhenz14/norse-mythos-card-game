/**
 * FillBoard Battlecry Handler
 * 
 * Implements the "fill_board" battlecry effect.
 * Fills the board with copies of a specified minion or random minions.
 * Example card: Onyxia (ID: 20128) - fills board with 1/1 Whelps
 */
import { GameContext } from '../../../GameContext';
import { Card, BattlecryEffect, CardInstance } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';
import cardDatabase from '../../../services/cardDatabase';
import { v4 as uuidv4 } from 'uuid';

const MAX_BOARD_SIZE = 7;

/**
 * Execute a fill_board battlecry effect
 * 
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns An object indicating success or failure and any additional data
 */
export default function executeFillBoard(
  context: GameContext,
  effect: BattlecryEffect,
  sourceCard: Card
): EffectResult {
  try {
    context.logGameEvent(`Executing fill_board battlecry for ${sourceCard.name}`);
    
    const summonCardId = effect.summonCardId as number | string | undefined;
    const summonName = effect.summonName as string | undefined;
    const summonAttack = effect.summonAttack as number | undefined;
    const summonHealth = effect.summonHealth as number | undefined;
    const isRandom = effect.isRandom as boolean | undefined;
    const manaCost = effect.manaCost as number | undefined;
    
    const currentBoardSize = context.currentPlayer.board.length;
    const availableSlots = MAX_BOARD_SIZE - currentBoardSize;
    
    if (availableSlots <= 0) {
      context.logGameEvent(`Board is already full`);
      return { success: true, additionalData: { summonedCount: 0, boardFull: true } };
    }
    
    const summonedMinions: CardInstance[] = [];
    
    for (let i = 0; i < availableSlots; i++) {
      let minionCard: Card;
      
      if (isRandom) {
        let candidateMinions = cardDatabase.getCardsByType('minion');
        
        if (manaCost !== undefined) {
          candidateMinions = candidateMinions.filter(card => card.manaCost === manaCost);
        }
        
        if (candidateMinions.length === 0) {
          context.logGameEvent(`No minions available to fill board`);
          break;
        }
        
        const randomIndex = Math.floor(Math.random() * candidateMinions.length);
        const selectedCard = candidateMinions[randomIndex];
        
        minionCard = {
          id: selectedCard.id,
          name: selectedCard.name,
          description: selectedCard.description || '',
          manaCost: selectedCard.manaCost || 0,
          type: 'minion',
          rarity: selectedCard.rarity || 'common',
          heroClass: selectedCard.heroClass || (selectedCard as any).class || 'neutral',
          attack: selectedCard.attack || 1,
          health: selectedCard.health || 1,
          keywords: selectedCard.keywords || []
        };
      } else if (summonCardId) {
        const cardData = cardDatabase.getCardById(summonCardId);
        
        if (cardData) {
          minionCard = {
            id: cardData.id,
            name: cardData.name,
            description: cardData.description || '',
            manaCost: cardData.manaCost || 0,
            type: 'minion',
            rarity: cardData.rarity || 'token',
            heroClass: cardData.heroClass || (cardData as any).class || 'neutral',
            attack: summonAttack !== undefined ? summonAttack : (cardData.attack || 1),
            health: summonHealth !== undefined ? summonHealth : (cardData.health || 1),
            keywords: cardData.keywords || []
          };
        } else {
          minionCard = {
            id: typeof summonCardId === 'number' ? summonCardId : parseInt(summonCardId, 10) || 99999,
            name: summonName || 'Summoned Minion',
            description: 'Summoned by fill_board effect',
            manaCost: 1,
            type: 'minion',
            rarity: 'token',
            heroClass: 'neutral',
            attack: summonAttack !== undefined ? summonAttack : 1,
            health: summonHealth !== undefined ? summonHealth : 1,
            keywords: []
          };
        }
      } else {
        minionCard = {
          id: 99990 + i,
          name: summonName || 'Whelp',
          description: 'Summoned by fill_board effect',
          manaCost: 1,
          type: 'minion',
          rarity: 'token',
          heroClass: 'neutral',
          attack: summonAttack !== undefined ? summonAttack : 1,
          health: summonHealth !== undefined ? summonHealth : 1,
          keywords: []
        };
      }
      
      const minionInstance: CardInstance = {
        instanceId: uuidv4(),
        card: minionCard,
        currentHealth: minionCard.health || 1,
        currentAttack: minionCard.attack || 1,
        canAttack: false,
        isPlayed: true,
        isSummoningSick: true,
        attacksPerformed: 0
      };
      
      context.currentPlayer.board.push(minionInstance);
      summonedMinions.push(minionInstance);
    }
    
    context.logGameEvent(`Filled board with ${summonedMinions.length} minions`);
    
    return { 
      success: true, 
      additionalData: { 
        summonedCount: summonedMinions.length,
        summonedMinions 
      } 
    };
  } catch (error) {
    console.error(`Error executing fill_board:`, error);
    return { 
      success: false, 
      error: `Error executing fill_board: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
