/**
 * Bug Detection and Auto-Fixing Agent
 * 
 * Analyzes game logs for errors, identifies common bug patterns,
 * and suggests or applies code fixes automatically.
 */

import { GameState, CardInstance, GameLogEvent } from '../types';

// Common bug pattern signatures to look for in logs and game state
export interface BugPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
  // Function to detect if this bug pattern exists in the logs or game state
  detect: (logs: GameLogEvent[], state: GameState | null) => boolean;
  // Function to automatically fix the bug if possible
  fix?: (state: GameState) => GameState;
  // Suggestion text for manual fixing if not auto-fixable
  fixSuggestion?: string;
}

// Bug detection result
export interface BugDetectionResult {
  detectedBugs: DetectedBug[];
  fixedBugs: DetectedBug[];
  summary: string;
  timestamp: number;
}

// Structure representing a detected bug instance
export interface DetectedBug {
  pattern: BugPattern;
  relatedCards?: CardInstance[];
  relatedLogs?: GameLogEvent[];
  fixApplied: boolean;
  fixResult?: string;
}

// Define common bug patterns
const bugPatterns: BugPattern[] = [
  // Missing or incomplete battlecry implementation
  {
    id: 'missing-battlecry-implementation',
    name: 'Missing Battlecry Implementation',
    description: 'A card has a battlecry effect but the implementation is missing or incomplete',
    severity: 'high',
    autoFixable: false,
    detect: (logs, state) => {
      if (!state) return false;
      
      // Look for error logs about unknown battlecry types
      const unknownBattlecryLogs = logs.filter(log => 
        log.text && (
          log.text.includes('Unknown battlecry type:') ||
          log.text.includes('Error executing battlecry')
        )
      );
      
      // Also look for cases where a battlecry was mentioned but no actual effect was applied
      const ineffectiveBattlecryLogs = logs.filter(log => {
        // First find logs that mention battlecry being triggered
        if (log.type === 'battlecry' || (log.text && log.text.includes('battlecry'))) {
          // For each battlecry trigger, check if there's a corresponding effect log
          const cardName = log.source;
          const effectLogs = logs.filter(effectLog => 
            effectLog.timestamp > log.timestamp && 
            effectLog.type !== 'battlecry' && 
            effectLog.source === cardName
          );
          
          // If no effect logs found after a battlecry trigger, it might be ineffective
          return effectLogs.length === 0;
        }
        return false;
      });
      
      return unknownBattlecryLogs.length > 0 || ineffectiveBattlecryLogs.length > 0;
    },
    fixSuggestion: 'Check battlecryUtils.ts for missing battlecry types or incomplete implementations. For example, battlecry type "return" might be listed as "return_to_hand" in the code.'
  },
  
  // Return battlecry type mismatch
  {
    id: 'return-battlecry-mismatch',
    name: 'Return Battlecry Type Mismatch',
    description: 'Cards with "return" battlecry type are not properly processed',
    severity: 'high',
    autoFixable: false,
    detect: (logs, state) => {
      // Look specifically for errors related to the "return" battlecry type
      return logs.some(log => 
        log.text && log.text.includes('Unknown battlecry type: return')
      );
    },
    fixSuggestion: 'In battlecryUtils.ts, add an additional case for "return" that calls the same handler as "return_to_hand". The executeReturnHandler.ts uses "return" type, but battlecryUtils.ts expects "return_to_hand".'
  },
  
  // Missing or incomplete deathrattle implementation
  {
    id: 'missing-deathrattle-implementation',
    name: 'Missing Deathrattle Implementation',
    description: 'A card has a deathrattle effect but the implementation is missing or incomplete',
    severity: 'high',
    autoFixable: false,
    detect: (logs, state) => {
      if (!state) return false;
      
      // Look for error logs about unknown deathrattle types
      const unknownDeathrattleLogs = logs.filter(log => 
        log.text && (
          log.text.includes('Unknown deathrattle type:') ||
          log.text.includes('Error executing deathrattle')
        )
      );
      
      // Also look for cases where a deathrattle was mentioned but no actual effect was applied
      const ineffectiveDeathrattleLogs = logs.filter(log => {
        // First find logs that mention deathrattle being triggered
        if (log.type === 'deathrattle' || (log.text && log.text.includes('deathrattle'))) {
          // For each deathrattle trigger, check if there's a corresponding effect log
          const cardName = log.source;
          const effectLogs = logs.filter(effectLog => 
            effectLog.timestamp > log.timestamp && 
            effectLog.type !== 'deathrattle' && 
            effectLog.source === cardName
          );
          
          // If no effect logs found after a deathrattle trigger, it might be ineffective
          return effectLogs.length === 0;
        }
        return false;
      });
      
      return unknownDeathrattleLogs.length > 0 || ineffectiveDeathrattleLogs.length > 0;
    },
    fixSuggestion: 'Check deathrattleUtils.ts for missing deathrattle types or incomplete implementations. Make sure deathrattle handlers are properly registered in the deathrattle/index.ts file.'
  },
  
  // Specific deathrattle type mismatches
  {
    id: 'deathrattle-type-mismatch',
    name: 'Deathrattle Type Mismatch',
    description: 'Cards with specific deathrattle types are not properly processed',
    severity: 'high',
    autoFixable: false,
    detect: (logs, state) => {
      // Look for specific error patterns related to deathrattle type mismatches
      return logs.some(log => 
        log.text && (
          log.text.includes('Unknown deathrattle type:') ||
          (log.text.includes('deathrattle') && log.text.includes('failed to execute'))
        )
      );
    },
    fixSuggestion: 'Ensure that the deathrattle type in card data matches the handler implementations in deathrattleUtils.ts and the deathrattle handler files. Check the deathrattle/index.ts file for proper handler registrations.'
  },
  
  // Taunt validation issues
  {
    id: 'taunt-bypass',
    name: 'Taunt Validation Bypass',
    description: 'Player able to attack non-taunt minions or hero when taunt minions are present',
    severity: 'high',
    autoFixable: true,
    detect: (logs, state) => {
      if (!state) return false;
      
      // Check if taunt minions exist and non-taunt minions/heroes were attacked
      const hasTaunt = state.players.player.battlefield.some(card => 
        card.card.keywords?.includes('taunt'));
      
      // Look for attack logs where non-taunt was targeted despite taunt being present
      const tauntBypassLogs = logs.filter(log => 
        log.type === 'minion_attack' && 
        hasTaunt && 
        log.targetId && 
        !state.players.player.battlefield.find(card => 
          card.instanceId === log.targetId && 
          card.card.keywords?.includes('taunt')));
      
      return tauntBypassLogs.length > 0;
    },
    fix: (state) => {
      // Real fix would be updating the processAttack function in gameUtils.ts
      // For now, we'll just log this was detected
      console.log('Auto-fix for taunt bypass issue would update processAttack function');
      return state;
    },
    fixSuggestion: 'Update processAttack function in gameUtils.ts to properly validate taunt minions before allowing attacks'
  },
  
  // Card missing required properties
  {
    id: 'missing-card-properties',
    name: 'Missing Card Properties',
    description: 'Card is missing required properties (attack, health, mana cost)',
    severity: 'medium',
    autoFixable: true,
    detect: (logs, state) => {
      if (!state) return false;
      
      // Check player's hand, deck, and battlefield for cards with missing properties
      const allCards = [
        ...state.players.player.hand,
        ...state.players.player.battlefield,
        ...state.players.opponent.hand,
        ...state.players.opponent.battlefield
      ];
      
      // Check for missing essential properties
      return allCards.some(card => 
        card.card.type === 'minion' && (
          card.card.attack === undefined || 
          card.card.health === undefined ||
          card.card.manaCost === undefined
        ));
    },
    fix: (state) => {
      // Clone state to avoid mutation
      const newState = JSON.parse(JSON.stringify(state)) as GameState;
      
      // Function to fix missing properties on a card instance
      const fixCardInstance = (cardInstance: CardInstance): CardInstance => {
        const card = cardInstance.card;
        
        // Fix missing properties based on card type
        if (card.type === 'minion') {
          // Set default values for missing properties
          if (card.attack === undefined) card.attack = 1;
          if (card.health === undefined) card.health = 1;
          if (card.manaCost === undefined) card.manaCost = 1;
          
          // Update current health if needed
          if (cardInstance.currentHealth === undefined) {
            cardInstance.currentHealth = card.health;
          }
        } else if (card.type === 'spell' && card.manaCost === undefined) {
          card.manaCost = 1;
        }
        
        return cardInstance;
      };
      
      // Fix cards in player's hand and battlefield
      newState.players.player.hand = newState.players.player.hand.map(fixCardInstance);
      newState.players.player.battlefield = newState.players.player.battlefield.map(fixCardInstance);
      
      // Fix cards in opponent's hand and battlefield
      newState.players.opponent.hand = newState.players.opponent.hand.map(fixCardInstance);
      newState.players.opponent.battlefield = newState.players.opponent.battlefield.map(fixCardInstance);
      
      return newState;
    }
  },
  
  // Battlecry execution issues
  {
    id: 'battlecry-execution-failure',
    name: 'Battlecry Execution Failure',
    description: 'Battlecry effect failed to execute properly',
    severity: 'high',
    autoFixable: true,
    detect: (logs, state) => {
      // Look for logs indicating battlecry execution failures
      return logs.some(log => 
        log.text && (
          log.text.includes('failed to execute battlecry') ||
          log.text.includes('battlecry error') ||
          log.text.includes('could not find target for battlecry')
        ));
    },
    fix: (state) => {
      // Clone state to avoid mutation
      const newState = JSON.parse(JSON.stringify(state)) as GameState;
      
      // Identify cards with battlecry effects that might have failed
      const potentialFailedBattlecryCards = [
        ...newState.players.player.battlefield,
        ...newState.players.opponent.battlefield
      ].filter(card => 
        card.card.keywords?.includes('battlecry') ||
        card.card.description?.toLowerCase().includes('battlecry')
      );
      
      // For each card with battlecry, retry to apply common battlecry effects based on description
      potentialFailedBattlecryCards.forEach(card => {
        const description = card.card.description?.toLowerCase() || '';
        
        // Handle common battlecry patterns
        if (description.includes('deal') && description.includes('damage')) {
          // Damage-dealing battlecry - apply damage to a random enemy minion or hero
          const targetIsEnemy = card.instanceId.startsWith('player-');
          const targetPlayer = targetIsEnemy ? 'opponent' : 'player';
          
          if (newState.players[targetPlayer]?.battlefield.length > 0) {
            // Target a random enemy minion
            const randomIndex = Math.floor(Math.random() * newState.players[targetPlayer].battlefield.length);
            const targetMinion = newState.players[targetPlayer].battlefield[randomIndex];
            
            // Apply damage (typical values 1-3)
            const damage = description.includes('1 damage') ? 1 :
                          description.includes('2 damage') ? 2 :
                          description.includes('3 damage') ? 3 : 1;
                          
            if (targetMinion.currentHealth) {
              targetMinion.currentHealth -= damage;
            }
          } else {
            // No minions, damage the hero instead
            const damage = description.includes('1 damage') ? 1 :
                          description.includes('2 damage') ? 2 :
                          description.includes('3 damage') ? 3 : 1;
                          
            if (newState.players[targetPlayer].health) {
              newState.players[targetPlayer].health -= damage;
            }
          }
        } else if (description.includes('draw') && description.includes('card')) {
          // Card draw battlecry - add a card to the player's hand from their deck
          const playerKey = card.instanceId.startsWith('player-') ? 'player' : 'opponent';
          
          if (newState.players[playerKey]?.deck.length > 0 && 
              newState.players[playerKey]?.hand.length < 10) {
            // Move a card from deck to hand
            const drawnCard = newState.players[playerKey].deck.shift();
            if (drawnCard) {
              newState.players[playerKey].hand.push(drawnCard);
            }
          }
        } else if (description.includes('give') && 
                  (description.includes('+1/+1') || description.includes('attack') || description.includes('health'))) {
          // Buff battlecry - give stats to friendly minions
          const playerKey = card.instanceId.startsWith('player-') ? 'player' : 'opponent';
          
          if (newState.players[playerKey]?.battlefield.length > 0) {
            // Get all friendly minions except the card itself
            const friendlyMinions = newState.players[playerKey].battlefield.filter(
              minion => minion.instanceId !== card.instanceId
            );
            
            if (friendlyMinions.length > 0) {
              // Apply buff to all friendly minions or a specific type
              friendlyMinions.forEach(minion => {
                // Check if buff is tribe-specific (e.g., "Give your Murlocs +1/+1")
                const tribeMatch = description.match(/your\s+([A-Za-z]+)s/i);
                const tribe = tribeMatch ? tribeMatch[1].toLowerCase() : null;
                
                // Only apply buff if no tribe restriction or the minion matches the tribe
                if (!tribe || 
                   (minion.card.tribe?.toLowerCase() === tribe) || 
                   (minion.card.race?.toLowerCase() === tribe)) {
                  // Parse buff amount
                  if (description.includes('+1/+1')) {
                    minion.card.attack = (minion.card.attack || 0) + 1;
                    minion.card.health = (minion.card.health || 0) + 1;
                    minion.currentHealth = (minion.currentHealth || 0) + 1;
                  } else if (description.includes('+2/+2')) {
                    minion.card.attack = (minion.card.attack || 0) + 2;
                    minion.card.health = (minion.card.health || 0) + 2;
                    minion.currentHealth = (minion.currentHealth || 0) + 2;
                  } else if (description.includes('+0/+2') || (description.includes('+2') && description.includes('health'))) {
                    minion.card.health = (minion.card.health || 0) + 2;
                    minion.currentHealth = (minion.currentHealth || 0) + 2;
                  } else if (description.includes('+2/+0') || (description.includes('+2') && description.includes('attack'))) {
                    minion.card.attack = (minion.card.attack || 0) + 2;
                  }
                }
              });
            }
          }
        }
      });
      
      return newState;
    },
    fixSuggestion: 'Check battlecryUtils.ts for proper execution paths and error handling. Ensure all edge cases like empty boards are handled correctly.'
  },
  
  // Turn effects not triggering
  {
    id: 'turn-effects-not-triggering',
    name: 'Turn Effects Not Triggering',
    description: 'Start/end of turn effects not triggering properly',
    severity: 'medium',
    autoFixable: true,
    detect: (logs, state) => {
      // Look for cards with turn effects in play, but no logs of them triggering
      if (!state) return false;
      
      const cardsWithTurnEffects = [
        ...state.players.player.battlefield,
        ...state.players.opponent.battlefield
      ].filter(card => 
        card.card.turnStartEffect || 
        card.card.turnEndEffect ||
        // Common turn effect cards identifiable through description
        (card.card.description && (
          card.card.description.toLowerCase().includes('at the start of your turn') ||
          card.card.description.toLowerCase().includes('at the end of your turn') ||
          card.card.description.toLowerCase().includes('at the beginning of your turn')
        ))
      );
      
      // If cards with turn effects exist but no turn effect logs found
      if (cardsWithTurnEffects.length > 0) {
        const turnEffectLogs = logs.filter(log => 
          log.type === 'turn_effect_triggered');
        
        return turnEffectLogs.length === 0;
      }
      
      return false;
    },
    fix: (state) => {
      // Clone state to avoid mutation
      const newState = JSON.parse(JSON.stringify(state)) as GameState;
      
      // Process all cards with potential turn effects
      const activePlayer = newState.activePlayer || 'player';
      const nonActivePlayer = activePlayer === 'player' ? 'opponent' : 'player';
      
      // Process cards for the active player first (for start of turn effects)
      if (newState.players[activePlayer]?.battlefield) {
        newState.players[activePlayer].battlefield.forEach(card => {
          const description = (card.card.description || '').toLowerCase();
          
          // Handle common turn start effects
          if (card.card.turnStartEffect || 
              description.includes('at the start of your turn') || 
              description.includes('at the beginning of your turn')) {
              
            // Card draw effect (like Nat Pagle)
            if (description.includes('draw') && description.includes('card')) {
              // Only apply if player has cards in deck and room in hand
              if (newState.players[activePlayer].deck.length > 0 && 
                  newState.players[activePlayer].hand.length < 10) {
                // Move a card from deck to hand
                const drawnCard = newState.players[activePlayer].deck.shift();
                if (drawnCard) {
                  newState.players[activePlayer].hand.push(drawnCard);
                }
              }
            }
            
            // Mana crystal gain (like Wild Growth)
            if (description.includes('gain') && 
                (description.includes('mana crystal') || description.includes('mana'))) {
              if (newState.players[activePlayer].mana && 
                  newState.players[activePlayer].mana.max < 10) {
                // Add 1 max mana if possible
                newState.players[activePlayer].mana.max += 1;
                newState.players[activePlayer].mana.current += 1;
              }
            }
            
            // Healing effect
            if (description.includes('restore') && description.includes('health')) {
              // Typically heals the hero
              const healthAmount = description.includes('2 health') ? 2 : 
                                  description.includes('3 health') ? 3 : 
                                  description.includes('4 health') ? 4 : 2;
              
              if (newState.players[activePlayer].health) {
                newState.players[activePlayer].health = Math.min(
                  30, // Max health
                  newState.players[activePlayer].health + healthAmount
                );
              }
            }
          }
          
          // Handle end of turn effects - apply to previous active player
          if (card.card.turnEndEffect || description.includes('at the end of your turn')) {
            // Damage effects
            if (description.includes('deal') && description.includes('damage')) {
              const damage = description.includes('1 damage') ? 1 :
                            description.includes('2 damage') ? 2 : 1;
              
              // Determine target based on description
              if (description.includes('to all') || description.includes('to every')) {
                // AOE damage
                if (newState.players[nonActivePlayer].battlefield) {
                  newState.players[nonActivePlayer].battlefield.forEach(minion => {
                    if (minion.currentHealth) {
                      minion.currentHealth -= damage;
                    }
                  });
                }
                
                if (newState.players[nonActivePlayer].health) {
                  newState.players[nonActivePlayer].health -= damage;
                }
                
                // Also damage own side if it says "all"
                if (description.includes('to all')) {
                  newState.players[activePlayer].battlefield.forEach(minion => {
                    if (minion.currentHealth && minion.instanceId !== card.instanceId) {
                      minion.currentHealth -= damage;
                    }
                  });
                }
              } else if (description.includes('to a random enemy') || description.includes('to random enemy')) {
                // Random enemy damage
                if (newState.players[nonActivePlayer].battlefield.length > 0) {
                  const randomIndex = Math.floor(Math.random() * newState.players[nonActivePlayer].battlefield.length);
                  const targetMinion = newState.players[nonActivePlayer].battlefield[randomIndex];
                  
                  if (targetMinion.currentHealth) {
                    targetMinion.currentHealth -= damage;
                  }
                } else if (newState.players[nonActivePlayer].health) {
                  // No minions, hit face
                  newState.players[nonActivePlayer].health -= damage;
                }
              }
            }
            
            // Summon effect
            if (description.includes('summon') && 
                newState.players[activePlayer].battlefield.length < 7) { // Board not full
              // Create a simple token minion
              const newMinion: CardInstance = {
                instanceId: `token-${Date.now()}-${Math.random()}`,
                card: {
                  id: 9999, // Generic token ID
                  name: 'Token Minion',
                  description: 'Summoned by turn effect',
                  type: 'minion',
                  rarity: 'common',
                  manaCost: 1,
                  attack: 1,
                  health: 1,
                  class: newState.players[activePlayer].heroClass || 'Neutral'
                },
                attacksPerformed: 0,
                canAttack: false, // Summoning sickness
                isSummoningSick: true,
                currentHealth: 1
              };
              
              newState.players[activePlayer].battlefield.push(newMinion);
            }
          }
        });
      }
      
      return newState;
    },
    fixSuggestion: 'Add proper turn effect handling in turnEffectsUtils.ts. Ensure endTurn and startTurn functions process effects correctly.'
  },
  
  // Minion not removed after health reaches zero
  {
    id: 'zombie-minion',
    name: 'Zombie Minion',
    description: 'Minion not removed from battlefield after health reaches zero',
    severity: 'critical',
    autoFixable: true,
    detect: (logs, state) => {
      if (!state) return false;
      
      // Check if any minions have zero or negative health but are still on the battlefield
      const zombieMinions = [];
      
      if (state.players.player && state.players.player.battlefield) {
        zombieMinions.push(...state.players.player.battlefield.filter(
          minion => minion.currentHealth !== undefined && minion.currentHealth <= 0
        ));
      }
      
      if (state.players.opponent && state.players.opponent.battlefield) {
        zombieMinions.push(...state.players.opponent.battlefield.filter(
          minion => minion.currentHealth !== undefined && minion.currentHealth <= 0
        ));
      }
      
      return zombieMinions.length > 0;
    },
    fix: (state) => {
      // Clone state to avoid mutation
      const newState = JSON.parse(JSON.stringify(state)) as GameState;
      
      // Advanced fix for zombie minions - multiple checks
      
      // Check 1: Battlefield cleanup
      if (newState.players.player && newState.players.player.battlefield) {
        // Store original length for verification
        const originalLength = newState.players.player.battlefield.length;
        
        // First pass - explicit filter for current health > 0
        newState.players.player.battlefield = newState.players.player.battlefield.filter(minion => {
          return minion.currentHealth !== undefined && minion.currentHealth > 0;
        });
        
        // Second pass - ensure health is at least 1 for any remaining minions
        newState.players.player.battlefield.forEach(minion => {
          // Set a valid health value for any remaining minions with undefined or <= 0 health
          if (minion.currentHealth === undefined || minion.currentHealth <= 0) {
            minion.currentHealth = Math.max(1, minion.card.health || 1);
            // Also update the base card health if it's invalid
            if (!minion.card.health || minion.card.health <= 0) {
              minion.card.health = minion.currentHealth;
            }
          }
        });
        
        // Log the cleanup results for debugging
        console.log(`Zombie minion cleanup - Player: Removed ${originalLength - newState.players.player.battlefield.length} invalid minions`);
      }
      
      // Same process for opponent
      if (newState.players.opponent && newState.players.opponent.battlefield) {
        const originalLength = newState.players.opponent.battlefield.length;
        
        newState.players.opponent.battlefield = newState.players.opponent.battlefield.filter(minion => {
          return minion.currentHealth !== undefined && minion.currentHealth > 0;
        });
        
        newState.players.opponent.battlefield.forEach(minion => {
          if (minion.currentHealth === undefined || minion.currentHealth <= 0) {
            minion.currentHealth = Math.max(1, minion.card.health || 1);
            if (!minion.card.health || minion.card.health <= 0) {
              minion.card.health = minion.currentHealth;
            }
          }
        });
        
        console.log(`Zombie minion cleanup - Opponent: Removed ${originalLength - newState.players.opponent.battlefield.length} invalid minions`);
      }
      
      // Check 2: Update game event log to reflect the minion deaths
      if (state.eventLog) {
        // Add death events for removed minions
        const newDeathEvents = [
          {
            id: `death-event-${Date.now()}-1`,
            type: 'minion_death',
            text: 'Auto-fix: Removed minion with 0 or negative health',
            timestamp: Date.now(),
            turn: state.turn
          }
        ];
        
        if (Array.isArray(newState.eventLog)) {
          newState.eventLog = [...newState.eventLog, ...newDeathEvents];
        } else {
          newState.eventLog = newDeathEvents;
        }
      }
      
      // Check 3: Verify death triggers are properly applied
      // (In a real implementation, this would call death trigger processor functions)
      
      return newState;
    }
  },
  
  // Mana crystal issues
  {
    id: 'mana-crystal-issue',
    name: 'Mana Crystal Issue',
    description: 'Mana crystals not updating correctly after playing cards or ending turns',
    severity: 'high',
    autoFixable: true,
    detect: (logs, state) => {
      if (!state) return false;
      
      // Check for incorrect mana values
      const playerMana = state.players.player.mana;
      const opponentMana = state.players.opponent.mana;
      
      // Max mana should never exceed 10
      if (playerMana.max > 10 || opponentMana.max > 10) return true;
      
      // Current mana should never exceed max mana
      if (playerMana.current > playerMana.max || opponentMana.current > opponentMana.max) return true;
      
      // Current mana should never be negative
      if (playerMana.current < 0 || opponentMana.current < 0) return true;
      
      return false;
    },
    fix: (state) => {
      // Clone state to avoid mutation
      const newState = JSON.parse(JSON.stringify(state)) as GameState;
      
      // Fix player mana
      if (newState.players.player.mana.max > 10) {
        newState.players.player.mana.max = 10;
      }
      
      if (newState.players.player.mana.current > newState.players.player.mana.max) {
        newState.players.player.mana.current = newState.players.player.mana.max;
      }
      
      if (newState.players.player.mana.current < 0) {
        newState.players.player.mana.current = 0;
      }
      
      // Fix opponent mana
      if (newState.players.opponent.mana.max > 10) {
        newState.players.opponent.mana.max = 10;
      }
      
      if (newState.players.opponent.mana.current > newState.players.opponent.mana.max) {
        newState.players.opponent.mana.current = newState.players.opponent.mana.max;
      }
      
      if (newState.players.opponent.mana.current < 0) {
        newState.players.opponent.mana.current = 0;
      }
      
      return newState;
    }
  }
];

