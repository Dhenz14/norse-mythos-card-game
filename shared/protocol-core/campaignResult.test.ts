import { describe, expect, it } from 'vitest';

import { applyOp, type ProtocolCoreDeps } from './apply';
import { canonicalStringify, sha256Hash } from './hash';
import { normalizeRawOp } from './normalize';
import type {
	CampaignProgressRecord,
	CampaignSubmissionRecord,
	CardAsset,
	CompanionTransfer,
	DuatClaimRecord,
	EloRecord,
	GenesisRecord,
	MarketListing,
	MarketOffer,
	MatchAnchorRecord,
	PackAsset,
	PackCommitRecord,
	PackSupplyRecord,
	StateAdapter,
	SupplyRecord,
	TokenBalance,
} from './types';

function createStateAdapter(): StateAdapter & {
	readonly campaignSubmissions: Map<string, CampaignSubmissionRecord>;
} {
	const campaignNonces = new Map<string, number>();
	const campaignSubmissions = new Map<string, CampaignSubmissionRecord>();
	const campaignProgress = new Map<string, CampaignProgressRecord>();
	const rewardClaims = new Set<string>();

	return {
		campaignSubmissions,

		async getGenesis(): Promise<GenesisRecord | null> { return null; },
		async putGenesis(): Promise<void> { /* noop */ },
		async getCard(): Promise<CardAsset | null> { return null; },
		async putCard(): Promise<void> { /* noop */ },
		async deleteCard(): Promise<void> { /* noop */ },
		async getCardsByOwner(): Promise<CardAsset[]> { return []; },
		async getSupply(): Promise<SupplyRecord | null> { return null; },
		async putSupply(): Promise<void> { /* noop */ },
		async advanceNonce(): Promise<boolean> { return true; },
		async getElo(account: string): Promise<EloRecord> {
			return { account, elo: 1000, wins: 0, losses: 0 };
		},
		async putElo(): Promise<void> { /* noop */ },
		async getTokenBalance(account: string): Promise<TokenBalance> {
			return { account, RUNE: 0 };
		},
		async putTokenBalance(): Promise<void> { /* noop */ },
		async getMatchAnchor(): Promise<MatchAnchorRecord | null> { return null; },
		async putMatchAnchor(): Promise<void> { /* noop */ },
		async getPackCommit(): Promise<PackCommitRecord | null> { return null; },
		async putPackCommit(): Promise<void> { /* noop */ },
		async getUnrevealedCommitsBefore(): Promise<PackCommitRecord[]> { return []; },
		async hasRewardClaim(account: string, rewardId: string): Promise<boolean> {
			return rewardClaims.has(`${account}:${rewardId}`);
		},
		async putRewardClaim(account: string, rewardId: string): Promise<void> {
			rewardClaims.add(`${account}:${rewardId}`);
		},
		async advanceCampaignNonce(account: string, nonce: number): Promise<boolean> {
			const current = campaignNonces.get(account) ?? 0;
			if (nonce <= current) return false;
			campaignNonces.set(account, nonce);
			return true;
		},
		async getCampaignSubmission(submissionKey: string): Promise<CampaignSubmissionRecord | null> {
			return campaignSubmissions.get(submissionKey) ?? null;
		},
		async putCampaignSubmission(submission: CampaignSubmissionRecord): Promise<void> {
			campaignSubmissions.set(submission.submissionKey, submission);
		},
		async getCampaignProgress(
			account: string,
			campaignId: string,
			missionId: string,
		): Promise<CampaignProgressRecord | null> {
			return campaignProgress.get(`${account}:${campaignId}:${missionId}`) ?? null;
		},
		async putCampaignProgress(progress: CampaignProgressRecord): Promise<void> {
			campaignProgress.set(`${progress.account}:${progress.campaignId}:${progress.missionId}`, progress);
		},
		async isSlashed(): Promise<boolean> { return false; },
		async slash(): Promise<void> { /* noop */ },
		async getQueueEntry(): Promise<{ timestamp: number } | null> { return null; },
		async putQueueEntry(): Promise<void> { /* noop */ },
		async deleteQueueEntry(): Promise<void> { /* noop */ },
		async getPack(): Promise<PackAsset | null> { return null; },
		async putPack(): Promise<void> { /* noop */ },
		async deletePack(): Promise<void> { /* noop */ },
		async getPacksByOwner(): Promise<PackAsset[]> { return []; },
		async getPackSupply(): Promise<PackSupplyRecord | null> { return null; },
		async putPackSupply(): Promise<void> { /* noop */ },
		async getCompanionTransfer(): Promise<CompanionTransfer | null> { return null; },
		setTrxSiblings(): void { /* noop */ },
		async getDuatClaim(): Promise<DuatClaimRecord | null> { return null; },
		async putDuatClaim(): Promise<void> { /* noop */ },
		async getListing(): Promise<MarketListing | null> { return null; },
		async getListingByNft(): Promise<MarketListing | null> { return null; },
		async putListing(): Promise<void> { /* noop */ },
		async deleteListing(): Promise<void> { /* noop */ },
		async getOffer(): Promise<MarketOffer | null> { return null; },
		async getOffersByNft(): Promise<MarketOffer[]> { return []; },
		async putOffer(): Promise<void> { /* noop */ },
	};
}

