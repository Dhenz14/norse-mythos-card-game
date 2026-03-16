/**
 * clientStateAdapter.ts — Browser StateAdapter over IndexedDB (replayDB.ts)
 *
 * PR 3: Bridges protocol-core's abstract StateAdapter interface to the
 * client's existing IndexedDB persistence layer. No new storage — just an
 * adapter over replayDB.ts functions.
 */

import type {
	StateAdapter, CardAsset, GenesisRecord, EloRecord,
	TokenBalance, MatchAnchorRecord, PackCommitRecord, SupplyRecord,
} from '../../../../shared/protocol-core/types';
import {
	getCard, putCard, deleteCard, getCardsByOwner,
	getGenesisState, putGenesisState,
	getSupplyCounter, putSupplyCounter,
	getTokenBalance, putTokenBalance,
	getMatchAnchor, putMatchAnchor,
	getQueueEntry, putQueueEntry, deleteQueueEntry,
	isAccountSlashed, putSlashedAccount,
	advancePlayerNonce,
	getEloRating, putEloRating,
	getRewardClaim, putRewardClaim,
} from './replayDB';
import type { HiveCardAsset } from '../schemas/HiveTypes';

// ============================================================
// Converters: replayDB types ↔ protocol-core types
// ============================================================

function hiveCardToAsset(c: HiveCardAsset): CardAsset {
	return {
		uid: c.uid, cardId: c.cardId, owner: c.ownerId, rarity: c.rarity || 'common',
		level: c.level || 1, xp: c.xp || 0, edition: c.edition || 'alpha',
		mintSource: 'genesis', mintTrxId: c.mintTrxId || '', mintBlockNum: c.mintBlockNum || 0,
		lastTransferBlock: c.lastTransferBlock || 0,
	};
}

function assetToHiveCard(a: CardAsset): HiveCardAsset {
	return {
		uid: a.uid, cardId: a.cardId, ownerId: a.owner, rarity: a.rarity,
		level: a.level, xp: a.xp, edition: a.edition as HiveCardAsset['edition'],
		foil: 'standard', lastTransferBlock: a.lastTransferBlock,
		lastTransferTrxId: '', mintBlockNum: a.mintBlockNum, mintTrxId: a.mintTrxId,
		name: '', type: 'minion',
	};
}

// ============================================================
// StateAdapter implementation over IndexedDB
// ============================================================

export const clientStateAdapter: StateAdapter = {
	async getGenesis() {
		const g = await getGenesisState();
		if (!g.version) return null;
		return {
			version: g.version, sealed: g.sealed,
			sealBlock: g.sealedAtBlock ?? 0,
			packSupply: g.cardDistribution ?? {},
			rewardSupply: {},
		};
	},
	async putGenesis(genesis) {
		await putGenesisState({
			key: 'singleton', version: genesis.version,
			totalSupply: 0, cardDistribution: genesis.packSupply,
			sealed: genesis.sealed, sealedAtBlock: genesis.sealBlock || null,
			readerHash: '', genesisBlock: 0,
		});
	},

	async getCard(uid) {
		const c = await getCard(uid);
		return c ? hiveCardToAsset(c) : null;
	},
	async putCard(card) { await putCard(assetToHiveCard(card)); },
	async deleteCard(uid) { await deleteCard(uid); },
	async getCardsByOwner(owner) {
		const cards = await getCardsByOwner(owner);
		return cards.map(hiveCardToAsset);
	},

	async getSupply(key, pool) {
		const mapKey = `${pool}:${key}`;
		const r = await getSupplyCounter(mapKey);
		if (!r) return null;
		return { key, pool, cap: r.cap, minted: r.minted };
	},
	async putSupply(s) {
		await putSupplyCounter({ rarity: `${s.pool}:${s.key}`, cap: s.cap, minted: s.minted });
	},

	async advanceNonce(account, nonce) {
		return advancePlayerNonce(account, nonce);
	},

	async getElo(account) {
		const r = await getEloRating(account);
		return { account, elo: r.elo, wins: r.wins, losses: r.losses };
	},
	async putElo(r) {
		const existing = await getEloRating(r.account);
		await putEloRating({ ...existing, elo: r.elo, wins: r.wins, losses: r.losses });
	},

	async getTokenBalance(account) {
		const r = await getTokenBalance(account);
		return { account, RUNE: r.RUNE };
	},
	async putTokenBalance(b) {
		const existing = await getTokenBalance(b.account);
		await putTokenBalance({ ...existing, RUNE: b.RUNE });
	},

	async getMatchAnchor(matchId) {
		const a = await getMatchAnchor(matchId);
		if (!a) return null;
		return {
			matchId: a.matchId, playerA: a.playerA, playerB: a.playerB,
			dualAnchored: a.dualAnchored, timestamp: a.timestamp,
		};
	},
	async putMatchAnchor(a) {
		await putMatchAnchor({
			matchId: a.matchId, playerA: a.playerA, playerB: a.playerB,
			matchHash: '', anchorBlockA: null, anchorBlockB: null,
			anchorTxA: null, anchorTxB: null, dualAnchored: a.dualAnchored,
			deckHashA: a.deckHashA ?? null, deckHashB: a.deckHashB ?? null,
			timestamp: a.timestamp,
		});
	},

	// Pack commits (v1 new flow)
	async getPackCommit() { return null; },
	async putPackCommit() { /* client fast-mode delegates pack state to server */ },
	async getUnrevealedCommitsBefore() { return []; /* auto-finalize runs on server only */ },

	async hasRewardClaim(account, rewardId) {
		const r = await getRewardClaim(account, rewardId);
		return !!r;
	},
	async putRewardClaim(account, rewardId, blockNum) {
		await putRewardClaim({
			claimKey: `${account}:${rewardId}`, account, rewardId,
			claimedAt: Date.now(), blockNum, trxId: '',
		});
	},

	async isSlashed(account) { return isAccountSlashed(account); },
	async slash(account, reason, blockNum) {
		await putSlashedAccount({
			account, reason, evidenceTxA: '', evidenceTxB: '',
			slashedAtBlock: blockNum, submittedBy: '',
		});
	},

	async getQueueEntry(account) {
		const q = await getQueueEntry(account);
		return q ? { timestamp: q.timestamp } : null;
	},
	async putQueueEntry(account, data) {
		await putQueueEntry({
			account, mode: data.mode, elo: data.elo,
			peerId: '', deckHash: '', timestamp: data.timestamp, blockNum: data.blockNum,
		});
	},
	async deleteQueueEntry(account) { await deleteQueueEntry(account); },
};
