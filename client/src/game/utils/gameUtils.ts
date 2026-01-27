import { GameState, CardInstance, Player, HeroClass, CardData } from '../types';
import { createStartingDeck, createClassDeck, drawCards, findCardInstance } from './cardUtils';
import { getDefaultHeroPower, resetHeroPower } from './heroPowerUtils';
import { requiresBattlecryTarget, executeBattlecry } from './battlecryUtils';
import { equipWeapon } from './weaponUtils';
import { moveCard, drawCardFromDeck, destroyCard } from './zoneUtils';
import { playSecret } from './secretUtils';
import { executeSpell, requiresSpellTarget } from './spellUtils';
import { updateEnrageEffects } from './enrageUtils';
import { executeComboEffect, shouldActivateCombo } from './comboUtils';
import { executeComboSpellEffect } from './comboSpellUtils';
import { applyOverload, getOverloadAmount, hasOverload } from './overloadUtils';
import { processFrozenEffectsAtTurnEnd } from './freezeUtils';
import { processWeaponsAtTurnEnd } from './weaponUtils';
import { processDormantEffects } from './dormantUtils';
import { processRushAtTurnEnd, isValidRushTarget, initializeRushEffect } from './rushUtils';
import { processStartOfTurnEffects, processEndOfTurnEffects } from './turnEffectsUtils';
// Import frenzy utilities but only use processFrenzyEffects to avoid circular dependency
import { processFrenzyEffects } from './frenzyUtils';
import { summonColossalParts } from './colossalUtils';
import { performTurnStartResets } from './resetUtils';
import { hasEcho, createEchoCopy, expireEchoCardsAtEndOfTurn } from './echoUtils';
import { processAfterAttackEffects, processAfterHeroAttackEffects } from './afterAttackUtils';
import { dealDamage } from './damageUtils';
import { canMagnetize, applyMagnetization, isValidMagneticTarget } from './magneticUtils';
import { fullCardDatabase as allCards } from '../data/cards';
import { 
  logCardPlay, 
  logAttack, 
  logHeroPower, 
  logTurnStart, 
  logTurnEnd, 
  logCardDraw,
  logCardDeath,
  logDamage,
  logBuff
} from './gameLogUtils';
import { queueAIAttackAnimation } from '../stores/aiAttackAnimationStore';
import { 
  processAllEndOfTurnEffects,
  processAllStartOfTurnEffects,
  processAllOnMinionPlayEffects,
  processAllOnMinionDeathEffects,
  processHeroOnSpellCast,
  isNorseActive
} from './norseIntegration';
import { processOnAttackStatusEffect } from '../effects/handlers/onAttackStatusHandler';
import { getModifiedAttack, canMinionAct } from './statusEffectUtils';

/**
 * Initialize a new game state
 * @param selectedDeckId - The ID of the player's selected deck
 * @param selectedHeroClass - The hero class selected by the player
 * @param selectedHeroId - The specific Norse hero ID selected by the player
 */
export function initializeGame(selectedDeckId?: string, selectedHeroClass?: HeroClass, selectedHeroId?: string): GameState {
  // Get the selected deck if available or create a random deck
  let playerDeck: CardData[];
  let playerClass: HeroClass;
  
  if (selectedDeckId && selectedHeroClass) {
    const savedDecks = JSON.parse(localStorage.getItem('hearthstone_decks') || '[]');
    const selectedDeck = savedDecks.find((deck: any) => deck.id === selectedDeckId);
    
    if (selectedDeck) {
      // Convert deck format to array of CardData
      playerDeck = [];
      Object.entries(selectedDeck.cards).forEach(([cardId, count]) => {
        // Find the card in the full database
        const cardData = allCards.find(c => c.id === parseInt(cardId));
        if (cardData) {
          // Convert count to a number if it isn't already
          const countNumber = typeof count === 'number' ? count : parseInt(count as string) || 0;
          
          // Add the card multiple times based on count
          for (let i = 0; i < countNumber; i++) {
            playerDeck.push(cardData);
          }
        }
      });
      
      playerClass = selectedHeroClass;
      console.log(`Using player's selected deck: ${selectedDeck.name} (${playerDeck.length} cards)`);
    } else {
      // Fallback to random deck if saved deck not found
      playerDeck = createStartingDeck(30);
      playerClass = selectedHeroClass;
      console.warn(`Selected deck not found. Using random deck.`);
    }
  } else {
    // Fallback to random class deck with no test cards
    playerClass = 'mage';
    playerDeck = createClassDeck(playerClass, 30);
    console.log(`No deck selected. Using class-specific deck for ${playerClass}.`);
  }
  
  // Create opponent deck
  // Use a class-specific deck with no test cards for the opponent
  const opponentClass: HeroClass = 'hunter';
  const opponentDeck = createClassDeck(opponentClass, 30);
  
  // Create players with initial cards
  const { drawnCards: playerInitialCards, remainingDeck: playerRemainingDeck } = 
    drawCards(playerDeck, 3);
  
  const { drawnCards: opponentInitialCards, remainingDeck: opponentRemainingDeck } = 
    drawCards(opponentDeck, 3);
  
  // Create player objects
  const player: Player = {
    id: 'player',
    name: 'Player',
    hand: playerInitialCards,
    battlefield: [],
    deck: playerRemainingDeck,
    graveyard: [], // Initialize empty graveyard
    secrets: [], // Initialize empty secrets
    weapon: undefined, // No weapon equipped initially
    mana: { 
      current: 1, 
      max: 1,
      overloaded: 0,
      pendingOverload: 0
    },
    health: 30,
    heroHealth: 30,
    heroArmor: playerClass === 'warrior' ? 5 : 0, // Warriors start with armor
    armor: playerClass === 'warrior' ? 5 : 0, // Alternative property for armor
    heroClass: playerClass,
    hero: selectedHeroId ? { id: selectedHeroId } as any : undefined,
    heroPower: getDefaultHeroPower(playerClass),
    cardsPlayedThisTurn: 0, // Initialize cards played counter
    attacksPerformedThisTurn: 0 // Initialize attacks performed with weapon
  };
  
  const opponent: Player = {
    id: 'opponent',
    name: 'Opponent',
    hand: opponentInitialCards,
    battlefield: [],
    deck: opponentRemainingDeck,
    graveyard: [], // Initialize empty graveyard
    secrets: [], // Initialize empty secrets
    weapon: undefined, // No weapon equipped initially
    mana: { 
      current: 1, 
      max: 1,
      overloaded: 0,
      pendingOverload: 0
    },
    health: 30,
    heroHealth: 30,
    heroArmor: opponentClass === 'warrior' ? 5 : 0, // Warriors start with armor
    armor: opponentClass === 'warrior' ? 5 : 0, // Alternative property for armor
    heroClass: opponentClass,
    heroPower: getDefaultHeroPower(opponentClass),
    cardsPlayedThisTurn: 0, // Initialize cards played counter
    attacksPerformedThisTurn: 0 // Initialize attacks performed with weapon
  };
  
  // Create initial game state with mulligan phase
  return {
    players: { player, opponent },
    currentTurn: 'player',
    turnNumber: 1,
    gamePhase: 'mulligan', // Start with mulligan phase instead of playing
    winner: undefined,
    mulligan: {
      active: true,
      playerSelections: {},
      playerReady: false,
      opponentReady: false
    },
    mulliganCompleted: false, // Mulligan happens once per game
    fatigueCount: {
      player: 0,
      opponent: 0
    },
    gameLog: [] // Initialize empty game log
  };
}

/**
 * Draw a card for the current player
 * Includes Hearthstone-style fatigue mechanic where damage increases with each empty draw
 */
export function drawCard(state: GameState): GameState {
  const currentPlayer = state.currentTurn;
  const player = state.players[currentPlayer];
  
  // Initialize fatigue count if not already done
  if (!state.fatigueCount) {
    state = {
      ...state,
      fatigueCount: {
        player: 0,
        opponent: 0
      }
    };
  }
  
  // No more cards to draw, player takes fatigue damage
  if (player.deck.length === 0) {
    // Ensure fatigueCount exists
    if (!state.fatigueCount) {
      state = {
        ...state,
        fatigueCount: { player: 0, opponent: 0 }
      };
    }
    
    // Increment fatigue counter for this player
    const currentFatigue = state.fatigueCount[currentPlayer] || 0;
    const newFatigue = currentFatigue + 1;
    
    // Log fatigue damage
    console.log(`FATIGUE: ${currentPlayer} takes ${newFatigue} fatigue damage (draw ${newFatigue})`);
    
    // Apply fatigue damage (increasing with each empty draw)
    let updatedState = {
      ...state,
      fatigueCount: {
        ...state.fatigueCount,
        [currentPlayer]: newFatigue
      },
      players: {
        ...state.players,
        [currentPlayer]: {
          ...player,
          health: player.health - newFatigue
        }
      }
    };
    
    // Make sure fatigueCount is defined in the state
    const stateWithFatigue = {
      ...updatedState,
      fatigueCount: updatedState.fatigueCount || { player: 0, opponent: 0 }
    };
    
    // Add to game log
    updatedState = logCardDraw(
      stateWithFatigue, 
      currentPlayer,
      undefined, 
      true, // fatigue
      newFatigue
    );
    
    // Check for game over due to fatigue
    if (updatedState.players[currentPlayer].health <= 0) {
      console.log(`${currentPlayer} died from fatigue!`);
      updatedState.gamePhase = "game_over";
      updatedState.winner = currentPlayer === 'player' ? 'opponent' : 'player';
    }
    
    return updatedState;
  }
  
  // Use the drawCardFromDeck utility to draw a card from deck to hand
  return drawCardFromDeck(state, currentPlayer);
}

/**
 * Play a card from hand to battlefield
 */
