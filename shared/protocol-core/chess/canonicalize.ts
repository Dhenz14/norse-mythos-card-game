/**
 * canonicalize.ts — deterministic JSON canonicalization for `ChessBoardSnapshot`.
 *
 * Companion to `shared/protocol-core/chess/state.ts`: produces a byte-equal
 * JSON string from the same snapshot on every peer. The output is fed to a
 * cryptographic hash (SHA-256) by the client engine binding so chess
 * envelopes can carry a tamper-evident `prevChessStateHash`.
 *
 * Coverage (anti-cheat audit surface — keep this list aligned with the
 * `ChessProtocolPiece` and `ChessBoardSnapshot` interfaces):
 *
 *   ChessBoardSnapshot:
 *     - currentTurn       (whose move it is)
 *     - gameStatus        (setup | playing | combat | *_wins)
 *     - moveCount         (total plies — replay protection across resyncs)
 *     - inCheck           (side currently in check, or null)
 *     - pieces            (sorted by id; see canonicalPiece below)
 *
 *   ChessProtocolPiece (each):
 *     - id                (deterministic from SeededIdGen post-handshake)
 *     - type              (king | queen | rook | bishop | knight | pawn)
 *     - owner             (player | opponent — global, not viewer-relative)
 *     - position.row, position.col
 *     - hasMoved          (gates first-move legality)
 *
 * What is NOT covered (deliberately, per the `state.ts` doc — "no
 * hero/health/element/deck data here"):
 *
 *   - piece.health / piece.element / piece.stamina — these live on the
 *     rich client `ChessPiece`, not on `ChessProtocolPiece`. A hostile peer
 *     can mutate them locally without changing this hash. Closing that
 *     blind spot is a separate workstream (analogous to the cards-side
 *     equipment/hero blind spot called out in TD-27c-cards `ca5dff8`).
 *   - UI overlays: selection, move highlights, animation timers. By
 *     construction (the `ChessBoardSnapshot` type does not carry them).
 *
 * The output is order-invariant across peer-local insertion order:
 *
 *   - `pieces` is sorted by `id` lex-ascending so two snapshots with the
 *     same multiset of pieces hash identically regardless of how each
 *     peer's array was assembled.
 *   - object keys are emitted in a fixed lexicographic order; nested
 *     objects (e.g. `position`) follow the same rule via the recursive
 *     helper.
 *
 * Determinism floor: SAFE_INTEGER mathematics only. Numbers serialize via
 * `String(n)`; non-finite values would be a programming bug at the
 * boundary, not a runtime concern (snapshot integers come from a seeded
 * id-gen and from board geometry).
 */

import type {
	ChessBoardSnapshot,
	ChessProtocolPiece,
} from './index';

function escapeJsonString(s: string): string {
	let out = '"';
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i);
		if (c === 0x22) out += '\\"';
		else if (c === 0x5c) out += '\\\\';
		else if (c === 0x08) out += '\\b';
		else if (c === 0x0c) out += '\\f';
		else if (c === 0x0a) out += '\\n';
		else if (c === 0x0d) out += '\\r';
		else if (c === 0x09) out += '\\t';
		else if (c < 0x20) out += '\\u' + c.toString(16).padStart(4, '0');
		else out += s[i];
	}
	return out + '"';
}

function canonicalPiece(p: ChessProtocolPiece): string {
	const parts: string[] = [
		'"hasMoved":' + (p.hasMoved ? 'true' : 'false'),
		'"id":' + escapeJsonString(p.id),
		'"owner":' + escapeJsonString(p.owner),
		'"position":{"col":' + String(p.position.col) + ',"row":' + String(p.position.row) + '}',
		'"type":' + escapeJsonString(p.type),
	];
	return '{' + parts.join(',') + '}';
}

/**
 * Produce the canonical bytestring for a chess board snapshot. Pure: same
 * input always returns the same output, with no dependency on iteration
 * order, locale, or wall-clock state.
 *
 * Hash this string to obtain `prevChessStateHash`. The hash function lives
 * in `client/src/game/engine/chessHash.ts` so the WASM SHA-256 primitive
 * stays out of `shared/`.
 */
export function canonicalChessSnapshot<P extends ChessProtocolPiece>(
	snapshot: ChessBoardSnapshot<P>,
): string {
	const sortedPieces = [...snapshot.pieces].sort((a, b) =>
		a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
	);
	const piecesJson = '[' + sortedPieces.map(canonicalPiece).join(',') + ']';
	const inCheckJson = snapshot.inCheck === null ? 'null' : escapeJsonString(snapshot.inCheck);
	const parts: string[] = [
		'"currentTurn":' + escapeJsonString(snapshot.currentTurn),
		'"gameStatus":' + escapeJsonString(snapshot.gameStatus),
		'"inCheck":' + inCheckJson,
		'"moveCount":' + String(snapshot.moveCount),
		'"pieces":' + piecesJson,
	];
	return '{' + parts.join(',') + '}';
}
