import { describe, expect, it } from 'vitest';
import {
	MATCH_ECONOMY,
	POOL_REWARDS,
	getEconomyFootprint,
	modeEconomyToReward,
} from './economy';

describe('POOL_REWARDS', () => {
	it('is a positive finite number', () => {
		expect(POOL_REWARDS).toBeGreaterThan(0);
		expect(Number.isFinite(POOL_REWARDS)).toBe(true);
	});

	it('is normalized to 1.0 (the "100%" reference)', () => {
		expect(POOL_REWARDS).toBe(1.0);
	});
});

describe('MATCH_ECONOMY', () => {
	it('practice has zero xpRunes share and no ranking', () => {
		expect(MATCH_ECONOMY.practice).toEqual({
			xpRunesShare: 0,
			ranking: 'none',
		});
	});

	it('campaign reduces to 10% of the pool, no ranking', () => {
		expect(MATCH_ECONOMY.campaign.xpRunesShare).toBeCloseTo(POOL_REWARDS * 0.10, 10);
		expect(MATCH_ECONOMY.campaign.ranking).toBe('none');
	});

	it('p2pRanked is the baseline (100% of pool) with ELO ranking', () => {
		expect(MATCH_ECONOMY.p2pRanked.xpRunesShare).toBeCloseTo(POOL_REWARDS * 1.0, 10);
		expect(MATCH_ECONOMY.p2pRanked.ranking).toBe('elo');
	});

	it('every entry has a non-negative finite xpRunesShare', () => {
		for (const econ of Object.values(MATCH_ECONOMY)) {
			expect(Number.isFinite(econ.xpRunesShare)).toBe(true);
			expect(econ.xpRunesShare).toBeGreaterThanOrEqual(0);
		}
	});

	it('every entry has a valid ranking discriminant', () => {
		const allowed = new Set(['none', 'elo']);
		for (const econ of Object.values(MATCH_ECONOMY)) {
			expect(allowed.has(econ.ranking)).toBe(true);
		}
	});
});

describe('modeEconomyToReward', () => {
	it('collapses xpRunesShare === 0 to xpRunes: { kind: "none" }', () => {
		const reward = modeEconomyToReward(MATCH_ECONOMY.practice);
		expect(reward.xpRunes).toEqual({ kind: 'none' });
	});

	it('expands xpRunesShare > 0 to xpRunes: { kind: "percentage", multiplier }', () => {
		const reward = modeEconomyToReward(MATCH_ECONOMY.campaign);
		expect(reward.xpRunes).toEqual({
			kind: 'percentage',
			multiplier: MATCH_ECONOMY.campaign.xpRunesShare,
		});
	});

	it('maps ranking "elo" to { kind: "elo" }', () => {
		const reward = modeEconomyToReward(MATCH_ECONOMY.p2pRanked);
		expect(reward.ranking).toEqual({ kind: 'elo' });
	});

	it('maps ranking "none" to { kind: "none" }', () => {
		const reward = modeEconomyToReward(MATCH_ECONOMY.campaign);
		expect(reward.ranking).toEqual({ kind: 'none' });
	});
});

describe('getEconomyFootprint', () => {
	it('returns the sum of all per-mode xpRunesShare values (audit baseline)', () => {
		// 0 + 0.1 + 1.0 = 1.1. If this number changes silently when a new
		// mode lands, the diff makes the economy delta explicit.
		expect(getEconomyFootprint()).toBeCloseTo(1.1, 10);
	});

	it('is a finite number', () => {
		expect(Number.isFinite(getEconomyFootprint())).toBe(true);
	});
});
