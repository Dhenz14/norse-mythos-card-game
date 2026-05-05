/**
 * Public surface of the match module.
 *
 * Anyone outside match/ imports from HERE, not from internal files.
 * Specifically, NO consumer should import from match/modes/<X>/ —
 * those are mode-internal (ESLint enforces this rule, added in Fase 6
 * of the migration).
 */

export type {
	MatchContext,
	MatchIdentity,
	OpponentSpec,
	AiOpponent,
	ScriptedOpponent,
	PeerOpponent,
	ScriptPayload,
	RewardChannel,
} from './types';

export { useMatchStore } from './store';

export { deriveAuthority, deriveOpponentArmyForMode, deriveIntro } from './derived';
export type { Authority, IntroSpec } from './derived';

export { selectOnWinHandler } from './onWinDispatch';
export type { MatchEndContext } from './onWinDispatch';

// ── Economy surface ───────────────────────────────────────────────────────
// Centralized per-mode reward configuration. Designer-tunable from a
// single file; resolvers read MATCH_ECONOMY and translate to the
// MatchContext.reward shape via modeEconomyToReward.

export {
	POOL_REWARDS,
	MATCH_ECONOMY,
	modeEconomyToReward,
	getEconomyFootprint,
} from './economy';
export type { ModeEconomy, ModeKey } from './economy';

// ── Mode resolvers ────────────────────────────────────────────────────────
// Public callers (menu / route handlers / matchmaking flow) construct a
// MatchContext via these resolvers, then push the result into useMatchStore
// before the coordinator mounts. modes/X internal files (lifecycle,
// providers, setup components) remain mode-private and will be ESLint-
// fenced from cross-mode imports in Fase 6.

export { resolveSolo } from './modes/solo';
export type { SoloResolveArgs } from './modes/solo';

export { resolveCampaign } from './modes/campaign';
export type { CampaignResolveArgs, CampaignResolveResult } from './modes/campaign';

export { resolveP2P } from './modes/p2p';
export type { P2PHandshake } from './modes/p2p';

// ── Legacy bridge (Fase 3 — throwaway, replaced in Fase 5) ────────────────
// Synthesizes a MatchContext from existing stores so the coordinator can
// read from useMatchStore in Fase 3 C7 without the broader route refactor.

export { useLegacyMatchContextBridge } from './legacyBridge';
export { synthesizeLegacyMatchContext } from './legacySynth';
export type { LegacySynthInputs } from './legacySynth';
