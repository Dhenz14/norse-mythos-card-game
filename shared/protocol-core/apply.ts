/**
 * Ragnarok Protocol Core — Op Application
 *
 * Pure state-transition functions. No I/O, no events, no storage coupling.
 * All storage access goes through the StateAdapter interface.
 *
 * Each handler returns OpResult: applied, rejected(reason), or ignored.
 */

import type {
	ProtocolOp, OpResult, ReplayContext, StateAdapter,
	CardDataProvider, RewardProvider, SignatureVerifier,
	CardAsset, GenesisRecord, EloRecord, PackAsset,
} from './types';
import {
	RAGNAROK_ADMIN_ACCOUNT, TRANSFER_COOLDOWN_BLOCKS, MAX_CARD_LEVEL,
	ELO_K_FACTOR, ELO_FLOOR, RUNE_WIN_RANKED, RUNE_LOSS_RANKED,
	HIVE_USERNAME_RE, ATOMIC_TRANSFER_AMOUNT, PACK_SIZES,
	MAX_REPLICAS_PER_CARD, MAX_GENERATION, REPLICA_COOLDOWN_BLOCKS,
	PACK_ENTROPY_DELAY_BLOCKS,
} from './types';
import { verifyPoW, POW_CONFIG } from './pow';
import { canonicalStringify, sha256Hash } from './hash';

// ============================================================
// Dependencies injected at init, not imported
// ============================================================

export interface ProtocolCoreDeps {
	state: StateAdapter;
	cards: CardDataProvider;
	rewards: RewardProvider;
	sigs: SignatureVerifier;
}

// ============================================================
// Main dispatch
// ============================================================

export async function applyOp(
	op: ProtocolOp,
	ctx: ReplayContext,
	deps: ProtocolCoreDeps,
): Promise<OpResult> {
	// Finality gate: reject ops from blocks beyond LIB
	if (op.blockNum > ctx.lastIrreversibleBlock) {
		return { status: 'ignored' }; // not yet irreversible
	}

	// Slashed accounts cannot perform game actions
	const GAME_ACTIONS = new Set(['match_anchor', 'match_result', 'queue_join']);
	if (GAME_ACTIONS.has(op.action) && await deps.state.isSlashed(op.broadcaster)) {
		return reject('account is slashed');
	}

	switch (op.action) {
		case 'genesis': return applyGenesis(op, deps);
		case 'seal': return applySeal(op, deps);
		case 'mint_batch': return applyMintBatch(op, deps);
		case 'card_transfer': return applyCardTransfer(op, deps);
		case 'burn': return applyBurn(op, deps);
		case 'level_up': return applyLevelUp(op, deps);
		case 'match_anchor': return applyMatchAnchor(op, deps);
		case 'match_result': return applyMatchResult(op, ctx, deps);
		case 'queue_join': return applyQueueJoin(op, deps);
		case 'queue_leave': return applyQueueLeave(op, deps);
		case 'reward_claim': return applyRewardClaim(op, deps);
		case 'slash_evidence': return { status: 'ignored' }; // requires RPC verification, handled outside pure core
		case 'pack_commit': return applyPackCommit(op, deps);
		case 'pack_reveal': return applyPackReveal(op, ctx, deps);
		case 'legacy_pack_open': return applyLegacyPackOpen(op, deps);
		// v1.1: Pack NFTs
		case 'pack_mint': return applyPackMint(op, ctx, deps);
		case 'pack_transfer': return applyPackTransfer(op, deps);
		case 'pack_burn': return applyPackBurn(op, ctx, deps);
		// v1.1: DNA Lineage
		case 'card_replicate': return applyCardReplicate(op, deps);
		case 'card_merge': return applyCardMerge(op, deps);
		default: return { status: 'ignored' };
	}
}

function reject(reason: string): OpResult {
	return { status: 'rejected', reason };
}

// ============================================================
// genesis
// ============================================================

async function applyGenesis(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	if (op.broadcaster !== RAGNAROK_ADMIN_ACCOUNT) return reject('not admin account');

	const existing = await deps.state.getGenesis();
	if (existing) return { status: 'ignored' }; // already applied

	const packSupply = (op.payload.supply as Record<string, unknown>)?.pack_supply as Record<string, number>
		?? op.payload.card_supply_caps as Record<string, number>
		?? op.payload.card_distribution as Record<string, number>;
	const rewardSupply = (op.payload.supply as Record<string, unknown>)?.reward_supply as Record<string, number>
		?? {};

	if (!packSupply) return reject('missing supply definition');

	const genesis: GenesisRecord = {
		version: String(op.payload.version ?? '1'),
		sealed: false,
		sealBlock: 0,
		packSupply,
		rewardSupply,
	};

	await deps.state.putGenesis(genesis);

	// Initialize pack supply counters
	for (const [rarity, cap] of Object.entries(packSupply)) {
		await deps.state.putSupply({ key: rarity, pool: 'pack', cap, minted: 0 });
	}
	// Initialize reward supply counters
	for (const [rarity, cap] of Object.entries(rewardSupply)) {
		if (cap > 0) {
			await deps.state.putSupply({ key: rarity, pool: 'reward', cap, minted: 0 });
		}
	}

	return { status: 'applied' };
}

// ============================================================
// seal
// ============================================================

async function applySeal(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	if (op.broadcaster !== RAGNAROK_ADMIN_ACCOUNT) return reject('not admin account');

	const genesis = await deps.state.getGenesis();
	if (!genesis) return reject('no genesis');
	if (genesis.sealed) return { status: 'ignored' }; // already sealed

	await deps.state.putGenesis({ ...genesis, sealed: true, sealBlock: op.blockNum });
	return { status: 'applied' };
}

// ============================================================
// mint_batch
// ============================================================

