/**
 * Utility functions for handling Old Gods mechanics
 * Primarily C'Thun buffs and summons, N'Zoth's deathrattle resurrection, and Yogg-Saron's random spells
 */

import { GameState, CardData, CardInstance, GameLogEventType, Player } from '../types';
import { createGameLogEvent } from './logUtils';
import { getCardDatabase } from '../data/cardDatabaseUtils';
import { applyDamage } from './gameUtils';
import { dealDamage } from './effects/damageUtils';
import { getRandomInt } from './randomUtils';
import { isMinion, getAttack, getHealth } from './cards/typeGuards';
import { debug } from '../config/debugConfig';

interface CThunState {
  baseAttack: number;
  baseHealth: number;
  currentAttack: number;
  currentHealth: number;
  buffsApplied: number;
}

interface PlayerWithCThun extends Player {
  cthunData?: CThunState;
  spellsCastThisGame?: number;
}

interface GameStateWithCThun extends Omit<GameState, 'players'> {
  players: {
    player: PlayerWithCThun;
    opponent: PlayerWithCThun;
  };
}

/**
 * Initialize C'Thun state for a player
 * Sets the initial values for C'Thun's stats (6/6)
 * @param state Current game state
 * @param playerType Player to initialize C'Thun for
 * @returns Updated game state with C'Thun initialized
 */
export function initializeCThun(
  state: GameState,
  playerType: 'player' | 'opponent'
): GameStateWithCThun {
  // Create a deep copy of the state to avoid mutation
  const newState: GameStateWithCThun = JSON.parse(JSON.stringify(state));
  
  // Initialize C'Thun data if it doesn't exist
  if (!newState.players[playerType].cthunData) {
    newState.players[playerType].cthunData = {
      baseAttack: 6,
      baseHealth: 6,
      currentAttack: 6,
      currentHealth: 6,
      buffsApplied: 0
    };
  }
  
  return newState;
}

/**
 * Apply a buff to C'Thun (wherever it is)
 * @param state Current game state
 * @param playerType Player whose C'Thun to buff
 * @param attackBuff Attack buff to apply
 * @param healthBuff Health buff to apply
 * @returns Updated game state with C'Thun buffed
 */
export function buffCThun(
  state: GameState,
  playerType: 'player' | 'opponent',
  attackBuff: number,
  healthBuff: number
): GameStateWithCThun {
  // Create a deep copy of the state to avoid mutation
  let newState: GameStateWithCThun = JSON.parse(JSON.stringify(state));
  
  // Initialize C'Thun data if it doesn't exist
  if (!newState.players[playerType].cthunData) {
    newState = initializeCThun(newState, playerType);
  }
  
  // Apply buffs
  const cthunData = newState.players[playerType].cthunData!;
  cthunData.currentAttack += attackBuff;
  cthunData.currentHealth += healthBuff;
  cthunData.buffsApplied += 1;
  
  // Log the buff
  newState.gameLog.push(
    createGameLogEvent({
      type: 'cthun_buff' as GameLogEventType,
      player: playerType,
      text: `C'Thun gained +${attackBuff}/+${healthBuff} (now ${cthunData.currentAttack}/${cthunData.currentHealth}).`,
      value: cthunData.buffsApplied
    })
  );
  
  // Update any C'Thun card in the player's hand or battlefield (CardInstance)
  const updateCardInstanceStats = (card: CardInstance): CardInstance => {
    if (card.card.id === 60001 && isMinion(card.card)) { // C'Thun's ID
      card.card.attack = cthunData.currentAttack;
      card.card.health = cthunData.currentHealth;
      card.currentHealth = cthunData.currentHealth;
    }
    return card;
  };
  
  // Update any C'Thun card in the deck (CardData)
  const updateCardDataStats = (card: CardData): CardData => {
    if (card.id === 60001 && isMinion(card)) { // C'Thun's ID
      return {
        ...card,
        attack: cthunData.currentAttack,
        health: cthunData.currentHealth
      };
    }
    return card;
  };
  
  // Update all C'Thun instances
  newState.players[playerType].hand = newState.players[playerType].hand.map(updateCardInstanceStats);
  newState.players[playerType].deck = newState.players[playerType].deck.map(updateCardDataStats);
  newState.players[playerType].battlefield = newState.players[playerType].battlefield.map(updateCardInstanceStats);
  
  return newState;
}

