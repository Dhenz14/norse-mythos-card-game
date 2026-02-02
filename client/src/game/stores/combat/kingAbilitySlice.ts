/**
 * KingAbilitySlice - King Divine Command System state and actions
 * 
 * Manages the landmine/trap system for kings on the chess board.
 * Each king can place hidden mines that drain opponent STA when triggered.
 * 
 * Architecture: Zustand slice pattern following TSX → Hook → Store → Utils
 * Imports from: utils/chess/kingAbilityUtils.ts (pure functions only)
 */

import { StateCreator } from 'zustand';
import { 
  ChessBoardPosition,
  ActiveMine,
  KingDivineCommandState
} from '../../types/ChessTypes';
import {
  getKingAbilityConfig,
  isValidMinePlacement,
  checkMineTrigger,
  calculateMinePenalty,
  getActiveMines,
  createMine,
  MineDirection
} from '../../utils/chess/kingAbilityUtils';
import { 
  KingAbilitySlice,
  UnifiedCombatStore
} from './types';

const createInitialKingState = (kingId: string): KingDivineCommandState => {
  const config = getKingAbilityConfig(kingId);
  return {
    kingId,
    abilityConfig: config,
    minesRemaining: config?.maxUsesPerGame ?? 5,
    activeMines: [],
    canPlaceThisTurn: true,
    hasPlacedThisTurn: false
  };
};

export const createKingAbilitySlice: StateCreator<
  UnifiedCombatStore,
  [],
  [],
  KingAbilitySlice
