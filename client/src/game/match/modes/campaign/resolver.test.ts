import { describe, expect, it } from 'vitest';
import { ALL_CHAPTERS } from '../../../campaign';
import { resolveCampaign } from './resolver';

const KNOWN_MISSION_ID = ALL_CHAPTERS[0].missions[0].id;

describe('resolveCampaign', () => {
	it('returns ok with a scripted opponent for a known mission', () => {
		const result = resolveCampaign({ missionId: KNOWN_MISSION_ID, difficulty: 'normal' });
		if (!result.ok) throw new Error('expected ok for known mission');
		expect(result.ctx.opponent.kind).toBe('scripted');
	});

	it('puts the mission and difficulty inside the scripted payload', () => {
		const result = resolveCampaign({ missionId: KNOWN_MISSION_ID, difficulty: 'heroic' });
		if (!result.ok) throw new Error('expected ok');
		const op = result.ctx.opponent;
		if (op.kind !== 'scripted' || op.script.kind !== 'campaign-mission') {
			throw new Error('expected campaign-mission script');
		}
		expect(op.script.mission.id).toBe(KNOWN_MISSION_ID);
		expect(op.script.difficulty).toBe('heroic');
	});

	it('produces xpRunes percentage 0.1 and no ranking', () => {
		const result = resolveCampaign({ missionId: KNOWN_MISSION_ID, difficulty: 'normal' });
		if (!result.ok) throw new Error('expected ok');
		expect(result.ctx.reward).toEqual({
			xpRunes: { kind: 'percentage', multiplier: 0.1 },
			ranking: { kind: 'none' },
		});
	});

	it('mints a non-empty matchId and matchSeed', () => {
		const result = resolveCampaign({ missionId: KNOWN_MISSION_ID, difficulty: 'normal' });
		if (!result.ok) throw new Error('expected ok');
		expect(result.ctx.matchId.length).toBeGreaterThan(0);
		expect(result.ctx.matchSeed.length).toBeGreaterThan(0);
	});

	it('mints fresh identity on each call (same mission)', () => {
		const a = resolveCampaign({ missionId: KNOWN_MISSION_ID, difficulty: 'normal' });
		const b = resolveCampaign({ missionId: KNOWN_MISSION_ID, difficulty: 'normal' });
		if (!a.ok || !b.ok) throw new Error('expected ok');
		expect(a.ctx.matchId).not.toBe(b.ctx.matchId);
		expect(a.ctx.matchSeed).not.toBe(b.ctx.matchSeed);
	});

	it('returns ok:false with mission_not_found for an unknown id', () => {
		const result = resolveCampaign({ missionId: 'nonexistent-mission-zzz', difficulty: 'normal' });
		expect(result).toEqual({ ok: false, reason: 'mission_not_found' });
	});
});
