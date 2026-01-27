/**
 * ChessBoardStore.ts
 * 
 * Zustand store for Ragnarok Chess state management.
 * Handles board positions, piece tracking, turn management, and +1 stamina per move.
 */

import { create } from 'zustand';
import { 
  ChessPiece, 
  ChessBoardPosition, 
  ChessBoardState, 
  ChessPlayerSide,
  ChessGameStatus,
  ChessPieceType,
  ChessCollision,
  CombatResult,
  BOARD_ROWS,
  BOARD_COLS,
  PIECE_MOVEMENT_PATTERNS,
  PIECE_BASE_STATS,
  PLAYER_INITIAL_POSITIONS,
  OPPONENT_INITIAL_POSITIONS,
  ArmySelection,
  ElementType
} from '../types/ChessTypes';
import { NorseElement, NORSE_TO_GAME_ELEMENT } from '../types/NorseTypes';
import { 
  CHESS_PIECE_HEROES, 
  getDefaultArmySelection,
  pieceHasSpells 
} from '../data/ChessPieceConfig';
import { v4 as uuidv4 } from 'uuid';

interface InstantKillEvent {
  position: ChessBoardPosition;
  attackerType: ChessPieceType;
  timestamp: number;
}

interface PendingAttackAnimation {
  attacker: ChessPiece;
  defender: ChessPiece;
  attackerPosition: ChessBoardPosition;
  defenderPosition: ChessBoardPosition;
  isInstantKill: boolean;
  timestamp: number;
}

interface ChessBoardStore {
  boardState: ChessBoardState;
  playerArmy: ArmySelection | null;
  opponentArmy: ArmySelection | null;
  sharedDeckCardIds: number[];
  pendingCombat: ChessCollision | null;
  lastInstantKill: InstantKillEvent | null;
  pendingAttackAnimation: PendingAttackAnimation | null;
  
  initializeBoard: (playerArmy: ArmySelection, opponentArmy: ArmySelection) => void;
  selectPiece: (piece: ChessPiece | null) => void;
  movePiece: (to: ChessBoardPosition) => ChessCollision | null;
  executeMove: (from: ChessBoardPosition, to: ChessBoardPosition) => void;
  executeInstantKill: (attacker: ChessPiece, defender: ChessPiece, targetPosition: ChessBoardPosition) => void;
  
  getValidMoves: (piece: ChessPiece) => { moves: ChessBoardPosition[]; attacks: ChessBoardPosition[] };
  getPieceAt: (position: ChessBoardPosition) => ChessPiece | null;
  
  // Check/Checkmate detection (Kings cannot be attacked - like real chess)
  isKingInCheck: (side: ChessPlayerSide, pieces?: ChessPiece[]) => boolean;
  isCheckmate: (side: ChessPlayerSide) => boolean;
  getThreateningPieces: (kingPosition: ChessBoardPosition, attackerSide: ChessPlayerSide, pieces?: ChessPiece[]) => ChessPiece[];
  updateCheckStatus: () => void;
  
  resolveCombat: (result: CombatResult) => void;
  removePiece: (pieceId: string) => void;
  updatePieceHealth: (pieceId: string, newHealth: number) => void;
  updatePieceStamina: (pieceId: string, newStamina: number) => void;
  
  incrementAllStamina: () => void;
  nextTurn: () => void;
  checkWinCondition: () => ChessGameStatus;
  checkPawnPromotion: (piece: ChessPiece) => boolean;
  promotePawn: (pieceId: string, newType: ChessPieceType) => void;
  
  executeAITurn: () => void;
  
  setGameStatus: (status: ChessGameStatus) => void;
  setSharedDeck: (cardIds: number[]) => void;
  clearPendingCombat: () => void;
  resetBoard: () => void;
  
  startAttackAnimation: (attacker: ChessPiece, defender: ChessPiece, isInstantKill: boolean) => void;
  completeAttackAnimation: () => void;
  clearAttackAnimation: () => void;
}

const initialBoardState: ChessBoardState = {
  pieces: [],
  currentTurn: 'player',
  selectedPiece: null,
  validMoves: [],
  attackMoves: [],
  gameStatus: 'setup',
  moveCount: 0,
  inCheck: null
};

