/**
 * serverStateAdapter.ts — StateAdapter implementation backed by chainState.ts Maps.
 *
 * Bridges the protocol-core's abstract StateAdapter interface to the server's
 * existing in-memory Map + JSON persistence system. No new storage layer —
 * just an adapter over what already exists.
 */

import type {
	StateAdapter, CardAsset, GenesisRecord, EloRecord,
	TokenBalance, MatchAnchorRecord, PackCommitRecord, SupplyRecord,
} from '../../shared/protocol-core/types';
import {
	getCard as csGetCard, putCard as csPutCard, deleteCard as csDeleteCard,
	getCardsByOwner as csGetCardsByOwner,
	getOrCreatePlayer, advanceNonce as csAdvanceNonce,
	registerAccount,
	type CardRecord,
} from './chainState';

// ============================================================
// Extended state Maps (protocol-core needs state the old indexer didn't track)
// ============================================================

let genesisState: GenesisRecord | null = null;
const supplyCounters = new Map<string, SupplyRecord>();
const tokenBalances = new Map<string, TokenBalance>();
const matchAnchors = new Map<string, MatchAnchorRecord>();
const packCommits = new Map<string, PackCommitRecord>();
const rewardClaims = new Set<string>();
const slashedAccounts = new Set<string>();
const queueEntries = new Map<string, { timestamp: number }>();

// ============================================================
// Converters: chainState.CardRecord ↔ protocol-core.CardAsset
// ============================================================

function cardRecordToAsset(r: CardRecord): CardAsset {
	return {
		uid: r.uid,
		cardId: r.cardId,
		owner: r.owner,
		rarity: r.rarity,
		level: r.level,
		xp: r.xp,
		edition: 'alpha',
		mintSource: 'genesis',
		mintTrxId: '',
		mintBlockNum: 0,
		lastTransferBlock: 0,
	};
}

function assetToCardRecord(a: CardAsset): CardRecord {
	return {
		uid: a.uid,
		cardId: a.cardId,
		owner: a.owner,
		rarity: a.rarity,
		level: a.level,
		xp: a.xp,
	};
}

// ============================================================
// StateAdapter implementation
// ============================================================

export const serverStateAdapter: StateAdapter = {
	// Genesis
	async getGenesis() { return genesisState; },
	async putGenesis(g) { genesisState = g; },

	// Cards — delegate to chainState Maps
	async getCard(uid) {
		const r = csGetCard(uid);
		return r ? cardRecordToAsset(r) : null;
	},
	async putCard(card) {
		csPutCard(assetToCardRecord(card));
		registerAccount(card.owner);
	},
	async deleteCard(uid) { csDeleteCard(uid); },
	async getCardsByOwner(owner) {
		return csGetCardsByOwner(owner).map(cardRecordToAsset);
	},

	// Supply
	async getSupply(key, pool) {
		return supplyCounters.get(`${pool}:${key}`) ?? null;
	},
	async putSupply(r) {
		supplyCounters.set(`${r.pool}:${r.key}`, r);
	},

	// Nonces — delegate to chainState
	async advanceNonce(account, nonce) {
		return csAdvanceNonce(account, nonce);
	},

	// ELO
	async getElo(account) {
		const p = getOrCreatePlayer(account);
		return { account, elo: p.elo, wins: p.wins, losses: p.losses };
	},
	async putElo(r) {
		const p = getOrCreatePlayer(r.account);
		p.elo = r.elo;
		p.wins = r.wins;
		p.losses = r.losses;
	},

	// Tokens
	async getTokenBalance(account) {
		return tokenBalances.get(account) ?? { account, RUNE: 0 };
	},
	async putTokenBalance(b) { tokenBalances.set(b.account, b); },

	// Match anchors
	async getMatchAnchor(matchId) { return matchAnchors.get(matchId) ?? null; },
	async putMatchAnchor(a) { matchAnchors.set(a.matchId, a); },

	// Pack commits
	async getPackCommit(trxId) { return packCommits.get(trxId) ?? null; },
	async putPackCommit(c) { packCommits.set(c.trxId, c); },

	// Reward claims
	async hasRewardClaim(account, rewardId) { return rewardClaims.has(`${account}:${rewardId}`); },
	async putRewardClaim(account, rewardId) { rewardClaims.add(`${account}:${rewardId}`); },

	// Slash
	async isSlashed(account) { return slashedAccounts.has(account); },
	async slash(account) { slashedAccounts.add(account); },

	// Queue
	async getQueueEntry(account) { return queueEntries.get(account) ?? null; },
	async putQueueEntry(account, data) { queueEntries.set(account, { timestamp: data.timestamp }); },
	async deleteQueueEntry(account) { queueEntries.delete(account); },
};