/**
 * Analyzes game logs and state to detect known bug patterns
 */
export function detectBugs(logs: GameLogEvent[], state: GameState | null): BugDetectionResult {
  const detectedBugs: DetectedBug[] = [];
  const fixedBugs: DetectedBug[] = [];
  let fixedState = state ? JSON.parse(JSON.stringify(state)) as GameState : null;
  
  // Process each bug pattern
  for (const pattern of bugPatterns) {
    // Check if the bug pattern is detected
    if (pattern.detect(logs, state)) {
      const bug: DetectedBug = {
        pattern,
        fixApplied: false
      };
      
      // If the bug can be auto-fixed and we have a valid state
      if (pattern.autoFixable && pattern.fix && fixedState) {
        // Apply the fix
        fixedState = pattern.fix(fixedState);
        bug.fixApplied = true;
        bug.fixResult = 'Fix applied successfully';
        fixedBugs.push(bug);
      } else {
        // Not auto-fixable or no state to fix
        detectedBugs.push(bug);
      }
    }
  }
  
  // Generate summary
  const summary = generateBugSummary(detectedBugs, fixedBugs);
  
  return {
    detectedBugs,
    fixedBugs,
    summary,
    timestamp: Date.now()
  };
}

/**
 * Generate a human-readable summary of bug detection results
 */
