import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { celticChapter } from '../client/src/game/campaign/chapters/celticChapter';
import { easternChapter } from '../client/src/game/campaign/chapters/easternChapter';
import { egyptianChapter } from '../client/src/game/campaign/chapters/egyptianChapter';
import { greekChapter } from '../client/src/game/campaign/chapters/greekChapter';
import { norseChapter } from '../client/src/game/campaign/chapters/norseChapter';
import { twilightChapter } from '../client/src/game/campaign/chapters/twilightChapter';
import type {
	AIBehaviorProfile,
	BossPhase,
	BossRule,
	CampaignArmy,
	Difficulty,
} from '../client/src/game/campaign/campaignTypes';
import { CAMPAIGN_ID, CAMPAIGN_REGISTRY_VERSION } from '../shared/campaign/constants';

interface CampaignRegistryMission {
	id: string;
	campaignId: string;
	chapterId: string;
	missionNumber: number;
	prerequisiteIds: string[];
	allowedDifficulties: Difficulty[];
	aiHeroId: string;
	aiHeroClass: string;
	aiDeckCardIds: number[];
	aiProfile: AIBehaviorProfile;
	bossRules: BossRule[];
	bossPhases: BossPhase[];
	campaignArmy: CampaignArmy;
	starThresholds: { threeStar: number; twoStar: number };
}

interface CampaignRegistryChapter {
	id: string;
	faction: string;
	missionIds: string[];
}

interface CampaignRegistry {
	version: typeof CAMPAIGN_REGISTRY_VERSION;
	campaignId: string;
	generatedFrom: 'client-campaign-chapters';
	chapters: CampaignRegistryChapter[];
	missions: CampaignRegistryMission[];
}

const DEFAULT_STAR_THRESHOLDS = { threeStar: 12, twoStar: 20 };
const ALLOWED_DIFFICULTIES: Difficulty[] = ['normal', 'heroic', 'mythic'];
const ALL_CHAPTERS = [
	norseChapter,
	twilightChapter,
	greekChapter,
	egyptianChapter,
	celticChapter,
	easternChapter,
];

function sortKeys(value: unknown): unknown {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value)) return value.map(sortKeys);
	if (typeof value === 'object') {
		const sorted: Record<string, unknown> = {};
		for (const key of Object.keys(value as Record<string, unknown>).sort()) {
			sorted[key] = sortKeys((value as Record<string, unknown>)[key]);
		}
		return sorted;
	}
	return value;
}

const registry: CampaignRegistry = {
	version: CAMPAIGN_REGISTRY_VERSION,
	campaignId: CAMPAIGN_ID,
	generatedFrom: 'client-campaign-chapters',
	chapters: ALL_CHAPTERS.map(chapter => ({
		id: chapter.id,
		faction: chapter.faction,
		missionIds: chapter.missions.map(mission => mission.id),
	})),
	missions: ALL_CHAPTERS.flatMap(chapter =>
		chapter.missions.map(mission => ({
			id: mission.id,
			campaignId: CAMPAIGN_ID,
			chapterId: mission.chapterId,
			missionNumber: mission.missionNumber,
			prerequisiteIds: [...mission.prerequisiteIds],
			allowedDifficulties: ALLOWED_DIFFICULTIES,
			aiHeroId: mission.aiHeroId,
			aiHeroClass: mission.aiHeroClass,
			aiDeckCardIds: [...mission.aiDeckCardIds],
			aiProfile: mission.aiProfile,
			bossRules: mission.bossRules,
			bossPhases: mission.bossPhases ?? [],
			campaignArmy: mission.campaignArmy ?? {},
			starThresholds: mission.starThresholds ?? DEFAULT_STAR_THRESHOLDS,
		})),
	),
};

const sortedRegistry = sortKeys(registry);
const canonicalRegistry = JSON.stringify(sortedRegistry);
const registryHash = crypto.createHash('sha256').update(canonicalRegistry).digest('hex');
const outPath = path.join(process.cwd(), 'shared/campaign/campaign-registry.v1.json');
fs.writeFileSync(outPath, `${JSON.stringify(sortedRegistry, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath}\nCanonical hash ${registryHash}`);
