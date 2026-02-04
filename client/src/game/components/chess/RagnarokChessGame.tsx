import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArmySelection as ArmySelectionType, ChessPiece } from '../../types/ChessTypes';
import { useChessCombatAdapter } from '../../hooks/useChessCombatAdapter';
import { getDefaultArmySelection, buildCombatDeck } from '../../data/ChessPieceConfig';
import ArmySelectionComponent from '../ArmySelection';
import ChessBoard from './ChessBoard';
import RagnarokCombatArena from '../../combat/RagnarokCombatArena';
import VSScreen from './VSScreen';
import { usePokerCombatAdapter } from '../../hooks/usePokerCombatAdapter';
import { PetData, DEFAULT_PET_STATS, calculateStaminaFromHP } from '../../types/PokerCombatTypes';
import { useAudio } from '../../../lib/stores/useAudio';
import { v4 as uuidv4 } from 'uuid';
import { useKingChessAbility } from '../../hooks/useKingChessAbility';
import { getKingAbilityConfig, getAbilityDescription, requiresDirectionSelection, getAvailableDirections, MineDirection } from '../../utils/chess/kingAbilityUtils';
import { Tooltip } from '../ui/Tooltip';

type GamePhase = 'army_selection' | 'chess' | 'vs_screen' | 'poker_combat' | 'game_over';

interface HeroPortraitPanelProps {
  army: ArmySelectionType;
  side: 'player' | 'opponent';
}

const HeroPortraitPanel: React.FC<HeroPortraitPanelProps> = ({ army, side }) => {
  const king = army.king;
  const kingPortrait = king.portrait || `/portraits/kings/${king.id?.replace('king-', '')}.png`;
  const fallbackPortrait = `/portraits/heroes/${king.heroClass}.png`;
  
  const isPlayer = side === 'player';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isPlayer ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`flex flex-col items-center ${isPlayer ? 'mr-4' : 'ml-4'}`}
    >
      <div className="relative">
        <div 
          className="w-24 h-28 rounded-lg overflow-hidden border-2 shadow-lg"
          style={{ 
            borderColor: isPlayer ? '#3b82f6' : '#ef4444',
            boxShadow: `0 0 20px ${isPlayer ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'}` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10" />
          <img 
            src={kingPortrait}
            alt={king.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== fallbackPortrait) {
                target.src = fallbackPortrait;
              }
            }}
          />
          <div 
            className="absolute -top-1 -left-1 -right-1 h-2 rounded-t"
            style={{ 
              background: `linear-gradient(90deg, ${isPlayer ? '#3b82f6' : '#ef4444'}, #fbbf24, ${isPlayer ? '#3b82f6' : '#ef4444'})` 
            }}
          />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-300 flex items-center justify-center shadow-lg">
          <span className="text-xs">👑</span>
        </div>
      </div>
      
      <div className="mt-3 text-center max-w-24">
        <div 
          className="text-sm font-bold truncate"
          style={{ color: isPlayer ? '#60a5fa' : '#f87171' }}
        >
          {king.name}
        </div>
        <div className="text-xs text-gray-400 truncate">
          {isPlayer ? 'Champion' : 'Adversary'}
        </div>
      </div>
    </motion.div>
  );
};

interface DivineCommandButtonProps {
  playerArmy: ArmySelectionType | null;
  isPlayerTurn: boolean;
}

