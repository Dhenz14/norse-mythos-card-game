import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { toast } from 'sonner';
import { createCardInstance, findCardInstance } from '../utils/cards/cardUtils';
import { 
  initializeGame, 
  playCard, 
  endTurn, 
  processAttack
} from '../utils/gameUtils';
import { executeHeroPower } from '../utils/heroPowerUtils';
import { processDiscovery } from '../utils/discoveryUtils';
import { toggleCardSelection, confirmMulligan, skipMulligan } from '../utils/mulliganUtils';
import { CardInstance, GameState, AnimationParams, CardData } from '../types';
import { Position } from '../types/Position';
import { reverseAdaptCardInstance } from '../utils/cards/cardInstanceAdapter';
import { CardInstanceWithCardData } from '../types/interfaceExtensions';
import { useAudio } from '../../lib/stores/useAudio';
import useGame from '../../lib/stores/useGame';
import { useAnimationStore } from '../animations/AnimationManager';
import { useAnimationStore as useAnnouncementStore, fireActionAnnouncement } from './animationStore';
import { isAISimulationMode, debug, getDebugConfig } from '../config/debugConfig';
import { getPokerCombatAdapterState } from '../hooks/usePokerCombatAdapter';
import { CombatAction, CombatPhase } from '../types/PokerCombatTypes';
import { useTargetingStore, predictAttackOutcome } from './targetingStore';
import { logActivity } from './activityLogStore';
import { CombatEventBus } from '../services/CombatEventBus';
import { getAttack } from '../utils/cards/typeGuards';

// ============== BATTLEFIELD DEBUG MONITOR ==============
// Track battlefield changes with stack traces to identify root cause of minion disappearance
// Controlled by debugConfig.logBattlefieldChanges (default: false)
let prevBattlefieldSnapshot: { player: string[], opponent: string[] } = { player: [], opponent: [] };

function captureStackTrace(): string {
  const err = new Error();
  return err.stack?.split('\n').slice(2, 10).join('\n') || 'Stack not available';
}

function logBattlefieldChange(
  side: 'player' | 'opponent',
  prevCards: string[],
  newCards: string[],
  stack: string
) {
  if (!getDebugConfig().logBattlefieldChanges) return;
  
  const removed = prevCards.filter(c => !newCards.includes(c));
  const added = newCards.filter(c => !prevCards.includes(c));
  
  if (removed.length > 0 || added.length > 0) {
    console.warn(`[BattlefieldDebug] ${side} battlefield CHANGED:`);
    console.warn(`  Previous (${prevCards.length}):`, prevCards);
    console.warn(`  New (${newCards.length}):`, newCards);
    if (removed.length > 0) console.warn(`  REMOVED:`, removed);
    if (added.length > 0) console.warn(`  Added:`, added);
    console.warn(`  Stack trace:\n${stack}`);
    
    // Special alert if battlefield was cleared unexpectedly
    if (prevCards.length > 0 && newCards.length === 0) {
      console.error(`[BattlefieldDebug] CRITICAL: ${side} battlefield CLEARED to empty!`);
    }
  }
}

// DEPRECATED: Use GameEventBus.emitNotification() instead
// These functions will be removed once event-driven architecture migration is complete
// See: client/src/game/subscribers/NotificationSubscriber.ts
function showSpellNotification(cardName: string, effectType?: string, value?: number) {
  const effectEmoji = {
    'damage': '🔥',
    'aoe_damage': '💥',
    'heal': '💚',
    'restore_health': '💚',
    'buff': '💪',
    'give_stats': '💪',
    'draw': '📚',
    'draw_cards': '📚',
    'summon': '🧩',
    'destroy': '💀',
    'freeze': '❄️',
    'silence': '🔇',
    'transform': '🔮',
    'discover': '🔍',
    'armor': '🛡️',
  }[effectType || 'default'] || '✨';
  
  let description = 'Spell cast!';
  if (effectType === 'damage' || effectType === 'aoe_damage') {
    description = value ? `Dealt ${value} damage!` : 'Damage dealt!';
  } else if (effectType === 'heal' || effectType === 'restore_health') {
    description = value ? `Restored ${value} health!` : 'Healing applied!';
  } else if (effectType === 'draw' || effectType === 'draw_cards') {
    description = value ? `Drew ${value} card${value > 1 ? 's' : ''}!` : 'Cards drawn!';
  } else if (effectType === 'summon') {
    description = 'Minion(s) summoned!';
  } else if (effectType === 'destroy') {
    description = 'Target destroyed!';
  } else if (effectType === 'freeze') {
    description = 'Target frozen!';
  } else if (effectType === 'armor') {
    description = value ? `Gained ${value} armor!` : 'Armor gained!';
  }
  
  toast.info(`${effectEmoji} ${cardName}`, { description, duration: 2500 });
}

