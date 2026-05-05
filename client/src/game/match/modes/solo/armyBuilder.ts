/**
 * Opponent army builder for solo mode (AI opponent).
 *
 * Today: returns the default army selection regardless of difficulty
 * or deckSource. Difficulty / deckSource currently affect AI behavior
 * (move scoring, deck composition), not piece composition.
 *
 * Future: AI difficulty tiers may swap army comp (e.g., mythic gives
 * the AI a stronger piece roster). When that lands, branch on
 * `opponent.difficulty` here — the call site in the coordinator
 * already passes the full AiOpponent.
 */

import { getDefaultArmySelection } from '../../../data/ChessPieceConfig';
import type { ArmySelection } from '../../../types/ChessTypes';
import type { AiOpponent } from '../../types';

export function buildSoloOpponentArmy(_opponent: AiOpponent): ArmySelection {
	return getDefaultArmySelection();
}
