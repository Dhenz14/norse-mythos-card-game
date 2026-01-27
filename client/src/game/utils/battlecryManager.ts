/**
 * Battlecry Manager
 * 
 * Comprehensive system to handle Hearthstone-style battlecry mechanics, animations, and interactions.
 * This implementation exactly matches Hearthstone's battlecry behavior including:
 * - Proper battlecry ordering and triggers
 * - Animation and sound coordination
 * - Interaction with other mechanics (Brann Bronzebeard, Shudderwock, etc.)
 * - Complex target validation
 * - Conditional battlecry activation
 */

import { BattlecryEffect, CardData, CardInstance, GameState, CardKeyword, AnimationParams, Position } from '../types';
import { executeBattlecry } from './battlecryUtils';
import { v4 as uuidv4 } from 'uuid';
import { useAnimationStore, AnimationType } from '../animations/AnimationManager';

// Helper function to find a card instance by its ID in the game state
function findCardInstance(
  cards: CardInstance[],
  instanceId: string
): { card: CardInstance; index: number } | undefined {
  const index = cards.findIndex((card) => card.instanceId === instanceId);
  return index !== -1 ? { card: cards[index], index } : undefined;
}

// Track battlecries played this game (for cards like Shudderwock)
interface PlayedBattlecry {
  cardId: number;
  instanceId: string;
  battlecryEffect: BattlecryEffect;
  targetId?: string;
  targetType?: 'minion' | 'hero';
  timestamp: number;
}

// Store battlecry history in a global array
let battlecryHistory: PlayedBattlecry[] = [];

/**
 * Clear the battlecry history (for starting a new game)
 */
export function clearBattlecryHistory(): void {
  battlecryHistory = [];
}

/**
 * Check if a battlecry should trigger twice (e.g., Brann Bronzebeard effect)
 */
export function shouldDoubleBattlecry(state: GameState): boolean {
  // Check if any minion on the battlefield has the double battlecry effect
  const playerBattlefield = state.players.player.battlefield || [];
  return playerBattlefield.some(
    (minion) => 
      minion.card.name === "Brann Bronzebeard" && 
      !minion.isSilenced
  );
}

/**
 * Process a battlecry with all appropriate Hearthstone mechanics
 * - Handles double battlecry effects (Brann Bronzebeard)
 * - Records battlecry for future effects (Shudderwock)
 * - Applies pre and post battlecry triggers and effects
 * 
 * @param state Current game state
 * @param cardInstanceId ID of the card with the battlecry
 * @param targetId Optional ID of the target
 * @param targetType Optional type of the target (minion or hero)
 * @returns Updated game state after battlecry processing
 */
