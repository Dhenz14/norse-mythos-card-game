export interface AIBehaviorProfile {
	aggression: number;
	efficiency: number;
	bluffFrequency: number;
	tightness: number;
	usesHeroPower: boolean;
	prioritizeFace: boolean;
}

export interface BossRule {
	type: 'extra_mana' | 'extra_health' | 'start_with_minion' | 'bonus_draw' | 'passive_damage';
	value?: number;
	cardId?: number;
	description: string;
}

export interface CampaignReward {
	type: 'card' | 'rune' | 'pack' | 'dust';
	cardId?: number;
	amount?: number;
}

export interface CampaignMission {
	id: string;
	chapterId: string;
	missionNumber: number;
	name: string;
	description: string;
	narrativeBefore: string;
	narrativeAfter: string;
	aiHeroId: string;
	aiHeroClass: string;
	aiDeckCardIds: number[];
	aiProfile: AIBehaviorProfile;
	bossRules: BossRule[];
	prerequisiteIds: string[];
	rewards: CampaignReward[];
}

export interface CampaignChapter {
	id: string;
	name: string;
	faction: 'norse' | 'greek' | 'egyptian' | 'celtic';
	description: string;
	missions: CampaignMission[];
	chapterReward: CampaignReward[];
}

export type Difficulty = 'normal' | 'heroic' | 'legendary';

export const AI_PROFILES: Record<string, AIBehaviorProfile> = {
	easy: { aggression: 0.3, efficiency: 0.4, bluffFrequency: 0.1, tightness: 0.3, usesHeroPower: false, prioritizeFace: false },
	medium: { aggression: 0.5, efficiency: 0.6, bluffFrequency: 0.3, tightness: 0.5, usesHeroPower: true, prioritizeFace: false },
	hard: { aggression: 0.7, efficiency: 0.8, bluffFrequency: 0.5, tightness: 0.7, usesHeroPower: true, prioritizeFace: true },
	boss: { aggression: 0.9, efficiency: 0.9, bluffFrequency: 0.6, tightness: 0.8, usesHeroPower: true, prioritizeFace: true },
};
