/**
 * Reward economy — single source of truth for "what each match mode pays".
 *
 * Why this file exists:
 *   Per-mode multipliers were previously hardcoded inside each resolver
 *   (CAMPAIGN_XP_RUNES_MULTIPLIER, P2P_XP_RUNES_MULTIPLIER). That made
 *   designer tuning a multi-file edit and obscured the relationship
 *   between modes ("how much MORE does P2P pay than campaign?").
 *
 *   Centralizing here gives:
 *   - One file to edit when tuning rates (no resolver changes needed).
 *   - Explicit per-mode share CONSTANTS (named, not magic numbers).
 *   - An auditable "footprint" — sum of all shares — that surfaces
 *     economy drift (e.g., a new mode silently pushing the total above
 *     budget).
 *   - A single normalized POOL_REWARDS reference, so all multipliers
 *     are unambiguously fractions OR multiples of the same baseline.
 *
 * Strictness rules (enforced by tests in economy.test.ts):
 *   - POOL_REWARDS > 0 and finite.
 *   - Every entry of MATCH_ECONOMY has a well-formed xpRunesShare
 *     (>= 0, finite). Both reductions (< POOL_REWARDS) and multipliers
 *     (> POOL_REWARDS) are legal — the type does not constrain
 *     direction; per-mode comments document intent.
 *   - Adding a new mode: add a *_SHARE constant + an entry in
 *     MATCH_ECONOMY + a resolver that consumes it via
 *     `modeEconomyToReward(MATCH_ECONOMY.<key>)`. Existing modes do
 *     not change.
 */

import type { RewardChannel } from './types';

// ── Pool reference ────────────────────────────────────────────────────────

/**
 * Normalized reward pool — represents 100% of a "full match"'s
 * economic payout. All per-mode shares below are FRACTIONS or
 * MULTIPLES of this constant. Keeping POOL_REWARDS = 1.0 means
 * the values in MATCH_ECONOMY read directly as "fraction of a full
 * match" (0.1 => 10%, 1.5 => 150%).
 *
 * If the design ever rebases the pool to absolute units (e.g.,
 * 100 XP per pool), only this constant and the formula in
 * xpDispatcher (Fase 4) change — MATCH_ECONOMY shape is invariant.
 */
export const POOL_REWARDS = 1.0;

// ── Per-mode shares (modificables sin tocar resolvers) ────────────────────

/** Practice: no XP, no runas. Pure no-stakes training. */
const PRACTICE_SHARE = 0;

/**
 * Campaign: 10% of the pool — a reduction. Players grind campaign for
 * content/lore but the economic payout is small to incentivize P2P
 * play. A future per-mission override (e.g., chapter finale = 25%)
 * would live as an optional field on CampaignMission and the resolver
 * picks per-mission OR this default; that override does NOT change
 * CAMPAIGN_SHARE itself.
 */
const CAMPAIGN_SHARE = POOL_REWARDS * 0.10;

/**
 * P2P ranked: 100% of the pool — the baseline. Every other mode's
 * share is positioned relative to this value.
 */
const P2P_RANKED_SHARE = POOL_REWARDS * 1.00;

// Future tuning examples — agregar aquí, no en resolvers:
// const DAILY_BONUS_SHARE   = POOL_REWARDS * 0.15;  // limited daily reward
// const WEEKEND_BOOST_SHARE = POOL_REWARDS * 1.50;  // 150% multiplier event

// ── ModeEconomy shape ─────────────────────────────────────────────────────

export interface ModeEconomy {
	/**
	 * Fraction (or multiple) of POOL_REWARDS this mode pays for
	 * xp + runas. Semantics by range:
	 *   0          => no economic reward (practice).
	 *   (0, 1)     => reduction (campaign).
	 *   1          => baseline (P2P ranked).
	 *   > 1        => multiplier (event boosts, future).
	 * Always non-negative and finite — enforced at module load.
	 */
	xpRunesShare: number;
	/** Whether this mode contributes to ELO ranking. */
	ranking: 'none' | 'elo';
}

/**
 * Mode key => economy map. The literal keys here are PRIVATE to the
 * economy module (resolvers reference them, but external callers
 * should not branch on `ModeKey` — they branch on `MatchContext.opponent.kind`
 * instead, per the architecture rules).
 */
export const MATCH_ECONOMY = {
	practice:  { xpRunesShare: PRACTICE_SHARE,    ranking: 'none' },
	campaign:  { xpRunesShare: CAMPAIGN_SHARE,    ranking: 'none' },
	p2pRanked: { xpRunesShare: P2P_RANKED_SHARE,  ranking: 'elo'  },
} as const satisfies Record<string, ModeEconomy>;

export type ModeKey = keyof typeof MATCH_ECONOMY;

// ── Module-load invariant check ───────────────────────────────────────────
// Strictness: numeric shares must be non-negative finite numbers.
// Triggered once at import time — a malformed entry crashes loud at
// boot rather than silently leaking a NaN multiplier into XP dispatch.
for (const [key, econ] of Object.entries(MATCH_ECONOMY)) {
	if (!Number.isFinite(econ.xpRunesShare) || econ.xpRunesShare < 0) {
		throw new Error(
			`[match/economy] MATCH_ECONOMY.${key}.xpRunesShare must be ` +
			`a non-negative finite number, got ${econ.xpRunesShare}.`,
		);
	}
}
if (!Number.isFinite(POOL_REWARDS) || POOL_REWARDS <= 0) {
	throw new Error(
		`[match/economy] POOL_REWARDS must be a positive finite number, ` +
		`got ${POOL_REWARDS}.`,
	);
}

// ── Translator ────────────────────────────────────────────────────────────

/**
 * Translate a ModeEconomy into the RewardChannel shape that
 * MatchContext.reward consumes. A zero share collapses to
 * `{ kind: 'none' }` (more honest than a percentage with multiplier=0
 * and avoids downstream defensive checks for the zero case).
 */
export function modeEconomyToReward(econ: ModeEconomy): RewardChannel {
	return {
		xpRunes:
			econ.xpRunesShare > 0
				? { kind: 'percentage', multiplier: econ.xpRunesShare }
				: { kind: 'none' },
		ranking:
			econ.ranking === 'elo'
				? { kind: 'elo' }
				: { kind: 'none' },
	};
}

// ── Audit helpers ─────────────────────────────────────────────────────────

/**
 * Sum of all per-mode xpRunesShare values. Surfaces economy drift —
 * a jump in this number when a new mode is added flags an unbudgeted
 * payout. NOT a constraint (modes are independent fractions/multiples
 * of the pool, not slices of a fixed pie); intended for audit tooling
 * and the economy.test.ts baseline check.
 */
export function getEconomyFootprint(): number {
	return Object.values(MATCH_ECONOMY).reduce(
		(sum, mode) => sum + mode.xpRunesShare,
		0,
	);
}
