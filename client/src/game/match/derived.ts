/**
 * Pure derivation helpers. Computed from MatchContext, never branched
 * on by reading stores directly. Every conditional that previously
 * looked like `if (isCampaign)` lives here as a function with one body.
 *
 * These helpers are NEUTRAL with respect to DATA FLOW — they take a
 * MatchContext as input and return a generic shape (Authority, an
 * ArmySelection, an IntroSpec, …). They do not read Zustand stores
 * directly nor branch on global state.
 *
 * They DO import from match/modes/<X>/ — derived.ts is the dispatcher
 * layer that knows about each mode and routes the request. The mode
 * isolation rule (Fase 6 ESLint) prohibits modes/X/ from importing
 * modes/Y/, but match/ root files (types/store/derived) are explicitly
 * allowed to know about each mode for dispatching.
 *
 * Phase ownership:
 *   - Fase 1: deriveAuthority.
 *   - Fase 4 (this file growing): deriveOpponentArmyForMode.
 *   - Fase 4 next steps: deriveIntro, selectOnWinHandler.
 */

import type { ArmySelection } from '../types/ChessTypes';
import { buildCampaignOpponentArmy } from './modes/campaign/armyBuilder';
import { buildSoloOpponentArmy } from './modes/solo/armyBuilder';
import type { MatchContext } from './types';

// ── Authority ─────────────────────────────────────────────────────────────

export type Authority =
	| { kind: 'local' }
	| { kind: 'p2p-symmetric'; myRole: 'first-mover' | 'second-mover' };

/**
 * Authority is who decides truth for this match. Derived from the
 * opponent kind: peer opponent ⇒ symmetric P2P; ai/scripted ⇒ local.
 * There is intentionally no representation for the impossible state
 * `{opponent: peer, authority: local}` — a peer match cannot be
 * locally authoritative.
 */
export function deriveAuthority(ctx: MatchContext): Authority {
	if (ctx.opponent.kind === 'peer') {
		return { kind: 'p2p-symmetric', myRole: ctx.opponent.myRole };
	}
	return { kind: 'local' };
}

// ── Opponent army ─────────────────────────────────────────────────────────

/**
 * Selects the opponent's army from the appropriate mode module.
 * Returns null for peer opponents — those receive their army via the
 * P2P wire (caller passes opponentArmyProp explicitly), so deriving
 * locally would be wrong.
 *
 * Coordinator pattern:
 *   const army = opponentArmyProp ?? deriveOpponentArmyForMode(ctx) ?? defaultArmy
 *
 * The opponentArmyProp wins for the P2P case; the derive path
 * handles ai/scripted; the default fallback covers the first-render
 * window where ctx is still null.
 */
export function deriveOpponentArmyForMode(ctx: MatchContext): ArmySelection | null {
	switch (ctx.opponent.kind) {
		case 'ai':
			return buildSoloOpponentArmy(ctx.opponent);
		case 'scripted':
			return buildCampaignOpponentArmy(ctx.opponent);
		case 'peer':
			return null;
	}
}
