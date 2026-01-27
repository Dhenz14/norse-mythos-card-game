import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArmySelection as ArmySelectionType, ChessPiece } from '../../types/ChessTypes';
import { useChessBoardStore } from '../../stores/ChessBoardStore';
import { getDefaultArmySelection, buildCombatDeck } from '../../data/ChessPieceConfig';
import ArmySelectionComponent from '../ArmySelection';
import ChessBoard from './ChessBoard';
import RagnarokCombatArena from '../../combat/RagnarokCombatArena';
import VSScreen from './VSScreen';
import { usePokerCombatStore } from '../../combat/PokerCombatStore';
import { PetData, DEFAULT_PET_STATS, calculateStaminaFromHP } from '../../types/PokerCombatTypes';
import { useAudio } from '../../../lib/stores/useAudio';
import { v4 as uuidv4 } from 'uuid';

type GamePhase = 'army_selection' | 'chess' | 'vs_screen' | 'poker_combat' | 'game_over';

interface RagnarokChessGameProps {
  onGameEnd?: (winner: 'player' | 'opponent') => void;
}

const RagnarokChessGame: React.FC<RagnarokChessGameProps> = ({ onGameEnd }) => {
  const { playSoundEffect } = useAudio();
  const [phase, setPhase] = useState<GamePhase>('army_selection');
  const [playerArmy, setPlayerArmy] = useState<ArmySelectionType | null>(null);
  const [sharedDeckCardIds, setSharedDeckCardIds] = useState<number[]>([]);
  const [combatPieces, setCombatPieces] = useState<{ attackerId: string; defenderId: string } | null>(null);
  const [vsScreenPieces, setVsScreenPieces] = useState<{ attacker: ChessPiece; defender: ChessPiece } | null>(null);
  
  const {
    boardState,
    initializeBoard,
    pendingCombat,
    clearPendingCombat,
    resolveCombat,
    setSharedDeck,
    resetBoard,
    executeAITurn,
    updatePieceStamina
  } = useChessBoardStore();

  const { initializeCombat, endCombat, combatState } = usePokerCombatStore();

  const opponentArmy = getDefaultArmySelection();

  const createPetFromChessPiece = useCallback((
    piece: typeof boardState.pieces[0],
    army: ArmySelectionType
  ): PetData => {
    const petClass: PetData['petClass'] = piece.type === 'queen' ? 'queen' : 
                piece.type === 'king' ? 'king' :
                piece.type === 'pawn' ? 'pawn' : 'standard';
    
    const baseStats = DEFAULT_PET_STATS[petClass];
    
    let heroName = piece.heroName || 'Unknown Warrior';
    let norseHeroId: string | undefined;
    if (piece.type !== 'pawn' && army[piece.type as keyof ArmySelectionType]) {
      const heroData = army[piece.type as keyof ArmySelectionType];
      heroName = heroData.name;
      norseHeroId = heroData.norseHeroId;
      console.log(`[createPetFromChessPiece] piece.type=${piece.type}, heroData.name=${heroData.name}, heroData.norseHeroId=${heroData.norseHeroId}`);
    } else {
      console.log(`[createPetFromChessPiece] Skipping norseHeroId - piece.type=${piece.type}, isPawn=${piece.type === 'pawn'}, hasArmyEntry=${!!army[piece.type as keyof ArmySelectionType]}`);
    }
    
    return {
      id: piece.id,
      name: heroName,
      imageUrl: `/assets/heroes/${piece.heroClass}.png`,
      rarity: piece.type === 'king' ? 'legendary' : 
              piece.type === 'queen' ? 'epic' :
              piece.type === 'pawn' ? 'common' : 'rare',
      petClass,
      stats: {
        ...baseStats,
        element: 'neutral',
        currentHealth: piece.health,
        maxHealth: piece.maxHealth,
        maxStamina: calculateStaminaFromHP(piece.maxHealth),
        currentStamina: Math.min(piece.stamina, calculateStaminaFromHP(piece.maxHealth))
      },
      abilities: [],
      spellSlots: piece.hasSpells ? 10 : 0,
      equippedSpells: [],
      norseHeroId
    };
  }, []);

  const handleArmyComplete = useCallback((army: ArmySelectionType) => {
    setPlayerArmy(army);
    initializeBoard(army, opponentArmy);
    setPhase('chess');
    playSoundEffect('game_start');
  }, [opponentArmy, initializeBoard, playSoundEffect]);

  const handleQuickStart = useCallback((army: ArmySelectionType, deckCardIds: number[]) => {
    setPlayerArmy(army);
    setSharedDeckCardIds(deckCardIds);
    setSharedDeck(deckCardIds);
    initializeBoard(army, opponentArmy);
    setPhase('chess');
    playSoundEffect('game_start');
  }, [opponentArmy, initializeBoard, setSharedDeck, playSoundEffect]);

  const handleCombatTriggered = useCallback((attackerId: string, defenderId: string) => {
    setCombatPieces({ attackerId, defenderId });
    
    const attacker = boardState.pieces.find(p => p.id === attackerId);
    const defender = boardState.pieces.find(p => p.id === defenderId);
    
    if (!attacker || !defender) return;

    setVsScreenPieces({ attacker, defender });
    setPhase('vs_screen');
    playSoundEffect('card_draw');
  }, [boardState.pieces, playSoundEffect]);

  const handleVsScreenComplete = useCallback(() => {
    if (!vsScreenPieces || !combatPieces) return;

    const { attacker, defender } = vsScreenPieces;
    
    // Chess attack penalty: Defender takes 15 HP damage for being attacked
    // This makes chess positioning meaningful - attackers have an advantage
    const CHESS_ATTACK_PENALTY = 15;
    const defenderHealthAfterPenalty = Math.max(1, defender.health - CHESS_ATTACK_PENALTY);
    
    // Update the defender's health on the chess board immediately
    // This ensures the penalty persists regardless of poker combat outcome
    useChessBoardStore.getState().updatePieceHealth(defender.id, defenderHealthAfterPenalty);
    
    console.log(`[Combat Init] Attacker ${attacker.type} (${attacker.owner}): HP=${attacker.health}, Stamina=${attacker.stamina}`);
    console.log(`[Combat Init] Defender ${defender.type} (${defender.owner}): HP=${defender.health} -> ${defenderHealthAfterPenalty} (after ${CHESS_ATTACK_PENALTY} HP penalty), Stamina=${defender.stamina}`);
    
    const attackerArmy = attacker.owner === 'player' ? playerArmy : opponentArmy;
    const defenderArmy = defender.owner === 'player' ? playerArmy : opponentArmy;
    
    if (!attackerArmy || !defenderArmy) return;

    const attackerPet = createPetFromChessPiece(attacker, attackerArmy);
    
    // Create defender pet with reduced health from chess attack penalty
    const defenderWithPenalty = { ...defender, health: defenderHealthAfterPenalty };
    const defenderPet = createPetFromChessPiece(defenderWithPenalty, defenderArmy);
    
    console.log(`[Combat Init] AttackerPet stamina: ${attackerPet.stats.currentStamina}/${attackerPet.stats.maxStamina}`);
    console.log(`[Combat Init] DefenderPet stamina: ${defenderPet.stats.currentStamina}/${defenderPet.stats.maxStamina}`);

    const attackerName = attackerPet.name || `${attacker.owner === 'player' ? 'Player' : 'Opponent'} ${attacker.type}`;
    const defenderName = defenderPet.name || `${defender.owner === 'player' ? 'Player' : 'Opponent'} ${defender.type}`;

    // Pass king IDs to apply king passive aura buffs
    const attackerKingId = attackerArmy.king?.id;
    const defenderKingId = defenderArmy.king?.id;
    
    initializeCombat(
      uuidv4(),
      attackerName,
      attackerPet,
      uuidv4(),
      defenderName,
      defenderPet,
      true,
      attackerKingId,
      defenderKingId
    );
    
    setVsScreenPieces(null);
    setPhase('poker_combat');
    playSoundEffect('game_start');
  }, [vsScreenPieces, combatPieces, playerArmy, opponentArmy, createPetFromChessPiece, initializeCombat, playSoundEffect]);

  const handleCombatEnd = useCallback((winner: 'player' | 'opponent' | 'draw') => {
    const combat = pendingCombat;
    if (!combat || !combatPieces) return;
    
    // Use preBlindHealth for calculating chess piece HP to avoid blind/ante bleed
    // preBlindHealth = HP the chess piece had BEFORE poker betting started
    // Winner takes 0 damage, Loser takes damage = their hpCommitted
    const playerPreBlindHP = combatState?.player.preBlindHealth ?? combatState?.player.pet.stats.currentHealth ?? 0;
    const opponentPreBlindHP = combatState?.opponent.preBlindHealth ?? combatState?.opponent.pet.stats.currentHealth ?? 0;
    const playerHpCommitted = combatState?.player.hpCommitted ?? 0;
    const opponentHpCommitted = combatState?.opponent.hpCommitted ?? 0;
    const playerStamina = combatState?.player.pet.stats.currentStamina ?? 0;
    const opponentStamina = combatState?.opponent.pet.stats.currentStamina ?? 0;
    
    console.log(`[Combat End] Winner: ${winner}, Attacker(player) stamina: ${playerStamina}, Defender(opponent) stamina: ${opponentStamina}`);
    
    if (winner === 'draw') {
      // Draw: Both pieces survive with preBlindHealth (no damage on draw)
      const store = useChessBoardStore.getState();
      store.updatePieceHealth(combat.attacker.id, Math.max(1, playerPreBlindHP));
      store.updatePieceHealth(combat.defender.id, Math.max(1, opponentPreBlindHP));
      updatePieceStamina(combat.attacker.id, playerStamina);
      updatePieceStamina(combat.defender.id, opponentStamina);
      
      // Draw still counts as a move attempt - increment stamina and change turn
      store.incrementAllStamina();
      store.nextTurn();
      
      console.log(`[Chess] Draw resolved - both pieces survive. Attacker HP: ${playerPreBlindHP}, Defender HP: ${opponentPreBlindHP}`);
    } else {
      let winnerPiece: typeof combat.attacker;
      let loserPiece: typeof combat.attacker;
      let winnerNewHealth: number;
      let winnerNewStamina: number;
      
      if (winner === 'player') {
        // Player (attacker) wins - takes 0 damage, opponent (defender) loses their hpCommitted
        winnerPiece = combat.attacker;
        loserPiece = combat.defender;
        winnerNewHealth = playerPreBlindHP; // Winner takes NO damage
        winnerNewStamina = playerStamina;
        console.log(`[Chess] Attacker wins - HP stays at ${playerPreBlindHP}, opponent loses ${opponentHpCommitted} HP`);
      } else {
        // Opponent (defender) wins - takes 0 damage, player (attacker) loses their hpCommitted  
        winnerPiece = combat.defender;
        loserPiece = combat.attacker;
        winnerNewHealth = opponentPreBlindHP; // Winner takes NO damage
        winnerNewStamina = opponentStamina;
        console.log(`[Chess] Defender wins - HP stays at ${opponentPreBlindHP}, attacker loses ${playerHpCommitted} HP`);
      }
      
      resolveCombat({
        winner: winnerPiece,
        loser: loserPiece,
        winnerNewHealth: Math.max(1, winnerNewHealth)
      });
      
      console.log(`[Combat End] Updating winner ${winnerPiece.type} (${winnerPiece.owner}) stamina to ${winnerNewStamina}`);
      updatePieceStamina(winnerPiece.id, winnerNewStamina);
    }
    
    clearPendingCombat();
    setCombatPieces(null);
    endCombat();
    
    setPhase('chess');
    playSoundEffect('turn_start');
  }, [pendingCombat, combatPieces, combatState, resolveCombat, clearPendingCombat, endCombat, playSoundEffect, updatePieceStamina]);

  useEffect(() => {
    if (boardState.gameStatus === 'player_wins' || boardState.gameStatus === 'opponent_wins') {
      setPhase('game_over');
      const winner = boardState.gameStatus === 'player_wins' ? 'player' : 'opponent';
      playSoundEffect(winner === 'player' ? 'victory' : 'defeat');
      if (onGameEnd) {
        onGameEnd(winner);
      }
    }
  }, [boardState.gameStatus, onGameEnd, playSoundEffect]);

  useEffect(() => {
    if (phase === 'chess' && boardState.currentTurn === 'opponent' && boardState.gameStatus === 'playing') {
      const aiDelay = setTimeout(() => {
        executeAITurn();
      }, 1000);
      return () => clearTimeout(aiDelay);
    }
  }, [phase, boardState.currentTurn, boardState.gameStatus, executeAITurn]);

  useEffect(() => {
    if (pendingCombat && boardState.gameStatus === 'combat' && phase === 'chess' && !combatPieces) {
      console.log('[RagnarokChessGame] pendingCombat detected (AI attack), triggering combat flow');
      const { attacker, defender } = pendingCombat;
      
      setCombatPieces({ attackerId: attacker.id, defenderId: defender.id });
      setVsScreenPieces({ attacker, defender });
      setPhase('vs_screen');
      playSoundEffect('card_draw');
    }
  }, [pendingCombat, boardState.gameStatus, phase, combatPieces, playSoundEffect]);

  useEffect(() => {
    if (phase === 'chess' && boardState.gameStatus === 'playing') {
      const currentSide = boardState.currentTurn;
      const pieces = boardState.pieces.filter(p => p.owner === currentSide);
      let hasValidMove = false;
      
      for (const piece of pieces) {
        const { moves, attacks } = useChessBoardStore.getState().getValidMoves(piece);
        if (moves.length > 0 || attacks.length > 0) {
          hasValidMove = true;
          break;
        }
      }
      
      if (!hasValidMove && pieces.length > 0) {
        const winnerStatus = currentSide === 'player' ? 'opponent_wins' : 'player_wins';
        console.log(`[Chess] ${currentSide} has no valid moves - stalemate, ${winnerStatus}`);
        useChessBoardStore.getState().setGameStatus(winnerStatus);
      }
    }
  }, [phase, boardState.currentTurn, boardState.gameStatus, boardState.pieces]);

  const handleRestart = useCallback(() => {
    resetBoard();
    setPlayerArmy(null);
    setSharedDeckCardIds([]);
    setCombatPieces(null);
    setPhase('army_selection');
  }, [resetBoard]);

  const handleBattleMode = useCallback(() => {
    const playerPieces = boardState.pieces.filter(p => p.owner === 'player' && p.type !== 'pawn' && p.type !== 'king');
    const opponentPieces = boardState.pieces.filter(p => p.owner === 'opponent' && p.type !== 'pawn' && p.type !== 'king');
    
    if (playerPieces.length === 0 || opponentPieces.length === 0) {
      console.log('[BattleMode] Not enough pieces for test battle');
      return;
    }
    
    const attacker = playerPieces[Math.floor(Math.random() * playerPieces.length)];
    const defender = opponentPieces[Math.floor(Math.random() * opponentPieces.length)];
    
    setCombatPieces({ attackerId: attacker.id, defenderId: defender.id });
    setVsScreenPieces({ attacker, defender });
    setPhase('vs_screen');
    playSoundEffect('card_draw');
  }, [boardState.pieces, playSoundEffect]);

  return (
    <div className="ragnarok-chess-game w-full h-full overflow-hidden" style={{ background: 'transparent' }}>
      {/* Army Selection renders OUTSIDE AnimatePresence to avoid transform breaking fixed positioning */}
      {phase === 'army_selection' && (
        <ArmySelectionComponent onComplete={handleArmyComplete} onQuickStart={handleQuickStart} />
      )}
      
      <AnimatePresence mode="wait">
        {phase !== 'army_selection' && null}


        {phase === 'chess' && (
          <motion.div
            key="chess"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full h-full flex flex-col items-center justify-center p-4"
          >
            <div className="mb-4 text-center">
              <h1 className="text-3xl font-bold text-yellow-400">Ragnarok Chess</h1>
              <p className="text-gray-400">Checkmate the enemy King to win!</p>
            </div>
            
            {/* Check indicator - shows when a King is under threat */}
            <AnimatePresence>
              {boardState.inCheck && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  className={`mb-3 px-6 py-2 rounded-lg font-bold text-xl ${
                    boardState.inCheck === 'player' 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-yellow-500 text-black'
                  }`}
                >
                  CHECK! {boardState.inCheck === 'player' ? 'Your King is in danger!' : "Enemy King is threatened!"}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="relative">
              <ChessBoard onCombatTriggered={handleCombatTriggered} />
              
              {/* Battle Mode Button - Quick PvP Test */}
              <button
                onClick={handleBattleMode}
                className="absolute -right-24 top-1/2 -translate-y-1/2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all hover:scale-105"
                title="Quick test PvP combat"
              >
                ⚔️ Battle<br/>Mode
              </button>
            </div>
            
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>Click a piece to see valid moves. Attack enemies to trigger poker combat.</p>
              {boardState.inCheck === boardState.currentTurn && (
                <p className="text-yellow-400 mt-1 font-semibold">You must escape check! Move King, block, or capture the threat.</p>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'vs_screen' && vsScreenPieces && (
          <VSScreen
            key="vs"
            attacker={vsScreenPieces.attacker}
            defender={vsScreenPieces.defender}
            onComplete={handleVsScreenComplete}
            duration={2500}
          />
        )}

        {phase === 'poker_combat' && (
          <motion.div
            key="poker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <RagnarokCombatArena onCombatEnd={handleCombatEnd} />
          </motion.div>
        )}

        {phase === 'game_over' && (
          <motion.div
            key="gameover"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-full flex flex-col items-center justify-center"
          >
            <div className={`text-6xl font-bold mb-8 ${
              boardState.gameStatus === 'player_wins' ? 'text-green-400' : 'text-red-400'
            }`}>
              {boardState.gameStatus === 'player_wins' ? 'VICTORY!' : 'DEFEAT'}
            </div>
            <p className="text-xl text-gray-300 mb-8">
              {boardState.gameStatus === 'player_wins' 
                ? 'Checkmate! The enemy King has no escape!' 
                : 'Checkmate... Your King has been cornered.'}
            </p>
            <button
              onClick={handleRestart}
              className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg text-xl"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RagnarokChessGame;
