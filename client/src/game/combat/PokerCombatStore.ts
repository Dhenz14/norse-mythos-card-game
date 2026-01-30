/**
 * PokerCombatStore.ts
 * 
 * Zustand store for managing the poker-inspired combat system.
 * Handles the Faith/Foresight/Destiny phases and combat actions.
 */

import { create } from 'zustand';
import { logActivity } from '../stores/activityLogStore';
import { scheduleShuffleEffect } from '../animations/UnifiedAnimationOrchestrator';
import { getKingPetBuffs } from '../utils/kingPassiveUtils';
import { initializeNorseContext, resetNorseContext } from '../utils/norseIntegration';
import { useSharedDeckStore } from '../stores/sharedDeckStore';
import {
  PokerCombatState,
  CombatPhase,
  CombatAction,
  CombatActionDetails,
  PokerCard,
  PlayerCombatState,
  CommunityCards,
  EvaluatedHand,
  CombatResolution,
  PokerHandRank,
  HAND_DAMAGE_MULTIPLIERS,
  HAND_RANK_NAMES,
  getElementalAdvantage,
  createPokerDeck,
  shuffleDeck,
  PetData,
  DEFAULT_PET_STATS,
  StatusEffect,
  StatusEffectType,
  BlindConfig,
  DEFAULT_BLIND_CONFIG,
  PokerPosition
} from '../types/PokerCombatTypes';

// Stamina costs per action type
// RULE: AGGRESSIVE actions (bet/raise) AND FOLD cost stamina
// Blinds, calls, and checks are FREE
const STAMINA_COSTS: Record<CombatAction, number> = {
  [CombatAction.ATTACK]: 0,        // Base cost 0 - actual cost calculated from bet/raise amount
  [CombatAction.COUNTER_ATTACK]: 0, // Base cost 0 - actual cost calculated from raise amount  
  [CombatAction.ENGAGE]: 0,        // Call is FREE
  [CombatAction.BRACE]: 1,         // Fold costs 1 stamina (BRACE = fold action)
  [CombatAction.DEFEND]: 0         // Check is FREE (DEFEND = check action)
};

/** @deprecated Critical strike system removed for simplicity */
// const BASE_CRITICAL_CHANCE = 0.05; // 5%

// Stamina regeneration per phase - DISABLED (only gain +1 on CHECK action)
const STAMINA_REGEN_PER_PHASE = 0;

/**
 * Collect forced bets (blinds + antes) at the start of combat.
 * Called by initializeCombat (when skipMulligan=true) or completeMulligan.
 * 
 * Standard poker structure:
 * - BB: 10 HP
 * - SB: 5 HP  
 * - Ante: 0.5 HP from each player
 * 
 * SB total forced = 5.5 HP (5 + 0.5)
 * BB total forced = 10.5 HP (10 + 0.5)
 * Pot starts at 16 HP
 * Current bet = 10 (the big blind - what SB must call to)
 */
function collectForcedBets(state: PokerCombatState): PokerCombatState {
  if (state.blindsPosted) {
    return state;
  }
  
  const { blindConfig, playerPosition, opponentPosition } = state;
  const { bigBlind, smallBlind, ante } = blindConfig;
  
  // Determine who is SB and BB
  const playerIsSB = playerPosition === 'small_blind';
  const playerIsBB = playerPosition === 'big_blind';
  
  // Calculate forced contributions
  const playerForced = (playerIsSB ? smallBlind : bigBlind) + ante;
  const opponentForced = (playerIsSB ? bigBlind : smallBlind) + ante;
  
  
  // Create updated state with forced bets applied
  const newState = { ...state };
  
  // Apply forced bets as HP committed
  // Track blind amount separately from total committed (for call calculation)
  const playerBlind = playerIsSB ? smallBlind : bigBlind;
  const opponentBlind = playerIsSB ? bigBlind : smallBlind;
  
  // IMMEDIATELY deduct HP when posting blinds/antes (like real poker chips)
  // Clamp to prevent negative HP
  const playerNewHP = Math.max(0, state.player.pet.stats.currentHealth - playerForced);
  const opponentNewHP = Math.max(0, state.opponent.pet.stats.currentHealth - opponentForced);
  
  newState.player = {
    ...state.player,
    hpCommitted: playerForced,
    blindPosted: playerBlind,
    pet: {
      ...state.player.pet,
      stats: {
        ...state.player.pet.stats,
        currentHealth: playerNewHP
      }
    }
  };
  newState.opponent = {
    ...state.opponent,
    hpCommitted: opponentForced,
    blindPosted: opponentBlind,
    pet: {
      ...state.opponent.pet,
      stats: {
        ...state.opponent.pet.stats,
        currentHealth: opponentNewHP
      }
    }
  };
  
  
  // Set pot to total forced bets
  newState.pot = playerForced + opponentForced;
  
  // Current bet = big blind only (SB must call to match BB, not BB+ante)
  newState.currentBet = bigBlind;
  
  // Mark blinds as posted
  newState.blindsPosted = true;
  
  
  return newState;
}

// Phase progression order - strict sequential advancement
const PHASE_ORDER: CombatPhase[] = [
  CombatPhase.SPELL_PET,
  CombatPhase.FAITH,
  CombatPhase.FORESIGHT,
  CombatPhase.DESTINY,
  CombatPhase.RESOLUTION
];

/**
 * Get the next phase in the strict sequence
 */
function getNextPhase(currentPhase: CombatPhase): CombatPhase | null {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
    return null;
  }
  return PHASE_ORDER[currentIndex + 1];
}

// Status effect damage/healing values
const POISON_DAMAGE_PERCENT = 0.03; // 3% max HP per turn
const BURNING_DAMAGE_PERCENT = 0.05; // 5% max HP per turn
const BLESSED_HEAL_PERCENT = 0.02; // 2% max HP regeneration

/**
 * Process status effects for a player, applying damage/healing and decrementing durations
 */
function processStatusEffects(playerState: PlayerCombatState): { 
  damageDealt: number; 
  healingDone: number;
  isStunned: boolean;
  updatedEffects: StatusEffect[];
} {
  let damageDealt = 0;
  let healingDone = 0;
  let isStunned = false;
  const updatedEffects: StatusEffect[] = [];
  
  for (const effect of playerState.statusEffects) {
    switch (effect.type) {
      case 'poisoned':
        const poisonDmg = Math.floor(playerState.pet.stats.maxHealth * POISON_DAMAGE_PERCENT);
        damageDealt += poisonDmg;
        break;
        
      case 'burning':
        const burnDmg = Math.floor(playerState.pet.stats.maxHealth * BURNING_DAMAGE_PERCENT);
        damageDealt += burnDmg;
        break;
        
      case 'blessed':
        const healAmount = Math.floor(playerState.pet.stats.maxHealth * BLESSED_HEAL_PERCENT);
        healingDone += healAmount;
        break;
        
      case 'frozen':
        isStunned = true;
        break;
    }
    
    // Decrement duration and keep if still active
    const newDuration = effect.duration - 1;
    if (newDuration > 0) {
      updatedEffects.push({ ...effect, duration: newDuration });
    } else {
    }
  }
  
  return { damageDealt, healingDone, isStunned, updatedEffects };
}

// Elemental advantage buff: FLAT +2 attack and +2 health (as discussed with user)
// Poker is unaffected - only chess piece/pet stats get buffed
const ELEMENTAL_ATTACK_BUFF = 2;
const ELEMENTAL_HEALTH_BUFF = 2;

// Elemental advantage grants +20 armor to hero (like Hearthstone armor)
// Armor absorbs damage before HP is reduced
const ELEMENTAL_ARMOR_BONUS = 20;

/**
 * Apply damage to a player with armor absorption (Hearthstone-style).
 * Armor absorbs damage first before HP is reduced.
 * Returns the updated armor and HP values.
 * 
 * IMPORTANT: This is used for FINAL damage (losing a hand, fold penalty, ability damage)
 * NOT for betting/committing HP to pot (that bypasses armor).
 */
function applyDamageWithArmor(
  currentArmor: number,
  currentHP: number,
  damage: number
): { newArmor: number; newHP: number; armorAbsorbed: number; hpLost: number } {
  if (damage <= 0) {
    return { newArmor: currentArmor, newHP: currentHP, armorAbsorbed: 0, hpLost: 0 };
  }
  
  let remainingDamage = damage;
  let armorAbsorbed = 0;
  let hpLost = 0;
  let newArmor = currentArmor;
  let newHP = currentHP;
  
  // Armor absorbs damage first
  if (newArmor > 0) {
    if (newArmor >= remainingDamage) {
      armorAbsorbed = remainingDamage;
      newArmor -= remainingDamage;
      remainingDamage = 0;
    } else {
      armorAbsorbed = newArmor;
      remainingDamage -= newArmor;
      newArmor = 0;
    }
  }
  
  // Remaining damage goes to HP
  if (remainingDamage > 0) {
    hpLost = Math.min(remainingDamage, newHP);
    newHP = Math.max(0, newHP - remainingDamage);
  }
  
  if (armorAbsorbed > 0) {
  }
  
  return { newArmor, newHP, armorAbsorbed, hpLost };
}

/**
 * Apply elemental advantage buffs to pets at combat start.
 * If a pet has elemental advantage (e.g., Fire vs Earth), they receive:
 * - +2 Attack to pet
 * - +2 Health to pet
 * - +20 Armor to hero (absorbs damage before HP, like Hearthstone)
 * This is a pre-match buff applied once at initialization.
 * Poker hand evaluation is UNAFFECTED - only the chess piece base stats get buffed.
 */
function applyElementalPetBuffs(playerPet: PetData, opponentPet: PetData): { 
  buffedPlayerPet: PetData; 
  buffedOpponentPet: PetData;
  playerHeroArmor: number;
  opponentHeroArmor: number;
} {
  const playerElement = playerPet.stats.element;
  const opponentElement = opponentPet.stats.element;
  
  const playerAdvantage = getElementalAdvantage(playerElement, opponentElement);
  const opponentAdvantage = getElementalAdvantage(opponentElement, playerElement);
  
  // Clone pets to avoid mutating originals
  const buffedPlayerPet: PetData = JSON.parse(JSON.stringify(playerPet));
  const buffedOpponentPet: PetData = JSON.parse(JSON.stringify(opponentPet));
  
  // Track armor bonuses
  let playerHeroArmor = 0;
  let opponentHeroArmor = 0;
  
  // Apply FLAT +2/+2 buff to player if they have advantage + armor bonus
  if (playerAdvantage === 'strong') {
    buffedPlayerPet.stats.attack += ELEMENTAL_ATTACK_BUFF;
    buffedPlayerPet.stats.maxHealth += ELEMENTAL_HEALTH_BUFF;
    buffedPlayerPet.stats.currentHealth += ELEMENTAL_HEALTH_BUFF;
    playerHeroArmor = ELEMENTAL_ARMOR_BONUS;
  }
  
  // Apply FLAT +2/+2 buff to opponent if they have advantage + armor bonus
  if (opponentAdvantage === 'strong') {
    buffedOpponentPet.stats.attack += ELEMENTAL_ATTACK_BUFF;
    buffedOpponentPet.stats.maxHealth += ELEMENTAL_HEALTH_BUFF;
    buffedOpponentPet.stats.currentHealth += ELEMENTAL_HEALTH_BUFF;
    opponentHeroArmor = ELEMENTAL_ARMOR_BONUS;
  }
  
  if (playerAdvantage === 'neutral' && opponentAdvantage === 'neutral') {
  }
  
  return { buffedPlayerPet, buffedOpponentPet, playerHeroArmor, opponentHeroArmor };
}