export function playCard(state: GameState, cardInstanceId: string, targetId?: string, targetType?: 'minion' | 'hero'): GameState {
  // Deep clone the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  const currentPlayer = newState.currentTurn;
  const player = newState.players[currentPlayer];
  
  // Find the card in the player's hand
  const cardResult = findCardInstance(player.hand, cardInstanceId);
  if (!cardResult) {
    console.error(`Card with ID ${cardInstanceId} not found in player's hand`);
    return state;
  }
  
  const { card, index } = cardResult;
  
  // Save the original card data for reference (before we remove it from hand)
  const originalCardData = JSON.parse(JSON.stringify(card.card));
  
  // Check if player has enough mana to play the card
  if (card.card.manaCost > player.mana.current) {
    console.log(`Not enough mana to play ${card.card.name}`);
    return state;
  }
  
  // Update cards played this turn counter (for Combo)
  const updatedCardsPlayedThisTurn = player.cardsPlayedThisTurn + 1;
  // Ensure keywords exists and is an array before checking for combo
  const cardKeywords = card.card.keywords || [];
  const isComboActive = updatedCardsPlayedThisTurn > 1 && 
                        Array.isArray(cardKeywords) && 
                        cardKeywords.includes('combo');
  
  if (isComboActive) {
    console.log(`COMBO ACTIVATED: ${card.card.name} (${updatedCardsPlayedThisTurn} cards played this turn)`);
  }
  
  // Handle pending overload if card has overload keyword
  let pendingOverload = player.mana.pendingOverload || 0;
  if (Array.isArray(cardKeywords) && 
      cardKeywords.includes('overload') && 
      card.card.overload) {
    pendingOverload += card.card.overload.amount;
    console.log(`OVERLOAD: ${card.card.overload.amount} mana crystals will be locked next turn`);
  }
  
  // Handle different card types
  // 1. Handle Secret cards
  if (card.card.type === 'secret') {
    console.log(`Playing secret card: ${card.card.name}`);
    // Update state with combo/overload before passing to playSecret
    player.cardsPlayedThisTurn = updatedCardsPlayedThisTurn;
    player.mana.pendingOverload = pendingOverload;
    
    return playSecret(newState, cardInstanceId);
  }
  
  // 2. Handle Weapon cards
  if (card.card.type === 'weapon') {
    console.log(`Playing weapon card: ${card.card.name}`);
    
    // Remove card from hand
    player.hand.splice(index, 1);
    
    // Update player state
    player.cardsPlayedThisTurn = updatedCardsPlayedThisTurn;
    player.mana.current -= card.card.manaCost;
    player.mana.pendingOverload = pendingOverload;
    
    // Create weapon card instance
    return equipWeapon(newState, currentPlayer, card);
  }
  
  // 3. Handle Spell cards
  if (card.card.type === 'spell') {
    // Check if the spell requires a target
    if (requiresSpellTarget(card.card) && !targetId) {
      console.log('This spell requires a target');
      // Don't play the card yet, wait for target selection
      return state;
    }
    
    // Remove card from hand
    player.hand.splice(index, 1);
    
    // Update player state
    player.cardsPlayedThisTurn = updatedCardsPlayedThisTurn;
    player.mana.current -= card.card.manaCost;
    player.mana.pendingOverload = pendingOverload;
    
    // Execute the spell effect
    console.log(`Executing spell effect for ${card.card.name}`);
    
    // Process Norse Hero on-spell-cast passives (Ragnarok Poker integration)
    if (isNorseActive()) {
      console.log(`[SPELL-CAST] Processing Norse on-spell-cast effects for ${card.card.name}`);
      newState = processHeroOnSpellCast(newState, currentPlayer);
    }
    
    // If combo is active and the card has a combo effect, execute that instead
    if (isComboActive && card.card.comboEffect) {
      console.log(`Executing COMBO effect for ${card.card.name}`);
      return executeComboSpellEffect(newState, cardInstanceId, targetId, targetType);
    }
    
    return executeSpell(newState, card, targetId, targetType);
  }
  
  // 3. Handle Minion cards
  // Special handling for legendary cards (for debugging)
  if (card.card.rarity === 'legendary') {
    // Special handling for legendary cards can be implemented here
  }
  
  // Handle Magnetic mechanic - check if targeting a mech on battlefield
  // Reuse the existing cardKeywords variable declared above
  const isMagnetic = Array.isArray(cardKeywords) && cardKeywords.includes('magnetic');
  if (isMagnetic && targetId && targetType === 'minion') {
    // Apply magnetic effect to target mech
    
    // Check if target is a valid mech minion
    let targetMech;
    let isFriendlyTarget = false;
    
    // Check player's battlefield for target
    const friendlyTargetInfo = findCardInstance(player.battlefield || [], targetId);
    if (friendlyTargetInfo) {
      targetMech = friendlyTargetInfo.card;
      isFriendlyTarget = true;
      
      // Check if target is a mech
      if (targetMech.card.race === 'mech') {
        // Apply magnetization
        return applyMagnetization(newState, currentPlayer, cardInstanceId, targetId);
      } else {
        console.error('Magnetize target is not a mech');
        return state;
      }
    }
    
    // If target wasn't found or isn't a valid mech, continue with normal play
  }
  
  // Check if the card has a battlecry that requires a target
  if (requiresBattlecryTarget(card.card) && !targetId) {
    // Don't play the card yet, wait for target selection
    return state;
  }
  
  // Remove card from hand - must be done BEFORE battlecry processing to ensure clean state
  player.hand.splice(index, 1);
  
  // Mark card as played and handle summoning sickness
  // Cards with the 'charge' keyword can attack immediately
  // Cards with the 'rush' keyword can attack minions immediately but not heroes
  
  // Ensure keywords exists and is an array before calling includes
  const keywords = card.card.keywords || [];
  const hasCharge = keywords.includes('charge');
  const hasRush = keywords.includes('rush');
  const canAttackImmediately = hasCharge || hasRush;
  
  let playedCard: CardInstance = {
    ...card,
    isPlayed: true,
    isSummoningSick: !canAttackImmediately, // No summoning sickness for Charge/Rush minions
    canAttack: canAttackImmediately, // Charge/Rush minions can attack immediately
    hasRush: hasRush, // Track if it has Rush to limit hero attacks
    isRush: hasRush, // Add isRush property
    attacksPerformed: 0  // Reset attacks performed counter
  };
  
  // If the card has Rush, use initializeRushEffect to ensure proper Rush handling
  if (hasRush) {
    playedCard = initializeRushEffect(playedCard);
  }
  
  // Check if battlefield is full (Hearthstone has a limit of 7 minions)
  if (player.battlefield.length >= 7) {
    console.error(`Cannot play ${card.card.name}: Battlefield is full (7 minions maximum)`);
    return state;
  }

  // Add the played card to the battlefield
  player.battlefield.push(playedCard);
  
  // Update player state
  player.cardsPlayedThisTurn = updatedCardsPlayedThisTurn;
  player.mana.current -= card.card.manaCost;
  player.mana.pendingOverload = pendingOverload;
  
  // Process Norse King/Hero on-minion-play effects (Ragnarok Poker integration)
  if (isNorseActive()) {
    const minionElement = (playedCard.card as any).element;
    console.log(`[MINION-PLAY] Processing Norse on-minion-play effects for ${playedCard.card.name}`);
    newState = processAllOnMinionPlayEffects(newState, currentPlayer, playedCard.instanceId, minionElement);
  }
  
  // Handle colossal minions - summon additional parts
  const playedKeywords = playedCard.card.keywords || [];
  const isColossalMinion = Array.isArray(playedKeywords) && playedKeywords.includes('colossal');
  if (isColossalMinion) {
    // Get the instance ID of the just-played card
    const colossalMinionId = playedCard.instanceId;
    
    // Summon additional parts for the colossal minion
    // This needs to be done after the card is on the battlefield
    newState = summonColossalParts(newState, colossalMinionId, currentPlayer);
  }
  
  // Find the card we just added to battlefield
  const justPlayedCardInfo = findCardInstance(
    player.battlefield, 
    player.battlefield[player.battlefield.length - 1].instanceId
  );
  
  if (!justPlayedCardInfo) {
    console.error('Card just played not found on battlefield - this should never happen');
    return state;
  }
  
  const justPlayedCard = justPlayedCardInfo.card;
  
  // Check if we should execute combo or battlecry
  const originalKeywords = originalCardData.keywords || [];
  const hasComboEffect = Array.isArray(originalKeywords) && originalKeywords.includes('combo') && originalCardData.comboEffect;
  const hasBattlecryEffect = Array.isArray(originalKeywords) && originalKeywords.includes('battlecry') && originalCardData.battlecry;
  // Check if combo should activate (updatedCardsPlayedThisTurn is already > 0 when playing any card)
  
  // Use the new ID from the battlefield for the effects
  const fieldCardId = justPlayedCard.instanceId;
  
  // Handle Combo effects (takes precedence over battlecry when active)
  if (hasComboEffect && shouldActivateCombo(newState, currentPlayer)) {
    console.log(`Executing COMBO effect for ${originalCardData.name}`);
    return executeComboEffect(newState, fieldCardId, targetId, targetType);
  }
  
  // Execute battlecry effect if the card has one and has the battlecry keyword
  if (hasBattlecryEffect) {
    // Execute the battlecry for this card on the battlefield
    
    // Apply the battlecry effect
    if (originalCardData.battlecry.type === 'damage') {
      // Handle damage battlecry
      if (targetType === 'minion' && targetId) {
        // Find target minion
        let targetMinion;
        let targetIndex;
        let targetPlayer;
        
        // Check opponent battlefield first
        const opponentPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
        const targetInfo = findCardInstance(newState.players[opponentPlayer].battlefield, targetId);
        
        if (targetInfo) {
          targetMinion = targetInfo.card;
          targetIndex = targetInfo.index;
          targetPlayer = opponentPlayer;
          
          // Apply damage to the target
          const damage = originalCardData.battlecry.value || 1;
          
          // Check for Divine Shield
          if (targetMinion.hasDivineShield) {
            console.log(`Battlecry: Divine Shield on ${targetMinion.card.name} absorbed the damage`);
            newState.players[targetPlayer].battlefield[targetIndex].hasDivineShield = false;
          } else {
            // Ensure currentHealth exists
            if (!targetMinion.currentHealth) {
              targetMinion.currentHealth = targetMinion.card.health || 1;
            }
            
            // Apply damage
            newState.players[targetPlayer].battlefield[targetIndex].currentHealth -= damage;
            console.log(`Battlecry: Dealt ${damage} damage to ${targetMinion.card.name}`);
            
            // Check if minion is destroyed
            if ((newState.players[targetPlayer].battlefield[targetIndex].currentHealth || 0) <= 0) {
              console.log(`${targetMinion.card.name} was destroyed by battlecry damage`);
              newState.players[targetPlayer].battlefield.splice(targetIndex, 1);
            }
          }
        } else {
          // Check friendly battlefield (for self-targeting battlecries)
          const friendlyTargetInfo = findCardInstance(newState.players[currentPlayer].battlefield, targetId);
          
          if (friendlyTargetInfo) {
            targetMinion = friendlyTargetInfo.card;
            targetIndex = friendlyTargetInfo.index;
            
            // Apply damage to friendly target
            const damage = originalCardData.battlecry.value || 1;
            
            // Check for Divine Shield
            if (targetMinion.hasDivineShield) {
              console.log(`Battlecry: Divine Shield on ${targetMinion.card.name} absorbed the damage`);
              newState.players[currentPlayer].battlefield[targetIndex].hasDivineShield = false;
            } else {
              // Ensure currentHealth exists
              if (!targetMinion.currentHealth) {
                targetMinion.currentHealth = targetMinion.card.health || 1;
              }
              
              // Apply damage
              newState.players[currentPlayer].battlefield[targetIndex].currentHealth -= damage;
              console.log(`Battlecry: Dealt ${damage} damage to friendly ${targetMinion.card.name}`);
              
              // Check if minion is destroyed
              if ((newState.players[currentPlayer].battlefield[targetIndex].currentHealth || 0) <= 0) {
                console.log(`${targetMinion.card.name} was destroyed by battlecry damage`);
                newState.players[currentPlayer].battlefield.splice(targetIndex, 1);
              }
            }
          } else {
            console.error('Target minion not found for battlecry damage');
          }
        }
      } else if (targetType === 'hero') {
        // Handle damage to hero
        const damage = originalCardData.battlecry.value || 1;
        
        if (targetId === 'opponent') {
          // Damage opponent hero
          newState.players.opponent.health -= damage;
          console.log(`Battlecry: Dealt ${damage} damage to opponent hero`);
          
          // Check for lethal damage
          if (newState.players.opponent.health <= 0) {
            newState.gamePhase = "game_over";
            newState.winner = 'player';
            console.log('Game over - player wins!');
          }
        } else {
          // Damage player hero (self-damage effects)
          newState.players.player.health -= damage;
          console.log(`Battlecry: Dealt ${damage} damage to player hero`);
          
          // Check for lethal damage
          if (newState.players.player.health <= 0) {
            newState.gamePhase = "game_over";
            newState.winner = 'opponent';
            console.log('Game over - opponent wins!');
          }
        }
      }
    } else if (originalCardData.battlecry.type === 'aoe_damage') {
      // Handle AoE damage battlecry
      const damageAmount = originalCardData.battlecry.value || 2;
      
      // Special case for Deathwing (destroy all other minions, discard hand)
      if (damageAmount >= 1000 && originalCardData.battlecry.targetType === 'all_minions') {
        // Special battlecry: Destroy all other minions
        
        // Get the ID of the card we just played (Deathwing)
        const deathwingId = fieldCardId;
        
        // Clear all minions except Deathwing from player's battlefield
        newState.players[currentPlayer].battlefield = newState.players[currentPlayer].battlefield.filter(
          m => m.instanceId === deathwingId
        );
        
        // Clear all minions from opponent's battlefield
        newState.players[currentPlayer === 'player' ? 'opponent' : 'player'].battlefield = [];
        
        // If this card also discards your hand, do that
        if (originalCardData.battlecry.discardCount !== undefined && 
            originalCardData.battlecry.discardCount === -1) {
          // Special battlecry: Discard your hand
          newState.players[currentPlayer].hand = [];
        }
      } 
      // Regular AOE damage to all enemy minions
      else if (originalCardData.battlecry.affectsAllEnemies) {
        // Execute AoE damage to all enemy minions
        
        // Determine the enemy player
        const enemyPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
        const enemyMinions = newState.players[enemyPlayer].battlefield;
        
        // Track minions to remove (to avoid index shifting issues)
        const minionsToRemove: number[] = [];
        
        // Apply damage to all enemy minions
        for (let i = 0; i < enemyMinions.length; i++) {
          const minion = enemyMinions[i];
          
          // Check for Divine Shield
          if (minion.hasDivineShield) {
            // Divine Shield absorbs the AoE damage
            newState.players[enemyPlayer].battlefield[i].hasDivineShield = false;
          } else {
            // Ensure currentHealth exists
            if (!minion.currentHealth) {
              minion.currentHealth = minion.card.health || 1;
            }
            
            // Apply damage
            newState.players[enemyPlayer].battlefield[i].currentHealth -= damageAmount;
            // Apply AoE damage to the minion
            
            // Check if the minion is destroyed
            if ((newState.players[enemyPlayer].battlefield[i].currentHealth || 0) <= 0) {
              // Mark minion for removal when destroyed by AoE damage
              minionsToRemove.push(i);
            }
          }
        }
        
        // Remove destroyed minions in reverse order
        for (let i = minionsToRemove.length - 1; i >= 0; i--) {
          newState.players[enemyPlayer].battlefield.splice(minionsToRemove[i], 1);
        }
      }
    } 
    // For any other battlecry types, call the executeBattlecry function from battlecryUtils.ts
    else {
      console.log(`Handling ${originalCardData.battlecry.type} battlecry with executeBattlecry`);
      newState = executeBattlecry(newState, fieldCardId, targetId, targetType);
    }
  }
  
  // We've already handled combo effects earlier so this section is no longer needed
  // The effects are applied when the card is played
  
  // Handle Echo mechanic - if the card has Echo, create a copy that can be played again this turn
  if (card && hasEcho(card)) {
    newState = createEchoCopy(newState, card, currentPlayer);
    // Echo copy created - available to play again this turn
  }
  
  return newState;
}

