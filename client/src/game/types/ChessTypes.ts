/**
 * ChessTypes.ts
 * 
 * Type definitions for Ragnarok Chess integration.
 * Chess pieces map to Hearthstone hero classes for combat.
 */

import { HeroClass, CardData } from '../types';

/**
 * Element types for the weakness system
 * Core cycle: Fire → Earth → Wind → Water → Fire
 * Special: Holy beats Shadow/Undead, Shadow beats Holy
 */
export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'holy' | 'shadow' | 'neutral';

/**
 * Element weakness chart - which element is STRONG against which
 * Key element beats Value elements
 */
export const ELEMENT_STRENGTHS: Record<ElementType, ElementType[]> = {
  fire: ['earth'],      // Fire burns Earth
  water: ['fire'],      // Water extinguishes Fire
  wind: ['water'],      // Wind evaporates Water  
  earth: ['wind'],      // Earth grounds Wind
  holy: ['shadow'],     // Holy vanquishes Shadow
  shadow: ['holy'],     // Shadow corrupts Holy
  neutral: []           // Neutral has no advantages
};

/**
 * Get element advantage buff if attacker is strong vs defender
 * Returns +2 attack and +2 health buff values
 */
export const getElementAdvantage = (attackerElement: ElementType, defenderElement: ElementType): { attackBonus: number; healthBonus: number } => {
  const strengths = ELEMENT_STRENGTHS[attackerElement];
  if (strengths.includes(defenderElement)) {
    return { attackBonus: 2, healthBonus: 2 };
  }
  return { attackBonus: 0, healthBonus: 0 };
};

/**
 * Element colors for visual display
 */
export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#ff6b35',    // Orange-red
  water: '#4fc3f7',   // Light blue
  wind: '#81c784',    // Light green
  earth: '#a1887f',   // Brown
  holy: '#ffd54f',    // Gold
  shadow: '#9c27b0',  // Purple
  neutral: '#9e9e9e'  // Gray
};

/**
 * Element icons/emojis for display
 */
export const ELEMENT_ICONS: Record<ElementType, string> = {
  fire: '🔥',
  water: '💧',
  wind: '🌪️',
  earth: '🌍',
  holy: '✨',
  shadow: '🌑',
  neutral: '⚪'
};

/**
 * Chess piece types (10 pieces per player: 5 pawns + 5 main pieces)
 */
export type ChessPieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

/**
 * Player side (similar to chess black/white)
 */
export type ChessPlayerSide = 'player' | 'opponent';

/**
 * Board dimensions - Ragnarok uses 7x5 board (3 empty rows between armies)
 */
export const BOARD_ROWS = 7;
export const BOARD_COLS = 5;

/**
 * Individual chess piece on the board
 */
export interface ChessPiece {
  id: string;
  type: ChessPieceType;
  owner: ChessPlayerSide;
  position: ChessBoardPosition;
  health: number;
  maxHealth: number;
  stamina: number;
  heroClass: HeroClass;
  heroName: string;
  heroPortrait?: string;
  deckCardIds: number[];  // User-built 30-card deck (loaded from heroDeckStore)
  fixedCards?: number[];  // DEPRECATED: Legacy fixed cards, use deckCardIds instead
  hasSpells: boolean;
  hasMoved: boolean;
  element: ElementType;
}

/**
 * Element assignments per piece type per side
 * Player and Opponent have different elements to create asymmetric matchups
 */
export const PIECE_ELEMENTS: Record<ChessPlayerSide, Record<ChessPieceType, ElementType>> = {
  player: {
    king: 'holy',
    queen: 'fire',
    rook: 'earth',
    bishop: 'wind',
    knight: 'water',
    pawn: 'neutral'
  },
  opponent: {
    king: 'shadow',
    queen: 'water',
    rook: 'wind',
    bishop: 'earth',
    knight: 'fire',
    pawn: 'neutral'
  }
};

/**
 * Position on the chess board
 */
export interface ChessBoardPosition {
  row: number;
  col: number;
}

/**
 * Chess board state
 */
export interface ChessBoardState {
  pieces: ChessPiece[];
  currentTurn: ChessPlayerSide;
  selectedPiece: ChessPiece | null;
  validMoves: ChessBoardPosition[];
  attackMoves: ChessBoardPosition[];
  gameStatus: ChessGameStatus;
  moveCount: number;
  inCheck: ChessPlayerSide | null; // Which side's King is in check (null = no check)
}

/**
 * Game status
 */
export type ChessGameStatus = 'setup' | 'playing' | 'combat' | 'player_wins' | 'opponent_wins';

/**
 * Movement pattern for a piece type
 */
export interface MovementPattern {
  type: 'line' | 'point' | 'l_shape' | 'surround';
  directions?: { row: number; col: number }[];
  maxDistance?: number;
}

/**
 * Movement patterns for each piece type (from Ragnarok repo)
 */
