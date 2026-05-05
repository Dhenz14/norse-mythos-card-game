/**
 * Pure projection from legacy store fields to a MatchContext.
 *
 * Lives separately from legacyBridge.ts (which contains the React
 * hook + Zustand store imports) so tests can exercise the projection
 * without pulling in client-only modules. gameStore.ts imports from
 * useGame.tsx which reads localStorage at module init — that crashes
 * Vitest's node environment, so the hook layer must stay out of the
 * test path.
 *
 * Branch order is intentional:
 *   1. P2P (highest priority — peer connection trumps any local mode).
 *   2. Campaign (mission set in campaignStore).
 *   3. Solo (default fallback — practice).
 *
 * Returns null when an active flow exists but is not yet ready
 * (e.g. P2P connected but matchSeed has not arrived from seed_reveal).
 *
 * THIS FILE IS THROWAWAY — Fase 5 replaces the whole legacy bridge
 * with a proper <MatchSetupP2P/> wrapper that calls resolveP2P
 * directly. Solo / Campaign flows shift to the menu.
 */

import type { Difficulty } from '../campaign/campaignTypes';
import { resolveCampaign } from './modes/campaign';
import { resolveP2P } from './modes/p2p';
import { resolveSolo } from './modes/solo';
import type { MatchContext } from './types';

export interface LegacySynthInputs {
	isP2PConnected: boolean;
	matchSeed: string | null;
	matchId: string | null;
	myCanonicalSide: 'player' | 'opponent' | null;
	remotePeerId: string | null;
	campaignMission: string | null;
	campaignDifficulty: Difficulty;
}

export function synthesizeLegacyMatchContext(
	input: LegacySynthInputs,
): MatchContext | null {
	if (input.isP2PConnected) {
		// P2P needs both matchSeed and matchId from gameStore — those
		// arrive via seed_reveal. Until then, no MatchContext yet.
		if (!input.matchSeed || !input.matchId) return null;
		return resolveP2P({
			matchId: input.matchId,
			matchSeed: input.matchSeed,
			remotePeerId: input.remotePeerId ?? '',
			myRole:
				input.myCanonicalSide === 'opponent' ? 'second-mover' : 'first-mover',
			opponentUsername: null,
		});
	}

	if (input.campaignMission) {
		const result = resolveCampaign({
			missionId: input.campaignMission,
			difficulty: input.campaignDifficulty,
		});
		if (!result.ok) return null;
		return result.ctx;
	}

	// Solo (practice). Difficulty/deckSource defaults match the implicit
	// pre-Fase-3 behavior — coordinator and warband flow today do not
	// expose difficulty selection for solo, so 'normal' is the only
	// real value. When Fase 5's menu lands, real user input populates
	// these.
	return resolveSolo({ difficulty: 'normal', deckSource: 'warband' });
}
