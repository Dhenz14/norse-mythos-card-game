/**
 * MatchContext — single source of truth for "what game is this".
 *
 * Why this file exists:
 *   The coordinator (RagnarokGameCoordinator) historically branched on
 *   `isCampaign` / `isP2PConnected` / truthy-`matchSeed` scattered across
 *   the file. Each new mode forced a new condition; cross-mode bugs
 *   (e.g. campaign reward dispatched from a P2P match) were caught only
 *   by code review.
 *
 *   This module replaces those scattered flags with a single
 *   discriminated value built BEFORE the coordinator mounts. The
 *   coordinator becomes mode-agnostic — it reads ctx + helpers, never
 *   conditionals on store state.
 *
 * Design rules (locked in grilling session 2026-05-04):
 *   1. Two PRIMITIVE axes: opponent (who plays the other side) and
 *      reward (what victory gives). Authority, army provider, intro,
 *      phase composition all DERIVE from these two — see derived.ts.
 *   2. Each public mode (solo / campaign / p2p) is a function-pure
 *      resolver in match/modes/<mode>/resolver.ts. The resolver body
 *      IS the "intentionality" of the mode — read it to know what the
 *      mode means in this game.
 *   3. Mode modules are physically separated and ESLint-enforced.
 *      modes/X cannot import from modes/Y. Only neutral surface
 *      (types.ts, store.ts, derived.ts) is shared.
 *   4. MatchContext is complete-or-nothing: built before coordinator
 *      mount. No nullable fields, no progressive population. Async
 *      flows (P2P handshake) live in a separate <MatchSetup/> wrapper.
 */

import type { CampaignMission, Difficulty } from '../campaign/campaignTypes';

// ── Identity ──────────────────────────────────────────────────────────────

/**
 * Match identity — present on every match regardless of mode. Created
 * by the resolver, consumed by the rest of the system (game logic,
 * shared deck, wire envelopes, transcript). Replaces the three places
 * that today invent their own matchId:
 *   - sharedDeckStore: `match_${Date.now()}`
 *   - useP2PSync: derived from sorted peer IDs
 *   - peerStore: matchmaking-room id
 */
export interface MatchIdentity {
	matchId: string;
	matchSeed: string;
}

// ── Opponent ──────────────────────────────────────────────────────────────

export interface AiOpponent {
	kind: 'ai';
	difficulty: Difficulty;
	deckSource: 'warband' | 'default';
}

export interface ScriptedOpponent {
	kind: 'scripted';
	script: ScriptPayload;
}

/**
 * What the scripted opponent runs. Today only campaign-mission; future
 * tutorial and puzzle slot in here without changing OpponentSpec or
 * any caller that already handles `kind: 'scripted'`.
 */
export type ScriptPayload =
	| { kind: 'campaign-mission'; mission: CampaignMission; difficulty: Difficulty };
	// future: | { kind: 'tutorial'; lessonId: string }
	// future: | { kind: 'puzzle'; puzzleId: string }

export interface PeerOpponent {
	kind: 'peer';
	peerId: string;
	role: 'first-mover' | 'second-mover';
	opponentUsername: string | null;
}

export type OpponentSpec = AiOpponent | ScriptedOpponent | PeerOpponent;

// ── Reward ────────────────────────────────────────────────────────────────

/**
 * Two reward channels (independent):
 *   - xpRunes: economic reward (XP + Runas). Practice = none.
 *   - ranking: competitive reward (ELO). Local modes = none.
 *
 * Today the channels happen to map 1:1 with mode (practice → none/none,
 * campaign → percentage 0.1/none, p2p → percentage 1.0/elo) but they
 * are orthogonal so future modes (co-op campaign in P2P, tournament
 * without XP, daily-challenge without ranking) compose without forcing
 * new enum values.
 */
export interface RewardChannel {
	xpRunes:
		| { kind: 'none' }
		| { kind: 'percentage'; multiplier: number };
	ranking:
		| { kind: 'none' }
		| { kind: 'elo' };
}

// ── MatchContext ──────────────────────────────────────────────────────────

export interface MatchContext extends MatchIdentity {
	opponent: OpponentSpec;
	reward: RewardChannel;
}
