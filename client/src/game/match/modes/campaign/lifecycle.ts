/**
 * Campaign match lifecycle handlers.
 *
 * Owns:
 *   - Mark the mission completed in `useCampaignStore`.
 *   - One-shot reward distribution (eitr from `mission.rewards`,
 *     plus difficulty-locked bonus eitr — heroic 50, mythic 150).
 *   - `claimReward(missionId)` flag flip so subsequent wins are no-ops.
 *
 * Idempotency:
 *   - `claimReward` is gated by `useCampaignStore.rewardsClaimed`,
 *     so replaying a mission already-claimed does not double-pay.
 *   - `completeMission` updates personal-best stats every win and is
 *     intentionally NOT idempotent — replay should refresh bests.
 *
 * Loss:
 *   - No-op. Players keep their existing stats; the round handler
 *     in the coordinator owns "you lost" UI.
 *
 * Quirk: extracted verbatim from the coordinator's pre-Fase-4
 * if-block (RagnarokGameCoordinator.tsx around line 568). The
 * difficulty-locked bonus values (50, 150) are designer constants
 * that today live inline; future tuning would surface them in
 * `match/economy.ts` once the difficulty multiplier wins out
 * over the per-mode share.
 */

import { debug } from '../../../config/debugConfig';
import { useCraftingStore } from '../../../crafting/craftingStore';
import { useCampaignStore } from '../../../campaign';
import type { MatchEndContext } from '../../onWinDispatch';
import type { MatchContext } from '../../types';

const HEROIC_BONUS_EITR = 50;
const MYTHIC_BONUS_EITR = 150;

export function onCampaignMatchEnd(ctx: MatchContext, end: MatchEndContext): void {
	if (ctx.opponent.kind !== 'scripted') return;
	if (ctx.opponent.script.kind !== 'campaign-mission') return;
	if (!end.iWon) return;

	const { mission, difficulty } = ctx.opponent.script;
	const campaign = useCampaignStore.getState();

	campaign.completeMission(mission.id, difficulty, end.turnCount);

	if (campaign.rewardsClaimed.includes(mission.id)) return;

	const crafting = useCraftingStore.getState();
	for (const reward of mission.rewards) {
		if (reward.type === 'eitr' && reward.amount) {
			crafting.addEitr(reward.amount);
		}
	}

	if (difficulty === 'heroic') {
		crafting.addEitr(HEROIC_BONUS_EITR);
	} else if (difficulty === 'mythic') {
		crafting.addEitr(MYTHIC_BONUS_EITR);
	}

	campaign.claimReward(mission.id);
	debug.chess(`[Campaign] Rewards distributed for ${mission.id} (${difficulty})`);
}
