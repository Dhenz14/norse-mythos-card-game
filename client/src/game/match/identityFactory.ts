/**
 * Match identity factory.
 *
 * Resolvers stay pure: they receive a complete MatchIdentity and only map
 * mode input into MatchContext. Entropy belongs at the setup boundary.
 */

import { cryptoIdGen } from '../utils/seededRng';
import type { MatchIdentity } from './types';

export interface MatchIdentityFactory {
	readonly create: () => MatchIdentity;
}

export type MatchIdGenerator = () => string;

export function createMatchIdentityFactory(
	generateId: MatchIdGenerator = cryptoIdGen,
): MatchIdentityFactory {
	return {
		create: () => ({
			matchId: generateId(),
			matchSeed: generateId(),
		}),
	};
}

export const cryptoMatchIdentityFactory = createMatchIdentityFactory();
