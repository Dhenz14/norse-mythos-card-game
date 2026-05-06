import type { ChessCommandEnvelope } from '../../../../shared/p2p-wire/chess';
import type { PackagedMatchResult } from '../../data/blockchain/types';
import type { GameCommandEnvelope } from '../hooks/p2pEnvelope';
import type { GameState } from '../types';
import type { ArmySelection } from '../types/ChessTypes';

/**
 * Application-level P2P payloads accepted by `peerStore.send`.
 *
 * This centralizes the wire catalog without extracting a sender: call sites
 * keep their current logic, while TypeScript rejects malformed envelopes before
 * they reach the transport buffer.
 */
export type WireMessage =
	| { type: 'init'; gameState: GameState; isHost: boolean; matchId?: string }
	| GameCommandEnvelope
	| { type: 'gameState'; gameState: GameState; stateHash?: string }
	| { type: 'opponentDisconnected' }
	| { type: 'ping' }
	| { type: 'pong' }
	| { type: 'deck_verify'; hiveAccount: string; nftIds: string[] }
	| { type: 'seed_commit'; commitment: string }
	| { type: 'seed_reveal'; salt: string; hiveUsername?: string }
	| { type: 'army_announcement'; army: ArmySelection }
	| { type: 'result_propose'; result: PackagedMatchResult; hash: string; broadcasterSig: string; proposalId: string }
	| { type: 'result_countersign'; counterpartySig: string; proposalId: string }
	| { type: 'result_reject'; reason: string }
	| { type: 'version_check'; buildHash: string }
	| { type: 'wasm_hash_check'; wasmHash: string }
	| { type: 'hash_check'; stateHash: string; turnNumber: number }
	| { type: 'hash_mismatch'; turnNumber: number; myHash: string }
	| { type: 'poker_action'; playerId: string; action: string; hpCommitment?: number }
	| ChessCommandEnvelope;

export interface HeartbeatMessage {
	readonly type: 'heartbeat';
	readonly t: number;
}

export type P2PMessage = WireMessage | HeartbeatMessage;
