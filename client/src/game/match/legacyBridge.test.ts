import { describe, expect, it } from 'vitest';
import { ALL_CHAPTERS } from '../campaign';
import { type LegacySynthInputs, synthesizeLegacyMatchContext } from './legacySynth';

const KNOWN_MISSION_ID = ALL_CHAPTERS[0].missions[0].id;

const baseInputs: LegacySynthInputs = {
	isP2PConnected: false,
	campaignMission: null,
	campaignDifficulty: 'normal',
};

describe('synthesizeLegacyMatchContext', () => {
	it('returns a single (ai opponent) ctx when no campaign mission and not P2P', () => {
		const ctx = synthesizeLegacyMatchContext(baseInputs);
		if (!ctx) throw new Error('expected ctx');
		expect(ctx.opponent.kind).toBe('ai');
	});

	it('returns campaign (scripted opponent) ctx when campaignMission is set', () => {
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			campaignMission: KNOWN_MISSION_ID,
			campaignDifficulty: 'heroic',
		});
		if (!ctx) throw new Error('expected ctx');
		if (ctx.opponent.kind !== 'scripted' || ctx.opponent.script.kind !== 'campaign-mission') {
			throw new Error('expected scripted/campaign-mission');
		}
		expect(ctx.opponent.script.mission.id).toBe(KNOWN_MISSION_ID);
		expect(ctx.opponent.script.difficulty).toBe('heroic');
	});

	it('returns null when campaignMission is set but unknown', () => {
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			campaignMission: 'nonexistent-mission-zzz',
		});
		expect(ctx).toBeNull();
	});

	it('returns null when P2P connected — peer ctx is owned by <MatchSetupP2P/>', () => {
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			isP2PConnected: true,
		});
		expect(ctx).toBeNull();
	});

	it('returns null during P2P even when a stale campaign mission lingers in the store', () => {
		// Without this delegation rule, residual campaign state from an
		// earlier session would leak into a P2P match as a campaign ctx
		// — the wrapper expects to be the sole authority.
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			isP2PConnected: true,
			campaignMission: KNOWN_MISSION_ID,
		});
		expect(ctx).toBeNull();
	});
});
