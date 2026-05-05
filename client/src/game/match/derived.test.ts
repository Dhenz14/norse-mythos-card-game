import { describe, expect, it } from 'vitest';
import { ALL_CHAPTERS } from '../campaign';
import { deriveAuthority, deriveOpponentArmyForMode } from './derived';
import type { MatchContext } from './types';

const KNOWN_MISSION = ALL_CHAPTERS[0].missions[0];

const baseIdentity = {
	matchId: 'match-x',
	matchSeed: 'seed-x',
};

const aiCtx: MatchContext = {
	...baseIdentity,
	opponent: { kind: 'ai', difficulty: 'normal', deckSource: 'warband' },
	reward: { xpRunes: { kind: 'none' }, ranking: { kind: 'none' } },
};

const scriptedCtx: MatchContext = {
	...baseIdentity,
	opponent: {
		kind: 'scripted',
		script: { kind: 'campaign-mission', mission: KNOWN_MISSION, difficulty: 'heroic' },
	},
	reward: { xpRunes: { kind: 'percentage', multiplier: 0.1 }, ranking: { kind: 'none' } },
};

const peerCtx: MatchContext = {
	...baseIdentity,
	opponent: {
		kind: 'peer',
		peerId: 'peer-z',
		myRole: 'first-mover',
		opponentUsername: null,
	},
	reward: { xpRunes: { kind: 'percentage', multiplier: 1 }, ranking: { kind: 'elo' } },
};

describe('deriveAuthority', () => {
	it('returns local for ai opponent', () => {
		expect(deriveAuthority(aiCtx)).toEqual({ kind: 'local' });
	});

	it('returns local for scripted opponent', () => {
		expect(deriveAuthority(scriptedCtx)).toEqual({ kind: 'local' });
	});

	it('returns p2p-symmetric with myRole carried through for peer opponent', () => {
		expect(deriveAuthority(peerCtx)).toEqual({
			kind: 'p2p-symmetric',
			myRole: 'first-mover',
		});
	});
});

describe('deriveOpponentArmyForMode', () => {
	it('returns a non-null ArmySelection for ai opponent (delegates to solo builder)', () => {
		const army = deriveOpponentArmyForMode(aiCtx);
		expect(army).not.toBeNull();
	});

	it('returns a non-null ArmySelection for scripted opponent (delegates to campaign builder)', () => {
		const army = deriveOpponentArmyForMode(scriptedCtx);
		expect(army).not.toBeNull();
	});

	it('returns null for peer opponent (army comes via the wire prop, not derivable)', () => {
		const army = deriveOpponentArmyForMode(peerCtx);
		expect(army).toBeNull();
	});
});