/**
 * End the current turn and prepare for the next turn
 * Implements Hearthstone-like turn rules:
 * 1. Change active player
 * 2. Increase max mana by 1 (up to 10) for the new active player
 * 3. Refresh current mana to full
 * 4. Draw a card for the new active player
 * 5. Reset summoning sickness and allow cards to attack
 */
export function endTurn(state: GameState): GameState {
  // Begin turn transition
  const currentPlayer = state.currentTurn;
  const nextPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
  
  // If player is ending their turn, auto-attack with their minions first
  if (currentPlayer === 'player') {
    console.log('[END-TURN] Player ending turn - starting auto-attack phase');
    state = simulatePlayerMinionAttacks(state);
  }
  
  // Process various end-of-turn mechanics
  state = processFrozenEffectsAtTurnEnd(state);
  state = processWeaponsAtTurnEnd(state);
  state = processDormantEffects(state);
  state = processRushAtTurnEnd(state);
  
  // Process Norse King/Hero end-of-turn effects (Ragnarok Poker integration)
  if (isNorseActive()) {
    console.log(`[END-TURN] Processing Norse end-of-turn effects for ${currentPlayer}`);
    state = processAllEndOfTurnEffects(state, currentPlayer);
  }
  
  // Process Echo cards - mark them as expired at the end of turn
  state = expireEchoCardsAtEndOfTurn(state);
  
  // Update enrage effects for minions that may have been damaged
  state = updateEnrageEffects(state);
  
  // Increment turn number when a full round is completed (both players have played)
  const newTurnNumber = nextPlayer === 'player' ? state.turnNumber + 1 : state.turnNumber;
  
  // Calculate new max mana for the next player (capped at 10)
  // In Hearthstone, max mana increases at the start of EACH player's turn
  const newMaxMana = Math.min(state.players[nextPlayer].mana.max + 1, 10);
  
  // Track turn change between players
  // Update max mana for next player - handled according to Hearthstone rules
  
  // Ensure nextPlayer is properly typed
  const typedNextPlayer = nextPlayer as 'player' | 'opponent';
  
  // Process overload for the current player before switching
  const currentPlayerState = state.players[currentPlayer];
  const pendingOverload = currentPlayerState.mana.pendingOverload || 0;
  
  // First update the current player's overload values (setting what will be locked next turn)
  let updatedState = {
    ...state,
    players: {
      ...state.players,
      [currentPlayer]: {
        ...currentPlayerState,
        mana: {
          ...currentPlayerState.mana,
          overloaded: pendingOverload, // Apply pending overload for next turn
          pendingOverload: 0, // Reset pending overload
        }
      }
    }
  };
  
  // Get updated overloaded value for the next player (if any)
  const nextPlayerOverloaded = updatedState.players[typedNextPlayer].mana.overloaded || 0;
  // Calculate available mana after overload
  const availableMana = Math.max(0, newMaxMana - nextPlayerOverloaded);
  
  // Handle overload mechanic - track locked mana crystals and adjust available mana
  
  // Create new state with updated player turn and mana
  let newState: GameState = {
    ...updatedState,
    currentTurn: typedNextPlayer,
    turnNumber: newTurnNumber,
    players: {
      ...updatedState.players,
      [typedNextPlayer]: {
        ...updatedState.players[typedNextPlayer],
        // Refresh mana for the next player, accounting for overloaded crystals
        mana: {
          current: availableMana, // Reduced by overloaded amount
          max: newMaxMana,
          overloaded: nextPlayerOverloaded,
          pendingOverload: 0 // Reset pending overload
        },
        // We won't reset summoning sickness, attack status, and attacksPerformed here
        // because it's now handled by performTurnStartResets which is called later
        // This avoids duplicate/conflicting resets that can cause bugs
        battlefield: updatedState.players[typedNextPlayer].battlefield,
        // Reset hero power for the next turn
        heroPower: {
          ...updatedState.players[typedNextPlayer].heroPower,
          used: false
        },
        // Reset cards played counter for combo mechanics
        cardsPlayedThisTurn: 0
      }
    }
  };
  
  // Apply start of turn effects
  newState = processStartOfTurnEffects(newState);
  
  // Process Norse King/Hero start-of-turn effects (Ragnarok Poker integration)
  if (isNorseActive()) {
    console.log(`[START-TURN] Processing Norse start-of-turn effects for ${typedNextPlayer}`);
    newState = processAllStartOfTurnEffects(newState, typedNextPlayer);
  }
  
  // Reset minions and other things at the start of a turn
  newState = performTurnStartResets(newState);
  
  // Draw a card for the next player
  newState = drawCard(newState);
  
  // If next player is AI (opponent), simulate their turn
  if (typedNextPlayer === 'opponent') {
    try {
      // AI logic: Play cards if they have enough mana, prioritizing high cost cards
      // This implements Hearthstone-like AI behavior for playing cards and attacking
      newState = simulateOpponentTurn(newState);
      
      // Process end of turn effects for the opponent
      newState = processEndOfTurnEffects(newState);
      
      // End AI turn immediately and return to player
      
      // Set up player's next turn
      const playerState = newState.players.player;
      
      // Draw a card for the player using standard card drawing mechanism
      let tempState = {
        ...newState,
        currentTurn: 'player'
      };
      tempState = drawCard(tempState);
      
      // Get updated player state after card draw
      const updatedPlayerState = tempState.players.player;
      const updatedPlayerHand = updatedPlayerState.hand;
      const remainingDeck = updatedPlayerState.deck;
        
      // Calculate mana for next turn
      const newTurnNumber = newState.turnNumber + 1;
      const newPlayerMaxMana = Math.min(playerState.mana.max + 1, 10);
      const playerOverloaded = playerState.mana.overloaded || 0;
      const availableMana = Math.max(0, newPlayerMaxMana - playerOverloaded);
      
      // Update state for player's turn
      newState = {
        ...newState,
        currentTurn: 'player',
        turnNumber: newTurnNumber,
        players: {
          ...newState.players,
          player: {
            ...playerState,
            hand: updatedPlayerHand,
            deck: remainingDeck,
            mana: {
              current: availableMana,
              max: newPlayerMaxMana,
              overloaded: playerOverloaded,
              pendingOverload: 0
            },
            // Let the performTurnStartResets handle the battlefield card state resets consistently
            battlefield: playerState.battlefield,
            heroPower: {
              ...playerState.heroPower,
              used: false
            },
            cardsPlayedThisTurn: 0
          }
        },
        gameLog: newState.gameLog ? [...newState.gameLog, logTurnStart('player', newTurnNumber)] : 
          [logTurnStart('player', newTurnNumber)]
      };
      
    } catch (error) {
      console.error("Error during opponent's turn:", error);
      
      // Error recovery - ensure turn transitions back to player to prevent game freezing
      const playerState = newState.players.player;
      const newTurnNumber = newState.turnNumber + 1;
      
      // Setup recovery state with proper card drawing
      let tempState = {
        ...newState,
        currentTurn: 'player'
      };
      
      try {
        // Use standard card drawing mechanism for consistency
        tempState = drawCard(tempState);
        
        // Extract updated player state after card draw
        const updatedPlayerState = tempState.players.player;
        const updatedPlayerHand = updatedPlayerState.hand;
        const remainingDeck = updatedPlayerState.deck;
        
        // Build complete recovery state
        newState = {
          ...newState,
          currentTurn: 'player',
          turnNumber: newTurnNumber,
          players: {
            ...newState.players,
            player: {
              ...playerState,
              hand: updatedPlayerHand,
              deck: remainingDeck,
              mana: {
                current: Math.min(playerState.mana.max + 1, 10),
                max: Math.min(playerState.mana.max + 1, 10),
                overloaded: 0,
                pendingOverload: 0
              },
              cardsPlayedThisTurn: 0,
              // Use the original battlefield state and let performTurnStartResets handle the state consistently
              battlefield: playerState.battlefield,
              heroPower: {
                ...playerState.heroPower,
                used: false
              }
            }
          },
          gameLog: newState.gameLog ? [...newState.gameLog, logTurnStart('player', newTurnNumber)] : 
            [logTurnStart('player', newTurnNumber)]
        };
      } catch (drawError) {
        // Minimal recovery as last resort
        newState = {
          ...newState,
          currentTurn: 'player',
          turnNumber: newTurnNumber,
          players: {
            ...newState.players,
            player: {
              ...playerState,
              mana: {
                current: Math.min(playerState.mana.max + 1, 10),
                max: Math.min(playerState.mana.max + 1, 10),
                overloaded: 0,
                pendingOverload: 0
              },
              cardsPlayedThisTurn: 0
            }
          }
        };
      }
    }
  }
  
  // Check for game over conditions
  newState = checkGameOver(newState);
  
  return newState;
}

/**
 * Enhanced AI logic for opponent's turn - plays cards and attacks
 */
