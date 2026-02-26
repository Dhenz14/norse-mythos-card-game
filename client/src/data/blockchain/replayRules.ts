/**
 * replayRules.ts - Deterministic op handlers for Hive chain replay
 *
 * Each handler receives a validated custom_json op and applies the
 * appropriate state change to IndexedDB via replayDB.ts.
 *
 * All handlers are idempotent — replaying the same op twice is safe.
 * Op payloads are validated minimally: reject malformed, accept partial data.
 *
 * Op dispatch uses the internal "rp_<action>" format. The replay engine
 * normalizes both the canonical "ragnarok-cards" app ID format and the
 * legacy "rp_*" prefix format into this internal form before calling applyOp.
 */

import {
	putCard, putMatch, getCard, deleteCard, getTokenBalance, putTokenBalance,
	getGenesisState, putGenesisState, getSupplyCounter, putSupplyCounter,
	getMatchAnchor, putMatchAnchor, getQueueEntry, putQueueEntry,
	deleteQueueEntry, putSlashedAccount, isAccountSlashed, advancePlayerNonce,
} from './replayDB';
import type { GenesisState, SupplyCounter, MatchAnchor } from './replayDB';
import type { HiveCardAsset, HiveMatchResult } from '../schemas/HiveTypes';
import { hiveEvents } from '../HiveEvents';
import { verifyPoW, type PoWResult } from './proofOfWork';
import { getLevelForXP } from './cardXPSystem';

// The Ragnarok account that can mint during genesis. Set once from the genesis op.
// For now, hardcoded — will be configurable via genesis broadcast.
const RAGNAROK_ACCOUNT = 'ragnarok';

export interface RawOp {
	id: string;           // normalized to "rp_<action>" by replay engine
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

	// Slashed accounts cannot perform any game actions (transfers still allowed)
	const gameActions = new Set([
		'rp_match_start', 'rp_match_result', 'rp_queue_join',
	]);
	if (gameActions.has(op.id) && await isAccountSlashed(op.broadcaster)) return;

	switch (op.id) {
		case 'rp_genesis':
			return applyGenesis(op, payload);
		case 'rp_mint':
			return applyMint(op, payload);
		case 'rp_seal':
			return applySeal(op, payload);
		case 'rp_transfer':
		case 'rp_card_transfer':
			return applyCardTransfer(op, payload);
		case 'rp_burn':
			return applyBurn(op, payload);
		case 'rp_match_start':
			return applyMatchStart(op, payload);
		case 'rp_match_result':
			return applyMatchResult(op, payload);
		case 'rp_queue_join':
			return applyQueueJoin(op, payload);
		case 'rp_queue_leave':
			return applyQueueLeave(op);
		case 'rp_slash_evidence':
			return applySlashEvidence(op, payload);
		case 'rp_pack_open':
			return applyPackOpen(op, payload);
		case 'rp_xp_update':
			return applyXpUpdate(op, payload);
		case 'rp_level_up':
			return applyLevelUp(op, payload);
		case 'rp_team_submit':
			return; // informational only, no IndexedDB state change
		case 'rp_reward_claim':
			return applyRewardClaim(op, payload);
		default:
			return; // unknown op — ignore
	}
}

// ---------------------------------------------------------------------------
// rp_genesis — initialize supply counters (one-time, ever)
// ---------------------------------------------------------------------------

async function applyGenesis(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	if (op.broadcaster !== RAGNAROK_ACCOUNT) return;

	const existing = await getGenesisState();
	if (existing.version) return; // genesis already applied — idempotent

	const totalSupply = Number(payload.total_supply ?? 0);
	const distribution = payload.card_distribution as Record<string, number> | undefined;
	if (!totalSupply || !distribution) return;

	const genesis: GenesisState = {
		key: 'singleton',
		version: (payload.version as string) ?? '1.0',
		totalSupply,
		cardDistribution: distribution,
		sealed: false,
		sealedAtBlock: null,
		readerHash: (payload.reader_hash as string) ?? '',
		genesisBlock: op.blockNum,
	};

	await putGenesisState(genesis);

	for (const [rarity, cap] of Object.entries(distribution)) {
		const counter: SupplyCounter = { rarity, cap, minted: 0 };
		await putSupplyCounter(counter);
	}
}

