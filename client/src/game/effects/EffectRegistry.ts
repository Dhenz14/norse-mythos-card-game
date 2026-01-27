/**
 * Effect Registry System
 * 
 * This module provides a centralized registry for all card effect handlers.
 * It manages the registration and execution of battlecry, deathrattle, spell effects and more.
 */
import { GameContext } from '../GameContext';
import { Card, SpellEffect, BattlecryEffect, DeathrattleEffect } from '../types/CardTypes';
import { EffectResult } from '../types/EffectTypes';

// Type definitions for effect handlers
export type BattlecryHandler = (context: GameContext, effect: BattlecryEffect, sourceCard: Card) => EffectResult;
export type DeathrattleHandler = (context: GameContext, effect: DeathrattleEffect, sourceCard: Card) => EffectResult;
export type SpellEffectHandler = (context: GameContext, effect: SpellEffect, sourceCard: Card) => EffectResult;

/**
 * Central registry for all card effect handlers
 */
export class EffectRegistry {
  // Handler registries
  private static battlecryHandlers: Record<string, BattlecryHandler> = {};
  private static deathrattleHandlers: Record<string, DeathrattleHandler> = {};
  private static spellEffectHandlers: Record<string, SpellEffectHandler> = {};
  private static comboHandlers: Record<string, BattlecryHandler> = {};
  
  // Handler registration methods
  static registerBattlecryHandler(type: string, handler: BattlecryHandler): void {
    this.battlecryHandlers[type] = handler;
    console.log(`Registered battlecry handler for type: ${type}`);
  }
  
  static registerDeathrattleHandler(type: string, handler: DeathrattleHandler): void {
    this.deathrattleHandlers[type] = handler;
    console.log(`Registered deathrattle handler for type: ${type}`);
  }
  
  static registerSpellEffectHandler(type: string, handler: SpellEffectHandler): void {
    this.spellEffectHandlers[type] = handler;
    console.log(`Registered spell effect handler for type: ${type}`);
  }
  
  static registerComboHandler(type: string, handler: BattlecryHandler): void {
    this.comboHandlers[type] = handler;
    console.log(`Registered combo handler for type: ${type}`);
  }
  
  // Effect execution methods
  static executeBattlecry(context: GameContext, effect: BattlecryEffect, sourceCard: Card): EffectResult {
    const handler = this.battlecryHandlers[effect.type];
    
    if (!handler) {
      console.error(`Unknown battlecry type: ${effect.type}`);
      return { success: false, error: `Unknown battlecry type: ${effect.type}` };
    }
    
    try {
      return handler(context, effect, sourceCard);
    } catch (error) {
      console.error(`Error executing battlecry ${effect.type}:`, error);
      return { 
        success: false, 
        error: `Error executing battlecry ${effect.type}: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
  
  static executeDeathrattle(context: GameContext, effect: DeathrattleEffect, sourceCard: Card): EffectResult {
    const handler = this.deathrattleHandlers[effect.type];
    
    if (!handler) {
      console.error(`Unknown deathrattle type: ${effect.type}`);
      return { success: false, error: `Unknown deathrattle type: ${effect.type}` };
    }
    
    try {
      return handler(context, effect, sourceCard);
    } catch (error) {
      console.error(`Error executing deathrattle ${effect.type}:`, error);
      return { 
        success: false, 
        error: `Error executing deathrattle ${effect.type}: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
  
  static executeSpellEffect(context: GameContext, effect: SpellEffect, sourceCard: Card): EffectResult {
    const handler = this.spellEffectHandlers[effect.type];
    
    if (!handler) {
      console.error(`Unknown spell effect type: ${effect.type}`);
      return { success: false, error: `Unknown spell effect type: ${effect.type}` };
    }
    
    try {
      return handler(context, effect, sourceCard);
    } catch (error) {
      console.error(`Error executing spell effect ${effect.type}:`, error);
      return { 
        success: false, 
        error: `Error executing spell effect ${effect.type}: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
  
  static executeCombo(context: GameContext, effect: BattlecryEffect, sourceCard: Card): EffectResult {
    const handler = this.comboHandlers[effect.type];
    
    if (!handler) {
      console.error(`Unknown combo type: ${effect.type}`);
      return { success: false, error: `Unknown combo type: ${effect.type}` };
    }
    
    try {
      return handler(context, effect, sourceCard);
    } catch (error) {
      console.error(`Error executing combo ${effect.type}:`, error);
      return { 
        success: false, 
        error: `Error executing combo ${effect.type}: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
  
  // Utility methods
  
  /**
   * Check if an effect type has a registered handler
   */
  static hasHandler(effectCategory: 'battlecry' | 'deathrattle' | 'spellEffect' | 'combo', type: string): boolean {
    switch (effectCategory) {
      case 'battlecry':
        return !!this.battlecryHandlers[type];
      case 'deathrattle':
        return !!this.deathrattleHandlers[type];
      case 'spellEffect':
        return !!this.spellEffectHandlers[type];
      case 'combo':
        return !!this.comboHandlers[type];
      default:
        return false;
    }
  }
  
  /**
   * Get a list of all registered handlers by category
   */
  static getRegisteredHandlers(category?: 'battlecry' | 'deathrattle' | 'spellEffect' | 'combo'): string[] {
    if (category) {
      switch (category) {
        case 'battlecry':
          return Object.keys(this.battlecryHandlers);
        case 'deathrattle':
          return Object.keys(this.deathrattleHandlers);
        case 'spellEffect':
          return Object.keys(this.spellEffectHandlers);
        case 'combo':
          return Object.keys(this.comboHandlers);
      }
    }
    
    return [
      ...Object.keys(this.battlecryHandlers).map(type => `battlecry:${type}`),
      ...Object.keys(this.deathrattleHandlers).map(type => `deathrattle:${type}`),
      ...Object.keys(this.spellEffectHandlers).map(type => `spellEffect:${type}`),
      ...Object.keys(this.comboHandlers).map(type => `combo:${type}`)
    ];
  }
}

// Export default instance
export default EffectRegistry;