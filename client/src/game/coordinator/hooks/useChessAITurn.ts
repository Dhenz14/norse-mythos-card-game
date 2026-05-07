/**
 * useChessAITurn — wires the bot driver into the chess phase.
 *
 * The hook is the single place that decides "is the AI in charge of the
 * opponent right now?". The gate is `!matchSeed`: in single mode no peer
 * exists so the AI plays the opponent; in P2P the seed is set at
 * seed_reveal and remote envelopes drive the opponent instead — firing
 * the AI there would mutate state the remote never agreed to (the
 * `piece_not_found` divergence the codebase already documents).
 *
 * Decision (move scoring) lives in `client/src/game/ai/chessAI.ts` as a
 * pure function. This hook owns orchestration only: timing, retry on
 * pending attack animations, and slice calls (`selectPiece`/`movePiece`).
 */

import { useEffect, useRef } from 'react';
import { useUnifiedCombatStore } from '../../stores/unifiedCombatStore';
import { useGameStore } from '../../stores/gameStore';
import { cryptoRng } from '../../utils/seededRng';
import { pickChessMove } from '../../ai/chessAI';
import { debug } from '../../config/debugConfig';
import type { ChessPiece, ChessGameStatus } from '../../types/ChessTypes';

const FIRST_ATTEMPT_DELAY_MS = 1000;
const ANIMATION_RETRY_DELAY_MS = 200;
const POST_SELECT_DELAY_MS = 500;

interface ChessAITurnOptions {
	readonly enabled: boolean;
}

/**
 * Mount inside the coordinator. Fires the bot's move whenever it becomes
 * the opponent's turn AND the match is not P2P-driven AND the chess
 * phase is active. No-op otherwise.
 */
export function useChessAITurn({ enabled }: ChessAITurnOptions): void {
	const currentTurn = useUnifiedCombatStore(s => s.boardState.currentTurn);
	const gameStatus = useUnifiedCombatStore(s => s.boardState.gameStatus);
	const matchSeed = useGameStore(s => s.matchSeed);

	// Stash the running timeouts so an unmount or a turn change cancels
	// pending callbacks before they touch a stale store.
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const clearPending = () => {
			if (timeoutRef.current !== null) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};

		if (!enabled) return clearPending;
		if (currentTurn !== 'opponent') return clearPending;
		if (gameStatus !== 'playing') return clearPending;
		if (matchSeed) return clearPending; // P2P: remote peer drives this turn

		timeoutRef.current = setTimeout(runAITurn, FIRST_ATTEMPT_DELAY_MS);
		return clearPending;
	}, [enabled, currentTurn, gameStatus, matchSeed]);
}

const runAITurn = (): void => {
	const slice = useUnifiedCombatStore.getState();
	if (slice.boardState.currentTurn !== 'opponent') return;
	if (slice.boardState.gameStatus !== 'playing') return;

	const opponentPieces = slice.boardState.pieces.filter(p => p.owner === 'opponent');
	const rng = slice._chessRng ?? cryptoRng;

	const move = pickChessMove<ChessPiece>(opponentPieces, {
		getValidMoves: (piece) => slice.getValidMoves(piece),
		getPieceAt: (position) => slice.getPieceAt(position),
		rng,
	});

	if (!move) {
		debug.ai('[AI] No valid moves — stalemate, awarding player_wins');
		slice.setGameStatus('player_wins' as ChessGameStatus);
		return;
	}

	slice.selectPiece(move.piece);
	scheduleAttempt(move);
};

const scheduleAttempt = (
	plan: { piece: ChessPiece; target: { row: number; col: number }; isAttack: boolean; score: number }
): void => {
	setTimeout(() => attemptMove(plan), POST_SELECT_DELAY_MS);
};

const attemptMove = (
	plan: { piece: ChessPiece; target: { row: number; col: number }; isAttack: boolean; score: number }
): void => {
	const slice = useUnifiedCombatStore.getState();
	if (slice.boardState.gameStatus !== 'playing') return;
	if (slice.boardState.currentTurn !== 'opponent') return;

	if (slice.pendingAttackAnimation) {
		debug.ai('[AI] Waiting for animation to complete, retrying...');
		setTimeout(() => attemptMove(plan), ANIMATION_RETRY_DELAY_MS);
		return;
	}

	const piece = slice.boardState.pieces.find(p => p.id === plan.piece.id);
	if (!piece) {
		debug.ai('[AI] Piece no longer exists, skipping move');
		return;
	}

	const { moves, attacks } = slice.getValidMoves(piece);
	const targetStillValid = [...moves, ...attacks].some(
		m => m.row === plan.target.row && m.col === plan.target.col
	);
	if (!targetStillValid) {
		debug.ai('[AI] Target no longer valid, recalculating...');
		slice.selectPiece(null);
		runAITurn();
		return;
	}

	slice.selectPiece(piece);
	const collision = slice.movePiece(plan.target);
	if (!collision) {
		debug.ai(`[AI] Moved ${plan.piece.type} to (${plan.target.row}, ${plan.target.col})`);
	} else if (collision.instantKill) {
		debug.ai(`[AI] Instant kill with ${collision.attacker.type} against ${collision.defender.type}`);
	} else {
		debug.ai(`[AI] PvP combat: ${collision.attacker.type} vs ${collision.defender.type}`);
	}
};