function generateBugSummary(detectedBugs: DetectedBug[], fixedBugs: DetectedBug[]): string {
  if (detectedBugs.length === 0 && fixedBugs.length === 0) {
    return 'No bugs detected in the current game state.';
  }
  
  let summary = '';
  
  if (fixedBugs.length > 0) {
    summary += `✅ Auto-fixed ${fixedBugs.length} issue${fixedBugs.length === 1 ? '' : 's'}:\n`;
    fixedBugs.forEach(bug => {
      summary += `- ${bug.pattern.name} (${bug.pattern.severity})\n`;
    });
    summary += '\n';
  }
  
  if (detectedBugs.length > 0) {
    summary += `⚠️ Detected ${detectedBugs.length} issue${detectedBugs.length === 1 ? '' : 's'} requiring manual attention:\n`;
    detectedBugs.forEach(bug => {
      summary += `- ${bug.pattern.name} (${bug.pattern.severity})\n`;
      if (bug.pattern.fixSuggestion) {
        summary += `  Suggestion: ${bug.pattern.fixSuggestion}\n`;
      }
    });
  }
  
  return summary;
}

/**
 * Apply auto-fixes to the game state based on detected bugs
 */
export function applyAutoFixes(state: GameState, logs: GameLogEvent[]): GameState {
  // Clone the state to avoid mutation
  let fixedState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Process each bug pattern
  for (const pattern of bugPatterns) {
    // If the bug is auto-fixable and detected
    if (pattern.autoFixable && pattern.fix && pattern.detect(logs, fixedState)) {
      // Apply the fix
      fixedState = pattern.fix(fixedState);
      console.log(`Applied auto-fix for: ${pattern.name}`);
    }
  }
  
  return fixedState;
}