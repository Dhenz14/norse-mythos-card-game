export interface AIBehaviorProfile {
	aggression: number;
	efficiency: number;
	bluffFrequency: number;
	tightness: number;
	usesHeroPower: boolean;
	prioritizeFace: boolean;
	tradeEfficiency?: number;
	heroPowerPriority?: number;
}

export interface CinematicScene {
	narration: string;
	visualCue?: string;
	musicCue?: string;
	durationHint?: number;
}

export interface CinematicIntro {
	title: string;
	style?: string;
	scenes: CinematicScene[];
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

export interface CampaignArmy {
	king?: string;
	queen?: string;
	rook?: string;
	bishop?: string;
	knight?: string;
}

export interface CampaignMission {
	id: string;
	chapterId: string;
	missionNumber: number;
	name: string;
	description: string;
	narrativeBefore: string;
	narrativeAfter: string;
	narrativeVictory?: string;
	narrativeDefeat?: string;
	aiHeroId: string;
	aiHeroClass: string;
	aiDeckCardIds: number[];
	aiProfile: AIBehaviorProfile;
	bossRules: BossRule[];
	prerequisiteIds: string[];
	rewards: CampaignReward[];
	realm?: string;
	campaignArmy?: CampaignArmy;
}

export interface CampaignChapter {
	id: string;
	name: string;
	faction: 'norse' | 'greek' | 'egyptian' | 'celtic' | 'eastern';
	description: string;
	cinematicIntro?: CinematicIntro;
	missions: CampaignMission[];
	chapterReward: CampaignReward[];
}

export type Difficulty = 'normal' | 'heroic' | 'mythic';

export const AI_PROFILES: Record<string, AIBehaviorProfile> = {
	easy: { aggression: 0.3, efficiency: 0.4, bluffFrequency: 0.1, tightness: 0.3, usesHeroPower: false, prioritizeFace: false },
	medium: { aggression: 0.5, efficiency: 0.6, bluffFrequency: 0.3, tightness: 0.5, usesHeroPower: true, prioritizeFace: false },
	hard: { aggression: 0.7, efficiency: 0.8, bluffFrequency: 0.5, tightness: 0.7, usesHeroPower: true, prioritizeFace: true },
	boss: { aggression: 0.9, efficiency: 0.9, bluffFrequency: 0.6, tightness: 0.8, usesHeroPower: true, prioritizeFace: true },

	// Norse primordial profiles
	ymir: { aggression: 0.9, efficiency: 0.4, bluffFrequency: 0.1, tightness: 0.2, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.3 },
	bergelmir: { aggression: 0.8, efficiency: 0.7, bluffFrequency: 0.2, tightness: 0.6, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.6 },
	vanirWarlord: { aggression: 0.6, efficiency: 0.8, bluffFrequency: 0.3, tightness: 0.7, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.8, heroPowerPriority: 0.7 },

	// Norse god-specific profiles
	fenrir: { aggression: 0.4, efficiency: 0.3, bluffFrequency: 0.1, tightness: 0.2, usesHeroPower: false, prioritizeFace: true, tradeEfficiency: 0.3 },
	ratatosk: { aggression: 0.4, efficiency: 0.5, bluffFrequency: 0.7, tightness: 0.3, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.4 },
	brokkr: { aggression: 0.5, efficiency: 0.8, bluffFrequency: 0.2, tightness: 0.7, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.8 },
	hel: { aggression: 0.3, efficiency: 0.7, bluffFrequency: 0.4, tightness: 0.8, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.7, heroPowerPriority: 0.9 },
	jormungandr: { aggression: 0.6, efficiency: 0.7, bluffFrequency: 0.3, tightness: 0.6, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.6 },
	loki: { aggression: 0.5, efficiency: 0.6, bluffFrequency: 0.95, tightness: 0.3, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.5 },
	thor: { aggression: 0.85, efficiency: 0.7, bluffFrequency: 0.2, tightness: 0.7, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.6 },
	odin: { aggression: 0.6, efficiency: 0.95, bluffFrequency: 0.5, tightness: 0.8, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.9, heroPowerPriority: 0.8 },

	// Greek god-specific profiles
	medusa: { aggression: 0.5, efficiency: 0.6, bluffFrequency: 0.3, tightness: 0.6, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.7 },
	hydra: { aggression: 0.6, efficiency: 0.5, bluffFrequency: 0.2, tightness: 0.4, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.5 },
	ares: { aggression: 0.95, efficiency: 0.4, bluffFrequency: 0.1, tightness: 0.2, usesHeroPower: false, prioritizeFace: true, tradeEfficiency: 0.3 },
	poseidon: { aggression: 0.7, efficiency: 0.7, bluffFrequency: 0.4, tightness: 0.6, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.6 },
	hades: { aggression: 0.4, efficiency: 0.8, bluffFrequency: 0.6, tightness: 0.9, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.8, heroPowerPriority: 0.9 },
	athena: { aggression: 0.3, efficiency: 0.95, bluffFrequency: 0.4, tightness: 0.9, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.95, heroPowerPriority: 0.7 },
	kronos: { aggression: 0.8, efficiency: 0.8, bluffFrequency: 0.3, tightness: 0.7, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.7 },
	zeus: { aggression: 0.8, efficiency: 0.85, bluffFrequency: 0.5, tightness: 0.7, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.8, heroPowerPriority: 0.8 },

	// Egyptian god-specific profiles
	maat: { aggression: 0.3, efficiency: 0.7, bluffFrequency: 0.1, tightness: 0.9, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.8 },
	ammit: { aggression: 0.8, efficiency: 0.5, bluffFrequency: 0.2, tightness: 0.4, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.4 },
	set: { aggression: 0.7, efficiency: 0.4, bluffFrequency: 0.7, tightness: 0.3, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.3 },
	ra: { aggression: 0.6, efficiency: 0.8, bluffFrequency: 0.3, tightness: 0.7, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.7, heroPowerPriority: 0.8 },
	isis: { aggression: 0.4, efficiency: 0.9, bluffFrequency: 0.5, tightness: 0.8, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.9, heroPowerPriority: 0.9 },
	anubis: { aggression: 0.5, efficiency: 0.8, bluffFrequency: 0.4, tightness: 0.8, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.8, heroPowerPriority: 0.8 },
	apophis: { aggression: 0.9, efficiency: 0.6, bluffFrequency: 0.6, tightness: 0.3, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.4 },
	osiris: { aggression: 0.5, efficiency: 0.9, bluffFrequency: 0.4, tightness: 0.9, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.9, heroPowerPriority: 0.9 },

	// Celtic god-specific profiles
	morrigan: { aggression: 0.6, efficiency: 0.5, bluffFrequency: 0.7, tightness: 0.4, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.5 },
	cuChulainn: { aggression: 0.9, efficiency: 0.5, bluffFrequency: 0.1, tightness: 0.3, usesHeroPower: false, prioritizeFace: true, tradeEfficiency: 0.4 },
	balor: { aggression: 0.7, efficiency: 0.6, bluffFrequency: 0.3, tightness: 0.5, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.5, heroPowerPriority: 0.9 },
	dagda: { aggression: 0.5, efficiency: 0.7, bluffFrequency: 0.3, tightness: 0.7, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.7, heroPowerPriority: 0.8 },
	cernunnos: { aggression: 0.8, efficiency: 0.7, bluffFrequency: 0.4, tightness: 0.5, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.6 },
	brigid: { aggression: 0.5, efficiency: 0.85, bluffFrequency: 0.3, tightness: 0.8, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.8, heroPowerPriority: 0.8 },
	lugh: { aggression: 0.7, efficiency: 0.9, bluffFrequency: 0.5, tightness: 0.8, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.9, heroPowerPriority: 0.7 },

	// Eastern god-specific profiles
	amaterasu: { aggression: 0.4, efficiency: 0.85, bluffFrequency: 0.2, tightness: 0.8, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.8, heroPowerPriority: 0.8 },
	jadeEmperor: { aggression: 0.3, efficiency: 0.9, bluffFrequency: 0.3, tightness: 0.9, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.9, heroPowerPriority: 0.9 },
	susanoo: { aggression: 0.85, efficiency: 0.6, bluffFrequency: 0.3, tightness: 0.3, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.5 },
	sunWukong: { aggression: 0.7, efficiency: 0.6, bluffFrequency: 0.9, tightness: 0.3, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.5 },
	izanami: { aggression: 0.5, efficiency: 0.7, bluffFrequency: 0.5, tightness: 0.7, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.7, heroPowerPriority: 0.9 },
	ganesha: { aggression: 0.2, efficiency: 0.95, bluffFrequency: 0.2, tightness: 0.95, usesHeroPower: true, prioritizeFace: false, tradeEfficiency: 0.95, heroPowerPriority: 0.9 },
	kali: { aggression: 0.95, efficiency: 0.7, bluffFrequency: 0.4, tightness: 0.3, usesHeroPower: true, prioritizeFace: true, tradeEfficiency: 0.5, heroPowerPriority: 0.7 },
};