async function applyMintBatch(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	if (op.broadcaster !== RAGNAROK_ADMIN_ACCOUNT) return reject('not admin account');

	const genesis = await deps.state.getGenesis();
	if (!genesis) return reject('no genesis');
	if (genesis.sealed) return reject('minting sealed');

	const to = op.payload.to as string;
	const cards = op.payload.cards as Array<{ uid?: string; nft_id?: string; card_id: number | string; rarity: string }> | undefined;
	if (!to || !Array.isArray(cards)) return reject('missing to or cards');

	let applied = false;
	for (const card of cards) {
		const uid = (card.uid ?? card.nft_id) as string;
		const cardId = typeof card.card_id === 'number' ? card.card_id : parseInt(String(card.card_id), 10) || 0;
		if (!uid || !cardId) continue;

		// Card definition must exist
		const cardDef = deps.cards.getCardById(cardId);
		if (!cardDef) continue;

		// Idempotent: skip if already exists
		const existing = await deps.state.getCard(uid);
		if (existing) continue;

		// Supply cap: check pack pool for the card's rarity
		const rarity = card.rarity || cardDef.rarity || 'common';
		const supplyRecord = await deps.state.getSupply(rarity, 'pack');
		if (supplyRecord && supplyRecord.minted >= supplyRecord.cap) continue;

		// Per-card cap
		const cardKey = `card:${cardId}`;
		const cardSupply = await deps.state.getSupply(cardKey, 'pack');
		const cardMinted = cardSupply?.minted ?? 0;
		const rarityCap = supplyRecord?.cap ?? Infinity;
		if (cardMinted >= rarityCap) continue;

		const asset: CardAsset = {
			uid,
			cardId,
			owner: to,
			rarity,
			level: 1,
			xp: 0,
			edition: 'alpha',
			mintSource: 'genesis',
			mintTrxId: op.trxId,
			mintBlockNum: op.blockNum,
			lastTransferBlock: op.blockNum,
		};

		await deps.state.putCard(asset);

		// Increment supply counters
		if (supplyRecord) {
			await deps.state.putSupply({ ...supplyRecord, minted: supplyRecord.minted + 1 });
		}
		await deps.state.putSupply({ key: cardKey, pool: 'pack', cap: rarityCap, minted: cardMinted + 1 });
		applied = true;
	}

	return applied ? { status: 'applied' } : { status: 'ignored' };
}

// ============================================================
// card_transfer
// ============================================================

async function applyCardTransfer(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	const cards = op.payload.cards as Array<{ nft_id?: string; card_uid?: string; to?: string }> | undefined;
	if (Array.isArray(cards)) {
		let anyApplied = false;
		for (const entry of cards) {
			const nftId = (entry.nft_id ?? entry.card_uid) as string;
			const to = (entry.to ?? op.payload.to) as string;
			const result = await transferSingle(op, nftId, to, deps);
			if (result.status === 'applied') anyApplied = true;
		}
		return anyApplied ? { status: 'applied' } : { status: 'ignored' };
	}

	const nftId = (op.payload.nft_id ?? op.payload.card_uid) as string;
	const to = op.payload.to as string;
	return transferSingle(op, nftId, to, deps);
}

async function transferSingle(
	op: ProtocolOp, nftId: string, to: string, deps: ProtocolCoreDeps,
): Promise<OpResult> {
	if (typeof nftId !== 'string' || typeof to !== 'string') return reject('missing nft_id or to');
	if (!HIVE_USERNAME_RE.test(to)) return reject(`invalid destination: "${to}"`);
	if (to === op.broadcaster) return reject('cannot transfer to self');

	const card = await deps.state.getCard(nftId);
	if (!card) return reject(`card ${nftId} not found`);
	if (card.owner !== op.broadcaster) return reject(`card ${nftId} not owned by broadcaster`);

	if (card.lastTransferBlock && (op.blockNum - card.lastTransferBlock) < TRANSFER_COOLDOWN_BLOCKS) {
		return reject(`card ${nftId} transfer cooldown`);
	}

	const nonce = Number(op.payload.nonce ?? 0);
	if (nonce > 0) {
		const nonceOk = await deps.state.advanceNonce(op.broadcaster, nonce);
		if (!nonceOk) return reject(`nonce ${nonce} not higher than last seen`);
	}

	await deps.state.putCard({ ...card, owner: to, lastTransferBlock: op.blockNum });
	return { status: 'applied' };
}

// ============================================================
// burn
// ============================================================

async function applyBurn(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	const nftId = (op.payload.nft_id ?? op.payload.card_uid) as string;
	if (typeof nftId !== 'string') return reject('missing nft_id');

	const card = await deps.state.getCard(nftId);
	if (!card) return { status: 'ignored' };
	if (card.owner !== op.broadcaster) return reject('not owner');

	await deps.state.deleteCard(nftId);
	return { status: 'applied' };
}

// ============================================================
// level_up
// ============================================================

async function applyLevelUp(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	let nftId: string;
	let newLevel: number;

	if (typeof op.payload.d === 'string' && op.payload.v === 1) {
		const parts = (op.payload.d as string).split(':');
		if (parts.length < 3) return reject('malformed compact level_up');
		nftId = parts[0];
		newLevel = parseInt(parts[2], 16);
	} else {
		nftId = (op.payload.nft_id ?? op.payload.cardUid) as string;
		newLevel = Number(op.payload.new_level ?? 0);
	}

	if (!nftId || !newLevel || newLevel <= 0) return reject('invalid level_up fields');
	if (newLevel > MAX_CARD_LEVEL) return reject(`level exceeds cap: ${newLevel} > ${MAX_CARD_LEVEL}`);

	const card = await deps.state.getCard(nftId);
	if (!card) return { status: 'ignored' };
	if (card.owner !== op.broadcaster) return reject('not owner');
	if (newLevel <= card.level) return { status: 'ignored' }; // idempotent

	// Validate against chain-derived XP
	const derivedLevel = getLevelForXP(card.rarity, card.xp);
	if (newLevel > derivedLevel) {
		return reject(`level overclaim: ${newLevel} > derived ${derivedLevel} (xp=${card.xp})`);
	}

	await deps.state.putCard({ ...card, level: newLevel });
	return { status: 'applied' };
}

