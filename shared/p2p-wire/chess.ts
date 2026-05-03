/**
 * Chess wire schemas — alpha.
 *
 * Why this file exists: chess phase actions cross the P2P wire as their
 * own envelope shape (separate from `GameCommandEnvelope` for cards),
 * because the chess pipeline (`applyChessCommand`) is independent of
 * the cards pipeline (`applyGameCommand`). See session-2 grilling Q1/Q4.
 *
 * Alpha surface (Q2): only `chess_move`. Concede / draw / mine placement
 * are deferred. When a second command type lands, refactor `command` to a
 * `z.discriminatedUnion('type', [...])` — until then a single schema keeps
 * the surface honest about what actually crosses the wire.
 *
 * State hash policy (Q3): `prevStateHash` is the COMBINED hash of
 * `boardState` + `gameState`, computed by `computeChessStateHash`
 * (C-Chess.5). Defense in depth at chess<->poker transitions: a
 * client-side desync in either slice blocks the next chess move.
 *
 * Board dimensions are re-declared here at the trust boundary
 * (BOARD_ROWS=7, BOARD_COLS=5 in client/types/ChessTypes.ts). If the
 * runtime board ever grows, both constants must be updated together —
 * a `tests/protocolConformance.test.ts` style guard would catch drift,
 * but until that exists the duplication is intentional and small.
 */

import { z } from 'zod';

// ── Position ───────────────────────────────────────────────────────────────

const ROW_MIN = 0;
const ROW_MAX = 6; // 7 rows
const COL_MIN = 0;
const COL_MAX = 4; // 5 cols

export const ChessBoardPositionSchema = z
	.object({
		row: z.number().int().min(ROW_MIN).max(ROW_MAX),
		col: z.number().int().min(COL_MIN).max(COL_MAX),
	})
	.strict();

export type WireChessBoardPosition = z.infer<typeof ChessBoardPositionSchema>;

// ── Commands ───────────────────────────────────────────────────────────────

/**
 * `pieceId` is a runtime id minted by `initializeBoard(armies, idGen)`
 * (via the seeded `SeededIdGen`). The 128-char cap is a guardrail against
 * a malformed peer flooding the buffer; real ids are UUID-shaped (~36
 * chars) but staying lenient lets debug tooling pass through.
 */
export const ChessMoveCommandSchema = z
	.object({
		type: z.literal('chess_move'),
		pieceId: z.string().min(1).max(128),
		from: ChessBoardPositionSchema,
		to: ChessBoardPositionSchema,
	})
	.strict()
	.refine(
		(cmd) => cmd.from.row !== cmd.to.row || cmd.from.col !== cmd.to.col,
		{ message: 'chess_move: from and to must differ' },
	);

export type ChessMoveCommand = z.infer<typeof ChessMoveCommandSchema>;

/**
 * Sum type for chess commands. Single-member today; refactor to
 * `z.discriminatedUnion` when a second command (concede, draw, mine)
 * is added.
 */
export const ChessCommandSchema = ChessMoveCommandSchema;
export type ChessCommand = z.infer<typeof ChessCommandSchema>;

// ── Envelope ───────────────────────────────────────────────────────────────

const MATCH_ID_MAX = 64;

export const ChessCommandEnvelopeSchema = z
	.object({
		type: z.literal('chess_command'),
		matchId: z.string().min(1).max(MATCH_ID_MAX),
		seq: z.number().int().nonnegative(),
		commandId: z.string().uuid(),
		prevStateHash: z.string().min(1),
		command: ChessCommandSchema,
	})
	.strict();

export type ChessCommandEnvelope = z.infer<typeof ChessCommandEnvelopeSchema>;

/**
 * Narrow at the wire boundary. Returns the parsed envelope on success,
 * `null` on any validation failure — caller emits a single warn line and
 * drops the message. Throwing here would crash the message handler under
 * an attacker-controlled payload, so we return null and stay running.
 */
export function tryParseChessCommandEnvelope(input: unknown): ChessCommandEnvelope | null {
	const result = ChessCommandEnvelopeSchema.safeParse(input);
	return result.success ? result.data : null;
}
