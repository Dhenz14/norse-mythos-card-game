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
 *
 * Timeout discipline: every setTimeout the driver schedules — first
 * attempt, post-select delay, animation retry — funnels through `schedule`
 * so its id lands in `timeoutsRef`. Effect cleanup clears the whole batch.
 * Without this, a turn change during the planning window leaves orphan
 * timers alive that fire `attemptMove` after a fresh chain has already
 * started — the "doble movimiento" symptom on the chess board.
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

type TimeoutId = ReturnType<typeof setTimeout>;

interface MovePlan {
	readonly piece: ChessPiece;
	readonly target: { readonly row: number; readonly col: number };
	readonly isAttack: boolean;
	readonly score: number;
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

	// All driver timeouts (first attempt, post-select, animation retry)
	// land here. Cleanup walks the array so a turn flip mid-chain cannot
	// leave a stray attemptMove queued behind us.
	const timeoutsRef = useRef<TimeoutId[]>([]);

	useEffect(() => {
		const timeouts = timeoutsRef.current;

		const clearAllTimeouts = () => {
			for (const id of timeouts) clearTimeout(id);
			timeouts.length = 0;
		};

		const schedule = (fn: () => void, ms: number): void => {
			const id = setTimeout(() => {
				const idx = timeouts.indexOf(id);
				if (idx !== -1) timeouts.splice(idx, 1);
				fn();
			}, ms);
			timeouts.push(id);
		};

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
			schedule(() => attemptMove(move), POST_SELECT_DELAY_MS);
		};

		const attemptMove = (plan: MovePlan): void => {
			const slice = useUnifiedCombatStore.getState();
			if (slice.boardState.gameStatus !== 'playing') return;
			if (slice.boardState.currentTurn !== 'opponent') return;

			if (slice.pendingAttackAnimation) {
				debug.ai('[AI] Waiting for animation to complete, retrying...');
				schedule(() => attemptMove(plan), ANIMATION_RETRY_DELAY_MS);
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

		if (!enabled) return clearAllTimeouts;
		if (currentTurn !== 'opponent') return clearAllTimeouts;
		if (gameStatus !== 'playing') return clearAllTimeouts;
		if (matchSeed) return clearAllTimeouts; // P2P: remote peer drives this turn

		schedule(runAITurn, FIRST_ATTEMPT_DELAY_MS);
		return clearAllTimeouts;
	}, [enabled, currentTurn, gameStatus, matchSeed]);
}
