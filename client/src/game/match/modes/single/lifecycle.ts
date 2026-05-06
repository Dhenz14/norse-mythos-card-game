/**
 * Single (practice) match lifecycle handlers.
 *
 * Practice mode pays nothing on win and tracks nothing on loss.
 * The handler exists as a typed no-op so the dispatcher
 * (`selectOnWinHandler`) returns a uniform shape across all modes.
 */

import type { MatchEndContext } from '../../onWinDispatch';
import type { MatchContext } from '../../types';

export function onSingleMatchEnd(_ctx: MatchContext, _end: MatchEndContext): void {
	// No reward. No ranking. Practice is free of stakes.
}