/**
 * Check if C'Thun has at least 10 attack
 * Used for conditional effects like Twin Emperor Vek'lor
 * @param state Current game state
 * @param playerType Player to check C'Thun for
 * @returns Boolean indicating if C'Thun has 10+ attack
 */
export function isCThunPowered(
  state: GameState | GameStateWithCThun, 
  playerType: 'player' | 'opponent'
): boolean {
  // Cast to extended type to access cthunData
  const extendedState = state as GameStateWithCThun;
  
  // If C'Thun data doesn't exist, return false
  if (!extendedState.players[playerType].cthunData) {
    return false;
  }
  
  // Check if C'Thun has at least 10 attack
  return extendedState.players[playerType].cthunData.currentAttack >= 10;
}

/**
 * Execute C'Thun's battlecry
 * Deals damage equal to C'Thun's attack randomly split among all enemies
 * @param state Current game state
 * @param cthunInstanceId ID of the C'Thun instance
 * @param playerType Player who played C'Thun
 * @returns Updated game state after C'Thun's battlecry
 */
export function executeCThunBattlecry(
  state: GameState,
  cthunInstanceId: string,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Get the enemy player type
  const enemyType = playerType === 'player' ? 'opponent' : 'player';
  
  // Find C'Thun on the battlefield
  const cthunIndex = newState.players[playerType].battlefield.findIndex(
    (card: CardInstance) => card.instanceId === cthunInstanceId
  );
  
  if (cthunIndex === -1) {
    debug.error("C'Thun not found on battlefield");
    return state;
  }
  
  // Get C'Thun's attack value
  const cthun = newState.players[playerType].battlefield[cthunIndex];
  const damageAmount = getAttack(cthun.card);
  
  // Log the battlecry
  newState.gameLog.push(
    createGameLogEvent({
      type: 'cthun_battlecry' as GameLogEventType,
      player: playerType,
      text: `C'Thun unleashes ${damageAmount} damage randomly split among enemies.`,
      cardId: cthun.card.id.toString(),
      value: damageAmount
    })
  );
  
  // Get valid targets (enemy minions and hero)
  const enemyMinions = newState.players[enemyType].battlefield;
  
  // Split damage randomly
  for (let i = 0; i < damageAmount; i++) {
    // Gather all valid targets
    const targets = [...enemyMinions];
    
    // Add the enemy hero
    targets.push({
      instanceId: `${enemyType}_hero`,
      isHero: true
    } as any);
    
    // Skip if no targets
    if (targets.length === 0) {
      break;
    }
    
    // Select a random target
    const randomIndex = getRandomInt(0, targets.length - 1);
    const target = targets[randomIndex];
    
    // Apply 1 damage
    if (target.isHero) {
      newState = dealDamage(newState as GameState, enemyType, 'hero', 1, undefined, undefined, playerType);
    } else {
      // Damage minion
      const targetPlayerId = enemyType; // Target is from the enemy
      newState = applyDamage(newState, targetPlayerId, target.instanceId, 1);
    }
  }
  
  return newState;
}

/**
 * Execute N'Zoth's battlecry
 * Resurrects deathrattle minions that died this game
 * @param state Current game state
 * @param nzothInstanceId ID of the N'Zoth instance
 * @param playerType Player who played N'Zoth
 * @returns Updated game state after N'Zoth's battlecry
 */
