import type { CampaignChapter } from '../campaignTypes';
import { AI_PROFILES } from '../campaignTypes';

const e = (n: number) => 2000 + n;

export const egyptianChapter: CampaignChapter = {
	id: 'egyptian',
	name: 'Duat: Shadows of the Pharaohs',
	faction: 'egyptian',
	description: 'Traverse the Egyptian underworld and face the judgment of the gods.',
	chapterReward: [{ type: 'pack', amount: 3 }, { type: 'rune', amount: 200 }],
	missions: Array.from({ length: 10 }, (_, i) => {
		const names = ['Scarab Swarm','The Sphinx\'s Question','Tomb of the Pharaoh','Sobek\'s Jaws','The Weighing of Hearts','Bastet\'s Hunt','Set\'s Storm','Isis\' Enchantment','Anubis, Judge of the Dead','Ra, the Sun God'];
		const descs = ['A carpet of scarabs surges from the sands.','Answer correctly or be devoured.','Ancient traps guard the resting king.','The crocodile god strikes from the Nile.','Ma\'at weighs your heart against a feather.','The cat goddess stalks her prey.','The god of chaos unleashes the desert.','The goddess of magic weaves powerful spells.','The jackal-headed god passes judgment.','The sun itself descends to challenge you.'];
		const classes = ['hunter','mage','rogue','warrior','priest','hunter','warlock','mage','priest','mage'];
		const profiles = [AI_PROFILES.easy,AI_PROFILES.easy,AI_PROFILES.medium,AI_PROFILES.medium,AI_PROFILES.medium,AI_PROFILES.hard,AI_PROFILES.hard,AI_PROFILES.hard,AI_PROFILES.boss,AI_PROFILES.boss];
		const deck = Array.from({ length: 30 }, (_, j) => e(i * 30 + (j % 15)));
		return {
			id: `egyptian-${i + 1}`, chapterId: 'egyptian', missionNumber: i + 1,
			name: names[i], description: descs[i],
			narrativeBefore: `The sands of Egypt whisper ancient secrets. ${descs[i]}`,
			narrativeAfter: `The sands settle. Another step closer to the heart of Duat.`,
			aiHeroId: `egyptian-${classes[i]}-${i + 1}`, aiHeroClass: classes[i],
			aiDeckCardIds: deck, aiProfile: profiles[i],
			bossRules: i >= 8 ? [{ type: 'extra_health' as const, value: 10 + (i - 8) * 10, description: `${names[i]} has extra health` }] : [],
			prerequisiteIds: i === 0 ? [] : [`egyptian-${i}`],
			rewards: [{ type: 'rune' as const, amount: 20 + i * 10 }],
		};
	}),
};