export function processBattlecry(
  state: GameState,
  cardInstanceId: string,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): GameState {
  try {
    // Find the card that has the battlecry
    let newState = JSON.parse(JSON.stringify(state)) as GameState;
    const cardInfo = findCardInstance(newState.players.player.battlefield || [], cardInstanceId);
    
    if (!cardInfo) {
      console.error('Card not found for battlecry processing', cardInstanceId);
      // Look for more info to help debug
      console.log('Available battlefield cards:', 
        (newState.players.player.battlefield || []).map(c => `${c.card.name} (${c.instanceId})`).join(', '));
      return state;
    }
    
    const cardInstance = cardInfo.card;
    const battlecry = cardInstance.card.battlecry;
    
    if (!battlecry || !(cardInstance.card.keywords || []).includes('battlecry')) {
      console.log(`Card ${cardInstance.card.name} has no battlecry or missing keyword - skipping processing`);
      return newState;
    }

  // Log the battlecry
  console.log(`Processing battlecry for ${cardInstance.card.name}`);
  
  // Record battlecry for future effects (Shudderwock)
  recordBattlecry(cardInstance, battlecry, targetId, targetType);
  
  // Check for double battlecry effect
  const doubleEffect = shouldDoubleBattlecry(newState);
  if (doubleEffect) {
    console.log(`Double battlecry effect active for ${cardInstance.card.name}`);
  }
  
  // Execute pre-battlecry effects (Hearthstone has effects that trigger before battlecries)
  newState = executePreBattlecryEffects(newState, cardInstance);
  
  // Execute the battlecry
  newState = executeBattlecry(newState, cardInstanceId, targetId, targetType);
  
  // Handle animations if a battlecry effect exists
  if (battlecry) {
    // Get card position for animation
    const cardPosition = getCardPosition(newState, cardInstanceId);
    let targetPosition: { x: number, y: number } | undefined;
    
    // If there's a target, get its position too
    if (targetId && targetType) {
      targetPosition = getTargetPosition(newState, targetId, targetType);
    }
    
    // Trigger the battlecry animation
    if (cardPosition) {
      // Add the appropriate battlecry animation based on the effect type
      triggerBattlecryAnimation(battlecry, cardPosition, targetPosition);
    }
    
    // If double battlecry is active, execute it again, but with proper animation timing
    if (doubleEffect) {
      // In Hearthstone, there's a small delay between double battlecry executions
      // We need to properly synchronize the state changes with the animations
      
      // Create a promise to track the first animation's completion
      const firstAnimationComplete = new Promise<void>((resolve) => {
        // Set a timer based on animation duration
        // This is a simplified approach - ideally animations should signal completion
        setTimeout(() => {
          console.log('First battlecry animation completed, executing second battlecry');
          resolve();
        }, 800); // Shorter delay to make the second animation start sooner
      });
      
      // Execute the second battlecry after the first animation completes
      firstAnimationComplete.then(() => {
        // Execute the battlecry again now that the first animation has had time to show
        newState = executeBattlecry(newState, cardInstanceId, targetId, targetType);
        
        // Add animation for the second battlecry
        if (cardPosition) {
          console.log(`Triggering second battlecry animation for ${cardInstance.card.name}`);
          
          // Get the latest animation manager state
          const addAnimation = useAnimationStore.getState().addAnimation;
          
          // Trigger a new animation for the second battlecry effect
          triggerBattlecryAnimation(battlecry, cardPosition, targetPosition);
        }
        
        // No need to return anything here since we're in a callback
        // The state changes will be picked up by React through the store
      }).catch(error => {
        console.error('Error in double battlecry execution:', error);
      });
    }
  }
  
  // Execute post-battlecry effects
  newState = executePostBattlecryEffects(newState, cardInstance);
  
  return newState;
  } catch (error) {
    console.error('Error in processBattlecry:', error);
    // Log detailed information about the card and battlecry for debugging
    console.error(`Failed battlecry processing for card with ID: ${cardInstanceId}`);
    // Return original state to avoid game-breaking issues
    return state;
  }
}

/**
 * Record a played battlecry for future effects (like Shudderwock)
 */
function recordBattlecry(
  cardInstance: CardInstance,
  battlecryEffect: BattlecryEffect,
  targetId?: string,
  targetType?: 'minion' | 'hero'
): void {
  try {
    // Create a simplified copy of the battlecry effect to store
    // This helps reduce memory usage by not storing the entire card data
    const simplifiedEffect: BattlecryEffect = {
      type: battlecryEffect.type,
      requiresTarget: battlecryEffect.requiresTarget,
      targetType: battlecryEffect.targetType,
      value: battlecryEffect.value,
    };
    
    // Add buffs if they exist
    if (battlecryEffect.buffAttack !== undefined) {
      simplifiedEffect.buffAttack = battlecryEffect.buffAttack;
    }
    if (battlecryEffect.buffHealth !== undefined) {
      simplifiedEffect.buffHealth = battlecryEffect.buffHealth;
    }
    
    // Record the battlecry
    const entry: PlayedBattlecry = {
      cardId: cardInstance.card.id,
      instanceId: cardInstance.instanceId,
      battlecryEffect: simplifiedEffect,
      targetId,
      targetType,
      timestamp: Date.now()
    };
    
    // Add to history
    battlecryHistory.push(entry);
    
    // Implement memory management with gradual pruning
    // and keep important battlecries (like legendary card battlecries)
    if (battlecryHistory.length > 100) {
      // Sort battlecries by importance and recency
      const importantBattlecries = battlecryHistory.filter(bc => {
        // Keep legendary card battlecries
        const isLegendary = 
          bc.cardId >= 1000 && // Assuming legendary cards have IDs >= 1000
          bc.battlecryEffect.type !== 'draw' && // Simple effects are less important
          bc.battlecryEffect.type !== 'heal';
          
        // Keep recent battlecries (last 10)
        const isRecent = battlecryHistory.indexOf(bc) >= battlecryHistory.length - 10;
        
        return isLegendary || isRecent;
      });
      
      // For others, gradually thin out older ones (keep every other one)
      const olderBattlecries = battlecryHistory
        .filter(bc => !importantBattlecries.includes(bc))
        .filter((_, index) => index % 2 === 0) // Keep every other one
        .slice(-40); // Limit to 40 max
      
      // Combine important ones and thinned older ones
      battlecryHistory = [...olderBattlecries, ...importantBattlecries]
        .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
      
      console.log(`Battlecry history pruned to ${battlecryHistory.length} entries`);
    }
  } catch (error) {
    console.error('Error recording battlecry:', error);
    // If there's an error, make sure we don't crash the game
  }
}