// XP thresholds by rarity (from cardXPSystem.ts)
const XP_THRESHOLDS: Record<string, number[]> = {
	free: [0, 20, 50],
	basic: [0, 20, 50],
	common: [0, 50, 150],
	rare: [0, 100, 300],
	epic: [0, 160, 480],
	mythic: [0, 200, 500],
};

function getLevelForXP(rarity: string, xp: number): number {
	const thresholds = XP_THRESHOLDS[rarity] ?? XP_THRESHOLDS.common;
	let level = 1;
	for (let i = 1; i < thresholds.length; i++) {
		if (xp >= thresholds[i]) level = i + 1;
	}
	return Math.min(level, MAX_CARD_LEVEL);
}

// XP gain per win by rarity
const XP_PER_WIN: Record<string, number> = {
	free: 5, basic: 5, common: 10, rare: 15, epic: 20, mythic: 25,
};

// ============================================================
// match_anchor
// ============================================================

async function applyMatchAnchor(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	const matchId = op.payload.match_id as string;
	if (!matchId) return reject('missing match_id');

	// PoW required
	const powResult = await verifyPowField(op);
	if (powResult) return powResult;

	const existing = await deps.state.getMatchAnchor(matchId);
	if (existing?.dualAnchored) return { status: 'ignored' }; // already anchored

	const playerA = (op.payload.player_a as string) ?? op.broadcaster;
	const playerB = (op.payload.player_b as string) ?? '';

	if (!existing) {
		await deps.state.putMatchAnchor({
			matchId,
			playerA,
			playerB,
			pubkeyA: op.payload.pubkey_a as string | undefined,
			pubkeyB: op.payload.pubkey_b as string | undefined,
			deckHashA: op.payload.deck_hash_a as string | undefined,
			deckHashB: op.payload.deck_hash_b as string | undefined,
			engineHash: op.payload.engine_hash as string | undefined,
			dualAnchored: !!(op.payload.sig_a && op.payload.sig_b),
			timestamp: op.timestamp,
		});
		return { status: 'applied' };
	}

	// Second anchor — complete dual-sig
	const isA = op.broadcaster === existing.playerA;
	const isB = op.broadcaster === existing.playerB;
	if (!isA && !isB) return reject('broadcaster not a participant');

	const updated = { ...existing, dualAnchored: true };
	if (isA) updated.deckHashA = op.payload.deck_hash as string ?? existing.deckHashA;
	if (isB) updated.deckHashB = op.payload.deck_hash as string ?? existing.deckHashB;

	await deps.state.putMatchAnchor(updated);
	return { status: 'applied' };
}

// ============================================================
// match_result
// ============================================================

