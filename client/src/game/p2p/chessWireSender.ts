/**
 * chessWireSender — outgoing side of the chess_command envelope flow.
 *
 * Sits between the chess UI (where the local move is initiated) and the
 * peerStore transport. Stays out of `useWireSync` so the chess UI doesn't
 * have to drag in the entire P2P-cards stack to send one envelope.
 *
 * Reads `matchId` from gameStore (mirrored there by useWireSync after
 * seed_reveal). No-ops when matchId is null — caller can call this
 * unconditionally from the move flow; SP / pre-handshake paths are
 * silently filtered.
 *
 * Outgoing seq counter is module-local. `useWireSync` resets it on
 * disconnect via `resetChessWireSender()` so reconnects start fresh.
 *
 * Surface (post C-Chess.8):
 * - `sendChessMove`: quiet move (no capture).
 * - `sendChessAttack`: instant-kill capture only. The caller (the chess
 *   UI) verifies `isChessAttackInstantKill` before invoking; non-instant
 *   captures stay blocked at the UI layer.
 *
 * `prevStateHash` is a placeholder until `computeChessStateHash` lands
 * (C-Chess.5). Receiver accepts any non-empty value today.
 *
 * Transcript writes (C3): this module is now a PURE send. The transcript
 * write that previously lived inline is delegated to a bridge-registered
 * observer (`setChessSendObserver`), so every `recordMove` call across
 * cards/poker/chess is funneled through `useWireSync` — the single audit
 * point for OPEN-2 (deterministic transcript ordering).
 */

import { useGameStore } from '../stores/gameStore';
import { usePeerStore } from '../stores/peerStore';
import type { ChessBoardPosition } from '../types/ChessTypes';
import type { ChessAttackCommand, ChessCommand, ChessCommandEnvelope, ChessMoveCommand } from '../../../../shared/p2p-wire/chess';
import { debug } from '../config/debugConfig';

let outgoingChessSeq = 0;

/**
 * Bridge-registered post-send hook. Fired once per successfully-sent
 * envelope so the bridge can write the corresponding transcript entry
 * with its own identity policy (localPlayerId, hiveUsername, etc.).
 *
 * Module-singleton because the bridge mounts once per P2P session via
 * P2PProvider; `setChessSendObserver(null)` on bridge unmount.
 */
export type ChessSendObserver = (
	envelope: ChessCommandEnvelope,
	transcriptExtra: Record<string, unknown>,
) => void;

let chessSendObserver: ChessSendObserver | null = null;

export function setChessSendObserver(observer: ChessSendObserver | null): void {
	chessSendObserver = observer;
}

const PREV_STATE_HASH_PLACEHOLDER = 'prelim-no-hash-yet';

export interface ChessMoveEmit {
	readonly pieceId: string;
	readonly from: ChessBoardPosition;
	readonly to: ChessBoardPosition;
}

export interface ChessAttackEmit {
	readonly pieceId: string;
	readonly from: ChessBoardPosition;
	readonly to: ChessBoardPosition;
	readonly defenderId: string;
}

/**
 * Build + send a chess_command envelope around the given inner command,
 * record the corresponding transcript entry, and log diagnostics. Both
 * outgoing paths (move, attack) flow through here so seq counter +
 * matchId gating + transcript identity policy live in one place.
 */
function dispatchChessCommand(
	command: ChessCommand,
	transcriptExtra: Record<string, unknown>,
): boolean {
	const { matchId, myCanonicalSide } = useGameStore.getState();
	if (!matchId) {
		// SP or pre-handshake — nothing to send.
		console.warn('[chessWireSender] SKIP: no matchId (SP or pre-handshake)', {
			commandType: command.type,
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
		command,
	};

	// Unconditional console.log — temporary diagnostic. Will move back to
	// debug.chess once the channel is verified active for users.
	console.log('[chessWireSender] SEND chess_command', {
		commandType: command.type,
		seq: envelope.seq,
		commandId: envelope.commandId.slice(0, 8),
		matchId: matchId.slice(0, 8),
		mySide: myCanonicalSide,
		piece: command.pieceId.slice(0, 8),
		from: command.from,
		to: command.to,
	});
	send(envelope);

	// Transcript: delegated to the bridge-registered observer (C3). Pre-C3
	// this module called `recordMove` inline; centralising in the bridge
	// keeps a single audit point for transcript ordering policy (OPEN-2).
	try {
		chessSendObserver?.(envelope, transcriptExtra);
	} catch (error) {
		debug.warn('[chessWireSender] transcript observer failed after send', error);
	}

	debug.chess(`[chessWireSender] sent ${command.type} seq=${envelope.seq} piece=${command.pieceId.slice(0, 8)} (${command.from.row},${command.from.col})→(${command.to.row},${command.to.col})`);
	return true;
}

/**
 * Send a chess_move envelope (quiet move). Returns true on send, false
 * when no P2P session is active (silent no-op for SP).
 */
export function sendChessMove(move: ChessMoveEmit): boolean {
	const command: ChessMoveCommand = {
		type: 'chess_move',
		pieceId: move.pieceId,
		from: move.from,
		to: move.to,
	};
	return dispatchChessCommand(command, {});
}

/**
 * Send a chess_attack envelope (instant-kill capture only). The caller
 * MUST have verified `isChessAttackInstantKill` returns true before
 * invoking. Receiver re-verifies and rejects with
 * `non_instant_capture_not_supported_p2p` otherwise.
 */
export function sendChessAttack(attack: ChessAttackEmit): boolean {
	const command: ChessAttackCommand = {
		type: 'chess_attack',
		pieceId: attack.pieceId,
		from: attack.from,
		to: attack.to,
		defenderId: attack.defenderId,
	};
	return dispatchChessCommand(command, {
		defenderId: attack.defenderId,
		isInstantKill: true,
	});
}

/**
 * Reset module-local seq counter. Called by useWireSync on disconnect so a
 * reconnected session starts at seq 0 (matching the receive-side reset of
 * `lastIncomingChessSeqRef`).
 */
export function resetChessWireSender(): void {
	outgoingChessSeq = 0;
}