/**
 * Apply King passive aura buffs to pets at combat start.
 * Kings provide army-wide stat bonuses that apply to all their heroes.
 * Returns buffed pets AND additional hero armor from king passives.
 */
function applyKingPetBuffs(
  playerPet: PetData, 
  opponentPet: PetData,
  playerKingId?: string,
  opponentKingId?: string
): { 
  buffedPlayerPet: PetData; 
  buffedOpponentPet: PetData;
  playerKingArmor: number;
  opponentKingArmor: number;
} {
  const buffedPlayerPet: PetData = JSON.parse(JSON.stringify(playerPet));
  const buffedOpponentPet: PetData = JSON.parse(JSON.stringify(opponentPet));
  let playerKingArmor = 0;
  let opponentKingArmor = 0;
  
  if (playerKingId) {
    const playerKingBuffs = getKingPetBuffs(playerKingId);
    buffedPlayerPet.stats.attack += playerKingBuffs.attackBonus;
    buffedPlayerPet.stats.maxHealth += playerKingBuffs.healthBonus;
    buffedPlayerPet.stats.currentHealth += playerKingBuffs.healthBonus;
    playerKingArmor = playerKingBuffs.armorBonus;
    
    if (playerKingBuffs.enemyAttackDebuff > 0) {
      const newAttack = Math.max(0, buffedOpponentPet.stats.attack - playerKingBuffs.enemyAttackDebuff);
      buffedOpponentPet.stats.attack = newAttack;
    }
    
  }
  
  if (opponentKingId) {
    const opponentKingBuffs = getKingPetBuffs(opponentKingId);
    buffedOpponentPet.stats.attack += opponentKingBuffs.attackBonus;
    buffedOpponentPet.stats.maxHealth += opponentKingBuffs.healthBonus;
    buffedOpponentPet.stats.currentHealth += opponentKingBuffs.healthBonus;
    opponentKingArmor = opponentKingBuffs.armorBonus;
    
    if (opponentKingBuffs.enemyAttackDebuff > 0) {
      const newAttack = Math.max(0, buffedPlayerPet.stats.attack - opponentKingBuffs.enemyAttackDebuff);
      buffedPlayerPet.stats.attack = newAttack;
    }
    
  }
  
  return { buffedPlayerPet, buffedOpponentPet, playerKingArmor, opponentKingArmor };
}

/**
 * Apply a status effect to a player
 */
function applyStatusEffect(
  playerState: PlayerCombatState, 
  effectType: StatusEffectType, 
  duration: number, 
  value?: number,
  sourceId: string = 'combat'
): StatusEffect[] {
  // Check if effect already exists - refresh duration if so
  const existingIndex = playerState.statusEffects.findIndex(e => e.type === effectType);
  
  const newEffect: StatusEffect = {
    type: effectType,
    duration,
    value,
    sourceId
  };
  
  if (existingIndex >= 0) {
    // Refresh existing effect with new duration
    const updated = [...playerState.statusEffects];
    updated[existingIndex] = newEffect;
    return updated;
  } else {
    // Add new effect
    return [...playerState.statusEffects, newEffect];
  }
}

interface PokerCombatStore {
  combatState: PokerCombatState | null;
  deck: PokerCard[];
  isActive: boolean;
  mulliganComplete: boolean;
  isTransitioningHand: boolean; // Prevents re-entrant startNextHand calls during transition delay
  transitionTimerId: ReturnType<typeof setTimeout> | null; // Timer ID for clearing on endCombat
  
  initializeCombat: (playerId: string, playerName: string, playerPet: PetData, opponentId: string, opponentName: string, opponentPet: PetData, skipMulligan?: boolean, playerKingId?: string, opponentKingId?: string) => void;
  completeMulligan: () => void;
  performAction: (playerId: string, action: CombatAction, hpCommitment?: number) => void;
  setPlayerReady: (playerId: string) => void; // Mark player as ready during SPELL_PET phase
  maybeCloseBettingRound: () => void; // Check if betting round can be closed and advance phase if so
  advancePhase: () => void;
  evaluateHand: (holeCards: PokerCard[], communityCards: PokerCard[]) => EvaluatedHand;
  resolveCombat: () => CombatResolution | null;
  startNextHandDelayed: (resolution: CombatResolution) => void; // Start new hand after 2s delay (resolution required)
  startNextHand: (resolution?: CombatResolution) => void; // Start new hand immediately (internal use)
  endCombat: () => void;
  updateTimer: (newTime: number) => void;
  drawCards: (count: number) => PokerCard[];
  usePetAbility: (playerId: string, abilityId: string, targetId?: string) => boolean;
  applyStatusEffect: (targetPlayerId: string, effectType: StatusEffectType, duration: number, value?: number) => void;
  applyDirectDamage: (targetPlayerId: 'player' | 'opponent', damage: number, sourceDescription?: string) => void;
}

const evaluatePokerHand = (cards: PokerCard[]): EvaluatedHand => {
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
  
  // Get values sorted by count (for pairs/trips) then by value
  const valuesByCount = Object.entries(valueCounts)
    .map(([val, cnt]) => ({ value: parseInt(val), count: cnt }))
    .sort((a, b) => b.count - a.count || b.value - a.value);
  
  let rank: PokerHandRank;
  let tieBreakers: number[] = [];
  
  if (isFlush && isStraight && values[0] === 14 && values[4] === 10) {
    rank = PokerHandRank.RAGNAROK;
    tieBreakers = [14]; // Royal flush - all equal, but still needs value
  } else if (isFlush && isStraight) {
    rank = PokerHandRank.DIVINE_ALIGNMENT;
    tieBreakers = [isWheelStraight ? 5 : values[0]]; // Wheel straight = 5-high
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
    tieBreakers = values; // All 5 cards in order
  } else if (isStraight) {
    rank = PokerHandRank.FATES_PATH;
    tieBreakers = [isWheelStraight ? 5 : values[0]]; // Wheel straight = 5-high
  } else if (counts[0] === 3) {
    rank = PokerHandRank.THORS_HAMMER;
    const tripVal = valuesByCount[0].value;
    const kickers = valuesByCount.slice(1).map(v => v.value).sort((a, b) => b - a);
    tieBreakers = [tripVal, ...kickers];
  } else if (counts[0] === 2 && counts[1] === 2) {
    rank = PokerHandRank.DUAL_RUNES;
    // Two pair: get both pair values and the kicker
    const pairs = valuesByCount.filter(v => v.count === 2).map(v => v.value).sort((a, b) => b - a);
    const kicker = valuesByCount.find(v => v.count === 1)?.value || 0;
    tieBreakers = [pairs[0], pairs[1], kicker]; // [highPair, lowPair, kicker]
  } else if (counts[0] === 2) {
    rank = PokerHandRank.RUNE_MARK;
    const pairVal = valuesByCount[0].value;
    const kickers = valuesByCount.slice(1).map(v => v.value).sort((a, b) => b - a);
    tieBreakers = [pairVal, ...kickers];
  } else {
    rank = PokerHandRank.HIGH_CARD;
    tieBreakers = values; // All 5 cards in order
  }
  
  return {
    rank,
    cards: sorted,
    highCard: sorted[0],
    multiplier: HAND_DAMAGE_MULTIPLIERS[rank],
    displayName: HAND_RANK_NAMES[rank],
    tieBreakers
  };
};