async function applyMatchResult(
	op: ProtocolOp, ctx: ReplayContext, deps: ProtocolCoreDeps,
): Promise<OpResult> {
	const genesis = await deps.state.getGenesis();
	if (!genesis) return reject('no genesis');

	const isCompact = typeof op.payload.m === 'string';
	const winner = (isCompact ? op.payload.w : op.payload.winnerId) as string;
	const loser = (isCompact ? op.payload.l : null) as string | null;
	const nonce = Number(isCompact ? op.payload.n : op.payload.result_nonce ?? 0);

	if (!winner) return reject('missing winner');

	let p1: string, p2: string;
	if (isCompact) {
		p1 = winner;
		p2 = loser ?? '';
	} else {
		const pl1 = op.payload.player1 as Record<string, unknown> | undefined;
		const pl2 = op.payload.player2 as Record<string, unknown> | undefined;
		if (!pl1 || !pl2) return reject('missing player data');
		p1 = pl1.hiveUsername as string;
		p2 = pl2.hiveUsername as string;
	}

	if (!p1 || !p2 || p1 === p2) return reject('self-play or empty username');
	if (op.broadcaster !== p1 && op.broadcaster !== p2) return reject('broadcaster not a participant');

	// Nonce
	const nonceOk = await deps.state.advanceNonce(op.broadcaster, nonce);
	if (!nonceOk) return reject(`nonce ${nonce} not higher than last seen`);

	// PoW required
	const powResult = await verifyPowField(op, POW_CONFIG.MATCH_RESULT);
	if (powResult) return powResult;

	// Compact hash verification
	const cardHex = (isCompact ? op.payload.c : undefined) as string | undefined;
	const compactHash = (isCompact ? op.payload.ch : undefined) as string | undefined;
	const seed = (isCompact ? op.payload.s : op.payload.seed) as string ?? '';
	const version = Number(isCompact ? op.payload.v : 0);

	if (isCompact && compactHash && cardHex) {
		const chInput = { m: op.payload.m, w: winner, l: loser ?? '', n: nonce, s: seed, v: version, c: cardHex };
		const expectedCh = (await sha256Hash(canonicalStringify(chInput))).slice(0, 16);
		if (expectedCh !== compactHash) {
			return reject(`compact hash mismatch: expected=${expectedCh}, got=${compactHash}`);
		}
	}

	// Dual-signature verification for ranked
	const matchType = isCompact ? 'ranked' : ((op.payload.matchType as string) ?? 'casual');
	const counterparty = op.broadcaster === p1 ? p2 : p1;

	if (matchType === 'ranked') {
		// Check for anchored pubkeys first (v1 spec)
		const mId = (isCompact ? op.payload.m : op.payload.matchId) as string;
		const anchor = mId ? await deps.state.getMatchAnchor(mId) : null;

		const sigMessage = isCompact
			? `${mId}:${winner}:${loser ?? ''}:${nonce}`
			: `${mId}:${winner}`;

		let broadcasterSig: string | undefined;
		let counterpartySig: string | undefined;

		if (isCompact) {
			const sig = op.payload.sig as { b?: string; c?: string } | undefined;
			broadcasterSig = sig?.b;
			counterpartySig = sig?.c;
		} else {
			const sigs = op.payload.signatures as { broadcaster?: string; counterparty?: string } | undefined;
			broadcasterSig = sigs?.broadcaster;
			counterpartySig = sigs?.counterparty;
		}

		if (!broadcasterSig || !counterpartySig) {
			return reject('ranked match missing dual signatures');
		}

		// Signature verification strategy depends on whether an anchor exists
		let bValid: boolean, cValid: boolean;

		if (anchor?.pubkeyA && anchor?.pubkeyB) {
			// Canonical path: verify against anchored keys (no fallback)
			const bKey = op.broadcaster === anchor.playerA ? anchor.pubkeyA : anchor.pubkeyB;
			const cKey = op.broadcaster === anchor.playerA ? anchor.pubkeyB : anchor.pubkeyA;
			[bValid, cValid] = await Promise.all([
				deps.sigs.verifyAnchored(bKey, sigMessage, broadcasterSig),
				deps.sigs.verifyAnchored(cKey, sigMessage, counterpartySig),
			]);
		} else if (!genesis.sealed) {
			// Legacy pre-seal path ONLY: no anchor exists, verify against current keys
			// This is acceptable because pre-seal matches predate the anchor requirement
			[bValid, cValid] = await Promise.all([
				deps.sigs.verifyCurrentKey(op.broadcaster, sigMessage, broadcasterSig),
				deps.sigs.verifyCurrentKey(counterparty, sigMessage, counterpartySig),
			]);
		} else {
			// Post-seal match with no anchor: reject. The spec requires match_anchor
			// with pinned pubkeys for all canonical (post-seal) ranked matches.
			return reject('post-seal ranked match requires match_anchor with pinned pubkeys');
		}

		if (!bValid) return reject(`broadcaster signature failed for ${op.broadcaster}`);
		if (!cValid) return reject(`counterparty signature failed for ${counterparty}`);
	}

	// All validation passed — derive ELO, RUNE, XP

	if (matchType === 'ranked' && p2) {
		// ELO derivation (K=32)
		const winnerElo = await deps.state.getElo(winner);
		const loserAccount = winner === p1 ? p2 : p1;
		const loserElo = await deps.state.getElo(loserAccount);

		const expected = 1 / (1 + Math.pow(10, (loserElo.elo - winnerElo.elo) / 400));
		const newWinnerElo = Math.round(winnerElo.elo + ELO_K_FACTOR * (1 - expected));
		const newLoserElo = Math.max(Math.round(loserElo.elo + ELO_K_FACTOR * (0 - (1 - expected))), ELO_FLOOR);

		await deps.state.putElo({ ...winnerElo, elo: newWinnerElo, wins: winnerElo.wins + 1 });
		await deps.state.putElo({ ...loserElo, elo: newLoserElo, losses: loserElo.losses + 1 });

		// RUNE rewards
		const winnerBal = await deps.state.getTokenBalance(winner);
		await deps.state.putTokenBalance({ ...winnerBal, RUNE: winnerBal.RUNE + RUNE_WIN_RANKED });

		const loserBal = await deps.state.getTokenBalance(loserAccount);
		await deps.state.putTokenBalance({ ...loserBal, RUNE: loserBal.RUNE + RUNE_LOSS_RANKED });
	}

	// XP accumulation from card hex
	if (cardHex && winner) {
		const winnerCardIds = new Set(decodeCardIds(cardHex));
		const winnerNFTs = await deps.state.getCardsByOwner(winner);

		for (const nft of winnerNFTs) {
			if (!winnerCardIds.has(nft.cardId)) continue;
			const xpGain = XP_PER_WIN[nft.rarity] ?? XP_PER_WIN.common;
			if (xpGain <= 0) continue;
			await deps.state.putCard({ ...nft, xp: nft.xp + xpGain });
		}
	}

	return { status: 'applied' };
}

function decodeCardIds(hex: string): number[] {
	const ids: number[] = [];
	for (let i = 0; i + 4 <= hex.length; i += 4) {
		ids.push(parseInt(hex.slice(i, i + 4), 16));
	}
	return ids;
}

// ============================================================
// queue_join
// ============================================================

async function applyQueueJoin(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	// PoW required
	const powResult = await verifyPowField(op, POW_CONFIG.QUEUE_JOIN);
	if (powResult) return powResult;

	const QUEUE_EXPIRY_MS = 10 * 60 * 1000;
	const existing = await deps.state.getQueueEntry(op.broadcaster);
	if (existing && (op.timestamp - existing.timestamp) <= QUEUE_EXPIRY_MS) {
		return { status: 'ignored' }; // still active
	}
	if (existing) {
		await deps.state.deleteQueueEntry(op.broadcaster);
	}

	const chainElo = await deps.state.getElo(op.broadcaster);
	await deps.state.putQueueEntry(op.broadcaster, {
		mode: (op.payload.mode as string) ?? 'ranked',
		elo: chainElo.elo,
		timestamp: op.timestamp,
		blockNum: op.blockNum,
	});

	return { status: 'applied' };
}

// ============================================================
// queue_leave
// ============================================================

async function applyQueueLeave(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	await deps.state.deleteQueueEntry(op.broadcaster);
	return { status: 'applied' };
}

// ============================================================
// reward_claim
// ============================================================

