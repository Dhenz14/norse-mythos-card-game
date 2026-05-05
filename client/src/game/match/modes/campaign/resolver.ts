/**
 * Resolves a Campaign match — scripted opponent (mission + boss rules
 * + scripted deck), partial xpRunes (default rate from MATCH_ECONOMY.campaign),
 * no ranking.
 *
 * Returns a Result because the missionId may not exist in the registry
 * (`getMission` returns null for unknown ids). Callers — menu / mission
 * picker / deep-link handlers — MUST handle the failure case rather
 * than getting a thrown error during navigation.
 *
 * Per-mission multiplier override is a future capability: extend
 * CampaignMission with `rewardMultiplier?: number` and pick per-mission
 * OR `MATCH_ECONOMY.campaign.xpRunesShare` here. The override does NOT
 * change MATCH_ECONOMY itself — it lives at the resolver layer.
 */

import { getMission } from '../../../campaign';
import type { Difficulty } from '../../../campaign/campaignTypes';
import { cryptoIdGen } from '../../../utils/seededRng';
import { MATCH_ECONOMY, modeEconomyToReward } from '../../economy';
import type { MatchContext } from '../../types';

export interface CampaignResolveArgs {
	missionId: string;
	difficulty: Difficulty;
}

export type CampaignResolveResult =
	| { ok: true; ctx: MatchContext }
	| { ok: false; reason: 'mission_not_found' };

export function resolveCampaign(args: CampaignResolveArgs): CampaignResolveResult {
	const found = getMission(args.missionId);
	if (!found) return { ok: false, reason: 'mission_not_found' };

	return {
		ok: true,
		ctx: {
			matchId: cryptoIdGen(),
			matchSeed: cryptoIdGen(),
			opponent: {
				kind: 'scripted',
				script: {
					kind: 'campaign-mission',
					mission: found.mission,
					difficulty: args.difficulty,
				},
			},
			reward: modeEconomyToReward(MATCH_ECONOMY.campaign),
		},
	};
}
