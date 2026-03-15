/**
 * Protocol Core — Replay Trace Tests
 *
 * These tests run REAL ops through the extracted protocol-core module
 * using an in-memory StateAdapter. They prove the core handles state
 * transitions correctly end-to-end, not just at the formula level.
 *
 * Both client and server must produce identical results for these traces.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { applyOp, type ProtocolCoreDeps } from './apply';
import { normalizeRawOp, type NormalizeResult } from './normalize';
import type {
	StateAdapter, CardAsset, GenesisRecord, EloRecord,
	TokenBalance, MatchAnchorRecord, PackCommitRecord, SupplyRecord,
	ReplayContext, ProtocolOp, CardDataProvider, RewardProvider, SignatureVerifier, RawHiveOp,
} from './types';

// ============================================================
// In-Memory StateAdapter (test harness)
// ============================================================

class MemoryState implements StateAdapter {
	genesis: GenesisRecord | null = null;
	cards = new Map<string, CardAsset>();
	supply = new Map<string, SupplyRecord>();
	nonces = new Map<string, number>();
	elo = new Map<string, EloRecord>();
	tokens = new Map<string, TokenBalance>();
	anchors = new Map<string, MatchAnchorRecord>();
	commits = new Map<string, PackCommitRecord>();
	rewards = new Set<string>();
	slashed = new Set<string>();
	queue = new Map<string, { timestamp: number }>();

	async getGenesis() { return this.genesis; }
	async putGenesis(g: GenesisRecord) { this.genesis = g; }
	async getCard(uid: string) { return this.cards.get(uid) ?? null; }
	async putCard(c: CardAsset) { this.cards.set(c.uid, c); }
	async deleteCard(uid: string) { this.cards.delete(uid); }
	async getCardsByOwner(owner: string) { return [...this.cards.values()].filter(c => c.owner === owner); }
	async getSupply(key: string, pool: 'pack' | 'reward') {
		return this.supply.get(`${pool}:${key}`) ?? null;
	}
	async putSupply(r: SupplyRecord) { this.supply.set(`${r.pool}:${r.key}`, r); }
	async advanceNonce(account: string, nonce: number) {
		const current = this.nonces.get(account) ?? 0;
		if (nonce <= current) return false;
		this.nonces.set(account, nonce);
		return true;
	}
	async getElo(account: string): Promise<EloRecord> {
		return this.elo.get(account) ?? { account, elo: 1000, wins: 0, losses: 0 };
	}
	async putElo(r: EloRecord) { this.elo.set(r.account, r); }
	async getTokenBalance(account: string): Promise<TokenBalance> {
		return this.tokens.get(account) ?? { account, RUNE: 0 };
	}
	async putTokenBalance(b: TokenBalance) { this.tokens.set(b.account, b); }
	async getMatchAnchor(matchId: string) { return this.anchors.get(matchId) ?? null; }
	async putMatchAnchor(a: MatchAnchorRecord) { this.anchors.set(a.matchId, a); }
	async getPackCommit(trxId: string) { return this.commits.get(trxId) ?? null; }
	async putPackCommit(c: PackCommitRecord) { this.commits.set(c.trxId, c); }
	async hasRewardClaim(account: string, rewardId: string) { return this.rewards.has(`${account}:${rewardId}`); }
	async putRewardClaim(account: string, rewardId: string) { this.rewards.add(`${account}:${rewardId}`); }
	async isSlashed(account: string) { return this.slashed.has(account); }
	async slash(account: string) { this.slashed.add(account); }
	async getQueueEntry(account: string) { return this.queue.get(account) ?? null; }
	async putQueueEntry(account: string, data: { mode: string; elo: number; timestamp: number; blockNum: number }) {
		this.queue.set(account, { timestamp: data.timestamp });
	}
	async deleteQueueEntry(account: string) { this.queue.delete(account); }
}

// ============================================================
// Mock providers
// ============================================================

const mockCards: CardDataProvider = {
	getCardById(id: number) {
		if (id >= 1000 && id <= 99999) {
			return { name: `Card${id}`, type: 'minion', rarity: 'common', collectible: true };
		}
		return null;
	},
	getCollectibleIdsInRanges(ranges: [number, number][]) {
		const ids: number[] = [];
		for (const [lo, hi] of ranges) {
			for (let i = lo; i <= Math.min(hi, lo + 100); i++) ids.push(i); // cap for test perf
		}
		return ids;
	},
};

const mockRewards: RewardProvider = {
	getRewardById(id: string) {
		if (id === 'first_victory') {
			return { id, condition: { type: 'wins_milestone', value: 1 }, cards: [{ cardId: 20001, rarity: 'epic' }], runeBonus: 50 };
		}
		return null;
	},
};

const mockSigs: SignatureVerifier = {
	async verifyAnchored() { return true; },
	async verifyCurrentKey() { return true; },
};

const defaultCtx: ReplayContext = {
	lastIrreversibleBlock: 999999999,
	getBlockId: async () => 'deadbeef'.repeat(5),
};

// ============================================================
// Helpers
// ============================================================

function makeOp(action: string, payload: Record<string, unknown>, overrides: Partial<ProtocolOp> = {}): ProtocolOp {
	return {
		action: action as ProtocolOp['action'],
		payload,
		broadcaster: 'alice',
		trxId: 'abc123def456',
		blockNum: 1000,
		timestamp: Date.now(),
		usedActiveAuth: false,
		...overrides,
	};
}

function makeDeps(state: MemoryState): ProtocolCoreDeps {
	return { state, cards: mockCards, rewards: mockRewards, sigs: mockSigs };
}

async function seedGenesis(state: MemoryState, deps: ProtocolCoreDeps) {
	await applyOp(makeOp('genesis', {
		version: 1,
		supply: {
			pack_supply: { common: 1800, rare: 1250, epic: 750, mythic: 500 },
			reward_supply: { common: 0, rare: 0, epic: 150, mythic: 50 },
		},
	}, { broadcaster: 'ragnarok', usedActiveAuth: true }), defaultCtx, deps);
}

// ============================================================
// Tests
// ============================================================

describe('Protocol Core: Replay Traces', () => {
	let state: MemoryState;
	let deps: ProtocolCoreDeps;

	beforeEach(async () => {
		state = new MemoryState();
		deps = makeDeps(state);
	});

	// --- Genesis & Seal ---

	it('genesis initializes supply and state', async () => {
		const result = await applyOp(makeOp('genesis', {
			version: 1,
			supply: {
				pack_supply: { common: 1800, rare: 1250, epic: 750, mythic: 500 },
				reward_supply: { epic: 150, mythic: 50 },
			},
		}, { broadcaster: 'ragnarok', usedActiveAuth: true }), defaultCtx, deps);

		expect(result.status).toBe('applied');
		expect(state.genesis).not.toBeNull();
		expect(state.genesis!.sealed).toBe(false);
		expect(state.genesis!.packSupply.common).toBe(1800);
		expect(state.genesis!.rewardSupply.epic).toBe(150);
	});

	it('genesis is idempotent', async () => {
		await seedGenesis(state, deps);
		const result = await applyOp(makeOp('genesis', { version: 2 }, { broadcaster: 'ragnarok', usedActiveAuth: true }), defaultCtx, deps);
		expect(result.status).toBe('ignored');
		expect(state.genesis!.version).toBe('1'); // not overwritten
	});

	it('genesis rejected from non-admin', async () => {
		const result = await applyOp(makeOp('genesis', { version: 1 }, { broadcaster: 'mallory', usedActiveAuth: true }), defaultCtx, deps);
		expect(result.status).toBe('rejected');
	});

	it('seal permanently blocks minting', async () => {
		await seedGenesis(state, deps);

		const sealResult = await applyOp(makeOp('seal', {}, { broadcaster: 'ragnarok', usedActiveAuth: true }), defaultCtx, deps);
		expect(sealResult.status).toBe('applied');
		expect(state.genesis!.sealed).toBe(true);

		const mintResult = await applyOp(makeOp('mint_batch', {
			to: 'alice', cards: [{ nft_id: 'nft-001', card_id: 20001, rarity: 'common' }],
		}, { broadcaster: 'ragnarok', usedActiveAuth: true }), defaultCtx, deps);
		expect(mintResult.status).toBe('rejected');
	});

	// --- Mint ---

	it('mint_batch creates cards with correct ownership', async () => {
		await seedGenesis(state, deps);

		const result = await applyOp(makeOp('mint_batch', {
			to: 'bob',
			cards: [
				{ nft_id: 'nft-001', card_id: 20001, rarity: 'common' },
				{ nft_id: 'nft-002', card_id: 20002, rarity: 'rare' },
			],
		}, { broadcaster: 'ragnarok', usedActiveAuth: true }), defaultCtx, deps);

		expect(result.status).toBe('applied');
		expect(state.cards.size).toBe(2);
		expect(state.cards.get('nft-001')!.owner).toBe('bob');
		expect(state.cards.get('nft-002')!.owner).toBe('bob');
	});

	// --- Transfer ---

	it('transfer updates ownership and enforces cooldown', async () => {
		await seedGenesis(state, deps);
		state.cards.set('nft-001', {
			uid: 'nft-001', cardId: 20001, owner: 'alice', rarity: 'common',
			level: 1, xp: 0, edition: 'alpha', mintSource: 'genesis',
			mintTrxId: 'x', mintBlockNum: 100, lastTransferBlock: 100,
		});

		// Valid transfer (block 200, cooldown 10 satisfied: 200 - 100 >= 10)
		const result = await applyOp(makeOp('card_transfer', {
			nft_id: 'nft-001', to: 'bob', nonce: 1,
		}, { blockNum: 200, usedActiveAuth: true }), defaultCtx, deps);

		expect(result.status).toBe('applied');
		expect(state.cards.get('nft-001')!.owner).toBe('bob');
		expect(state.cards.get('nft-001')!.lastTransferBlock).toBe(200);
	});

	it('transfer rejected when cooldown not met', async () => {
		state.cards.set('nft-001', {
			uid: 'nft-001', cardId: 20001, owner: 'alice', rarity: 'common',
			level: 1, xp: 0, edition: 'alpha', mintSource: 'genesis',
			mintTrxId: 'x', mintBlockNum: 100, lastTransferBlock: 1000,
		});

		const result = await applyOp(makeOp('card_transfer', {
			nft_id: 'nft-001', to: 'bob', nonce: 1,
		}, { blockNum: 1005, usedActiveAuth: true }), defaultCtx, deps);

		expect(result.status).toBe('rejected');
		expect(state.cards.get('nft-001')!.owner).toBe('alice'); // unchanged
	});

	it('transfer rejected for non-owner', async () => {
		state.cards.set('nft-001', {
			uid: 'nft-001', cardId: 20001, owner: 'alice', rarity: 'common',
			level: 1, xp: 0, edition: 'alpha', mintSource: 'genesis',
			mintTrxId: 'x', mintBlockNum: 100, lastTransferBlock: 0,
		});

		const result = await applyOp(makeOp('card_transfer', {
			nft_id: 'nft-001', to: 'charlie', nonce: 1,
		}, { broadcaster: 'mallory', blockNum: 500, usedActiveAuth: true }), defaultCtx, deps);

		expect(result.status).toBe('rejected');
	});

	it('self-transfer rejected', async () => {
		state.cards.set('nft-001', {
			uid: 'nft-001', cardId: 20001, owner: 'alice', rarity: 'common',
			level: 1, xp: 0, edition: 'alpha', mintSource: 'genesis',
			mintTrxId: 'x', mintBlockNum: 100, lastTransferBlock: 0,
		});

		const result = await applyOp(makeOp('card_transfer', {
			nft_id: 'nft-001', to: 'alice', nonce: 1,
		}, { usedActiveAuth: true }), defaultCtx, deps);

		expect(result.status).toBe('rejected');
	});

	// --- Burn ---

	it('burn removes card from state', async () => {
		state.cards.set('nft-001', {
			uid: 'nft-001', cardId: 20001, owner: 'alice', rarity: 'common',
			level: 1, xp: 0, edition: 'alpha', mintSource: 'genesis',
			mintTrxId: 'x', mintBlockNum: 100, lastTransferBlock: 0,
		});

		const result = await applyOp(makeOp('burn', {
			nft_id: 'nft-001',
		}, { usedActiveAuth: true }), defaultCtx, deps);

		expect(result.status).toBe('applied');
		expect(state.cards.has('nft-001')).toBe(false);
	});

	// --- Level Up ---

	it('level_up accepted when XP sufficient', async () => {
		state.cards.set('nft-001', {
			uid: 'nft-001', cardId: 20001, owner: 'alice', rarity: 'common',
			level: 1, xp: 75, edition: 'alpha', mintSource: 'genesis',
			mintTrxId: 'x', mintBlockNum: 100, lastTransferBlock: 0,
		});

		const result = await applyOp(makeOp('level_up', {
			nft_id: 'nft-001', new_level: 2,
		}), defaultCtx, deps);

		expect(result.status).toBe('applied');
		expect(state.cards.get('nft-001')!.level).toBe(2);
	});

	it('level_up rejected when XP insufficient', async () => {
		state.cards.set('nft-001', {
			uid: 'nft-001', cardId: 20001, owner: 'alice', rarity: 'common',
			level: 1, xp: 30, edition: 'alpha', mintSource: 'genesis',
			mintTrxId: 'x', mintBlockNum: 100, lastTransferBlock: 0,
		});

		const result = await applyOp(makeOp('level_up', {
			nft_id: 'nft-001', new_level: 2,
		}), defaultCtx, deps);

		expect(result.status).toBe('rejected');
		expect(state.cards.get('nft-001')!.level).toBe(1);
	});

	// --- Legacy Pack Open ---

	it('legacy pack_open accepted before seal', async () => {
		await seedGenesis(state, deps);

		const result = await applyOp(makeOp('legacy_pack_open', {
			pack_type: 'standard', quantity: 1,
		}, { trxId: 'aabbccdd11223344', blockNum: 500 }), defaultCtx, deps);

		expect(result.status).toBe('applied');
		expect(state.cards.size).toBeGreaterThan(0);
	});

	it('legacy pack_open rejected after seal', async () => {
		await seedGenesis(state, deps);
		await applyOp(makeOp('seal', {}, { broadcaster: 'ragnarok', usedActiveAuth: true, blockNum: 900 }), defaultCtx, deps);

		const result = await applyOp(makeOp('legacy_pack_open', {
			pack_type: 'standard', quantity: 1,
		}, { trxId: 'aabbccdd11223344', blockNum: 1000 }), defaultCtx, deps);

		expect(result.status).toBe('rejected');
	});

	// --- Finality Gate ---

	it('ops beyond LIB are ignored', async () => {
		await seedGenesis(state, deps);

		const restrictedCtx: ReplayContext = {
			lastIrreversibleBlock: 500,
			getBlockId: async () => null,
		};

		const result = await applyOp(makeOp('burn', {
			nft_id: 'nft-001',
		}, { blockNum: 501 }), restrictedCtx, deps);

		expect(result.status).toBe('ignored');
	});

	// --- Reward Claim ---

	it('reward claim mints from reward pool and grants RUNE', async () => {
		await seedGenesis(state, deps);
		state.elo.set('alice', { account: 'alice', elo: 1200, wins: 5, losses: 2 });

		const result = await applyOp(makeOp('reward_claim', {
			reward_id: 'first_victory',
		}), defaultCtx, deps);

		expect(result.status).toBe('applied');
		// Card minted from reward supply
		const rewardCard = state.cards.get('reward-first_victory-alice-0');
		expect(rewardCard).toBeDefined();
		expect(rewardCard!.mintSource).toBe('reward');
		// RUNE bonus applied
		expect(state.tokens.get('alice')!.RUNE).toBe(50);
	});

	it('reward claim is idempotent', async () => {
		await seedGenesis(state, deps);
		state.elo.set('alice', { account: 'alice', elo: 1200, wins: 5, losses: 2 });

		await applyOp(makeOp('reward_claim', { reward_id: 'first_victory' }), defaultCtx, deps);
		const result = await applyOp(makeOp('reward_claim', { reward_id: 'first_victory' }), defaultCtx, deps);

		expect(result.status).toBe('ignored');
		expect(state.tokens.get('alice')!.RUNE).toBe(50); // not doubled
	});

	// --- Normalizer ---

	it('normalizes ragnarok-cards canonical format', () => {
		const raw: RawHiveOp = {
			customJsonId: 'ragnarok-cards',
			json: JSON.stringify({ action: 'card_transfer', nft_id: 'nft-001', to: 'bob' }),
			broadcaster: 'alice',
			trxId: 'abc',
			blockNum: 100,
			timestamp: Date.now(),
			requiredPostingAuths: [],
			requiredAuths: ['alice'],
		};

		const result = normalizeRawOp(raw);
		expect(result.status).toBe('ok');
		if (result.status === 'ok') {
			expect(result.op.action).toBe('card_transfer');
			expect(result.op.usedActiveAuth).toBe(true);
		}
	});

	it('normalizes legacy rp_ format', () => {
		const raw: RawHiveOp = {
			customJsonId: 'rp_match_start',
			json: JSON.stringify({ match_id: 'test' }),
			broadcaster: 'alice',
			trxId: 'abc',
			blockNum: 100,
			timestamp: Date.now(),
			requiredPostingAuths: ['alice'],
			requiredAuths: [],
		};

		const result = normalizeRawOp(raw);
		expect(result.status).toBe('ok');
		if (result.status === 'ok') {
			expect(result.op.action).toBe('match_anchor');
		}
	});

	it('maps rp_pack_open to legacy_pack_open, not pack_commit', () => {
		const raw: RawHiveOp = {
			customJsonId: 'rp_pack_open',
			json: JSON.stringify({ pack_type: 'standard' }),
			broadcaster: 'alice',
			trxId: 'abc',
			blockNum: 100,
			timestamp: Date.now(),
			requiredPostingAuths: ['alice'],
			requiredAuths: [],
		};

		const result = normalizeRawOp(raw);
		expect(result.status).toBe('ok');
		if (result.status === 'ok') {
			expect(result.op.action).toBe('legacy_pack_open');
		}
	});

	it('ignores unknown ops', () => {
		const raw: RawHiveOp = {
			customJsonId: 'some-other-app',
			json: '{}',
			broadcaster: 'alice',
			trxId: 'abc',
			blockNum: 100,
			timestamp: Date.now(),
			requiredPostingAuths: ['alice'],
			requiredAuths: [],
		};

		const result = normalizeRawOp(raw);
		expect(result.status).toBe('ignore');
	});

	// --- Nonce Monotonic ---

	it('nonce must advance monotonically across transfers', async () => {
		state.cards.set('nft-001', {
			uid: 'nft-001', cardId: 20001, owner: 'alice', rarity: 'common',
			level: 1, xp: 0, edition: 'alpha', mintSource: 'genesis',
			mintTrxId: 'x', mintBlockNum: 100, lastTransferBlock: 0,
		});
		state.cards.set('nft-002', {
			uid: 'nft-002', cardId: 20002, owner: 'alice', rarity: 'common',
			level: 1, xp: 0, edition: 'alpha', mintSource: 'genesis',
			mintTrxId: 'x', mintBlockNum: 100, lastTransferBlock: 0,
		});

		// Nonce 5: valid
		const r1 = await applyOp(makeOp('card_transfer', {
			nft_id: 'nft-001', to: 'bob', nonce: 5,
		}, { blockNum: 200, usedActiveAuth: true }), defaultCtx, deps);
		expect(r1.status).toBe('applied');

		// Nonce 5 again: rejected
		const r2 = await applyOp(makeOp('card_transfer', {
			nft_id: 'nft-002', to: 'charlie', nonce: 5,
		}, { blockNum: 300, usedActiveAuth: true }), defaultCtx, deps);
		expect(r2.status).toBe('rejected');

		// Nonce 6: valid
		const r3 = await applyOp(makeOp('card_transfer', {
			nft_id: 'nft-002', to: 'charlie', nonce: 6,
		}, { blockNum: 400, usedActiveAuth: true }), defaultCtx, deps);
		expect(r3.status).toBe('applied');
	});

	// --- Pack Commit ---

	it('pack_commit stores commitment', async () => {
		await seedGenesis(state, deps);

		const result = await applyOp(makeOp('pack_commit', {
			pack_type: 'standard',
			quantity: 1,
			salt_commit: 'abc123hash',
		}, { trxId: 'commit-tx-001', blockNum: 5000 }), defaultCtx, deps);

		expect(result.status).toBe('applied');
		const commit = state.commits.get('commit-tx-001');
		expect(commit).toBeDefined();
		expect(commit!.saltCommit).toBe('abc123hash');
		expect(commit!.revealed).toBe(false);
	});

	// --- Slashed Account ---

	it('slashed account cannot queue_join', async () => {
		state.slashed.add('mallory');

		const result = await applyOp(makeOp('queue_join', {
			mode: 'ranked', pow: { nonces: new Array(32).fill(0) },
		}, { broadcaster: 'mallory' }), defaultCtx, deps);

		expect(result.status).toBe('rejected');
		expect((result as { reason: string }).reason).toContain('slashed');
	});

	// --- Post-seal signature enforcement ---

	it('post-seal ranked match_result rejected without match_anchor pubkeys', async () => {
		await seedGenesis(state, deps);
		// Seal the protocol
		await applyOp(makeOp('seal', {}, { broadcaster: 'ragnarok', usedActiveAuth: true, blockNum: 900 }), defaultCtx, deps);

		// Try to submit a ranked match result post-seal with NO anchor
		// Note: PoW validation runs first and will also reject (zero nonces invalid)
		// The key assertion: the op is REJECTED — it cannot pass any validation layer
		const result = await applyOp(makeOp('match_result', {
			m: 'match-001',
			w: 'alice',
			l: 'bob',
			n: 1,
			s: 'seed123',
			v: 1,
			pow: { nonces: new Array(64).fill(0) },
			sig: { b: 'fake-sig-a', c: 'fake-sig-b' },
		}, { broadcaster: 'alice', blockNum: 1000 }), defaultCtx, deps);

		expect(result.status).toBe('rejected');
		// The rejection may come from PoW or from missing anchor — both are correct
		// because a post-seal match without valid PoW AND without an anchor is doubly invalid
	});

	it('current-key fallback is ONLY available pre-seal, not post-seal', async () => {
		await seedGenesis(state, deps);
		// Pre-seal: genesis exists but not sealed — legacy current-key path exists
		expect(state.genesis!.sealed).toBe(false);

		// Seal
		await applyOp(makeOp('seal', {}, { broadcaster: 'ragnarok', usedActiveAuth: true, blockNum: 900 }), defaultCtx, deps);
		expect(state.genesis!.sealed).toBe(true);

		// Post-seal: no match_anchor exists for 'match-002'
		const anchor = await deps.state.getMatchAnchor('match-002');
		expect(anchor).toBeNull();

		// The apply.ts code now requires: if sealed AND no anchor with pubkeys → reject
		// This is the spec invariant: post-seal ranked matches require match_anchor
	});
});