async function applyRewardClaim(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	const rewardId = op.payload.reward_id as string;
	if (!rewardId) return reject('missing reward_id');

	const genesis = await deps.state.getGenesis();
	if (!genesis) return reject('no genesis');

	const reward = deps.rewards.getRewardById(rewardId);
	if (!reward) return reject(`unknown reward: ${rewardId}`);

	if (await deps.state.hasRewardClaim(op.broadcaster, rewardId)) {
		return { status: 'ignored' }; // already claimed
	}

	const elo = await deps.state.getElo(op.broadcaster);
	if (!checkRewardCondition(reward.condition, elo)) {
		return reject(`condition not met for ${rewardId}`);
	}

	// Mint reward cards from reward_supply (NOT pack_supply)
	for (let i = 0; i < reward.cards.length; i++) {
		const rc = reward.cards[i];
		const uid = `reward-${rewardId}-${op.broadcaster}-${i}`;

		const existing = await deps.state.getCard(uid);
		if (existing) continue;

		const supply = await deps.state.getSupply(rc.rarity, 'reward');
		if (supply && supply.minted >= supply.cap) continue;

		const cardKey = `card:${rc.cardId}`;
		const cardSupply = await deps.state.getSupply(cardKey, 'reward');
		const cardMinted = cardSupply?.minted ?? 0;
		const cap = supply?.cap ?? Infinity;
		if (cardMinted >= cap) continue;

		await deps.state.putCard({
			uid,
			cardId: rc.cardId,
			owner: op.broadcaster,
			rarity: rc.rarity,
			level: 1,
			xp: 0,
			edition: 'alpha',
			mintSource: 'reward',
			mintTrxId: op.trxId,
			mintBlockNum: op.blockNum,
			lastTransferBlock: op.blockNum,
		});

		if (supply) {
			await deps.state.putSupply({ ...supply, minted: supply.minted + 1 });
		}
		await deps.state.putSupply({ key: cardKey, pool: 'reward', cap, minted: cardMinted + 1 });
	}

	// RUNE bonus
	if (reward.runeBonus > 0) {
		const bal = await deps.state.getTokenBalance(op.broadcaster);
		await deps.state.putTokenBalance({ ...bal, RUNE: bal.RUNE + reward.runeBonus });
	}

	await deps.state.putRewardClaim(op.broadcaster, rewardId, op.blockNum);
	return { status: 'applied' };
}

function checkRewardCondition(
	condition: { type: string; value: number },
	elo: EloRecord,
): boolean {
	switch (condition.type) {
		case 'wins_milestone': return elo.wins >= condition.value;
		case 'elo_milestone': return elo.elo >= condition.value;
		case 'matches_played': return (elo.wins + elo.losses) >= condition.value;
		default: return false;
	}
}

// ============================================================
// pack_commit (v1 new flow)
// ============================================================

async function applyPackCommit(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	const genesis = await deps.state.getGenesis();
	if (!genesis) return reject('no genesis');

	const saltCommit = op.payload.salt_commit as string;
	const packType = (op.payload.pack_type as string) ?? 'standard';
	const quantity = Math.min(Number(op.payload.quantity ?? 1), 10);

	if (!saltCommit) return reject('missing salt_commit');

	const existing = await deps.state.getPackCommit(op.trxId);
	if (existing) return { status: 'ignored' }; // idempotent

	await deps.state.putPackCommit({
		trxId: op.trxId,
		account: op.broadcaster,
		packType,
		quantity,
		saltCommit,
		commitBlock: op.blockNum,
		revealed: false,
	});

	return { status: 'applied' };
}

// ============================================================
// pack_reveal (v1 new flow)
// ============================================================

async function applyPackReveal(
	op: ProtocolOp, ctx: ReplayContext, deps: ProtocolCoreDeps,
): Promise<OpResult> {
	const commitTrxId = op.payload.commit_trx_id as string;
	const userSalt = op.payload.user_salt as string;
	if (!commitTrxId || !userSalt) return reject('missing commit_trx_id or user_salt');

	const commit = await deps.state.getPackCommit(commitTrxId);
	if (!commit) return reject('no matching pack_commit');
	if (commit.revealed) return { status: 'ignored' }; // already revealed
	if (commit.account !== op.broadcaster) return reject('not the committer');

	// Verify salt
	const expectedSaltCommit = await sha256Hash(userSalt);
	if (expectedSaltCommit !== commit.saltCommit) {
		return reject('salt does not match commitment');
	}

	// Entropy block must be irreversible
	const entropyBlock = commit.commitBlock + 3;
	if (entropyBlock > ctx.lastIrreversibleBlock) {
		return reject('entropy block not yet irreversible');
	}

	// Deadline check
	const deadline = commit.commitBlock + 200;
	if (op.blockNum > deadline) {
		return reject('reveal past deadline — auto-finalize should have occurred');
	}

	const entropyBlockId = await ctx.getBlockId(entropyBlock);
	if (!entropyBlockId) return reject('entropy block id unavailable');

	const seed = await sha256Hash(`${userSalt}${commitTrxId}${entropyBlockId}1`);

	// Mark revealed
	await deps.state.putPackCommit({ ...commit, revealed: true });

	// Deterministic card draw from seed against pack_supply
	await drawPackCards(seed, commit.packType, commit.quantity, commit.account, op.trxId, op.blockNum, deps);

	return { status: 'applied' };
}

// ============================================================
// Shared pack card draw (used by reveal + auto-finalize)
// ============================================================

// PACK_SIZES imported from ./types

const PACK_ID_RANGES: Record<string, [number, number][]> = {
	starter:  [[1000, 3999], [20000, 29999]],
	booster:  [[1000, 3999], [20000, 31999]],
	standard: [[1000, 8999], [20000, 31999]],
	premium:  [[1000, 8999], [20000, 40999], [50000, 50999]],
	mythic:   [[20000, 29999], [30001, 31999], [95001, 96999]],
	class:    [[4000, 8999], [35001, 40999]],
	mega:     [[1000, 8999], [20000, 40999], [50000, 50999], [85001, 86999]],
	norse:    [[20000, 29999], [30001, 31999]],
};

