/**
 * UnifiedCombatStore - Consolidated Combat State
 * 
 * Combines poker combat, chess board, attacks, and shared deck state
 * into a single coherent store for all combat operations.
 * 
 * This store is composed from domain-specific slices for better organization
 * while maintaining a unified API for consumers.
 */

import { create } from 'zustand';
import { 
  createSharedCombatSlice, 
  createPokerCombatSlice, 
  createChessCombatSlice, 
  createMinionBattleSlice, 
  turnManager,
  initialBoardState,
  UnifiedCombatStore,
  CombatPhase,
  PokerPhase,
  PokerState,
  ChessPieceState,
  SharedDeckState,
  InstantKillEvent,
  PendingAttackAnimation,
  CombatLogEntry
} from './combat';

export type { 
  CombatPhase, 
  PokerPhase, 
  PokerState, 
  ChessPieceState, 
  SharedDeckState, 
  InstantKillEvent, 
  PendingAttackAnimation, 
  CombatLogEntry,
  UnifiedCombatStore
};

export const useUnifiedCombatStore = create<UnifiedCombatStore>()((set, get, api) => ({
  ...createSharedCombatSlice(set, get, api),
  ...createPokerCombatSlice(set, get, api),
  ...createChessCombatSlice(set, get, api),
  ...createMinionBattleSlice(set, get, api),
  
  reset: () => {
    turnManager.reset();
    set({
      combatPhase: 'SETUP',
      pokerState: null,
      chessPieces: [],
      battlefield: null,
      sharedDeck: null,
      turnState: null,
      combatLog: [],
      pendingAnimations: [],
      boardState: initialBoardState,
      pendingCombat: null,
      lastInstantKill: null,
      pendingAttackAnimation: null,
      playerArmy: null,
      opponentArmy: null,
      sharedDeckCardIds: [],
      pokerCombatState: null,
      pokerDeck: [],
      pokerIsActive: false,
      mulliganComplete: false,
      isTransitioningHand: false,
    });
  },
}));