export const usePokerCombatStore = create<PokerCombatStore>((set, get) => ({
  combatState: null,
  deck: [],
  isActive: false,
  mulliganComplete: false,
  isTransitioningHand: false,
  transitionTimerId: null,
  
  initializeCombat: (playerId, playerName, playerPet, opponentId, opponentName, opponentPet, skipMulligan = false, playerKingId?: string, opponentKingId?: string) => {
    let deck = shuffleDeck(createPokerDeck());
    
    
    // Initialize Norse context for King/Hero passive system
    // This enables the norseIntegration module to track active kings and heroes
    initializeNorseContext(
      playerKingId || null,
      opponentKingId || null,
      playerPet.norseHeroId || null,
      opponentPet.norseHeroId || null
    );
    
    // Apply elemental advantage buffs to pets at combat start
    // If a pet has elemental advantage, they get +2 attack, +2 health, and +20 hero armor
    // This replaces the old per-damage elemental modifier system
    const { buffedPlayerPet: elementBuffedPlayer, buffedOpponentPet: elementBuffedOpponent, playerHeroArmor, opponentHeroArmor } = applyElementalPetBuffs(playerPet, opponentPet);
    
    // Apply King passive aura buffs on top of elemental buffs
    // Kings provide army-wide stat bonuses to all their heroes
    const { buffedPlayerPet: kingBuffedPlayer, buffedOpponentPet: kingBuffedOpponent, playerKingArmor, opponentKingArmor } = applyKingPetBuffs(
      elementBuffedPlayer, 
      elementBuffedOpponent, 
      playerKingId, 
      opponentKingId
    );
    
    // Combine armor from elemental advantage and king passives
    const totalPlayerArmor = playerHeroArmor + playerKingArmor;
    const totalOpponentArmor = opponentHeroArmor + opponentKingArmor;
    
    // If mulligan is already complete (once per game), deal hole cards immediately
    // Otherwise wait for mulligan to complete
    let playerHoleCards: PokerCard[] = [];
    let opponentHoleCards: PokerCard[] = [];
    
    if (skipMulligan) {
      // Mulligan already happened - deal poker cards immediately
      playerHoleCards = [deck.pop()!, deck.pop()!];
      opponentHoleCards = [deck.pop()!, deck.pop()!];
    }
    
    const playerCombatState: PlayerCombatState = {
      playerId,
      playerName,
      pet: kingBuffedPlayer, // Use buffed pet with elemental + king auras applied
      holeCards: playerHoleCards, // Empty if waiting for mulligan, dealt if skipping
      hpCommitted: 0,
      blindPosted: 0,
      preBlindHealth: kingBuffedPlayer.stats.currentHealth, // Track original HP for proper chess persistence
      heroArmor: totalPlayerArmor, // Combined armor from elemental advantage + king passives
      statusEffects: [],
      mana: 1,
      maxMana: 9,
      isReady: false
    };
    
    const opponentCombatState: PlayerCombatState = {
      playerId: opponentId,
      playerName: opponentName,
      pet: kingBuffedOpponent, // Use buffed pet with elemental + king auras applied
      holeCards: opponentHoleCards, // Empty if waiting for mulligan, dealt if skipping
      hpCommitted: 0,
      blindPosted: 0,
      preBlindHealth: kingBuffedOpponent.stats.currentHealth, // Track original HP for proper chess persistence
      heroArmor: totalOpponentArmor, // Combined armor from elemental advantage + king passives
      statusEffects: [],
      mana: 1,
      maxMana: 9,
      isReady: false
    };
    
    // Start in MULLIGAN phase if not skipping, otherwise go straight to SPELL_PET
    const startingPhase = skipMulligan ? CombatPhase.SPELL_PET : CombatPhase.MULLIGAN;
    
    // Standard poker blinds/antes with rotating positions
    // BB = 5, SB = 2.5, Ante = 0.5 each
    // 
    // CHESS ATTACK RULE: Attacker (player) ALWAYS acts first on hand 1
    // This means player is small blind (SB acts first in heads-up poker)
    // After hand 1, positions rotate normally like standard poker
    // 
    // NOTE: In chess-initiated combat, "player" = attacker, "opponent" = defender.
    // This is guaranteed by RagnarokChessGame.tsx which always passes attacker first.
    const playerPosition: PokerPosition = 'small_blind';  // Attacker acts first
    const opponentPosition: PokerPosition = 'big_blind';  // Defender acts second
    
    // Single source of truth: SB always acts first, derive opener from position
    const openerIsPlayer = playerPosition === 'small_blind';
    const minBet = DEFAULT_BLIND_CONFIG.bigBlind; // Min bet = BB (10 HP)
    
    
    const combatState: PokerCombatState = {
      combatId: `combat_${Date.now()}`,
      phase: startingPhase,
      player: playerCombatState,
      opponent: opponentCombatState,
      communityCards: { faith: [] },
      currentBet: 0,  // Will be set to BB after blinds posted
      pot: 0,         // Will be populated after blinds/antes collected
      turnTimer: 40,
      maxTurnTime: 40,
      actionHistory: [],
      minBet,
      openerIsPlayer,
      preflopBetMade: false,  // True once someone raises beyond BB
      
      // Blind/Ante configuration
      blindConfig: DEFAULT_BLIND_CONFIG,
      playerPosition,
      opponentPosition,
      blindsPosted: false,  // Blinds collected at combat start (initializeCombat or completeMulligan)
      isAllInShowdown: false  // Set true when both players have no HP left to bet
    };
    
    // If skipping mulligan, collect blinds immediately so SB can see "Call" option
    let finalCombatState = combatState;
    if (skipMulligan) {
      finalCombatState = collectForcedBets(combatState);
    }
    
    set({ combatState: finalCombatState, deck, isActive: true, mulliganComplete: skipMulligan });
    
    if (skipMulligan) {
      scheduleShuffleEffect(playerName, 10);
    }
  },
  
  completeMulligan: () => {
    const { deck, combatState, mulliganComplete } = get();
    
    // Guard against double-calling
    if (mulliganComplete) {
      return;
    }
    
    if (!combatState || combatState.phase !== CombatPhase.MULLIGAN) {
      return;
    }
    
    const newDeck = [...deck];
    
    // NOW deal hole cards after mulligan is complete
    const playerHoleCards = [newDeck.pop()!, newDeck.pop()!];
    const opponentHoleCards = [newDeck.pop()!, newDeck.pop()!];
    
    
    
    // Build the new combat state with hole cards
    const newCombatState: PokerCombatState = {
      ...combatState,
      phase: CombatPhase.SPELL_PET,
      player: {
        ...combatState.player,
        holeCards: playerHoleCards,
        hpCommitted: 0,
        blindPosted: 0
      },
      opponent: {
        ...combatState.opponent,
        holeCards: opponentHoleCards,
        hpCommitted: 0,
        blindPosted: 0
      },
      pot: 0,
      currentBet: 0,
      blindsPosted: false,
      isAllInShowdown: false
    };
    
    // Collect blinds immediately so SB can see "Call" option during SPELL_PET
    const stateWithBlinds = collectForcedBets(newCombatState);
    
    set({
      deck: newDeck,
      mulliganComplete: true,
      combatState: stateWithBlinds
    });
    
    scheduleShuffleEffect(combatState.player.playerName, 10);
  },
  
  performAction: (playerId, action, hpCommitment = 0) => {
    const { combatState } = get();
    if (!combatState) return;
    
    const isPlayer = playerId === combatState.player.playerId;
    const actor = isPlayer ? 'player' : 'opponent';
    
    // STORE-LEVEL VALIDATION: Reject invalid actions
    const validation = isActionValid(combatState, action, isPlayer);
    if (!validation.valid) {
      console.warn(`[PokerCombat] Action rejected for ${actor}: ${validation.reason}`);
      console.warn(`[PokerCombat] - State: phase=${combatState.phase}, currentBet=${combatState.currentBet}, player.hpCommitted=${combatState.player.hpCommitted}, opponent.hpCommitted=${combatState.opponent.hpCommitted}`);
      console.warn(`[PokerCombat] - isReady: player=${combatState.player.isReady}, opponent=${combatState.opponent.isReady}`);
      return; // Silently reject invalid actions
    }
    
    // Log action being processed
    
    const actionDetails: CombatActionDetails = {
      action,
      hpCommitment,
      timestamp: Date.now()
    };
    
    set(state => {
      if (!state.combatState) return state;
      
      const newState = { ...state.combatState };
      newState.actionHistory = [...newState.actionHistory, actionDetails];
      
      const playerState = isPlayer ? newState.player : newState.opponent;
      playerState.currentAction = action;
      
      // Check if player is frozen - cannot take voluntary actions
      const isStunned = playerState.statusEffects.some(e => e.type === 'frozen');
      if (isStunned) {
        // If there's a bet to call, auto-call (or all-in) instead of defend
        // Use blindPosted for call calculation (ante doesn't count as a bet)
        const toCall = Math.max(0, newState.currentBet - playerState.blindPosted);
        // availableHP = currentHealth capped by stamina (HP is already deducted when committed, don't double-count)
        // STAMINA CAP: STA limits max bet - 1 STA = 10 HP max bet
        const stunnedCurrentHP = playerState.pet.stats.currentHealth;
        const stunnedStaminaCap = playerState.pet.stats.currentStamina * 10;
        const availableHP = Math.min(stunnedCurrentHP, stunnedStaminaCap);
        if (toCall > 0) {
          const callAmount = Math.min(toCall, availableHP);
          if (callAmount > 0) {
            playerState.hpCommitted += callAmount;
            playerState.blindPosted += callAmount;
            newState.pot += callAmount;
            // FIX: Must deduct HP when committing to pot
            playerState.pet.stats.currentHealth = Math.max(0, playerState.pet.stats.currentHealth - callAmount);
          } else {
            // No HP to call - forced fold with immediate resolution
            // HP was already deducted when committed - no additional deduction needed
            playerState.currentAction = CombatAction.BRACE;
            // NOTE: Folds do NOT cost stamina (not an aggressive action)
            const folderIsPlayerStunned = playerState.playerId === newState.player.playerId;
            newState.foldWinner = folderIsPlayerStunned ? 'opponent' : 'player';
            newState.phase = CombatPhase.RESOLUTION;
            newState.player.isReady = true;
            newState.opponent.isReady = true;
            return { ...state, combatState: newState };
          }
        } else {
        }
        playerState.currentAction = CombatAction.DEFEND;
        playerState.isReady = true;
        return { ...state, combatState: newState };
      }
      
      // Helper: Calculate stamina cost for HP commitment
      // NEW SYSTEM: 1 stamina per 10 HP bet (rounded up)
      // This is more intuitive: bet 30 HP = costs 3 stamina
      const calculateStaminaCost = (hpAmount: number) => {
        if (hpAmount <= 0) return 0;
        return Math.ceil(hpAmount / 10);
      };
      
      // Calculate available HP (what can still be committed)
      // HP is already deducted when committed, so availableHP = currentHealth (don't double-count)
      // STAMINA CAP: STA limits max bet - 1 STA = 10 HP max bet
      // If you have 5 STA with 100 HP, you can only bet 50 HP
      const currentHP = playerState.pet.stats.currentHealth;
      const staminaCapHP = playerState.pet.stats.currentStamina * 10;
      const availableHP = Math.min(currentHP, staminaCapHP);
      // Use blindPosted for call calculation (ante doesn't count toward bet)
      const toCall = Math.max(0, newState.currentBet - playerState.blindPosted);
      
      // VALIDATION: Clamp hpCommitment to valid range
      let clampedHpCommitment = Math.max(0, hpCommitment);
      
      // First, determine total HP that will be committed for this action
      let totalHpToCommit = 0;
      switch (action) {
        case CombatAction.ATTACK:
          // For ATTACK (bet), clamp to available HP
          clampedHpCommitment = Math.min(clampedHpCommitment, availableHP);
          totalHpToCommit = clampedHpCommitment;
          break;
        case CombatAction.COUNTER_ATTACK:
          // For COUNTER_ATTACK (raise), first need to call, then raise
          // Max raise = availableHP - toCall
          const maxRaise = Math.max(0, availableHP - toCall);
          clampedHpCommitment = Math.min(clampedHpCommitment, maxRaise);
          if (clampedHpCommitment < 1 && maxRaise >= 1) {
            clampedHpCommitment = 1; // Minimum raise of 1
          }
          const callForReraise = toCall;
          totalHpToCommit = callForReraise + Math.max(0, clampedHpCommitment);
          
          // VALIDATION: Can't raise if can't afford call + minimum raise
          if (availableHP < toCall + 1) {
            // Force to just call/all-in instead
            if (availableHP > 0) {
              playerState.currentAction = CombatAction.ENGAGE;
              const allInAmount = Math.min(toCall, availableHP);
              playerState.hpCommitted += allInAmount;
              playerState.blindPosted += allInAmount; // FIX: Track for call calculation
              newState.pot += allInAmount;
              // FIX: Must deduct HP when committing to pot
              playerState.pet.stats.currentHealth = Math.max(0, playerState.pet.stats.currentHealth - allInAmount);
              playerState.isReady = true;
              return { ...state, combatState: newState };
            } else {
              // No HP left - force fold with immediate resolution
              // HP was already deducted when committed - no additional deduction needed
              playerState.currentAction = CombatAction.BRACE;
              // NOTE: Folds do NOT cost stamina (not an aggressive action)
              const folderIsPlayerNoHP = playerState.playerId === newState.player.playerId;
              newState.foldWinner = folderIsPlayerNoHP ? 'opponent' : 'player';
              newState.phase = CombatPhase.RESOLUTION;
              newState.player.isReady = true;
              newState.opponent.isReady = true;
              return { ...state, combatState: newState };
            }
          }
          break;
        case CombatAction.ENGAGE:
          // Match current bet - clamp to available HP
          totalHpToCommit = Math.min(toCall, availableHP);
          if (totalHpToCommit < toCall) {
          }
          break;
        default:
          totalHpToCommit = 0;
      }
      
      // Use clamped value for hpCommitment going forward
      hpCommitment = clampedHpCommitment;
      
      // Calculate stamina cost based on action type
      // RULE: ATTACK (bet), COUNTER_ATTACK (raise portion), and FOLD cost stamina
      // Blinds, calls, and checks are FREE
      let staminaCost = STAMINA_COSTS[action] || 0; // Base cost from table (1 for fold)
      if (action === CombatAction.ATTACK) {
        // Bet: 1 stamina per 10 HP bet (rounded up)
        staminaCost = calculateStaminaCost(totalHpToCommit);
      } else if (action === CombatAction.COUNTER_ATTACK) {
        // Raise: only the raise portion costs stamina (not the call)
        const raisePortionOnly = Math.max(0, totalHpToCommit - toCall);
        staminaCost = calculateStaminaCost(raisePortionOnly);
      }
      // BRACE (fold) = 1 stamina (from STAMINA_COSTS table)
      // ENGAGE (call), DEFEND (check) = 0 stamina (FREE)
      
      // Check if player has enough stamina
      if (playerState.pet.stats.currentStamina < staminaCost) {
        // If there's a bet to call, must auto-call before defending (blind obligations)
        const toCallForced = Math.max(0, newState.currentBet - playerState.blindPosted);
        // HP is already deducted when committed, so availableHP = currentHealth capped by stamina
        // STAMINA CAP: STA limits max bet - 1 STA = 10 HP max bet
        const forcedCurrentHP = playerState.pet.stats.currentHealth;
        const forcedStaminaCap = playerState.pet.stats.currentStamina * 10;
        const availableHPForced = Math.min(forcedCurrentHP, forcedStaminaCap);
        if (toCallForced > 0) {
          const callAmount = Math.min(toCallForced, availableHPForced);
          if (callAmount > 0) {
            playerState.hpCommitted += callAmount;
            playerState.blindPosted += callAmount; // FIX: Track for call calculation
            newState.pot += callAmount;
            // FIX: Must deduct HP when committing to pot
            playerState.pet.stats.currentHealth = Math.max(0, playerState.pet.stats.currentHealth - callAmount);
          } else {
            // No HP to call - forced fold with immediate resolution
            // HP was already deducted when committed - no additional deduction needed
            playerState.currentAction = CombatAction.BRACE;
            // NOTE: Forced folds when out of stamina don't cost additional stamina
            const folderIsPlayerForced = playerState.playerId === newState.player.playerId;
            newState.foldWinner = folderIsPlayerForced ? 'opponent' : 'player';
            newState.phase = CombatPhase.RESOLUTION;
            newState.player.isReady = true;
            newState.opponent.isReady = true;
            return { ...state, combatState: newState };
          }
        }
        // Now force defend
        playerState.currentAction = CombatAction.DEFEND;
        playerState.pet.stats.currentStamina = Math.min(
          playerState.pet.stats.maxStamina,
          playerState.pet.stats.currentStamina + 1
        );
        playerState.isReady = true;
        return { ...state, combatState: newState };
      }
      
      playerState.pet.stats.currentStamina = Math.max(0, playerState.pet.stats.currentStamina - staminaCost);
      
      // Now execute the action
      switch (action) {
        case CombatAction.ATTACK:
          // Ragnarok: bet must be at least minBet (5 HP), clamped to available HP
          // HP is already deducted when committed, so availableHP = currentHealth capped by stamina
          // STAMINA CAP: STA limits max bet - 1 STA = 10 HP max bet
          const attackCurrentHP = playerState.pet.stats.currentHealth;
          const attackStaminaCap = playerState.pet.stats.currentStamina * 10;
          const attackAvailableHP = Math.min(attackCurrentHP, attackStaminaCap);
          if (attackAvailableHP < newState.minBet) {
            // Not enough HP to make minimum bet - force fold
            // HP was already deducted when committed - no additional deduction needed
            playerState.currentAction = CombatAction.BRACE;
            // NOTE: Folds do NOT cost stamina (not an aggressive action)
            const folderIsPlayerAttack = playerState.playerId === newState.player.playerId;
            newState.foldWinner = folderIsPlayerAttack ? 'opponent' : 'player';
            newState.phase = CombatPhase.RESOLUTION;
            newState.player.isReady = true;
            newState.opponent.isReady = true;
            break;
          }
          const betAmount = Math.min(Math.max(newState.minBet, hpCommitment), attackAvailableHP);
          playerState.hpCommitted += betAmount;
          playerState.blindPosted += betAmount; // Track for call calculation
          newState.pot += betAmount;
          // IMMEDIATELY deduct HP when betting (like real poker chips) with clamping
          playerState.pet.stats.currentHealth = Math.max(0, playerState.pet.stats.currentHealth - betAmount);
          
          // FIX: currentBet should be the TOTAL bet by this player, not just betAmount
          // This ensures subsequent bets properly update the amount to match
          // Use blindPosted (not hpCommitted) since ante doesn't count as a bet
          const newTotalBet = playerState.blindPosted;
          if (newTotalBet > newState.currentBet) {
            newState.currentBet = newTotalBet;
            // When bet increases, opponent must respond - mark them NOT ready
            const opponentState = playerState.playerId === newState.player.playerId 
              ? newState.opponent 
              : newState.player;
            opponentState.isReady = false;
            // Reset turn timer for opponent to respond
            newState.turnTimer = newState.maxTurnTime;
          }
          // Mark that a bet has been made this preflop round
          newState.preflopBetMade = true;
          break;
          
        case CombatAction.COUNTER_ATTACK:
          // Counter Attack (Reraise) - must first match current bet, then raise by minBet
          // HP is already deducted when committed, so availableHP = currentHealth capped by stamina
          // STAMINA CAP: STA limits max bet - 1 STA = 10 HP max bet
          const raiseCurrentHP = playerState.pet.stats.currentHealth;
          const raiseStaminaCap = playerState.pet.stats.currentStamina * 10;
          const raiseAvailableHP = Math.min(raiseCurrentHP, raiseStaminaCap);
          
          // Step 1: Match the current bet if not already matched (implicit call)
          const callAmount = Math.max(0, newState.currentBet - playerState.blindPosted);
          const callClamped = Math.min(callAmount, raiseAvailableHP);
          if (callClamped > 0) {
            playerState.hpCommitted += callClamped;
            playerState.blindPosted += callClamped; // Track for call calculation
            newState.pot += callClamped;
            // IMMEDIATELY deduct HP when calling (like real poker chips) with clamping
            playerState.pet.stats.currentHealth = Math.max(0, playerState.pet.stats.currentHealth - callClamped);
          }
          
          // Step 2: Add the raise amount on top (must be at least minBet), clamped to remaining HP
          const remainingAfterCall = playerState.pet.stats.currentHealth;
          if (remainingAfterCall < newState.minBet) {
            // Can only afford to call, not raise - treat as all-in call
            break;
          }
          const raiseAmount = Math.min(Math.max(newState.minBet, hpCommitment), remainingAfterCall);
          playerState.hpCommitted += raiseAmount;
          playerState.blindPosted += raiseAmount; // Track for call calculation
          newState.pot += raiseAmount;
          // IMMEDIATELY deduct HP when raising (like real poker chips) with clamping
          playerState.pet.stats.currentHealth = Math.max(0, playerState.pet.stats.currentHealth - raiseAmount);
          newState.currentBet = playerState.blindPosted; // currentBet based on bet amounts (not including ante)
          // When raising, opponent must respond - mark them NOT ready
          const opponentStateRaise = playerState.playerId === newState.player.playerId 
            ? newState.opponent 
            : newState.player;
          opponentStateRaise.isReady = false;
          // Reset turn timer for opponent to respond
          newState.turnTimer = newState.maxTurnTime;
          newState.preflopBetMade = true;
          break;
          
        case CombatAction.ENGAGE:
          // Call - match current bet (based on blindPosted, not hpCommitted), clamped to available HP
          // HP is already deducted when committed, so availableHP = currentHealth capped by stamina
          // STAMINA CAP: STA limits max bet - 1 STA = 10 HP max bet
          const engageCurrentHP = playerState.pet.stats.currentHealth;
          const engageStaminaCap = playerState.pet.stats.currentStamina * 10;
          const currentAvailableHP = Math.min(engageCurrentHP, engageStaminaCap);
          const toMatch = Math.min(newState.currentBet - playerState.blindPosted, currentAvailableHP);
          if (toMatch <= 0) {
            // FIX: Properly handle forced fold when no HP available to call
            // Must set foldWinner and phase = RESOLUTION like the BRACE case
            // HP was already deducted when committed - no additional deduction needed
            playerState.currentAction = CombatAction.BRACE;
            // NOTE: Folds do NOT cost stamina (not an aggressive action)
            const folderIsPlayerEngage = playerState.playerId === newState.player.playerId;
            newState.foldWinner = folderIsPlayerEngage ? 'opponent' : 'player';
            newState.phase = CombatPhase.RESOLUTION;
            newState.player.isReady = true;
            newState.opponent.isReady = true;
            return { ...state, combatState: newState };
          }
          playerState.hpCommitted += toMatch;
          playerState.blindPosted += toMatch; // Track for call calculation
          newState.pot += toMatch;
          // IMMEDIATELY deduct HP when calling (like real poker chips) with clamping
          playerState.pet.stats.currentHealth = Math.max(0, playerState.pet.stats.currentHealth - toMatch);
          if (toMatch < (newState.currentBet - playerState.blindPosted + toMatch)) {
          } else {
          }
          break;
          
        case CombatAction.BRACE:
          // Brace (Fold) - forfeit whatever you've committed (blinds/antes + any bets)
          // HP was ALREADY deducted when committed, so no additional HP loss here
          // Winner gets the pot back (their committed HP + loser's committed HP)
          // NOTE: Stamina cost (1) is already deducted at line 741 via STAMINA_COSTS table
          
          // Determine fold winner - the actor who folds LOSES
          const folderIsPlayer = playerState.playerId === newState.player.playerId;
          newState.foldWinner = folderIsPlayer ? 'opponent' : 'player';
          
          // Log the fold - HP was already deducted when committed, they just forfeit the pot
          
          // NO additional HP deduction - HP was deducted when committed
          // The winner will get the pot (their HP back + loser's HP) in resolution
          
          // Immediately set phase to RESOLUTION and mark both ready
          newState.phase = CombatPhase.RESOLUTION;
          newState.player.isReady = true;
          newState.opponent.isReady = true;
          break;
          
        case CombatAction.DEFEND:
          // Defend (Check) - only allowed post-flop when bets are matched
          // In Ragnarok preflop: NO CHECKING ALLOWED - must bet or fold
          playerState.pet.stats.currentStamina = Math.min(
            playerState.pet.stats.maxStamina,
            playerState.pet.stats.currentStamina + 1
          );
          
          // CRITICAL: After a check, always check if round can close
          // Use a small timeout to allow state to settle if needed, or just let the caller handle it.
          // In performAction, we return newState, then maybeCloseBettingRound is called by UI.
          break;
      }
      
      playerState.isReady = true;
      
      // ALL-IN DETECTION: Check if both players have no HP left to bet after this action
      // This is more reliable than only checking in maybeCloseBettingRound
      const playerRemainingHP = newState.player.pet.stats.currentHealth;
      const opponentRemainingHP = newState.opponent.pet.stats.currentHealth;
      const bothNowAllIn = playerRemainingHP <= 0 && opponentRemainingHP <= 0;
      
      if (bothNowAllIn && !newState.isAllInShowdown) {
        newState.isAllInShowdown = true;
      }
      
      return { ...state, combatState: newState };
    });
    
    // Log poker action to saga feed AFTER state update
    const actorLabel = isPlayer ? 'player' : 'opponent';
    const petName = combatState.player.pet.name;
    switch (action) {
      case CombatAction.ATTACK:
        logActivity('poker_bet', actorLabel, `${petName} bet ${hpCommitment} HP`, { value: hpCommitment });
        break;
      case CombatAction.COUNTER_ATTACK:
        logActivity('poker_bet', actorLabel, `${petName} raised ${hpCommitment} HP`, { value: hpCommitment });
        break;
      case CombatAction.ENGAGE:
        logActivity('poker_bet', actorLabel, `${petName} called`, {});
        break;
      case CombatAction.BRACE:
        // Fold penalty = committed HP (blinds/antes + any bets) - already deducted from health
        // Note: Stamina cost (1) was already deducted before the action switch statement
        const folderCommitted = isPlayer ? combatState.player.hpCommitted : combatState.opponent.hpCommitted;
        logActivity('poker_fold', actorLabel, `${petName} folded (forfeits ${folderCommitted} HP in pot)`, {});
        break;
      case CombatAction.DEFEND:
        logActivity('poker_check', actorLabel, `${petName} checked (+1 Stamina)`, {});
        break;
    }
  },
  
  // Set player as ready during SPELL_PET phase (for "Ready to Battle" button)
  setPlayerReady: (playerId: string) => {
    set(state => {
      if (!state.combatState) return state;
      
      const newState = { ...state.combatState };
      const isPlayer = playerId === newState.player.playerId;
      const playerState = isPlayer ? newState.player : newState.opponent;
      
      // Mark this player as ready
      playerState.isReady = true;
      
      // If AI opponent is not ready during SPELL_PET phase, auto-ready them after a short delay
      if (newState.phase === CombatPhase.SPELL_PET && isPlayer && !newState.opponent.isReady) {
        // AI auto-readies after player clicks Ready
        setTimeout(() => {
          const store = usePokerCombatStore.getState();
          if (store.combatState && store.combatState.phase === CombatPhase.SPELL_PET && !store.combatState.opponent.isReady) {
            store.setPlayerReady(store.combatState.opponent.playerId);
          }
        }, 500);
      }
      
      return { ...state, combatState: newState };
    });
  },
  
  /**
   * maybeCloseBettingRound - Central helper for phase transitions
   * 
   * This function checks if a betting round can be closed and advances to the
   * next phase if so. It enforces strict sequential phase progression:
   * SPELL_PET → FAITH → FORESIGHT → DESTINY → RESOLUTION
   * 
   * Conditions for closing a round:
   * 1. Both players must be ready (have taken their action)
   * 2. Bets must be settled (player and opponent have committed same HP, or one is all-in)
   * 3. No foldWinner already set (fold goes directly to resolution in performAction)
   * 4. Phase must not already be RESOLUTION
   */
  maybeCloseBettingRound: () => {
    const { combatState, deck, advancePhase } = get();
    if (!combatState) return;
    
    // Enhanced debug logging
    
    // Don't close if already in resolution or there's a fold winner
    if (combatState.phase === CombatPhase.RESOLUTION) {
      return;
    }
    
    if (combatState.foldWinner) {
      return;
    }
    
    // Check if both players are ready
    if (!combatState.player.isReady || !combatState.opponent.isReady) {
      return;
    }
    
    // SPELL_PET phase: No bet settling required - just a "ready check"
    // Advance immediately when both players are ready
    if (combatState.phase === CombatPhase.SPELL_PET) {
      advancePhase();
      return;
    }
    
    // Check if bets are settled properly:
    // 1. currentBet === 0 (both checked), OR
    // 2. Both players have committed the same amount, OR
    // 3. One player is all-in AND their opponent has matched or exceeded the current bet
    const currentBet = combatState.currentBet;
    const playerHP = combatState.player.hpCommitted;
    const opponentHP = combatState.opponent.hpCommitted;
    // NOTE: HP is deducted immediately when bet/committed, so currentHealth IS the available HP
    const playerAvailableHP = combatState.player.pet.stats.currentHealth;
    const opponentAvailableHP = combatState.opponent.pet.stats.currentHealth;
    const playerAllIn = playerAvailableHP <= 0;
    const opponentAllIn = opponentAvailableHP <= 0;
    
    // IMPORTANT FIX: In post-flop, if both checked (currentBet === 0), they are settled.
    // However, if AI acts first and checks, player.isReady is still true from previous phase 
    // unless reset. advancePhase resets isReady = false for both.
    // If AI acts first, it sets its own isReady = true. Player then checks, sets its isReady = true.
    
    // Both checked this round (currentBet === 0 means no one bet this street)
    // In Ragnarok, preflop always has a bet (preflopBetMade), but postflop can be checked through.
    const bothCheckedThisRound = currentBet === 0;
    
    // Both matched the current bet (or one is all-in after committing what they could)
    const playerMatchedBet = playerHP >= currentBet || playerAllIn;
    const opponentMatchedBet = opponentHP >= currentBet || opponentAllIn;
    
    // CRITICAL FIX: Bets are settled if both matched the currentBet AND (they are equal OR someone is all-in)
    // If currentBet > 0, we must ensure they matched.
    const betsMatched = currentBet > 0 
      ? (playerMatchedBet && opponentMatchedBet && (playerHP === opponentHP || playerAllIn || opponentAllIn))
      : true; // If currentBet is 0, they are matched by definition
    
    const betsSettled = bothCheckedThisRound || betsMatched;
    
    // Debug: Log the betting analysis
    
    if (!betsSettled) {
      return;
    }
    
    // CRITICAL: Detect all-in showdown - when both players have no HP left to bet
    // This triggers auto-reveal of remaining community cards without further betting
    const bothAllIn = playerAllIn && opponentAllIn;
    if (bothAllIn && !combatState.isAllInShowdown) {
      set(state => {
        if (!state.combatState) return state;
        return {
          ...state,
          combatState: {
            ...state.combatState,
            isAllInShowdown: true
          }
        };
      });
    }
    
    // All conditions met - advance to next phase using strict ordering
    const nextPhase = getNextPhase(combatState.phase);
    advancePhase();
  },
  
  advancePhase: () => {
    const { combatState, deck } = get();
    if (!combatState) return;
    
    // Check if someone folded (foldWinner set in performAction) - go straight to resolution
    if (combatState.foldWinner) {
      set(state => {
        if (!state.combatState) return state;
        const newState = { ...state.combatState };
        newState.phase = CombatPhase.RESOLUTION;
        return { ...state, combatState: newState };
      });
      return;
    }
    
    // CRITICAL: Verify we're not already in RESOLUTION
    if (combatState.phase === CombatPhase.RESOLUTION) {
      return;
    }
    
    // Use strict phase ordering
    const nextPhase = getNextPhase(combatState.phase);
    if (!nextPhase) {
      return;
    }
    
    
    // Check if deck needs reshuffling (need at least 5 cards for community cards)
    let newDeck = [...deck];
    if (newDeck.length < 10) {
      newDeck = shuffleDeck(createPokerDeck());
    }
    
    set(state => {
      if (!state.combatState) return state;
      
      const newState = { ...state.combatState };
      
      switch (newState.phase) {
        case CombatPhase.MULLIGAN:
          // Mulligan phase advance is handled by completeMulligan()
          return state;
          
        case CombatPhase.SPELL_PET:
          const faithCards = [newDeck.pop()!, newDeck.pop()!, newDeck.pop()!];
          newState.communityCards = { faith: faithCards };
          newState.phase = CombatPhase.FAITH;
          
          // Collect blinds and antes when entering first betting phase
          const stateWithBlinds = collectForcedBets(newState);
          Object.assign(newState, stateWithBlinds);
          
          // Consolidated phase notification - only log significant phases to reduce noise
          logActivity('poker_phase', 'system', `Faith (3 cards) - Pot: ${newState.pot} HP`, {});
          break;
          
        case CombatPhase.FAITH:
          newState.communityCards.foresight = newDeck.pop();
          newState.phase = CombatPhase.FORESIGHT;
          // Skip log for intermediate phases - reduce toast noise
          break;
          
        case CombatPhase.FORESIGHT:
          newState.communityCards.destiny = newDeck.pop();
          newState.phase = CombatPhase.DESTINY;
          // Skip log for intermediate phases - reduce toast noise
          break;
          
        case CombatPhase.DESTINY:
          newState.phase = CombatPhase.RESOLUTION;
          logActivity('poker_phase', 'system', 'Showdown!', {});
          break;
          
        case CombatPhase.RESOLUTION:
          // Already in resolution, nothing to do
          return state;
      }
      
      // Process status effects at end of each phase
      const playerEffects = processStatusEffects(newState.player);
      const opponentEffects = processStatusEffects(newState.opponent);
      
      // Apply status effect damage/healing
      newState.player.pet.stats.currentHealth = Math.max(0, 
        Math.min(newState.player.pet.stats.maxHealth, 
          newState.player.pet.stats.currentHealth - playerEffects.damageDealt + playerEffects.healingDone));
      newState.opponent.pet.stats.currentHealth = Math.max(0, 
        Math.min(newState.opponent.pet.stats.maxHealth, 
          newState.opponent.pet.stats.currentHealth - opponentEffects.damageDealt + opponentEffects.healingDone));
      
      // Update status effect durations
      newState.player.statusEffects = playerEffects.updatedEffects;
      newState.opponent.statusEffects = opponentEffects.updatedEffects;
      
      // Decrement ability cooldowns
      for (const ability of newState.player.pet.abilities) {
        if (ability.currentCooldown && ability.currentCooldown > 0) {
          ability.currentCooldown--;
        }
      }
      for (const ability of newState.opponent.pet.abilities) {
        if (ability.currentCooldown && ability.currentCooldown > 0) {
          ability.currentCooldown--;
        }
      }
      
      // Regenerate stamina each phase
      newState.player.pet.stats.currentStamina = Math.min(
        newState.player.pet.stats.maxStamina, 
        newState.player.pet.stats.currentStamina + STAMINA_REGEN_PER_PHASE);
      newState.opponent.pet.stats.currentStamina = Math.min(
        newState.opponent.pet.stats.maxStamina, 
        newState.opponent.pet.stats.currentStamina + STAMINA_REGEN_PER_PHASE);
      
      
      // When transitioning TO RESOLUTION, keep isReady=true so resolution can trigger
      // For other phases, reset isReady for new betting round
      if (newState.phase !== CombatPhase.RESOLUTION) {
        // CRITICAL: Log state BEFORE reset for debugging
        
        newState.player.isReady = false;
        newState.opponent.isReady = false;
        newState.player.currentAction = undefined;
        newState.opponent.currentAction = undefined;
        newState.turnTimer = newState.maxTurnTime;
        
        // Reset currentBet for new betting round (poker rules: each street starts fresh)
        // This allows checking in FORESIGHT/DESTINY when no bet has been made yet
        newState.currentBet = 0;
        
        // Reset preflopBetMade flag for new betting round
        newState.preflopBetMade = false;
        
        // Log state AFTER reset
      }
      
      return { ...state, combatState: newState, deck: newDeck };
    });
  },
  
  evaluateHand: (holeCards, communityCards) => {
    const allCards = [...holeCards, ...communityCards];
    if (allCards.length < 5) {
      const sortedCards = allCards.sort((a, b) => b.numericValue - a.numericValue);
      return {
        rank: PokerHandRank.HIGH_CARD,
        cards: sortedCards,
        highCard: sortedCards[0],
        multiplier: 1.0,
        displayName: 'High Card',
        tieBreakers: sortedCards.map(c => c.numericValue)
      };
    }
    
    let bestHand: EvaluatedHand | null = null;
    
    for (let i = 0; i < allCards.length - 4; i++) {
      for (let j = i + 1; j < allCards.length - 3; j++) {
        for (let k = j + 1; k < allCards.length - 2; k++) {
          for (let l = k + 1; l < allCards.length - 1; l++) {
            for (let m = l + 1; m < allCards.length; m++) {
              const hand = [allCards[i], allCards[j], allCards[k], allCards[l], allCards[m]];
              const evaluated = evaluatePokerHand(hand);
              
              if (!bestHand || evaluated.rank > bestHand.rank) {
                bestHand = evaluated;
              } else if (evaluated.rank === bestHand.rank) {
                // Compare using tieBreakers lexicographically
                for (let tb = 0; tb < evaluated.tieBreakers.length; tb++) {
                  if (evaluated.tieBreakers[tb] > (bestHand.tieBreakers[tb] || 0)) {
                    bestHand = evaluated;
                    break;
                  } else if (evaluated.tieBreakers[tb] < (bestHand.tieBreakers[tb] || 0)) {
                    break; // Current bestHand is better
                  }
                }
              }
            }
          }
        }
      }
    }
    
    return bestHand!;
  },
  
  resolveCombat: () => {
    const { combatState } = get();
    if (!combatState || combatState.phase !== CombatPhase.RESOLUTION) return null;
    
    const { evaluateHand } = get();
    
    // Handle fold win - someone forfeited
    if (combatState.foldWinner) {
      const winner = combatState.foldWinner;
      const whoFolded = winner === 'player' ? 'opponent' : 'player';
      // HP was already deducted when committed - winner gets ONLY their own bet back (capped at max HP)
      const folderState = whoFolded === 'player' ? combatState.player : combatState.opponent;
      const winnerState = winner === 'player' ? combatState.player : combatState.opponent;
      const foldPenalty = folderState.hpCommitted;
      const winnerGetsBack = winnerState.hpCommitted; // Winner gets ONLY their own bet back, not opponent's HP
      
      // Folder takes damage (already applied), winner takes nothing
      const dummyCard: PokerCard = { suit: 'spades', value: 'A', numericValue: 14 };
      const winnerHand: EvaluatedHand = {
        rank: PokerHandRank.HIGH_CARD,
        cards: [],
        highCard: dummyCard,
        multiplier: 1.0,
        displayName: 'Winner',
        tieBreakers: [14]
      };
      const folderHand: EvaluatedHand = {
        rank: PokerHandRank.HIGH_CARD,
        cards: [],
        highCard: dummyCard,
        multiplier: 1.0,
        displayName: 'Folded',
        tieBreakers: [0]
      };
      
      // Calculate final health: winner gets ONLY their own bet back (capped at max HP)
      // Winner does NOT gain opponent's HP - folder's armor can absorb their loss
      //
      // MINION DAMAGE PERSISTENCE (FOLD CASE):
      // Same rules apply - winner gets bet back, minion damage persists
      const playerMaxHP = combatState.player.pet.stats.maxHealth;
      const opponentMaxHP = combatState.opponent.pet.stats.maxHealth;
      const playerCurrentHP = combatState.player.pet.stats.currentHealth;
      const opponentCurrentHP = combatState.opponent.pet.stats.currentHealth;
      let playerFinalHP: number;
      let opponentFinalHP: number;
      let playerFinalArmor = combatState.player.heroArmor;
      let opponentFinalArmor = combatState.opponent.heroArmor;
      
      
      if (winner === 'player') {
        // Player wins - gets their bet back
        playerFinalHP = Math.min(playerCurrentHP + combatState.player.hpCommitted, playerMaxHP);
        // Opponent (folder) - armor can refund some of the loss
        const opponentLoss = foldPenalty;
        if (opponentFinalArmor > 0 && opponentLoss > 0) {
          const armorRefund = Math.min(opponentFinalArmor, opponentLoss);
          opponentFinalArmor -= armorRefund;
          opponentFinalHP = Math.min(opponentCurrentHP + armorRefund, opponentMaxHP);
        } else {
          opponentFinalHP = opponentCurrentHP;
        }
      } else {
        // Opponent wins - gets their bet back
        opponentFinalHP = Math.min(opponentCurrentHP + combatState.opponent.hpCommitted, opponentMaxHP);
        // Player (folder) - armor can refund some of the loss
        const playerLoss = foldPenalty;
        if (playerFinalArmor > 0 && playerLoss > 0) {
          const armorRefund = Math.min(playerFinalArmor, playerLoss);
          playerFinalArmor -= armorRefund;
          playerFinalHP = Math.min(playerCurrentHP + armorRefund, playerMaxHP);
        } else {
          playerFinalHP = playerCurrentHP;
        }
      }
      
      const resolution: CombatResolution = {
        winner,
        resolutionType: 'fold',
        playerHand: whoFolded === 'player' ? folderHand : winnerHand,
        opponentHand: whoFolded === 'opponent' ? folderHand : winnerHand,
        playerDamage: whoFolded === 'player' ? foldPenalty : 0,
        opponentDamage: whoFolded === 'opponent' ? foldPenalty : 0,
        playerFinalHealth: playerFinalHP,
        opponentFinalHealth: opponentFinalHP,
        foldPenalty,
        whoFolded
      };
      
      // Update state with final health and armor values
      set(state => {
        if (!state.combatState) return state;
        return {
          ...state,
          combatState: {
            ...state.combatState,
            winner,
            pot: 0,
            currentBet: 0,
            player: {
              ...state.combatState.player,
              hpCommitted: 0,
              blindPosted: 0,
              isReady: false,
              currentAction: undefined,
              heroArmor: playerFinalArmor,
              pet: {
                ...state.combatState.player.pet,
                stats: {
                  ...state.combatState.player.pet.stats,
                  currentHealth: playerFinalHP
                }
              }
            },
            opponent: {
              ...state.combatState.opponent,
              hpCommitted: 0,
              blindPosted: 0,
              isReady: false,
              currentAction: undefined,
              heroArmor: opponentFinalArmor,
              pet: {
                ...state.combatState.opponent.pet,
                stats: {
                  ...state.combatState.opponent.pet.stats,
                  currentHealth: opponentFinalHP
                }
              }
            }
          }
        };
      });
      
      return resolution;
    }
    
    const communityCards = [
      ...combatState.communityCards.faith,
      combatState.communityCards.foresight,
      combatState.communityCards.destiny
    ].filter(Boolean) as PokerCard[];
    
    const playerHand = evaluateHand(combatState.player.holeCards, communityCards);
    const opponentHand = evaluateHand(combatState.opponent.holeCards, communityCards);
    
    // NOTE: Elemental modifiers are NO LONGER applied to poker hero damage
    // Instead, elemental advantage buffs pets at combat initialization (+20% attack/health)
    // See applyElementalPetBuffs() called during initCombat()
    
    // Check if this was a "check-through" round (no HP committed by either side)
    const totalPot = combatState.pot;
    const isCheckThrough = totalPot === 0;
    
    // Damage calculation per Ragnarok rules:
    // HP is a dual stat - it serves as BOTH health AND attack power
    // Final Damage = HP Committed × Hand Multiplier (loser loses their bet)
    // Winner takes ZERO damage - this creates high-stakes poker dynamics
    // Check-through (no bets): loser loses 2 HP penalty only
    
    let playerDamage: number;
    let opponentDamage: number;
    
    /** @deprecated Critical strike system removed for simplicity */
    // Critical strikes disabled - damage multipliers come from poker hands only
    
    // Check for status effect modifiers
    const playerCursed = combatState.player.statusEffects.some(e => e.type === 'cursed');
    const opponentCursed = combatState.opponent.statusEffects.some(e => e.type === 'cursed');
    const cursedMod = 0.75; // Cursed = 25% damage reduction
    
    // Simplified Ragnarok damage rules:
    // - Loser loses their OWN hpCommitted (what they bet)
    // - Winner takes ZERO damage
    // - Check-through: loser loses 2 HP, winner takes nothing, draw = nobody loses
    if (isCheckThrough) {
      // Check-through: minimal penalty (2 HP) only applied to loser
      // These values will be selectively applied based on winner
      playerDamage = 2;
      opponentDamage = 2;
    } else {
      // Normal betting: each player's damage = their own hpCommitted
      // IMPORTANT: Each player loses ONLY what THEY bet, not what their opponent bet
      playerDamage = combatState.player.hpCommitted;
      opponentDamage = combatState.opponent.hpCommitted;
    }
    
    let winner: 'player' | 'opponent' | 'draw';
    if (playerHand.rank > opponentHand.rank) {
      winner = 'player';
    } else if (opponentHand.rank > playerHand.rank) {
      winner = 'opponent';
    } else {
      // Same rank - compare using tieBreakers lexicographically
      // This properly handles Two Pair vs Two Pair (e.g., K-5 beats 9-8)
      winner = 'draw';
      const maxLen = Math.max(playerHand.tieBreakers.length, opponentHand.tieBreakers.length);
      for (let i = 0; i < maxLen; i++) {
        const playerTB = playerHand.tieBreakers[i] || 0;
        const opponentTB = opponentHand.tieBreakers[i] || 0;
        if (playerTB > opponentTB) {
          winner = 'player';
          break;
        } else if (opponentTB > playerTB) {
          winner = 'opponent';
          break;
        }
      }
      if (winner === 'draw') {
      }
    }
    
    // HP Application (CORRECTED SYSTEM - HP already deducted when committed):
    // - HP was already deducted when players posted blinds/bets
    // - Winner gets ONLY their own bet back (capped at max HP) - they don't "win" opponent's HP
    // - Loser keeps their HP lost (already deducted) BUT armor can absorb some/all of the loss
    // - Draw: both get their own HP back (capped at max HP)
    let playerFinalHealth: number;
    let opponentFinalHealth: number;
    let playerFinalArmor = combatState.player.heroArmor;
    let opponentFinalArmor = combatState.opponent.heroArmor;
    
    const playerCurrentHP = combatState.player.pet.stats.currentHealth;
    const opponentCurrentHP = combatState.opponent.pet.stats.currentHealth;
    const playerMaxHP = combatState.player.pet.stats.maxHealth;
    const opponentMaxHP = combatState.opponent.pet.stats.maxHealth;
    const playerCommitted = combatState.player.hpCommitted;
    const opponentCommitted = combatState.opponent.hpCommitted;
    
    // MINION DAMAGE PERSISTENCE RULE:
    // Minion damage is PERMANENT and stays regardless of poker outcome.
    // Poker betting only affects the HP that was wagered during the hand.
    // 
    // How it works:
    // - currentHP already has minion damage deducted (via applyDirectDamage)
    // - currentHP also has poker bet HP deducted (via betting actions)
    // - Winner gets ONLY their bet back (committed HP), not healing
    // - This preserves minion damage because we're adding committed (not restoring to max)
    //
    // Example: 100 HP max, minion deals 5 dmg, bet 10 HP, win
    //   currentHP = 100 - 5 (minion) - 10 (bet) = 85
    //   committed = 10
    //   finalHP = min(85 + 10, 100) = 95 (minion damage persists!)
    
    
    if (winner === 'player') {
      // Player wins - gets ONLY their own bet back (capped at max HP)
      playerFinalHealth = Math.min(playerCurrentHP + playerCommitted, playerMaxHP);
      
      // Opponent loses - armor can refund some of the loss
      // HP was already deducted during betting, so we refund min(armor, loss) back to HP
      const opponentLoss = opponentCommitted;
      if (opponentFinalArmor > 0 && opponentLoss > 0) {
        const armorRefund = Math.min(opponentFinalArmor, opponentLoss);
        opponentFinalArmor -= armorRefund;
        opponentFinalHealth = Math.min(opponentCurrentHP + armorRefund, opponentMaxHP);
      } else {
        opponentFinalHealth = opponentCurrentHP; // Loser keeps HP lost (already deducted)
      }
    } else if (winner === 'opponent') {
      // Opponent wins - gets ONLY their own bet back (capped at max HP)
      opponentFinalHealth = Math.min(opponentCurrentHP + opponentCommitted, opponentMaxHP);
      
      // Player loses - armor can refund some of the loss
      const playerLoss = playerCommitted;
      if (playerFinalArmor > 0 && playerLoss > 0) {
        const armorRefund = Math.min(playerFinalArmor, playerLoss);
        playerFinalArmor -= armorRefund;
        playerFinalHealth = Math.min(playerCurrentHP + armorRefund, playerMaxHP);
      } else {
        playerFinalHealth = playerCurrentHP; // Loser keeps HP lost (already deducted)
      }
    } else {
      // Draw - both get their own bets back (capped at max HP)
      playerFinalHealth = Math.min(playerCurrentHP + playerCommitted, playerMaxHP);
      opponentFinalHealth = Math.min(opponentCurrentHP + opponentCommitted, opponentMaxHP);
    }
    
    const resolution: CombatResolution = {
      winner,
      resolutionType: 'showdown',
      playerHand,
      opponentHand,
      playerDamage,
      opponentDamage,
      playerFinalHealth: Math.max(0, playerFinalHealth),
      opponentFinalHealth: Math.max(0, opponentFinalHealth)
    };
    
    set(state => {
      if (!state.combatState) return state;
      
      // Reset round state for next hand
      // Winners do NOT get stamina restored - only HP is returned
      // Stamina stays as-is (no restoration)
      // Armor is updated based on absorption during resolution
      return {
        ...state,
        combatState: {
          ...state.combatState,
          winner,
          pot: 0, // Reset pot
          currentBet: 0, // Reset current bet
          player: {
            ...state.combatState.player,
            hpCommitted: 0, // Reset HP committed
            blindPosted: 0, // Reset blind posted
            isReady: false, // Reset ready state
            currentAction: undefined,
            heroArmor: playerFinalArmor, // Update armor after absorption
            pet: {
              ...state.combatState.player.pet,
              stats: {
                ...state.combatState.player.pet.stats,
                currentHealth: resolution.playerFinalHealth
                // Stamina stays unchanged - no restoration for winners
              }
            }
          },
          opponent: {
            ...state.combatState.opponent,
            hpCommitted: 0, // Reset HP committed
            blindPosted: 0, // Reset blind posted
            isReady: false, // Reset ready state
            currentAction: undefined,
            heroArmor: opponentFinalArmor, // Update armor after absorption
            pet: {
              ...state.combatState.opponent.pet,
              stats: {
                ...state.combatState.opponent.pet.stats,
                currentHealth: resolution.opponentFinalHealth
                // Stamina stays unchanged - no restoration for winners
              }
            }
          }
        }
      };
    });
    
    return resolution;
  },
  
  endCombat: () => {
    // Clear any pending transition timer
    const { transitionTimerId } = get();
    if (transitionTimerId) {
      clearTimeout(transitionTimerId);
    }
    
    // Reset Norse context when combat ends
    resetNorseContext();
    
    // Reset shared deck store
    useSharedDeckStore.getState().reset();
    
    set({ combatState: null, deck: [], isActive: false, isTransitioningHand: false, transitionTimerId: null });
  },
  
  startNextHandDelayed: (resolution: CombatResolution) => {
    const { isTransitioningHand, transitionTimerId } = get();
    
    // Prevent re-entrant calls during transition
    if (isTransitioningHand) {
      return;
    }
    
    // Check if match is over using resolution HP (not combatState which may be stale)
    if (resolution.playerFinalHealth <= 0 || resolution.opponentFinalHealth <= 0) {
      return;
    }
    
    // Clear any existing timer
    if (transitionTimerId) {
      clearTimeout(transitionTimerId);
    }
    
    
    // Wait 2 seconds so winner declaration is visible before new hand
    const timerId = setTimeout(() => {
      get().startNextHand(resolution);
      set({ isTransitioningHand: false, transitionTimerId: null });
    }, 2000);
    
    set({ isTransitioningHand: true, transitionTimerId: timerId });
  },
  
  startNextHand: (resolution?: CombatResolution) => {
    const { combatState, deck } = get();
    if (!combatState) return;
    
    // Debug: Log poker transition - gameStore battlefield is monitored via subscription in gameStore.ts
    
    // Use resolution HP values if provided, otherwise fall back to current state
    // This is CRITICAL because Zustand batching may not have flushed resolveCombat's state update yet
    const playerFinalHP = resolution?.playerFinalHealth ?? combatState.player.pet.stats.currentHealth;
    const opponentFinalHP = resolution?.opponentFinalHealth ?? combatState.opponent.pet.stats.currentHealth;
    
    if (resolution) {
    }
    
    // Check if combat should end (someone at 0 HP)
    if (playerFinalHP <= 0 || opponentFinalHP <= 0) {
      return;
    }
    
    // Shuffle a fresh deck for the new hand
    let newDeck = [...deck];
    if (newDeck.length < 15) {
      newDeck = shuffleDeck(createPokerDeck());
    }
    
    // Deal new hole cards
    const playerHoleCards = [newDeck.pop()!, newDeck.pop()!];
    const opponentHoleCards = [newDeck.pop()!, newDeck.pop()!];
    
    // CRITICAL FIX: Use resolution HP values directly, bypassing potentially stale state
    set(state => {
      if (!state.combatState) return state;
      
      const freshState = state.combatState;
      
      // Both players get +1 stamina at the start of each new hand
      const STAMINA_REGEN_PER_HAND = 1;
      const playerNewStamina = Math.min(
        freshState.player.pet.stats.maxStamina,
        freshState.player.pet.stats.currentStamina + STAMINA_REGEN_PER_HAND
      );
      const opponentNewStamina = Math.min(
        freshState.opponent.pet.stats.maxStamina,
        freshState.opponent.pet.stats.currentStamina + STAMINA_REGEN_PER_HAND
      );
      
      
      // STANDARD POKER ROTATION: Swap positions after each hand
      // This mirrors real poker where the button/blinds rotate clockwise each hand
      const newPlayerPosition: PokerPosition = freshState.playerPosition === 'small_blind' ? 'big_blind' : 'small_blind';
      const newOpponentPosition: PokerPosition = freshState.opponentPosition === 'small_blind' ? 'big_blind' : 'small_blind';
      
      // SB always acts first in heads-up poker
      const newOpenerIsPlayer = newPlayerPosition === 'small_blind';
      
      // Build updated pets using resolution HP values (not stale state!)
      const updatedPlayerPet: PetData = {
        ...freshState.player.pet,
        stats: {
          ...freshState.player.pet.stats,
          currentHealth: playerFinalHP,  // USE RESOLUTION VALUE
          currentStamina: playerNewStamina
        }
      };
      const updatedOpponentPet: PetData = {
        ...freshState.opponent.pet,
        stats: {
          ...freshState.opponent.pet.stats,
          currentHealth: opponentFinalHP,  // USE RESOLUTION VALUE
          currentStamina: opponentNewStamina
        }
      };
      
      return {
        ...state,
        deck: newDeck,
        combatState: {
          ...freshState,
          phase: CombatPhase.SPELL_PET,
          pot: 0,
          currentBet: 0,
          turnTimer: freshState.maxTurnTime,
          actionHistory: [],
          foldWinner: undefined,
          winner: undefined,
          preflopBetMade: false,
          blindsPosted: false,  // Reset for new hand - blinds collected at combat/hand start
          isAllInShowdown: false,  // Reset for new hand
          communityCards: { faith: [] },
          playerPosition: newPlayerPosition,  // ROTATED: Positions swap each hand
          opponentPosition: newOpponentPosition,  // ROTATED: Positions swap each hand
          openerIsPlayer: newOpenerIsPlayer,  // SB acts first (based on rotated positions)
          player: {
            ...freshState.player,
            holeCards: playerHoleCards,
            hpCommitted: 0,
            blindPosted: 0,
            preBlindHealth: playerFinalHP,  // Reset preBlindHealth for new hand
            isReady: false,
            currentAction: undefined,
            pet: updatedPlayerPet
          },
          opponent: {
            ...freshState.opponent,
            holeCards: opponentHoleCards,
            hpCommitted: 0,
            blindPosted: 0,
            preBlindHealth: opponentFinalHP,  // Reset preBlindHealth for new hand
            isReady: false,
            currentAction: undefined,
            pet: updatedOpponentPet
          }
        }
      };
    });
    
    // CRITICAL: Immediately collect blinds/antes for the new hand
    // This ensures blindPosted is populated before the UI polls action permissions
    // Without this, the SB would see toCall = currentBet(5) - blindPosted(0) = 5 instead of 2.5
    set(state => {
      if (!state.combatState) return state;
      const stateWithBlinds = collectForcedBets(state.combatState);
      return {
        ...state,
        combatState: stateWithBlinds
      };
    });
    
  },
  
  updateTimer: (newTime) => {
    set(state => {
      if (!state.combatState) return state;
      return {
        ...state,
        combatState: {
          ...state.combatState,
          turnTimer: newTime
        }
      };
    });
  },
  
  drawCards: (count) => {
    const { deck } = get();
    const cards: PokerCard[] = [];
    const newDeck = [...deck];
    
    for (let i = 0; i < count && newDeck.length > 0; i++) {
      cards.push(newDeck.pop()!);
    }
    
    set({ deck: newDeck });
    return cards;
  },
  
  usePetAbility: (playerId, abilityId, targetId) => {
    const { combatState } = get();
    if (!combatState) return false;
    
    const isPlayer = playerId === combatState.player.playerId;
    const actor = isPlayer ? combatState.player : combatState.opponent;
    const target = targetId === combatState.player.playerId ? combatState.player : combatState.opponent;
    
    // Find the ability
    const ability = actor.pet.abilities.find(a => a.id === abilityId);
    if (!ability) {
      return false;
    }
    
    // Check if ability is on cooldown
    if (ability.currentCooldown && ability.currentCooldown > 0) {
      return false;
    }
    
    // Check stamina cost for active abilities
    if (ability.type === 'active' && ability.staminaCost) {
      if (actor.pet.stats.currentStamina < ability.staminaCost) {
        return false;
      }
    }
    
    
    set(state => {
      if (!state.combatState) return state;
      
      const newState = { ...state.combatState };
      const actorState = isPlayer ? newState.player : newState.opponent;
      const targetState = targetId === newState.player.playerId ? newState.player : newState.opponent;
      
      // Consume stamina for active abilities
      if (ability.type === 'active' && ability.staminaCost) {
        actorState.pet.stats.currentStamina -= ability.staminaCost;
      }
      
      // Set cooldown
      if (ability.cooldown) {
        const abilityIndex = actorState.pet.abilities.findIndex(a => a.id === abilityId);
        if (abilityIndex >= 0) {
          actorState.pet.abilities[abilityIndex].currentCooldown = ability.cooldown;
        }
      }
      
      // Apply ability effect
      const effect = ability.effect;
      switch (effect.type) {
        case 'damage':
          if (effect.value) {
            // Ability damage is absorbed by armor first (like Hearthstone)
            const armorResult = applyDamageWithArmor(targetState.heroArmor, targetState.pet.stats.currentHealth, effect.value);
            targetState.heroArmor = armorResult.newArmor;
            targetState.pet.stats.currentHealth = armorResult.newHP;
          }
          break;
          
        case 'heal':
          if (effect.value) {
            const healAmount = Math.min(effect.value, targetState.pet.stats.maxHealth - targetState.pet.stats.currentHealth);
            targetState.pet.stats.currentHealth += healAmount;
          }
          break;
          
        case 'buff':
          if (effect.statusEffect && effect.duration) {
            targetState.statusEffects = applyStatusEffect(targetState, effect.statusEffect, effect.duration, effect.value);
          }
          break;
          
        case 'debuff':
          if (effect.statusEffect && effect.duration) {
            targetState.statusEffects = applyStatusEffect(targetState, effect.statusEffect, effect.duration, effect.value);
          }
          break;
      }
      
      return { ...state, combatState: newState };
    });
    
    return true;
  },
  
  applyStatusEffect: (targetPlayerId, effectType, duration, value) => {
    set(state => {
      if (!state.combatState) return state;
      
      const isPlayer = targetPlayerId === state.combatState.player.playerId;
      const targetState = isPlayer ? state.combatState.player : state.combatState.opponent;
      
      const updatedEffects = applyStatusEffect(targetState, effectType, duration, value);
      
      
      if (isPlayer) {
        return {
          ...state,
          combatState: {
            ...state.combatState,
            player: {
              ...state.combatState.player,
              statusEffects: updatedEffects
            }
          }
        };
      } else {
        return {
          ...state,
          combatState: {
            ...state.combatState,
            opponent: {
              ...state.combatState.opponent,
              statusEffects: updatedEffects
            }
          }
        };
      }
    });
  },
  
  applyDirectDamage: (targetPlayerId, damage, sourceDescription) => {
    set(state => {
      if (!state.combatState) return state;
      
      const isPlayer = targetPlayerId === 'player';
      const target = isPlayer ? state.combatState.player : state.combatState.opponent;
      
      const newHealth = Math.max(0, target.pet.stats.currentHealth - damage);
      const actualDamage = target.pet.stats.currentHealth - newHealth;
      
      // MINION DAMAGE IS PERMANENT - applied directly to currentHealth
      // This damage persists regardless of poker outcome because:
      // 1. It's deducted from currentHealth immediately
      // 2. When poker resolves, winner only gets their BET back (not healing)
      // 3. The minion damage stays as reduced maxHealth potential
      
      // Log to activity feed
      logActivity('hero_damage', isPlayer ? 'opponent' : 'player', `${sourceDescription || 'Attack'} dealt ${actualDamage} damage`, {
        value: actualDamage,
        targetName: target.playerName
      });
      
      if (isPlayer) {
        return {
          ...state,
          combatState: {
            ...state.combatState,
            player: {
              ...state.combatState.player,
              pet: {
                ...state.combatState.player.pet,
                stats: {
                  ...state.combatState.player.pet.stats,
                  currentHealth: newHealth
                }
              }
            }
          }
        };
      } else {
        return {
          ...state,
          combatState: {
            ...state.combatState,
            opponent: {
              ...state.combatState.opponent,
              pet: {
                ...state.combatState.opponent.pet,
                stats: {
                  ...state.combatState.opponent.pet.stats,
                  currentHealth: newHealth
                }
              }
            }
          }
        };
      }
    });
  }
}));