const DivineCommandButton: React.FC<DivineCommandButtonProps> = ({ playerArmy, isPlayerTurn }) => {
  const {
    canPlaceMine,
    minesRemaining,
    isPlacementMode,
    selectedDirection,
    enterPlacementMode,
    exitPlacementMode,
    selectDirection
  } = useKingChessAbility('player');
  
  const kingId = playerArmy?.king?.id || '';
  const config = getKingAbilityConfig(kingId);
  const description = getAbilityDescription(kingId);
  const needsDirection = requiresDirectionSelection(kingId);
  const availableDirections = getAvailableDirections(kingId);
  
  const handleClick = () => {
    if (isPlacementMode) {
      exitPlacementMode();
    } else if (canPlaceMine) {
      enterPlacementMode();
    }
  };
  
  const handleDirectionSelect = (dir: MineDirection) => {
    selectDirection(dir);
  };
  
  const isDisabled = !canPlaceMine && !isPlacementMode;
  
  const abilityName = config?.abilityType 
    ? config.abilityType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Divine Command';
  const rarityColor = config?.rarity === 'super_rare' ? '#f59e0b' 
    : config?.rarity === 'epic' ? '#a855f7' 
    : config?.rarity === 'rare' ? '#10b981'
    : '#3b82f6';
  
  const tooltipContent = (
    <div 
      className="portal-tooltip-content"
      style={{ 
        borderColor: rarityColor,
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 20px ${rarityColor}40`
      }}
    >
      <div className="portal-tooltip-header" style={{ color: rarityColor }}>
        <span>{abilityName}</span>
        <span 
          className="portal-tooltip-cost"
          style={{ 
            background: `linear-gradient(135deg, ${rarityColor}, ${rarityColor}cc)` 
          }}
        >
          {config?.rarity?.replace('_', ' ').toUpperCase() || 'STANDARD'}
        </span>
      </div>
      <div className="portal-tooltip-description">{description}</div>
      <div className="portal-tooltip-meta">
        <div style={{ color: '#fbbf24' }}>⚡ Uses: {minesRemaining}/5 remaining</div>
        <div style={{ color: '#ef4444', marginTop: '4px' }}>💀 STA Penalty: -{config?.staPenalty || 2} when triggered</div>
        <div style={{ color: '#22d3ee', marginTop: '4px' }}>✨ Mana Reward: +{config?.manaBoost || 1} mana next PvP</div>
        <div style={{ color: '#9ca3af', marginTop: '4px', fontStyle: 'italic' }}>Mines expire after {config?.turnDuration || 2} turn{(config?.turnDuration || 2) > 1 ? 's' : ''}</div>
      </div>
    </div>
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-4 flex flex-col items-center"
    >
      <Tooltip content={tooltipContent} position="top" delay={200}>
        <button
          onClick={handleClick}
          disabled={isDisabled}
          className={`
            relative px-6 py-3 rounded-lg font-bold text-lg transition-all
            ${isPlacementMode 
              ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-500/30' 
              : isDisabled 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700 text-yellow-100 hover:from-yellow-600 hover:via-yellow-500 hover:to-yellow-600 shadow-lg shadow-yellow-500/30 hover:scale-105'
            }
            border-2 ${isPlacementMode ? 'border-red-400' : isDisabled ? 'border-gray-600' : 'border-yellow-400'}
          `}
          style={{
            textShadow: isDisabled ? 'none' : '0 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{isPlacementMode ? '✕' : '⚡'}</span>
            <span>{isPlacementMode ? 'Cancel Command' : 'Divine Command'}</span>
          </div>
          
          <div 
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 flex items-center justify-center text-sm font-bold"
            style={{ 
              borderColor: minesRemaining > 0 ? '#fbbf24' : '#6b7280',
              color: minesRemaining > 0 ? '#fbbf24' : '#6b7280'
            }}
          >
            {minesRemaining}/5
          </div>
        </button>
      </Tooltip>
      
      {needsDirection && isPlacementMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 flex gap-2"
        >
          {availableDirections.map((dir) => (
            <button
              key={dir}
              onClick={() => handleDirectionSelect(dir)}
              className={`
                px-3 py-2 rounded-lg text-sm font-semibold transition-all
                ${selectedDirection === dir 
                  ? 'bg-yellow-600 text-white border-2 border-yellow-400' 
                  : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600'
                }
              `}
            >
              {dir === 'horizontal' ? '↔️ Horizontal' : 
               dir === 'vertical' ? '↕️ Vertical' : 
               dir === 'diagonal_up' ? '↗️ Diagonal ↗' : '↘️ Diagonal ↘'}
            </button>
          ))}
        </motion.div>
      )}
      
      {isPlacementMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-center"
        >
          <div className="text-sm text-yellow-400">Click a tile to place your trap!</div>
          <div className="text-xs text-gray-500 mt-1">{description}</div>
        </motion.div>
      )}
      
      {!isPlayerTurn && !isPlacementMode && (
        <div className="mt-2 text-xs text-gray-500">Wait for your turn</div>
      )}
    </motion.div>
  );
};

interface ChessPhaseContentProps {
  boardState: any;
  playerArmy: ArmySelectionType | null;
  opponentArmy: ArmySelectionType;
  handleCombatTriggered: (attackerId: string, defenderId: string) => void;
  handleBattleMode: () => void;
}

const ChessPhaseContent: React.FC<ChessPhaseContentProps> = ({
  boardState,
  playerArmy,
  opponentArmy,
  handleCombatTriggered,
  handleBattleMode
}) => {
  const { isPlacementMode } = useKingChessAbility('player');
  
  return (
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
      
      <div className="flex items-center justify-center">
        {playerArmy && (
          <HeroPortraitPanel army={playerArmy} side="player" />
        )}
        
        <div className="relative">
          <ChessBoard 
            onCombatTriggered={handleCombatTriggered} 
            disabled={isPlacementMode}
          />
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBattleMode();
            }}
            className="absolute -right-32 top-3/4 -translate-y-1/2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg shadow-xl transition-all hover:scale-110 z-50 border-2 border-purple-400"
            title="Quick test PvP combat"
          >
            ⚔️ Battle<br/>Mode
          </button>
        </div>
        
        <HeroPortraitPanel army={opponentArmy} side="opponent" />
      </div>
      
      {playerArmy && (
        <DivineCommandButton 
          playerArmy={playerArmy} 
          isPlayerTurn={boardState.currentTurn === 'player'}
        />
      )}
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Click a piece to see valid moves. Attack enemies to trigger poker combat.</p>
        {boardState.inCheck === boardState.currentTurn && (
          <p className="text-yellow-400 mt-1 font-semibold">You must escape check! Move King, block, or capture the threat.</p>
        )}
      </div>
    </motion.div>
  );
};

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
  const [pokerSlotsSwapped, setPokerSlotsSwapped] = useState(false); // True when AI attacks human (poker "player" = chess defender)
  
  const {
    boardState,
    initializeBoard,
    pendingCombat,
    clearPendingCombat,
    resolveCombat,
    setSharedDeck,
    resetBoard,
    executeAITurn,
    updatePieceStamina,
    updatePieceHealth,
    incrementAllStamina,
    setGameStatus,
    getValidMoves,
    nextTurn
  } = useChessCombatAdapter();

  const { initializeCombat, endCombat, combatState } = usePokerCombatAdapter();

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
    
    console.log(`[Combat Init] Attacker ${attacker.type} (${attacker.owner}): HP=${attacker.health}, Stamina=${attacker.stamina}`);
    console.log(`[Combat Init] Defender ${defender.type} (${defender.owner}): HP=${defender.health}, Stamina=${defender.stamina}`);
    console.log(`[Combat Init] First strike will be applied via animation in poker combat`);
    
    const attackerArmy = attacker.owner === 'player' ? playerArmy : opponentArmy;
    const defenderArmy = defender.owner === 'player' ? playerArmy : opponentArmy;
    
    if (!attackerArmy || !defenderArmy) return;

    const attackerPet = createPetFromChessPiece(attacker, attackerArmy);
    const defenderPet = createPetFromChessPiece(defender, defenderArmy);
    
    console.log(`[Combat Init] AttackerPet stamina: ${attackerPet.stats.currentStamina}/${attackerPet.stats.maxStamina}`);
    console.log(`[Combat Init] DefenderPet stamina: ${defenderPet.stats.currentStamina}/${defenderPet.stats.maxStamina}`);

    const attackerName = attackerPet.name || `${attacker.owner === 'player' ? 'Player' : 'Opponent'} ${attacker.type}`;
    const defenderName = defenderPet.name || `${defender.owner === 'player' ? 'Player' : 'Opponent'} ${defender.type}`;

    // Pass king IDs to apply king passive aura buffs
    const attackerKingId = attackerArmy.king?.id;
    const defenderKingId = defenderArmy.king?.id;
    
    // FIX: Human player should ALWAYS be in the "player" slot for combat UI
    // When AI attacks human, swap parameters so human remains as "player"
    const humanIsAttacker = attacker.owner === 'player';
    
    if (humanIsAttacker) {
      // Human attacks AI: Human (attacker) = player, AI (defender) = opponent
      // First strike target is 'opponent' (the defender in the player slot)
      setPokerSlotsSwapped(false);
      initializeCombat(
        uuidv4(),
        attackerName,
        attackerPet,
        uuidv4(),
        defenderName,
        defenderPet,
        true,
        attackerKingId,
        defenderKingId,
        'opponent' // First strike hits the opponent (defender)
      );
    } else {
      // AI attacks Human: Human (defender) = player, AI (attacker) = opponent
      // Swap the parameters so human is always "player" in combat UI
      // First strike target is 'player' (the human defender)
      setPokerSlotsSwapped(true);
      initializeCombat(
        uuidv4(),
        defenderName,
        defenderPet,
        uuidv4(),
        attackerName,
        attackerPet,
        true,
        defenderKingId,
        attackerKingId,
        'player' // First strike hits the player (defender/human)
      );
    }
    
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
    
    // FIX: Map poker slots to chess pieces correctly
    // When pokerSlotsSwapped is false: poker "player" = chess attacker, poker "opponent" = chess defender
    // When pokerSlotsSwapped is true: poker "player" = chess defender, poker "opponent" = chess attacker
    const pokerPlayerPiece = pokerSlotsSwapped ? combat.defender : combat.attacker;
    const pokerOpponentPiece = pokerSlotsSwapped ? combat.attacker : combat.defender;
    
    console.log(`[Combat End] Winner: ${winner}, pokerSlotsSwapped: ${pokerSlotsSwapped}`);
    console.log(`[Combat End] Poker player = chess ${pokerSlotsSwapped ? 'defender' : 'attacker'} (${pokerPlayerPiece.owner})`);
    console.log(`[Combat End] Poker opponent = chess ${pokerSlotsSwapped ? 'attacker' : 'defender'} (${pokerOpponentPiece.owner})`);
    
    if (winner === 'draw') {
      // Draw: Both pieces survive with preBlindHealth (no damage on draw)
      updatePieceHealth(pokerPlayerPiece.id, Math.max(1, playerPreBlindHP));
      updatePieceHealth(pokerOpponentPiece.id, Math.max(1, opponentPreBlindHP));
      updatePieceStamina(pokerPlayerPiece.id, playerStamina);
      updatePieceStamina(pokerOpponentPiece.id, opponentStamina);
      
      // Draw still counts as a move attempt - increment stamina and change turn
      incrementAllStamina();
      nextTurn();
      
      console.log(`[Chess] Draw resolved - both pieces survive. Player HP: ${playerPreBlindHP}, Opponent HP: ${opponentPreBlindHP}`);
    } else {
      let winnerPiece: typeof combat.attacker;
      let loserPiece: typeof combat.attacker;
      let winnerNewHealth: number;
      let winnerNewStamina: number;
      
      if (winner === 'player') {
        // Poker "player" wins - the chess piece in the player slot survives
        winnerPiece = pokerPlayerPiece;
        loserPiece = pokerOpponentPiece;
        winnerNewHealth = playerPreBlindHP; // Winner takes NO damage
        winnerNewStamina = playerStamina;
        console.log(`[Chess] Poker player (${winnerPiece.owner} ${winnerPiece.type}) wins - HP stays at ${playerPreBlindHP}`);
      } else {
        // Poker "opponent" wins - the chess piece in the opponent slot survives
        winnerPiece = pokerOpponentPiece;
        loserPiece = pokerPlayerPiece;
        winnerNewHealth = opponentPreBlindHP; // Winner takes NO damage
        winnerNewStamina = opponentStamina;
        console.log(`[Chess] Poker opponent (${winnerPiece.owner} ${winnerPiece.type}) wins - HP stays at ${opponentPreBlindHP}`);
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
    setPokerSlotsSwapped(false); // Reset for next combat
    endCombat();
    
    setPhase('chess');
    playSoundEffect('turn_start');
  }, [pendingCombat, combatPieces, combatState, pokerSlotsSwapped, resolveCombat, clearPendingCombat, endCombat, playSoundEffect, updatePieceStamina]);

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
    return undefined;
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
        const { moves, attacks } = getValidMoves(piece);
        if (moves.length > 0 || attacks.length > 0) {
          hasValidMove = true;
          break;
        }
      }
      
      if (!hasValidMove && pieces.length > 0) {
        const winnerStatus = currentSide === 'player' ? 'opponent_wins' : 'player_wins';
        console.log(`[Chess] ${currentSide} has no valid moves - stalemate, ${winnerStatus}`);
        setGameStatus(winnerStatus);
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
          <ChessPhaseContent
            boardState={boardState}
            playerArmy={playerArmy}
            opponentArmy={opponentArmy}
            handleCombatTriggered={handleCombatTriggered}
            handleBattleMode={handleBattleMode}
          />
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