export function executeNZothBattlecry(
  state: GameState,
  nzothInstanceId: string,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Get the player's graveyard
  const graveyard = newState.players[playerType].graveyard || [];
  
  // Filter for deathrattle minions
  const deathrattleMinions = graveyard.filter(
    (card: CardInstance) => isMinion(card.card) && 
    (card.card.keywords?.includes('deathrattle') || card.card.deathrattle)
  );
  
  // Log the battlecry
  newState.gameLog.push(
    createGameLogEvent({
      type: 'nzoth_battlecry' as GameLogEventType,
      player: playerType,
      text: `N'Zoth attempts to resurrect ${deathrattleMinions.length} Deathrattle minions.`,
      cardId: '60101', // N'Zoth's ID
      value: deathrattleMinions.length
    })
  );
  
  // If no deathrattle minions, return unchanged state
  if (deathrattleMinions.length === 0) {
    return newState;
  }
  
  // Get available battlefield slots
  const maxMinions = 7;
  const currentMinions = newState.players[playerType].battlefield.length;
  const availableSlots = Math.max(0, maxMinions - currentMinions);
  
  // Only resurrect up to available slots
  const minionsToResurrect = deathrattleMinions.slice(0, availableSlots);
  
  // Summon each minion
  for (const minion of minionsToResurrect) {
    // Create a fresh copy of the minion
    const newMinion: CardInstance = {
      ...JSON.parse(JSON.stringify(minion)),
      instanceId: `${playerType}_nzoth_${minion.card.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      isPlayed: false,
      isSummoningSick: true,
      attacksPerformed: 0,
      currentHealth: getHealth(minion.card)
    };
    
    // Add to battlefield
    newState.players[playerType].battlefield.push(newMinion);
    
    // Log resurrection
    newState.gameLog.push(
      createGameLogEvent({
        type: 'summon' as GameLogEventType,
        player: playerType,
        text: `N'Zoth resurrected ${minion.card.name}.`,
        cardId: minion.card.id.toString()
      })
    );
  }
  
  return newState;
}

/**
 * Execute Yogg-Saron's battlecry
 * Casts random spells for each spell played this game
 * @param state Current game state
 * @param yoggInstanceId ID of the Yogg-Saron instance
 * @param playerType Player who played Yogg-Saron
 * @returns Updated game state after Yogg-Saron's battlecry
 */
export function executeYoggSaronBattlecry(
  state: GameState,
  yoggInstanceId: string,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Get number of spells cast this game
  const spellsCast = newState.players[playerType].spellsCastThisGame || 0;
  
  // Log the battlecry
  newState.gameLog.push(
    createGameLogEvent({
      type: 'yogg_saron_battlecry' as GameLogEventType,
      player: playerType,
      text: `Yogg-Saron will cast ${spellsCast} random spells.`,
      cardId: '60102', // Yogg-Saron's ID
      value: spellsCast
    })
  );
  
  // If no spells cast, return unchanged state
  if (spellsCast === 0) {
    return newState;
  }
  
  // Get all spells from the card database
  const cardDatabase = getCardDatabase();
  const allSpells = cardDatabase.filter(card => card.type === 'spell');
  
  // Cast random spells
  for (let i = 0; i < spellsCast; i++) {
    // Skip if Yogg-Saron is no longer on the battlefield (destroyed by a previous spell)
    const yoggStillExists = newState.players[playerType].battlefield.some(
      (card: CardInstance) => card.instanceId === yoggInstanceId
    );
    
    if (!yoggStillExists) {
      newState.gameLog.push(
        createGameLogEvent({
          type: 'yogg_saron_stopped' as GameLogEventType,
          player: playerType,
          text: `Yogg-Saron was destroyed, stopping spell casting.`,
          cardId: '60102'
        })
      );
      break;
    }
    
    // Pick a random spell
    const randomSpellIndex = getRandomInt(0, allSpells.length - 1);
    const randomSpell = allSpells[randomSpellIndex];
    
    // Log the spell cast
    newState.gameLog.push(
      createGameLogEvent({
        type: 'yogg_saron_cast' as GameLogEventType,
        player: playerType,
        text: `Yogg-Saron casts ${randomSpell.name}.`,
        cardId: randomSpell.id.toString()
      })
    );
    
    // TODO: Implement the actual spell casting with random targets
    // This would need integration with the spell execution system
    // For now, we'll just log the spells that would be cast
  }
  
  return newState;
}