/**
 * Shared selectors for Ragnarok betting rules
 * These ensure consistent behavior across all UI components
 */
export interface ActionPermissions {
  isPreForesight: boolean; // True during SPELL_PET phase (legacy name for compatibility)
  hasBetToCall: boolean;
  toCall: number;
  availableHP: number;
  minBet: number;
  canCheck: boolean;
  canBet: boolean;
  canCall: boolean;
  canRaise: boolean;
  canFold: boolean;
  maxBetAmount: number;
  isAllIn: boolean;
  isMyTurnToAct: boolean; // True only if it's this player's turn based on position and ready states
  waitingForOpponent: boolean; // True if waiting for opponent to act first
}

/**
 * Get action permissions for a player based on current combat state
 * Single source of truth for Ragnarok betting rules
 */
export function getActionPermissions(
  combatState: PokerCombatState | null,
  isPlayer: boolean = true
): ActionPermissions | null {
  if (!combatState) return null;
  
  const actor = isPlayer ? combatState.player : combatState.opponent;
  const opponent = isPlayer ? combatState.opponent : combatState.player;
  const minBet = combatState.minBet || 5;
  
  // Calculate betting state
  // Use blindPosted (not hpCommitted) for call calculation because ante doesn't count as a bet
  // blindPosted tracks: blind amount + any additional bets made in current round
  const toCall = Math.max(0, combatState.currentBet - actor.blindPosted);
  const hasBetToCall = toCall > 0;
  // HP is already deducted when committed, so availableHP = currentHealth capped by stamina (don't double-count)
  // STAMINA CAP: STA limits max bet - 1 STA = 10 HP max bet
  const actorCurrentHP = Math.max(0, actor.pet.stats.currentHealth);
  const actorStaminaCap = actor.pet.stats.currentStamina * 10;
  const availableHP = Math.min(actorCurrentHP, actorStaminaCap);
  
  // Ragnarok betting rules:
  // - SPELL_PET: Card-playing phase with betting available (blinds collected at start)
  // - FAITH/FORESIGHT/DESTINY: Normal betting rounds - check allowed when no bet to call
  const isResolution = combatState.phase === CombatPhase.RESOLUTION;
  
  // CRITICAL: Determine if it's this player's turn to act based on position
  // Rule: SB always acts first (openerIsPlayer = player is SB = player acts first)
  // In heads-up poker, SB acts first preflop and in all subsequent rounds
  // Turn order:
  // - If neither has acted: opener (SB) goes first
  // - If opener acted (isReady=true), non-opener responds
  // - If both ready, round is complete
  const isActorOpener = isPlayer ? combatState.openerIsPlayer : !combatState.openerIsPlayer;
  const actorIsReady = actor.isReady;
  const opponentIsReady = opponent.isReady;
  
  let isMyTurnToAct = false;
  let waitingForOpponent = false;
  
  if (isResolution || combatState.foldWinner) {
    // Resolution phase - no actions allowed
    isMyTurnToAct = false;
    waitingForOpponent = false;
  } else if (actorIsReady) {
    // Already acted this round - waiting for round to close or opponent to respond
    isMyTurnToAct = false;
    waitingForOpponent = !opponentIsReady;
  } else if (!opponentIsReady) {
    // Neither has acted yet - only opener (SB) can act
    isMyTurnToAct = isActorOpener;
    waitingForOpponent = !isActorOpener; // Non-opener waits for opener
  } else {
    // Opponent already acted, I haven't - it's my turn to respond
    isMyTurnToAct = true;
    waitingForOpponent = false;
  }
  
  // Debug: Log turn order state (only for player)
  if (isPlayer && combatState.phase !== CombatPhase.SPELL_PET && combatState.phase !== CombatPhase.MULLIGAN) {
  }
  
  // Button visibility rules - these determine IF buttons render (not if they're clickable)
  // Buttons should always be visible during betting phases, just disabled when not your turn
  
  // Check allowed in any phase (including SPELL_PET) when no bet to call
  const canCheck = !hasBetToCall && !isResolution;
  
  // Bet available when no current bet and have enough HP
  const canBet = !hasBetToCall && availableHP >= minBet && !isResolution;
  
  // Call available when there IS a bet to call
  const canCall = hasBetToCall && availableHP > 0 && !isResolution;
  const actualCallAmount = Math.min(toCall, availableHP);
  const isAllIn = actualCallAmount < toCall;
  
  // Raise requires enough HP to call + minimum raise
  const canRaise = hasBetToCall && (toCall + minBet) <= availableHP && !isResolution;
  
  // Fold available when there's a bet to call (can't fold if you can check for free)
  // Allowed in any phase including SPELL_PET if someone has bet
  const canFold = !isResolution && hasBetToCall;
  
  // Max bet/raise amount
  const maxBetAmount = hasBetToCall 
    ? Math.max(0, availableHP - toCall) // After calling, what's left for raise
    : availableHP; // Full HP available for bet
  
  return {
    isPreForesight: combatState.phase === CombatPhase.SPELL_PET, // Legacy name for compatibility
    hasBetToCall,
    toCall,
    availableHP,
    minBet,
    canCheck,
    canBet,
    canCall,
    canRaise,
    canFold,
    maxBetAmount,
    isAllIn,
    isMyTurnToAct,
    waitingForOpponent
  };
}

