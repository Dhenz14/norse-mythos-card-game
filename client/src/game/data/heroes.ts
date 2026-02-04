import { HeroClass } from "../types";

// Hero power interface
interface HeroPower {
      id: number;

      name: string;
      description: string;

      cost: number;
  image?: string;
}

// Alternate hero interface
interface AlternateHero {
      id: number;

      name: string;
      description: string;

      image?: string;
}

// Hero data interface
interface HeroData {
      id: number;

      name: string;
      class: HeroClass;

      heroPowers: HeroPower[];
  description?: string;
  image?: string;
  alternateHeroes?: AlternateHero[];
  collectible?: boolean;
}

// Define all hero data
const heroes: HeroData[] = [
   {
      id: 1,

      name: "Jaina Proudmoore",
      class: "mage",

      description: "The Archmage of the Kirin Tor and former leader of the Kirin Tor.",
      heroPowers: [{

          id: 101,

          name: "Fireblast",
          description: "Deal 1 damage.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 1001,

          name: "Óðinn's Prophet",
          description: "The Last Guardian of the realms and one of the most powerful mages to ever live."

           },

{
          id: 1002,

          name: "Khadgar",
          description: "Archmage of the Kirin Tor and apprentice of Óðinn's Prophet."

           },

{
          id: 1003,

          name: "Varden Dawngrasp",
          description: "Neutral mage from Dalaran who has joined the Horde in Kalimdor."

           },

{
          id: 1004,

          name: "Aegwynn",
        description: "Guardian of the realms, mother of Óðinn's Prophet, and one of the most powerful mages in history."
      },

{
          id: 1005,

          name: "Daelin Proudmoore",
          description: "Grand Admiral of Kul Tiras and father of Jaina Proudmoore."

           },

{
          id: 1006,

          name: "Mordecai",
          description: "A fire mage known for his pyroblast skills and fiery personality."
      }],
      collectible: true
  },

{
      id: 2,

      name: "Kratos Battleborn",
      class: "warrior",

      description: "Legendary warrior known for his battle fury and unyielding rage.",
      heroPowers: [{

          id: 102,

          name: "Armor Up!",
          description: "Gain 2 Armor.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 2001,

          name: "Magni Bronzebeard",
          description: "Former King of Ironforge and representative of the Diamond Dwarves."

           },

{
          id: 2002,

          name: "Apophis, World Ender",
        description: "The serpent of chaos who threatens to devour the world."
      },

{
          id: 2003,

          name: "Annhylde the Caller",
          description: "Leader of the Val'kyr who offered Hel a pact after her fall."

           },

{
          id: 2004,

          name: "Rokara",
          description: "Young orcish warrior from the Frostwolf Clan with exceptional combat skills."
      }]

  },

{
      id: 3,

      name: "Uther Lightbringer",
      class: "paladin",

      description: "Leader of the Knights of the Silver Hand and mentor to Arthas Menethil.",
      heroPowers: [{

          id: 103,

          name: "Reinforce",
          description: "Summon a 1/1 Silver Hand Recruit.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 3001,

          name: "Lady Liadrin",
          description: "First of the Blood Knights and wielder of the Light."

           },

{
          id: 3002,

          name: "Sir Annoy-O",
          description: "Sentient mechanical annoy-o-tron who became a Knight of the Silver Hand."

           },

{
          id: 3003,

          name: "Prince Arthas",
          description: "The crown prince of Lordaeron before his descent into darkness."

           },

{
          id: 3004,

          name: "Cariel Roame",
          description: "Tireless defender of justice and sister to Tamsin Roame."

           },

{
          id: 3005,

          name: "Yrel",
          description: "Draenei paladin and former Exarch of the Draenei people."
      }],
      collectible: true
  },

{
      id: 4,

      name: "Orion",
      class: "hunter",

      description: "The great hunter of Greek mythology, placed among the stars.",
      heroPowers: [{

          id: 104,

          name: "Aimed Shot",
          description: "Deal 2 damage to the enemy hero.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 4001,

          name: "Alleria Windrunner",
          description: "Eldest of the Windrunner sisters and master ranger."

           },

{
          id: 4002,

          name: "Hel, Death's Embrace",
        description: "The goddess of the underworld, ruler of the dead."
      },

{
          id: 4003,

          name: "Tavish Stormpike",
          description: "Skilled dwarf hunter from Alterac Valley who excels at hunting the most dangerous prey."

           },

{
          id: 4004,

          name: "Guff Runetotem",
          description: "Young tauren hunter with a special connection to animals of the wild."

           },

{
          id: 4005,

          name: "Hemet Nesingwary",
          description: "Legendary big game hunter and safari guide in Azeroth."
      }],
      collectible: true
  },

{
      id: 5,

      name: "Malfurion Stormrage",
      class: "druid",

      description: "Archdruid of the Night Elves and twin brother of Typhon, Storm Titan.",
      heroPowers: [{

          id: 105,

          name: "Shapeshift",
          description: "Gain 1 Attack this turn and 1 Armor.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 5001,

          name: "Lunara",
          description: "First daughter of Cenarius and protector of the Dreamway."

           },

{
          id: 5002,

          name: "Hamuul Runetotem",
          description: "Archdruid of Thunder Bluff and leader of the tauren druids."

           },

{
          id: 5003,

          name: "Shan'do Malfurion",
          description: "Malfurion in his role as teacher and guide to young druids."

           },

{
          id: 5004,

          name: "Hazelbark",
          description: "Ancient treant with deep connections to the Emerald Dream."

           },

{
          id: 5005,

          name: "Guff Runetotem",
          description: "Young tauren druid known for his friendly nature and connection to the land."
      }],
      collectible: true
  },

{
      id: 6,

      name: "Anduin Wrynn",
      class: "priest",

      description: "King of Stormwind and son of Varian Wrynn.",
      heroPowers: [{

          id: 106,

          name: "Lesser Heal",
          description: "Restore 2 Health.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 6001,

          name: "Tyrande Whisperwind",
          description: "High Priestess of Elune and leader of the Night Elves."

           },

{
          id: 6002,

          name: "Delphi, Oracle of Light",
          description: "The Oracle who sees all futures and guides the faithful."

           },

{
          id: 6003,

          name: "Madame Lazul",
          description: "Troll priestess and fortune teller with mysterious powers."

           },

{
          id: 6004,

          name: "Natalie Seline",
          description: "Former high priestess who studied the ways of shadow."

           },

{
          id: 6005,

          name: "Xyrella",
          description: "Draenei priest with powerful light-based abilities."
      }],
      collectible: true
  },

{
      id: 7,

      name: "Gul'dan",
      class: "warlock",

      description: "Founder of the Shadow Council and the first warlock.",
      heroPowers: [{

          id: 107,

          name: "Life Tap",
          description: "Draw a card and take 2 damage.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 7001,

          name: "Nemsy Necrofizzle",
          description: "A gnome warlock with an affinity for dark magic."

           },

{
          id: 7002,

          name: "Mecha-Jaraxxus",
          description: "A mechanized version of the eredar lord Jaraxxus."

           },

{
          id: 7003,

          name: "N'Zoth",
        description: "The Corruptor, an ancient Old God known for its power over death."
      },

{
          id: 7004,

          name: "Tamsin Roame",
        description: "Ambitious warlock and sister to Cariel Roame, who made a dangerous pact with dark forces."
      },

{
          id: 7005,

          name: "Cho'gall",
          description: "Two-headed ogre chieftain with powerful warlock abilities."
      }],
      collectible: true
  },

{
      id: 8,

      name: "Magni Stormcaller",
      class: "shaman",

      description: "A powerful shaman who commands the fury of the elements.",
      heroPowers: [{

          id: 108,

          name: "Totemic Call",
          description: "Summon a random Basic Totem.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 8001,

          name: "Morgl the Oracle",
          description: "A wise murloc shaman who has mastered the elements."

           },

{
          id: 8002,

          name: "King Rastakhan",
          description: "King of the Zandalari trolls and powerful practitioner of loa magic."

           },

{
          id: 8003,

          name: "The Thunder King",
          description: "Ancient ruler of the mogu who wields the power of lightning."

           },

{
          id: 8004,

          name: "Instructor Fireheart",
          description: "Master of shamanic techniques who teaches the ways of the elements."

           },

{
          id: 8005,

          name: "Lady Vashj",
          description: "Former night elf handmaiden transformed into a powerful naga sea witch."
      }],
      collectible: true
  },

{
      id: 9,

      name: "Valeera Sanguinar",
      class: "rogue",

      description: "Master assassin and companion to Varian Wrynn.",
      heroPowers: [{

          id: 109,

          name: "Dagger Mastery",
          description: "Equip a 1/2 Dagger.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 9001,

          name: "Maiev Shadowsong",
          description: "The Warden responsible for imprisoning Typhon, Storm Titan."

           },

{
          id: 9002,

          name: "Erik the Shadow Lord",
          description: "Master of shadows and leader of the dark brotherhood."

           },

{
          id: 9003,

          name: "Tess Greymane",
          description: "Princess of Gilneas and expert in espionage and stealth tactics."

           },

{
          id: 9004,

          name: "Scabbs Cutterbutter",
          description: "SI:7 operative known for his espionage skills and acrobatic abilities."

           },

{
          id: 9005,

          name: "Captain Hooktusk",
          description: "Infamous pirate captain with a deadly reputation on the high seas."
      }],
      collectible: true
  },

{
      id: 10,

      name: "Typhon, Storm Titan",
      class: "demonhunter",

      description: "The first Demon Hunter, twin brother of Malfurion Stormrage.",
      heroPowers: [{

          id: 110,

          name: "Demon Claws",
          description: "Gain +1 Attack this turn.",

          cost: 1
      }]
,
      alternateHeroes: [{

          id: 10001,

          name: "Kayn Sunfury",
          description: "A powerful blood elf demon hunter and disciple of Typhon."

           },

{
          id: 10002,

          name: "Kurtrus Ashfallen",
          description: "A devoted demon hunter who survived the destruction of his village by demons."

           }
],
      collectible: true
  },
  {
      id: 11,

      name: "Arthas Menethil",
      class: "deathknight",

      description: "The Lich King, former prince of Lordaeron who fell to darkness.",
      heroPowers: [{

          id: 111,

          name: "Death's Touch",
          description: "Deal 1 damage to a minion and raise a 1/1 Ghoul if it dies.",

          cost: 2
      }]
,
      alternateHeroes: [{

          id: 11001,

          name: "Darion Mograine",
          description: "Highlord of the Ebon Blade and former Death Knight of the Scourge."

           },

{
          id: 11002,

          name: "Thassarian",
          description: "The first of the death knights to rejoin the Alliance after breaking free from the Scourge."

           },

{
          id: 11003,

          name: "Koltira Deathweaver",
          description: "Former high elf ranger transformed into a Death Knight by Arthas."

           },

{
          id: 11004,

          name: "Lady Alistra",
          description: "Master of unholy magics and instructor of aspiring Death Knights."

           },

{
          id: 11005,

          name: "Salanar the Horseman",
          description: "Death Knight known for his mastery over undead steeds."
      }],
      collectible: true
  },
  {
      id: 12,

      name: "Lilian Voss",
      class: "necromancer",

      description: "Master of dark magic and the art of raising the dead.",
      heroPowers: [{

          id: 112,

          name: "Soul Harvest",
          description: "Lose 2 Health and summon a 2/1 Skeleton with Rush.",

          cost: 2
      }],
      alternateHeroes: [{

          id: 12001,

          name: "Meryl Felstorm",
          description: "Ancient undead mage who mastered the dark arts of necromancy."

           },

{
          id: 12002,

          name: "Helcular",
          description: "Notorious necromancer who terrorized the Hillsbrad Foothills."

           }
      ],
      collectible: true
  }
];

// Helper function to get hero data by class
export const getHeroDataByClass = (heroClass: HeroClass): HeroData | undefined => {
  // Filter out undefined heroes first
  const validHeroes = heroes.filter(hero => hero !== undefined && hero !== null);
  
  // Safely handle potential undefined heroClass
  if (!heroClass) {
    console.warn("getHeroDataByClass called with undefined heroClass");
    return undefined;
  }
  
  try {
    // Perform case-insensitive class matching
    return validHeroes.find(hero => 
      hero.class && hero.class.toLowerCase() === heroClass.toLowerCase()
    );
  } catch (error) {
    console.error("Error in getHeroDataByClass:", error);
    return undefined;
  }
};

// Helper function to get the default hero power for a hero class
export const getDefaultHeroPower = (heroClass: HeroClass): HeroPower | undefined => {
  const hero = getHeroDataByClass(heroClass);
  return hero?.heroPowers[0];
};

export default heroes;