/**
 * chessWireSender — outgoing side of the chess_command envelope flow.
 *
 * Sits between the chess UI (where the local move is initiated) and the
 * peerStore transport. Stays out of `useP2PSync` so the chess UI doesn't
 * have to drag in the entire P2P-cards stack to send one envelope.
 *
 * Reads `matchId` from gameStore (mirrored there by useP2PSync after
 * seed_reveal). No-ops when matchId is null — caller can call this
 * unconditionally from the move flow; SP / pre-handshake paths are
 * silently filtered.
 *
 * Outgoing seq counter is module-local. `useP2PSync` resets it on
 * disconnect via `resetChessWireSender()` so reconnects start fresh.
 *
 * Prelim scope (C-Chess.7-prelim):
 * - Only `chess_move` commands (concede / draw / mine deferred per
 *   the wire schema's alpha surface).
 * - `prevStateHash` is a placeholder until `computeChessStateHash`
 *   lands in C-Chess.5. Receiver accepts any value in prelim.
 */

import { useGameStore } from '../stores/gameStore';
import { usePeerStore } from '../stores/peerStore';
import type { ChessBoardPosition } from '../types/ChessTypes';
import type { ChessCommandEnvelope } from '../../../../shared/p2p-wire/chess';
import { debug } from '../config/debugConfig';
import { recordMove } from '../../data/blockchain/transcriptBuilder';
import { localPlayerId } from '../../data/blockchain/playerIdentity';
import { getNFTBridge } from '../nft';

let outgoingChessSeq = 0;

const PREV_STATE_HASH_PLACEHOLDER = 'prelim-no-hash-yet';

export interface ChessMoveEmit {
	readonly pieceId: string;
	readonly from: ChessBoardPosition;
	readonly to: ChessBoardPosition;
}

/**
 * Send a chess_move envelope to the connected peer. Returns true on send,
 * false when no P2P session is active (silent no-op for SP).
 */
export function sendChessMove(move: ChessMoveEmit): boolean {
	const { matchId, myCanonicalSide } = useGameStore.getState();
	if (!matchId) {
		// SP or pre-handshake — nothing to send.
		console.warn('[chessWireSender] SKIP: no matchId (SP or pre-handshake)', {
			move,
			myCanonicalSide,
		});
		return false;
	}

	const send = usePeerStore.getState().send;
	const connectionState = usePeerStore.getState().connectionState;
	if (connectionState !== 'connected') {
		console.warn('[chessWireSender] SKIP: not connected', { connectionState });
		return false;
	}

	const envelope: ChessCommandEnvelope = {
		type: 'chess_command',
		matchId,
		seq: outgoingChessSeq++,
		commandId: crypto.randomUUID(),
		prevStateHash: PREV_STATE_HASH_PLACEHOLDER,
		command: {
			type: 'chess_move',
			pieceId: move.pieceId,
			from: move.from,
			to: move.to,
		},
	};

	// Unconditional console.log — temporary diagnostic for prelim. Will move
	// back to debug.chess once the channel is verified active for users.
	console.log('[chessWireSender] SEND chess_command', {
		seq: envelope.seq,
		commandId: envelope.commandId.slice(0, 8),
		matchId: matchId.slice(0, 8),
		mySide: myCanonicalSide,
		piece: move.pieceId.slice(0, 8),
		from: move.from,
		to: move.to,
	});
	send(envelope);

	// Transcript: record this peer's move so the local transcript (and the
	// host's authoritative one when this peer IS the host) reflects the action
	// under the correct Hive identity. Falls back to a guest sentinel when no
	// Hive username is bound — see `playerIdentity.ts`.
	recordMove('chess_move', {
		pieceId: move.pieceId,
		from: move.from,
		to: move.to,
		commandId: envelope.commandId,
		seq: envelope.seq,
	}, localPlayerId({
		hiveUsername: getNFTBridge().getUsername(),
		myPeerId: usePeerStore.getState().myPeerId,
	}));

	debug.chess(`[chessWireSender] sent chess_move seq=${envelope.seq} piece=${move.pieceId.slice(0, 8)} (${move.from.row},${move.from.col})→(${move.to.row},${move.to.col})`);
	return true;
}

/**
 * Reset module-local seq counter. Called by useP2PSync on disconnect so a
 * reconnected session starts at seq 0 (matching the receive-side reset of
 * `lastIncomingChessSeqRef`).
 */
export function resetChessWireSender(): void {
	outgoingChessSeq = 0;
}