// DEPRECATED: Use GameEventBus.emitMinionSummoned() instead
// The NotificationSubscriber handles minion summoned notifications
function showMinionNotification(cardName: string, attack?: number, health?: number) {
  const description = attack !== undefined && health !== undefined 
    ? `${attack}/${health} minion summoned to battle!`
    : 'Minion summoned to the battlefield!';
  
  toast.info(`⚔️ ${cardName}`, { description, duration: 2000 });
}

// Avoid direct import in the store initialization to prevent circular dependencies

interface GameStore {
  // Game state
  gameState: GameState;
  selectedCard: CardInstance | null;
  // For tracking attack selection
  attackingCard: CardInstance | null;
  // For tracking hero power target selection
  heroTargetMode: boolean;
  
  // Game actions
  initGame: () => void;
  playCard: (cardId: string, targetId?: string, targetType?: 'minion' | 'hero') => void;
  attackWithCard: (attackerId: string, defenderId?: string) => void; // If defenderId is undefined, attack hero
  selectAttacker: (card: CardInstance | CardInstanceWithCardData | null) => void; // Select card to attack with
  useHeroPower: (targetId?: string, targetType?: 'card' | 'hero') => void; // Use hero power
  toggleHeroTargetMode: () => void; // Toggle hero power targeting mode
  endTurn: () => void;
  selectCard: (card: CardInstance | CardInstanceWithCardData | null) => void;
  resetGameState: () => void;
  setGameState: (state: Partial<GameState>) => void;
  selectDiscoveryOption: (card: CardData | null) => void;
  
  // Mulligan actions
  toggleMulliganCard: (cardId: string) => void;
  confirmMulligan: () => void;
  skipMulligan: () => void;
  
  // Poker hand rewards - give mana crystal and draw a card
  grantPokerHandRewards: () => void;
  
  // UI actions
  setHoveredCard: (card: CardInstance | CardInstanceWithCardData | null) => void;
  hoveredCard: CardInstance | null;
}

// Create a battlefield monitor that tracks changes with stack traces
let prevBattlefieldLength = 0;