function simulateOpponentTurn(state: GameState): GameState {
  console.log('[OPPONENT-AI] Starting opponent turn simulation');
  try {
    // Safety check to ensure we received a valid state object
    if (!state || !state.players || !state.players.opponent) {
      console.error("Invalid state passed to simulateOpponentTurn", state);
      return state; // Return the original state to avoid crashing
    }

    let currentState = JSON.parse(JSON.stringify(state)) as GameState;
    const opponent = currentState.players.opponent;
    
    console.log('[OPPONENT-AI] Opponent hand size:', opponent.hand.length);
    console.log('[OPPONENT-AI] Opponent mana:', opponent.mana.current, '/', opponent.mana.max);
    console.log('[OPPONENT-AI] Opponent battlefield size:', opponent.battlefield.length);
    
    // Phase 1: Play cards from hand (highest cost first)
    const sortedHand = [...opponent.hand].sort(
      (a, b) => (b.card.manaCost || 0) - (a.card.manaCost || 0)
    );
    
    // Try to play cards until no more can be played
    for (const card of sortedHand) {
      // Skip if not enough mana
      if (card.card.manaCost > currentState.players.opponent.mana.current) {
        continue;
      }
      
      // Check if this card needs a target
      const needsTarget = (card.card.type === 'spell' && card.card.spellEffect?.requiresTarget) ||
                         (card.card.type === 'minion' && card.card.battlecry?.requiresTarget);
      
      if (needsTarget) {
        // Find a valid target for the AI
        let targetId: string | undefined;
        
        // Choose target based on card type and effect
        if (card.card.type === 'spell') {
          const spellEffect = card.card.spellEffect;
          
          // Damage spells should target player's minions or hero
          if (spellEffect?.type === 'damage') {
            // Player's minions
            const playerMinions = currentState.players.player.battlefield;
            
            if (playerMinions.length > 0) {
              // Target minion with highest attack first
              const targetMinion = playerMinions.sort((a, b) => 
                (b.card.attack || 0) - (a.card.attack || 0)
              )[0];
              targetId = targetMinion.instanceId;
            } else {
              // No minions, target player's hero
              targetId = 'player-hero'; // Special ID for player's hero
            }
          }
          // Healing spells should target AI's own minions or hero
          else if (spellEffect?.type === 'heal') {
            // AI's own minions, prioritize damaged ones
            const aiMinions = currentState.players.opponent.battlefield.filter(m => 
              m.currentHealth < (m.card.health || 0)
            );
            
            if (aiMinions.length > 0) {
              // Target most damaged minion
              const targetMinion = aiMinions.sort((a, b) => 
                ((a.card.health || 0) - (a.currentHealth || 0)) - 
                ((b.card.health || 0) - (b.currentHealth || 0))
              )[0];
              targetId = targetMinion.instanceId;
            } else {
              // No damaged minions, target self
              targetId = 'opponent-hero'; // Special ID for opponent's hero
            }
          }
          // Buff spells should target AI's own minions
          else if (spellEffect?.type === 'buff') {
            const aiMinions = currentState.players.opponent.battlefield;
            
            if (aiMinions.length > 0) {
              // Target highest health minion for buffs
              const targetMinion = aiMinions.sort((a, b) => 
                (b.card.health || 0) - (a.card.health || 0)
              )[0];
              targetId = targetMinion.instanceId;
            } else {
              // No valid targets
              continue; // Skip this card
            }
          } else {
            // Default targeting for other spells
            if (currentState.players.player.battlefield.length > 0) {
              // Target random player minion
              const randomIndex = Math.floor(Math.random() * currentState.players.player.battlefield.length);
              targetId = currentState.players.player.battlefield[randomIndex].instanceId;
            } else {
              // Target player hero
              targetId = 'player-hero';
            }
          }
        }
        // Battlecry targeting for minions
        else if (card.card.type === 'minion' && card.card.battlecry) {
          const battlecry = card.card.battlecry;
          
          if (battlecry.targetType === 'enemy' || battlecry.targetType === 'any') {
            // Target player's minions
            const playerMinions = currentState.players.player.battlefield;
            
            if (playerMinions.length > 0) {
              // Target minion with highest attack first for damage battlecries
              const targetMinion = playerMinions.sort((a, b) => 
                (b.card.attack || 0) - (a.card.attack || 0)
              )[0];
              targetId = targetMinion.instanceId;
            } else {
              // No minions, target player's hero if possible
              if (battlecry.canTargetHeroes) {
                targetId = 'player-hero';
              } else {
                continue; // Skip this card
              }
            }
          } else if (battlecry.targetType === 'friendly') {
            // Target AI's own minions
            const aiMinions = currentState.players.opponent.battlefield;
            
            if (aiMinions.length > 0) {
              // Target highest health minion for buffs
              const targetMinion = aiMinions.sort((a, b) => 
                (b.card.health || 0) - (a.card.health || 0)
              )[0];
              targetId = targetMinion.instanceId;
            } else {
              // No valid targets
              continue; // Skip this card
            }
          }
        }
        
        // Play the card with target if we found one
        if (targetId) {
          try {
            const targetType = targetId === 'player-hero' || targetId === 'opponent-hero' ? 'hero' : 'minion';
            currentState = playCard(currentState, card.instanceId, targetId, targetType);
          } catch (error) {
            console.error(`Error playing targeted card ${card.card.name}:`, error);
          }
        } else {
          continue; // Skip if no valid target
        }
      } else {
        // Non-targeted card, play normally
        try {
          console.log(`[OPPONENT-AI] Playing non-targeted card: ${card.card.name} (cost: ${card.card.manaCost})`);
          currentState = playCard(currentState, card.instanceId);
          console.log(`[OPPONENT-AI] Card played successfully - battlefield now has ${currentState.players.opponent.battlefield.length} minions`);
        } catch (error) {
          console.error(`Error playing card ${card.card.name}:`, error);
        }
      }
    }
    
    console.log('[OPPONENT-AI] After playing cards - opponent battlefield:', currentState.players.opponent.battlefield.map(c => c.card.name));
  
  // Phase 2: Attack with minions (similar to autoAttackWithAllCards but for opponent)
  
  // Log minion states before filtering
  console.log('[OPPONENT-AI] Checking minion attack states:');
  currentState.players.opponent.battlefield.forEach(card => {
    console.log(`[OPPONENT-AI] - ${card.card.name}: canAttack=${card.canAttack}, isSummoningSick=${card.isSummoningSick}, attack=${card.card.attack}`);
  });
  
  // Get all cards that can attack
  // Sort by HP (currentHealth) - highest HP attacks first per game rules
  const attackableCards = currentState.players.opponent.battlefield
    .filter(card => !card.isSummoningSick && card.canAttack)
    .sort((a, b) => b.currentHealth - a.currentHealth); // Sort by HP (highest first)
  
  console.log(`[OPPONENT-AI] Found ${attackableCards.length} minions that can attack:`, attackableCards.map(c => c.card.name));
  
  if (attackableCards.length > 0) {
    // For each card that can attack, find optimal targets (player minions or hero)
    attackableCards.forEach(attackerCard => {
      try {
        // Get player's battlefield and check for Taunt minions
        const playerField = currentState.players.player.battlefield;
        const playerHealth = currentState.players.player.health;
        const playerHasTaunts = hasTauntMinions(playerField);
        
        // If we can kill player, do it! (But only if there are no Taunts)
        if (!playerHasTaunts && attackerCard.card.attack >= playerHealth) {
          // Attack player's hero directly
          currentState = processAttackForOpponent(
            currentState, 
            attackerCard.instanceId
          );
          return; // Skip to next card after this attack
        }
        
        // If there are Taunt minions, we must attack those first
        // Explicitly type this to avoid TypeScript errors
        let bestTarget: CardInstance | null = null;
        let bestTargetScore = -1;
        
        if (playerHasTaunts) {
          // Get all Taunt minions
          const tauntMinions = getTauntMinions(playerField);
          
          // Look for value trades against Taunt minions
          tauntMinions.forEach(defenderCard => {
            let score = 0;
            
            // Can we kill it?
            if (attackerCard.card.attack >= defenderCard.currentHealth) {
              score += 150; // Higher priority - we need to clear Taunts
              
              // Will our minion survive?
              if (defenderCard.card.attack < attackerCard.currentHealth) {
                score += 100;
              }
              
              // Prioritize higher attack/cost cards
              score += defenderCard.card.attack * 5;
              score += defenderCard.card.manaCost * 3;
              
              if (score > bestTargetScore) {
                bestTarget = defenderCard;
                bestTargetScore = score;
              }
            } else {
              // If we can't kill it, still consider attacking it to damage it
              score += 50;
              
              // Will our minion survive?
              if (defenderCard.card.attack < attackerCard.currentHealth) {
                score += 30;
              }
              
              if (score > bestTargetScore) {
                bestTarget = defenderCard;
                bestTargetScore = score;
              }
            }
          });
          
          // If we found a Taunt target, attack it
          if (bestTarget) {
            // Type assertion to ensure TypeScript knows bestTarget is not null here
            const target = bestTarget as CardInstance;
            currentState = processAttackForOpponent(
              currentState, 
              attackerCard.instanceId, 
              target.instanceId
            );
            return; // Done attacking with this minion
          }
        }
        
        // If no Taunts or all Taunts handled, proceed with normal targeting
        // Target the LOWEST HP enemy minion first (game rule)
        bestTarget = null;
        let lowestHP = Infinity;
        
        playerField.forEach(defenderCard => {
          // Skip Taunt minions as they were already considered above
          const defenderKeywords = defenderCard.card.keywords || [];
          if (defenderKeywords.includes('taunt')) {
            return;
          }
          
          // Target lowest HP minion
          if (defenderCard.currentHealth < lowestHP) {
            lowestHP = defenderCard.currentHealth;
            bestTarget = defenderCard;
          }
        });
        
        // If we found a good trade, do it
        if (bestTarget) {
          // Type assertion to ensure TypeScript knows bestTarget is not null here
          const target = bestTarget as CardInstance;
          currentState = processAttackForOpponent(
            currentState, 
            attackerCard.instanceId, 
            target.instanceId
          );
        } else if (!playerHasTaunts) {
          // No good trades and no Taunts, attack hero
          currentState = processAttackForOpponent(
            currentState, 
            attackerCard.instanceId
          );
        } else {
          // There are Taunts but we didn't find good targets - this shouldn't happen
          // but just in case, attack a random Taunt
          const tauntMinions = getTauntMinions(playerField);
          if (tauntMinions.length > 0) {
            const randomTaunt = tauntMinions[0]; // Just pick the first one
            currentState = processAttackForOpponent(
              currentState, 
              attackerCard.instanceId, 
              randomTaunt.instanceId
            );
          }
        }
      } catch (error) {
        console.error('AI attack error:', error);
      }
    });
  }
  
  // Phase 3: Use hero power if possible and appropriate
  // (Could be implemented in a future enhancement)
  
  return currentState;
  } catch (error) {
    console.error('AI simulation error:', error);
    return state; // Return the original state if we encounter an error
  }
}

/**
 * Process attack from opponent's perspective 
 * This is a modified version of processAttack that works when the attacker is the opponent
 * When deferDamage is true, damage is NOT applied to state - it will be applied by the animation processor
 */
