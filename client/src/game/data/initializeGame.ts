/**
 * Game Initialization Module
 * 
 * This module provides a central place to initialize all game resources
 * including cards, effects, and other game assets.
 */
import { initializeCardDatabase } from './cardManagement';
import { initializeEffectHandlers } from '../effects/initializeEffects';

/**
 * Initialize all game resources
 * 
 * This function should be called at game startup to set up
 * all cards, effects, and other resources needed for gameplay.
 */
export function initializeGameResources(): void {
  console.log('Initializing game resources...');
  
  // Initialize cards
  initializeCardDatabase();
  
  // Initialize effect handlers
  initializeEffectHandlers();
  
  console.log('Game resources initialized successfully.');
}