// Create store with subscribeWithSelector middleware for precise battlefield monitoring
export const useGameStore = create<GameStore>()(subscribeWithSelector((set, get) => ({
  gameState: initializeGame(),
  selectedCard: null,
  hoveredCard: null,
  attackingCard: null,
  heroTargetMode: false,

  initGame: () => {
    // Get selectedDeck and selectedHero from useGame store
    const { selectedDeck, selectedHero, selectedHeroId } = useGame.getState();
    // Convert null to undefined for function compatibility
    const deckId = selectedDeck === null ? undefined : selectedDeck;
    const hero = selectedHero === null ? undefined : selectedHero;
    const heroId = selectedHeroId === null ? undefined : selectedHeroId;
    
    set({ 
      gameState: initializeGame(deckId, hero, heroId),
      selectedCard: null,
      hoveredCard: null,
      attackingCard: null,
      heroTargetMode: false
    });
  },

  playCard: (cardId: string, targetId?: string, targetType?: 'minion' | 'hero') => {
    const { gameState } = get();
    const audioStore = useAudio.getState();
    
    try {
      // Check if it's player's turn - add exception for AI simulation
      if (gameState.currentTurn !== 'player' && !isAISimulationMode()) {
        throw new Error('Not your turn');
      }
      
      // Find the card in player's hand
      const player = gameState.players.player;
      const cardResult = findCardInstance(player.hand, cardId);
      
      if (!cardResult) {
        throw new Error('Card not found');
      }
      
      // Extract the card instance from the result
      const cardInstance = cardResult.card as CardInstance;
      
      // Check if player has enough mana
      if (!player.mana || typeof player.mana.current !== 'number') {
        player.mana = { current: 1, max: 1, overloaded: 0, pendingOverload: 0 };
      }
      
      const cardCost = cardInstance.card.manaCost ?? 0;
      if (cardCost > player.mana.current) {
        throw new Error(`Not enough mana. Need ${cardCost} but only have ${player.mana.current}`);
      }

      // HEARTHSTONE RULE: Maximum 7 minions on battlefield
      const MAX_BATTLEFIELD_SIZE = 7;
      if (cardInstance.card.type === 'minion' && player.battlefield.length >= MAX_BATTLEFIELD_SIZE) {
        throw new Error(`Battlefield is full! Maximum ${MAX_BATTLEFIELD_SIZE} minions allowed.`);
      }

      // Ensure the card has a keywords array even if it's missing
      if (!cardInstance.card.keywords) {
        cardInstance.card.keywords = [];
      }
      
      // For cards with battlecry that require target, check if we have a target
      if (cardInstance.card.type === 'minion' && 
          cardInstance.card.keywords.includes('battlecry') && 
          cardInstance.card.battlecry?.requiresTarget && 
          !targetId) {
        debug.log(`${cardInstance.card.name} requires a battlecry target`);
        return; // Don't proceed without a target
      }
      
      // Save the card data for reference after it's played
      const cardData = JSON.parse(JSON.stringify(cardInstance.card));
      
      try {
        // Play the card with the target if provided
        const newState = playCard(gameState, cardId, targetId, targetType);
        
        // If the card requires a battlecry target but we still don't have a valid game state,
        // it means the battlecry couldn't be executed properly
        if (cardData.type === 'minion' && 
            cardData.keywords.includes('battlecry') && 
            cardData.battlecry?.requiresTarget && 
            newState === gameState) {
          debug.log('Battlecry target validation failed');
          return;
        }
        
        // Show notification based on card type
        if (cardInstance.card.type === 'spell') {
          const effectType = cardInstance.card.spellEffect?.type || 'default';
          const effectValue = cardInstance.card.spellEffect?.value;
          showSpellNotification(cardInstance.card.name, effectType as string, effectValue as number);
          
          // Log to saga feed
          logActivity('spell_cast', 'player', `Cast ${cardInstance.card.name}`, {
            cardName: cardInstance.card.name,
            cardId: typeof cardInstance.card.id === 'number' ? cardInstance.card.id : undefined,
            value: effectValue as number
          });
        } else if (cardInstance.card.type === 'minion') {
          showMinionNotification(
            cardInstance.card.name, 
            cardInstance.card.attack, 
            cardInstance.card.health
          );
          
          // Show battlecry popup if the minion has a battlecry (like Hearthstone)
          if (cardInstance.card.keywords.includes('battlecry') && 
              cardInstance.card.battlecry) {
            // Get the battlecry description from the card
            const battlecryDescription = cardInstance.card.description || 
              `Battlecry: ${cardInstance.card.battlecry.type || 'Special effect'}`;
            
            // Fire the battlecry announcement popup
            fireActionAnnouncement('battlecry', cardInstance.card.name, {
              subtitle: battlecryDescription,
              rarity: cardInstance.card.rarity as 'common' | 'rare' | 'epic' | 'legendary',
              cardClass: cardInstance.card.class as any,
              duration: 2500
            });
          }
          
          // Log to saga feed
          logActivity('minion_summoned', 'player', `Summoned ${cardInstance.card.name} (${cardInstance.card.attack}/${cardInstance.card.health})`, {
            cardName: cardInstance.card.name,
            cardId: typeof cardInstance.card.id === 'number' ? cardInstance.card.id : undefined
          });
        }
        
        // Check if the card has a spell effect that triggers discovery
        const hasDiscover = (cardInstance.card.type === 'spell' && cardInstance.card.spellEffect?.type === 'discover') || 
                          cardInstance.card.keywords?.includes('discover');

        if (hasDiscover && newState.discovery?.active) {
          // Play sound effect
          if (audioStore && typeof audioStore.playSoundEffect === 'function') {
            audioStore.playSoundEffect('discover');
          }
          
          set({ 
            gameState: newState,
            selectedCard: null
          });
        } else {
          // Normal card play, no discovery
          
          // Play sound effect based on card type
          if (cardInstance.card.rarity === 'legendary') {
            if (audioStore && typeof audioStore.playSoundEffect === 'function') {
              audioStore.playSoundEffect('legendary');
            }
          } else if (cardInstance.card.type === 'minion' && 
                    cardInstance.card.keywords.includes('battlecry') && 
                    cardInstance.card.battlecry?.type === 'damage') {
            if (audioStore && typeof audioStore.playSoundEffect === 'function') {
              audioStore.playSoundEffect('damage');
            }
          } else {
            if (audioStore && typeof audioStore.playSoundEffect === 'function') {
              audioStore.playSoundEffect('card_play');
            }
          }
          
          let finalState = newState;
          const hasCharge = cardInstance.card.keywords.includes('charge');
          const hasRush = cardInstance.card.keywords.includes('rush');
          
          if (cardInstance.card.type === 'minion' && (cardInstance.card.attack ?? 0) > 0 && (hasCharge || hasRush)) {
            // Find the minion in state and ensure it's ready to attack
            const minionIndex = finalState.players.player.battlefield.findIndex(
              (c: CardInstance) => c.instanceId === cardInstance.instanceId
            );
            if (minionIndex !== -1) {
              finalState.players.player.battlefield[minionIndex].isSummoningSick = false;
              finalState.players.player.battlefield[minionIndex].canAttack = true;
            }
          }
          
          // Update state
          set({ 
            gameState: finalState,
            selectedCard: null
          });
        }
      } catch (playCardError) {
        console.error(`[PLAY-CARD-ERROR] Error in playCard utility for ${cardInstance.card.name}:`, playCardError);
        throw playCardError;
      }
    } catch (error) {
      console.error('Error playing card:', error);
    }
  },

  endTurn: () => {
    const { gameState } = get();
    const audioStore = useAudio.getState();
    
    try {
      // Log end turn to saga feed
      logActivity('turn_end', 'player', `Turn ${gameState.turnNumber} ended`);
      
      const newState = endTurn(gameState);
      
      // Log start of new turn to saga feed
      logActivity('turn_start', newState.currentTurn === 'player' ? 'player' : 'opponent', 
        `Turn ${newState.turnNumber} - ${newState.currentTurn === 'player' ? 'Your' : "Opponent's"} turn`);
      
      // Play sound effect
      if (audioStore && typeof audioStore.playSoundEffect === 'function') {
        audioStore.playSoundEffect('turn_end');
      }
      
      // End Turn = Fold in poker, deal new cards
      // Using unified store via adapter (no more legacy PokerCombatStore)
      const pokerAdapter = getPokerCombatAdapterState();
      if (pokerAdapter.isActive && pokerAdapter.combatState) {
        const phase = pokerAdapter.combatState.phase;
        const playerId = pokerAdapter.combatState.player.playerId;
        
        // Skip mulligan phase - that's handled separately
        if (phase !== CombatPhase.MULLIGAN) {
          debug.log('[UnifiedEndTurn] End Turn = Fold - starting new poker hand');
          
          // Perform fold action (BRACE)
          pokerAdapter.performAction(playerId, CombatAction.BRACE);
          
          // Get the resolution after fold for HP restoration
          const resolution = pokerAdapter.resolveCombat();
          
          // Use centralized delayed transition to avoid race conditions
          if (resolution) {
            pokerAdapter.startNextHandDelayed(resolution);
          }
        } else {
          debug.log('[UnifiedEndTurn] Skipping mulligan phase');
        }
      }
      
      set({ 
        gameState: newState,
        selectedCard: null
      });
    } catch (error) {
      console.error('Error ending turn:', error);
    }
  },

  // Select a card as a possible attacker
  selectAttacker: (card: CardInstance | CardInstanceWithCardData | null) => {
    const targetingStore = useTargetingStore.getState();
    
    // If card is not null, set it as the attacking card
    if (card) {
      set({ attackingCard: card as CardInstance });
      
      // Calculate valid targets for this attacker
      const { gameState } = get();
      const opponentBattlefield = gameState.players.opponent.battlefield || [];
      
      // Check if any opponent minion has taunt
      const hasTaunt = opponentBattlefield.some((m: CardInstance) => 
        m.card?.keywords?.includes('taunt')
      );
      
      // Build list of valid target IDs
      const validTargetIds: string[] = [];
      
      if (hasTaunt) {
        // Can only attack taunt minions
        opponentBattlefield.forEach((m: CardInstance) => {
          if (m.card?.keywords?.includes('taunt')) {
            validTargetIds.push(m.instanceId);
          }
        });
      } else {
        // Can attack any opponent minion or hero
        opponentBattlefield.forEach((m: CardInstance) => {
          validTargetIds.push(m.instanceId);
        });
        // Can also attack hero
        validTargetIds.push('opponent-hero');
      }
      
      debug.log('[Targeting] Starting targeting for', card.instanceId, 'with valid targets:', validTargetIds);
      targetingStore.startTargeting(card.instanceId, validTargetIds);
    } else {
      // Clear the selection and cancel targeting
      set({ attackingCard: null });
      targetingStore.cancelTargeting();
    }
  },
  
  // Execute an attack with the selected card against a target (or hero if no target)
  attackWithCard: (attackerId: string, defenderId?: string) => {
    const { gameState } = get();
    const audioStore = useAudio.getState();
    const targetingStore = useTargetingStore.getState();
    
    // Get animation stores - use getState() since we're outside React component
    const animationManager = useAnimationStore.getState();
    const announcementStore = useAnnouncementStore.getState();
    
    // Find the attacker card for animation
    const attackerCard = gameState.players.player.battlefield.find(
      c => c.instanceId === attackerId
    );

    if (attackerCard) {
      const hasWindfury = attackerCard.card.keywords?.includes('windfury');
      const maxAttacks = hasWindfury ? 2 : 1;
      if ((attackerCard.attacksPerformed || 0) >= maxAttacks) {
        toast.error("This minion already attacked this turn!");
        targetingStore.cancelTargeting();
        set({ attackingCard: null });
        return;
      }
    }
    
    // Get attacker position for animation
    const attackerPosition = (attackerCard as any)?.animationPosition || { x: 400, y: 500 };
    
    // Get target position (hero or minion)
    let targetPosition = { x: 600, y: 150 }; // Default opponent hero position
    
    if (defenderId && defenderId !== 'opponent-hero') {
      // Find target minion position
      const targetCard = gameState.players.opponent.battlefield.find(
        c => c.instanceId === defenderId
      );
      if ((targetCard as any)?.animationPosition) {
        targetPosition = (targetCard as any).animationPosition;
      }
    } else {
      // Attacking hero - try to get hero position from DOM
      const heroElement = document.querySelector('.opponent-hero-portrait, .opponent-hero, [class*="hero"]');
      if (heroElement) {
        const rect = heroElement.getBoundingClientRect();
        targetPosition = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }
    }
    
    // Animation duration in ms - slowed down for better visibility (800ms for clear attack visual)
    const attackAnimationDuration = 800;
    
    try {
      // Add visual attack animation BEFORE processing the attack
      if (attackerCard && animationManager && animationManager.addAnimation) {
        animationManager.addAnimation({
          id: crypto.randomUUID(),
          type: 'attack',
          position: attackerPosition,
          targetPosition: targetPosition,
          card: attackerCard.card,
          duration: attackAnimationDuration,
          startTime: Date.now()
        });
      }
      
      // Show attack announcement popup (optional enhancement)
      if (attackerCard && announcementStore && announcementStore.addAnnouncement) {
        announcementStore.addAnnouncement({
          type: 'attack',
          title: `${attackerCard.card.name} attacks!`,
          subtitle: defenderId === 'opponent-hero' || !defenderId ? 'Attacking Hero' : 'Attacking Minion',
          icon: '⚔️',
          duration: attackAnimationDuration + 200
        });
      }
      
      // Delay the actual attack processing to allow animation to play
      // Process at 60% of animation duration for impact feel
      const impactDelay = Math.round(attackAnimationDuration * 0.6);
      
      setTimeout(() => {
        const { gameState: freshState } = get();
        
        const freshAttackerCard = freshState.players.player.battlefield.find(
          c => c.instanceId === attackerId
        );
        
        if (!freshAttackerCard) {
          targetingStore.cancelTargeting();
          set({ attackingCard: null, selectedCard: null });
          return;
        }
        
        const newState = processAttack(freshState, attackerId, defenderId);
        
        // If the state changed, it means the attack was successful
        if (newState !== freshState) {
          // Play sound effect at impact time
          if (audioStore && typeof audioStore.playSoundEffect === 'function') {
            audioStore.playSoundEffect('attack');
          }
          
          // PROFESSIONAL EVENT-DRIVEN DAMAGE: Emit IMPACT_PHASE event
          // All subscribers (PokerCombatStore, animations, sound, etc.) react independently
          // This replaces the old direct bridge call for a cleaner architecture
          if (freshAttackerCard) {
            const damage = getAttack(freshAttackerCard.card);
            const targetMinion = freshState.players.opponent.battlefield.find(c => c.instanceId === defenderId);
            const counterDamage = targetMinion ? getAttack(targetMinion.card) : 0;
            
            // Determine target type
            const isHeroTarget = !defenderId || defenderId === 'opponent-hero';
            
            // Emit impact phase event - all subscribers will react
            CombatEventBus.emitImpactPhase({
              attackerId: attackerId,
              targetId: defenderId || 'opponent-hero',
              damageToTarget: damage,
              damageToAttacker: isHeroTarget ? 0 : counterDamage
            });
            
            // Emit damage resolved for complete event chain
            CombatEventBus.emitDamageResolved({
              sourceId: attackerId,
              sourceType: 'minion',
              targetId: defenderId || 'opponent-hero',
              targetType: isHeroTarget ? 'hero' : 'minion',
              actualDamage: damage,
              damageSource: 'minion_attack',
              attackerOwner: 'player',
              defenderOwner: 'opponent',
              targetHealthBefore: 0,
              targetHealthAfter: 0,
              targetDied: false,
              counterDamage: isHeroTarget ? undefined : counterDamage
            });
          }
          
          // Log attack to saga feed
          if (freshAttackerCard) {
            const targetName = defenderId === 'opponent-hero' || !defenderId 
              ? 'enemy hero' 
              : freshState.players.opponent.battlefield.find(c => c.instanceId === defenderId)?.card.name || 'enemy minion';
            
            logActivity('attack', 'player', `${freshAttackerCard.card.name} attacked ${targetName}`, {
              cardName: freshAttackerCard.card.name,
              targetName: targetName,
              value: getAttack(freshAttackerCard.card)
            });
          }
          
          // Clear targeting state - attack completed
          targetingStore.cancelTargeting();
          
          // Update game state
          set({
            gameState: newState,
            attackingCard: null, // Clear attacking card after attack
            selectedCard: null   // Clear any selected card
          });
        } else {
          // Attack failed - clear targeting
          targetingStore.cancelTargeting();
        }
      }, impactDelay);
      
    } catch (error) {
      console.error('Error processing attack:', error);
      // Clear targeting on error
      targetingStore.cancelTargeting();
    }
  },
  
  selectCard: (card: CardInstance | CardInstanceWithCardData | null) => {
    if (card) {
      set({ selectedCard: card as CardInstance });
    } else {
      set({ selectedCard: null });
    }
  },
  
  // Reset the game state to initial values
  resetGameState: () => {
    debug.log('Resetting game state to initial values');
    set({
      gameState: initializeGame(),
      selectedCard: null,
      hoveredCard: null,
      attackingCard: null,
      heroTargetMode: false
    });
  },
  
  setGameState: (state: Partial<GameState>) => {
    const { gameState } = get();
    set({
      gameState: {
        ...gameState,
        ...state
      }
    });
  },

  selectDiscoveryOption: (card: CardData | null) => {
    const { gameState } = get();
    if (!gameState.discovery || !gameState.discovery.active) return;
    
    debug.log(`[GameStore] Selecting discovery option: ${card?.name || 'Skip'}`);
    
    // Execute the callback stored in discovery state
    if (!gameState.discovery.callback) return;
    const newState = gameState.discovery.callback(card);
    
    // Ensure discovery is deactivated in the new state
    if (newState) {
      newState.discovery = {
        ...newState.discovery,
        active: false,
        options: []
      };
      set({ gameState: newState });
    }
  },
  
  // Directly set the players (useful for AI simulation)
  setPlayers: (players: GameState['players']) => {
    if (process.env.NODE_ENV === 'development') {
      debug.log('Setting players directly');
    }
    const { gameState } = get();
    
    // Check if we're actually changing anything to avoid unnecessary updates
    if (JSON.stringify(gameState.players) === JSON.stringify(players)) {
      return;
    }
    
      set({ 
        gameState: {
          ...gameState,
          players: players as any
        }
      });
  },

  setHoveredCard: (card: CardInstance | CardInstanceWithCardData | null) => {
    if (card) {
      set({ hoveredCard: card as CardInstance });
    } else {
      set({ hoveredCard: null });
    }
  },
  
  // Toggle hero power targeting mode
  toggleHeroTargetMode: () => {
    const { heroTargetMode, gameState } = get();
    
    // Can only enter hero power mode if it's player's turn and hero power is not used
    if (!heroTargetMode && gameState.currentTurn === 'player' && !gameState.players.player.heroPower.used) {
      // Check if player has enough mana for hero power
      if (gameState.players.player.mana.current >= gameState.players.player.heroPower.cost) {
        set({ 
          heroTargetMode: true,
          attackingCard: null  // Clear any attack selection
        });
        debug.log(`Hero power mode activated: ${gameState.players.player.heroPower.name}`);
      } else {
        console.error('Not enough mana to use hero power');
      }
    } else {
      // Exit hero power mode
      set({ heroTargetMode: false });
      debug.log('Hero power mode deactivated');
    }
  },
  
  // Toggle a card selection during mulligan phase
  toggleMulliganCard: (cardId: string) => {
    const { gameState } = get();
    
    try {
      // Only process during mulligan phase
      if (gameState.gamePhase !== 'mulligan' || !gameState.mulligan?.active) {
        throw new Error('Not in mulligan phase');
      }
      
      const newState = toggleCardSelection(gameState, cardId);
      set({ gameState: newState });
      debug.log(`Toggled mulligan selection for card ${cardId}`);
    } catch (error) {
      console.error('Error during mulligan selection:', error);
    }
  },
  
  // Confirm mulligan selections and replace selected cards
  confirmMulligan: () => {
    const { gameState } = get();
    const audioStore = useAudio.getState();
    
    try {
      // Only process during mulligan phase
      if (gameState.gamePhase !== 'mulligan' || !gameState.mulligan?.active) {
        throw new Error('Not in mulligan phase');
      }
      
      const newState = confirmMulligan(gameState);
      
      // Play success sound effect
      if (audioStore && typeof audioStore.playSoundEffect === 'function') {
        audioStore.playSoundEffect('battlecry');
      }
      
      set({ gameState: newState });
      debug.log('Mulligan confirmed, replacing selected cards');
      // Note: RagnarokCombatArena watches mulligan.active state directly for poker integration
    } catch (error) {
      console.error('Error confirming mulligan:', error);
    }
  },
  
  // Skip mulligan and keep all cards
  skipMulligan: () => {
    const { gameState } = get();
    const audioStore = useAudio.getState();
    
    try {
      // Only process during mulligan phase
      if (gameState.gamePhase !== 'mulligan' || !gameState.mulligan?.active) {
        throw new Error('Not in mulligan phase');
      }
      
      const newState = skipMulligan(gameState);
      
      // Play success sound effect
      if (audioStore && typeof audioStore.playSoundEffect === 'function') {
        audioStore.playSoundEffect('battlecry');
      }
      
      set({ gameState: newState });
      debug.log('Mulligan skipped, keeping all cards');
      // Note: RagnarokCombatArena watches mulligan.active state directly for poker integration
    } catch (error) {
      console.error('Error skipping mulligan:', error);
    }
  },
  
  // Use hero power on a target (or no target for some powers like Armor Up)
  useHeroPower: (targetId?: string, targetType?: 'card' | 'hero') => {
    const { gameState, heroTargetMode } = get();
    const audioStore = useAudio.getState();
    
    try {
      // Can only use hero power during player's turn and if not already used
      if (gameState.currentTurn !== 'player' && !isAISimulationMode()) {
        throw new Error('Not your turn');
      }
      
      const player = gameState.players.player;
      
      if (player.heroPower.used) {
        throw new Error('Hero power already used this turn');
      }
      
      if (player.mana.current < player.heroPower.cost) {
        throw new Error(`Not enough mana. Need ${player.heroPower.cost} but only have ${player.mana.current}`);
      }
      
      // Some hero powers don't need a target (warrior, hunter, and special ones like Odin)
      const heroClass = player.heroClass.toLowerCase();
      const heroId = player.hero?.id;
      let needsTarget = false;
      
      // Odin's Wisdom of the Ravens does NOT need a target
      if (heroClass === 'mage' && heroId !== 'hero-odin') {
        needsTarget = true;
      }
      
      // Make sure we have a target if needed
      if (needsTarget && (!targetId || !targetType)) {
        if (!heroTargetMode) {
          set({ heroTargetMode: true });
          toast.info('Select a target for your hero power');
          return;
        }
        throw new Error('This hero power requires a target');
      }
      
      // Execute the hero power
      const newState = executeHeroPower(gameState, 'player', targetId, targetType);
      
      if (newState === gameState) {
        return;
      }

      // Show action announcement for the hero power
      const announcementStoreState = useAnnouncementStore.getState();
      if (announcementStoreState && announcementStoreState.addAnnouncement) {
        announcementStoreState.addAnnouncement({
          type: 'action' as any,
          title: player.heroPower.name,
          subtitle: player.heroPower.description,
          icon: '✨',
          duration: 2000
        });
      }

      // Play hero power sound effect
      if (audioStore && typeof audioStore.playSoundEffect === 'function') {
        audioStore.playSoundEffect('hero_power');
      }
      
      // Log to saga feed
      logActivity('buff', 'player', `Used ${player.heroPower.name}`);

      // Update game state
      set({
        gameState: newState,
        heroTargetMode: false  // Exit hero power mode
      });
      
      // Success notification
      toast.success(`Used Hero Power: ${player.heroPower.name}`);
      
      // Show visual feedback - we'll create a temporary div for the effect
      const heroPowerEffect = document.createElement('div');
      heroPowerEffect.className = 'fixed inset-0 pointer-events-none z-50 flex items-center justify-center';
      const heroEmoji = (() => {
        switch(heroClass) {
          case 'mage': return '🔥';
          case 'warrior': return '🛡️';
          case 'paladin': return '👑';
          case 'hunter': return '🏹';
          default: return '⚡';
        }
      })();
      heroPowerEffect.innerHTML = `
        <div class="w-32 h-32 flex items-center justify-center rounded-full bg-purple-600 bg-opacity-30 animate-pulse">
          <div class="text-4xl">${heroEmoji}</div>
        </div>
      `;
      document.body.appendChild(heroPowerEffect);
      
      // Remove the effect after animation
      setTimeout(() => {
        document.body.removeChild(heroPowerEffect);
      }, 1000);
      
      debug.log(`Hero power ${player.heroPower.name} used successfully`);
    } catch (error) {
      console.error('Error using hero power:', error);
    }
  },
  
  grantPokerHandRewards: () => {
    const { gameState } = get();
    
    if (gameState?.mulligan?.active) {
      debug.log('[PokerRewards] Blocked: card game mulligan still active');
      return;
    }
    
    try {
      debug.log('[PokerRewards] Granting poker hand rewards - card draw and +1 mana crystal');
      
      const player = gameState.players.player;
      const opponent = gameState.players.opponent;
      
      const MAX_HAND_SIZE = 9;
      const MAX_MANA = 10;
      
      // Draw a card for player from deck to hand
      let newPlayerHand = [...player.hand];
      let newPlayerDeck = [...player.deck];
      
      if (newPlayerDeck.length > 0) {
        const drawnCardData = newPlayerDeck.pop()!;
        if (newPlayerHand.length < MAX_HAND_SIZE) {
          // Properly convert CardData to CardInstance using createCardInstance
          const cardInstance = createCardInstance(drawnCardData);
          newPlayerHand.push(cardInstance);
          debug.log(`[PokerRewards] Player drew card: ${cardInstance.card.name}`);
        } else {
          debug.log('[PokerRewards] Player hand is full - card burned');
        }
      } else {
        debug.log('[PokerRewards] Player has no cards left in deck');
      }
      
      // Draw a card for opponent from deck to hand
      let newOpponentHand = [...opponent.hand];
      let newOpponentDeck = [...opponent.deck];
      
      if (newOpponentDeck.length > 0) {
        const drawnCardData = newOpponentDeck.pop()!;
        if (newOpponentHand.length < MAX_HAND_SIZE) {
          // Properly convert CardData to CardInstance using createCardInstance
          const cardInstance = createCardInstance(drawnCardData);
          newOpponentHand.push(cardInstance);
          debug.log(`[PokerRewards] Opponent drew card: ${cardInstance.card.name}`);
        } else {
          debug.log('[PokerRewards] Opponent hand is full - card burned');
        }
      } else {
        debug.log('[PokerRewards] Opponent has no cards left in deck');
      }
      
      // Grant +1 mana crystal to both players (cap at 10)
      // RESPECT OVERLOAD: Available mana = max - overloaded
      // New max mana, capped at 10
      const newPlayerMax = Math.min(player.mana.max + 1, MAX_MANA);
      const newOpponentMax = Math.min(opponent.mana.max + 1, MAX_MANA);
      
      // Preserve overload values and calculate available mana correctly
      const playerOverloaded = player.mana.overloaded || 0;
      const opponentOverloaded = opponent.mana.overloaded || 0;
      
      const newPlayerMana = {
        ...player.mana,
        max: newPlayerMax,
        // Refresh mana but respect overloaded crystals
        current: Math.max(0, newPlayerMax - playerOverloaded),
        // Preserve overload fields
        overloaded: playerOverloaded,
        pendingOverload: player.mana.pendingOverload || 0
      };
      
      const newOpponentMana = {
        ...opponent.mana,
        max: newOpponentMax,
        // Refresh mana but respect overloaded crystals
        current: Math.max(0, newOpponentMax - opponentOverloaded),
        // Preserve overload fields
        overloaded: opponentOverloaded,
        pendingOverload: opponent.mana.pendingOverload || 0
      };
      
      debug.log(`[PokerRewards] Player mana: ${player.mana.max} → ${newPlayerMana.max} (${newPlayerMana.current} available, ${playerOverloaded} overloaded)`);
      debug.log(`[PokerRewards] Opponent mana: ${opponent.mana.max} → ${newOpponentMana.max} (${newOpponentMana.current} available, ${opponentOverloaded} overloaded)`);
      
      // Update game state with card draws and mana grants
      set({
        gameState: {
          ...gameState,
          players: {
            ...gameState.players,
            player: {
              ...player,
              hand: newPlayerHand,
              deck: newPlayerDeck,
              mana: newPlayerMana
            },
            opponent: {
              ...opponent,
              hand: newOpponentHand,
              deck: newOpponentDeck,
              mana: newOpponentMana
            }
          }
        }
      });
      
      debug.log(`[PokerRewards] Card draw and mana grant complete`);
    } catch (error) {
      console.error('[PokerRewards] Error granting rewards:', error);
    }
  }
})));