/**
 * Process Y'Shaarj's end of turn effect
 * Summons a minion from the player's deck
 * @param state Current game state
 * @param yshaarjInstanceId ID of the Y'Shaarj instance
 * @param playerType Player who controls Y'Shaarj
 * @returns Updated game state after Y'Shaarj's effect
 */
export function executeYShaarjEffect(
  state: GameState,
  yshaarjInstanceId: string,
  playerType: 'player' | 'opponent'
): GameState {
  // Create a deep copy of the state to avoid mutation
  let newState = JSON.parse(JSON.stringify(state));
  
  // Get the player's deck
  const deck = newState.players[playerType].deck;
  
  // If deck is empty, return unchanged state
  if (deck.length === 0) {
    newState.gameLog.push(
      createGameLogEvent({
        type: 'yshaarj_effect_failed' as GameLogEventType,
        player: playerType,
        text: `Y'Shaarj had no minions to summon from an empty deck.`,
        cardId: '60103'
      })
    );
    return newState;
  }
  
  // Filter for minions in deck - deck contains CardData, not CardInstance
  const minionsInDeck = deck.filter((card: CardData) => isMinion(card));
  
  // If no minions, return unchanged state
  if (minionsInDeck.length === 0) {
    newState.gameLog.push(
      createGameLogEvent({
        type: 'yshaarj_effect_failed' as GameLogEventType,
        player: playerType,
        text: `Y'Shaarj had no minions in deck to summon.`,
        cardId: '60103'
      })
    );
    return newState;
  }
  
  // Check if the battlefield is full
  if (newState.players[playerType].battlefield.length >= 7) {
    newState.gameLog.push(
      createGameLogEvent({
        type: 'yshaarj_effect_failed' as GameLogEventType,
        player: playerType,
        text: `Y'Shaarj's battlefield is full, cannot summon.`,
        cardId: '60103'
      })
    );
    return newState;
  }
  
  // Pick a random minion from the deck
  const randomIndex = getRandomInt(0, minionsInDeck.length - 1);
  const cardToSummon = minionsInDeck[randomIndex];
  
  // Remove from deck by index since deck is CardData[] without instanceId
  const deckIndex = deck.findIndex((card: CardData) => card.id === cardToSummon.id);
  if (deckIndex !== -1) {
    newState.players[playerType].deck.splice(deckIndex, 1);
  }
  
  // Create a CardInstance from the CardData and add to battlefield
  const newInstance: CardInstance = {
    instanceId: `${playerType}_yshaarj_${cardToSummon.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    card: cardToSummon,
    currentHealth: getHealth(cardToSummon),
    isSummoningSick: true,
    attacksPerformed: 0
  };
  
  newState.players[playerType].battlefield.push(newInstance);
  
  // Log the summon
  newState.gameLog.push(
    createGameLogEvent({
      type: 'yshaarj_effect' as GameLogEventType,
      player: playerType,
      text: `Y'Shaarj summoned ${cardToSummon.name} from your deck.`,
      cardId: cardToSummon.id.toString()
    })
  );
  
  return newState;
}

/**
 * Check if C'Thun is in the player's hand, deck, or battlefield
 * @param state Current game state
 * @param playerType Player to check
 * @returns Boolean indicating if the player has C'Thun
 */
export function playerHasCThun(
  state: GameState,
  playerType: 'player' | 'opponent'
): boolean {
  const player = state.players[playerType];
  
  // Check hand
  const inHand = player.hand.some((card: CardInstance) => card.card.id === 60001);
  
  // Check deck
  const inDeck = player.deck.some((card: CardData) => card.id === 60001);
  
  // Check battlefield
  const onBattlefield = player.battlefield.some((card: CardInstance) => card.card.id === 60001);
  
  return inHand || inDeck || onBattlefield;
}