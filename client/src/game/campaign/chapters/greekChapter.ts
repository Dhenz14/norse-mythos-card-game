import type { CampaignChapter } from '../campaignTypes';
import { AI_PROFILES } from '../campaignTypes';

const g = (n: number) => 1000 + n;

export const greekChapter: CampaignChapter = {
	id: 'greek',
	name: 'Olympus: Wrath of the Titans',
	faction: 'greek',
	description: 'Ascend Mount Olympus and challenge the Greek pantheon as the Titans stir in Tartarus.',
	chapterReward: [{ type: 'pack', amount: 3 }, { type: 'rune', amount: 200 }],
	missions: Array.from({ length: 10 }, (_, i) => {
		const names = ['Cerberus Awakens','The Labyrinth','Medusa\'s Gaze','The Hydra','Ares, God of War','Poseidon\'s Wrath','Hades\' Bargain','Athena\'s Trial','The Titan Kronos','Zeus, King of Olympus'];
		const descs = ['Three-headed guardian blocks the gate to the Underworld.','Navigate Daedalus\' deadly maze.','Turn not to stone before the Gorgon Queen.','Cut one head, two grow back.','The bloodthirsty god demands combat.','The seas rage against you.','The lord of the dead offers a terrible deal.','Wisdom is the deadliest weapon.','Father of the gods rises from Tartarus.','The thunderer himself descends from Olympus.'];
		const classes = ['warrior','rogue','mage','hunter','warrior','shaman','warlock','priest','warrior','mage'];
		const profiles = [AI_PROFILES.easy,AI_PROFILES.easy,AI_PROFILES.medium,AI_PROFILES.medium,AI_PROFILES.medium,AI_PROFILES.hard,AI_PROFILES.hard,AI_PROFILES.hard,AI_PROFILES.boss,AI_PROFILES.boss];
		const deck = Array.from({ length: 30 }, (_, j) => g(i * 30 + (j % 15)));
		return {
			id: `greek-${i + 1}`, chapterId: 'greek', missionNumber: i + 1,
			name: names[i], description: descs[i],
			narrativeBefore: `The legends of Greece call you forward. ${descs[i]}`,
			narrativeAfter: `Victory! The path to Olympus grows clearer.`,
			aiHeroId: `greek-${classes[i]}-${i + 1}`, aiHeroClass: classes[i],
			aiDeckCardIds: deck, aiProfile: profiles[i],
			bossRules: i >= 8 ? [{ type: 'extra_health' as const, value: 10 + (i - 8) * 10, description: `${names[i]} has extra health` }] : [],
			prerequisiteIds: i === 0 ? [] : [`greek-${i}`],
			rewards: [{ type: 'rune' as const, amount: 20 + i * 10 }],
		};
	}),
};