// ---------------------------------------------------------------------------
// rp_mint — batch mint NFT cards (only Ragnarok account, pre-seal)
// ---------------------------------------------------------------------------

async function applyMint(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	if (op.broadcaster !== RAGNAROK_ACCOUNT) return;

	const genesis = await getGenesisState();
	if (genesis.sealed) return; // post-seal: all mints permanently ignored

	const to = payload.to as string;
	const cards = payload.cards as Array<{ nft_id: string; card_id: string; rarity: string }> | undefined;
	if (!to || !cards || !Array.isArray(cards)) return;

	for (const card of cards) {
		if (!card.nft_id || !card.card_id || !card.rarity) continue;

		// Check supply cap for this rarity
		const counter = await getSupplyCounter(card.rarity);
		if (counter && counter.minted >= counter.cap) continue; // cap reached

		// Check card doesn't already exist (idempotent)
		const existing = await getCard(card.nft_id);
		if (existing) continue;

		const asset: HiveCardAsset = {
			uid: card.nft_id,
			cardId: typeof card.card_id === 'number' ? card.card_id : parseInt(card.card_id, 10) || 0,
			ownerId: to,
			edition: 'alpha',
			foil: 'standard',
			level: 1,
			xp: 0,
			lastTransferBlock: op.blockNum,
		};

		await putCard(asset);

		if (counter) {
			await putSupplyCounter({ ...counter, minted: counter.minted + 1 });
		}
	}
}

// ---------------------------------------------------------------------------
// rp_seal — permanently stop all minting
// ---------------------------------------------------------------------------

async function applySeal(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	if (op.broadcaster !== RAGNAROK_ACCOUNT) return;

	const genesis = await getGenesisState();
	if (!genesis.version) return; // no genesis yet
	if (genesis.sealed) return;   // already sealed

	await putGenesisState({
		...genesis,
		sealed: true,
		sealedAtBlock: op.blockNum,
	});
}

// ---------------------------------------------------------------------------
// rp_burn — permanently remove a card from circulation
// ---------------------------------------------------------------------------

async function applyBurn(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const nftId = (payload.nft_id as string) ?? (payload.card_uid as string);
	if (typeof nftId !== 'string') return;

	const existing = await getCard(nftId);
	if (!existing) return;
	if (existing.ownerId !== op.broadcaster) return;

	await deleteCard(nftId);
}

// ---------------------------------------------------------------------------
// rp_match_start — dual-sig match anchor
// ---------------------------------------------------------------------------

