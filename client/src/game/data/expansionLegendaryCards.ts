/**
 * Expansion legendary cards for Hearthstone clone
 * Powerful and unique cards from various Hearthstone expansions
 */
import { CardData } from '../types';

/**
 * Collection of expansion legendary minions
 * These cards cover several Hearthstone expansions
 */
export const expansionLegendaryCards: CardData[] = [{
      id: 20700,
      name: "Jötun Giant",
      manaCost: 8,
      attack: 8,
      health: 8,
      type: "minion",
      rarity: "legendary",
      description: "Summons Frozen Champions on deathrattle.",
      keywords: ["deathrattle"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
      deathrattle: {
        type: "summon",
        targetType: "none",
        summonCardId: 20701, // Frozen Champion
        value: 2
      }
    },
  {
      id: 20701,

      name: "Frozen Champion",
      manaCost: 1,

      attack: 0,
      health: 1,

      type: "minion",
      rarity: "common",

      description: "Deathrattle: Add a random Legendary minion to your hand.",
    flavorText: "Frozen in time, but not in space.",
      keywords: ["deathrattle"],

      heroClass: "neutral",
      class: "Neutral",
      collectible: false,

      deathrattle: {
        type: "add_card",

        targetType: "none",
      condition: "random_legendary",

      value: 1
    }
    },
  {
  id: 20702,
  
  name: "Moorabi",
  manaCost: 6,
  
  attack: 4,
  health: 4,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever another minion is Frozen, add a copy of it to your hand.",
  flavorText: "Any moram can freeze minions. He prefers to call it 'going into the cooler.'",
  
  keywords: [],
  heroClass: "shaman",
  // Special handling for freeze copy effect
  class: "Shaman"
  },
  {
      id: 20703,

      name: "Hadronox",
      manaCost: 9,

      attack: 3,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Summon your Taunt minions that died this game.",
      flavorText: "Hadronox's favorite delicacy? Gnome and garden salad.",

      keywords: ["deathrattle"],
      heroClass: "druid",
      class: "Druid",

      race: "beast",
      collectible: true,

      deathrattle: {
        type: "resurrect",

        targetType: "none",
      condition: "taunt_only"

       }
    },
  {
      id: 20704,

      name: "Prince Taldaram",
      manaCost: 3,

      attack: 3,
      health: 3,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If your deck has no 3-Cost cards, transform into a 3/3 copy of a minion.",
    flavorText: "Okay guys, I admit it... I am not actually a prince. But this blood super works!",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",

                  battlecry: {
        type: "transform_copy",

          requiresTarget: true,
      targetType: "any_minion",

      condition: "no_3_cost_cards"
    }
    },
  {
      id: 20705,

      name: "Prince Keleseth",
      manaCost: 2,

      attack: 2,
      health: 2,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If your deck has no 2-Cost cards, give all minions in your deck +1/+1.",
      flavorText: "There's a prince for every mana cost! Collect all 10!* *There are only 3 princes.",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",
                  battlecry: {
        type: "buff_deck",


        requiresTarget: false,

      targetType: "none",
      condition: "no_2_cost_cards",

      buffAttack: 1,
      buffHealth: 1

       }
    },
  {
      id: 20706,

      name: "Prince Valanar",
      manaCost: 4,

      attack: 4,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If your deck has no 4-Cost cards, gain Lifesteal and Taunt.",
      flavorText: "Do NOT call him by his full name: Prince Valanar Dreadskull Grimsorrow. It takes him hours to finish introducing himself.",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "gain_keyword",


        requiresTarget: false,

      targetType: "none",
      condition: "no_4_cost_cards",

      keywords: ["lifesteal", "taunt"]
    }
    },
  {
      id: 20707,

      name: "Arfus",
      manaCost: 4,

      attack: 2,
      health: 2,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Add a random Death Knight card to your hand.",
      flavorText: "Good boy!",

      keywords: ["deathrattle"],
      heroClass: "neutral",
      class: "Neutral",

      race: "beast",

      deathrattle: {
        type: "add_card",

        targetType: "none",
      condition: "random_death_knight",

      value: 1
    }
    },
  {
      id: 20708,

      name: "Lilian Voss",
      manaCost: 4,

      attack: 4,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Replace spells in your hand with random spells (from your opponent's class).",
    flavorText: "Lilian was the Headmaster's star pupil. Then, one day, she just... flipped.",
      keywords: ["battlecry"],

      heroClass: "rogue",
      class: "Rogue",

                  battlecry: {
        type: "replace_spells",

          requiresTarget: false,
      targetType: "none",

      replaceWith: "opponent_class_spells"
    }
    },
  {
  id: 20709,
  
  name: "Geosculptor Yip",
  manaCost: 8,
  
  attack: 4,
  health: 8,
  
  type: "minion",
  rarity: "legendary",
  
  description: "At the end of your turn, summon a random minion with Cost equal to your Armor (up to 10).",
  flavorText: "He once built a lovely rock garden, but it was full of rock lobsters that wouldn't stop singing.",
  keywords: [],
  
  heroClass: "warrior",
  
  // Special handling for armor-based summon
  class: "Warrior"
  },
  {
  id: 20710,
  
  name: "Woecleaver",
  manaCost: 8,
  
  attack: 3,
  durability: 3,
  
  type: "weapon",
  rarity: "legendary",
  
  description: "After your hero attacks, Recruit a minion.",
  flavorText: "Woe to all, woe to all, who heard the cleaving call.",
  keywords: [],
  
  heroClass: "warrior", // Special handling for recruit on attack
  class: "Warrior",
      collectible: true
  },
  {
      id: 20200,

      name: "Toshley",
      manaCost: 6,

      attack: 5,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry and   Deathrattle: Add a Spare Part card to your hand.",
    flavorText: "He's a mechanical engineer with a heart of gold. And gears. Lots and lots of gears.",
    keywords: ["battlecry", "deathrattle"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "give_cards",


        requiresTarget: false,

      targetType: "none",
      cardCount: 1,

      isRandom: true
      // Special handling for Spare Part card type
    },
      deathrattle: {
        type: "draw",
      targetType: "none",

      value: 1
      // Special handling for Spare Part card type
    }
    },
  {
  id: 20201,
  
  name: "Troggzor the Earthinator",
  manaCost: 7,
  
  attack: 6,
  health: 6,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever your opponent casts a spell, summon a Burly Rockjaw Trogg.",
  flavorText: "He keeps earthinating the countryside despite attempts to stop him.",
  
  keywords: [],
  heroClass: "neutral",
  // Special handling for summoning Troggs
  class: "Neutral",
  },
  {
      id: 20202,

      name: "Blingtron 3000",
      manaCost: 5,

      attack: 3,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Equip a random weapon for each player.",
      flavorText: "WARNING: Blingtron 3000 is not responsible for customer dismemberment.",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",

      race: "mech",

                  battlecry: {
        type: "random_weapon",

          requiresTarget: false,
      targetType: "none",

      forBothPlayers: true
    }
    },
  {
  id: 20203,
  
  name: "Gazlowe",
  manaCost: 6,
  
  attack: 3,
  health: 6,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever you cast a 1-cost spell, add a random Mech to your hand.",
  flavorText: "Gazlowe was voted 'Most Likely to Explode During a Rocketbike Festival.'",
  
  keywords: [],
  heroClass: "neutral", 
  // Special handling for mech card generation
  class: "Neutral",
      collectible: true
  },
  {
  id: 20204,
  
  name: "Mimiron's Head",
  manaCost: 5,
  
  attack: 4,
  health: 5,
  
  type: "minion",
  rarity: "legendary",
  
  description: "At the start of your turn, if you have at least 3 Mechs, destroy them all and form V-07-TR-0N.",
  flavorText: "Do not push the big red button!",
  
  keywords: [],
  heroClass: "neutral",
  race: "mech",
  
  // Special handling for V-07-TR-0N transformation
  class: "Neutral",
      collectible: true
  },
  {
      id: 20205,

      name: "Hemet Nesingwary",
      manaCost: 5,

      attack: 6,
      health: 3,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Destroy a Beast.",
    flavorText: "He only accepts the most rare and exotic pets. Also, cockroaches.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      collectible: true,

                  battlecry: {
        type: "destroy",

          requiresTarget: true,
      targetType: "beast"

       }
    },
  {
  id: 20206,
  
  name: "Mekgineer Thermaplugg",
  manaCost: 9,
  
  attack: 9,
  health: 7,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever an enemy minion dies, summon a 1/1 Leper Gnome.",
  flavorText: "He's on the cutting edge of technology! Which is why he's still working on cybernetic leper gnomes.",
  
  keywords: [],
  heroClass: "neutral",
  race: "mech",
  
  // Special handling for Leper Gnome summoning
  class: "Neutral",
  },
  {
  id: 20207,
  
  name: "Foe Reaper 4000",
  manaCost: 8,
  
  attack: 6,
  health: 9,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Also damages the minions next to whomever this attacks.",
  flavorText: "Despite the name, it doesn't actually reap any foes. That's false advertising.",
  keywords: [],
  
  heroClass: "neutral",
  race: "mech",
  
  // Special handling for cleave attack
  class: "Neutral",
      collectible: true
  },
  {
      id: 20208,

      name: "Sneed's Old Shredder",
      manaCost: 8,

      attack: 5,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Summon a random legendary minion.",
    flavorText: "When Sneed says 'Shred', ya shred. Even if you're a legendary minion.",
      keywords: ["deathrattle"],

      heroClass: "neutral",
      class: "Neutral",
      race: "mech",
      collectible: true,
      deathrattle: {
        type: "summon",
        targetType: "none",

        // Special handling for summoning a random legendary minion
        condition: "random_legendary",

        summonCardId: 20209
    }
    },
  {
      id: 20209,

      name: "Justicar Trueheart",
      manaCost: 6,

      attack: 6,
      health: 3,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Replace your starting Hero Power with a better one.",
    flavorText: "Long ago in a meadow by the forest, she was chosen by the Light. She's been trying to get people to call her 'Justice Girl' ever since.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",

                  battlecry: {
        type: "replace_hero_power",

          requiresTarget: false,
        targetType: "none"

        // Special handling for hero power replacement
    }
    },
  {
      id: 20210,

      name: "Rend Blackhand",
      manaCost: 7,

      attack: 8,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If you're holding a Dragon, destroy a Legendary minion.",
    flavorText: "Rend believes he is the True Warchief of the Horde and he keeps challenging Magni Stormcaller to 'Mak'gora,' the ancient orcish custom where two orcs fight while wearing loincloths.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",

                  battlecry: {
        type: "destroy",

          requiresTarget: true,
        targetType: "legendary_minion",

        condition: "holding_dragon"
    }
    },
  {
      id: 20211,

      name: "Majordomo Executus",
      manaCost: 9,

      attack: 9,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Replace your hero with Surtr, Flame Lord.",
      flavorText: "He's Surtr's #1 fan.",

      keywords: ["deathrattle"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
      deathrattle: {
        type: "summon",
        targetType: "none",

        // Special condition for Surtr hero replacement
        condition: "transform_into_ragnaros",

        summonCardId: 20212
    }
    },
  {
      id: 20212,

      name: "Hanuman, Tyrant of the Vale",
      manaCost: 6,

      attack: 5,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Add 2 Bananas to your hand.",
    flavorText: "When he's not menacing the Vale, he likes to unwind with his friends in Un'goro Crater.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      race: "beast",
                  battlecry: {
        type: "give_cards",


        requiresTarget: false,

        targetType: "none",
        cardCount: 2,

        cardId: 20136 // Bananas, which we already created
    }
    },
  {
      id: 20213,

      name: "Xaril, Poisoned Mind",
      manaCost: 4,

      attack: 3,
      health: 2,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry and   Deathrattle: Add a random Toxin card to your hand.",
    flavorText: "Everything's coming up Xaril!",
    keywords: ["battlecry", "deathrattle"],
      heroClass: "rogue",
      class: "Rogue",
      race: "beast",

                  battlecry: {
        type: "give_cards",

          requiresTarget: false,
        targetType: "none",

        cardCount: 1,
        isRandom: true

        // Special handling for Toxin cards
    },
      deathrattle: {
        type: "draw",
        targetType: "none",

        value: 1
      // Special handling for Toxin cards
    }
    },
  {
  id: 20214,
  
  name: "Charon the Steward",
  manaCost: 3,
  
  attack: 1,
  health: 1,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Stealth. At the end of your turn, summon a 1/1 Steward.",
  flavorText: "Charon the Steward runs the halls when Óðinn's Prophet is out of town, which is a lot these days.",
  keywords: ["stealth"],
  
  heroClass: "neutral",
  
  // Special handling for Steward summoning
  class: "Neutral",
  },
  {
      id: 20215,

      name: "Hecate the Merchant",
      manaCost: 6,

      attack: 4,
      health: 3,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Choose a friendly minion. Swap it with a minion in your deck.",
    flavorText: "She'll swap any card, no questions asked. Except for 'Where am I?' and 'Are you Hecate the Merchant?'",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      collectible: true,

                  battlecry: {
        type: "swap_with_deck",

          requiresTarget: true,
      targetType: "friendly_minion"

       }
    },
  {
      id: 20216,

      name: "Valkyrie Sally",
      manaCost: 3,

      attack: 1,
      health: 1,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Deal damage equal to this minion's Attack to all enemy minions.",
      flavorText: "Safety is her middle name. Her full name is Sally Safety Dangerzone.",

      keywords: ["deathrattle"],
      heroClass: "neutral",
      class: "Neutral",
      deathrattle: {
        type: "damage",
      targetType: "all_enemy_minions",

      value: 1, // Base value from the card's attack
      condition: "use_attack_as_damage" // Special flag for the game logic

       }
    },
  {
  id: 20217,
  
  name: "Fenrir's Fist",
  manaCost: 5,
  
  attack: 3,
  health: 7,
  
  type: "minion",
  rarity: "legendary",
  
  description: "After this attacks a minion, it also hits the enemy hero.",
  flavorText: "The great wolf's fury knows no bounds. When Fenrir strikes, all feel his wrath.",
  
  keywords: [],
  heroClass: "hunter",
  race: "beast",
  
  // Special handling for excess damage to face
  class: "Hunter",
  },
  {
      id: 20218,

      name: "Don Han'Cho",
      manaCost: 7,

      attack: 5,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Give a random minion in your hand +5/+5.",
    flavorText: "The brilliant mastermind of the Grimy Goons, Han sometimes thinks about switching sides and joining the Jade Lotus. That Aya is so much prettier than Kazakus.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      collectible: true,

                  battlecry: {
        type: "buff_hand",

          requiresTarget: false,
      targetType: "none",

      buffAttack: 5,
      buffHealth: 5,

      isRandom: true,
      cardType: "minion"

       }
  }
      ];

export default expansionLegendaryCards;