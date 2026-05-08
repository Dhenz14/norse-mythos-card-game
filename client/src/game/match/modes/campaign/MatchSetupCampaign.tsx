/**
 * <MatchSetupCampaign/> — synchronous wrapper for staged campaign missions.
 *
 * Captures the staged mission once at mount. Campaign completion clears
 * campaignStore.currentMission, but the active MatchContext must remain
 * stable through game-over, retry, and story-bridge rendering.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { useCampaignStore } from '../../../campaign';
import { cryptoMatchIdentityFactory, type MatchIdentityFactory } from '../../identityFactory';
import { useMatchStore } from '../../store';
import type { CampaignResolveArgs } from './resolver';
import { resolveCampaign } from './resolver';

interface MatchSetupCampaignProps {
	readonly children: ReactNode;
	readonly fallback?: ReactNode;
	readonly identityFactory?: MatchIdentityFactory;
}

function getStagedCampaignArgs(identityFactory: MatchIdentityFactory): CampaignResolveArgs | null {
	const campaign = useCampaignStore.getState();
	if (!campaign.currentMission) return null;
	return {
		identity: identityFactory.create(),
		missionId: campaign.currentMission,
		difficulty: campaign.currentDifficulty,
		localRunId: campaign.currentRunId,
	};
}

export function MatchSetupCampaign({
	children,
	fallback = null,
	identityFactory = cryptoMatchIdentityFactory,
}: MatchSetupCampaignProps) {
	const [stagedArgs] = useState(() => getStagedCampaignArgs(identityFactory));
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
