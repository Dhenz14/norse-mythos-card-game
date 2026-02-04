/**
 * Effect System Initialization
 * 
 * This file initializes the card effect system and integrates it with the existing game code.
 * It's designed to serve as a single import that handles all necessary setup.
 */
import { registerAllEffectHandlers } from './handlers/registerHandlers';
import { registerWarriorHandlers } from './warriorHandlers';

// Import the bridge modules
import { executeBattlecry } from './handlers/battlecryBridge';
import { executeDeathrattle } from './handlers/deathrattleBridge';
import { executeSpell } from './handlers/spellBridge';

/**
 * Initialize the card effect system
 * This should be called once when the game starts
 */
export function initEffectSystem() {
  
  // Register all effect handlers with the EffectRegistry
  registerAllEffectHandlers();
  
  // Register Warrior-specific effect handlers
  registerWarriorHandlers();
  
  // Override the global functions with our bridged versions
  // This is done by exporting them from this module
  
}

// Export the bridge functions to replace the original ones
export { executeBattlecry, executeDeathrattle, executeSpell };

// Default export for direct import
export default initEffectSystem;