async function drawPackCards(
	seedHex: string,
	packType: string,
	quantity: number,
	owner: string,
	trxId: string,
	blockNum: number,
	deps: ProtocolCoreDeps,
): Promise<number> {
	const ranges = PACK_ID_RANGES[packType] ?? PACK_ID_RANGES.standard;
	const mintableIds = deps.cards.getCollectibleIdsInRanges(ranges);
	if (mintableIds.length === 0) return 0;

	const cardCount = (PACK_SIZES[packType] ?? 5) * quantity;

	// Use first 8 chars of SHA-256 seed as LCG starting point
	let s = parseInt(seedHex.slice(0, 8), 16) || 1;
	s = Math.max(s, 1);

	let minted = 0;
	for (let i = 0; i < cardCount; i++) {
		s = lcgNext(s);
		const cardId = mintableIds[s % mintableIds.length];
		const uid = `${trxId}:${i}`;

		const existing = await deps.state.getCard(uid);
		if (existing) continue;

		const cardDef = deps.cards.getCardById(cardId);
		if (!cardDef) continue;

		const rarity = cardDef.rarity || 'common';
		const supply = await deps.state.getSupply(rarity, 'pack');
		if (supply && supply.minted >= supply.cap) continue;

		await deps.state.putCard({
			uid,
			cardId,
			owner,
			rarity,
			level: 1,
			xp: 0,
			edition: 'alpha',
			mintSource: 'pack',
			mintTrxId: trxId,
			mintBlockNum: blockNum,
			lastTransferBlock: blockNum,
		});

		if (supply) {
			await deps.state.putSupply({ ...supply, minted: supply.minted + 1 });
		}
		minted++;
	}

	return minted;
}

// ============================================================
// Auto-finalize expired pack commits
//
// Called by the block scanner after each block. Checks for any
// unrevealed commits whose deadline has passed and finalizes
// them with the deterministic forfeit seed.
//
// Spec formula: seed = sha256(commit_trx_id + entropy_block_id + "forfeit")
// ============================================================

export async function autoFinalizeExpiredCommits(
	currentBlock: number,
	ctx: ReplayContext,
	deps: ProtocolCoreDeps,
): Promise<number> {
	// Only finalize commits whose deadline block <= currentBlock AND currentBlock <= LIB
	if (currentBlock > ctx.lastIrreversibleBlock) return 0;

	const expired = await deps.state.getUnrevealedCommitsBefore(currentBlock);
	let finalized = 0;

	for (const commit of expired) {
		const deadline = commit.commitBlock + 200;
		if (currentBlock < deadline) continue; // not yet expired

		const entropyBlock = commit.commitBlock + 3;
		if (entropyBlock > ctx.lastIrreversibleBlock) continue; // entropy not yet irreversible

		const entropyBlockId = await ctx.getBlockId(entropyBlock);
		if (!entropyBlockId) continue; // RPC unavailable — retry later

		// Forfeit seed: no user salt (they never revealed it)
		const forfeitSeed = await sha256Hash(`${commit.trxId}${entropyBlockId}forfeit`);

		// Mark as revealed (auto-finalized)
		await deps.state.putPackCommit({ ...commit, revealed: true });

		// Draw cards with forfeit seed
		await drawPackCards(
			forfeitSeed, commit.packType, commit.quantity,
			commit.account, `${commit.trxId}:forfeit`, commit.commitBlock,
			deps,
		);

		finalized++;
	}

	return finalized;
}

// ============================================================
// legacy_pack_open (pre-seal only, txid-seeded LCG)
// ============================================================

async function applyLegacyPackOpen(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	const genesis = await deps.state.getGenesis();
	if (!genesis) return reject('no genesis');

	// Legacy pack_open is only valid BEFORE seal (v1 activation boundary)
	if (genesis.sealed) return reject('legacy pack_open rejected after seal');

	// Use legacy txid-seeded LCG (exact reproduction of current behavior)
	// This preserves pre-seal pack history during replay
	let seedHex = op.trxId.replace(/[^0-9a-f]/gi, '').slice(0, 8);
	if (seedHex.length < 4) {
		let hash = 0;
		for (let i = 0; i < op.trxId.length; i++) {
			hash = ((hash << 5) - hash + op.trxId.charCodeAt(i)) | 0;
		}
		seedHex = (Math.abs(hash) >>> 0).toString(16).slice(0, 8);
	}
	const seed = parseInt(seedHex || 'a7f3', 16);

	const packType = (op.payload.pack_type as string) ?? 'standard';
	const quantity = Math.min(Number(op.payload.quantity ?? 1), 10);
	const cardCount = (PACK_SIZES[packType] ?? 5) * quantity;

	const ranges = PACK_ID_RANGES[packType] ?? PACK_ID_RANGES.standard;
	const mintableIds = deps.cards.getCollectibleIdsInRanges(ranges);
	if (mintableIds.length === 0) return reject('no mintable cards for pack type');

	let s = Math.max(seed, 1);
	const cardIds: number[] = [];
	for (let i = 0; i < cardCount; i++) {
		s = lcgNext(s);
		cardIds.push(mintableIds[s % mintableIds.length]);
	}

	let applied = false;
	for (let i = 0; i < cardIds.length; i++) {
		const uid = `${op.trxId}-${i}`;
		const existing = await deps.state.getCard(uid);
		if (existing) continue;

		const cardDef = deps.cards.getCardById(cardIds[i]);
		if (!cardDef) continue;

		const rarity = cardDef.rarity || 'common';
		const supply = await deps.state.getSupply(rarity, 'pack');
		if (supply && supply.minted >= supply.cap) continue;

		await deps.state.putCard({
			uid,
			cardId: cardIds[i],
			owner: op.broadcaster,
			rarity,
			level: 1,
			xp: 0,
			edition: 'alpha',
			mintSource: 'pack',
			mintTrxId: op.trxId,
			mintBlockNum: op.blockNum,
			lastTransferBlock: op.blockNum,
		});

		if (supply) {
			await deps.state.putSupply({ ...supply, minted: supply.minted + 1 });
		}
		applied = true;
	}

	return applied ? { status: 'applied' } : { status: 'ignored' };
}

function lcgNext(seed: number): number {
	return (seed * 16807) % 2147483647;
}

// ============================================================
// v1.1: pack_mint — Create sealed pack NFTs (atomic)
// ============================================================

