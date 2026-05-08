/**
 * boardSetup.ts — canonical initial-state primitives for the chess phase.
 *
 * These constants define the deterministic starting board: the piece layout
 * for each side and the per-type base stats used to construct fresh pieces.
 * Both peers (and any future server-side validator) must agree on these
 * values to compute the same initial state hash and the same piece ids
 * (`RagnarokGameCoordinator` already documents this contract — the seeded
 * id-gen iterates these arrays in a fixed order).
 *
 * Stats are gameplay-canon, not UI: `baseHealth` seeds the mutable
 * `health`/`maxHealth` model fields; `spellSlots`/`hasSpells` gate the
 * card-play flow during PvP combat.
 */

import type { ChessPieceType } from './types';

export interface InitialPiecePosition {
	type: ChessPieceType;
	col: number;
	row: number;
}

export interface ChessPieceStats {
	baseHealth: number;
	spellSlots: number;
	hasSpells: boolean;
}

/**
 * Base stats per piece type (from Ragnarok GDD).
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
 * Player's starting positions (back row + pawn row).
 * Row 0 = player back row, row 1 = player pawn row.
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
 * Opponent's starting positions (mirrored, row 6 back, row 5 pawns).
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