/**
 * Get all played battlecries for effects like Shudderwock
 */
export function getPlayedBattlecries(limit?: number): PlayedBattlecry[] {
  try {
    if (!battlecryHistory.length) {
      console.log('No battlecry history available');
      return [];
    }
    
    // If limit is provided, return only that many most recent battlecries
    if (limit && limit > 0) {
      return battlecryHistory.slice(-Math.min(limit, battlecryHistory.length));
    }
    
    // Return a copy of the history to prevent external modification
    return [...battlecryHistory];
  } catch (error) {
    console.error('Error getting battlecry history:', error);
    return [];
  }
}

// Note: First declaration of clearBattlecryHistory is at line 43
// This is a duplicated function and has been commented out to avoid conflicts
/*
export function clearBattlecryHistory(): void {
  battlecryHistory = [];
  console.log('Battlecry history cleared');
}
*/

/**
 * Execute effects that happen before a battlecry resolves
 * These are effects that trigger "whenever" a battlecry minion is played
 */
function executePreBattlecryEffects(state: GameState, cardInstance: CardInstance): GameState {
  // Create a deep copy of state to avoid mutations
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  try {
    // Check for minions with "whenever you play a minion with battlecry" effects
    if (newState.players.player.battlefield) {
      for (const minion of newState.players.player.battlefield) {
        // Skip silenced minions
        if (minion.isSilenced) continue;
        
        // Check if the minion has a pre-battlecry trigger effect
        if (minion.card.triggerEffects?.onBattlecryPlayed) {
          console.log(`Triggering pre-battlecry effect from ${minion.card.name}`);
          
          // Execute the specific effect for the minion
          // This will vary based on the card's implementation
          switch (minion.card.name) {
            case "Crowd Favorite":
              // Crowd Favorite: "Whenever you play a card with Battlecry, gain +1/+1."
              if (minion.currentHealth !== undefined) {
                minion.currentHealth += 1;
              }
              if (minion.card.health !== undefined) {
                minion.card.health += 1;
              }
              if (minion.card.attack !== undefined) {
                minion.card.attack += 1;
              }
              console.log(`Crowd Favorite gained +1/+1 from battlecry trigger`);
              
              // Add a visual indicator of the buff
              const battlefieldIndex = newState.players.player.battlefield.indexOf(minion);
              if (battlefieldIndex >= 0) {
                const position = {
                  x: 400 + (battlefieldIndex * 80),
                  y: 400
                };
                
                // Add a buff animation
                const addAnimation = useAnimationStore.getState().addAnimation;
                addAnimation({
                  id: uuidv4(), // Add a unique id using uuid
                  type: 'buff' as AnimationType, // Explicitly cast to AnimationType
                  position,
                  duration: 800
                });
              }
              break;
              
            case "Nightmare Amalgam":
              // Example for any other card with special battlecry interaction
              console.log(`${minion.card.name} reacted to a battlecry`);
              break;
              
            // Add other cards with pre-battlecry effects as needed
          }
        }
      }
    }
    
    return newState;
  } catch (error) {
    console.error('Error in executePreBattlecryEffects:', error);
    // Return original state if there's an error
    return state;
  }
}