export const useChessBoardStore = create<ChessBoardStore>((set, get) => ({
  boardState: initialBoardState,
  playerArmy: null,
  opponentArmy: null,
  sharedDeckCardIds: [],
  pendingCombat: null,
  lastInstantKill: null,
  pendingAttackAnimation: null,

  initializeBoard: (playerArmy: ArmySelection, opponentArmy: ArmySelection) => {
    const pieces: ChessPiece[] = [];
    
    const createPiece = (
      type: ChessPieceType,
      owner: ChessPlayerSide,
      position: ChessBoardPosition,
      army: ArmySelection
    ): ChessPiece => {
      const stats = PIECE_BASE_STATS[type];
      let hero = type === 'pawn' 
        ? CHESS_PIECE_HEROES.pawn[0]
        : army[type as keyof ArmySelection];
      
      const heroElement = hero.element as NorseElement | undefined;
      const gameElement: ElementType = heroElement 
        ? NORSE_TO_GAME_ELEMENT[heroElement] 
        : 'neutral';
      
      return {
        id: uuidv4(),
        type,
        owner,
        position,
        health: stats.baseHealth,
        maxHealth: stats.baseHealth,
        stamina: Math.floor(stats.baseHealth / 10), // Start with full stamina (10 HP = 1 STA)
        heroClass: hero.heroClass,
        heroName: hero.name,
        heroPortrait: hero.portrait,
        fixedCards: hero.fixedCardIds,
        hasSpells: pieceHasSpells(type),
        hasMoved: false,
        element: gameElement
      };
    };

    PLAYER_INITIAL_POSITIONS.forEach(pos => {
      pieces.push(createPiece(
        pos.type,
        'player',
        { row: pos.row, col: pos.col },
        playerArmy
      ));
    });

    OPPONENT_INITIAL_POSITIONS.forEach(pos => {
      pieces.push(createPiece(
        pos.type,
        'opponent',
        { row: pos.row, col: pos.col },
        opponentArmy
      ));
    });

    set({
      boardState: {
        pieces,
        currentTurn: 'player',
        selectedPiece: null,
        validMoves: [],
        attackMoves: [],
        gameStatus: 'playing',
        moveCount: 0,
        inCheck: null
      },
      playerArmy,
      opponentArmy
    });
  },

  selectPiece: (piece: ChessPiece | null) => {
    const state = get();
    
    if (!piece) {
      set({
        boardState: {
          ...state.boardState,
          selectedPiece: null,
          validMoves: [],
          attackMoves: []
        }
      });
      return;
    }

    if (piece.owner !== state.boardState.currentTurn) {
      return;
    }

    const { moves, attacks } = state.getValidMoves(piece);

    set({
      boardState: {
        ...state.boardState,
        selectedPiece: piece,
        validMoves: moves,
        attackMoves: attacks
      }
    });
  },

  movePiece: (to: ChessBoardPosition): ChessCollision | null => {
    const state = get();
    const { selectedPiece, validMoves, attackMoves } = state.boardState;

    if (!selectedPiece) return null;
    
    // Block moves while attack animation is in progress
    if (state.pendingAttackAnimation) {
      console.log('[Chess] Move blocked - attack animation in progress');
      return null;
    }

    const isValidMove = validMoves.some(m => m.row === to.row && m.col === to.col);
    const isAttackMove = attackMoves.some(m => m.row === to.row && m.col === to.col);

    if (!isValidMove && !isAttackMove) return null;

    if (isAttackMove) {
      const defender = state.getPieceAt(to);
      if (defender) {
        const collision: ChessCollision = {
          attacker: selectedPiece,
          defender,
          attackerPosition: selectedPiece.position,
          defenderPosition: to
        };
        
        // Pawns and Kings have instant-kill attacks (Valkyrie weapon - no PvP combat)
        // Also, pawns are weak and can be instant-killed by any attacker
        const isInstantKillAttacker = selectedPiece.type === 'pawn' || selectedPiece.type === 'king';
        const isInstantKillDefender = defender.type === 'pawn';
        const isInstantKill = isInstantKillAttacker || isInstantKillDefender;
        
        if (isInstantKill) {
          const reason = isInstantKillAttacker 
            ? `${selectedPiece.type} uses Valkyrie weapon` 
            : `pawn is weak and cannot defend`;
          console.log(`[Chess] Instant kill queued: ${selectedPiece.heroName} -> ${defender.heroName} (${reason})`);
          collision.instantKill = true;
        }
        
        // Start attack animation - actual combat/kill happens after animation completes
        state.startAttackAnimation(selectedPiece, defender, isInstantKill);
        
        // Clear selection while animation plays
        set({
          boardState: {
            ...state.boardState,
            selectedPiece: null,
            validMoves: [],
            attackMoves: []
          }
        });
        
        return collision;
      }
    }

    state.executeMove(selectedPiece.position, to);
    return null;
  },

  executeMove: (from: ChessBoardPosition, to: ChessBoardPosition) => {
    const state = get();
    
    let movedPieceId: string | null = null;
    const updatedPieces = state.boardState.pieces.map(piece => {
      if (piece.position.row === from.row && piece.position.col === from.col) {
        movedPieceId = piece.id;
        return {
          ...piece,
          position: to,
          hasMoved: true
        };
      }
      return piece;
    });

    set({
      boardState: {
        ...state.boardState,
        pieces: updatedPieces,
        selectedPiece: null,
        validMoves: [],
        attackMoves: [],
        moveCount: state.boardState.moveCount + 1
      }
    });

    get().incrementAllStamina();
    
    if (movedPieceId) {
      const movedPiece = get().boardState.pieces.find(p => p.id === movedPieceId);
      if (movedPiece && get().checkPawnPromotion(movedPiece)) {
        console.log(`[Chess] Pawn promoted to Queen at (${movedPiece.position.row}, ${movedPiece.position.col})`);
        get().promotePawn(movedPieceId, 'queen');
      }
    }
    
    // Update check status after the move
    get().updateCheckStatus();
    
    // Only continue if game is still playing (not checkmate)
    if (get().boardState.gameStatus === 'playing') {
      get().nextTurn();
    }
  },

  executeInstantKill: (attacker: ChessPiece, defender: ChessPiece, targetPosition: ChessBoardPosition) => {
    const state = get();
    
    // Remove defender from the board
    const piecesAfterKill = state.boardState.pieces.filter(p => p.id !== defender.id);
    
    // Move attacker to defender's position
    const updatedPieces = piecesAfterKill.map(piece => {
      if (piece.id === attacker.id) {
        return {
          ...piece,
          position: targetPosition,
          hasMoved: true
        };
      }
      return piece;
    });

    set({
      pendingCombat: null, // Ensure no stale combat state for instant-kill
      lastInstantKill: {
        position: targetPosition,
        attackerType: attacker.type,
        timestamp: Date.now()
      },
      boardState: {
        ...state.boardState,
        pieces: updatedPieces,
        selectedPiece: null,
        validMoves: [],
        attackMoves: [],
        moveCount: state.boardState.moveCount + 1
      }
    });

    get().incrementAllStamina();
    
    // Check for pawn promotion after instant kill
    const movedPiece = get().boardState.pieces.find(p => p.id === attacker.id);
    if (movedPiece && get().checkPawnPromotion(movedPiece)) {
      console.log(`[Chess] Pawn promoted to Queen at (${movedPiece.position.row}, ${movedPiece.position.col})`);
      get().promotePawn(attacker.id, 'queen');
    }
    
    // Check win condition after capture
    const winStatus = get().checkWinCondition();
    if (winStatus !== 'playing') {
      console.log(`[Chess] Game over: ${winStatus}`);
      set({ boardState: { ...get().boardState, gameStatus: winStatus } });
      return;
    }
    
    // Update check status after the kill
    get().updateCheckStatus();
    
    // Continue to next turn if game is still playing
    if (get().boardState.gameStatus === 'playing') {
      get().nextTurn();
    }
  },

  getValidMoves: (piece: ChessPiece) => {
    const state = get();
    let moves: ChessBoardPosition[] = [];
    let attacks: ChessBoardPosition[] = [];
    const pattern = PIECE_MOVEMENT_PATTERNS[piece.type];
    const { inCheck } = state.boardState;

    const isValidPosition = (row: number, col: number) => {
      return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
    };

    const checkPosition = (row: number, col: number): 'empty' | 'ally' | 'enemy' | 'enemy_king' | 'invalid' => {
      if (!isValidPosition(row, col)) return 'invalid';
      const pieceAt = state.getPieceAt({ row, col });
      if (!pieceAt) return 'empty';
      if (pieceAt.owner === piece.owner) return 'ally';
      // Enemy King cannot be attacked - this creates CHECK instead
      if (pieceAt.type === 'king') return 'enemy_king';
      return 'enemy';
    };

    // Helper: Check if a simulated move would leave our King in check
    const wouldLeaveKingInCheck = (targetPos: ChessBoardPosition, isCapture: boolean): boolean => {
      // Simulate the move
      const capturedPiece = isCapture ? state.getPieceAt(targetPos) : null;
      const simulatedPieces = state.boardState.pieces
        .filter(p => !capturedPiece || p.id !== capturedPiece.id)
        .map(p => p.id === piece.id ? { ...p, position: targetPos } : p);
      
      return state.isKingInCheck(piece.owner, simulatedPieces);
    };

    if (!pattern.directions) return { moves, attacks };

    // Handle pawn movement separately - direction depends on owner
    if (piece.type === 'pawn') {
      const forwardDir = piece.owner === 'player' ? 1 : -1;
      const forwardRow = piece.position.row + forwardDir;
      
      if (checkPosition(forwardRow, piece.position.col) === 'empty') {
        moves.push({ row: forwardRow, col: piece.position.col });
      }
      
      const leftAttack = { row: forwardRow, col: piece.position.col - 1 };
      const rightAttack = { row: forwardRow, col: piece.position.col + 1 };

      // Pawns can attack enemies but NOT enemy Kings
      if (checkPosition(leftAttack.row, leftAttack.col) === 'enemy') {
        attacks.push(leftAttack);
      }
      if (checkPosition(rightAttack.row, rightAttack.col) === 'enemy') {
        attacks.push(rightAttack);
      }
    } else {
      // Handle all other piece types
      for (const dir of pattern.directions) {
        if (pattern.type === 'line') {
          let currentRow = piece.position.row + dir.row;
          let currentCol = piece.position.col + dir.col;

          while (isValidPosition(currentRow, currentCol)) {
            const status = checkPosition(currentRow, currentCol);
            
            if (status === 'empty') {
              moves.push({ row: currentRow, col: currentCol });
            } else if (status === 'enemy') {
              // Can attack enemy pieces (but not Kings)
              attacks.push({ row: currentRow, col: currentCol });
              break;
            } else if (status === 'enemy_king') {
              // Cannot attack enemy King - blocked here (creates check instead)
              break;
            } else {
              break;
            }

            currentRow += dir.row;
            currentCol += dir.col;
          }
        } else {
          const targetRow = piece.position.row + dir.row;
          const targetCol = piece.position.col + dir.col;
          const status = checkPosition(targetRow, targetCol);

          if (status === 'empty') {
            moves.push({ row: targetRow, col: targetCol });
          } else if (status === 'enemy') {
            // Can attack enemy pieces (but not Kings)
            attacks.push({ row: targetRow, col: targetCol });
          }
          // enemy_king: cannot attack, no move added
        }
      }
    }

    // CRITICAL: Filter ALL moves to ensure they don't leave our King in check
    // This applies to every piece type, not just Kings
    const safeMoves: ChessBoardPosition[] = [];
    const safeAttacks: ChessBoardPosition[] = [];
    
    for (const move of moves) {
      if (!wouldLeaveKingInCheck(move, false)) {
        safeMoves.push(move);
      }
    }
    
    for (const attack of attacks) {
      if (!wouldLeaveKingInCheck(attack, true)) {
        safeAttacks.push(attack);
      }
    }
    
    return { moves: safeMoves, attacks: safeAttacks };
  },

  getPieceAt: (position: ChessBoardPosition): ChessPiece | null => {
    const state = get();
    return state.boardState.pieces.find(
      p => p.position.row === position.row && p.position.col === position.col
    ) || null;
  },

  // Check if a specific position can be attacked by pieces of a given side
  getThreateningPieces: (kingPosition: ChessBoardPosition, attackerSide: ChessPlayerSide, pieces?: ChessPiece[]): ChessPiece[] => {
    const state = get();
    const boardPieces = pieces || state.boardState.pieces;
    const threateners: ChessPiece[] = [];
    
    const attackerPieces = boardPieces.filter(p => p.owner === attackerSide);
    
    for (const piece of attackerPieces) {
      const pattern = PIECE_MOVEMENT_PATTERNS[piece.type];
      if (!pattern.directions) continue;
      
      // Check if this piece can attack the king's position
      if (piece.type === 'pawn') {
        // Pawn attacks diagonally
        const forwardDir = piece.owner === 'player' ? 1 : -1;
        const leftAttack = { row: piece.position.row + forwardDir, col: piece.position.col - 1 };
        const rightAttack = { row: piece.position.row + forwardDir, col: piece.position.col + 1 };
        
        if ((leftAttack.row === kingPosition.row && leftAttack.col === kingPosition.col) ||
            (rightAttack.row === kingPosition.row && rightAttack.col === kingPosition.col)) {
          threateners.push(piece);
        }
      } else if (pattern.type === 'line') {
        // Line pieces (queen, rook, bishop) - check if king is in line of sight
        for (const dir of pattern.directions) {
          let currentRow = piece.position.row + dir.row;
          let currentCol = piece.position.col + dir.col;
          
          while (currentRow >= 0 && currentRow < BOARD_ROWS && currentCol >= 0 && currentCol < BOARD_COLS) {
            if (currentRow === kingPosition.row && currentCol === kingPosition.col) {
              threateners.push(piece);
              break;
            }
            // Check if blocked by another piece
            const blockingPiece = boardPieces.find(p => 
              p.position.row === currentRow && p.position.col === currentCol
            );
            if (blockingPiece) break;
            
            currentRow += dir.row;
            currentCol += dir.col;
          }
        }
      } else {
        // Surround/point pieces (king, knight) - check single step
        for (const dir of pattern.directions) {
          const targetRow = piece.position.row + dir.row;
          const targetCol = piece.position.col + dir.col;
          
          if (targetRow === kingPosition.row && targetCol === kingPosition.col) {
            threateners.push(piece);
            break;
          }
        }
      }
    }
    
    return threateners;
  },

  // Check if a side's King is in check
  isKingInCheck: (side: ChessPlayerSide, pieces?: ChessPiece[]): boolean => {
    const state = get();
    const boardPieces = pieces || state.boardState.pieces;
    const king = boardPieces.find(p => p.type === 'king' && p.owner === side);
    
    if (!king) return false;
    
    const enemySide = side === 'player' ? 'opponent' : 'player';
    const threateners = state.getThreateningPieces(king.position, enemySide, boardPieces);
    
    return threateners.length > 0;
  },

  // Check if a side is in checkmate (King in check and no legal moves available)
  isCheckmate: (side: ChessPlayerSide): boolean => {
    const state = get();
    
    // First check if the king is actually in check
    if (!state.isKingInCheck(side)) return false;
    
    // Check if ANY piece of this side has a legal move
    // getValidMoves already filters moves that would leave King in check
    const sidePieces = state.boardState.pieces.filter(p => p.owner === side);
    
    for (const piece of sidePieces) {
      const { moves, attacks } = state.getValidMoves(piece);
      if (moves.length > 0 || attacks.length > 0) {
        // Found a legal move - not checkmate
        return false;
      }
    }
    
    // No legal moves available while in check - checkmate
    console.log(`[Chess] CHECKMATE! ${side} has no legal moves while in check`);
    return true;
  },

  // Update the check status after each move
  updateCheckStatus: () => {
    const state = get();
    
    const playerInCheck = state.isKingInCheck('player');
    const opponentInCheck = state.isKingInCheck('opponent');
    
    let newCheckStatus: ChessPlayerSide | null = null;
    if (playerInCheck) newCheckStatus = 'player';
    else if (opponentInCheck) newCheckStatus = 'opponent';
    
    // Check for checkmate
    if (playerInCheck && state.isCheckmate('player')) {
      console.log('[Chess] Player is checkmated - opponent wins');
      set({
        boardState: {
          ...state.boardState,
          inCheck: 'player',
          gameStatus: 'opponent_wins'
        }
      });
      return;
    }
    
    if (opponentInCheck && state.isCheckmate('opponent')) {
      console.log('[Chess] Opponent is checkmated - player wins');
      set({
        boardState: {
          ...state.boardState,
          inCheck: 'opponent',
          gameStatus: 'player_wins'
        }
      });
      return;
    }
    
    if (newCheckStatus) {
      console.log(`[Chess] CHECK! ${newCheckStatus}'s King is under attack`);
    }
    
    set({
      boardState: {
        ...state.boardState,
        inCheck: newCheckStatus
      }
    });
  },

  resolveCombat: (result: CombatResult) => {
    const state = get();
    const { pendingCombat } = state;

    if (!pendingCombat) return;

    state.removePiece(result.loser.id);
    state.updatePieceHealth(result.winner.id, result.winnerNewHealth);

    if (result.winner.id === pendingCombat.attacker.id) {
      const updatedPieces = get().boardState.pieces.map(piece => {
        if (piece.id === pendingCombat.attacker.id) {
          return {
            ...piece,
            position: pendingCombat.defenderPosition,
            hasMoved: true
          };
        }
        return piece;
      });
      
      set({
        boardState: {
          ...get().boardState,
          pieces: updatedPieces,
          moveCount: get().boardState.moveCount + 1
        }
      });
      
      get().incrementAllStamina();
      
      const movedPiece = get().boardState.pieces.find(p => p.id === pendingCombat.attacker.id);
      if (movedPiece && get().checkPawnPromotion(movedPiece)) {
        console.log(`[Chess] Pawn promoted to Queen after combat at (${movedPiece.position.row}, ${movedPiece.position.col})`);
        get().promotePawn(movedPiece.id, 'queen');
      }
    }

    const gameStatus = state.checkWinCondition();
    
    set({ 
      pendingCombat: null,
      boardState: {
        ...get().boardState,
        gameStatus,
        selectedPiece: null,
        validMoves: [],
        attackMoves: []
      }
    });
    
    // Update check status after combat resolution
    get().updateCheckStatus();
    
    // Only continue if game is still playing (not checkmate)
    if (get().boardState.gameStatus === 'playing') {
      get().nextTurn();
    }
  },

  removePiece: (pieceId: string) => {
    set(state => ({
      boardState: {
        ...state.boardState,
        pieces: state.boardState.pieces.filter(p => p.id !== pieceId)
      }
    }));
  },

  updatePieceHealth: (pieceId: string, newHealth: number) => {
    set(state => ({
      boardState: {
        ...state.boardState,
        pieces: state.boardState.pieces.map(p => 
          p.id === pieceId ? { ...p, health: Math.max(0, newHealth) } : p
        )
      }
    }));
  },

  updatePieceStamina: (pieceId: string, newStamina: number) => {
    set(state => ({
      boardState: {
        ...state.boardState,
        pieces: state.boardState.pieces.map(p => {
          if (p.id !== pieceId) return p;
          const maxStamina = Math.floor(p.maxHealth / 10);
          return { ...p, stamina: Math.max(0, Math.min(newStamina, maxStamina)) };
        })
      }
    }));
  },

  incrementAllStamina: () => {
    const currentTurn = get().boardState.currentTurn;
    set(state => ({
      boardState: {
        ...state.boardState,
        pieces: state.boardState.pieces.map(p => {
          if (p.owner !== currentTurn) return p;
          const maxStamina = Math.floor(p.maxHealth / 10);
          return { ...p, stamina: Math.min(p.stamina + 1, maxStamina) };
        })
      }
    }));
  },

  nextTurn: () => {
    set(state => ({
      boardState: {
        ...state.boardState,
        currentTurn: state.boardState.currentTurn === 'player' ? 'opponent' : 'player'
      }
    }));
  },

  checkWinCondition: (): ChessGameStatus => {
    const state = get();
    const playerKing = state.boardState.pieces.find(
      p => p.type === 'king' && p.owner === 'player'
    );
    const opponentKing = state.boardState.pieces.find(
      p => p.type === 'king' && p.owner === 'opponent'
    );

    if (!opponentKing) return 'player_wins';
    if (!playerKing) return 'opponent_wins';
    return 'playing';
  },

  checkPawnPromotion: (piece: ChessPiece): boolean => {
    if (piece.type !== 'pawn') return false;
    if (piece.owner === 'player' && piece.position.row === BOARD_ROWS - 1) return true;
    if (piece.owner === 'opponent' && piece.position.row === 0) return true;
    return false;
  },

  promotePawn: (pieceId: string, newType: ChessPieceType) => {
    const state = get();
    const newStats = PIECE_BASE_STATS[newType];
    const piece = state.boardState.pieces.find(p => p.id === pieceId);
    if (!piece) return;
    
    const army = piece.owner === 'player' ? state.playerArmy : state.opponentArmy;
    const queenHero = army?.queen || CHESS_PIECE_HEROES.queen[0];
    const heroElement = queenHero.element as NorseElement | undefined;
    const gameElement: ElementType = heroElement 
      ? NORSE_TO_GAME_ELEMENT[heroElement] 
      : 'neutral';
    
    set({
      boardState: {
        ...state.boardState,
        pieces: state.boardState.pieces.map(p => {
          if (p.id === pieceId) {
            return {
              ...p,
              type: newType,
              health: newStats.baseHealth,
              maxHealth: newStats.baseHealth,
              hasSpells: newStats.hasSpells,
              heroClass: queenHero.heroClass,
              heroName: queenHero.name,
              heroPortrait: queenHero.portrait,
              fixedCards: queenHero.fixedCardIds,
              element: gameElement
            };
          }
          return p;
        })
      }
    });
  },

  executeAITurn: () => {
    const state = get();
    if (state.boardState.currentTurn !== 'opponent') return;
    if (state.boardState.gameStatus !== 'playing') return;

    const pieceValue: Record<ChessPieceType, number> = {
      king: 1000,
      queen: 90,
      rook: 50,
      bishop: 30,
      knight: 30,
      pawn: 10
    };

    const opponentPieces = state.boardState.pieces.filter(p => p.owner === 'opponent');
    
    let bestMove: { piece: ChessPiece; target: ChessBoardPosition; isAttack: boolean; score: number } | null = null;
    let bestNonAttackMove: { piece: ChessPiece; target: ChessBoardPosition; isAttack: boolean; score: number } | null = null;

    for (const piece of opponentPieces) {
      const { moves, attacks } = state.getValidMoves(piece);
      const attackerValue = pieceValue[piece.type];
      const isInstantKillAttacker = piece.type === 'pawn' || piece.type === 'king';
      
      for (const attack of attacks) {
        const targetPiece = state.getPieceAt(attack);
        if (targetPiece) {
          const targetValue = pieceValue[targetPiece.type];
          const isInstantKillDefender = targetPiece.type === 'pawn';
          const isInstantKill = isInstantKillAttacker || isInstantKillDefender;
          
          let score: number;
          if (isInstantKill) {
            // Instant-kill attacks are GUARANTEED captures (no risk)
            // Attacker is pawn/king OR defender is a pawn
            const instantKillBonus = isInstantKillAttacker ? 15 : 10;
            score = targetValue + instantKillBonus;
          } else {
            // PvP combat attacks have risk - use traditional scoring
            // Factor in attacker's strength vs target value
            const riskFactor = attackerValue * 0.3;
            score = targetValue - riskFactor;
          }
          
          if (score > 0 && (!bestMove || score > bestMove.score)) {
            bestMove = { piece, target: attack, isAttack: true, score };
          }
        }
      }
      
      for (const move of moves) {
        const forwardBonus = (piece.position.row - move.row) * 2;
        // Pawns get extra forward incentive to reach promotion row
        const pawnPushBonus = piece.type === 'pawn' ? 3 : 0;
        const score = 5 + forwardBonus + pawnPushBonus + Math.random() * 3;
        
        if (!bestNonAttackMove || score > bestNonAttackMove.score) {
          bestNonAttackMove = { piece, target: move, isAttack: false, score };
        }
      }
    }

    const finalMove = bestMove || bestNonAttackMove;
    
    if (!finalMove) {
      console.log('[AI] No valid moves - stalemate');
      set(s => ({
        boardState: { ...s.boardState, gameStatus: 'player_wins' }
      }));
      return;
    }

    const moveToExecute = finalMove;
    const pieceId = moveToExecute.piece.id;
    state.selectPiece(moveToExecute.piece);
    
    const attemptMove = () => {
      const currentState = get();
      if (currentState.boardState.gameStatus !== 'playing') return;
      if (currentState.boardState.currentTurn !== 'opponent') return;
      
      // Retry if animation is still in progress
      if (currentState.pendingAttackAnimation) {
        console.log('[AI] Waiting for animation to complete, retrying in 200ms...');
        setTimeout(attemptMove, 200);
        return;
      }
      
      const pieceStillExists = currentState.boardState.pieces.some(p => p.id === pieceId);
      if (!pieceStillExists) {
        console.log('[AI] Piece no longer exists, skipping move');
        return;
      }
      
      const collision = currentState.movePiece(moveToExecute.target);
      if (!collision) {
        console.log(`[AI] Moved ${moveToExecute.piece.type} to (${moveToExecute.target.row}, ${moveToExecute.target.col})`);
      } else if (collision.instantKill) {
        console.log(`[AI] Instant kill with ${collision.attacker.type} against ${collision.defender.type}`);
      } else {
        console.log(`[AI] PvP combat: ${collision.attacker.type} vs ${collision.defender.type}`);
      }
    };
    
    setTimeout(attemptMove, 500);
  },

  setGameStatus: (status: ChessGameStatus) => {
    set(state => ({
      boardState: {
        ...state.boardState,
        gameStatus: status
      }
    }));
  },

  setSharedDeck: (cardIds: number[]) => {
    set({ sharedDeckCardIds: cardIds });
  },

  clearPendingCombat: () => {
    set({ pendingCombat: null });
  },

  resetBoard: () => {
    set({
      boardState: initialBoardState,
      playerArmy: null,
      opponentArmy: null,
      sharedDeckCardIds: [],
      pendingCombat: null,
      pendingAttackAnimation: null
    });
  },

  startAttackAnimation: (attacker: ChessPiece, defender: ChessPiece, isInstantKill: boolean) => {
    console.log(`[Chess] Starting attack animation: ${attacker.heroName} -> ${defender.heroName} (instant: ${isInstantKill})`);
    set({
      pendingAttackAnimation: {
        attacker,
        defender,
        attackerPosition: { ...attacker.position },
        defenderPosition: { ...defender.position },
        isInstantKill,
        timestamp: Date.now()
      }
    });
  },

  completeAttackAnimation: () => {
    const state = get();
    const animation = state.pendingAttackAnimation;
    
    if (!animation) {
      console.log('[Chess] No pending animation to complete');
      return;
    }

    console.log(`[Chess] Completing attack animation: ${animation.attacker.heroName} -> ${animation.defender.heroName}`);

    // Clear animation first to prevent re-entry
    set({ pendingAttackAnimation: null });

    if (animation.isInstantKill) {
      state.executeInstantKill(animation.attacker, animation.defender, animation.defenderPosition);
    } else {
      const collision: ChessCollision = {
        attacker: animation.attacker,
        defender: animation.defender,
        attackerPosition: animation.attackerPosition,
        defenderPosition: animation.defenderPosition
      };
      
      set({ 
        pendingCombat: collision,
        boardState: {
          ...state.boardState,
          gameStatus: 'combat'
        }
      });
    }
  },

  clearAttackAnimation: () => {
    set({ pendingAttackAnimation: null });
  }
}));

export default useChessBoardStore;
