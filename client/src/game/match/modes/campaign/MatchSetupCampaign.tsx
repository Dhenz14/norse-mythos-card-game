/**
 * <MatchSetupCampaign/> — synchronous wrapper for staged campaign missions.
 *
 * Captures the staged mission once at mount. Campaign completion clears
 * campaignStore.currentMission, but the active MatchContext must remain
 * stable through game-over, retry, and story-bridge rendering.
 */

import { useEffect, useState, type ReactNode } from 'react';

import { readStagedCampaignMission, useCampaignStore } from '../../../campaign';
import { cryptoMatchIdentityFactory, type MatchIdentityFactory } from '../../identityFactory';
import { useMatchStore } from '../../store';
import type { CampaignResolveArgs } from './resolver';
import { resolveCampaign } from './resolver';

interface MatchSetupCampaignProps {
	readonly children: ReactNode;
	readonly fallback?: ReactNode;
	readonly identityFactory?: MatchIdentityFactory;
}

type SetupStatus = 'pending' | 'ready' | 'failed';

function getStagedCampaignArgs(identityFactory: MatchIdentityFactory): CampaignResolveArgs | null {
	const campaign = useCampaignStore.getState();
	const staged = campaign.currentMission
		? {
			missionId: campaign.currentMission,
			difficulty: campaign.currentDifficulty,
			localRunId: campaign.currentRunId,
		}
		: readStagedCampaignMission();
	if (!staged) return null;

	return {
		identity: identityFactory.create(),
		missionId: staged.missionId,
		difficulty: staged.difficulty,
		localRunId: staged.localRunId,
	};
}

export function MatchSetupCampaign({
	children,
	fallback = null,
	identityFactory = cryptoMatchIdentityFactory,
}: MatchSetupCampaignProps) {
	const [stagedArgs] = useState(() => getStagedCampaignArgs(identityFactory));
	const [status, setStatus] = useState<SetupStatus>(() => stagedArgs ? 'pending' : 'failed');

	useEffect(() => {
		if (!stagedArgs) return;

		const result = resolveCampaign(stagedArgs);
		if (!result.ok) {
			useCampaignStore.getState().clearCurrent();
			setStatus('failed');
			return;
		}

		useMatchStore.getState().setMatch(result.ctx);
		setStatus('ready');

		return () => {
			useMatchStore.getState().clearMatch();
		};
	}, [stagedArgs]);

	if (status === 'failed') return <>{fallback}</>;
	if (status === 'pending') return null;

	return <>{children}</>;
}
