/**
 * PokerCombatSlice - Poker combat state and actions
 * 
 * Manages all poker-related gameplay including betting, hands, and resolution.
 */

import { StateCreator } from 'zustand';
import {
  PokerCombatState,
  CombatPhase as PokerCombatPhase,
  CombatAction,
  PokerCard,
  PlayerCombatState,
  EvaluatedHand,
  CombatResolution,
  PetData,
  createPokerDeck,
  shuffleDeck,
  DEFAULT_BLIND_CONFIG,
  PokerPosition,
  PokerHandRank,
  HAND_DAMAGE_MULTIPLIERS,
  HAND_RANK_NAMES,
  ElementBuff
} from '../../types/PokerCombatTypes';
import { BLINDS } from '../../combat/modules/BettingEngine';
import { 
  PokerState, 
  PokerPhase, 
  CombatLogEntry,
  PokerCombatSlice,
  UnifiedCombatStore
} from './types';
import { getElementAdvantage } from '../../utils/elements';

function getCombinations<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  
  function combine(start: number, current: T[]) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      combine(i + 1, current);
      current.pop();
    }
  }
  
  combine(0, []);
  return result;
}

function compareTieBreakers(a: number[], b: number[]): number {
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i++) {
    const aVal = a[i] || 0;
    const bVal = b[i] || 0;
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  return 0;
}