export const PIECE_MOVEMENT_PATTERNS: Record<ChessPieceType, MovementPattern> = {
  queen: {
    type: 'line',
    directions: [
      { row: 1, col: 0 }, { row: -1, col: 0 },
      { row: 0, col: 1 }, { row: 0, col: -1 },
      { row: 1, col: 1 }, { row: -1, col: -1 },
      { row: 1, col: -1 }, { row: -1, col: 1 }
    ]
  },
  king: {
    type: 'surround',
    directions: [
      { row: 1, col: 0 }, { row: -1, col: 0 },
      { row: 0, col: 1 }, { row: 0, col: -1 },
      { row: 1, col: 1 }, { row: -1, col: -1 },
      { row: 1, col: -1 }, { row: -1, col: 1 }
    ],
    maxDistance: 1
  },
  rook: {
    type: 'line',
    directions: [
      { row: 1, col: 0 }, { row: -1, col: 0 },
      { row: 0, col: 1 }, { row: 0, col: -1 }
    ]
  },
  bishop: {
    type: 'line',
    directions: [
      { row: 1, col: 1 }, { row: -1, col: -1 },
      { row: 1, col: -1 }, { row: -1, col: 1 }
    ]
  },
  knight: {
    type: 'l_shape',
    directions: [
      { row: -2, col: -1 }, { row: 2, col: -1 },
      { row: -1, col: -2 }, { row: -1, col: 2 },
      { row: -2, col: 1 }, { row: 2, col: 1 },
      { row: 1, col: -2 }, { row: 1, col: 2 }
    ]
  },
  pawn: {
    type: 'point',
    directions: [{ row: 1, col: 0 }],
    maxDistance: 1
  }
};

/**
 * Piece stats configuration (HP, base stats per type)
 */
export interface ChessPieceStats {
  baseHealth: number;
  spellSlots: number;
  hasSpells: boolean;
}

/**
 * Base stats for each piece type (from Ragnarok GDD)
 */
export const PIECE_BASE_STATS: Record<ChessPieceType, ChessPieceStats> = {
  king: { baseHealth: 100, spellSlots: 0, hasSpells: false },
  queen: { baseHealth: 100, spellSlots: 33, hasSpells: true },
  rook: { baseHealth: 100, spellSlots: 30, hasSpells: true },
  bishop: { baseHealth: 100, spellSlots: 30, hasSpells: true },
  knight: { baseHealth: 100, spellSlots: 30, hasSpells: true },
  pawn: { baseHealth: 100, spellSlots: 0, hasSpells: false }
};

/**
 * Initial board setup (row 0 = player back row, row 6 = opponent back row)
 * 3 empty rows between armies (rows 2, 3, 4) for strategic depth
 */
export interface InitialPiecePosition {
  type: ChessPieceType;
  col: number;
  row: number;
}

/**
 * Player's starting positions (back row + pawn row)
 */
export const PLAYER_INITIAL_POSITIONS: InitialPiecePosition[] = [
  { type: 'knight', col: 0, row: 0 },
  { type: 'queen', col: 1, row: 0 },
  { type: 'king', col: 2, row: 0 },
  { type: 'bishop', col: 3, row: 0 },
  { type: 'rook', col: 4, row: 0 },
  { type: 'pawn', col: 0, row: 1 },
  { type: 'pawn', col: 1, row: 1 },
  { type: 'pawn', col: 2, row: 1 },
  { type: 'pawn', col: 3, row: 1 },
  { type: 'pawn', col: 4, row: 1 }
];

/**
 * Opponent's starting positions (mirrored, row 6 back, row 5 pawns)
 */
export const OPPONENT_INITIAL_POSITIONS: InitialPiecePosition[] = [
  { type: 'rook', col: 0, row: 6 },
  { type: 'queen', col: 3, row: 6 },
  { type: 'bishop', col: 1, row: 6 },
  { type: 'king', col: 2, row: 6 },
  { type: 'knight', col: 4, row: 6 },
  { type: 'pawn', col: 0, row: 5 },
  { type: 'pawn', col: 1, row: 5 },
  { type: 'pawn', col: 2, row: 5 },
  { type: 'pawn', col: 3, row: 5 },
  { type: 'pawn', col: 4, row: 5 }
];

/**
 * Army selection - player picks variants for each piece type
 */
export interface ArmySelection {
  king: ChessPieceHero;
  queen: ChessPieceHero;
  rook: ChessPieceHero;
  bishop: ChessPieceHero;
  knight: ChessPieceHero;
}

/**
 * Hero variant for a chess piece
 * NOTE: Deck cards are now user-built via heroDeckStore, not fixed per hero
 */
export interface ChessPieceHero {
  id: string;
  name: string;
  heroClass: HeroClass;
  description: string;
  portrait?: string;
  fixedCardIds?: number[];  // DEPRECATED: Use heroDeckStore for user-built decks
  passiveEffect?: string; // For King pieces with army-wide passive abilities
  element?: string; // Norse element type (fire, water, ice, grass, light, dark, electric)
  norseHeroId?: string; // Links to NorseHero definition for heroPower/weaponUpgrade/passive
}

/**
 * Collision event when pieces meet
 */
export interface ChessCollision {
  attacker: ChessPiece;
  defender: ChessPiece;
  attackerPosition: ChessBoardPosition;
  defenderPosition: ChessBoardPosition;
  instantKill?: boolean; // True for pawn/king attacks (Valkyrie weapon - no PvP combat)
}

/**
 * Combat result after poker battle
 */
export interface CombatResult {
  winner: ChessPiece;
  loser: ChessPiece;
  winnerNewHealth: number;
}
