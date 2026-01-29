/**
 * SummonRandomMinions Battlecry Handler
 * 
 * Implements the "summon_random_minions" battlecry effect.
 * Summons X random minions matching specific criteria (mana cost, race, etc.)
 */
import { GameContext } from '../../../GameContext';
import { Card, BattlecryEffect, CardInstance } from '../../../types/CardTypes';
import { EffectResult } from '../../../types/EffectTypes';
import cardDatabase from '../../../services/cardDatabase';
import { v4 as uuidv4 } from 'uuid';

const MAX_BOARD_SIZE = 7;

/**
 * Execute a summon_random_minions battlecry effect
 * 
 * @param context - The game context
 * @param effect - The effect data
 * @param sourceCard - The card that triggered the effect
 * @returns An object indicating success or failure and any additional data
 */
export default function executeSummonRandomMinions(
  context: GameContext,
  effect: BattlecryEffect,
  sourceCard: Card
): EffectResult {
  try {
    context.logGameEvent(`Executing summon_random_minions battlecry for ${sourceCard.name}`);
    
    const count = effect.value || effect.count || 1;
    const targetManaCost = effect.manaCost as number | undefined;
    const minManaCost = effect.minManaCost as number | undefined;
    const maxManaCost = effect.maxManaCost as number | undefined;
    const race = effect.race as string | undefined;
    const rarity = effect.rarity as string | undefined;
    const upgradesInHand = effect.upgradesInHand as boolean | undefined;
    
    const currentBoardSize = context.currentPlayer.board.length;
    const availableSlots = MAX_BOARD_SIZE - currentBoardSize;
    
    if (availableSlots <= 0) {
      context.logGameEvent(`Board is full, cannot summon any minions`);
      return { success: true, additionalData: { summonedCount: 0 } };
    }
    
    const actualCount = Math.min(count, availableSlots);
    
    let candidateMinions = cardDatabase.getCardsByType('minion');
    
    if (targetManaCost !== undefined) {
      candidateMinions = candidateMinions.filter(card => card.manaCost === targetManaCost);
    }
    
    if (minManaCost !== undefined) {
      candidateMinions = candidateMinions.filter(card => card.manaCost >= minManaCost);
    }
    
    if (maxManaCost !== undefined) {
      candidateMinions = candidateMinions.filter(card => card.manaCost <= maxManaCost);
    }
    
    if (race) {
      candidateMinions = candidateMinions.filter(card => (card as any).race === race);
    }
    
    if (rarity) {
      candidateMinions = candidateMinions.filter(card => card.rarity === rarity);
    }
    
    if (candidateMinions.length === 0) {
      context.logGameEvent(`No minions found matching criteria`);
      return { success: false, error: 'No minions found matching criteria' };
    }
    
    const summonedMinions: CardInstance[] = [];
    const usedIndices = new Set<number>();
    
    for (let i = 0; i < actualCount; i++) {
      let availableCandidates = candidateMinions.filter((_, idx) => !usedIndices.has(idx));
      
      if (availableCandidates.length === 0) {
        availableCandidates = candidateMinions;
        usedIndices.clear();
      }
      
      const randomIndex = Math.floor(Math.random() * availableCandidates.length);
      const selectedCard = availableCandidates[randomIndex];
      const originalIndex = candidateMinions.indexOf(selectedCard);
      usedIndices.add(originalIndex);
      
      const minionInstance: CardInstance = {
        instanceId: uuidv4(),
        card: {
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
        },
        currentHealth: selectedCard.health || 1,
        currentAttack: selectedCard.attack || 1,
        canAttack: false,
        isPlayed: true,
        isSummoningSick: true,
        attacksPerformed: 0
      };
      
      context.currentPlayer.board.push(minionInstance);
      summonedMinions.push(minionInstance);
      
      context.logGameEvent(`Summoned ${selectedCard.name} (${selectedCard.attack}/${selectedCard.health})`);
    }
    
    if (upgradesInHand && summonedMinions.length > 0) {
      context.logGameEvent(`Upgrade effect in hand triggered`);
    }
    
    return { 
      success: true, 
      additionalData: { 
        summonedCount: summonedMinions.length,
        summonedMinions 
      } 
    };
  } catch (error) {
    console.error(`Error executing summon_random_minions:`, error);
    return { 
      success: false, 
      error: `Error executing summon_random_minions: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