async function applyMatchStart(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const matchId = (payload.match_id as string);
	if (!matchId) return;

	// Validate PoW if present
	const pow = payload.pow as { nonces?: number[] } | undefined;
	if (pow?.nonces) {
		const payloadForPow = { ...payload };
		delete payloadForPow.pow;
		const valid = await verifyPoWFromPayload(payloadForPow, pow.nonces, 32, 4);
		if (!valid) return; // invalid PoW — silently ignored
	}

	const existing = await getMatchAnchor(matchId);

	if (!existing) {
		// First anchor for this match
		const playerA = (payload.player_a as string) ?? op.broadcaster;
		const playerB = (payload.player_b as string) ?? (payload.opponent as string) ?? '';
		const anchor: MatchAnchor = {
			matchId,
			playerA,
			playerB,
			matchHash: (payload.match_hash as string) ?? '',
			anchorBlockA: op.broadcaster === playerA ? op.blockNum : null,
			anchorBlockB: op.broadcaster === playerB ? op.blockNum : null,
			anchorTxA: op.broadcaster === playerA ? op.trxId : null,
			anchorTxB: op.broadcaster === playerB ? op.trxId : null,
			dualAnchored: false,
			deckHashA: op.broadcaster === playerA ? (payload.deck_hash as string) ?? null : null,
			deckHashB: op.broadcaster === playerB ? (payload.deck_hash as string) ?? null : null,
			timestamp: op.timestamp,
		};
		await putMatchAnchor(anchor);
	} else if (!existing.dualAnchored) {
		// Second anchor — complete the dual-sig
		const isPlayerA = op.broadcaster === existing.playerA;
		const isPlayerB = op.broadcaster === existing.playerB;
		if (!isPlayerA && !isPlayerB) return; // unrelated account

		const updated: MatchAnchor = { ...existing };
		if (isPlayerA && !updated.anchorBlockA) {
			updated.anchorBlockA = op.blockNum;
			updated.anchorTxA = op.trxId;
			updated.deckHashA = (payload.deck_hash as string) ?? null;
		} else if (isPlayerB && !updated.anchorBlockB) {
			updated.anchorBlockB = op.blockNum;
			updated.anchorTxB = op.trxId;
			updated.deckHashB = (payload.deck_hash as string) ?? null;
		} else {
			return; // already anchored by this player
		}

		updated.dualAnchored = !!(updated.anchorBlockA && updated.anchorBlockB);
		await putMatchAnchor(updated);
	}
	// Already dual-anchored: idempotent no-op
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

	// Anti-replay: result_nonce must be strictly increasing per broadcaster
	const resultNonce = Number(payload.result_nonce ?? 0);
	const nonceOk = await advancePlayerNonce(op.broadcaster, resultNonce);
	if (!nonceOk) return; // duplicate or replayed result — reject

	// Dual-signature validation: ranked matches require both signatures
	const sigs = payload.signatures as { broadcaster?: string; counterparty?: string } | undefined;
	if (matchType === 'ranked' && (!sigs?.broadcaster || !sigs?.counterparty)) return;

	// Transcript root validation: ranked matches should include a Merkle transcript root
	const transcriptRoot = payload.transcriptRoot as string | undefined;
	if (matchType === 'ranked' && !transcriptRoot) return;

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
	hiveEvents.emitMatchEnded(match);

	// Award RUNE to the broadcaster based on win/loss outcome
	const runeRewards = payload.runeRewards as { winner?: number; loser?: number } | undefined;
	if (runeRewards) {
		const isWinner = op.broadcaster === (winnerId as string);
		const runeEarned = isWinner ? (runeRewards.winner ?? 0) : (runeRewards.loser ?? 0);
		if (runeEarned > 0) {
			const existing = await getTokenBalance(op.broadcaster);
			await putTokenBalance({
				hiveUsername: op.broadcaster,
				RUNE: (existing?.RUNE ?? 0) + runeEarned,
				VALKYRIE: existing?.VALKYRIE ?? 0,
				SEASON_POINTS: existing?.SEASON_POINTS ?? 0,
				lastClaimTimestamp: Date.now(),
			});
		}
	}

	// Apply XP awards embedded in the match result (no separate xp_update ops needed)
	const xpRewards = payload.xpRewards as Array<{
		cardUid?: string; card_uid?: string;
		xpGained?: number; xp_gained?: number;
		xpAfter?: number; xp_after?: number;
		levelAfter?: number; level_after?: number;
	}> | undefined;

	if (Array.isArray(xpRewards)) {
		for (const reward of xpRewards) {
			const uid = (reward.cardUid ?? reward.card_uid) as string;
			if (!uid) continue;

			const card = await getCard(uid);
			if (!card) continue;

			const xpGained = Number(reward.xpGained ?? reward.xp_gained ?? 0);
			if (xpGained <= 0) continue;

			const newXp = card.xp + xpGained;
			const rarity = card.edition === 'alpha' ? 'rare' : 'common';
			const newLevel = getLevelForXP(rarity, newXp);

			await putCard({ ...card, xp: newXp, level: newLevel });
		}
	}
}

// ---------------------------------------------------------------------------
// rp_queue_join — add to on-chain matchmaking queue
// ---------------------------------------------------------------------------

