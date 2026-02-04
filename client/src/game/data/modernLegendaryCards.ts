/**
 * Modern legendary cards for Hearthstone clone
 * Powerful and unique cards from recent Hearthstone expansions
 */
import { CardData } from '../types';

/**
 * Collection of modern legendary minions
 * Covering recent Hearthstone expansions
 */
export const modernLegendaryCards: CardData[] = [
  {
      id: 5104,
      name: "Dark Inquisitor Xanesh",
      manaCost: 7,
      attack: 5,
      health: 7,
      type: "minion",
      rarity: "legendary",
      description: "Battlecry: Reduce the Cost of Corrupt cards in your hand and deck by (2).",
      keywords: ["battlecry"],
      heroClass: "priest",
                  battlecry: {
        type: "reduce_cost",
      value: 2,
      targets: "corrupt_cards",
      targetsLocation: ["hand", "deck"]
      },
      collectible: true,
      class: "Priest"
},
  {
    id: 5108,
    name: "Catrina Muerte",
    manaCost: 8,
    attack: 6,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "At the end of your turn, summon a friendly minion that died this game.",
    keywords: [],
    heroClass: "priest",
    class: "Priest",
    collectible: true,
    endOfTurn: {
      type: "summon",
      source: "graveyard",
      count: 1,
      targetType: "friendly_minion"
    }
  },
  {
      id: 5111,
      name: "High Priest Amet",
      manaCost: 4,
      attack: 2,
      health: 7,
      type: "minion",
      rarity: "legendary",
      description: "Whenever you summon a minion, set its Health equal to this minion's.",
      keywords: [],
      heroClass: "priest",
      class: "Priest",
      onSummon: {
        type: "copy_health",
        targetType: "summoned_minion"
      },
      collectible: true
  },
  {
      id: 5112,
      name: "Disciplinarian Gandling",
      manaCost: 4,
      attack: 3,
      health: 6,
      type: "minion",
      rarity: "legendary",
      description: "After you play a minion, destroy it and summon a 4/4 Failed Student.",
      keywords: [],
      heroClass: "priest",
      class: "Priest",
      collectible: true
  },
  {
      id: 5113,
      name: "Mindflayer Kaahrj",
      manaCost: 3,
      attack: 3,
      health: 3,
      type: "minion",
      rarity: "legendary",
      description: "Battlecry: Choose an enemy minion. Deathrattle: Summon a copy of it.",
      keywords: ["battlecry", "deathrattle"],
      heroClass: "priest",
      class: "Priest",
                  battlecry: {
        type: "choose",
        requiresTarget: true,
      targetType: "enemy_minion",
      storeTarget: true
      },
      deathrattle: {
        type: "summon_copy",
        targetFromBattlecry: true
      }
    },
  {
      id: 5114,
      name: "Murozond the Infinite",
      manaCost: 8,
      attack: 8,
      health: 8,
      type: "minion",
      rarity: "legendary",
      description: "Battlecry: Play all cards your opponent played last turn.",
      keywords: ["battlecry"],
      heroClass: "priest",
      class: "Priest",
                  battlecry: {
        type: "replay_opponent_turn"
      },
      collectible: true
  },
  {
      id: 5116,
      name: "Reliquary of Souls",
      manaCost: 1,
      attack: 1,
      health: 3,
      type: "minion",
      rarity: "legendary",
      description: "Lifesteal. Deathrattle: Shuffle 'Reliquary Prime' into your deck.",
      keywords: ["lifesteal", "deathrattle"],
      heroClass: "priest",
      class: "Priest",
      deathrattle: {
        type: "shuffle_into_deck",
        cardId: "reliquary_prime"
      },
      collectible: true
  },
  {
      id: 20800,
      name: "Replay Specialist",
      manaCost: 6,
      attack: 5,
      health: 5,
      type: "minion",
      rarity: "legendary",
      description: "Battlecry: Replay all friendly spells from this turn.",
      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",
                  battlecry: {
        type: "replay_spells",
        requiresTarget: false,
        targetType: "none",
        targetSelf: true,
        condition: "friendly_only"
      },
      collectible: true
    },
  {
      id: 20801,

      name: "Temporus",
      manaCost: 7,

      attack: 6,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Your opponent takes two turns. Then you take two turns.",
    flavorText: "He understands that time is money, but hasn't figured out the exchange rate.",
      keywords: ["battlecry"],

      heroClass: "priest",
      class: "Priest",
      race: "dragon",
      collectible: true,
                  battlecry: {
        type: "extra_turns",
        requiresTarget: false,

      targetType: "none"
    }
    },
  {
    id: 20802,
    name: "Blackhowl Gunspire",
    manaCost: 7,
    attack: 3,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Can't attack. Whenever this minion takes damage, deal 3 damage to a random enemy.",
    flavorText: "During construction, balloons kept getting caught on the tower, which the engineers insist was NOT part of the design.",
    keywords: [],
    heroClass: "warrior",
    class: "Warrior",
    collectible: true
  },
  {
  id: 20803,
  
  name: "Dollmaster Dorian",
  manaCost: 5,
  
  attack: 2,
  health: 6,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever you draw a minion, summon a 1/1 copy of it.",
  flavorText: "It's like having imaginary friends, but way more fun!",
  keywords: [],
  
  heroClass: "neutral", // Special handling for draw trigger
  class: "Neutral",
      collectible: true
  },
  {
  id: 20804,
  
  name: "Glinda Crowskin",
  manaCost: 6,
  
  attack: 3,
  health: 7,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Minions in your hand have Echo.",
  flavorText: "Echo... echo... echo...",
  
  keywords: [],
  heroClass: "warlock", // Special handling for echo granting
  class: "Warlock",
      collectible: true
  },
  {
      id: 20805,

      name: "Countess Ashmore",
      manaCost: 7,

      attack: 6,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Draw a Rush, Lifesteal, Deathrattle, and Taunt card from your deck.",
      flavorText: "Only the most qualified bodyguards get to serve the Countess.",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "draw_multiple",
        requiresTarget: false,

      targetType: "none",
    drawConditions: ["rush", "lifesteal", "deathrattle", "taunt"]
    }
    },
  {
  id: 20806,
  
  name: "Darius Crowley",
  manaCost: 5,
  
  attack: 4,
  health: 4,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Rush. After this attacks and kills a minion, gain +2/+2.",
  flavorText: "During the Battle for Gilneas, he led a group of rebels called the 'Gilneas Boys.'",
  keywords: ["rush"],
  
  heroClass: "warrior",
  
  // Special handling for attack and kill trigger
  class: "Warrior"
  },
  {
      id: 20807,

      name: "Face Collector",
      manaCost: 3,

      attack: 2,
      health: 2,

      type: "minion",
      rarity: "legendary",

      description: "Echo.   Battlecry: Add a random Legendary minion to your hand.",
    flavorText: "The faceless... HATE... this guy.",
    keywords: ["echo", "battlecry"],
      heroClass: "rogue",
      class: "Rogue",
      collectible: true,
                  battlecry: {
        type: "add_card",
        requiresTarget: false,

      targetType: "none",
        condition: "random_legendary_minion",

      value: 1
    }
    },
  {
      id: 20808,

      name: "Rhonin",
      manaCost: 8,

      attack: 7,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Add 3 copies of Arcane Missiles to your hand.",
      flavorText: "He was the Archmage of the Kirin Tor... but he's very humble. And he loves it when you call him 'Big Red'.",

      keywords: ["deathrattle"],
      heroClass: "mage",
      class: "Mage",
      deathrattle: {
        type: "add_card",
      targetType: "none",
        condition: "arcane_missiles",
      value: 3

       }
    },
  {
  id: 20809,
  
  name: "Aviana",
  manaCost: 9,
  
  attack: 5,
  health: 5,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Your minions cost (1).",
  flavorText: "Call her 'Tweety'. She hates that.",
  
  keywords: [],
  heroClass: "druid",
  // Special handling for minion cost reduction
  class: "Druid"
  },
  {
      id: 20810,

      name: "Confessor Paletress",
      manaCost: 7,

      attack: 5,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Inspire: Summon a random Legendary minion.",
      flavorText: "She sees into your past and makes you face your fears. Most common fear: Getting Majordomo out of Sneed's Old Shredder.",

      keywords: ["inspire"],
      heroClass: "priest",
      class: "Priest",
      collectible: true,
      inspireEffect: {
      type: "summon",
      condition: "random_legendary",

      summonCount: 1
    }
    },
  {
      id: 20300,

      name: "Hephaestus Forgemaster",
      manaCost: 2,

      attack: 2,
      health: 2,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Give all weapons in your hand and deck +1 Attack.",
      flavorText: "The divine smith forges weapons of unmatched power.",

      keywords: ["battlecry"],
      heroClass: "warrior",
      class: "Warrior",

      race: "dwarf",
      collectible: true,

                  battlecry: {
        type: "buff_weapon",
        requiresTarget: false,
      targetType: "none",
        buffAttack: 1,
      location: "hand_and_deck"

       }
    },
  {
  id: 20301,
  
  name: "Hermès the Trader",
  manaCost: 3,
  
  attack: 3,
  health: 4,
  
  type: "minion",
  rarity: "legendary",
  
  description: "After you cast a spell, refresh your Hero Power.",
  flavorText: "The messenger god knows the value of a quick exchange.",
  
  keywords: [],
  heroClass: "neutral",
  // Special handling for hero power refresh
  class: "Neutral"
  },
  {
      id: 20302,

      name: "Níðhöggr's Heir",
      manaCost: 5,

      attack: 4,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Draw cards until you draw one that isn't a Dragon.",
    flavorText: "The heir of the world-serpent seeks kinship among dragonkind.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      collectible: true,

                  battlecry: {
        type: "draw_until",
        requiresTarget: false,
      targetType: "none",
        stopCondition: "not_dragon"
    }
    },
  {
      id: 20303,

      name: "Sir Finley Mrrgglton",
      manaCost: 1,

      attack: 1,
      health: 3,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Discover a new basic Hero Power.",
    flavorText: "He was a great explorer until his knee got injured, then he became a humble innkeeper.",
    keywords: ["battlecry", "discover"],
      heroClass: "neutral",
      class: "Neutral",

      race: "naga",

                  battlecry: {
        type: "discover",
        requiresTarget: false,
      targetType: "none",

      discoveryType: "hero_power",
      discoveryCount: 3

       }
    },
  {
      id: 20304,

      name: "Marin the Fox",
      manaCost: 8,

      attack: 6,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Summon a 0/8 Treasure Chest for your opponent. (Break it for awesome treasures!)",
      flavorText: "Marin became an explorer because it really pays to discover.",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "summon",
        requiresTarget: false,

      targetType: "none",
        summonForOpponent: true,

      summonCardId: 20305 // Treasure Chest
    }
    },
  {
      id: 20305,

      name: "Treasure Chest",
      manaCost: 0,

      attack: 0,
      health: 8,

      type: "minion",
      rarity: "common",

      description: "Deathrattle: Give your opponent a fantastic treasure!",
    flavorText: "This chest isn't locked, it's just really hard to open.",
      keywords: ["deathrattle"],

      heroClass: "neutral",
      class: "Neutral",

      deathrattle: {
        type: "draw",

        targetType: "none",
        value: 1,

      condition: "random_treasure" // Special flag for treasure handling
            // Special handling for treasure card generation
    }
    },
  {
      id: 20306,

      name: "Zola the Gorgon",
      manaCost: 3,

      attack: 2,
      health: 2,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Choose a friendly minion. Add a Golden copy of it to your hand.",
    flavorText: "Always dress to impress is Zola's motto. In fact, everything she possesses has been gilded, blinged, or bedazzled.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",

                  battlecry: {
        type: "copy_to_hand",
        requiresTarget: true,
      targetType: "friendly_minion",
        isGolden: true
    }
    },
  {
      id: 20307,

      name: "Oondasta",
      manaCost: 9,

      attack: 7,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Rush.   Overkill: Summon a Beast from your hand.",
    flavorText: "The expedition to Un'goro wasn't her first rodeo.",
    keywords: ["rush", "overkill"],
      heroClass: "neutral",
      class: "Neutral",

      race: "beast",
      collectible: true
    },
  {
      id: 20308,

      name: "Archivist Elysiana",
      manaCost: 8,

      attack: 7,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Discover 5 cards. Replace your deck with 2 copies of each.",
      flavorText: "She's the kind of person who shows up to a party with her own playlist and demands that everyone use it.",

      keywords: ["battlecry", "discover"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "discover",
        requiresTarget: false,

      targetType: "none",
        discoveryCount: 5,

      replaceDeck: true,
      makeDuplicates: true

       }
    },
  {
      id: 20309,

      name: "Níðhöggr the Wyrm Queen",
      manaCost: 9,

      attack: 8,
      health: 8,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If your deck has no duplicates, add 2 other random Dragons to your hand. They cost (0).",
    flavorText: "Dragons are like popcorn: once you've had one, you want to consume all of them as fast as you can.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      race: "dragon",
                  battlecry: {
        type: "add_card",
        requiresTarget: false,

      targetType: "none",
        condition: "highlander",

      cardType: "dragon",
      cardCount: 2,

      costReduction: -1 // -1 means set to 0
    }
    },
  {
      id: 20310,

      name: "Kronx Dragonhoof",
      manaCost: 6,

      attack: 6,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Draw Galakrond. If you're already Galakrond, unleash a Devastation.",
    flavorText: "Whatever you do, do NOT correct his pronunciation of 'Galakrond'.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      collectible: true,

                  battlecry: {
        type: "draw_specific",
        requiresTarget: false,
      targetType: "none",

      cardId: "Galakrond".toLowerCase().replace(/ /g, "_"),
      alternateEffect: "devastation"

            // Special handling for devastation effects
    }
    },
  {
      id: 20311,

      name: "Lorekeeper Polkelt",
      manaCost: 4,

      attack: 4,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Reorder your deck from the highest Cost card to the lowest Cost card.",
      flavorText: "Someone thought it would be hilarious to file his research tomes by card cost instead of alphabetically.",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",
                  battlecry: {
        type: "reorder_deck",
        requiresTarget: false,

      targetType: "none",
        orderBy: "cost",

      direction: "descending"
    }
    },
  {
      id: 20312,

      name: "Yogg-Saron, Master of Fate",
      manaCost: 10,

      attack: 7,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If you've cast 10 spells this game, spin the Wheel of Yogg-Saron.",
    flavorText: "Yogg-Saron doesn't so much master fate as give fate a friendly, but painful-looking noogie.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      collectible: true,

                  battlecry: {
        type: "wheel_of_yogg",
        requiresTarget: false,
      targetType: "none",
        condition: "spells_cast",
      conditionValue: 10

            // Special handling for Wheel of Yogg-Saron effects
    }
    },
  {
      id: 20313,

      name: "Mutanus the Devourer",
      manaCost: 7,

      attack: 4,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Eat a minion in your opponent's hand. Gain its stats.",
      flavorText: "Mutanus isn't a picky eater. Mutanus is just an eater.",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",

      race: "naga",

                  battlecry: {
        type: "eat_opponent_card",
        requiresTarget: false,
      targetType: "none",
        cardType: "minion",
      isRandom: true

       }
    },
  {
  id: 20314,
  
  name: "Cornelius Roame",
  manaCost: 6,
  
  attack: 4,
  health: 5,
  
  type: "minion",
  rarity: "legendary",
  
  description: "At the start and end of each player's turn, draw a card.",
  flavorText: "Keep a light on when you read, and don't forget to clean your quill!",
  keywords: [],
  
  heroClass: "neutral", // Special handling for card draw on turn starts/ends
  class: "Neutral",
      collectible: true
  },
  {
      id: 20315,

      name: "Lady Prestor",
      manaCost: 5,

      attack: 6,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Transform all minions in your deck into random Dragons.",
      flavorText: "Her favorite lullaby: 'Puff the Magic Dragon.'",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "transform_deck",
        requiresTarget: false,

      targetType: "none",
        cardType: "minion",

      transformInto: "dragon"
    }
    },
  {
      id: 20316,

      name: "Raid Boss Ladon",
      manaCost: 9,

      attack: 8,
      health: 8,

      type: "minion",
      rarity: "legendary",

      description: "Rush. Battlecry: Summon six 1/1 Whelps with Rush. If any die, resummon them at the end of your turn.",
    flavorText: "Honestly, after the 42nd attempt, I think they should just put her purples in the mailbox.",
    keywords: ["rush", "battlecry"],
      heroClass: "neutral",
      class: "Neutral",

      race: "dragon",

                  battlecry: {
        type: "summon",
        requiresTarget: false,
      targetType: "none",

      summonCardId: 20317, // Whelp with Rush
      summonCount: 6

       }
        // Special handling for resummon effect
  },
  {
  id: 20317,
  
  name: "Whelp with Rush",
  manaCost: 1,
  
  attack: 1,
  health: 1,
  
  type: "minion",
  rarity: "common",
  
  description: "Rush",
  flavorText: "A fast baby dragon. What could be cuter... or more dangerous?",
  
  keywords: ["rush"],
  heroClass: "neutral", race: "dragon",
      class: "Neutral",
      collectible: false
  },
  {
      id: 20318,

      name: "The Nameless One",
      manaCost: 4,

      attack: 4,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Choose a minion. Become a copy of it. Silence it.",
      flavorText: "Never underestimate the power of becoming someone else for the afternoon.",

      keywords: ["battlecry"],
      heroClass: "priest",
      class: "Priest",
      collectible: true,
                  battlecry: {
        type: "transform_and_silence",
        requiresTarget: true,

      targetType: "any_minion"
    }
    },
  {
  id: 20319,
  
  name: "Prince Renathal",
  manaCost: 3,
  
  attack: 3,
  health: 4,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Your deck size and starting Health are 40.",
  flavorText: "He'll help you live longer by suggesting a simple regime of more carbs, more cards, and a 3-minute neck extension.",
  keywords: [],
  
  heroClass: "neutral",
  
  // Special handling for deck and health change
  class: "Neutral"
  },
  {
      id: 20320,

      name: "Sire Denathrius",
      manaCost: 10,

      attack: 10,
      health: 10,

      type: "minion",
      rarity: "legendary",

      description: "Lifesteal. Battlecry: Deal damage equal to the number of friendly minions that died this game to all enemies, distributed randomly. Gain that much Attack.",
    flavorText: "With every soul he drained for power, he'd send a personalized thank-you note.",
    keywords: ["lifesteal", "battlecry"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "random_damage_and_buff",
        requiresTarget: false,

      targetType: "all_enemies",
      isRandomSplit: true,

      damageSourceCounter: "friendly_deaths",
      buffAttack: true

       }
  }
      ];

export default modernLegendaryCards;