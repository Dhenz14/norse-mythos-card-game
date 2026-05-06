/**
 * chessHash.ts — `prevChessStateHash` for outgoing chess envelopes.
 *
 * Binds the pure canonicalizer in `shared/protocol-core/chess/canonicalize.ts`
 * to the WASM SHA-256 primitive (`hashJsonString`). Sync — preserves the
 * existing chess send-path signature; the chess UI fires moves from a click
 * handler, so introducing async would force every caller to await.
 *
 * Failure-mode policy mirrors `wireHash.computeCardsPrevStateHash`:
 *
 *   snapshot === null  → '' (caller hashed before any state exists; receiver
 *                        retries on empty)
 *   !isWasmReady()     → '' (eager-load race; cleared after handshake)
 *   thrown otherwise   → '' + warn telemetry (defensive: never crash the
 *                        sync click handler)
 *
 * Anti-cheat note: the chess hash domain is everything in
 * `ChessBoardSnapshot<ChessProtocolPiece>` — see the canonicalizer's header
 * for the full audit and known blind spots.
 */

import { hashJsonString, isWasmReady } from './wasmInterface';
import { canonicalChessSnapshot } from '@shared/protocol-core/chess';
import type { ChessBoardSnapshot, ChessProtocolPiece } from '@shared/protocol-core/chess';
import { debug } from '../config/debugConfig';

export function computeChessStateHash<P extends ChessProtocolPiece>(
	snapshot: ChessBoardSnapshot<P> | null,
): string {
	if (!snapshot) return '';
	if (!isWasmReady()) return '';
	try {
		const canonical = canonicalChessSnapshot(snapshot);
		return hashJsonString(canonical);
	} catch (err) {
		debug.warn('[chessHash] prev chess-state hash failed unexpectedly', err);
		return '';
	}
}
