import registryJson from './campaign-registry.v1.json';
import type {
	CampaignDifficulty,
	CampaignRegistryMission,
	CampaignRegistryProvider,
} from '../protocol-core/types';

export const CAMPAIGN_REGISTRY_VERSION = 1;
export const CAMPAIGN_REGISTRY_HASH = 'b2d5a10ddcc5ab186f5f4956dfd6079e82cec3497674fca92df05a612c586073';

interface RawCampaignRegistryMission extends CampaignRegistryMission {
	missionNumber: number;
	allowedDifficulties: CampaignDifficulty[];
}

interface RawCampaignRegistry {
	version: number;
	missions: RawCampaignRegistryMission[];
}

function isCampaignRegistry(value: unknown): value is RawCampaignRegistry {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	return record.version === CAMPAIGN_REGISTRY_VERSION && Array.isArray(record.missions);
}

const registry = registryJson as unknown;

if (!isCampaignRegistry(registry)) {
	throw new Error('Invalid campaign registry v1');
}

const missionsById = new Map<string, CampaignRegistryMission>();

for (const mission of registry.missions) {
	missionsById.set(mission.id, {
		id: mission.id,
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
	getMission(missionId: string) {
		return missionsById.get(missionId) ?? null;
	},
};
