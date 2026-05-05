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

export { deriveAuthority } from './derived';
export type { Authority } from './derived';
