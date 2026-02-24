/**
 * replayRules.ts - Deterministic op handlers for Hive chain replay
 *
 * Each handler receives a validated custom_json op and applies the
 * appropriate state change to IndexedDB via replayDB.ts.
 *
 * All handlers are idempotent — replaying the same op twice is safe.
 * Op payloads are validated minimally: reject malformed, accept partial data.
 */

import { putCard, putMatch, getCard } from './replayDB';
import type { HiveCardAsset, HiveMatchResult } from '../schemas/HiveTypes';

export interface RawOp {
	id: string;           // custom_json id, e.g. 'rp_match_result'
	json: string;         // raw JSON string from chain
	broadcaster: string;  // account that signed the op
	trxId: string;        // transaction id from Hive
	blockNum: number;
	timestamp: number;    // unix ms
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export async function applyOp(op: RawOp): Promise<void> {
	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(op.json) as Record<string, unknown>;
	} catch {
		return; // malformed JSON — skip silently
	}

	switch (op.id) {
		case 'rp_match_result':
			return applyMatchResult(op, payload);
		case 'rp_card_transfer':
			return applyCardTransfer(op, payload);
		case 'rp_pack_open':
			return applyPackOpen(op, payload);
		case 'rp_team_submit':
			return; // informational only, no IndexedDB state change
		case 'rp_reward_claim':
			return; // token accounting reserved for future implementation
		default:
			return; // unknown prefix op — ignore
	}
}

// ---------------------------------------------------------------------------
// rp_match_result — record a completed match
// ---------------------------------------------------------------------------

async function applyMatchResult(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const { matchId, player1, player2, winnerId, matchType, duration, totalRounds, seed } = payload;

	if (
		typeof matchId !== 'string' ||
		typeof winnerId !== 'string' ||
		!player1 ||
		!player2
	) return;

	const p1 = player1 as Record<string, unknown>;
	const p2 = player2 as Record<string, unknown>;

	// Only a participant may submit a match result
	const isParticipant =
		op.broadcaster === (p1.hiveUsername as string) ||
		op.broadcaster === (p2.hiveUsername as string);
	if (!isParticipant) return;

	const match: HiveMatchResult = {
		matchId: matchId as string,
		timestamp: op.timestamp,
		blockNum: op.blockNum,
		trxId: op.trxId,
		player1: {
			hiveUsername: p1.hiveUsername as string,
			heroIds: (p1.heroIds as string[]) ?? [],
			kingId: (p1.kingId as string) ?? '',
			finalHp: Number(p1.finalHp ?? 0),
			damageDealt: Number(p1.damageDealt ?? 0),
			pokerHandsWon: Number(p1.pokerHandsWon ?? 0),
		},
		player2: {
			hiveUsername: p2.hiveUsername as string,
			heroIds: (p2.heroIds as string[]) ?? [],
			kingId: (p2.kingId as string) ?? '',
			finalHp: Number(p2.finalHp ?? 0),
			damageDealt: Number(p2.damageDealt ?? 0),
			pokerHandsWon: Number(p2.pokerHandsWon ?? 0),
		},
		winnerId: winnerId as string,
		matchType: (matchType as HiveMatchResult['matchType']) ?? 'casual',
		duration: Number(duration ?? 0),
		totalRounds: Number(totalRounds ?? 0),
		seed: (seed as string) ?? '',
	};

	await putMatch(match);
}

// ---------------------------------------------------------------------------
// rp_card_transfer — move a card from one account to another
// ---------------------------------------------------------------------------

async function applyCardTransfer(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const { card_uid, to } = payload;
	if (typeof card_uid !== 'string' || typeof to !== 'string') return;

	const existing = await getCard(card_uid);
	if (!existing) return; // can't transfer a card we haven't minted yet

	// The current owner must be the broadcaster
	if (existing.ownerId !== op.broadcaster) return;

	const updated: HiveCardAsset = {
		...existing,
		ownerId: to,
		lastTransferBlock: op.blockNum,
	};

	await putCard(updated);
}

// ---------------------------------------------------------------------------
// rp_pack_open — deterministic card minting from trxId seed
//
// Card IDs are derived from the transaction id using a seeded LCG.
// This makes the result verifiable by any replay without an oracle.
// ---------------------------------------------------------------------------

const PACK_SIZES: Record<string, number> = {
	starter: 5,
	standard: 5,
	mega: 15,
};

// Park-Miller LCG — full period, good distribution, no BigInt needed
function lcgNext(seed: number): number {
	return (seed * 16807) % 2147483647;
}

function pickFromPool(pool: number[], seed: number, count: number): number[] {
	let s = Math.max(seed, 1); // LCG seed must be >= 1
	return Array.from({ length: count }, () => {
		s = lcgNext(s);
		return pool[s % pool.length];
	});
}

// Card ID pools by pack type — derived from ID_RANGES.md
// Starter: low-cost common neutrals (IDs 1000–1099)
// Standard/Mega: full neutral range (IDs 1000–3999)
function getCardPool(packType: string): number[] {
	const [start, end] =
		packType === 'starter'
			? [1000, 1099]
			: [1000, 3999];

	const pool: number[] = [];
	for (let i = start; i <= end; i++) pool.push(i);
	return pool;
}

async function applyPackOpen(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const packType = (payload.pack_type as string) ?? 'standard';
	const quantity = Math.min(Number(payload.quantity ?? 1), 10);
	const cardCount = (PACK_SIZES[packType] ?? 5) * quantity;
	const pool = getCardPool(packType);

	// Derive deterministic seed from first 8 hex chars of trxId
	const seedHex = op.trxId.replace(/[^0-9a-f]/gi, '').slice(0, 8);
	const seed = parseInt(seedHex || '1', 16);

	const cardIds = pickFromPool(pool, seed, cardCount);

	// Gold foil: ~5% chance, derived from seed
	const isGold = (lcgNext(seed) % 20) === 0;
	// Alpha edition if before block 1,000,000 (approximate launch milestone)
	const edition: HiveCardAsset['edition'] = op.blockNum < 1_000_000 ? 'alpha' : 'beta';

	for (let i = 0; i < cardIds.length; i++) {
		const uid = `${op.trxId}-${i}`;
		const card: HiveCardAsset = {
			uid,
			cardId: cardIds[i],
			ownerId: op.broadcaster,
			edition,
			foil: isGold ? 'gold' : 'standard',
			level: 1,
			xp: 0,
			lastTransferBlock: op.blockNum,
		};
		await putCard(card);
	}
}
