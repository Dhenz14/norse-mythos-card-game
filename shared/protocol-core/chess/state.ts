/**
 * state.ts — protocol-level board snapshot.
 *
 * The snapshot captures the deterministic, hashable state of the chess
 * phase: who has which pieces where, whose turn it is, terminal status,
 * how many moves have happened, and which side (if any) is in check.
 *
 * It is intentionally generic over the piece shape `P`: the protocol/P2P
 * validator instantiates it with `ChessProtocolPiece` (the minimal tuple),
 * while the client model instantiates it with the richer `ChessPiece`.
 * UI-only fields (selection, move highlights) live in the client overlay
 * (`ChessBoardState`), never in the snapshot — the snapshot is what gets
 * hashed and reconciled across peers.
 */

import type {
	ChessProtocolPiece,
	ChessPlayerSide,
	ChessGameStatus
} from './types';

export interface ChessBoardSnapshot<P extends ChessProtocolPiece = ChessProtocolPiece> {
	pieces: P[];
	currentTurn: ChessPlayerSide;
	gameStatus: ChessGameStatus;
	moveCount: number;
	/** Side whose king is currently in check (`null` = neither). */
	inCheck: ChessPlayerSide | null;
}