function evaluateFiveCardHand(cards: PokerCard[]): EvaluatedHand {
  const sorted = [...cards].sort((a, b) => b.numericValue - a.numericValue);
  
  const isFlush = cards.every(c => c.suit === cards[0].suit);
  
  const values = sorted.map(c => c.numericValue);
  
  const isRegularStraight = values.every((v, i) => i === 0 || values[i - 1] - v === 1);
  
  const isWheelStraight = values[0] === 14 && 
    values[1] === 5 && 
    values[2] === 4 && 
    values[3] === 3 && 
    values[4] === 2;
  
  const isStraight = isRegularStraight || isWheelStraight;
  
  const valueCounts: Record<number, number> = {};
  for (const card of cards) {
    valueCounts[card.numericValue] = (valueCounts[card.numericValue] || 0) + 1;
  }
  const counts = Object.values(valueCounts).sort((a, b) => b - a);
  
  const valuesByCount = Object.entries(valueCounts)
    .map(([val, cnt]) => ({ value: parseInt(val), count: cnt }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
  
  let rank: PokerHandRank;
  let tieBreakers: number[] = [];
  
  if (isFlush && isStraight && values[0] === 14 && values[4] === 10) {
    rank = PokerHandRank.RAGNAROK;
    tieBreakers = [14];
  } else if (isFlush && isStraight) {
    rank = PokerHandRank.DIVINE_ALIGNMENT;
    tieBreakers = [isWheelStraight ? 5 : values[0]];
  } else if (counts[0] === 4) {
    rank = PokerHandRank.GODLY_POWER;
    const quadVal = valuesByCount[0].value;
    const kicker = valuesByCount[1].value;
    tieBreakers = [quadVal, kicker];
  } else if (counts[0] === 3 && counts[1] === 2) {
    rank = PokerHandRank.VALHALLAS_BLESSING;
    const tripVal = valuesByCount[0].value;
    const pairVal = valuesByCount[1].value;
    tieBreakers = [tripVal, pairVal];
  } else if (isFlush) {
    rank = PokerHandRank.ODINS_EYE;
    tieBreakers = values;
  } else if (isStraight) {
    rank = PokerHandRank.FATES_PATH;
    tieBreakers = [isWheelStraight ? 5 : values[0]];
  } else if (counts[0] === 3) {
    rank = PokerHandRank.THORS_HAMMER;
    const tripVal = valuesByCount[0].value;
    const kickers = valuesByCount.slice(1).map(v => v.value).sort((a, b) => b - a);
    tieBreakers = [tripVal, ...kickers];
  } else if (counts[0] === 2 && counts[1] === 2) {
    rank = PokerHandRank.DUAL_RUNES;
    const pairs = valuesByCount.filter(v => v.count === 2).map(v => v.value).sort((a, b) => b - a);
    const kicker = valuesByCount.find(v => v.count === 1)?.value || 0;
    tieBreakers = [pairs[0], pairs[1], kicker];
  } else if (counts[0] === 2) {
    rank = PokerHandRank.RUNE_MARK;
    const pairVal = valuesByCount[0].value;
    const kickers = valuesByCount.slice(1).map(v => v.value).sort((a, b) => b - a);
    tieBreakers = [pairVal, ...kickers];
  } else {
    rank = PokerHandRank.HIGH_CARD;
    tieBreakers = values;
  }
  
  return {
    rank,
    cards: sorted,
    highCard: sorted[0],
    multiplier: HAND_DAMAGE_MULTIPLIERS[rank],
    displayName: HAND_RANK_NAMES[rank],
    tieBreakers
  };
}

export const evaluatePokerHand = (holeCards: PokerCard[], communityCards: PokerCard[]): EvaluatedHand => {
  const allCards = [...holeCards, ...communityCards];
  
  if (allCards.length < 5) {
    return {
      rank: PokerHandRank.HIGH_CARD,
      cards: allCards,
      highCard: allCards[0] || { suit: 'spades', value: 'A', numericValue: 14 },
      multiplier: HAND_DAMAGE_MULTIPLIERS[PokerHandRank.HIGH_CARD],
      displayName: HAND_RANK_NAMES[PokerHandRank.HIGH_CARD],
      tieBreakers: allCards.map(c => c.numericValue).sort((a, b) => b - a)
    };
  }
  
  let bestHand: EvaluatedHand | null = null;
  
  const combinations = getCombinations(allCards, 5);
  for (const combo of combinations) {
    const evaluated = evaluateFiveCardHand(combo);
    if (!bestHand || evaluated.rank > bestHand.rank ||
        (evaluated.rank === bestHand.rank && compareTieBreakers(evaluated.tieBreakers, bestHand.tieBreakers) > 0)) {
      bestHand = evaluated;
    }
  }
  
  return bestHand!;
};

export const createPokerCombatSlice: StateCreator<
  UnifiedCombatStore,
  [],
  [],
  PokerCombatSlice
> = (set, get) => ({
  pokerState: null,
  pokerCombatState: null,
  pokerDeck: [],
  pokerIsActive: false,
  mulliganComplete: false,
  isTransitioningHand: false,

  initializePoker: () => {
    set({
      combatPhase: 'POKER_BETTING',
      pokerState: {
        phase: 'FAITH',
        pot: 0,
        playerHoleCards: [],
        opponentHoleCards: [],
        communityCards: [],
        playerBet: 0,
        opponentBet: 0,
        currentBetToMatch: 0,
        isPlayerTurn: true,
        lastAction: null,
      },
    });
  },

  setPokerPhase: (phase) => {
    const current = get().pokerState;
    if (current) {
      set({
        pokerState: { ...current, phase },
      });
    }
  },

  dealCommunityCards: (cards) => {
    const current = get().pokerState;
    if (current) {
      set({
        pokerState: {
          ...current,
          communityCards: [...current.communityCards, ...cards],
        },
      });
    }
  },

  placeBet: (player, amount) => {
    const current = get().pokerState;
    if (!current) return;

    const updates: Partial<PokerState> = {
      pot: current.pot + amount,
      lastAction: `${player} bet ${amount}`,
      isPlayerTurn: player === 'player' ? false : true,
    };

    if (player === 'player') {
      updates.playerBet = current.playerBet + amount;
    } else {
      updates.opponentBet = current.opponentBet + amount;
    }

    updates.currentBetToMatch = Math.max(
      updates.playerBet ?? current.playerBet,
      updates.opponentBet ?? current.opponentBet
    );

    set({ pokerState: { ...current, ...updates } });
  },

  fold: (player) => {
    const current = get().pokerState;
    if (current) {
      set({
        pokerState: {
          ...current,
          lastAction: `${player} folded`,
        },
        combatPhase: 'RESOLUTION',
      });
    }
  },

  endPokerRound: (winnerId, damage) => {
    get().addLogEntry({
      id: `poker_end_${Date.now()}`,
      timestamp: Date.now(),
      type: 'poker',
      message: `${winnerId} wins poker round, deals ${damage} damage`,
    });
    set({
      pokerState: null,
      combatPhase: 'CHESS_MOVEMENT',
    });
  },

  initializePokerCombat: (
    playerId: string,
    playerName: string,
    playerPet: PetData,
    opponentId: string,
    opponentName: string,
    opponentPet: PetData,
    skipMulligan = false,
    playerKingId?: string,
    opponentKingId?: string,
    firstStrikeTarget?: 'player' | 'opponent'
  ) => {
    let deck = shuffleDeck(createPokerDeck());
    
    let playerHoleCards: PokerCard[] = [];
    let opponentHoleCards: PokerCard[] = [];
    
    if (skipMulligan) {
      playerHoleCards = [deck.pop()!, deck.pop()!];
      opponentHoleCards = [deck.pop()!, deck.pop()!];
    }
    
    const playerPosition: PokerPosition = 'small_blind';
    const opponentPosition: PokerPosition = 'big_blind';
    const openerIsPlayer = playerPosition === 'small_blind';
    const minBet = DEFAULT_BLIND_CONFIG.bigBlind;
    
    const FIRST_STRIKE_DAMAGE = 15;
    let startingPhase = skipMulligan ? PokerCombatPhase.SPELL_PET : PokerCombatPhase.MULLIGAN;
    if (firstStrikeTarget) {
      startingPhase = PokerCombatPhase.FIRST_STRIKE;
    }
    
    const playerElement = playerPet.stats.element;
    const opponentElement = opponentPet.stats.element;
    
    const playerAdvantage = getElementAdvantage(playerElement, opponentElement);
    const opponentAdvantage = getElementAdvantage(opponentElement, playerElement);
    
    const playerElementBuff: ElementBuff = {
      hasAdvantage: playerAdvantage.hasAdvantage,
      attackBonus: playerAdvantage.attackBonus,
      healthBonus: playerAdvantage.healthBonus,
      armorBonus: playerAdvantage.armorBonus
    };
    
    const opponentElementBuff: ElementBuff = {
      hasAdvantage: opponentAdvantage.hasAdvantage,
      attackBonus: opponentAdvantage.attackBonus,
      healthBonus: opponentAdvantage.healthBonus,
      armorBonus: opponentAdvantage.armorBonus
    };
    
    const playerPetCopy = JSON.parse(JSON.stringify(playerPet));
    const opponentPetCopy = JSON.parse(JSON.stringify(opponentPet));
    
    const playerCombatState: PlayerCombatState = {
      playerId,
      playerName,
      pet: playerPetCopy,
      holeCards: playerHoleCards,
      hpCommitted: 0,
      blindPosted: 0,
      preBlindHealth: playerPetCopy.stats.currentHealth,
      heroArmor: playerAdvantage.hasAdvantage ? playerAdvantage.armorBonus : 0,
      statusEffects: [],
      mana: 1,
      maxMana: 9,
      isReady: false,
      elementBuff: playerElementBuff
    };
    
    const opponentCombatState: PlayerCombatState = {
      playerId: opponentId,
      playerName: opponentName,
      pet: opponentPetCopy,
      holeCards: opponentHoleCards,
      hpCommitted: 0,
      blindPosted: 0,
      preBlindHealth: opponentPetCopy.stats.currentHealth,
      heroArmor: opponentAdvantage.hasAdvantage ? opponentAdvantage.armorBonus : 0,
      statusEffects: [],
      mana: 1,
      maxMana: 9,
      isReady: false,
      elementBuff: opponentElementBuff
    };
    
    const combatState: PokerCombatState = {
      combatId: `combat_${Date.now()}`,
      phase: startingPhase,
      player: playerCombatState,
      opponent: opponentCombatState,
      communityCards: { faith: [] },
      currentBet: 0,
      pot: 0,
      turnTimer: 40,
      maxTurnTime: 40,
      actionHistory: [],
      minBet,
      openerIsPlayer,
      preflopBetMade: false,
      blindConfig: DEFAULT_BLIND_CONFIG,
      playerPosition,
      opponentPosition,
      blindsPosted: false,
      isAllInShowdown: false,
      firstStrike: firstStrikeTarget ? {
        damage: FIRST_STRIKE_DAMAGE,
        target: firstStrikeTarget,
        completed: false
      } : undefined
    };
    
    set({
      pokerCombatState: combatState,
      pokerDeck: deck,
      pokerIsActive: true,
      mulliganComplete: skipMulligan,
      isTransitioningHand: false,
      combatPhase: 'POKER_BETTING'
    });
    
    get().addLogEntry({
      id: `poker_init_${Date.now()}`,
      timestamp: Date.now(),
      type: 'poker',
      message: `Poker combat initialized: ${playerName} vs ${opponentName}`
    });
  },

  completeFirstStrike: () => {
    console.log('[PokerCombatSlice] completeFirstStrike called');
    const state = get();
    if (!state.pokerCombatState || !state.pokerCombatState.firstStrike) {
      console.log('[PokerCombatSlice] No firstStrike state, returning early');
      return;
    }
    if (state.pokerCombatState.firstStrike.completed) {
      console.log('[PokerCombatSlice] FirstStrike already completed, returning early');
      return;
    }
    
    const { damage, target } = state.pokerCombatState.firstStrike;
    const targetState = target === 'player' ? state.pokerCombatState.player : state.pokerCombatState.opponent;
    
    const newHealth = Math.max(1, targetState.pet.stats.currentHealth - damage);
    
    const updatedTargetState = {
      ...targetState,
      pet: {
        ...targetState.pet,
        stats: {
          ...targetState.pet.stats,
          currentHealth: newHealth
        }
      },
      preBlindHealth: newHealth
    };
    
    const nextPhase = state.mulliganComplete ? PokerCombatPhase.SPELL_PET : PokerCombatPhase.MULLIGAN;
    console.log(`[PokerCombatSlice] First strike damage ${damage} applied to ${target}, transitioning to phase: ${nextPhase}`);
    
    set({
      pokerCombatState: {
        ...state.pokerCombatState,
        phase: nextPhase,
        player: target === 'player' ? updatedTargetState : state.pokerCombatState.player,
        opponent: target === 'opponent' ? updatedTargetState : state.pokerCombatState.opponent,
        firstStrike: {
          ...state.pokerCombatState.firstStrike,
          completed: true
        }
      }
    });
    
    get().addLogEntry({
      id: `first_strike_${Date.now()}`,
      timestamp: Date.now(),
      type: 'attack',
      message: `First strike! ${target === 'player' ? 'Player' : 'Opponent'} takes ${damage} damage`
    });
  },

  completeMulligan: () => {
    const state = get();
    if (!state.pokerCombatState || state.mulliganComplete) return;
    
    let deck = [...state.pokerDeck];
    const playerHoleCards = [deck.pop()!, deck.pop()!];
    const opponentHoleCards = [deck.pop()!, deck.pop()!];
    
    set({
      pokerCombatState: {
        ...state.pokerCombatState,
        phase: PokerCombatPhase.SPELL_PET,
        player: {
          ...state.pokerCombatState.player,
          holeCards: playerHoleCards
        },
        opponent: {
          ...state.pokerCombatState.opponent,
          holeCards: opponentHoleCards
        }
      },
      pokerDeck: deck,
      mulliganComplete: true
    });
  },

  performPokerAction: (playerId: string, action: CombatAction, hpCommitment?: number) => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const newState = { ...state.pokerCombatState };
    const isPlayer = playerId === newState.player.playerId;
    const playerState = isPlayer ? newState.player : newState.opponent;
    
    playerState.currentAction = action;
    
    switch (action) {
      case CombatAction.ATTACK:
      case CombatAction.COUNTER_ATTACK:
        if (hpCommitment && hpCommitment > 0) {
          const availableHP = playerState.pet.stats.currentHealth;
          const actualBet = Math.min(hpCommitment, availableHP);
          playerState.hpCommitted += actualBet;
          playerState.pet.stats.currentHealth = Math.max(0, playerState.pet.stats.currentHealth - actualBet);
          newState.pot += actualBet;
          newState.currentBet = Math.max(newState.currentBet, playerState.hpCommitted);
          newState.preflopBetMade = true;
          if (!newState.blindsPosted) {
            newState.blindsPosted = true;
          }
        }
        break;
        
      case CombatAction.ENGAGE:
        const toMatch = Math.min(newState.currentBet - playerState.blindPosted, playerState.pet.stats.currentHealth);
        if (toMatch > 0) {
          playerState.hpCommitted += toMatch;
          playerState.blindPosted += toMatch;
          playerState.pet.stats.currentHealth = Math.max(0, playerState.pet.stats.currentHealth - toMatch);
          newState.pot += toMatch;
        }
        if (!newState.blindsPosted) {
          newState.blindsPosted = true;
        }
        break;
        
      case CombatAction.BRACE:
        const folderIsPlayer = playerId === newState.player.playerId;
        newState.foldWinner = folderIsPlayer ? 'opponent' : 'player';
        newState.phase = PokerCombatPhase.RESOLUTION;
        newState.player.isReady = true;
        newState.opponent.isReady = true;
        break;
        
      case CombatAction.DEFEND:
        playerState.pet.stats.currentStamina = Math.min(
          playerState.pet.stats.maxStamina,
          playerState.pet.stats.currentStamina + 1
        );
        break;
    }
    
    playerState.isReady = true;

    if (action === CombatAction.ATTACK || action === CombatAction.COUNTER_ATTACK) {
      const otherPlayer = isPlayer ? newState.opponent : newState.player;
      otherPlayer.isReady = false;
    }
    
    newState.actionHistory.push({
      action,
      hpCommitment: hpCommitment || 0,
      timestamp: Date.now()
    });
    
    set({ pokerCombatState: newState });
  },

  advancePokerPhase: () => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const combatState = state.pokerCombatState;
    let newPhase = combatState.phase;
    let newCommunityCards = { ...combatState.communityCards };
    let deck = [...state.pokerDeck];
    
    const resetReadyState = () => ({
      player: { ...combatState.player, isReady: false, currentAction: undefined },
      opponent: { ...combatState.opponent, isReady: false, currentAction: undefined }
    });
    
    switch (combatState.phase) {
      case PokerCombatPhase.MULLIGAN:
        newPhase = PokerCombatPhase.SPELL_PET;
        break;
      case PokerCombatPhase.SPELL_PET:
        newPhase = PokerCombatPhase.FAITH;
        const faithCards = [deck.pop()!, deck.pop()!, deck.pop()!];
        newCommunityCards.faith = faithCards;
        break;
      case PokerCombatPhase.FAITH:
        newPhase = PokerCombatPhase.FORESIGHT;
        const foresightCard = deck.pop()!;
        newCommunityCards.foresight = foresightCard;
        break;
      case PokerCombatPhase.FORESIGHT:
        newPhase = PokerCombatPhase.DESTINY;
        const destinyCard = deck.pop()!;
        newCommunityCards.destiny = destinyCard;
        break;
      case PokerCombatPhase.DESTINY:
        newPhase = PokerCombatPhase.RESOLUTION;
        break;
    }
    
    const { player: newPlayer, opponent: newOpponent } = resetReadyState();
    
    set({
      pokerDeck: deck,
      pokerCombatState: {
        ...combatState,
        phase: newPhase,
        communityCards: newCommunityCards,
        player: newPlayer,
        opponent: newOpponent,
        currentBet: 0
      }
    });
    
    get().addLogEntry({
      id: `phase_${Date.now()}`,
      timestamp: Date.now(),
      type: 'poker',
      message: `Poker phase advanced to ${newPhase}`
    });
  },

  resolvePokerCombat: (): CombatResolution | null => {
    const state = get();
    const combatState = state.pokerCombatState;
    
    if (!combatState) return null;
    
    const playerMaxHP = combatState.player.pet.stats.maxHealth;
    const opponentMaxHP = combatState.opponent.pet.stats.maxHealth;
    const playerCurrentHP = combatState.player.pet.stats.currentHealth;
    const opponentCurrentHP = combatState.opponent.pet.stats.currentHealth;
    const playerCommitted = combatState.player.hpCommitted;
    const opponentCommitted = combatState.opponent.hpCommitted;
    let playerFinalArmor = combatState.player.heroArmor || 0;
    let opponentFinalArmor = combatState.opponent.heroArmor || 0;
    
    if (combatState.foldWinner) {
      const winner = combatState.foldWinner;
      const loser = winner === 'player' ? 'opponent' : 'player';
      
      let playerFinalHealth = playerCurrentHP;
      let opponentFinalHealth = opponentCurrentHP;
      
      if (winner === 'player') {
        playerFinalHealth = Math.min(playerCurrentHP + playerCommitted, playerMaxHP);
      } else {
        opponentFinalHealth = Math.min(opponentCurrentHP + opponentCommitted, opponentMaxHP);
      }
      
      const loserCommitted = winner === 'player' ? opponentCommitted : playerCommitted;
      
      const emptyHand: EvaluatedHand = {
        rank: PokerHandRank.HIGH_CARD,
        cards: [],
        highCard: { suit: 'spades', value: 'A', numericValue: 14 },
        multiplier: HAND_DAMAGE_MULTIPLIERS[PokerHandRank.HIGH_CARD],
        displayName: 'Fold',
        tieBreakers: []
      };
      
      const resolution: CombatResolution = {
        winner,
        resolutionType: 'fold',
        playerHand: emptyHand,
        opponentHand: emptyHand,
        playerDamage: 0,
        opponentDamage: 0,
        playerFinalHealth: Math.max(0, playerFinalHealth),
        opponentFinalHealth: Math.max(0, opponentFinalHealth),
        foldPenalty: loserCommitted,
        whoFolded: loser
      };
      
      const currentState = get();
      if (!currentState.pokerCombatState) return resolution;
      
      set({
        pokerCombatState: {
          ...currentState.pokerCombatState,
          pot: 0,
          currentBet: 0,
          player: {
            ...currentState.pokerCombatState.player,
            hpCommitted: 0,
            blindPosted: 0,
            isReady: false,
            currentAction: undefined,
            pet: {
              ...currentState.pokerCombatState.player.pet,
              stats: {
                ...currentState.pokerCombatState.player.pet.stats,
                currentHealth: resolution.playerFinalHealth
              }
            }
          },
          opponent: {
            ...currentState.pokerCombatState.opponent,
            hpCommitted: 0,
            blindPosted: 0,
            isReady: false,
            currentAction: undefined,
            pet: {
              ...currentState.pokerCombatState.opponent.pet,
              stats: {
                ...currentState.pokerCombatState.opponent.pet.stats,
                currentHealth: resolution.opponentFinalHealth
              }
            }
          }
        }
      });
      
      get().addLogEntry({
        id: `poker_fold_${Date.now()}`,
        timestamp: Date.now(),
        type: 'poker',
        message: `${loser} folded - ${winner} recovers HP (${loserCommitted} HP lost by ${loser})`
      });
      
      return resolution;
    }
    
    const communityCards: PokerCard[] = [
      ...(combatState.communityCards.faith || []),
      ...(combatState.communityCards.foresight ? [combatState.communityCards.foresight] : []),
      ...(combatState.communityCards.destiny ? [combatState.communityCards.destiny] : [])
    ];
    
    const playerHand = evaluatePokerHand(combatState.player.holeCards, communityCards);
    const opponentHand = evaluatePokerHand(combatState.opponent.holeCards, communityCards);
    
    let winner: 'player' | 'opponent' | 'draw';
    if (playerHand.rank > opponentHand.rank) {
      winner = 'player';
    } else if (opponentHand.rank > playerHand.rank) {
      winner = 'opponent';
    } else {
      const tieResult = compareTieBreakers(playerHand.tieBreakers, opponentHand.tieBreakers);
      if (tieResult > 0) {
        winner = 'player';
      } else if (tieResult < 0) {
        winner = 'opponent';
      } else {
        winner = 'draw';
      }
    }
    
    const playerDamage = playerCommitted;
    const opponentDamage = opponentCommitted;
    
    let playerFinalHealth = playerCurrentHP;
    let opponentFinalHealth = opponentCurrentHP;
    
    const isCheckThrough = playerCommitted === 0 && opponentCommitted === 0;
    
    console.log('[UNIFIED HP RESOLUTION] Before calculation:', {
      winner,
      playerCurrentHP,
      opponentCurrentHP,
      playerCommitted,
      opponentCommitted,
      playerArmor: playerFinalArmor,
      opponentArmor: opponentFinalArmor,
      pot: combatState.pot,
      isCheckThrough,
      playerHandRank: playerHand.displayName,
      opponentHandRank: opponentHand.displayName
    });
    
    if (winner === 'player') {
      playerFinalHealth = Math.min(playerCurrentHP + playerCommitted, playerMaxHP);
      
      const opponentLoss = isCheckThrough ? 2 : opponentCommitted;
      if (opponentFinalArmor > 0 && opponentLoss > 0) {
        const armorRefund = Math.min(opponentFinalArmor, opponentLoss);
        opponentFinalArmor -= armorRefund;
        opponentFinalHealth = isCheckThrough 
          ? Math.max(0, opponentCurrentHP - (opponentLoss - armorRefund))
          : Math.min(opponentCurrentHP + armorRefund, opponentMaxHP);
      } else {
        opponentFinalHealth = isCheckThrough 
          ? Math.max(0, opponentCurrentHP - opponentLoss)
          : opponentCurrentHP;
      }
    } else if (winner === 'opponent') {
      opponentFinalHealth = Math.min(opponentCurrentHP + opponentCommitted, opponentMaxHP);
      
      const playerLoss = isCheckThrough ? 2 : playerCommitted;
      if (playerFinalArmor > 0 && playerLoss > 0) {
        const armorRefund = Math.min(playerFinalArmor, playerLoss);
        playerFinalArmor -= armorRefund;
        playerFinalHealth = isCheckThrough 
          ? Math.max(0, playerCurrentHP - (playerLoss - armorRefund))
          : Math.min(playerCurrentHP + armorRefund, playerMaxHP);
      } else {
        playerFinalHealth = isCheckThrough 
          ? Math.max(0, playerCurrentHP - playerLoss)
          : playerCurrentHP;
      }
    } else {
      playerFinalHealth = Math.min(playerCurrentHP + playerCommitted, playerMaxHP);
      opponentFinalHealth = Math.min(opponentCurrentHP + opponentCommitted, opponentMaxHP);
    }
    
    console.log('[UNIFIED HP RESOLUTION] After calculation:', {
      winner,
      playerFinalHealth,
      opponentFinalHealth,
      playerDamage,
      opponentDamage,
      playerFinalArmor,
      opponentFinalArmor
    });
    
    const resolution: CombatResolution = {
      winner,
      resolutionType: 'showdown',
      playerHand,
      opponentHand,
      playerDamage: winner === 'player' ? 0 : playerDamage,
      opponentDamage: winner === 'opponent' ? 0 : opponentDamage,
      playerFinalHealth: Math.max(0, playerFinalHealth),
      opponentFinalHealth: Math.max(0, opponentFinalHealth)
    };
    
    const stateForUpdate = get();
    if (stateForUpdate.pokerCombatState) {
      set({
        pokerCombatState: {
          ...stateForUpdate.pokerCombatState,
          winner,
          pot: 0,
          currentBet: 0,
          player: {
            ...stateForUpdate.pokerCombatState.player,
            hpCommitted: 0,
            blindPosted: 0,
            isReady: false,
            currentAction: undefined,
            heroArmor: playerFinalArmor,
            pet: {
              ...stateForUpdate.pokerCombatState.player.pet,
              stats: {
                ...stateForUpdate.pokerCombatState.player.pet.stats,
                currentHealth: resolution.playerFinalHealth
              }
            }
          },
          opponent: {
            ...stateForUpdate.pokerCombatState.opponent,
            hpCommitted: 0,
            blindPosted: 0,
            isReady: false,
            currentAction: undefined,
            heroArmor: opponentFinalArmor,
            pet: {
              ...stateForUpdate.pokerCombatState.opponent.pet,
              stats: {
                ...stateForUpdate.pokerCombatState.opponent.pet.stats,
                currentHealth: resolution.opponentFinalHealth
              }
            }
          }
        }
      });
    }
    
    get().addLogEntry({
      id: `poker_showdown_${Date.now()}`,
      timestamp: Date.now(),
      type: 'poker',
      message: `Showdown: ${winner === 'draw' ? 'Draw' : winner + ' wins'} - Player: ${playerHand.displayName}, Opponent: ${opponentHand.displayName}`
    });
    
    return resolution;
  },

  endPokerCombat: () => {
    set({
      pokerCombatState: null,
      pokerDeck: [],
      pokerIsActive: false,
      mulliganComplete: false,
      isTransitioningHand: false,
      combatPhase: 'CHESS_MOVEMENT'
    });
    
    get().addLogEntry({
      id: `poker_end_${Date.now()}`,
      timestamp: Date.now(),
      type: 'poker',
      message: 'Poker combat ended'
    });
  },

  drawPokerCards: (count: number): PokerCard[] => {
    const state = get();
    let deck = [...state.pokerDeck];
    
    if (deck.length < count) {
      deck = shuffleDeck(createPokerDeck());
    }
    
    const drawnCards: PokerCard[] = [];
    for (let i = 0; i < count; i++) {
      const card = deck.pop();
      if (card) drawnCards.push(card);
    }
    
    set({ pokerDeck: deck });
    return drawnCards;
  },

  updatePokerTimer: (newTime: number) => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    set({
      pokerCombatState: {
        ...state.pokerCombatState,
        turnTimer: newTime
      }
    });
  },

  setPlayerReady: (playerId: string) => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const newState = { ...state.pokerCombatState };
    const isPlayer = playerId === newState.player.playerId;
    
    if (isPlayer) {
      newState.player.isReady = true;
    } else {
      newState.opponent.isReady = true;
    }
    
    set({ pokerCombatState: newState });
  },

  healPlayerHero: (amount: number) => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const currentHealth = state.pokerCombatState.player.pet.stats.currentHealth;
    const maxHealth = state.pokerCombatState.player.pet.stats.maxHealth;
    const newHealth = Math.min(currentHealth + amount, maxHealth);
    
    set({
      pokerCombatState: {
        ...state.pokerCombatState,
        player: {
          ...state.pokerCombatState.player,
          pet: {
            ...state.pokerCombatState.player.pet,
            stats: {
              ...state.pokerCombatState.player.pet.stats,
              currentHealth: newHealth
            }
          }
        }
      }
    });
  },

  healOpponentHero: (amount: number) => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const currentHealth = state.pokerCombatState.opponent.pet.stats.currentHealth;
    const maxHealth = state.pokerCombatState.opponent.pet.stats.maxHealth;
    const newHealth = Math.min(currentHealth + amount, maxHealth);
    
    set({
      pokerCombatState: {
        ...state.pokerCombatState,
        opponent: {
          ...state.pokerCombatState.opponent,
          pet: {
            ...state.pokerCombatState.opponent.pet,
            stats: {
              ...state.pokerCombatState.opponent.pet.stats,
              currentHealth: newHealth
            }
          }
        }
      }
    });
  },

  setPlayerHeroBuffs: (buffs: { attack?: number; health?: number; armor?: number }) => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const playerPet = state.pokerCombatState.player.pet;
    const newStats = { ...playerPet.stats };
    const currentArmor = state.pokerCombatState.player.heroArmor || 0;
    
    if (buffs.attack !== undefined) {
      newStats.attack += buffs.attack;
    }
    if (buffs.health !== undefined) {
      newStats.maxHealth += buffs.health;
      newStats.currentHealth += buffs.health;
    }
    
    const newArmor = buffs.armor !== undefined ? currentArmor + buffs.armor : currentArmor;
    
    set({
      pokerCombatState: {
        ...state.pokerCombatState,
        player: {
          ...state.pokerCombatState.player,
          heroArmor: newArmor,
          pet: {
            ...playerPet,
            stats: newStats
          }
        }
      }
    });
  },

  addPlayerArmor: (amount: number) => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const currentArmor = state.pokerCombatState.player.heroArmor || 0;
    
    set({
      pokerCombatState: {
        ...state.pokerCombatState,
        player: {
          ...state.pokerCombatState.player,
          heroArmor: currentArmor + amount
        }
      }
    });
  },

  markBothPlayersReady: () => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    set({
      pokerCombatState: {
        ...state.pokerCombatState,
        player: {
          ...state.pokerCombatState.player,
          isReady: true
        },
        opponent: {
          ...state.pokerCombatState.opponent,
          isReady: true
        }
      }
    });
  },

  startNextHand: (resolution?: CombatResolution) => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const playerFinalHP = resolution?.playerFinalHealth ?? state.pokerCombatState.player.pet.stats.currentHealth;
    const opponentFinalHP = resolution?.opponentFinalHealth ?? state.pokerCombatState.opponent.pet.stats.currentHealth;
    
    if (playerFinalHP <= 0 || opponentFinalHP <= 0) {
      return;
    }
    
    let newDeck = [...state.pokerDeck];
    if (newDeck.length < 15) {
      newDeck = shuffleDeck(createPokerDeck());
    }
    
    const playerHoleCards = [newDeck.pop()!, newDeck.pop()!];
    const opponentHoleCards = [newDeck.pop()!, newDeck.pop()!];
    
    const STAMINA_REGEN_PER_HAND = 1;
    const playerNewStamina = Math.min(
      state.pokerCombatState.player.pet.stats.maxStamina,
      state.pokerCombatState.player.pet.stats.currentStamina + STAMINA_REGEN_PER_HAND
    );
    const opponentNewStamina = Math.min(
      state.pokerCombatState.opponent.pet.stats.maxStamina,
      state.pokerCombatState.opponent.pet.stats.currentStamina + STAMINA_REGEN_PER_HAND
    );
    
    const newPlayerPosition: PokerPosition = state.pokerCombatState.playerPosition === 'small_blind' ? 'big_blind' : 'small_blind';
    const newOpponentPosition: PokerPosition = state.pokerCombatState.opponentPosition === 'small_blind' ? 'big_blind' : 'small_blind';
    const newOpenerIsPlayer = newPlayerPosition === 'small_blind';
    
    set({
      pokerDeck: newDeck,
      isTransitioningHand: false,
      pokerCombatState: {
        ...state.pokerCombatState,
        phase: PokerCombatPhase.SPELL_PET,
        pot: 0,
        currentBet: 0,
        turnTimer: state.pokerCombatState.maxTurnTime,
        actionHistory: [],
        foldWinner: undefined,
        winner: undefined,
        preflopBetMade: false,
        blindsPosted: false,
        isAllInShowdown: false,
        communityCards: { faith: [] },
        playerPosition: newPlayerPosition,
        opponentPosition: newOpponentPosition,
        openerIsPlayer: newOpenerIsPlayer,
        player: {
          ...state.pokerCombatState.player,
          holeCards: playerHoleCards,
          hpCommitted: 0,
          blindPosted: 0,
          preBlindHealth: playerFinalHP,
          isReady: false,
          currentAction: undefined,
          pet: {
            ...state.pokerCombatState.player.pet,
            stats: {
              ...state.pokerCombatState.player.pet.stats,
              currentHealth: playerFinalHP,
              currentStamina: playerNewStamina
            }
          }
        },
        opponent: {
          ...state.pokerCombatState.opponent,
          holeCards: opponentHoleCards,
          hpCommitted: 0,
          blindPosted: 0,
          preBlindHealth: opponentFinalHP,
          isReady: false,
          currentAction: undefined,
          pet: {
            ...state.pokerCombatState.opponent.pet,
            stats: {
              ...state.pokerCombatState.opponent.pet.stats,
              currentHealth: opponentFinalHP,
              currentStamina: opponentNewStamina
            }
          }
        }
      }
    });
  },

  startNextHandDelayed: (resolution: CombatResolution) => {
    const state = get();
    if (state.isTransitioningHand) return;
    
    set({ isTransitioningHand: true });
    
    setTimeout(() => {
      get().startNextHand(resolution);
    }, 2000);
  },

  maybeCloseBettingRound: () => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const combatState = state.pokerCombatState;
    
    if (combatState.phase === PokerCombatPhase.RESOLUTION) {
      return;
    }
    
    if (combatState.foldWinner) {
      return;
    }
    
    if (!combatState.player.isReady || !combatState.opponent.isReady) {
      return;
    }
    
    if (combatState.phase === PokerCombatPhase.SPELL_PET) {
      get().advancePokerPhase();
      return;
    }
    
    const currentBet = combatState.currentBet;
    const playerHP = combatState.player.hpCommitted;
    const opponentHP = combatState.opponent.hpCommitted;
    const playerAvailableHP = combatState.player.pet.stats.currentHealth;
    const opponentAvailableHP = combatState.opponent.pet.stats.currentHealth;
    const playerAllIn = playerAvailableHP <= 0;
    const opponentAllIn = opponentAvailableHP <= 0;
    
    const bothCheckedThisRound = currentBet === 0;
    
    const playerMatchedBet = playerHP >= currentBet || playerAllIn;
    const opponentMatchedBet = opponentHP >= currentBet || opponentAllIn;
    
    const betsMatched = currentBet > 0 
      ? (playerMatchedBet && opponentMatchedBet && (playerHP === opponentHP || playerAllIn || opponentAllIn))
      : true;
    
    const betsSettled = bothCheckedThisRound || betsMatched;
    
    if (!betsSettled) {
      return;
    }
    
    const bothAllIn = playerAllIn && opponentAllIn;
    if (bothAllIn && !combatState.isAllInShowdown) {
      set({
        pokerCombatState: {
          ...combatState,
          isAllInShowdown: true
        }
      });
    }
    
    get().advancePokerPhase();
  },

  applyDirectDamage: (targetPlayerId: 'player' | 'opponent', damage: number, sourceDescription?: string) => {
    const state = get();
    if (!state.pokerCombatState) return;
    
    const isPlayer = targetPlayerId === 'player';
    const target = isPlayer ? state.pokerCombatState.player : state.pokerCombatState.opponent;
    
    const newHealth = Math.max(0, target.pet.stats.currentHealth - damage);
    
    get().addLogEntry({
      id: `damage_${Date.now()}`,
      timestamp: Date.now(),
      type: 'damage',
      message: `${sourceDescription || 'Attack'} dealt ${damage} damage to ${target.playerName}`
    });
    
    if (isPlayer) {
      set({
        pokerCombatState: {
          ...state.pokerCombatState,
          player: {
            ...state.pokerCombatState.player,
            pet: {
              ...state.pokerCombatState.player.pet,
              stats: {
                ...state.pokerCombatState.player.pet.stats,
                currentHealth: newHealth
              }
            }
          }
        }
      });
    } else {
      set({
        pokerCombatState: {
          ...state.pokerCombatState,
          opponent: {
            ...state.pokerCombatState.opponent,
            pet: {
              ...state.pokerCombatState.opponent.pet,
              stats: {
                ...state.pokerCombatState.opponent.pet.stats,
                currentHealth: newHealth
              }
            }
          }
        }
      });
    }
  },
});
