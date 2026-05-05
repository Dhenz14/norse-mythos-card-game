import { describe, expect, it } from 'vitest';
import { ALL_CHAPTERS } from '../campaign';
import { type LegacySynthInputs, synthesizeLegacyMatchContext } from './legacySynth';

const KNOWN_MISSION_ID = ALL_CHAPTERS[0].missions[0].id;

const baseInputs: LegacySynthInputs = {
	isP2PConnected: false,
	matchSeed: null,
	matchId: null,
	myCanonicalSide: null,
	remotePeerId: null,
	campaignMission: null,
	campaignDifficulty: 'normal',
};

describe('synthesizeLegacyMatchContext', () => {
	it('returns a solo (ai opponent) ctx when no campaign mission and not P2P', () => {
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

	it('returns null when P2P connected but matchSeed has not arrived yet', () => {
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			isP2PConnected: true,
			matchSeed: null,
			matchId: null,
		});
		expect(ctx).toBeNull();
	});

	it('returns null when P2P connected and matchSeed arrives but matchId is still null', () => {
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			isP2PConnected: true,
			matchSeed: 'seed-x',
			matchId: null,
		});
		expect(ctx).toBeNull();
	});

	it('returns peer opponent ctx when P2P fully ready (connected + matchSeed + matchId)', () => {
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			isP2PConnected: true,
			matchSeed: 'seed-deadbeef',
			matchId: 'match-abc',
			remotePeerId: 'peer-xyz',
			myCanonicalSide: 'player',
		});
		if (!ctx || ctx.opponent.kind !== 'peer') {
			throw new Error('expected peer opponent');
		}
		expect(ctx.matchId).toBe('match-abc');
		expect(ctx.matchSeed).toBe('seed-deadbeef');
		expect(ctx.opponent.peerId).toBe('peer-xyz');
		expect(ctx.opponent.myRole).toBe('first-mover');
		expect(ctx.opponent.opponentUsername).toBeNull();
	});

	it('maps myCanonicalSide "opponent" to second-mover (canonical-frame translation)', () => {
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			isP2PConnected: true,
			matchSeed: 'seed-x',
			matchId: 'match-x',
			myCanonicalSide: 'opponent',
		});
		if (!ctx || ctx.opponent.kind !== 'peer') {
			throw new Error('expected peer opponent');
		}
		expect(ctx.opponent.myRole).toBe('second-mover');
	});

	it('maps myCanonicalSide null to first-mover (default for new P2P matches before seed_reveal)', () => {
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			isP2PConnected: true,
			matchSeed: 'seed-x',
			matchId: 'match-x',
			myCanonicalSide: null,
		});
		if (!ctx || ctx.opponent.kind !== 'peer') {
			throw new Error('expected peer opponent');
		}
		expect(ctx.opponent.myRole).toBe('first-mover');
	});

	it('P2P branch wins over campaign when both inputs are set (peer connection takes priority)', () => {
		const ctx = synthesizeLegacyMatchContext({
			...baseInputs,
			isP2PConnected: true,
			matchSeed: 'seed-x',
			matchId: 'match-x',
			campaignMission: KNOWN_MISSION_ID,
		});
		if (!ctx) throw new Error('expected ctx');
		expect(ctx.opponent.kind).toBe('peer');
	});
});
