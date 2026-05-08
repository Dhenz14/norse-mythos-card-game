import { describe, expect, it } from 'vitest';
import { createMatchIdentityFactory } from './identityFactory';

describe('createMatchIdentityFactory', () => {
	it('builds match identity from the supplied id generator', () => {
		const ids = ['match-a', 'seed-a'];
		let index = 0;
		const factory = createMatchIdentityFactory(() => ids[index++] ?? 'unexpected');

		expect(factory.create()).toEqual({
			matchId: 'match-a',
			matchSeed: 'seed-a',
		});
	});

	it('creates fresh identity on each call', () => {
		let index = 0;
		const factory = createMatchIdentityFactory(() => `id-${index++}`);

		const first = factory.create();
		const second = factory.create();

		expect(first).toEqual({ matchId: 'id-0', matchSeed: 'id-1' });
		expect(second).toEqual({ matchId: 'id-2', matchSeed: 'id-3' });
	});
});