function processAttackForOpponent(
  state: GameState,
  attackerInstanceId: string,
  defenderInstanceId?: string, // If undefined, attack is directed at the player's hero
  deferDamage: boolean = true // When true, damage is applied by animation processor
): GameState {
  // Deep clone state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  try {
    // Only process during opponent's turn
    if (newState.currentTurn !== 'opponent') {
      return state;
    }
    
    // Find the attacker card
    const opponentField = newState.players.opponent.battlefield;
    const attackerIndex = opponentField.findIndex(card => card.instanceId === attackerInstanceId);
    
    if (attackerIndex === -1) {
      console.error('AI: Attacker card not found');
      return state;
    }
    
    const attacker = opponentField[attackerIndex];
    
    // Check if minion can act (Frozen/Paralysis check)
    const actionCheck = canMinionAct(attacker);
    if (!actionCheck.canAct) {
      console.log(`[STATUS] ${attacker.card.name} cannot attack: ${actionCheck.reason}`);
      return state;
    }
    
    // Check if the card can attack
    if (attacker.isSummoningSick || !attacker.canAttack) {
      console.error('AI: Card cannot attack - summoning sick or already attacked');
      return state;
    }
    
    // If no defender is specified, attack the player's hero directly
    if (!defenderInstanceId) {
      // Check for Rush restriction - cards with Rush can only attack minions on the turn they're played
      // Use the more robust isValidRushTarget function for consistency
      if (!isValidRushTarget(attacker, 'hero')) {
        console.error('AI: Minions with Rush cannot attack the player hero on the turn they are played');
        return state;
      }
      
      const attackDamage = getModifiedAttack(attacker);
      console.log(`[AI-ATTACK] ${attacker.card.name} (${attackDamage} ATK) attacks player hero for ${attackDamage} damage!`);
      
      // Queue animation with full combat data for deferred damage
      queueAIAttackAnimation(
        attacker.card.name,
        attacker.instanceId,
        'Player Hero',
        null,
        'hero',
        attackDamage,
        0, // counterDamage
        attacker.hasDivineShield || false,
        false // defender (hero) has no divine shield
      );
      
      // Only apply damage immediately if NOT deferring
      if (!deferDamage) {
        newState.players.player.health -= attackDamage;
      }
      
      // Apply Burn self-damage if attacker is burning
      if (attacker.isBurning) {
        const burnDamage = 3;
        const attackerIdx = newState.players.opponent.battlefield.findIndex(m => m.instanceId === attacker.instanceId);
        if (attackerIdx !== -1) {
          const currentHealth = newState.players.opponent.battlefield[attackerIdx].currentHealth ?? 0;
          newState.players.opponent.battlefield[attackerIdx].currentHealth = currentHealth - burnDamage;
          console.log(`[STATUS] 🔥 Burn deals ${burnDamage} self-damage to ${attacker.card.name}`);
        }
      }
      
      // Store the original attacker ID
      const attackerId = attacker.instanceId;
      
      // Find attacker to ensure we have the right index (in case state has changed)
      const updatedAttackerIndex = newState.players.opponent.battlefield.findIndex(
        card => card.instanceId === attackerId
      );
      
      if (updatedAttackerIndex !== -1) {
        // Track attacks performed for Windfury
        newState.players.opponent.battlefield[updatedAttackerIndex].attacksPerformed += 1;
        
        // For non-Windfury cards, or Windfury cards that have performed their maximum attacks (2), disable attacking
        // Ensure keywords array exists before checking
        const attackerKeywords = attacker.card.keywords || [];
        const hasWindfury = attackerKeywords.includes('windfury');
        const maxAttacksAllowed = hasWindfury ? 2 : 1;
        
        if (newState.players.opponent.battlefield[updatedAttackerIndex].attacksPerformed >= maxAttacksAllowed) {
          // Mark the attacker as having used all its attacks this turn
          newState.players.opponent.battlefield[updatedAttackerIndex].canAttack = false;
        }
      }
      
      // Check if the player is defeated
      if (newState.players.player.health <= 0) {
        newState.gamePhase = "game_over";
        newState.winner = 'opponent';
        console.log('Game over - opponent wins!');
      }
      
      return newState;
    }
    
    // Find the defender card
    const playerField = newState.players.player.battlefield;
    const defenderIndex = playerField.findIndex(card => card.instanceId === defenderInstanceId);
    
    if (defenderIndex === -1) {
      console.error('AI: Defender card not found');
      return state;
    }
    
    const defender = playerField[defenderIndex];
    
    const attackDamage = getModifiedAttack(attacker);
    console.log(`[AI-ATTACK] ${attacker.card.name} (${attackDamage}/${attacker.currentHealth}) attacks ${defender.card.name} (${defender.card.attack}/${defender.currentHealth})`);
    
    // Check for Divine Shield on attacker and defender
    const attackerHasDivineShield = attacker.hasDivineShield || false;
    const defenderHasDivineShield = defender.hasDivineShield || false;
    
    // Queue animation with full combat data for deferred damage
    queueAIAttackAnimation(
      attacker.card.name,
      attacker.instanceId,
      defender.card.name,
      defender.instanceId,
      'minion',
      attackDamage,
      defender.card.attack, // counterDamage
      attackerHasDivineShield,
      defenderHasDivineShield
    );
    
    // If deferring damage, skip damage application - animation processor will handle it
    if (deferDamage) {
      // Just mark the attacker as having attacked (canAttack = false)
      const attackerId = attacker.instanceId;
      const updatedAttackerIndex = newState.players.opponent.battlefield.findIndex(
        card => card.instanceId === attackerId
      );
      
      if (updatedAttackerIndex !== -1) {
        const attackerKeywords = attacker.card.keywords || [];
        const hasWindfury = attackerKeywords.includes('windfury');
        const maxAttacksAllowed = hasWindfury ? 2 : 1;
        
        newState.players.opponent.battlefield[updatedAttackerIndex].attacksPerformed += 1;
        
        if (newState.players.opponent.battlefield[updatedAttackerIndex].attacksPerformed >= maxAttacksAllowed) {
          newState.players.opponent.battlefield[updatedAttackerIndex].canAttack = false;
        }
      }
      
      return newState;
    }
    
    // Non-deferred damage application (legacy path)
    // Track minions that take damage for Frenzy mechanic
    const damagedMinionIds: string[] = [];
    
    // Apply combat damage with Divine Shield consideration
    if (defenderHasDivineShield) {
      // Divine Shield blocks the damage once
      newState.players.player.battlefield[defenderIndex].hasDivineShield = false;
    } else {
      // Normal damage application - use modified attack for status effects
      if (attackDamage && attackDamage > 0) {
        newState.players.player.battlefield[defenderIndex].currentHealth -= attackDamage;
        
        // Track this minion as damaged for Frenzy effect
        damagedMinionIds.push(defender.instanceId);
      }
      
      // Check and apply enrage effect after damage
      newState = updateEnrageEffects(newState);
    }
    
    if (attackerHasDivineShield) {
      // Divine Shield blocks the damage once
      newState.players.opponent.battlefield[attackerIndex].hasDivineShield = false;
    } else {
      // Normal damage application
      if (defender.card.attack && defender.card.attack > 0) {
        newState.players.opponent.battlefield[attackerIndex].currentHealth -= defender.card.attack;
        
        // Track this minion as damaged for Frenzy effect
        damagedMinionIds.push(attacker.instanceId);
      }
      
      // Check and apply enrage effect after damage
      newState = updateEnrageEffects(newState);
    }
    
    // Store the original attacker and defender IDs before manipulating the state
    const attackerId = attacker.instanceId;
    const defenderId = defender.instanceId;
    
    // Check for defeated defender minion (0 or less health)
    if (newState.players.player.battlefield[defenderIndex].currentHealth <= 0) {
      // Move the defender from the battlefield to the graveyard
      newState = destroyCard(newState, defenderId, 'player');
    }
    
    // We need to find the attacker again as the indexes might have changed after destroying a minion
    const updatedAttackerIndex = newState.players.opponent.battlefield.findIndex(
      card => card.instanceId === attackerId
    );
    
    // Only check attacker health if it's still on the battlefield
    if (updatedAttackerIndex !== -1 && 
        newState.players.opponent.battlefield[updatedAttackerIndex].currentHealth <= 0) {
      // Move the attacker from the battlefield to the graveyard
      newState = destroyCard(newState, attackerId, 'opponent');
    } else if (updatedAttackerIndex !== -1) {
      // Attacker is still alive, mark it as having performed an attack
      // We need to do this here because the index might have changed
      const attackerKeywords = attacker.card.keywords || [];
      const hasWindfury = attackerKeywords.includes('windfury');
      const maxAttacksAllowed = hasWindfury ? 2 : 1;
      
      newState.players.opponent.battlefield[updatedAttackerIndex].attacksPerformed += 1;
      
      if (newState.players.opponent.battlefield[updatedAttackerIndex].attacksPerformed >= maxAttacksAllowed) {
        // Mark the attacker as having used all its attacks this turn
        newState.players.opponent.battlefield[updatedAttackerIndex].canAttack = false;
      }
    }
    
    // Process frenzy effects for any damaged minions that survived
    if (damagedMinionIds.length > 0) {
      // Process frenzy effects using the imported function
      newState = processFrenzyEffects(newState, damagedMinionIds.map(id => ({ id, playerId: 'opponent' })));
    }
    
    // Process any "after attack" effects 
    if (attacker.card.type === 'minion') {
      // For minion attacks
      newState = processAfterAttackEffects(newState, 'minion', attacker.instanceId, 'opponent');
    }
    
    // After damage application, apply onAttack status effects
    const updatedAttacker = newState.players.opponent.battlefield.find(m => m.instanceId === attackerId);
    if (updatedAttacker && (updatedAttacker.card as any)?.onAttack?.type === 'apply_status') {
      const targetMinion = newState.players.player.battlefield.find(m => m.instanceId === defenderId);
      if (targetMinion) {
        const updatedTarget = processOnAttackStatusEffect(updatedAttacker, targetMinion);
        const targetIndex = newState.players.player.battlefield.findIndex(m => m.instanceId === defenderId);
        if (targetIndex !== -1) {
          newState.players.player.battlefield[targetIndex] = updatedTarget;
        }
      }
    }
    
    // Apply Burn self-damage if attacker is burning
    if (attacker.isBurning) {
      const burnDamage = 3;
      const burnAttackerIdx = newState.players.opponent.battlefield.findIndex(m => m.instanceId === attackerId);
      if (burnAttackerIdx !== -1) {
        const currentHealth = newState.players.opponent.battlefield[burnAttackerIdx].currentHealth ?? 0;
        newState.players.opponent.battlefield[burnAttackerIdx].currentHealth = currentHealth - burnDamage;
        console.log(`[STATUS] 🔥 Burn deals ${burnDamage} self-damage to ${attacker.card.name}`);
      }
    }
    
    return checkGameOver(newState);
  } catch (error) {
    console.error('AI attack processing error:', error);
    return state;
  }
}

/**
 * Process player minion attacks during end turn (auto-attack phase)
 * Similar to AI attacks but for player minions attacking opponent
 */
