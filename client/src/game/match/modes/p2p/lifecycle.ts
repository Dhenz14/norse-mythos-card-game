/**
 * P2P match lifecycle handlers.
 *
 * Today: STUB. The ranking surface (ELO ladder, season, leaderboard)
 * does not exist yet — when it lands the on-win path will:
 *   - Submit (winner, loser, matchId, matchSeed) to the ranking
 *     server / on-chain dispatch.
 *   - Update local ELO snapshot + season streak.
 *
 * The xpRunes side of the reward already runs through the same
 * generic handler (Fase 5+ will wire economic rewards uniformly via
 * `MATCH_ECONOMY[mode].xpRunesShare * BASE_XP_PER_MATCH`); peer mode
 * gets the full pool by default.
 */

import { debug } from '../../../config/debugConfig';
import type { MatchEndContext } from '../../onWinDispatch';
import type { MatchContext } from '../../types';

export function onP2PMatchEnd(ctx: MatchContext, end: MatchEndContext): void {
	if (ctx.opponent.kind !== 'peer') return;
	// TODO Fase 5+: dispatch ranking event when ELO server lands.
	debug.chess(
		`[P2P] Match ended (matchId=${ctx.matchId.slice(0, 8)}, iWon=${end.iWon}, turns=${end.turnCount}). Ranking dispatch pending.`,
	);
}
