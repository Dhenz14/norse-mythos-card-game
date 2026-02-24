/**
 * matchAnchor.ts - Dual-sig match start anchor protocol
 *
 * Implements the match_start anchor from HIVE_BLOCKCHAIN_BLUEPRINT.md § 7.0.
 *
 * Before gameplay begins, both players broadcast a `rp_match_start` custom_json op.
 * This creates an immutable on-chain record that:
 *   1. Proves both players showed up (prevents dishonest disconnect claims).
 *   2. Contains a hive_block_ref for temporal anchoring.
 *   3. Includes PoW to deter queue spam.
 *
 * Flow:
 *   1. Host generates matchId and broadcasts their anchor.
 *   2. Host sends matchId + anchor trxId to client via P2P.
 *   3. Client broadcasts their anchor acknowledging the matchId.
 *   4. Both anchors are on-chain → game proceeds. 30s timeout per side.
 *
 * Usage:
 *   const result = await broadcastMatchAnchor({ matchId, opponent, heroId, deckHash });
 *   const ok = await waitForOpponentAnchor(matchId, opponentUsername, 30_000);
 */

import { hiveSync } from '../HiveSync';
import { sha256Hash, canonicalStringify } from './hashUtils';
import { computePoW, POW_CONFIG } from './proofOfWork';

const MATCH_START_TIMEOUT_MS = 30_000;
const HIVE_NODES = [
	'https://api.hive.blog',
	'https://api.deathwing.me',
	'https://api.openhive.network',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchAnchorPayload {
	app: string;
	type: 'rp_match_start';
	match_id: string;
	opponent: string;
	hero_id: string;
	deck_hash: string;
	block_ref: string;
	pow: { nonces: number[] };
}

export interface MatchAnchorResult {
	success: boolean;
	trxId?: string;
	blockNum?: number;
	error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getHeadBlockRef(): Promise<string> {
	for (const node of HIVE_NODES) {
		try {
			const res = await fetch(node, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'condenser_api.get_dynamic_global_properties',
					params: [],
					id: 1,
				}),
				signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
			});
			const data = await res.json() as { result?: { head_block_id?: string } };
			if (data.result?.head_block_id) return data.result.head_block_id;
		} catch {
			// try next node
		}
	}
	// Fallback: use timestamp-based ref if all nodes fail
	return sha256Hash(`fallback:${Date.now()}`);
}

// ---------------------------------------------------------------------------
// Broadcast
// ---------------------------------------------------------------------------

export async function broadcastMatchAnchor(params: {
	matchId: string;
	opponent: string;
	heroId: string;
	deckHash: string;
}): Promise<MatchAnchorResult> {
	const { matchId, opponent, heroId, deckHash } = params;

	const blockRef = await getHeadBlockRef();

	// PoW over canonical payload (excludes pow field itself)
	const payloadForPow = canonicalStringify({
		match_id: matchId,
		opponent,
		hero_id: heroId,
		deck_hash: deckHash,
		block_ref: blockRef,
	});
	const payloadHash = await sha256Hash(payloadForPow);
	const pow = await computePoW(payloadHash, POW_CONFIG.MATCH_START);

	const payload: MatchAnchorPayload = {
		app: 'ragnarok-cards/1.0',
		type: 'rp_match_start',
		match_id: matchId,
		opponent,
		hero_id: heroId,
		deck_hash: deckHash,
		block_ref: blockRef,
		pow: { nonces: pow.nonces },
	};

	return hiveSync.broadcastCustomJson(
		'rp_match_start' as Parameters<typeof hiveSync.broadcastCustomJson>[0],
		payload as unknown as Record<string, unknown>,
		false, // Posting key
	);
}

// ---------------------------------------------------------------------------
// Wait for opponent anchor (polls Hive account history)
// ---------------------------------------------------------------------------

export async function waitForOpponentAnchor(
	matchId: string,
	opponentUsername: string,
	timeoutMs: number = MATCH_START_TIMEOUT_MS,
): Promise<boolean> {
	const deadline = Date.now() + timeoutMs;
	const POLL_INTERVAL = 3000;

	while (Date.now() < deadline) {
		const found = await checkOpponentAnchorOnChain(matchId, opponentUsername);
		if (found) return true;
		await new Promise((r) => setTimeout(r, POLL_INTERVAL));
	}

	return false;
}

async function checkOpponentAnchorOnChain(
	matchId: string,
	opponentUsername: string,
): Promise<boolean> {
	for (const node of HIVE_NODES) {
		try {
			const res = await fetch(node, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					method: 'condenser_api.get_account_history',
					params: [opponentUsername, -1, 50],
					id: 1,
				}),
			});
			const data = await res.json() as { result?: [number, { op: [string, { id: string; json: string }] }][] };
			if (!data.result) continue;

			for (const [, entry] of data.result) {
				if (entry.op[0] !== 'custom_json') continue;
				if (entry.op[1].id !== 'rp_match_start') continue;
				try {
					const payload = JSON.parse(entry.op[1].json) as { match_id?: string };
					if (payload.match_id === matchId) return true;
				} catch {
					// malformed JSON — skip
				}
			}
			return false;
		} catch {
			// try next node
		}
	}
	return false;
}