function processAttackForPlayer(
  state: GameState,
  attackerInstanceId: string,
  defenderInstanceId?: string, // If undefined, attack is directed at the opponent's hero
  deferDamage: boolean = true // When true, damage is applied by animation processor
): GameState {
  // Deep clone state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  try {
    // Find the attacker card
    const playerField = newState.players.player.battlefield;
    const attackerIndex = playerField.findIndex(card => card.instanceId === attackerInstanceId);
    
    if (attackerIndex === -1) {
      console.error('Player Auto-Attack: Attacker card not found');
      return state;
    }
    
    const attacker = playerField[attackerIndex];
    
    // Check if minion can act (Frozen/Paralysis check)
    const actionCheck = canMinionAct(attacker);
    if (!actionCheck.canAct) {
      console.log(`[STATUS] ${attacker.card.name} cannot attack: ${actionCheck.reason}`);
      return state;
    }
    
    // Check if the card can attack
    if (attacker.isSummoningSick || !attacker.canAttack) {
      console.error('Player Auto-Attack: Card cannot attack - summoning sick or already attacked');
      return state;
    }
    
    // If no defender is specified, attack the opponent's hero directly
    if (!defenderInstanceId) {
      // Check for Rush restriction
      if (!isValidRushTarget(attacker, 'hero')) {
        console.error('Player Auto-Attack: Minions with Rush cannot attack the hero on the turn they are played');
        return state;
      }
      
      const attackDamage = getModifiedAttack(attacker);
      console.log(`[PLAYER-AUTO-ATTACK] ${attacker.card.name} (${attackDamage} ATK) attacks opponent hero for ${attackDamage} damage!`);
      
      // Queue animation with full combat data for deferred damage
      queueAIAttackAnimation(
        attacker.card.name,
        attacker.instanceId,
        'Opponent Hero',
        null,
        'hero',
        attackDamage,
        0, // counterDamage
        attacker.hasDivineShield || false,
        false, // defender (hero) has no divine shield
        'player' // attackerSide - this is a player minion attacking
      );
      
      // Only apply damage immediately if NOT deferring
      if (!deferDamage) {
        newState.players.opponent.health -= attackDamage;
      }
      
      // Apply Burn self-damage if attacker is burning
      if (attacker.isBurning) {
        const burnDamage = 3;
        const attackerIdx = newState.players.player.battlefield.findIndex(m => m.instanceId === attacker.instanceId);
        if (attackerIdx !== -1) {
          const currentHealth = newState.players.player.battlefield[attackerIdx].currentHealth ?? 0;
          newState.players.player.battlefield[attackerIdx].currentHealth = currentHealth - burnDamage;
          console.log(`[STATUS] 🔥 Burn deals ${burnDamage} self-damage to ${attacker.card.name}`);
        }
      }
      
      // Store the original attacker ID
      const attackerId = attacker.instanceId;
      
      // Find attacker to ensure we have the right index
      const updatedAttackerIndex = newState.players.player.battlefield.findIndex(
        card => card.instanceId === attackerId
      );
      
      if (updatedAttackerIndex !== -1) {
        // Track attacks performed for Windfury
        newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed += 1;
        
        const attackerKeywords = attacker.card.keywords || [];
        const hasWindfury = attackerKeywords.includes('windfury');
        const maxAttacksAllowed = hasWindfury ? 2 : 1;
        
        if (newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed >= maxAttacksAllowed) {
          newState.players.player.battlefield[updatedAttackerIndex].canAttack = false;
        }
      }
      
      // Check if the opponent is defeated
      if (newState.players.opponent.health <= 0) {
        newState.gamePhase = "game_over";
        newState.winner = 'player';
        console.log('Game over - player wins!');
      }
      
      return newState;
    }
    
    // Find the defender card on opponent's battlefield
    const opponentField = newState.players.opponent.battlefield;
    const defenderIndex = opponentField.findIndex(card => card.instanceId === defenderInstanceId);
    
    if (defenderIndex === -1) {
      console.error('Player Auto-Attack: Defender card not found');
      return state;
    }
    
    const defender = opponentField[defenderIndex];
    
    const attackDamage = getModifiedAttack(attacker);
    console.log(`[PLAYER-AUTO-ATTACK] ${attacker.card.name} (${attackDamage}/${attacker.currentHealth}) attacks ${defender.card.name} (${defender.card.attack}/${defender.currentHealth})`);
    
    // Check for Divine Shield
    const attackerHasDivineShield = attacker.hasDivineShield || false;
    const defenderHasDivineShield = defender.hasDivineShield || false;
    
    // Queue animation with full combat data for deferred damage
    queueAIAttackAnimation(
      attacker.card.name,
      attacker.instanceId,
      defender.card.name,
      defender.instanceId,
      'minion',
      attackDamage,
      defender.card.attack, // counterDamage
      attackerHasDivineShield,
      defenderHasDivineShield,
      'player' // attackerSide - this is a player minion attacking
    );
    
    // If deferring damage, skip damage application - animation processor will handle it
    if (deferDamage) {
      const attackerId = attacker.instanceId;
      const updatedAttackerIndex = newState.players.player.battlefield.findIndex(
        card => card.instanceId === attackerId
      );
      
      if (updatedAttackerIndex !== -1) {
        const attackerKeywords = attacker.card.keywords || [];
        const hasWindfury = attackerKeywords.includes('windfury');
        const maxAttacksAllowed = hasWindfury ? 2 : 1;
        
        newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed += 1;
        
        if (newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed >= maxAttacksAllowed) {
          newState.players.player.battlefield[updatedAttackerIndex].canAttack = false;
        }
      }
      
      return newState;
    }
    
    // Non-deferred damage application (legacy path)
    const damagedMinionIds: string[] = [];
    
    if (defenderHasDivineShield) {
      newState.players.opponent.battlefield[defenderIndex].hasDivineShield = false;
    } else {
      // Normal damage application - use modified attack for status effects
      if (attackDamage && attackDamage > 0) {
        newState.players.opponent.battlefield[defenderIndex].currentHealth -= attackDamage;
        damagedMinionIds.push(defender.instanceId);
      }
      newState = updateEnrageEffects(newState);
    }
    
    if (attackerHasDivineShield) {
      newState.players.player.battlefield[attackerIndex].hasDivineShield = false;
    } else {
      if (defender.card.attack && defender.card.attack > 0) {
        newState.players.player.battlefield[attackerIndex].currentHealth -= defender.card.attack;
        damagedMinionIds.push(attacker.instanceId);
      }
      newState = updateEnrageEffects(newState);
    }
    
    const attackerId = attacker.instanceId;
    const defenderId = defender.instanceId;
    
    if (newState.players.opponent.battlefield[defenderIndex].currentHealth <= 0) {
      newState = destroyCard(newState, defenderId, 'opponent');
    }
    
    const updatedAttackerIndex = newState.players.player.battlefield.findIndex(
      card => card.instanceId === attackerId
    );
    
    if (updatedAttackerIndex !== -1 && 
        newState.players.player.battlefield[updatedAttackerIndex].currentHealth <= 0) {
      newState = destroyCard(newState, attackerId, 'player');
    } else if (updatedAttackerIndex !== -1) {
      const attackerKeywords = attacker.card.keywords || [];
      const hasWindfury = attackerKeywords.includes('windfury');
      const maxAttacksAllowed = hasWindfury ? 2 : 1;
      
      newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed += 1;
      
      if (newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed >= maxAttacksAllowed) {
        newState.players.player.battlefield[updatedAttackerIndex].canAttack = false;
      }
    }
    
    if (damagedMinionIds.length > 0) {
      newState = processFrenzyEffects(newState, damagedMinionIds.map(id => ({ id, playerId: 'player' })));
    }
    
    if (attacker.card.type === 'minion') {
      newState = processAfterAttackEffects(newState, 'minion', attacker.instanceId, 'player');
    }
    
    // After damage application, apply onAttack status effects
    const updatedAttacker = newState.players.player.battlefield.find(m => m.instanceId === attackerId);
    if (updatedAttacker && (updatedAttacker.card as any)?.onAttack?.type === 'apply_status') {
      const targetMinion = newState.players.opponent.battlefield.find(m => m.instanceId === defenderId);
      if (targetMinion) {
        const updatedTarget = processOnAttackStatusEffect(updatedAttacker, targetMinion);
        const targetIndex = newState.players.opponent.battlefield.findIndex(m => m.instanceId === defenderId);
        if (targetIndex !== -1) {
          newState.players.opponent.battlefield[targetIndex] = updatedTarget;
        }
      }
    }
    
    // Apply Burn self-damage if attacker is burning
    if (attacker.isBurning) {
      const burnDamage = 3;
      const burnAttackerIdx = newState.players.player.battlefield.findIndex(m => m.instanceId === attackerId);
      if (burnAttackerIdx !== -1) {
        const currentHealth = newState.players.player.battlefield[burnAttackerIdx].currentHealth ?? 0;
        newState.players.player.battlefield[burnAttackerIdx].currentHealth = currentHealth - burnDamage;
        console.log(`[STATUS] 🔥 Burn deals ${burnDamage} self-damage to ${attacker.card.name}`);
      }
    }
    
    return checkGameOver(newState);
  } catch (error) {
    console.error('Player auto-attack processing error:', error);
    return state;
  }
}

/**
 * Execute player minion attacks during end turn phase
 * Player minions auto-attack based on HP (highest HP attacks first)
 */
function simulatePlayerMinionAttacks(state: GameState): GameState {
  console.log('[PLAYER-AUTO-ATTACK] Starting player minion attack phase');
  
  let currentState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Log minion states before filtering
  console.log('[PLAYER-AUTO-ATTACK] Checking minion attack states:');
  currentState.players.player.battlefield.forEach(card => {
    console.log(`[PLAYER-AUTO-ATTACK] - ${card.card.name}: canAttack=${card.canAttack}, isSummoningSick=${card.isSummoningSick}, attack=${card.card.attack}`);
  });
  
  // Get all cards that can attack
  // Sort by HP (currentHealth) - highest HP attacks first per game rules
  const attackableCards = currentState.players.player.battlefield
    .filter(card => !card.isSummoningSick && card.canAttack)
    .sort((a, b) => b.currentHealth - a.currentHealth); // Sort by HP (highest first)
  
  console.log(`[PLAYER-AUTO-ATTACK] Found ${attackableCards.length} minions that can attack:`, attackableCards.map(c => c.card.name));
  
  if (attackableCards.length > 0) {
    attackableCards.forEach(attackerCard => {
      try {
        const opponentField = currentState.players.opponent.battlefield;
        const opponentHealth = currentState.players.opponent.health;
        const opponentHasTaunts = hasTauntMinions(opponentField);
        
        // If we can kill opponent, do it! (But only if there are no Taunts)
        if (!opponentHasTaunts && attackerCard.card.attack >= opponentHealth) {
          currentState = processAttackForPlayer(
            currentState, 
            attackerCard.instanceId
          );
          return;
        }
        
        let bestTarget: CardInstance | null = null;
        let bestTargetScore = -1;
        
        if (opponentHasTaunts) {
          const tauntMinions = getTauntMinions(opponentField);
          
          tauntMinions.forEach(defenderCard => {
            let score = 0;
            
            if (attackerCard.card.attack >= defenderCard.currentHealth) {
              score += 150;
              if (defenderCard.card.attack < attackerCard.currentHealth) {
                score += 100;
              }
              score += defenderCard.card.attack * 5;
              score += defenderCard.card.manaCost * 3;
              
              if (score > bestTargetScore) {
                bestTarget = defenderCard;
                bestTargetScore = score;
              }
            } else {
              score += 50;
              if (defenderCard.card.attack < attackerCard.currentHealth) {
                score += 30;
              }
              if (score > bestTargetScore) {
                bestTarget = defenderCard;
                bestTargetScore = score;
              }
            }
          });
          
          if (bestTarget) {
            const target = bestTarget as CardInstance;
            currentState = processAttackForPlayer(
              currentState, 
              attackerCard.instanceId, 
              target.instanceId
            );
            return;
          }
        }
        
        // If no Taunts, target the LOWEST HP enemy minion first
        bestTarget = null;
        let lowestHP = Infinity;
        
        opponentField.forEach(defenderCard => {
          const defenderKeywords = defenderCard.card.keywords || [];
          if (defenderKeywords.includes('taunt')) {
            return;
          }
          
          if (defenderCard.currentHealth < lowestHP) {
            lowestHP = defenderCard.currentHealth;
            bestTarget = defenderCard;
          }
        });
        
        if (bestTarget) {
          const target = bestTarget as CardInstance;
          currentState = processAttackForPlayer(
            currentState,
            attackerCard.instanceId,
            target.instanceId
          );
        } else {
          // No enemy minions, attack the opponent's hero
          currentState = processAttackForPlayer(
            currentState, 
            attackerCard.instanceId
          );
        }
      } catch (error) {
        console.error(`Error during player auto-attack with ${attackerCard.card.name}:`, error);
      }
    });
  }
  
  console.log('[PLAYER-AUTO-ATTACK] Player minion attack phase complete');
  return currentState;
}

/**
 * Check if the game is over and determine winner
 */
function checkGameOver(state: GameState): GameState {
  const { player, opponent } = state.players;
  
  // Use heroHealth if available, otherwise fall back to health
  const playerHealth = player.heroHealth !== undefined ? player.heroHealth : player.health;
  const opponentHealth = opponent.heroHealth !== undefined ? opponent.heroHealth : opponent.health;
  
  if (playerHealth <= 0) {
    return {
      ...state,
      gamePhase: 'game_over',
      winner: 'opponent'
    };
  }
  
  if (opponentHealth <= 0) {
    return {
      ...state,
      gamePhase: 'game_over',
      winner: 'player'
    };
  }
  
  return state;
}

/**
 * Process an attack between two cards or a card and a hero
 */
