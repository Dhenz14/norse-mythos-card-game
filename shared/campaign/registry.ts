import registryJson from './campaign-registry.v1.json';
import type {
	CampaignDifficulty,
	CampaignRegistryMission,
	CampaignRegistryProvider,
} from '../protocol-core/types';
import { CAMPAIGN_ID, CAMPAIGN_REGISTRY_HASH, CAMPAIGN_REGISTRY_VERSION } from './constants';

export { CAMPAIGN_ID, CAMPAIGN_REGISTRY_HASH, CAMPAIGN_REGISTRY_VERSION } from './constants';

interface RawCampaignRegistryMission extends CampaignRegistryMission {
	missionNumber: number;
	allowedDifficulties: CampaignDifficulty[];
}

interface RawCampaignRegistry {
	version: number;
	campaignId: string;
	missions: RawCampaignRegistryMission[];
}

function isCampaignRegistry(value: unknown): value is RawCampaignRegistry {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	return record.version === CAMPAIGN_REGISTRY_VERSION
		&& record.campaignId === CAMPAIGN_ID
		&& Array.isArray(record.missions);
}

const registry = registryJson as unknown;

if (!isCampaignRegistry(registry)) {
	throw new Error('Invalid campaign registry v1');
}

const missionsById = new Map<string, CampaignRegistryMission>();

for (const mission of registry.missions) {
	missionsById.set(mission.id, {
		id: mission.id,
		campaignId: mission.campaignId,
		chapterId: mission.chapterId,
		prerequisiteIds: mission.prerequisiteIds,
		allowedDifficulties: mission.allowedDifficulties,
		starThresholds: mission.starThresholds,
	});
}

export const campaignRegistryProvider: CampaignRegistryProvider = {
	getRegistryHash() {
		return CAMPAIGN_REGISTRY_HASH;
	},
	getCampaignId() {
		return CAMPAIGN_ID;
	},
	getMission(missionId: string) {
		return missionsById.get(missionId) ?? null;
	},
};