async function applyQueueJoin(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	// Validate PoW
	const pow = payload.pow as { nonces?: number[] } | undefined;
	if (pow?.nonces) {
		const payloadForPow = { ...payload };
		delete payloadForPow.pow;
		const valid = await verifyPoWFromPayload(payloadForPow, pow.nonces, 32, 4);
		if (!valid) return;
	}

	// No duplicate queue entries (auto-expire stale entries after 10 minutes)
	const QUEUE_EXPIRY_MS = 10 * 60 * 1000;
	const existing = await getQueueEntry(op.broadcaster);
	if (existing) {
		if (op.timestamp - existing.timestamp > QUEUE_EXPIRY_MS) {
			await deleteQueueEntry(op.broadcaster); // expired, replace
		} else {
			return; // still active
		}
	}

	await putQueueEntry({
		account: op.broadcaster,
		mode: (payload.mode as string) ?? 'ranked',
		elo: Number(payload.elo ?? 1000),
		peerId: (payload.peer_id as string) ?? '',
		deckHash: (payload.deck_hash as string) ?? '',
		timestamp: op.timestamp,
		blockNum: op.blockNum,
	});
}

// ---------------------------------------------------------------------------
// rp_queue_leave — remove from matchmaking queue
// ---------------------------------------------------------------------------

async function applyQueueLeave(op: RawOp): Promise<void> {
	await deleteQueueEntry(op.broadcaster);
}

// ---------------------------------------------------------------------------
// rp_slash_evidence — permissionless double-broadcast detection
// ---------------------------------------------------------------------------

async function applySlashEvidence(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const offender = payload.offender as string;
	const reason = payload.reason as string;
	const txA = (payload.trx_id_1 ?? payload.tx_a) as string;
	const txB = (payload.trx_id_2 ?? payload.tx_b) as string;

	if (!offender || !reason || !txA || !txB) return;
	if (txA === txB) return;

	// Already slashed — idempotent
	if (await isAccountSlashed(offender)) return;

	// NOTE: Full cross-chain verification (fetching tx_a and tx_b to confirm
	// contradiction) requires an async chain lookup. For now, the replay engine
	// trusts that the evidence was submitted honestly. A future enhancement can
	// add on-chain tx verification here before applying the slash.
	await putSlashedAccount({
		account: offender,
		reason,
		evidenceTxA: txA,
		evidenceTxB: txB,
		slashedAtBlock: op.blockNum,
		submittedBy: op.broadcaster,
	});
}

// ---------------------------------------------------------------------------
// rp_card_transfer / rp_transfer — move a card between accounts
// ---------------------------------------------------------------------------

async function applyCardTransfer(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const nftId = (payload.nft_id ?? payload.card_uid) as string;
	const to = (payload.to as string);
	if (typeof nftId !== 'string' || typeof to !== 'string') return;

	const existing = await getCard(nftId);
	if (!existing) return;
	if (existing.ownerId !== op.broadcaster) return;

	const updated: HiveCardAsset = {
		...existing,
		ownerId: to,
		lastTransferBlock: op.blockNum,
	};

	await putCard(updated);
	hiveEvents.emitCardTransferred(nftId, op.broadcaster, to);
}

// ---------------------------------------------------------------------------
// rp_xp_update — persist card XP and level changes earned from matches
// ---------------------------------------------------------------------------

async function applyXpUpdate(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const cardUid = (payload.cardUid ?? payload.card_uid) as string | undefined;
	if (typeof cardUid !== 'string') return;

	const existing = await getCard(cardUid);
	if (!existing) return;
	if (existing.ownerId !== op.broadcaster) return;

	const xpAfter = Number(payload.xpAfter ?? payload.xp_after ?? existing.xp);
	const levelAfter = Number(payload.levelAfter ?? payload.level_after ?? existing.level);

	const updated: HiveCardAsset = { ...existing, xp: xpAfter, level: levelAfter };
	await putCard(updated);
}

// ---------------------------------------------------------------------------
// rp_level_up — explicit on-chain record of a card leveling up
// ---------------------------------------------------------------------------