export function processAttack(
  state: GameState,
  attackerInstanceId: string,
  defenderInstanceId?: string // If undefined, attack is directed at the opponent's hero
): GameState {
  // Add comprehensive logging
  console.log(`[ATTACK] Processing attack from ${attackerInstanceId} to ${defenderInstanceId || 'opponent hero'}`);
  
  // Deep clone the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // Only allow attacks during player's turn, except for AI simulation
  // FIX #2: Use original state for turn check, not the cloned newState
  const isAISimulation = typeof window !== 'undefined' && 
    (window.location.pathname.includes('ai') || window.location.href.includes('ai-game'));
  
  if (state.currentTurn !== 'player' && !isAISimulation) {
    console.error('[ATTACK ERROR] Cannot attack during opponent\'s turn');
    return state;
  }
  
  // Find the attacker card
  const playerField = newState.players.player.battlefield;
  const attackerIndex = playerField.findIndex(card => card.instanceId === attackerInstanceId);
  
  if (attackerIndex === -1) {
    console.error(`[ATTACK ERROR] Attacker card with ID ${attackerInstanceId} not found on the battlefield`);
    // Additional diagnostic info
    console.log(`[ATTACK DEBUG] Available cards on battlefield: ${playerField.map(c => c.instanceId).join(', ')}`);
    return state;
  }
  
  const attacker = playerField[attackerIndex];
  
  // Log attacker state for debugging
  console.log(`[ATTACK] Attacker card: ${attacker.card.name}`, {
    instanceId: attacker.instanceId,
    canAttack: attacker.canAttack,
    isSummoningSick: attacker.isSummoningSick,
    attacksPerformed: attacker.attacksPerformed || 0,
    keywords: attacker.card.keywords
  });
  
  // Check if the card can attack
  if (attacker.isSummoningSick) {
    console.error(`[ATTACK ERROR] Card ${attacker.card.name} cannot attack due to summoning sickness`);
    return state;
  }
  
  if (!attacker.canAttack) {
    console.error(`[ATTACK ERROR] Card ${attacker.card.name} cannot attack (already attacked this turn)`);
    return state;
  }
  
  // Ensure attacksPerformed exists
  if (attacker.attacksPerformed === undefined) {
    attacker.attacksPerformed = 0;
  }
  
  // Check for Rush restriction - cards with Rush can only attack minions on the turn they're played
  // Use the more robust isValidRushTarget function for consistency
  if (!defenderInstanceId) {
    if (!isValidRushTarget(attacker, 'hero')) {
      console.error('Minions with Rush cannot attack the enemy hero on the turn they are played');
      return state;
    }
  } else {
    if (!isValidRushTarget(attacker, 'minion')) {
      console.error('Invalid target for minion with Rush');
      return state;
    }
  }
  
  // Check if opponent has Taunt minions - if so, we can't attack the hero or non-Taunt minions
  const opponentHasTaunt = hasTauntMinions(newState.players.opponent.battlefield);
  
  // If no defender is specified, attack the opponent's hero directly
  if (!defenderInstanceId) {
    // Cannot attack hero if there are Taunt minions on the battlefield
    if (opponentHasTaunt) {
      console.error('Cannot attack hero directly when opponent has Taunt minions');
      return state;
    }
    
    // Deal damage to opponent's hero using the dealDamage function instead of direct modification
    // This ensures armor is properly handled
    if (attacker.card.attack !== undefined && attacker.card.attack > 0) {
      console.log(`Attacking hero with ${attacker.card.name} for ${attacker.card.attack} damage`);
      newState = dealDamage(newState, 'opponent', 'hero', attacker.card.attack, undefined, attacker.card.id, 'player');
    }
    
    // Store the original attacker ID
    const attackerId = attacker.instanceId;
    
    // Find attacker to ensure we have the right index (in case state has changed)
    const updatedAttackerIndex = newState.players.player.battlefield.findIndex(
      card => card.instanceId === attackerId
    );
    
    if (updatedAttackerIndex !== -1) {
      // Track attacks performed for Windfury
      newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed += 1;
      
      // For non-Windfury cards, or Windfury cards that have performed their maximum attacks (2), disable attacking
      const attackerKeywords = attacker.card.keywords || [];
      const hasWindfury = attackerKeywords.includes('windfury');
      const maxAttacksAllowed = hasWindfury ? 2 : 1;
      
      if (newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed >= maxAttacksAllowed) {
        // Mark the attacker as having used all its attacks this turn
        newState.players.player.battlefield[updatedAttackerIndex].canAttack = false;
      }
    }
    
    // Check if the opponent is defeated
    if (newState.players.opponent.health <= 0) {
      newState.gamePhase = "game_over";
      newState.winner = 'player';
      console.log('Game over - player wins!');
    }
    
    return newState;
  }
  
  // Find the defender card
  const opponentField = newState.players.opponent.battlefield;
  const defenderIndex = opponentField.findIndex(card => card.instanceId === defenderInstanceId);
  
  if (defenderIndex === -1) {
    console.error('Defender card not found');
    return state;
  }
  
  const defender = opponentField[defenderIndex];
  
  // If there are Taunt minions, we can only attack those
  const defenderKeywords = defender.card.keywords || [];
  if (opponentHasTaunt && !defenderKeywords.includes('taunt')) {
    console.error('Must attack Taunt minions first');
    return state;
  }
  
  // Check for Divine Shield on attacker and defender
  const attackerHasDivineShield = attacker.hasDivineShield;
  const defenderHasDivineShield = defender.hasDivineShield;
  
  // Track minions that take damage for Frenzy mechanic
  const damagedMinionIds: string[] = [];
  
  // Apply combat damage with Divine Shield consideration
  if (defenderHasDivineShield) {
    // Divine Shield blocks the damage once
    newState.players.opponent.battlefield[defenderIndex].hasDivineShield = false;
  } else {
    // Normal damage application
    if (attacker.card.attack && attacker.card.attack > 0) {
      newState.players.opponent.battlefield[defenderIndex].currentHealth -= attacker.card.attack;
      
      // Track this minion as damaged for Frenzy effect
      damagedMinionIds.push(defender.instanceId);
    }
    
    // Check and apply enrage effect after damage
    newState = updateEnrageEffects(newState);
  }
  
  if (attackerHasDivineShield) {
    // Divine Shield blocks the damage once
    newState.players.player.battlefield[attackerIndex].hasDivineShield = false;
  } else {
    // Normal damage application
    if (defender.card.attack && defender.card.attack > 0) {
      newState.players.player.battlefield[attackerIndex].currentHealth -= defender.card.attack;
      
      // Track this minion as damaged for Frenzy effect
      damagedMinionIds.push(attacker.instanceId);
    }
    
    // Check and apply enrage effect after damage
    newState = updateEnrageEffects(newState);
  }
  
  // Store the original attacker and defender IDs before manipulating the state
  const attackerId = attacker.instanceId;
  const defenderId = defender.instanceId;
  
  // Check for defeated defender minion (0 or less health)
  if (newState.players.opponent.battlefield[defenderIndex].currentHealth <= 0) {
    // Move the defender from the battlefield to the graveyard
    newState = destroyCard(newState, defenderId, 'opponent');
  }
  
  // We need to find the attacker again as the indexes might have changed after destroying a minion
  const updatedAttackerIndex = newState.players.player.battlefield.findIndex(
    card => card.instanceId === attackerId
  );
  
  // Only check attacker health if it's still on the battlefield
  if (updatedAttackerIndex !== -1 && 
      newState.players.player.battlefield[updatedAttackerIndex].currentHealth <= 0) {
    // Move the attacker from the battlefield to the graveyard
    newState = destroyCard(newState, attackerId, 'player');
  } else if (updatedAttackerIndex !== -1) {
    // Attacker is still alive, mark it as having performed an attack
    // We need to do this here because the index might have changed
    const attackerKeywords = attacker.card.keywords || [];
    const hasWindfury = attackerKeywords.includes('windfury');
    const maxAttacksAllowed = hasWindfury ? 2 : 1;
    
    newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed += 1;
    
    if (newState.players.player.battlefield[updatedAttackerIndex].attacksPerformed >= maxAttacksAllowed) {
      // Mark the attacker as having used all its attacks this turn
      newState.players.player.battlefield[updatedAttackerIndex].canAttack = false;
    }
  }
  
  // Process frenzy effects for any damaged minions that survived
  if (damagedMinionIds.length > 0) {
    // Process frenzy effects using the imported function
    // Create array of minions with playerIds for both attacker and defender
    const damagedMinionsWithPlayer: { id: string; playerId: 'player' | 'opponent' }[] = [];
    // Map defender minions to opponent
    damagedMinionIds.forEach(id => {
      if (id === attacker.instanceId) {
        damagedMinionsWithPlayer.push({ id, playerId: 'player' });
      } else {
        damagedMinionsWithPlayer.push({ id, playerId: 'opponent' });
      }
    });
    newState = processFrenzyEffects(newState, damagedMinionsWithPlayer);
  }
  
  // Process any "after attack" effects from the imported function
  if (attacker.card.type === 'minion') {
    // For minion attacks
    newState = processAfterAttackEffects(newState, 'minion', attacker.instanceId, 'player');
  }
  
  return checkGameOver(newState);
}

/**
 * Check if there are any Taunt minions on the battlefield
 * In Hearthstone, you must attack minions with Taunt before any other target
 */
function hasTauntMinions(battlefield: CardInstance[]): boolean {
  return battlefield.some(card => {
    const keywords = card.card.keywords || [];
    return keywords.includes('taunt');
  });
}

/**
 * Get all Taunt minions from the battlefield
 */
function getTauntMinions(battlefield: CardInstance[]): CardInstance[] {
  return battlefield.filter(card => {
    const keywords = card.card.keywords || [];
    return keywords.includes('taunt');
  });
}

/**
 * Finds optimal attack targets for a card following common Hearthstone strategies
 * and respecting the Taunt mechanic (must attack Taunt minions first)
 * Returns an array of optimal targets in priority order
 */