// Subscribe to battlefield changes to trace when minions disappear
// This captures stack traces to identify the root cause of battlefield clears
useGameStore.subscribe((state, prevState) => {
  const currPlayerBattlefield = state.gameState?.players?.player?.battlefield || [];
  const prevPlayerBattlefield = prevState.gameState?.players?.player?.battlefield || [];
  const currOpponentBattlefield = state.gameState?.players?.opponent?.battlefield || [];
  const prevOpponentBattlefield = prevState.gameState?.players?.opponent?.battlefield || [];
  
  const prevPlayerCards = prevPlayerBattlefield.map((c: any) => c?.card?.name || `id:${c?.instanceId}` || 'unknown');
  const currPlayerCards = currPlayerBattlefield.map((c: any) => c?.card?.name || `id:${c?.instanceId}` || 'unknown');
  const prevOpponentCards = prevOpponentBattlefield.map((c: any) => c?.card?.name || `id:${c?.instanceId}` || 'unknown');
  const currOpponentCards = currOpponentBattlefield.map((c: any) => c?.card?.name || `id:${c?.instanceId}` || 'unknown');
  
  const stack = captureStackTrace();
  
  // Track player battlefield changes
  logBattlefieldChange('player', prevPlayerCards, currPlayerCards, stack);
  
  // Track opponent battlefield changes
  logBattlefieldChange('opponent', prevOpponentCards, currOpponentCards, stack);
  
  // Update snapshot for next comparison
  prevBattlefieldSnapshot = { player: currPlayerCards, opponent: currOpponentCards };
});