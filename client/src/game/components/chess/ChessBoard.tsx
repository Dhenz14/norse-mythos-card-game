import React, { useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChessBoardStore } from '../../stores/ChessBoardStore';
import { ChessBoardPosition, BOARD_ROWS, BOARD_COLS } from '../../types/ChessTypes';
import ChessPieceComponent from './ChessPiece';
import MovePlate from './MovePlate';
import ChessAttackAnimation from './ChessAttackAnimation';
import { useAudio } from '../../../lib/stores/useAudio';

interface ChessBoardProps {
  onCombatTriggered?: (attackerId: string, defenderId: string) => void;
  disabled?: boolean;
}

interface InstantKillFlash {
  position: ChessBoardPosition;
  attackerType: string;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ onCombatTriggered, disabled = false }) => {
  const { playSoundEffect } = useAudio();
  const [noMovesMessage, setNoMovesMessage] = useState<string | null>(null);
  const [instantKillFlash, setInstantKillFlash] = useState<InstantKillFlash | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardRect, setBoardRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const {
    boardState,
    selectPiece,
    movePiece,
    getPieceAt,
    getValidMoves,
    lastInstantKill,
    pendingAttackAnimation,
    completeAttackAnimation
  } = useChessBoardStore();
  
  useEffect(() => {
    const updateBoardRect = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setBoardRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
      }
    };
    updateBoardRect();
    window.addEventListener('resize', updateBoardRect);
    return () => window.removeEventListener('resize', updateBoardRect);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    const animation = pendingAttackAnimation;
    if (!animation) return;
    
    playSoundEffect('attack');
    
    if (animation.isInstantKill) {
      setInstantKillFlash({
        position: animation.defenderPosition,
        attackerType: animation.attacker.type
      });
      setTimeout(() => setInstantKillFlash(null), 600);
    }
    
    completeAttackAnimation();
    
    if (!animation.isInstantKill && onCombatTriggered) {
      onCombatTriggered(animation.attacker.id, animation.defender.id);
    }
  }, [pendingAttackAnimation, completeAttackAnimation, onCombatTriggered, playSoundEffect]);
  
  // Watch for AI instant-kills from store
  useEffect(() => {
    if (lastInstantKill) {
      setInstantKillFlash({
        position: lastInstantKill.position,
        attackerType: lastInstantKill.attackerType
      });
      const timer = setTimeout(() => setInstantKillFlash(null), 600);
      return () => clearTimeout(timer);
    }
  }, [lastInstantKill?.timestamp]);

  const { pieces, currentTurn, selectedPiece, validMoves, attackMoves, gameStatus } = boardState;

  const playerPieceCount = pieces.filter(p => p.owner === 'player').length;
  const opponentPieceCount = pieces.filter(p => p.owner === 'opponent').length;

  const handleCellClick = useCallback((row: number, col: number) => {
    if (disabled) return;
    
    const position: ChessBoardPosition = { row, col };
    setNoMovesMessage(null);
    
    const isValidMove = validMoves.some(m => m.row === row && m.col === col);
    const isAttackMove = attackMoves.some(m => m.row === row && m.col === col);
    
    if (isValidMove || isAttackMove) {
      const collision = movePiece(position);
      
      if (collision) {
        // Attack animation will handle sound and combat trigger
        console.log(`[Chess] Attack initiated: ${collision.attacker.heroName} -> ${collision.defender.heroName}`);
      } else {
        playSoundEffect('card_play');
      }
      return;
    }

    const pieceAtPosition = getPieceAt(position);
    
    if (pieceAtPosition) {
      if (pieceAtPosition.owner === currentTurn) {
        const { moves, attacks } = getValidMoves(pieceAtPosition);
        console.log(`[Chess] Selected ${pieceAtPosition.type} at (${row}, ${col}). Valid moves: ${moves.length}, attacks: ${attacks.length}`);
        
        if (moves.length === 0 && attacks.length === 0) {
          setNoMovesMessage(`${pieceAtPosition.heroName} is blocked and cannot move!`);
          setTimeout(() => setNoMovesMessage(null), 2000);
        }
        
        selectPiece(pieceAtPosition);
        playSoundEffect('card_click');
      }
    } else {
      selectPiece(null);
    }
  }, [disabled, validMoves, attackMoves, currentTurn, movePiece, getPieceAt, selectPiece, getValidMoves, onCombatTriggered, playSoundEffect]);

  const isValidMovePosition = (row: number, col: number) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  const isAttackPosition = (row: number, col: number) => {
    return attackMoves.some(m => m.row === row && m.col === col);
  };

  const renderCell = (row: number, col: number) => {
    const position: ChessBoardPosition = { row, col };
    const piece = getPieceAt(position);
    const isLight = (row + col) % 2 === 0;
    const isValid = isValidMovePosition(row, col);
    const isAttack = isAttackPosition(row, col);
    const isFlashCell = instantKillFlash?.position.row === row && instantKillFlash?.position.col === col;
    
    return (
      <div
        key={`${row}-${col}`}
        className={`
          chess-cell relative aspect-square overflow-visible
          ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
          ${gameStatus === 'playing' ? '' : 'opacity-75'}
        `}
        onClick={() => handleCellClick(row, col)}
      >
        <AnimatePresence mode="wait">
          {piece && (
            <motion.div
              key={piece.id}
              className="absolute inset-1"
              layoutId={piece.id}
            >
              <ChessPieceComponent
                piece={piece}
                isSelected={selectedPiece?.id === piece.id}
                isPlayerTurn={currentTurn === 'player'}
                onClick={() => handleCellClick(row, col)}
              />
            </motion.div>
          )}
          
          {!piece && (isValid || isAttack) && (
            <div className="absolute inset-1">
              <MovePlate
                isAttack={isAttack}
                onClick={() => handleCellClick(row, col)}
              />
            </div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isFlashCell && (
            <motion.div
              initial={{ opacity: 1, scale: 0.5 }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-0 pointer-events-none z-50"
            >
              <div 
                className="absolute inset-0 rounded-full" 
                style={{ 
                  background: 'radial-gradient(circle, #facc15 0%, #f97316 40%, transparent 70%)' 
                }} 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white drop-shadow-lg">⚔</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const cells = [];
  for (let row = BOARD_ROWS - 1; row >= 0; row--) {
    for (let col = 0; col < BOARD_COLS; col++) {
      cells.push(renderCell(row, col));
    }
  }

  return (
    <div className="chess-board-container flex flex-col items-center">
      <div className="mb-2 text-center">
        <span className={`text-lg font-bold ${currentTurn === 'player' ? 'text-blue-400' : 'text-red-400'}`}>
          {currentTurn === 'player' ? 'Your Turn' : "Opponent's Turn"}
        </span>
        {gameStatus === 'combat' && (
          <span className="ml-2 text-yellow-400 animate-pulse">⚔ Combat!</span>
        )}
        {gameStatus === 'player_wins' && (
          <span className="ml-2 text-green-400">Victory!</span>
        )}
        {gameStatus === 'opponent_wins' && (
          <span className="ml-2 text-red-400">Defeat</span>
        )}
      </div>
      
      {noMovesMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-2 px-4 py-2 bg-red-900/80 border border-red-500 rounded-lg text-red-200 text-sm"
        >
          {noMovesMessage}
        </motion.div>
      )}
      
      <div 
        ref={boardRef}
        className="chess-board rounded-lg overflow-hidden shadow-2xl border-4 border-amber-900"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${BOARD_ROWS}, 1fr)`,
          gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`,
          width: 'min(500px, 85vw)',
          aspectRatio: `${BOARD_COLS}/${BOARD_ROWS}`
        }}
      >
        {cells}
      </div>
      
      {/* Attack Animation Overlay */}
      <ChessAttackAnimation
        animation={pendingAttackAnimation ? {
          attacker: pendingAttackAnimation.attacker,
          defender: pendingAttackAnimation.defender,
          attackerPosition: pendingAttackAnimation.attackerPosition,
          defenderPosition: pendingAttackAnimation.defenderPosition,
          isInstantKill: pendingAttackAnimation.isInstantKill
        } : null}
        onAnimationComplete={handleAnimationComplete}
        cellSize={boardRect.width / BOARD_COLS}
        boardOffset={{ x: boardRect.x, y: boardRect.y }}
      />
      
      <div className="mt-3 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500/60 rounded border-2 border-green-400" />
          <span className="text-gray-300">Move</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500/60 rounded border-2 border-red-400" />
          <span className="text-gray-300">Attack</span>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between w-full max-w-md px-4">
        <div className="flex items-center gap-2 text-blue-400">
          <span className="text-lg">👤</span>
          <span className="font-bold">{playerPieceCount}</span>
          <span className="text-xs text-gray-400">pieces</span>
        </div>
        <div className="flex items-center gap-2 text-red-400">
          <span className="text-xs text-gray-400">pieces</span>
          <span className="font-bold">{opponentPieceCount}</span>
          <span className="text-lg">🤖</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center max-w-md">
        Pawns move forward. Knights jump in L-shapes. Other pieces are blocked until pawns move.
      </div>
    </div>
  );
};

export default ChessBoard;
