import type { CampaignChapter } from '../campaignTypes';
import { AI_PROFILES } from '../campaignTypes';

export const norseChapter: CampaignChapter = {
	id: 'norse',
	name: 'Echoes of Ymir',
	faction: 'norse',
	description: 'Witness the birth of the cosmos — from the yawning void of Ginnungagap to Ymir\'s slaying, the forging of the Nine Realms from his body, and the wars that followed. The Prose Edda unfolds in blood and creation.',
	chapterReward: [{ type: 'pack', amount: 3 }, { type: 'rune', amount: 200 }],
	cinematicIntro: {
		title: 'The Primordial Blood',
		style: 'Diablo-style dark fantasy CGI — sweeping camera, slow-motion violence, heavy orchestral score with Norse throat-singing, war horns, and deep bass drums. 3:30 runtime. Gravelly, ancient narrator.',
		scenes: [
			{
				narration: 'In the beginning... there was only the Ginnungagap. The yawning void. From the north came the venomous ice of Niflheim. From the south, the ravenous fire of Muspelheim. Where they met... life awoke in agony.',
				visualCue: 'Infinite darkness. Crashing walls of ice and flame collide in slow motion. Poisonous mist boils. Camera pushes through the chaos.',
				musicCue: 'Low, ominous strings. Distant howling wind.',
				durationHint: 15,
			},
			{
				narration: 'First came Ymir — the frost giant, father of all jotnar. Evil and vast, he spawned his kind from sweat and filth. His hunger knew no end.',
				visualCue: 'Massive, grotesque Ymir rising, eyes glowing blue-white. Frost giants claw out of his armpits and legs, roaring. He drinks from the void.',
				musicCue: 'Deep bass drums, building dread.',
				durationHint: 12,
			},
			{
				narration: 'But the gods sent forth Audumbla — the great cow of creation. Her milk fed the giant... while her tongue carved order from the ice.',
				visualCue: 'Majestic black cow appears in golden light. She licks massive salt-ice blocks. Over three days: hair, head, then full figure of Buri emerges — tall, fair, bearded, eyes like storm clouds. He stands powerful, unafraid.',
				musicCue: 'Golden horns, a moment of hope.',
				durationHint: 14,
			},
			{
				narration: 'Buri, the first of the Aesir. Mighty progenitor. He sired Borr — bridge between old blood and new.',
				visualCue: 'Quick montage: Buri alone in the ice. Flash of divine light. Borr appears — rugged, determined. He takes giantess Bestla as wife. Their three sons born in firelight: young Odin (one eye already sharp), Vili, Ve. They watch the giants multiply with growing dread.',
				musicCue: 'Strings build tension.',
				durationHint: 12,
			},
			{
				narration: 'The giants grew bold. Their chaos swallowed the void. Ymir\'s horde threatened to drown all that could be. So the old gods chose war.',
				visualCue: 'Camera sweeps across frozen battlefield. Buri and Borr, armored in crude bone and ice, stand with their grown sons. Buri raises a massive spear. Borr grips a jagged axe.',
				musicCue: 'War drums swell. Norse throat-singing begins.',
				durationHint: 10,
			},
			{
				narration: 'Buri and Borr led the charge — grandfather and father — so their sons might inherit a world.',
				visualCue: 'Epic battle sequence — brutal slow-mo: Buri charges through frost giants, spear flashing, slaying dozens. Ymir roars, swings a club the size of a mountain. Buri leaps, stabs Ymir\'s thigh — blood sprays like a geyser. Ymir backhands him. Buri crashes, broken but defiant. Borr roars, protects his sons, hacks at Ymir\'s leg. Ymir impales him through the chest with a frost shard. Borr gasps, still swinging as he dies.',
				musicCue: 'Full orchestra, crescendo of brass and drums.',
				durationHint: 45,
			},
			{
				narration: 'Buri fell first — the elder\'s sacrifice. Borr followed, shielding his bloodline with his final breath.',
				visualCue: 'Camera lingers on their bodies amid the chaos — heroic, bloodied, eyes open to the void.',
				musicCue: 'Strings soften, grieving tone.',
				durationHint: 8,
			},
			{
				narration: 'Then the sons of Borr answered.',
				visualCue: 'Odin, Vili, and Ve leap as one. Odin drives Gungnir straight into Ymir\'s throat. The giant screams — the sound shakes the heavens.',
				musicCue: 'Rising fury, drums and brass.',
				durationHint: 6,
			},
			{
				narration: 'Ymir fell. And with him... everything.',
				visualCue: 'Slow-motion cataclysm: Ymir collapses. An ocean of blood explodes outward — red tsunami. Giants drown screaming, dragged under. Audumbla stands on a shrinking ice floe, lowing mournfully one last time as she tries to lick a final block of creation. The crimson wave engulfs her. Her eyes close. She sinks.',
				musicCue: 'Choir and deep bass, apocalyptic.',
				durationHint: 18,
			},
			{
				narration: 'Even the primordial cow — mother of beginnings — perished in the flood of endings.',
				visualCue: 'The blood recedes. Ymir\'s colossal corpse lies across the void.',
				musicCue: 'Solemn silence, then soft strings.',
				durationHint: 6,
			},
			{
				narration: 'From the enemy\'s body the brothers forged the Nine Realms. Flesh became earth. Blood became sea. Bones became mountains. Skull became sky. Brains became clouds. And from the spark of their fathers\' sacrifice... Midgard and Asgard rose.',
				visualCue: 'Montage of creation: Land rising, trees sprouting, sun and moon placed in the sky. Odin stands alone on a new mountain peak, wind whipping his cloak, two ravens circling. He looks back at the battlefield where Buri and Borr\'s bodies have become part of the new world — subtle silhouettes in the stone.',
				musicCue: 'Majestic horn theme, hopeful but bittersweet.',
				durationHint: 20,
			},
			{
				narration: 'Thus the gods were born in blood and loss. The first gods gave their lives... so that we might have ours. But the giants remember the slaughter. Bergelmir survived.',
				visualCue: 'Final shot: a lone frost giant drifting on a blood-soaked log, eyes burning with hatred, fading into darkness.',
				musicCue: 'Single low note, ominous. Fade to black.',
				durationHint: 12,
			},
		],
	},
	missions: [

		// ─── Chapter 1: Void's Awakening ─────────────────────────────────
		// Ginnungagap → Niflheim Ice Wastes
		// Lore: Niflheim ice + Muspelheim fire → Ymir emerges, spawns jotnar
		// Audumbla licks Buri free; Buri sires Borr; Borr's sons mature
		{
			id: 'norse-1', chapterId: 'norse', missionNumber: 1,
			name: 'Void\'s Awakening',
			description: 'Survive the primordial chaos where ice and fire first collided.',
			narrativeBefore: 'Before the worlds, before time, there was only Ginnungagap — the yawning void. From the north poured the venomous rivers of Niflheim, eleven freezing streams called Elivagar. From the south roared the sparks and embers of Muspelheim. Where ice met flame, the rime thawed and dripped with life. Ymir, first of the frost giants, rose from the poisoned meltwater. His children clawed from his body — born of sweat and filth. Among the chaos, a primordial cow named Audumbla emerged, her milk sustaining the giant. But as she licked the salt-ice, she carved free something the giants never expected: Buri, grandfather of the gods. You are the echo of that first defiance — life refusing to bow to the void.',
			narrativeAfter: 'The ice caves grow quiet. The first jotnar have fallen, but Ymir himself stirs in the distance, vast and terrible. Buri\'s bloodline flows in your veins — the defiance that carved order from chaos. Audumbla lows in the distance, still licking ice, still creating. The war for existence has only begun.',
			narrativeVictory: 'The void\'s children cannot extinguish what Audumbla freed from the ice. You carry Buri\'s spark.',
			narrativeDefeat: 'The primordial cold reclaims you. Without Buri\'s heirs, the void would have swallowed all.',
			aiHeroId: 'norse-warrior-1', aiHeroClass: 'warrior',
			aiDeckCardIds: [20001,20001,20002,20002,20003,20003,20004,20004,20005,20005,20010,20010,20011,20011,20012,20012,20013,20013,20014,20014,20015,20015,20020,20020,20021,20021,20022,20022,20023,20023],
			aiProfile: AI_PROFILES.easy, bossRules: [], prerequisiteIds: [],
			rewards: [{ type: 'rune', amount: 20 }],
			realm: 'ginnungagap',
		},
		{
			id: 'norse-2', chapterId: 'norse', missionNumber: 2,
			name: 'The Blood of Ymir',
			description: 'The sons of Borr challenge Ymir himself — father of all giants.',
			narrativeBefore: 'Buri, the first god, fell to Ymir\'s fury — pierced by frost-shards in the primordial war. Borr, his son, died shielding his three boys with his final breath. Now Odin, Vili, and Ve — the sons of Borr — stand alone against the cosmic giant whose children outnumber the stars. Ymir\'s chaos cannot be allowed to continue. The void must be given shape, and shape demands sacrifice. You fight alongside the brothers in the battle that creates the world. There is no retreat — behind you is only the void.',
			narrativeAfter: 'Ymir falls. The ground shakes as the colossus crashes into the void. An ocean of blood erupts from the wound — a crimson flood that drowns nearly every giant in existence. Audumbla, the primordial cow who birthed creation with her tongue, stands on a shrinking ice floe. She lows once — mournful, accepting — and the red tide swallows her. Even mothers of beginnings are not spared the flood of endings. But one giant survives: Bergelmir, clutching a blood-soaked log, drifting into darkness. His eyes burn with a hatred that will outlast the cosmos.',
			narrativeVictory: 'Ymir is slain. The flood of his blood drowns the old world. From this death, everything will be born.',
			narrativeDefeat: 'Ymir\'s fist closes. The void remains formless. Creation itself dies stillborn.',
			aiHeroId: 'norse-warrior-2', aiHeroClass: 'warrior',
			aiDeckCardIds: [20001,20001,20003,20003,20004,20004,20100,20100,20104,20104,20107,20107,20110,20110,20111,20111,20114,20114,20115,20115,20116,20116,20201,20201,20204,20204,20210,20210,20305,20305],
			aiProfile: AI_PROFILES.ymir,
			bossRules: [
				{ type: 'extra_health', value: 30, description: 'Ymir has 130 health — primordial giant' },
				{ type: 'start_with_minion', cardId: 20003, description: 'Ymir spawns frost-giant offspring at start' },
			],
			prerequisiteIds: ['norse-1'],
			rewards: [{ type: 'rune', amount: 40 }, { type: 'card', cardId: 20200 }],
			realm: 'ginnungagap',
		},

		// ─── Chapter 2: Forging the Worlds ───────────────────────────────
		// Ymir's body → world creation
		// Flesh=earth, blood=seas, bones=mountains, skull=sky
		// Yggdrasil sprouts from hair-trees; Bergelmir vows vengeance
		{
			id: 'norse-3', chapterId: 'norse', missionNumber: 3,
			name: 'Forging the Worlds',
			description: 'Shape the Nine Realms from Ymir\'s corpse as Bergelmir\'s remnants attack.',
			narrativeBefore: 'Ymir\'s body spans the void like a fallen continent. Odin, Vili, and Ve set to work with divine purpose: his flesh becomes the earth of Midgard, his blood fills the seas and rivers, his bones rise as mountains, his skull is lifted to form the sky — held by four dwarves at its corners — and his brains scatter as clouds. From the sparks of Muspelheim they set the sun and moon in their courses, chased forever by the wolves Skoll and Hati. From Ymir\'s hair spring the first forests, and from those primordial trees, Yggdrasil — the World Tree — takes root, its branches reaching through all realms, its roots drinking from three sacred wells. But the blood-flood did not kill every giant. Bergelmir survived on his hollowed log, and his descendants gather among the new mountains, swearing vengeance for the father of their race.',
			narrativeAfter: 'Bergelmir retreats into the new-formed mountains of Jotunheim, dragging his wounded kin with him. The world takes shape around you — mountains rising, rivers carving paths, the great tree Yggdrasil groaning as it stretches through the fresh-born realms. But Bergelmir\'s oath echoes across the stone: the giants will never forget what the gods did to Ymir. The feud is eternal.',
			narrativeVictory: 'The remnant giants scatter. The Nine Realms take form from Ymir\'s sacrifice — bone, blood, and sky.',
			narrativeDefeat: 'Bergelmir\'s kin reclaim the corpse. The worlds remain unformed — raw meat and blood in the void.',
			aiHeroId: 'norse-shaman-1', aiHeroClass: 'shaman',
			aiDeckCardIds: [20004,20004,20020,20020,20100,20100,20103,20103,20106,20106,20107,20107,20109,20109,20112,20112,20113,20113,20200,20200,20206,20206,20208,20208,20211,20211,20301,20301,20304,20304],
			aiProfile: AI_PROFILES.bergelmir,
			bossRules: [
				{ type: 'extra_health', value: 15, description: 'Bergelmir has 115 health — survivor of the blood-flood' },
			],
			prerequisiteIds: ['norse-2'],
			rewards: [{ type: 'rune', amount: 35 }, { type: 'eitr', amount: 50 }],
			realm: 'midgard',
		},

		// ─── Chapter 3: Breath of Life ───────────────────────────────────
		// Ask & Embla — first humans from driftwood
		// Odin=breath/spirit, Vili=intellect, Ve=senses
		// Player as descendant of Ask/Embla awakens
		{
			id: 'norse-4', chapterId: 'norse', missionNumber: 4,
			name: 'Breath of Life',
			description: 'Protect the first humans as giant raiders descend on newborn Midgard.',
			narrativeBefore: 'Walking the shore of the new-formed world, the three brothers find two trees washed upon the sand — an ash and an elm. Odin breathes life and spirit into them. Vili grants intellect and feeling. Ve gives them senses, speech, and fair appearance. The ash becomes Ask — the first man. The elm becomes Embla — the first woman. From their union, all humanity descends. But Midgard is young and undefended. Bergelmir\'s scouts have crossed the mountain borders of Jotunheim, probing the soft earth with frost-hardened boots. They come not for conquest — not yet — but to test whether these fragile new creatures are worth destroying. You are the blood of Ask and Embla. Defend what the gods gave breath.',
			narrativeAfter: 'The giant scouts withdraw, but their report will reach Bergelmir: humanity is small, fragile, and defended only by divine echoes. The brothers have given you life, but survival is your own burden. Midgard\'s first villages rise along the shore where Ask and Embla drew their first breaths.',
			narrativeVictory: 'The children of Ask and Embla endure. Humanity\'s first breath will not be its last.',
			narrativeDefeat: 'The giants trample the shore where Ask and Embla stood. The first humans are dust before their story begins.',
			aiHeroId: 'norse-hunter-1', aiHeroClass: 'hunter',
			aiDeckCardIds: [20004,20004,20020,20020,20100,20100,20103,20103,20108,20108,20109,20109,20111,20111,20112,20112,20116,20116,20202,20202,20205,20205,20208,20208,20214,20214,20215,20215,20301,20301],
			aiProfile: AI_PROFILES.medium,
			bossRules: [],
			prerequisiteIds: ['norse-3'],
			rewards: [{ type: 'rune', amount: 30 }],
			realm: 'midgard',
		},

		// ─── Chapter 4: Halls of the Aesir ───────────────────────────────
		// Gods build Asgard — Gladsheim, Valaskjalf, Hlidskjalf
		// Ongoing giant probes repelled; rune trials
		{
			id: 'norse-5', chapterId: 'norse', missionNumber: 5,
			name: 'Halls of the Aesir',
			description: 'Aid the gods in building Asgard while repelling the jotnar vanguard.',
			narrativeBefore: 'High above Midgard, upon Ymir\'s skull-sky, the Aesir raise Asgard — the fortress of the gods. Odin builds Valaskjalf with its silver roof and sets Hlidskjalf, the high seat from which he sees all things. Gladsheim rises, hall of the gods, with thirteen thrones. The Bifrost bridge — woven from fire, water, and air — connects the divine realm to Midgard below. But construction draws attention. The jotnar see towers rising from the bones of their ancestor and rage boils in their frost-thick blood. A giant war-lord leads a vanguard against the unfinished walls, testing divine defenses before the mortar of creation has set.',
			narrativeAfter: 'The walls of Asgard hold. The Bifrost blazes with all colors of creation, sealing the road between gods and mortals. Odin sits upon Hlidskjalf for the first time and looks across all Nine Realms. He sees everything — the giant remnants festering in Jotunheim, the dark elves stirring in the roots, the fire of Muspelheim growing restless. He sees you, too. And he remembers.',
			narrativeVictory: 'Asgard stands. The gods have their fortress, built on the bones of the enemy their fathers died to slay.',
			narrativeDefeat: 'The walls crumble. Asgard falls before it is finished — and the gods are left without sanctuary.',
			aiHeroId: 'norse-warrior-3', aiHeroClass: 'warrior',
			aiDeckCardIds: [20001,20001,20003,20003,20005,20005,20020,20020,20100,20100,20104,20104,20105,20105,20111,20111,20113,20113,20114,20114,20201,20201,20210,20210,20302,20302,20305,20305,20306,20306],
			aiProfile: AI_PROFILES.hard,
			bossRules: [
				{ type: 'extra_mana', value: 1, description: 'Giant war-lord starts with +1 mana crystal' },
			],
			prerequisiteIds: ['norse-4'],
			rewards: [{ type: 'rune', amount: 40 }],
			realm: 'asgard',
		},

		// ─── Chapter 5: Light and Seed ───────────────────────────────────
		// Alfheim — Light-elves; Freyr's realm-gift
		// Yggdrasil's light-bathed branches
		{
			id: 'norse-6', chapterId: 'norse', missionNumber: 6,
			name: 'Light and Seed',
			description: 'Journey through Alfheim where light-elves guard ancient power — and dark elves conspire.',
			narrativeBefore: 'Among the high branches of Yggdrasil, Alfheim bathes in perpetual golden light. Here dwell the ljosalfar — the light-elves — beings more beautiful than the sun, whose magic flows as naturally as breath. When the Vanir god Freyr received Alfheim as a tooth-gift in his youth, he planted the seeds of eternal summer. But where light shines, shadow gathers. The dokkalfar — dark elves — lurk in the roots below, envious of their radiant cousins, whispering promises of power to anyone who will listen. The light-elves sense corruption spreading through the branches. They have called for aid from the mortal world — for mortal eyes can sometimes see what immortal ones cannot.',
			narrativeAfter: 'The dark-elf incursion is broken, but their whispers linger in the roots of Yggdrasil. The light-elves gift you a shard of crystallized sunlight — Freyr\'s blessing, they say. "Carry it into the darker realms," their queen murmurs. "You will need it." The branches of the World Tree glow brighter for your passing, but somewhere below, the roots grow darker.',
			narrativeVictory: 'Alfheim\'s light endures. The dark elves slink back to the roots, but their ambition festers still.',
			narrativeDefeat: 'Shadow drowns the light-elves\' realm. Freyr\'s gift withers, and Alfheim dims for the first time since its creation.',
			aiHeroId: 'norse-mage-1', aiHeroClass: 'mage',
			aiDeckCardIds: [20004,20004,20016,20016,20021,20021,20100,20100,20101,20101,20103,20103,20106,20106,20109,20109,20112,20112,20113,20113,20204,20204,20205,20205,20208,20208,20211,20211,20303,20303],
			aiProfile: AI_PROFILES.hard,
			bossRules: [
				{ type: 'bonus_draw', value: 1, description: 'Dark-elf lord draws an extra card each turn' },
			],
			prerequisiteIds: ['norse-5'],
			rewards: [{ type: 'rune', amount: 45 }, { type: 'eitr', amount: 50 }],
			realm: 'alfheim',
		},

		// ─── Chapter 6: War of Kin ───────────────────────────────────────
		// Aesir-Vanir War: Gullveig burned thrice
		// Stalemate → hostage exchange (Njordr/Freyr ↔ Hoenir/Mimir)
		{
			id: 'norse-7', chapterId: 'norse', missionNumber: 7,
			name: 'War of Kin',
			description: 'The first divine war erupts — Aesir against Vanir — as the seer Gullveig burns.',
			narrativeBefore: 'Peace among the gods was always fragile. When the seer Gullveig came to Asgard speaking of gold and greed, the Aesir burned her — once, twice, three times. Each time she rose reborn, brighter and more terrible. The Vanir, gods of nature and fertility who dwell in Vanaheim, saw the burning of their kinswoman as an act of war. Njordr, god of the sea, led the Vanir host against Asgard\'s walls. Freyr and Freyja fought with the fury of the wild earth itself. Odin hurled Gungnir over the Vanir army — the first spear-cast of the first war. Neither side could claim victory. The fighting raged until both pantheons stood exhausted, their divinity diminished. You must survive the war of the gods and help broker the peace that follows — for without unity, the giants win.',
			narrativeAfter: 'Exhaustion ends what pride could not. The Aesir and Vanir exchange hostages: Njordr and Freyr join the Aesir in Asgard; Hoenir and Mimir go to the Vanir. When the Vanir discover Hoenir is useless without Mimir\'s counsel, they behead Mimir and send the head to Odin. Odin preserves the head with herbs and runes, and it whispers secrets to him forevermore. Peace holds — but the scars of the first divine war run deeper than bone. Gullveig, reborn as Heidr the seeress, vanishes into the world, her prophecies echoing through time.',
			narrativeVictory: 'The divine war ends in bitter peace. Aesir and Vanir unite — scarred, diminished, but whole enough to face what comes.',
			narrativeDefeat: 'The war of the gods tears the cosmos apart. Without unity, Bergelmir\'s giants inherit the ruins.',
			aiHeroId: 'norse-druid-1', aiHeroClass: 'druid',
			aiDeckCardIds: [20001,20001,20003,20003,20004,20004,20020,20020,20100,20100,20105,20105,20106,20106,20107,20107,20110,20110,20113,20113,20115,20115,20203,20203,20204,20204,20207,20207,20216,20216],
			aiProfile: AI_PROFILES.vanirWarlord,
			bossRules: [
				{ type: 'extra_health', value: 10, description: 'Vanir war-leader has 110 health' },
				{ type: 'extra_mana', value: 1, description: 'Vanir war-leader starts with +1 mana crystal' },
			],
			prerequisiteIds: ['norse-6'],
			rewards: [{ type: 'rune', amount: 55 }, { type: 'card', cardId: 20210 }],
			realm: 'vanaheim',
		},

		// ─── Chapter 7: Flames of Jotunheim ─────────────────────────────
		// Bergelmir's giants raid; ongoing Aesir-jotnar wars
		// Echoes Ymir feud; player aids gods vs. remnants
		{
			id: 'norse-8', chapterId: 'norse', missionNumber: 8,
			name: 'Flames of Jotunheim',
			description: 'Bergelmir, last survivor of the blood-flood, leads his descendants in a war of vengeance.',
			narrativeBefore: 'Generations have passed since the blood-flood, but Bergelmir has not forgotten. The sole survivor of Ymir\'s slaying, he drifted on a hollowed log through an ocean of his ancestor\'s blood, clutching his wife, watching his entire race drown. He rebuilt the jotnar in Jotunheim — each generation raised on stories of divine betrayal. Now his host is vast, frost-hardened, and seething with ancestral rage. Bergelmir himself has grown ancient and terrible, his body scarred by the blood-flood, one eye frozen shut by the salt of Ymir\'s veins. He does not want territory. He does not want tribute. He wants the gods to feel what he felt — watching everything he loved drown in blood. "Your grandfathers murdered my grandfather," he thunders across the mountain pass. "Today, the debt is paid."',
			narrativeAfter: 'Bergelmir falls at last — the oldest grudge in the cosmos extinguished. His descendants scatter into the frozen wastes, leaderless but not broken. The feud between gods and giants will outlast them all, echoing through every age until Ragnarok settles it forever. But today, the architect of vengeance is gone, and the worlds breathe easier.',
			narrativeVictory: 'The flood-survivor falls. Ymir\'s blood-debt is paid — but the giants\' hatred will outlast even this.',
			narrativeDefeat: 'Bergelmir\'s vengeance is complete. The blood-flood\'s lone survivor destroys what the blood-flood could not.',
			aiHeroId: 'norse-warrior-2', aiHeroClass: 'warrior',
			aiDeckCardIds: [20001,20001,20002,20002,20003,20003,20005,20005,20020,20020,20104,20104,20105,20105,20107,20107,20114,20114,20115,20115,20201,20201,20203,20203,20207,20207,20209,20209,20305,20305],
			aiProfile: AI_PROFILES.bergelmir,
			bossRules: [
				{ type: 'extra_health', value: 20, description: 'Bergelmir has 120 health — ancient and terrible' },
				{ type: 'extra_mana', value: 2, description: 'Bergelmir starts with +2 mana crystals' },
				{ type: 'passive_damage', value: 1, description: 'Bergelmir\'s hatred deals 1 damage to your hero each turn' },
			],
			prerequisiteIds: ['norse-7'],
			rewards: [{ type: 'rune', amount: 65 }, { type: 'eitr', amount: 100 }],
			realm: 'jotunheim',
		},

		// ─── Finale: Twilight Omen ───────────────────────────────────────
		// Ragnarok foreshadow: Fimbulvetr, Nidhogg gnaws roots
		// Multi-realm defense; Loki/Fenrir tease
		{
			id: 'norse-9', chapterId: 'norse', missionNumber: 9,
			name: 'Twilight Omen',
			description: 'Ragnarok stirs — Fimbulvetr descends, Nidhogg gnaws the roots, and the wolf strains his chain.',
			narrativeBefore: 'The peace won by blood and sacrifice begins to crack. Three winters come without a summer between — Fimbulvetr, the Great Winter, the first sign of Ragnarok. Deep beneath Yggdrasil, the dragon Nidhogg gnaws the roots with renewed fury, and the tree groans in agony. In a cave bound by divine chains, Fenrir the wolf — Loki\'s monstrous son — grows larger with each passing moon, the enchanted ribbon Gleipnir stretching thin. Loki himself sits chained beneath the earth, serpent venom dripping onto his face, his wife Sigyn catching what she can in a bowl. When she turns to empty it, his screams cause earthquakes. The signs are unmistakable: Ragnarok approaches. Odin summons you to Yggdrasil\'s heart — the nexus of all realms — for a final reckoning. "I have foreseen the twilight of the gods," he says from Hlidskjalf, his single eye burning. "But you... you were never in my visions. Perhaps that is why you are here."',
			narrativeAfter: 'The roots hold — for now. Nidhogg retreats deeper, Fenrir\'s chains endure one more day, and the Fimbulvetr eases, though it does not end. Odin watches from Hlidskjalf as you descend from the World Tree. "Ragnarok will come," he says, without sadness — only certainty. "The sun will be swallowed. The wolf will break free. I will fall to Fenrir\'s jaws, and Thor will die slaying the Serpent. But after the twilight, the world will rise again — green and new, from the sea. My sons Vidar and Vali will survive. Baldur will return from Hel. And the children of Ask and Embla will walk the earth once more." He pauses. "Perhaps, this time, they will remember what it cost." The Echoes of Ymir fall silent. The story of creation is told. What comes next... is Ragnarok itself.',
			narrativeVictory: 'The twilight is delayed — not prevented. But every moment bought is a world preserved.',
			narrativeDefeat: 'The roots of Yggdrasil snap. Ragnarok arrives ahead of prophecy, and the cosmos has no time to prepare.',
			aiHeroId: 'norse-priest-1', aiHeroClass: 'priest',
			aiDeckCardIds: [20001,20001,20002,20002,20003,20003,20004,20004,20020,20020,20105,20105,20107,20107,20113,20113,20114,20114,20115,20115,20200,20200,20203,20203,20207,20207,20209,20209,20216,20216],
			aiProfile: AI_PROFILES.odin,
			bossRules: [
				{ type: 'extra_health', value: 20, description: 'The forces of Ragnarok have 120 health' },
				{ type: 'extra_mana', value: 2, description: 'Chaos starts with +2 mana crystals' },
				{ type: 'bonus_draw', value: 1, description: 'The twilight draws an extra omen each turn' },
			],
			prerequisiteIds: ['norse-8'],
			rewards: [{ type: 'rune', amount: 100 }, { type: 'card', cardId: 20300 }, { type: 'pack', amount: 2 }],
			realm: 'midgard',
		},
	],
};