async function applyPackMint(op: ProtocolOp, ctx: ReplayContext, deps: ProtocolCoreDeps): Promise<OpResult> {
	if (op.broadcaster !== RAGNAROK_ADMIN_ACCOUNT) return reject('not admin account');

	const genesis = await deps.state.getGenesis();
	if (!genesis?.sealed) return reject('pack_mint requires sealed genesis');

	const packType = op.payload.pack_type as string;
	const quantity = Number(op.payload.quantity ?? 1);
	const to = op.payload.to as string;

	if (!PACK_SIZES[packType]) return reject(`invalid pack_type: ${packType}`);
	if (quantity < 1 || quantity > 10) return reject('quantity must be 1-10');
	if (!HIVE_USERNAME_RE.test(to)) return reject(`invalid recipient: ${to}`);

	// Atomic transfer validation
	const companion = await deps.state.getCompanionTransfer(op.trxId);
	if (!companion) return reject('missing atomic HIVE transfer');
	if (companion.amount !== ATOMIC_TRANSFER_AMOUNT) return reject('wrong atomic transfer amount');
	if (companion.to !== to) return reject('atomic transfer recipient mismatch');

	for (let i = 0; i < quantity; i++) {
		const uid = `pack_${op.trxId}:${i}`;
		const dna = await sha256Hash(`${op.trxId}:${i}:${packType}`);

		const pack: PackAsset = {
			uid, packType, dna, owner: to, sealed: true,
			mintTrxId: op.trxId, mintBlockNum: op.blockNum,
			lastTransferBlock: op.blockNum,
			cardCount: PACK_SIZES[packType], edition: 'alpha',
		};
		await deps.state.putPack(pack);

		const supply = await deps.state.getPackSupply(packType);
		if (supply) {
			if (supply.cap > 0 && supply.minted >= supply.cap) return reject('pack supply cap reached');
			await deps.state.putPackSupply({ ...supply, minted: supply.minted + 1 });
		} else {
			await deps.state.putPackSupply({ packType, minted: 1, burned: 0, cap: 0 });
		}
	}

	return { status: 'applied' };
}

// ============================================================
// v1.1: pack_transfer — Transfer sealed pack (atomic)
// ============================================================

async function applyPackTransfer(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	const packUid = op.payload.pack_uid as string;
	const to = op.payload.to as string;
	if (!packUid || !to) return reject('missing pack_uid or to');
	if (!HIVE_USERNAME_RE.test(to)) return reject(`invalid recipient: ${to}`);
	if (to === op.broadcaster) return reject('cannot transfer to self');

	const pack = await deps.state.getPack(packUid);
	if (!pack) return reject(`pack ${packUid} not found`);
	if (!pack.sealed) return reject('cannot transfer opened pack');
	if (pack.owner !== op.broadcaster) return reject('not pack owner');

	if (pack.lastTransferBlock && (op.blockNum - pack.lastTransferBlock) < TRANSFER_COOLDOWN_BLOCKS) {
		return reject('pack transfer cooldown');
	}

	// Atomic transfer validation
	const companion = await deps.state.getCompanionTransfer(op.trxId);
	if (!companion) return reject('missing atomic HIVE transfer');
	if (companion.amount !== ATOMIC_TRANSFER_AMOUNT) return reject('wrong atomic transfer amount');
	if (companion.to !== to) return reject('atomic transfer recipient mismatch');

	await deps.state.putPack({ ...pack, owner: to, lastTransferBlock: op.blockNum });
	return { status: 'applied' };
}

// ============================================================
// v1.1: pack_burn — Open pack (burn NFT, derive cards)
// ============================================================

async function applyPackBurn(op: ProtocolOp, ctx: ReplayContext, deps: ProtocolCoreDeps): Promise<OpResult> {
	const packUid = op.payload.pack_uid as string;
	const salt = op.payload.salt as string;
	if (!packUid || !salt) return reject('missing pack_uid or salt');

	const pack = await deps.state.getPack(packUid);
	if (!pack) return reject(`pack ${packUid} not found`);
	if (!pack.sealed) return reject('pack already opened');
	if (pack.owner !== op.broadcaster) return reject('not pack owner');

	// Entropy block must be irreversible
	const entropyBlock = op.blockNum + PACK_ENTROPY_DELAY_BLOCKS;
	if (entropyBlock > ctx.lastIrreversibleBlock) return { status: 'ignored' };

	const entropyBlockId = await ctx.getBlockId(entropyBlock);
	if (!entropyBlockId) return { status: 'ignored' };

	// Derive cards from pack DNA + burn entropy
	const seed = await sha256Hash(`${pack.dna}|${op.trxId}|${entropyBlockId}`);
	const cardCount = pack.cardCount;
	const idRanges = PACK_ID_RANGES[pack.packType] ?? PACK_ID_RANGES['standard'];
	const collectibleIds = deps.cards.getCollectibleIdsInRanges(idRanges);

	if (collectibleIds.length === 0) return reject('no collectible cards in range');

	let rng = Math.max(parseInt(seed.slice(0, 8), 16) || 1, 1);
	for (let i = 0; i < cardCount; i++) {
		rng = lcgNext(rng);
		const cardId = collectibleIds[rng % collectibleIds.length];
		const cardData = deps.cards.getCardById(cardId);
		const rarity = cardData?.rarity ?? 'common';

		const originDna = await sha256Hash(`${cardId}|${pack.edition}|${rarity}|${pack.mintTrxId}`);
		const instanceDna = await sha256Hash(`${originDna}|genesis|${op.trxId}|${i}`);

		const asset: CardAsset = {
			uid: `${op.trxId}:${i}`, cardId, owner: op.broadcaster, rarity,
			level: 1, xp: 0, edition: pack.edition, foil: 'standard',
			mintSource: 'pack', mintTrxId: op.trxId, mintBlockNum: op.blockNum,
			lastTransferBlock: 0,
			originDna, instanceDna, generation: 0, replicaCount: 0,
		};
		await deps.state.putCard(asset);
		rng = lcgNext(rng);
	}

	// Delete pack and update supply
	await deps.state.deletePack(packUid);
	const supply = await deps.state.getPackSupply(pack.packType);
	if (supply) {
		await deps.state.putPackSupply({ ...supply, burned: supply.burned + 1 });
	}

	return { status: 'applied' };
}

