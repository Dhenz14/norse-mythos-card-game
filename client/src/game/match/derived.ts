/**
 * Pure derivation helpers. Computed from MatchContext, never branched
 * on by reading stores directly. Every conditional that previously
 * looked like `if (isCampaign)` lives here as a function with one body.
 *
 * These helpers are NEUTRAL — they do not import from match/modes/.
 * They compute generic shapes (Authority, IntroSpec, PhaseList) that
 * the coordinator and mode-specific lifecycle handlers consume.
 *
 * Phase ownership:
 *   - Fase 1 (this file's seed): deriveAuthority only. Other helpers
 *     are added in Fase 4 when we wire intro/phases/onWin selection.
 */

import type { MatchContext } from './types';

// ── Authority ─────────────────────────────────────────────────────────────

export type Authority =
	| { kind: 'local' }
	| { kind: 'p2p-symmetric'; role: 'first-mover' | 'second-mover' };

/**
 * Authority is who decides truth for this match. Derived from the
 * opponent kind: peer opponent ⇒ symmetric P2P; ai/scripted ⇒ local.
 * There is intentionally no representation for the impossible state
 * `{opponent: peer, authority: local}` — a peer match cannot be
 * locally authoritative.
 */
export function deriveAuthority(ctx: MatchContext): Authority {
	if (ctx.opponent.kind === 'peer') {
		return { kind: 'p2p-symmetric', role: ctx.opponent.role };
	}
	return { kind: 'local' };
}
