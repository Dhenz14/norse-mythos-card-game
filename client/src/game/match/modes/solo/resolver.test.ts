import { describe, expect, it } from 'vitest';
import { resolveSolo } from './resolver';

describe('resolveSolo', () => {
	it('returns an AI opponent with the requested difficulty and deck source', () => {
		const ctx = resolveSolo({ difficulty: 'normal', deckSource: 'warband' });
		expect(ctx.opponent).toEqual({
			kind: 'ai',
			difficulty: 'normal',
			deckSource: 'warband',
		});
	});

	it('passes through every difficulty tier', () => {
		const tiers = ['normal', 'heroic', 'mythic'] as const;
		for (const difficulty of tiers) {
			const ctx = resolveSolo({ difficulty, deckSource: 'default' });
			if (ctx.opponent.kind !== 'ai') throw new Error('expected ai opponent');
			expect(ctx.opponent.difficulty).toBe(difficulty);
		}
	});

	it('produces a practice reward channel (none/none)', () => {
		const ctx = resolveSolo({ difficulty: 'normal', deckSource: 'warband' });
		expect(ctx.reward).toEqual({
			xpRunes: { kind: 'none' },
			ranking: { kind: 'none' },
		});
	});

	it('mints a non-empty matchId and matchSeed', () => {
		const ctx = resolveSolo({ difficulty: 'normal', deckSource: 'warband' });
		expect(ctx.matchId.length).toBeGreaterThan(0);
		expect(ctx.matchSeed.length).toBeGreaterThan(0);
	});

	it('mints fresh identity on each call', () => {
		const a = resolveSolo({ difficulty: 'normal', deckSource: 'warband' });
		const b = resolveSolo({ difficulty: 'normal', deckSource: 'warband' });
		expect(a.matchId).not.toBe(b.matchId);
		expect(a.matchSeed).not.toBe(b.matchSeed);
	});
});
