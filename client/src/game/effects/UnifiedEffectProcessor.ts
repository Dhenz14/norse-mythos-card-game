/**
 * Unified Effect Processor
 * 
 * This centralizes all card effect processing while maintaining backward compatibility
 * with existing utility files. It provides a single entry point for all effect execution.
 */

import { GameState, CardInstance } from '../types';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';
import { EffectRegistry } from './EffectRegistry';

// Import existing utility functions as fallbacks
import { executeBattlecry as originalExecuteBattlecry } from '../utils/battlecryUtils';
import { executeDeathrattle as originalExecuteDeathrattle } from '../utils/deathrattleUtils';
import { executeSpell as originalExecuteSpell } from '../utils/spellUtils';
import { executeComboEffect as originalExecuteCombo } from '../utils/comboUtils';

export interface EffectExecutionContext {
  state: GameState;
  sourceCard: CardInstanceWithCardData;
  targetId?: string;
  targetType?: 'minion' | 'hero';
  playerId?: 'player' | 'opponent';
}

export interface EffectExecutionResult {
  success: boolean;
  newState: GameState;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Unified Effect Processor - Single entry point for all card effects
 */
export class UnifiedEffectProcessor {
  
  /**
   * Execute a battlecry effect
   */
  static executeBattlecry(context: EffectExecutionContext): EffectExecutionResult {
    const { state, sourceCard, targetId, targetType } = context;
    
    if (!sourceCard.card.battlecry) {
      return { success: true, newState: state };
    }

    try {
      // Check if we have a registered handler in the new system
      if (EffectRegistry.hasHandler('battlecry', sourceCard.card.battlecry.type)) {
        
        // Use the new registry system
        const result = EffectRegistry.executeBattlecry(
          state as any, // Convert to GameContext
          sourceCard.card.battlecry,
          sourceCard.card as any
        );
        
        if (result.success) {
          return {
            success: true,
            newState: result.additionalData || state,
            metadata: result.metadata
          };
        } else {
          throw new Error(result.error);
        }
      } else {
        
        // Fall back to original implementation
        const newState = originalExecuteBattlecry(state, sourceCard.instanceId || '', targetId, targetType);
        return { success: true, newState };
      }
    } catch (error) {
      console.error(`Error in battlecry execution for ${sourceCard.card.name}:`, error);
      return {
        success: false,
        newState: state,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute a deathrattle effect
   */
  static executeDeathrattle(context: EffectExecutionContext): EffectExecutionResult {
    const { state, sourceCard, playerId = 'player' } = context;
    
    if (!sourceCard.card.deathrattle) {
      return { success: true, newState: state };
    }

    try {
      // Check if we have a registered handler in the new system
      if (EffectRegistry.hasHandler('deathrattle', sourceCard.card.deathrattle.type)) {
        
        // Use the new registry system
        const result = EffectRegistry.executeDeathrattle(
          state as any, // Convert to GameContext
          sourceCard.card.deathrattle,
          sourceCard.card as any
        );
        
        if (result.success) {
          return {
            success: true,
            newState: result.additionalData || state,
            metadata: result.metadata
          };
        } else {
          throw new Error(result.error);
        }
      } else {
        
        // Fall back to original implementation
        const newState = originalExecuteDeathrattle(state, sourceCard, playerId);
        return { success: true, newState };
      }
    } catch (error) {
      console.error(`Error in deathrattle execution for ${sourceCard.card.name}:`, error);
      return {
        success: false,
        newState: state,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute a spell effect
   */
  static executeSpell(context: EffectExecutionContext): EffectExecutionResult {
    const { state, sourceCard, targetId, targetType } = context;
    
    if (!sourceCard.card.spellEffect) {
      return { success: true, newState: state };
    }

    try {
      // Check if we have a registered handler in the new system
      if (EffectRegistry.hasHandler('spellEffect', sourceCard.card.spellEffect.type)) {
        
        // Use the new registry system
        const result = EffectRegistry.executeSpellEffect(
          state as any, // Convert to GameContext
          sourceCard.card.spellEffect,
          sourceCard.card as any
        );
        
        if (result.success) {
          return {
            success: true,
            newState: result.additionalData || state,
            metadata: result.metadata
          };
        } else {
          throw new Error(result.error);
        }
      } else {
        
        // Fall back to original implementation
        const newState = originalExecuteSpell(state, sourceCard, targetId, targetType);
        return { success: true, newState };
      }
    } catch (error) {
      console.error(`Error in spell execution for ${sourceCard.card.name}:`, error);
      return {
        success: false,
        newState: state,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute a combo effect
   */
  static executeCombo(context: EffectExecutionContext): EffectExecutionResult {
    const { state, sourceCard, targetId, targetType } = context;
    
    if (!sourceCard.card.battlecry || !sourceCard.card.keywords?.includes('combo')) {
      return { success: true, newState: state };
    }

    try {
      // Check if we have a registered combo handler
      if (EffectRegistry.hasHandler('combo', sourceCard.card.battlecry.type)) {
        
        // Use the new registry system
        const result = EffectRegistry.executeCombo(
          state as any, // Convert to GameContext
          sourceCard.card.battlecry,
          sourceCard.card as any
        );
        
        if (result.success) {
          return {
            success: true,
            newState: result.additionalData || state,
            metadata: result.metadata
          };
        } else {
          throw new Error(result.error);
        }
      } else {
        
        // Fall back to original implementation
        const newState = originalExecuteCombo(state, sourceCard.instanceId, targetId, targetType);
        return { success: true, newState };
      }
    } catch (error) {
      console.error(`Error in combo execution for ${sourceCard.card.name}:`, error);
      return {
        success: false,
        newState: state,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute any card effect based on the card's properties
   */
  static executeCardEffect(
    effectType: 'battlecry' | 'deathrattle' | 'spell' | 'combo',
    context: EffectExecutionContext
  ): EffectExecutionResult {
    switch (effectType) {
      case 'battlecry':
        return this.executeBattlecry(context);
      case 'deathrattle':
        return this.executeDeathrattle(context);
      case 'spell':
        return this.executeSpell(context);
      case 'combo':
        return this.executeCombo(context);
      default:
        return {
          success: false,
          newState: context.state,
          error: `Unknown effect type: ${effectType}`
        };
    }
  }
}