/**
 * Check if an action is valid in the current state
 * Used for store-level validation
 */
export function isActionValid(
  combatState: PokerCombatState | null,
  action: CombatAction,
  isPlayer: boolean = true
): { valid: boolean; reason?: string } {
  const permissions = getActionPermissions(combatState, isPlayer);
  if (!permissions) return { valid: false, reason: 'No combat state' };
  
  switch (action) {
    case CombatAction.DEFEND: // Check
      if (!permissions.canCheck) {
        if (permissions.isPreForesight) {
          return { valid: false, reason: 'Cannot check during SPELL_PET phase' };
        }
        if (permissions.hasBetToCall) {
          return { valid: false, reason: 'Cannot check when there is a bet to call' };
        }
      }
      return { valid: true };
      
    case CombatAction.ATTACK: // Bet
      if (!permissions.canBet) {
        return { valid: false, reason: `Cannot bet - need at least ${permissions.minBet} HP available` };
      }
      return { valid: true };
      
    case CombatAction.ENGAGE: // Call
      if (!permissions.canCall) {
        return { valid: false, reason: 'Cannot call - no bet to call or insufficient HP' };
      }
      return { valid: true };
      
    case CombatAction.COUNTER_ATTACK: // Raise
      if (!permissions.canRaise) {
        return { valid: false, reason: 'Cannot raise - insufficient HP for call + minimum raise' };
      }
      return { valid: true };
      
    case CombatAction.BRACE: // Fold
      return { valid: true };
      
    default:
      return { valid: false, reason: 'Unknown action' };
  }
}