// ============================================================
// v1.1: card_replicate — Clone a card with DNA lineage
// ============================================================

async function applyCardReplicate(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	const sourceUid = op.payload.source_uid as string;
	if (!sourceUid) return reject('missing source_uid');

	const source = await deps.state.getCard(sourceUid);
	if (!source) return reject(`source card ${sourceUid} not found`);
	if (source.owner !== op.broadcaster) return reject('not owner of source card');

	const gen = source.generation ?? 0;
	if (gen >= MAX_GENERATION) return reject(`max generation reached: ${gen}`);

	const replicas = source.replicaCount ?? 0;
	if (replicas >= MAX_REPLICAS_PER_CARD) return reject(`max replicas reached: ${replicas}`);

	if (source.lastTransferBlock && (op.blockNum - source.lastTransferBlock) < REPLICA_COOLDOWN_BLOCKS) {
		return reject('replica cooldown');
	}

	const originDna = source.originDna ?? await sha256Hash(`${source.cardId}|${source.edition}|${source.rarity}|genesis`);
	const parentDna = source.instanceDna ?? await sha256Hash(`${originDna}|genesis|${source.mintTrxId}|0`);
	const instanceDna = await sha256Hash(`${originDna}|${parentDna}|${op.trxId}|0`);

	const foil = (op.payload.foil as string) || source.foil || 'standard';

	const replica: CardAsset = {
		uid: `${op.trxId}:replica:0`,
		cardId: source.cardId,
		owner: op.broadcaster,
		rarity: source.rarity,
		edition: source.edition,
		foil,
		level: 1, xp: 0,
		mintSource: 'replica',
		mintTrxId: op.trxId,
		mintBlockNum: op.blockNum,
		lastTransferBlock: 0,
		originDna,
		instanceDna,
		parentInstanceDna: parentDna,
		generation: gen + 1,
		replicaCount: 0,
	};

	// Update source replicaCount
	await deps.state.putCard({ ...source, replicaCount: replicas + 1 });
	await deps.state.putCard(replica);

	return { status: 'applied' };
}

// ============================================================
// v1.1: card_merge — Combine two same-origin cards
// ============================================================

async function applyCardMerge(op: ProtocolOp, deps: ProtocolCoreDeps): Promise<OpResult> {
	const sourceUids = op.payload.source_uids as [string, string];
	if (!Array.isArray(sourceUids) || sourceUids.length !== 2) return reject('source_uids must be array of exactly 2');

	const [cardA, cardB] = await Promise.all([
		deps.state.getCard(sourceUids[0]),
		deps.state.getCard(sourceUids[1]),
	]);

	if (!cardA) return reject(`card ${sourceUids[0]} not found`);
	if (!cardB) return reject(`card ${sourceUids[1]} not found`);
	if (cardA.owner !== op.broadcaster) return reject(`card ${sourceUids[0]} not owned by broadcaster`);
	if (cardB.owner !== op.broadcaster) return reject(`card ${sourceUids[1]} not owned by broadcaster`);
	if (cardA.cardId !== cardB.cardId) return reject('cards must be same template (cardId)');

	if ((cardA.replicaCount ?? 0) > 0) return reject(`card ${sourceUids[0]} has active replicas`);
	if ((cardB.replicaCount ?? 0) > 0) return reject(`card ${sourceUids[1]} has active replicas`);

	const originDna = cardA.originDna ?? await sha256Hash(`${cardA.cardId}|${cardA.edition}|${cardA.rarity}|genesis`);
	const dnaA = cardA.instanceDna ?? await sha256Hash(`${originDna}|genesis|${cardA.mintTrxId}|0`);
	const dnaB = cardB.instanceDna ?? await sha256Hash(`${originDna}|genesis|${cardB.mintTrxId}|0`);
	const mergedDna = await sha256Hash(`${dnaA}|${dnaB}|merge|${op.trxId}`);

	const mergedLevel = Math.min(MAX_CARD_LEVEL, Math.max(cardA.level, cardB.level) + 1);

	const merged: CardAsset = {
		uid: `${op.trxId}:merge:0`,
		cardId: cardA.cardId,
		owner: op.broadcaster,
		rarity: cardA.rarity,
		edition: cardA.edition,
		foil: 'ascended',
		level: mergedLevel,
		xp: (cardA.xp || 0) + (cardB.xp || 0),
		mintSource: 'merge',
		mintTrxId: op.trxId,
		mintBlockNum: op.blockNum,
		lastTransferBlock: 0,
		originDna,
		instanceDna: mergedDna,
		parentInstanceDna: dnaA,
		generation: 0,
		replicaCount: 0,
		mergedFrom: [cardA.uid, cardB.uid],
	};

	// Burn both sources, create merged
	await deps.state.deleteCard(cardA.uid);
	await deps.state.deleteCard(cardB.uid);
	await deps.state.putCard(merged);

	return { status: 'applied' };
}

// ============================================================
// PoW verification helper
// ============================================================

async function verifyPowField(
	op: ProtocolOp,
	config = POW_CONFIG.MATCH_START,
): Promise<OpResult | null> {
	const pow = op.payload.pow as { nonces?: number[] } | undefined;
	if (!pow?.nonces) return reject(`${op.action} missing required PoW`);

	const payloadForPow = { ...op.payload };
	delete payloadForPow.pow;

	const payloadHash = await sha256Hash(canonicalStringify(payloadForPow));
	const valid = await verifyPoW(payloadHash, { nonces: pow.nonces }, config);
	if (!valid) return reject(`${op.action} PoW verification failed`);

	return null; // PoW valid, continue
}