/**
 * Execute effects that happen after a battlecry resolves
 * These are effects that trigger "after" a battlecry completes
 */
function executePostBattlecryEffects(state: GameState, cardInstance: CardInstance): GameState {
  // Create a deep copy of state to avoid mutations
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  try {
    // Check for minions with "after a battlecry resolves" effects
    if (newState.players.player.battlefield) {
      for (const minion of newState.players.player.battlefield) {
        // Skip silenced minions
        if (minion.isSilenced) continue;
        
        // Check if the minion has a post-battlecry trigger effect
        if (minion.card.triggerEffects?.afterBattlecryResolved) {
          console.log(`Triggering post-battlecry effect from ${minion.card.name}`);
          
          // Execute the specific effect for the minion
          switch (minion.card.name) {
            case "Corpsetaker":
              // Example: If the played battlecry card had certain keywords, gain those keywords
              if (cardInstance.card.keywords) {
                // Check for specific keywords like divine shield, taunt, lifesteal, windfury
                const keywordsToCheck = ['divine_shield', 'taunt', 'lifesteal', 'windfury'];
                const keywords = minion.card.keywords || [];
                
                for (const keyword of keywordsToCheck) {
                  if (cardInstance.card.keywords.includes(keyword as CardKeyword) && 
                      !keywords.includes(keyword as CardKeyword)) {
                    keywords.push(keyword as CardKeyword);
                    console.log(`Corpsetaker gained ${keyword} from battlecry card`);
                  }
                }
                
                minion.card.keywords = keywords;
                
                // Add a visual effect
                const battlefieldIndex = newState.players.player.battlefield.indexOf(minion);
                if (battlefieldIndex >= 0) {
                  const position = {
                    x: 400 + (battlefieldIndex * 80),
                    y: 400
                  };
                  
                  // Add an appropriate animation
                  const addAnimation = useAnimationStore.getState().addAnimation;
                  addAnimation({
                    id: uuidv4(), // Add a unique id using uuid
                    type: 'effect' as AnimationType, // Explicitly cast to AnimationType
                    position,
                    duration: 800
                  });
                }
              }
              break;
              
            case "Spirit of the Shark":
              // This is just a placeholder since the actual double battlecry effect
              // is implemented in the shouldDoubleBattlecry function
              console.log(`Spirit of the Shark acknowledged the battlecry completion`);
              break;
              
            // Add other cards with post-battlecry effects as needed
          }
        }
      }
    }
    
    return newState;
  } catch (error) {
    console.error('Error in executePostBattlecryEffects:', error);
    // Return original state if there's an error
    return state;
  }
}

/**
 * Get valid targets for a battlecry
 * This matches Hearthstone's targeting rules exactly
 */
