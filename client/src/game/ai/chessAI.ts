/**
 * chessAI.ts — pure move-selection for the opponent bot.
 *
 * `pickChessMove` is a deterministic decision function: given a snapshot of
 * the board (the opponent's pieces, the legal moves/attacks per piece, and
 * a seeded RNG for tie-breaking) it returns the best move it can find, or
 * `null` if no legal move exists (stalemate from the bot's perspective).
 *
 * No timers, no setState, no Zustand access. The orchestration concerns
 * (when to fire, how to retry on pending animations, how to call
 * selectPiece/movePiece on the slice) live in `useChessAITurn`. Keeping
 * the decision pure means the AI is testable and — should we ever want a
 * cross-peer deterministic bot — the same `pickChessMove` plus a shared
 * seed produces the same plan on both sides.
 */

import type { ChessBoardPosition, ChessPieceType, ChessProtocolPiece } from '@shared/protocol-core/chess';

export interface AIChessHelpers<P extends ChessProtocolPiece> {
	getValidMoves: (piece: P) => { moves: ChessBoardPosition[]; attacks: ChessBoardPosition[] };
	getPieceAt: (position: ChessBoardPosition) => P | null;
	rng: () => number;
}

export interface AIChessMove<P extends ChessProtocolPiece> {
	piece: P;
	target: ChessBoardPosition;
	isAttack: boolean;
	score: number;
}

const PIECE_VALUE: Record<ChessPieceType, number> = {
	king: 1000,
	queen: 90,
	rook: 50,
	bishop: 30,
	knight: 30,
	pawn: 10,
};

const isInstantKillAttacker = (type: ChessPieceType): boolean =>
	type === 'pawn' || type === 'king';

const scoreAttack = <P extends ChessProtocolPiece>(
	attacker: P,
	defender: P
): number => {
	const attackerValue = PIECE_VALUE[attacker.type];
	const targetValue = PIECE_VALUE[defender.type];
	const isInstantKill =
		isInstantKillAttacker(attacker.type) || defender.type === 'pawn';

	if (isInstantKill) {
		const instantKillBonus = isInstantKillAttacker(attacker.type) ? 15 : 10;
		return targetValue + instantKillBonus;
	}
	const riskFactor = attackerValue * 0.3;
	return targetValue - riskFactor;
};

const scoreQuietMove = <P extends ChessProtocolPiece>(
	piece: P,
	move: ChessBoardPosition,
	rng: () => number
): number => {
	const forwardBonus = (piece.position.row - move.row) * 2;
	const pawnPushBonus = piece.type === 'pawn' ? 3 : 0;
	return 5 + forwardBonus + pawnPushBonus + rng() * 3;
};

/**
 * Pick the bot's next move for the side that owns `pieces`. Prefers the
 * highest-scoring capture; if no capture has positive score, falls back
 * to the highest-scoring quiet move. Returns `null` only when the side
 * has zero legal options on the board.
 */
export const pickChessMove = <P extends ChessProtocolPiece>(
	pieces: ReadonlyArray<P>,
	helpers: AIChessHelpers<P>
): AIChessMove<P> | null => {
	let bestAttack: AIChessMove<P> | null = null;
	let bestQuiet: AIChessMove<P> | null = null;

	for (const piece of pieces) {
		const { moves, attacks } = helpers.getValidMoves(piece);

		for (const attack of attacks) {
			const target = helpers.getPieceAt(attack);
			if (!target) continue;
			const score = scoreAttack(piece, target);
			if (score > 0 && (!bestAttack || score > bestAttack.score)) {
				bestAttack = { piece, target: attack, isAttack: true, score };
			}
		}

		for (const move of moves) {
			const score = scoreQuietMove(piece, move, helpers.rng);
			if (!bestQuiet || score > bestQuiet.score) {
				bestQuiet = { piece, target: move, isAttack: false, score };
			}
		}
	}

	return bestAttack ?? bestQuiet;
};