async function applyLevelUp(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const nftId = (payload.nft_id ?? payload.cardUid) as string;
	if (typeof nftId !== 'string') return;

	const card = await getCard(nftId);
	if (!card) return;
	if (card.ownerId !== op.broadcaster) return;

	const oldLevel = Number(payload.old_level ?? card.level);
	const newLevel = Number(payload.new_level ?? oldLevel + 1);
	if (newLevel <= card.level) return; // already at or past this level (idempotent)

	// Validate: the card's accumulated XP must actually warrant this level
	const rarity = (payload.rarity as string) ?? 'common';
	const expectedLevel = getLevelForXP(rarity, card.xp);
	if (newLevel > expectedLevel) return; // overclaim — reject

	await putCard({ ...card, level: newLevel });
}

// ---------------------------------------------------------------------------
// rp_reward_claim — accumulate RUNE / VALKYRIE / SEASON_POINTS token rewards
// ---------------------------------------------------------------------------

const VALID_TOKEN_TYPES = new Set(['RUNE', 'VALKYRIE', 'SEASON_POINTS']);

async function applyRewardClaim(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const rewardType = (payload.reward_type as string)?.toUpperCase();
	const amount = Number(payload.amount ?? 0);

	if (!rewardType || !VALID_TOKEN_TYPES.has(rewardType) || amount <= 0) return;

	const balance = await getTokenBalance(op.broadcaster);

	const updated = { ...balance };
	if (rewardType === 'RUNE') updated.RUNE += amount;
	else if (rewardType === 'VALKYRIE') updated.VALKYRIE += amount;
	else if (rewardType === 'SEASON_POINTS') updated.SEASON_POINTS += amount;

	updated.lastClaimTimestamp = op.timestamp;
	await putTokenBalance(updated);

	hiveEvents.emitTokenUpdate(rewardType, updated[rewardType as keyof typeof updated] as number, amount);
}

// ---------------------------------------------------------------------------
// rp_pack_open — deterministic card minting from trxId seed
// ---------------------------------------------------------------------------

const PACK_SIZES: Record<string, number> = {
	starter: 5,
	standard: 5,
	mega: 15,
};

function lcgNext(seed: number): number {
	return (seed * 16807) % 2147483647;
}

const CARD_RANGES: Record<string, [number, number]> = {
	starter:  [1000, 1999],
	standard: [1000, 3999],
	class:    [4000, 8999],
	mega:     [1000, 8999],
	norse:    [20000, 29999],
};

function mintedCardId(packType: string, lcgValue: number): number {
	const [start, end] = CARD_RANGES[packType] ?? CARD_RANGES.standard;
	return start + (lcgValue % (end - start + 1));
}

async function applyPackOpen(
	op: RawOp,
	payload: Record<string, unknown>,
): Promise<void> {
	const packType = (payload.pack_type as string) ?? 'standard';
	const quantity = Math.min(Number(payload.quantity ?? 1), 10);
	const cardCount = (PACK_SIZES[packType] ?? 5) * quantity;

	const seedHex = op.trxId.replace(/[^0-9a-f]/gi, '').slice(0, 8);
	const seed = parseInt(seedHex || '1', 16);

	let s = Math.max(seed, 1);
	const cardIds: number[] = Array.from({ length: cardCount }, () => {
		s = lcgNext(s);
		return mintedCardId(packType, s);
	});

	const isGold = (lcgNext(seed) % 20) === 0;
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

// ---------------------------------------------------------------------------
// PoW verification helper
// ---------------------------------------------------------------------------

async function verifyPoWFromPayload(
	payload: Record<string, unknown>,
	nonces: number[],
	count: number,
	difficulty: number,
): Promise<boolean> {
	try {
		const { sha256Hash } = await import('./hashUtils');
		const { canonicalStringify } = await import('./hashUtils');
		const payloadHash = await sha256Hash(canonicalStringify(payload));
		const result: PoWResult = { nonces };
		return verifyPoW(payloadHash, result, { count, difficulty });
	} catch {
		return false;
	}
}