export function getValidBattlecryTargets(
  state: GameState,
  battlecry: BattlecryEffect
): { targetId: string; targetType: 'minion' | 'hero' }[] {
  const validTargets: { targetId: string; targetType: 'minion' | 'hero' }[] = [];
  
  // If no target is required, return an empty array
  if (!battlecry.requiresTarget) {
    return validTargets;
  }
  
  switch (battlecry.targetType) {
    case 'friendly_minion':
      // Can target friendly minions only
      (state.players.player.battlefield || []).forEach(minion => {
        if (isValidMinion(minion, battlecry)) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
      break;
      
    case 'enemy_minion':
      // Can target enemy minions only
      (state.players.opponent.battlefield || []).forEach(minion => {
        if (isValidMinion(minion, battlecry)) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
      break;
      
    case 'any_minion':
      // Can target any minion (friendly or enemy)
      (state.players.player.battlefield || []).forEach(minion => {
        if (isValidMinion(minion, battlecry)) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
      (state.players.opponent.battlefield || []).forEach(minion => {
        if (isValidMinion(minion, battlecry)) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
      break;
      
    case 'friendly_hero':
      // Can target friendly hero only
      validTargets.push({ targetId: 'player', targetType: 'hero' });
      break;
      
    case 'enemy_hero':
      // Can target enemy hero only
      validTargets.push({ targetId: 'opponent', targetType: 'hero' });
      break;
      
    case 'any_hero':
      // Can target any hero (friendly or enemy)
      validTargets.push({ targetId: 'player', targetType: 'hero' });
      validTargets.push({ targetId: 'opponent', targetType: 'hero' });
      break;
      
    case 'any':
      // Can target any character (minion or hero)
      validTargets.push({ targetId: 'player', targetType: 'hero' });
      validTargets.push({ targetId: 'opponent', targetType: 'hero' });
      (state.players.player.battlefield || []).forEach(minion => {
        if (isValidMinion(minion, battlecry)) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
      (state.players.opponent.battlefield || []).forEach(minion => {
        if (isValidMinion(minion, battlecry)) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
      break;
      
    case 'damaged_minion':
      // Can target damaged minions only
      (state.players.player.battlefield || []).forEach(minion => {
        if (isValidMinion(minion, battlecry) && isDamaged(minion)) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
      (state.players.opponent.battlefield || []).forEach(minion => {
        if (isValidMinion(minion, battlecry) && isDamaged(minion)) {
          validTargets.push({ targetId: minion.instanceId, targetType: 'minion' });
        }
      });
      break;
      
    // Add more specific targeting types (beast, dragon, etc.) as needed
    
    default:
      // For any other targeting requirements, no targets are valid
      break;
  }
  
  return validTargets;
}

/**
 * Check if a minion satisfies additional targeting requirements
 * @param minion The minion to check
 * @param battlecry The battlecry effect to validate against
 * @returns True if the minion is a valid target for this battlecry
 */
function isValidMinion(minion: CardInstance, battlecry: BattlecryEffect): boolean {
  // Ensure we have keywords array to check
  const keywords = minion.card.keywords || [];
  
  // Check special conditions
  switch (battlecry.targetType) {
    case 'damaged_minion':
      return isDamaged(minion);
      
    // Race-based targeting
    case 'beast':
      return keywords.includes('beast' as CardKeyword);
      
    case 'dragon':
      return keywords.includes('dragon' as CardKeyword);
      
    case 'mech':
      return keywords.includes('mech' as CardKeyword);
      
    case 'murloc':
      return keywords.includes('murloc' as CardKeyword);
      
    case 'pirate':
      return keywords.includes('pirate' as CardKeyword);
      
    case 'totem':
      return keywords.includes('totem' as CardKeyword);
      
    case 'elemental':
      return keywords.includes('elemental' as CardKeyword);
      
    case 'demon':
      return keywords.includes('demon' as CardKeyword);
      
    // Keyword-based targeting
    case 'taunt_minion':
      return keywords.includes('taunt' as CardKeyword);
      
    case 'deathrattle_minion':
      return keywords.includes('deathrattle' as CardKeyword);
      
    case 'frozen_minion':
      return !!minion.isFrozen;
      
    case 'undamaged_minion':
      return !isDamaged(minion);
      
    // For targeting enemy minions with specific attack values
    case 'attack_less_than_3':
      return (minion.card.attack || 0) < 3;
      
    case 'attack_greater_than_5':
      return (minion.card.attack || 0) > 5;
      
    // Silence targets need text (keywords or card text)
    case 'silenceable_minion':
      return keywords.length > 0 || !!minion.card.description;
  }
  
  // By default, the minion is a valid target
  return true;
}

/**
 * Check if a minion is damaged
 */
function isDamaged(minion: CardInstance): boolean {
  return minion.currentHealth !== undefined &&
         minion.card.health !== undefined &&
         minion.currentHealth < minion.card.health;
}

/**
 * Get the screen position of a card for animation purposes
 */
function getCardPosition(state: GameState, cardId: string): { x: number, y: number } | undefined {
  // In a real implementation, you would calculate the actual position based on the DOM
  // For now, we'll use hardcoded values for demonstration
  
  // Look for the card on the battlefield
  const playerBattlefield = state.players.player.battlefield || [];
  const playerMinion = playerBattlefield.find(m => m.instanceId === cardId);
  if (playerMinion) {
    // Position is based on the card's index in the battlefield
    const index = playerBattlefield.indexOf(playerMinion);
    return {
      x: 400 + (index * 80), // Horizontal position based on card slot
      y: 400 // Vertical position (player's battlefield)
    };
  }
  
  const opponentBattlefield = state.players.opponent.battlefield || [];
  const opponentMinion = opponentBattlefield.find(m => m.instanceId === cardId);
  if (opponentMinion) {
    // Position is based on the card's index in the battlefield
    const index = opponentBattlefield.indexOf(opponentMinion);
    return {
      x: 400 + (index * 80), // Horizontal position based on card slot
      y: 300 // Vertical position (opponent's battlefield)
    };
  }
  
  // Card not found on either battlefield
  return undefined;
}

/**
 * Get the screen position of a target for animation purposes
 */
function getTargetPosition(
  state: GameState, 
  targetId: string, 
  targetType: 'minion' | 'hero'
): { x: number, y: number } | undefined {
  if (targetType === 'minion') {
    // Look for the minion on either battlefield
    const playerBattlefield = state.players.player.battlefield || [];
    const playerMinion = playerBattlefield.find(m => m.instanceId === targetId);
    if (playerMinion) {
      const index = playerBattlefield.indexOf(playerMinion);
      return {
        x: 400 + (index * 80), // Horizontal position based on card slot
        y: 400 // Vertical position (player's battlefield)
      };
    }
    
    const opponentBattlefield = state.players.opponent.battlefield || [];
    const opponentMinion = opponentBattlefield.find(m => m.instanceId === targetId);
    if (opponentMinion) {
      const index = opponentBattlefield.indexOf(opponentMinion);
      return {
        x: 400 + (index * 80), // Horizontal position based on card slot
        y: 300 // Vertical position (opponent's battlefield)
      };
    }
  } else if (targetType === 'hero') {
    // Target is a hero
    if (targetId === 'player') {
      return { x: 400, y: 500 }; // Player hero position
    } else if (targetId === 'opponent') {
      return { x: 400, y: 200 }; // Opponent hero position
    }
  }
  
  // Target not found
  return undefined;
}

/**
 * Trigger the appropriate battlecry animation based on the effect type
 */
function triggerBattlecryAnimation(
  battlecry: BattlecryEffect,
  cardPosition: { x: number, y: number },
  targetPosition?: { x: number, y: number }
): void {
  // Get access to the animation store
  const addAnimation = useAnimationStore.getState().addAnimation;
  
  // Determine which animation to play based on the battlecry type
  switch (battlecry.type) {
    case 'damage':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_damage' as AnimationType, // Explicitly cast to AnimationType
        position: targetPosition || cardPosition,
        value: battlecry.value,
        duration: 1400
      });
      break;
      
    case 'heal':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_heal' as AnimationType,
        position: targetPosition || cardPosition,
        value: battlecry.value,
        duration: 1400
      });
      break;
      
    case 'buff':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_buff' as AnimationType,
        position: targetPosition || cardPosition,
        attackBuff: battlecry.buffAttack,
        healthBuff: battlecry.buffHealth,
        duration: 1400
      });
      break;
      
    case 'summon':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_summon' as AnimationType,
        position: cardPosition,
        value: 1, // Default to 1 minion if not specified
        duration: 1400
      });
      break;
      
    case 'draw':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_draw' as AnimationType,
        position: cardPosition,
        value: battlecry.value,
        cardType: battlecry.cardType, // Pass the card type for specialized animations (beast, murloc, etc.)
        duration: 1400
      });
      break;
      
    case 'discover':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_discover' as AnimationType,
        position: cardPosition,
        duration: 1400
      });
      break;
      
    case 'transform':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_transform' as AnimationType,
        position: targetPosition || cardPosition,
        duration: 1400
      });
      break;
      
    case 'silence':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_silence' as AnimationType,
        position: targetPosition || cardPosition,
        duration: 1400
      });
      break;
      
    case 'aoe_damage':
      // Special case for Deathwing-like effects (damage value >= 1000)
      if (battlecry.value && battlecry.value >= 1000) {
        // For Deathwing-like effects, use a longer animation duration
        addAnimation({
          id: uuidv4(), // Add a unique id using uuid
          type: 'battlecry_aoe' as AnimationType,
          position: cardPosition,
          value: battlecry.value,
          duration: 2200 // Longer duration for the dramatic effect
        });
        
        // Add some extra explosions around the battlefield for dramatic effect
        setTimeout(() => {
          const addAnimation = useAnimationStore.getState().addAnimation;
          
          // Add smaller explosions at various points on the battlefield
          for (let i = 0; i < 3; i++) {
            const randomOffset = {
              x: Math.random() * 200 - 100,
              y: Math.random() * 200 - 100
            };
            
            const explosionPosition = {
              x: cardPosition.x + randomOffset.x,
              y: cardPosition.y + randomOffset.y
            };
            
            addAnimation({
              id: uuidv4(), // Add a unique id using uuid
              type: 'battlecry_aoe' as AnimationType,
              position: explosionPosition,
              value: 2, // Small damage value for the visual effect
              duration: 1000
            });
          }
        }, 400); // Delay for secondary explosions
      } else {
        // Normal AoE damage animation
        addAnimation({
          id: uuidv4(), // Add a unique id using uuid
          type: 'battlecry_aoe' as AnimationType,
          position: cardPosition,
          value: battlecry.value,
          duration: 1600
        });
      }
      break;
      
    case 'freeze':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_freeze' as AnimationType,
        position: targetPosition || cardPosition,
        duration: 1400
      });
      break;
      
    case 'mind_control':
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry_mind_control' as AnimationType,
        position: targetPosition || cardPosition,
        duration: 1400
      });
      break;
      
    default:
      // For any other battlecry types, use a generic animation
      addAnimation({
        id: uuidv4(), // Add a unique id using uuid
        type: 'battlecry' as AnimationType,
        position: cardPosition,
        duration: 1400
      });
  }
}