> = (set, get) => ({
  playerKingAbility: null,
  opponentKingAbility: null,
  allActiveMines: [],
  minePlacementMode: false,
  selectedMineDirection: null,
  lastMineTriggered: null,

  initializeKingAbilities: (playerKingId: string, opponentKingId: string) => {
    const playerState = createInitialKingState(playerKingId);
    const opponentState = createInitialKingState(opponentKingId);
    
    set({
      playerKingAbility: playerState,
      opponentKingAbility: opponentState,
      allActiveMines: [],
      minePlacementMode: false,
      selectedMineDirection: null,
      lastMineTriggered: null
    });

    console.log('[KingAbility] Initialized:', { playerKingId, opponentKingId });
  },

  placeMine: (
    owner: 'player' | 'opponent',
    centerPosition: ChessBoardPosition,
    direction?: MineDirection
  ): boolean => {
    const state = get();
    const kingState = owner === 'player' 
      ? state.playerKingAbility 
      : state.opponentKingAbility;
    
    if (!kingState || !kingState.abilityConfig) {
      console.warn('[KingAbility] No king ability configured for', owner);
      return false;
    }

    if (kingState.minesRemaining <= 0) {
      console.warn('[KingAbility] No mines remaining for', owner);
      return false;
    }

    if (kingState.hasPlacedThisTurn) {
      console.warn('[KingAbility] Already placed mine this turn for', owner);
      return false;
    }

    const ownPieces = state.boardState.pieces
      .filter(p => p.owner === owner)
      .map(p => p.position);
    
    const validation = isValidMinePlacement(
      centerPosition,
      kingState.kingId,
      state.allActiveMines,
      ownPieces,
      direction
    );

    if (!validation.valid) {
      console.warn('[KingAbility] Invalid placement:', validation.reason);
      return false;
    }

    const currentTurn = state.boardState.moveCount;
    const enemySide = owner === 'player' ? 'opponent' : 'player';
    const newMine = createMine(
      kingState.kingId,
      owner,
      centerPosition,
      currentTurn,
      direction,
      enemySide
    );

    if (!newMine) {
      console.warn('[KingAbility] Failed to create mine');
      return false;
    }

    const updatedKingState: KingDivineCommandState = {
      ...kingState,
      minesRemaining: kingState.minesRemaining - 1,
      hasPlacedThisTurn: true,
      activeMines: [...kingState.activeMines, newMine]
    };

    set({
      [owner === 'player' ? 'playerKingAbility' : 'opponentKingAbility']: updatedKingState,
      allActiveMines: [...state.allActiveMines, newMine],
      minePlacementMode: false,
      selectedMineDirection: null
    });

    console.log('[KingAbility] Mine placed:', {
      owner,
      kingId: kingState.kingId,
      position: centerPosition,
      affectedTiles: newMine.affectedTiles.length,
      remaining: updatedKingState.minesRemaining
    });

    state.addLogEntry({
      id: `mine_placed_${Date.now()}`,
      timestamp: Date.now(),
      type: 'ability',
      message: `${owner === 'player' ? 'Player' : 'Opponent'} king placed a Divine Command trap`
    });

    return true;
  },

  checkAndTriggerMine: (
    landingPosition: ChessBoardPosition,
    movingPieceOwner: 'player' | 'opponent',
    movingPieceId: string
  ) => {
    const state = get();
    const triggeredMine = checkMineTrigger(
      landingPosition,
      state.allActiveMines,
      movingPieceOwner
    );

    if (!triggeredMine) {
      return null;
    }

    const staPenalty = calculateMinePenalty(triggeredMine, landingPosition);

    const updatedMines = state.allActiveMines.map(mine =>
      mine.id === triggeredMine.id
        ? { ...mine, triggered: true }
        : mine
    );

    const ownerKey = triggeredMine.owner === 'player' 
      ? 'playerKingAbility' 
      : 'opponentKingAbility';
    const kingState = state[ownerKey];
    
    if (kingState) {
      const updatedKingMines = kingState.activeMines.map(mine =>
        mine.id === triggeredMine.id
          ? { ...mine, triggered: true }
          : mine
      );
      
      set({
        [ownerKey]: {
          ...kingState,
          activeMines: updatedKingMines
        }
      });
    }

    set({
      allActiveMines: updatedMines,
      lastMineTriggered: { mine: triggeredMine, targetPieceId: movingPieceId }
    });

    console.log('[KingAbility] Mine triggered!', {
      mineOwner: triggeredMine.owner,
      victim: movingPieceOwner,
      staPenalty,
      position: landingPosition
    });

    state.addLogEntry({
      id: `mine_triggered_${Date.now()}`,
      timestamp: Date.now(),
      type: 'ability',
      message: `Divine Command trap triggered! ${movingPieceOwner === 'player' ? 'Player' : 'Opponent'} loses ${staPenalty} STA`
    });

    return { triggered: true, staPenalty };
  },

  clearExpiredMines: (currentTurn: number) => {
    const state = get();
    const activeMines = getActiveMines(state.allActiveMines, currentTurn);
    
    const expiredCount = state.allActiveMines.length - activeMines.length;
    if (expiredCount > 0) {
      console.log('[KingAbility] Cleared expired mines:', expiredCount);
    }

    const playerKingState = state.playerKingAbility;
    const opponentKingState = state.opponentKingAbility;

    set({
      allActiveMines: activeMines,
      playerKingAbility: playerKingState ? {
        ...playerKingState,
        activeMines: playerKingState.activeMines.filter(m => !m.triggered && m.expiresOnTurn > currentTurn),
        hasPlacedThisTurn: false,
        canPlaceThisTurn: true
      } : null,
      opponentKingAbility: opponentKingState ? {
        ...opponentKingState,
        activeMines: opponentKingState.activeMines.filter(m => !m.triggered && m.expiresOnTurn > currentTurn),
        hasPlacedThisTurn: false,
        canPlaceThisTurn: true
      } : null
    });
  },

  setMinePlacementMode: (enabled: boolean) => {
    set({ 
      minePlacementMode: enabled,
      selectedMineDirection: enabled ? null : get().selectedMineDirection
    });
  },

  setSelectedMineDirection: (direction: MineDirection | null) => {
    set({ selectedMineDirection: direction });
  },

  resetKingAbilities: () => {
    set({
      playerKingAbility: null,
      opponentKingAbility: null,
      allActiveMines: [],
      minePlacementMode: false,
      selectedMineDirection: null,
      lastMineTriggered: null
    });
  },

  canPlaceMine: (owner: 'player' | 'opponent'): boolean => {
    const state = get();
    const kingState = owner === 'player' 
      ? state.playerKingAbility 
      : state.opponentKingAbility;
    
    if (!kingState || !kingState.abilityConfig) return false;
    if (kingState.minesRemaining <= 0) return false;
    if (kingState.hasPlacedThisTurn) return false;
    if (state.boardState.currentTurn !== owner) return false;
    
    return true;
  },

  getMinesForOwner: (owner: 'player' | 'opponent'): ActiveMine[] => {
    const state = get();
    return state.allActiveMines.filter(m => m.owner === owner && !m.triggered);
  },

  getVisibleMines: (viewerSide: 'player' | 'opponent'): ActiveMine[] => {
    const state = get();
    return state.allActiveMines.filter(m => m.owner === viewerSide && !m.triggered);
  }
});