export function findOptimalAttackTargets(
  state: GameState,
  attackerInstanceId: string
): { defenderId: string, type: 'minion' | 'hero' }[] {
  // Only allow attacks during player's turn, except for AI simulation
  const isAISimulation = typeof window !== 'undefined' && 
    (window.location.pathname.includes('ai') || window.location.href.includes('ai-game'));
  
  if (state.currentTurn !== 'player' && !isAISimulation) {
    return [];
  }
  
  // Find the attacker card
  const playerField = state.players.player.battlefield;
  const attackerIndex = playerField.findIndex(card => card.instanceId === attackerInstanceId);
  
  if (attackerIndex === -1) {
    console.error('Attacker card not found');
    return [];
  }
  
  const attacker = playerField[attackerIndex];
  
  // Check if the card can attack
  if (attacker.isSummoningSick || !attacker.canAttack) {
    return []; // Card can't attack
  }
  
  const attackerAttack = attacker.card.attack;
  const opponentField = state.players.opponent.battlefield;
  const opponentHeroHealth = state.players.opponent.health;
  
  // Check for Taunt minions - they must be attacked first as per Hearthstone rules
  const opponentHasTaunts = hasTauntMinions(opponentField);
  
  const targets: { defenderId: string, type: 'minion' | 'hero', priority: number }[] = [];
  
  // If opponent has Taunt minions, we must attack them first
  if (opponentHasTaunts) {
    // Get just the Taunt minions
    const tauntMinions = getTauntMinions(opponentField);
    
    // Strategy 1 with Taunts: Value trades against Taunt minions
    tauntMinions.forEach(defenderCard => {
      // Can kill without dying
      if (attackerAttack >= defenderCard.currentHealth && defenderCard.card.attack < attacker.currentHealth) {
        targets.push({ 
          defenderId: defenderCard.instanceId, 
          type: 'minion', 
          priority: 500 + defenderCard.card.attack // High priority - we must deal with Taunts
        });
      }
    });
    
    // Strategy 2 with Taunts: Equal trades against Taunt minions
    tauntMinions.forEach(defenderCard => {
      // Equal value trade (we both die or high value target)
      if (attackerAttack >= defenderCard.currentHealth && 
          (defenderCard.card.attack >= attacker.currentHealth || 
           defenderCard.card.attack > attackerAttack)) {
        targets.push({ 
          defenderId: defenderCard.instanceId, 
          type: 'minion', 
          priority: 400 + defenderCard.card.attack 
        });
      }
    });
    
    // Strategy 3 with Taunts: Attack any Taunt minion (if no good trades found)
    if (targets.length === 0) {
      tauntMinions.forEach(defenderCard => {
        targets.push({ 
          defenderId: defenderCard.instanceId, 
          type: 'minion', 
          priority: 300 + defenderCard.card.attack // Priority on higher attack Taunts
        });
      });
    }
    
    // Return only Taunt targets if we found any - we MUST attack Taunts first
    if (targets.length > 0) {
      return targets
        .sort((a, b) => b.priority - a.priority)
        .map(({ defenderId, type }) => ({ defenderId, type }));
    }
  }
  
  // If no Taunts (or somehow all Taunts have been processed), normal targeting logic:
  
  // Strategy 1: Lethal - attack hero if we can win (only if no Taunts)
  // Cards with Rush can't attack heroes on the turn they're played
  const canAttackHero = isValidRushTarget(attacker, 'hero');
  if (!opponentHasTaunts && canAttackHero && attackerAttack >= opponentHeroHealth) {
    targets.push({ 
      defenderId: 'hero', 
      type: 'hero', 
      priority: 1000 // Highest priority - go for the win!
    });
  }
  
  // Strategy 2: Value trades - kill minions that our attacker can kill without dying
  opponentField.forEach(defenderCard => {
    // Skip Taunt minions as they were handled above
    const defenderKeywords = defenderCard.card.keywords || [];
    if (defenderKeywords.includes('taunt')) {
      return;
    }
    
    // Can kill without dying
    if (attackerAttack >= defenderCard.currentHealth && defenderCard.card.attack < attacker.currentHealth) {
      targets.push({ 
        defenderId: defenderCard.instanceId, 
        type: 'minion', 
        priority: 100 + defenderCard.card.attack // Prioritize killing higher attack minions
      });
    }
  });
  
  // Strategy 3: Equal trades - kill minions of equal or higher value
  opponentField.forEach(defenderCard => {
    // Skip Taunt minions as they were handled above
    const defenderKeywords = defenderCard.card.keywords || [];
    if (defenderKeywords.includes('taunt')) {
      return;
    }
    
    // Equal value trade (we both die or high value target)
    if (attackerAttack >= defenderCard.currentHealth && 
        (defenderCard.card.attack >= attacker.currentHealth || 
         defenderCard.card.attack > attackerAttack)) {
      targets.push({ 
        defenderId: defenderCard.instanceId, 
        type: 'minion', 
        priority: 50 + defenderCard.card.attack 
      });
    }
  });
  
  // Strategy 4: Attack any non-Taunt minion if we can't find good trades
  if (targets.length === 0 && opponentField.some(card => {
    const cardKeywords = card.card.keywords || [];
    return !cardKeywords.includes('taunt');
  })) {
    opponentField.forEach(defenderCard => {
      // Skip Taunt minions as they were handled above
      const defKeywords = defenderCard.card.keywords || [];
      if (defKeywords.includes('taunt')) {
        return;
      }
      
      targets.push({ 
        defenderId: defenderCard.instanceId, 
        type: 'minion', 
        priority: defenderCard.card.attack // Prioritize attacking high attack threats
      });
    });
  }
  
  // Strategy 5: Attack hero if no good minion trades (only if no Taunts and not Rush)
  if (!opponentHasTaunts && isValidRushTarget(attacker, 'hero') && (targets.length === 0 || opponentField.length === 0)) {
    targets.push({ 
      defenderId: 'hero', 
      type: 'hero', 
      priority: 10 
    });
  }
  
  // Sort by priority (highest first) and return without the priority field
  return targets
    .sort((a, b) => b.priority - a.priority)
    .map(({ defenderId, type }) => ({ defenderId, type }));
}

/**
 * Execute auto-attack with a specific card using optimal targeting
 * @deprecated Use manual attack system (attackStore.ts + AttackSystem.tsx) instead.
 * This auto-attack function is kept for backwards compatibility only.
 */
export function autoAttackWithCard(
  state: GameState,
  attackerInstanceId: string
): GameState {
  try {
    // Find optimal targets
    const optimalTargets = findOptimalAttackTargets(state, attackerInstanceId);
    
    if (optimalTargets.length === 0) {
      return state; // No valid targets
    }
    
    // Use the highest priority target
    const bestTarget = optimalTargets[0];
    
    // Execute the attack
    if (bestTarget.type === 'hero') {
      // Attack hero
      return processAttack(state, attackerInstanceId);
    } else {
      // Attack minion
      return processAttack(state, attackerInstanceId, bestTarget.defenderId);
    }
  } catch (error) {
    console.error('Auto-attack error:', error);
    return state; // Return unchanged state if there's an error
  }
}

/**
 * Auto-attack with a newly placed minion that has CHARGE - targets lowest health enemy minion or hero
 * This is ONLY called for minions with the Charge keyword (not Rush, which requires player targeting)
 * The function bypasses summoning sickness since Charge minions can attack immediately
 * @deprecated Use manual attack system (attackStore.ts + AttackSystem.tsx) instead.
 * This auto-attack function is kept for backwards compatibility only.
 * @param state Current game state
 * @param attackerInstanceId ID of the minion that was just placed
 * @param attackerOwner 'player' or 'opponent' - who owns the attacker
 * @returns Updated game state after attack
 */
export function autoAttackOnPlace(
  state: GameState,
  attackerInstanceId: string,
  attackerOwner: 'player' | 'opponent' = 'player'
): GameState {
  try {
    const defenderOwner = attackerOwner === 'player' ? 'opponent' : 'player';
    const attackerField = state.players[attackerOwner].battlefield;
    const defenderField = state.players[defenderOwner].battlefield;
    
    // Find the attacker
    const attackerIndex = attackerField.findIndex(c => c.instanceId === attackerInstanceId);
    if (attackerIndex === -1) {
      console.log(`[AutoAttackOnPlace] Attacker ${attackerInstanceId} not found on battlefield`);
      return state;
    }
    
    const attacker = attackerField[attackerIndex];
    
    // Check if attacker can attack (bypass summoning sickness for auto-attack)
    if (!attacker.card.attack || attacker.card.attack <= 0) {
      console.log(`[AutoAttackOnPlace] ${attacker.card.name} has no attack power`);
      return state;
    }
    
    // Check for Taunt minions first - must attack them if present
    const tauntMinions = defenderField.filter(m => 
      (m.card.keywords || []).includes('taunt') && !m.isSilenced
    );
    
    let targetId: string | undefined;
    let targetName: string = 'hero';
    
    if (tauntMinions.length > 0) {
      // Must attack lowest health taunt
      const lowestHealthTaunt = tauntMinions.reduce((lowest, current) => 
        (current.currentHealth || current.card.health || 999) < (lowest.currentHealth || lowest.card.health || 999) 
          ? current : lowest
      );
      targetId = lowestHealthTaunt.instanceId;
      targetName = lowestHealthTaunt.card.name;
      console.log(`[AutoAttackOnPlace] ${attacker.card.name} attacks taunt ${targetName} (lowest health taunt)`);
    } else if (defenderField.length > 0) {
      // Attack lowest health minion
      const lowestHealthMinion = defenderField.reduce((lowest, current) => 
        (current.currentHealth || current.card.health || 999) < (lowest.currentHealth || lowest.card.health || 999) 
          ? current : lowest
      );
      targetId = lowestHealthMinion.instanceId;
      targetName = lowestHealthMinion.card.name;
      console.log(`[AutoAttackOnPlace] ${attacker.card.name} attacks ${targetName} (lowest health minion)`);
    } else {
      // No minions - attack hero directly
      targetId = undefined;
      console.log(`[AutoAttackOnPlace] ${attacker.card.name} attacks hero directly (no enemy minions)`);
    }
    
    // Temporarily enable attack by removing summoning sickness
    let newState = JSON.parse(JSON.stringify(state)) as GameState;
    const attackerInNewState = newState.players[attackerOwner].battlefield[attackerIndex];
    attackerInNewState.isSummoningSick = false;
    attackerInNewState.canAttack = true;
    
    // Execute the attack
    newState = processAttack(newState, attackerInstanceId, targetId);
    
    console.log(`[AutoAttackOnPlace] Attack executed: ${attacker.card.name} -> ${targetName}`);
    
    return newState;
  } catch (error) {
    console.error('[AutoAttackOnPlace] Error:', error);
    return state;
  }
}

/**
 * Apply damage to a card or hero
 * @param state Current game state
 * @param playerId ID of the player who owns the target ('player' or 'opponent')
 * @param targetId ID of the target to damage, or 'hero' for the player's hero
 * @param damageAmount Amount of damage to apply
 * @returns Updated game state
 */
export function applyDamage(
  state: GameState,
  playerId: 'player' | 'opponent',
  targetId: string,
  damageAmount: number
): GameState {
  // Create a copy of the state to modify
  const updatedState = JSON.parse(JSON.stringify(state)) as GameState;
  
  // If the target is the hero, apply damage using the specialized dealDamage function
  if (targetId === 'hero') {
    // Use the dealDamage function to handle armor properly with source info
    const sourcePlayerID = playerId === 'player' ? 'opponent' : 'player';
    console.log(`Applying ${damageAmount} damage to ${playerId} hero from ${sourcePlayerID}`);
    return dealDamage(updatedState, playerId, 'hero', damageAmount, undefined, undefined, sourcePlayerID);
  }
  
  // Find the target minion
  const battlefield = updatedState.players[playerId].battlefield;
  const targetIndex = battlefield.findIndex(card => card.instanceId === targetId);
  
  if (targetIndex === -1) {
    return state; // Return unchanged state if target not found
  }
  
  const targetMinion = battlefield[targetIndex];
  
  // Check for Divine Shield
  if (targetMinion.hasDivineShield) {
    // Divine Shield absorbs all damage, but is consumed
    updatedState.players[playerId].battlefield[targetIndex].hasDivineShield = false;
    return updatedState;
  }
  
  // Apply damage to the minion
  if (targetMinion.currentHealth !== undefined) {
    const newHealth = targetMinion.currentHealth - damageAmount;
    updatedState.players[playerId].battlefield[targetIndex].currentHealth = newHealth;
    
    // Check if the minion is defeated
    if (newHealth <= 0) {
      // Move minion from battlefield to graveyard
      return destroyCard(updatedState, targetId, playerId);
    }
  }
  
  return updatedState;
}

/**
 * @deprecated Use manual attack system (attackStore.ts + AttackSystem.tsx) instead.
 * This auto-attack function is kept for backwards compatibility only.
 */
export function autoAttackWithAllCards(state: GameState): GameState {
  try {
    // Only allow auto-attack during player's turn, except for AI simulation
    const isAISimulation = typeof window !== 'undefined' && 
      (window.location.pathname.includes('ai') || window.location.href.includes('ai-game'));
    
    if (state.currentTurn !== 'player' && !isAISimulation) {
      return state;
    }
    
    // Get all cards that can attack
    const attackableCards = state.players.player.battlefield
      .filter(card => !card.isSummoningSick && card.canAttack)
      .sort((a, b) => b.card.attack - a.card.attack); // Sort by attack power (highest first)
    
    // No cards can attack
    if (attackableCards.length === 0) {
      return state;
    }
    
    // Execute attacks one by one, modifying the state each time
    let newState = JSON.parse(JSON.stringify(state)) as GameState;
    
    attackableCards.forEach(card => {
      newState = autoAttackWithCard(newState, card.instanceId);
    });
    
    return newState;
  } catch (error) {
    console.error('Auto-attack all error:', error);
    return state; // Return unchanged state if there's an error
  }
}