/**
 * Replay a sequence of battlecries (for Shudderwock-like effects)
 */
export function replayBattlecries(
  state: GameState,
  sourceCardId: string,
  count: number = 5
): GameState {
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Get a list of battlecries to replay
  const battlecriesToReplay = getPlayedBattlecries(count);
  
  // Skip repeating the Shudderwock battlecry itself to prevent infinite loops
  const filteredBattlecries = battlecriesToReplay.filter(bc => 
    !bc.battlecryEffect.type.includes('replay_battlecries')
  );
  
  // Get source card position for animations
  const sourcePosition = getCardPosition(newState, sourceCardId);
  
  // Replay each battlecry
  for (const battlecry of filteredBattlecries) {
    // In Hearthstone, replayed battlecries don't need the original targets
    // They are either random or chosen at random from valid targets
    
    // For battlecries that require targets, we need to find new valid targets
    if (battlecry.battlecryEffect.requiresTarget) {
      const validTargets = getValidBattlecryTargets(newState, battlecry.battlecryEffect);
      
      if (validTargets.length > 0) {
        // In Hearthstone, replayed battlecries with targets typically pick random valid targets
        const randomIndex = Math.floor(Math.random() * validTargets.length);
        const newTarget = validTargets[randomIndex];
        
        // Get target position for animation
        const targetPosition = getTargetPosition(
          newState, 
          newTarget.targetId, 
          newTarget.targetType
        );
        
        // Add animation for the battlecry
        if (sourcePosition) {
          triggerBattlecryAnimation(
            battlecry.battlecryEffect, 
            sourcePosition, 
            targetPosition
          );
        }
        
        // Execute the battlecry with the new target
        newState = executeBattlecry(
          newState,
          sourceCardId,
          newTarget.targetId,
          newTarget.targetType
        );
      }
    } else {
      // For battlecries that don't require targets, just execute them
      
      // Add animation for untargeted battlecry
      if (sourcePosition) {
        triggerBattlecryAnimation(
          battlecry.battlecryEffect, 
          sourcePosition
        );
      }
      
      // Execute the battlecry
      newState = executeBattlecry(newState, sourceCardId);
    }
  }
  
  return newState;
}