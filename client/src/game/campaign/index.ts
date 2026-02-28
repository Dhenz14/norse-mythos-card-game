export { norseChapter } from './chapters/norseChapter';
export { greekChapter } from './chapters/greekChapter';
export { egyptianChapter } from './chapters/egyptianChapter';
export { celticChapter } from './chapters/celticChapter';
export type { CampaignChapter, CampaignMission, AIBehaviorProfile, BossRule, CampaignReward, Difficulty } from './campaignTypes';
export { AI_PROFILES } from './campaignTypes';
export { useCampaignStore } from './campaignStore';

import { norseChapter } from './chapters/norseChapter';
import { greekChapter } from './chapters/greekChapter';
import { egyptianChapter } from './chapters/egyptianChapter';
import { celticChapter } from './chapters/celticChapter';
import type { CampaignChapter } from './campaignTypes';

export const ALL_CHAPTERS: CampaignChapter[] = [
	norseChapter,
	greekChapter,
	egyptianChapter,
	celticChapter,
];

export function getMission(missionId: string) {
	for (const chapter of ALL_CHAPTERS) {
		const mission = chapter.missions.find(m => m.id === missionId);
		if (mission) return { mission, chapter };
	}
	return null;
}
