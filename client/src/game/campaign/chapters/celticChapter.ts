import type { CampaignChapter } from '../campaignTypes';
import { AI_PROFILES } from '../campaignTypes';

const c = (n: number) => 3000 + n;

export const celticChapter: CampaignChapter = {
	id: 'celtic',
	name: 'Tir na nOg: The Otherworld',
	faction: 'celtic',
	description: 'Enter the mystical Otherworld of Celtic legend where fae and gods blur the line between dream and reality.',
	chapterReward: [{ type: 'pack', amount: 3 }, { type: 'rune', amount: 200 }],
	missions: Array.from({ length: 10 }, (_, i) => {
		const names = ['Fairy Ring','The Green Knight','Cernunnos\' Hunt','The Morrigan\'s Ravens','Fomorian Raiders','Brigid\'s Forge','Balor of the Evil Eye','Cu Chulainn\'s Fury','The Dagda\'s Cauldron','Lugh of the Long Arm'];
		const descs = ['Step inside the ring and face what lies within.','An unkillable knight challenges you to a deadly game.','The horned god of the wild hunt corners you.','The phantom queen sends her dark flock.','Sea giants crash onto the shores of Ireland.','The goddess of fire and craft tests your mettle.','One glance from his eye can destroy an army.','The greatest warrior of Ulster enters his warp spasm.','The father of the gods wields infinite power.','The master of all arts faces you in final combat.'];
		const classes = ['druid','warrior','hunter','warlock','warrior','paladin','warlock','warrior','priest','paladin'];
		const profiles = [AI_PROFILES.easy,AI_PROFILES.easy,AI_PROFILES.medium,AI_PROFILES.medium,AI_PROFILES.medium,AI_PROFILES.hard,AI_PROFILES.hard,AI_PROFILES.hard,AI_PROFILES.boss,AI_PROFILES.boss];
		const deck = Array.from({ length: 30 }, (_, j) => c(i * 30 + (j % 15)));
		return {
			id: `celtic-${i + 1}`, chapterId: 'celtic', missionNumber: i + 1,
			name: names[i], description: descs[i],
			narrativeBefore: `The mists of the Otherworld part before you. ${descs[i]}`,
			narrativeAfter: `The mist swallows the defeated foe. The path deeper into Tir na nOg beckons.`,
			aiHeroId: `celtic-${classes[i]}-${i + 1}`, aiHeroClass: classes[i],
			aiDeckCardIds: deck, aiProfile: profiles[i],
			bossRules: i >= 8 ? [{ type: 'extra_health' as const, value: 10 + (i - 8) * 10, description: `${names[i]} has extra health` }] : [],
			prerequisiteIds: i === 0 ? [] : [`celtic-${i}`],
			rewards: [{ type: 'rune' as const, amount: 20 + i * 10 }],
		};
	}),
};
