/**
 * Resolves a Solo match — AI opponent, practice rewards (no XP/runas,
 * no ranking). The local player picks difficulty + deck source before
 * this is called; the resolver itself is pure (input args → MatchContext).
 *
 * matchId / matchSeed: locally minted via `cryptoIdGen`. Local play does
 * not need cross-peer determinism, but matchSeed is still useful for
 * seeded chess piece IDs and deterministic local replay debugging,
 * so it is always present and non-empty.
 */

import type { Difficulty } from '../../../campaign/campaignTypes';
import { cryptoIdGen } from '../../../utils/seededRng';
import { MATCH_ECONOMY, modeEconomyToReward } from '../../economy';
import type { MatchContext } from '../../types';

export interface SoloResolveArgs {
	difficulty: Difficulty;
	deckSource: 'warband' | 'default';
}

export function resolveSolo(args: SoloResolveArgs): MatchContext {
	return {
		matchId: cryptoIdGen(),
		matchSeed: cryptoIdGen(),
		opponent: {
			kind: 'ai',
			difficulty: args.difficulty,
			deckSource: args.deckSource,
		},
		reward: modeEconomyToReward(MATCH_ECONOMY.practice),
	};
}
