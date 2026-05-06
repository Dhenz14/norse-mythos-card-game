/**
 * <MatchSetupCampaign/> — synchronous wrapper for staged campaign missions.
 *
 * Captures the staged mission once at mount. Campaign completion clears
 * campaignStore.currentMission, but the active MatchContext must remain
 * stable through game-over, retry, and story-bridge rendering.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { useCampaignStore } from '../../../campaign';
import { useMatchStore } from '../../store';
import type { CampaignResolveArgs } from './resolver';
import { resolveCampaign } from './resolver';

interface MatchSetupCampaignProps {
	readonly children: ReactNode;
	readonly fallback?: ReactNode;
}

function getStagedCampaignArgs(): CampaignResolveArgs | null {
	const campaign = useCampaignStore.getState();
	if (!campaign.currentMission) return null;
	return {
		missionId: campaign.currentMission,
		difficulty: campaign.currentDifficulty,
	};
}

export function MatchSetupCampaign({
	children,
	fallback = null,
}: MatchSetupCampaignProps) {
	const [stagedArgs] = useState(getStagedCampaignArgs);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		if (!stagedArgs) return;

		const result = resolveCampaign(stagedArgs);
		if (!result.ok) {
			useCampaignStore.getState().clearCurrent();
			return;
		}

		useMatchStore.getState().setMatch(result.ctx);
		setReady(true);

		return () => {
			useMatchStore.getState().clearMatch();
		};
	}, [stagedArgs]);

	if (!ready) return <>{fallback}</>;

	return <>{children}</>;
}