describe('campaign_result protocol op', () => {
	it('stores a queued campaign submission derived from the broadcaster identity', async () => {
		const state = createStateAdapter();
		const campaignId = 'war-of-pantheons';
		const localRunId = 'run-local-1';
		const localStartedAt = 1736200000000;
		const rulesetHash = 'ruleset-hash-v1';
		const deps: ProtocolCoreDeps = {
			state,
			cards: {
				getCardById: () => null,
				getCollectibleIdsInRanges: () => [],
			},
			rewards: {
				getRewardById: () => null,
			},
			campaigns: {
				getRegistryHash: () => rulesetHash,
				getCampaignId: () => campaignId,
				getMission: missionId => ({
					id: missionId,
					campaignId,
					chapterId: 'norse',
					prerequisiteIds: [],
					allowedDifficulties: ['normal', 'heroic', 'mythic'],
					starThresholds: { threeStar: 12, twoStar: 20 },
				}),
			},
			sigs: {
				verifyAnchored: async () => false,
				verifyCurrentKey: async () => false,
			},
		};

		const normalized = normalizeRawOp({
			customJsonId: 'rp_campaign_result',
			json: JSON.stringify({
				v: 1,
				cid: campaignId,
				m: 'norse-1',
				d: 'normal',
				n: 1,
				rid: localRunId,
				lst: localStartedAt,
				rh: rulesetHash,
				tr: 'transcript-root',
				tc: 'ipfs://campaign-transcript',
				fh: 'final-state-hash',
				t: 9,
			}),
			broadcaster: 'alice',
			trxId: 'trx-campaign-1',
			blockNum: 20,
			timestamp: 123_000,
			requiredPostingAuths: ['alice'],
			requiredAuths: [],
		});

		expect(normalized.status).toBe('ok');
		if (normalized.status !== 'ok') return;

		const result = await applyOp(normalized.op, {
			lastIrreversibleBlock: 20,
			getBlockId: async () => null,
		}, deps);

		expect(result.status).toBe('applied');
		const stored = state.campaignSubmissions.get('alice:war-of-pantheons:norse-1:normal:1');
		expect(stored?.status).toBe('queued');
		expect(stored?.stars).toBe(3);
		expect(stored?.account).toBe('alice');
		expect(stored?.campaignId).toBe(campaignId);
		expect(stored?.localRunId).toBe(localRunId);
		expect(stored?.localStartedAt).toBe(localStartedAt);

		const expectedSeed = await sha256Hash(canonicalStringify({
			account: 'alice',
			campaignId,
			difficulty: 'normal',
			domain: 'ragnarok:campaign:v1',
			localRunId,
			localStartedAt,
			missionId: 'norse-1',
			nonce: 1,
			rulesetHash,
		}));
		expect(stored?.seed).toBe(expectedSeed);
	});
});
