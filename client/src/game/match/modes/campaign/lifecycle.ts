/**
 * Campaign match lifecycle handlers.
 *
 * Owns:
 *   - Mark optimistic local completion in `useCampaignStore`.
 *   - Publish the winning campaign run as `rp_campaign_result`.
 *   - Local-mode reward distribution. Hive-mode rewards wait for
 *     campaignProgress from the indexer/verifier.
 *
 * Idempotency:
 *   - Local-mode `claimReward` is gated by `useCampaignStore.rewardsClaimed`,
 *     so replaying a mission already-claimed does not double-pay locally.
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
import { publishCampaignVictoryResult, useCampaignStore } from '../../../campaign';
import { getNFTBridge } from '../../../nft';
import type { MatchEndContext } from '../../onWinDispatch';
import type { MatchContext } from '../../types';

const HEROIC_BONUS_EITR = 50;
const MYTHIC_BONUS_EITR = 150;

function awardLocalCampaignRewards(ctx: MatchContext, end: MatchEndContext): void {
	if (ctx.opponent.kind !== 'scripted') return;
	if (ctx.opponent.script.kind !== 'campaign-mission') return;

	const { mission, difficulty } = ctx.opponent.script;
	const campaign = useCampaignStore.getState();
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
	debug.chess(`[Campaign] Local rewards distributed for ${mission.id} (${difficulty}, turns=${end.turnCount})`);
}

export function onCampaignMatchEnd(ctx: MatchContext, end: MatchEndContext): void {
	if (ctx.opponent.kind !== 'scripted') return;
	if (ctx.opponent.script.kind !== 'campaign-mission') return;
	if (!end.iWon) return;

	const { mission, difficulty } = ctx.opponent.script;
	const campaign = useCampaignStore.getState();

	campaign.completeMission(mission.id, difficulty, end.turnCount);

	void publishCampaignVictoryResult(ctx, end)
		.then(result => {
			if (result.success && result.trxId) getNFTBridge().emitTransactionConfirmed(result.trxId);
			if (!result.success) debug.warn('[Campaign] Result publication failed:', result.error);
		})
		.catch(err => debug.warn('[Campaign] Result publication error:', err));

	if (!getNFTBridge().isHiveMode()) {
		awardLocalCampaignRewards(ctx, end);
	}
}
