/**
 * Iconic legendary cards from Hearthstone's history
 * A collection of some of the most memorable legendaries from the classic sets and expansions
 */
import { CardData } from '../types';

/**
 * Collection of iconic legendary minions
 * These cards have had significant impact on the Hearthstone meta over the years
 */
export const   iconicLegendaryCards: CardData[] = [{
      id: 20101,

      name: "Brokkr the Explorer",
      manaCost: 3,

      attack: 2,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Your Battlecries trigger twice.",
      flavorText: "Contains 75% more fiber than his brother Magni!",

      keywords: [],
      heroClass: "neutral",
      collectible: true, 
    // Special handling in game logic for battlecries
  class: "Neutral"
},
  {
      id: 20102,

      name: "Shudderwock",
      manaCost: 9,

      attack: 6,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Repeat all other Battlecries from cards you played this game (targets chosen randomly).",
    flavorText: "My jaws that bite, my claws that catch!",
      keywords: ["battlecry"],

      heroClass: "shaman",
      class: "Shaman",
      collectible: true,

                  battlecry: {
        type: "replay_battlecries",

          requiresTarget: false,
      targetType: "none",

      isRandom: true
    }
    },
  {
  id: 20104,
  
  name: "Ægir's Raider",
  manaCost: 1,
  
  attack: 1,
  health: 1,
  
  type: "minion",
  rarity: "legendary",
  
  description: "After you play a Pirate, summon this minion from your deck.",
  flavorText: "I'm in charge now!",
  
  keywords: [],
  heroClass: "neutral",
  race: "einherjar",
  
  // Special handling in game logic for summoning from deck
  class: "Neutral"
  },
  {
      id: 20105,

      name: "Dionysus the Showman",
      manaCost: 4,

      attack: 3,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Summon a 1/1 copy of a random minion in your deck.",
    flavorText: "He used to play every part, until Charon the Steward convinced him to focus on his true talent: being super-dramatic.",
    keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "summon_copy_from_deck",
      value: 1,

      requiresTarget: false,
      targetType: "none",

      statOverride: {
      attack: 1,

        health: 1
      },
      randomSelection: true,

      copyType: "minion"
    }
    },
  {
  id: 20106,
  
  name: "Erebus, Prince of Void",
  manaCost: 5,
  
  attack: 5,
  health: 6,
  
  type: "minion",
  rarity: "legendary",
  
  description: "When the game starts, add 5 random Legendary minions to your deck.",
  flavorText: "He was super excited to acquire Gungnir's Fury at a garage sale! Then super disappointed when he realized he couldn't wield it.",
  
  keywords: [],
  heroClass: "neutral",
  race: "titan",
  
  // Special handling in game logic for start-of-game effect
  class: "Neutral"
  },
  {
  id: 20107,
  
  name: "Finja, the Flying Star",
  manaCost: 5,
  
  attack: 2,
  health: 4,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Stealth. After this attacks and kills a minion, summon 2 Murlocs from your deck.",
  flavorText: "The last true master of Finjitsu.",
  
  keywords: ["stealth"],
  heroClass: "neutral",
  race: "naga",
  
  
  // Special handling in game logic for on-kill effect
  class: "Neutral",
      collectible: true
  },
  {
  id: 20108,
  
  name: "Midas the Golden",
  manaCost: 6,
  
  attack: 5,
  health: 5,
  
  type: "minion",
  rarity: "legendary",
  
  description: "At the end of your turn, reduce the Cost of cards in your hand by (1).",
  flavorText: "His second greatest regret is summoning an evil Firelord who enslaved his entire people.",
  
  keywords: [],
  heroClass: "neutral", // Special handling in game logic for cost reduction
  class: "Neutral",
      collectible: true
  },
  {
  id: 20109,
  
  name: "Hel's Warden",
  manaCost: 4,
  
  attack: 1,
  health: 7,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Your minions trigger their Deathrattles twice.",
  flavorText: "There used to be five Horsemen but one of them left because a job opened up in Gadgetzan.",
  
  keywords: [],
  heroClass: "neutral", // Special handling in game logic for deathrattle repetition
  class: "Neutral",
      collectible: true
  },
  {
      id: 20110,

      name: "Móði (Thor's son)",
      manaCost: 5,

      attack: 4,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: If Magni (Dwarf god) also died this game, summon Surtr's Creation.",
      flavorText: "Móði is sad because everyone likes Magni better.",

      keywords: ["deathrattle"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
      deathrattle: {
        type: "summon",
      targetType: "none",

      condition: "magni_died",
      summonCardId: 20112 // Surtr's Creation

       }
    },
  {
      id: 20111,

      name: "Magni (Dwarf god)",
      manaCost: 5,

      attack: 7,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: If Móði (Thor's son) also died this game, summon Surtr's Creation.",
    flavorText: "Magni want to smash! Móði think smash waste of time, send ravens instead.",
      keywords: ["deathrattle"],

      heroClass: "neutral",
      class: "Neutral",

      deathrattle: {
        type: "summon",

        targetType: "none",
      condition: "modi_died",

      summonCardId: 20112 // Surtr's Creation
    }
    },
  {
  id: 20112,
  
  name: "Surtr's Creation",
  manaCost: 10,
  
  attack: 11,
  health: 11,
  
  type: "minion",
  rarity: "legendary",
  
  description: "A powerful amalgamation of stolen souls.",
  flavorText: "He's the amalgamation of the souls of women and children who were killed in experiments. But he's still kinda cuddly.",
  
  keywords: [],
  heroClass: "neutral",
      class: "Neutral",
      collectible: false
  },
  {
  id: 20113,
  
  name: "Kel'Thuzad",
  manaCost: 8,
  
  attack: 6,
  health: 8,
  
  type: "minion",
  rarity: "legendary",
  
  description: "At the end of each turn, summon all friendly minions that died this turn.",
  flavorText: "Kel'Thuzad could not resist the call of the Frozen Throne. Unfortunately, his bones made clunking sounds all the way up the Citadel steps.",
  keywords: [],
  
  heroClass: "neutral", // Special handling in game logic for end-of-turn resurrection
  class: "Neutral",
      collectible: true
  },
  {
  id: 20114,
  
  name: "Chromaggus",
  manaCost: 8,
  
  attack: 6,
  health: 8,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever you draw a card, add a copy of it to your hand.",
  flavorText: "Left head and right head can never agree about what to eat for dinner, so they always end up just eating whatever is closest.",
  keywords: [],
  
  heroClass: "neutral",
  race: "dragon",
  
  
  // Special handling in game logic for card copying
  class: "Neutral",
      collectible: true
  },
  {
      id: 20115,

      name: "Nefarian",
      manaCost: 9,

      attack: 8,
      health: 8,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Add 2 random spells from your opponent's class to your hand.",
      flavorText: "Nefarian really enjoyed the social scene in Blackrock Mountain. He was voted 'Most Popular' among the other bosses.",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",

      race: "dragon",
      collectible: true,

                  battlecry: {
        type: "discover",

          requiresTarget: false,
      targetType: "none",

      discoveryType: "spell",
      discoveryClass: "opponent_class",

      discoveryCount: 2
    }
    },
  {
      id: 20116,

      name: "Chillmaw",
      manaCost: 7,

      attack: 6,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Taunt. Deathrattle: If you're holding a Dragon, deal 3 damage to all minions.",
      flavorText: "So chilly that his breath smells like frozen burritos.",

      keywords: ["taunt", "deathrattle"],
      heroClass: "neutral",
      class: "Neutral",

      race: "dragon",

      deathrattle: {
        type: "damage",

        targetType: "all_minions",
      value: 3,

      condition: "holding_dragon"
    }
    },
  {
      id: 20117,

      name: "Anomalus",
      manaCost: 8,

      attack: 8,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Deal 8 damage to all minions.",
    flavorText: "He's huge! He's horned! He's... well, actually there aren't many normal things about him.",
      keywords: ["deathrattle"],

      heroClass: "mage",
      class: "Mage",
      race: "elemental",
      deathrattle: {
        type: "damage",
      targetType: "all_minions",

      value: 8
    }
    },
  {
      id: 20118,

      name: "Cho'gall",
      manaCost: 7,

      attack: 7,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: The next spell you cast this turn costs Health instead of Mana.",
    flavorText: "Even after all this time, Gul'dan still makes Cho'gall pay half the rent.",
      keywords: ["battlecry"],

      heroClass: "warlock",
      class: "Warlock",
      collectible: true,

                  battlecry: {
        type: "buff",

          requiresTarget: false,
      targetType: "none",

      temporaryEffect: true,
        buffAttack: 1,

        buffHealth: 1
    
    
    }
    },
  {
  id: 20119,
  
  name: "Æsir the Ascended",
  manaCost: 5,
  
  attack: 4,
  health: 6,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever your spells deal damage, restore that much Health to your hero.",
  flavorText: "It's like his mom always said: \"Play with fire and you'll heal for 3 to 5 damage.\"",
  
  keywords: [],
  heroClass: "shaman",
  race: "elemental",
  
  // Special handling in game logic for healing effect
  class: "Shaman",
  },
  {
      id: 20120,

      name: "Twin Emperor Vek'lor",
      manaCost: 7,

      attack: 4,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If your C'Thun has at least 10 Attack, summon a copy of this minion.",
    flavorText: "Do they make decisions based on age? \"You're two minutes older Vek'lor, you decide what we're getting Vek'nilash for his birthday.\"",
    keywords: ["battlecry", "taunt"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "summon_copy",


        requiresTarget: false,

      targetType: "none",
      condition: "cthun_10_attack"

       }
    },
  {
      id: 20121,

      name: "Mímir the Keeper",
      manaCost: 7,

      attack: 4,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Taunt. Battlecry: Draw a Beast, Dragon, and Murloc from your deck.",
    flavorText: "Mímir the Keeper is a guardian of ancient wisdom who curates relics from all realms. Also, he can fly.",
    keywords: ["taunt", "battlecry"],
      heroClass: "neutral",
      class: "Neutral",

      race: "automaton",

                  battlecry: {
        type: "draw_by_type",

          requiresTarget: false,
      targetType: "none",

      drawTypes: ["beast", "dragon", "murloc"],
    }
    },
  {
      id: 20122,

      name: "Óðinn's Guardian",
      manaCost: 8,

      attack: 7,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Equip Atiesh, Greatstaff of the Guardian.",
    flavorText: "He is a Guardian, and a Guardian watches... other Guardians... guard things.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      collectible: true,

                  battlecry: {
        type: "equip_weapon",

          requiresTarget: false,
      targetType: "none",

      summonCardId: 20123 // Atiesh
    }
    },
  {
  id: 20123,
  
  name: "Atiesh, Greatstaff of the Guardian",
  manaCost: 3,
  
  attack: 1,
  durability: 3,
  
  type: "weapon",
  rarity: "legendary",
  
  description: "After you cast a spell, summon a random minion of the same Cost. Lose 1 Durability.",
  flavorText: "Óðinn's staff is ancient and powerful... and also was the inspiration for his most famous recipe: Mead with honey.",
  
  keywords: [],
  heroClass: "neutral",
  // Special handling in game logic for spell effect
  class: "Neutral"
  },
  {
  id: 20124,
  
  name: "Genzo, the Shark",
  manaCost: 4,
  
  attack: 5,
  health: 4,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever this attacks, both players draw until they have 3 cards.",
  flavorText: "The only thing he hates more than a fair fight is competition for his collection of vintage spoons.",
  
  keywords: [],
  heroClass: "neutral", // Special handling in game logic for card drawing
  class: "Neutral",
      collectible: true
  },
  {
      id: 20125,

      name: "Artemis Shadowpaw",
      manaCost: 6,

      attack: 5,
      health: 3,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry and   Deathrattle: Summon a Yggdrasil Golem.",
    flavorText: "Though young, clever and deadly, Aya still has a soft spot for stuffed animals. And for using them to smuggle contraband.",
    keywords: ["battlecry", "deathrattle"],
      heroClass: "neutral",
      class: "Neutral",
      collectible: true,
                  battlecry: {
        type: "summon",


        requiresTarget: false,

      targetType: "none",
      summonCardId: -1 // Special handling for Yggdrasil Golem mechanic

       },
      deathrattle: {
        type: "summon",
      targetType: "none",

      summonCardId: -1 // Special handling for Yggdrasil Golem mechanic
    }
    },
  {
      id: 20126,

      name: "Argus White-Eye",
      manaCost: 5,

      attack: 5,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Taunt.   Deathrattle: Shuffle 'The Storm Guardian' into your deck.",
    flavorText: "He sees the future, and in it he sees... DESTRUCTION... and then more destruction... and then dancing bananas for some reason.",
    keywords: ["taunt", "deathrattle"],
      heroClass: "shaman",
      class: "Shaman",
      deathrattle: {
        type: "shuffle",
      targetType: "none",

      summonCardId: 20127 // The Storm Guardian
    }
    },
  {
  id: 20127,
  
  name: "The Storm Guardian",
  manaCost: 5,
  
  attack: 10,
  health: 10,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Taunt",
  flavorText: "The gatekeeper of his ancestral homeland. Don't knock if he's napping.",
  
  keywords: ["taunt"],
  heroClass: "shaman",
      class: "Shaman"
  },
  {
      id: 20128,

      name: "Ladon, Guardian Wyrm",
      manaCost: 9,

      attack: 8,
      health: 8,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Fill your board with 1/1 Whelps.",
      flavorText: "They say that many whelps handle her with care and respect. But that's because they don't want to get VOLED BY FIFTY DKP MINUS!",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",

      race: "dragon",
      collectible: true,

                  battlecry: {
        type: "fill_board",

          requiresTarget: false,
      targetType: "none",

      summonCardId: 20129 // Whelp
    }
    },
  {
  id: 20129,
  
  name: "Whelp",
  manaCost: 1,
  
  attack: 1,
  health: 1,
  
  type: "minion",
  rarity: "common",
  
  description: "A young dragon learning to breathe fire.",
  flavorText: "A baby dragon. Aww, it's so cute! And deadly.",
  keywords: [],
  
  heroClass: "neutral",
  race: "dragon",
      class: "Neutral"
  },
  {
  id: 20130,
  
  name: "Atlas the Unbroken",
  manaCost: 8,
  
  attack: 7,
  health: 7,
  
  type: "minion",
  rarity: "legendary",
  
  description: "At the end of each turn, gain +1/+1.",
  flavorText: "The titan who bears the weight of worlds grows ever stronger.",
  keywords: [],
  
  heroClass: "neutral", // Special handling in game logic for growth effect
  class: "Neutral",
      collectible: true
  },
  {
  id: 20131,
  
  name: "Fenrisúlfr the Ravager",
  manaCost: 6,
  
  attack: 4,
  health: 4,
  
  type: "minion",
  rarity: "legendary",
  
  description: "At the end of your turn, summon a 2/2 Wolf with Taunt.",
  flavorText: "The great wolf who will devour Odin at Ragnarök.",
  keywords: [],
  
  heroClass: "neutral", // Special handling in game logic for Gnoll summoning
  class: "Neutral",
      collectible: true
  },
  {
  id: 20132,
  
  name: "Typhon, Storm Titan",
  manaCost: 6,
  
  attack: 7,
  health: 5,
  
  type: "minion",
  rarity: "legendary",
  
  description: "After you play a card, summon a 2/1 Storm Spawn.",
  flavorText: "Father of all monsters, his very presence spawns chaos.",
  keywords: [],
  
  heroClass: "neutral",
  race: "titan",
  
  
  // Special handling in game logic for Flame summoning
  class: "Neutral",
      collectible: true
  },
  {
      id: 20133,

      name: "The Beast",
      manaCost: 6,

      attack: 9,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Summon a 3/3 Finkle Einhorn for your opponent.",
      flavorText: "He lives in Blackrock Mountain. He eats adventurers.",

      keywords: ["deathrattle"],
      heroClass: "neutral",
      class: "Neutral",

      race: "beast",
      collectible: true,

      deathrattle: {
        type: "summon",

        targetType: "none",
    summonCardId: 20134, // Finkle Einhorn
      // Special handling for summoning for opponent will be in deathrattle code
      condition: "summon_for_opponent"

       }
    },
  {
  id: 20134,
  
  name: "Finkle Einhorn",
  manaCost: 3,
  
  attack: 3,
  health: 3,
  
  type: "minion",
  rarity: "common",
  
  description: "A legendary hunter of great renown.",
  flavorText: "Pierce and Einhorn. Einhorn and Pierce.",
  
  keywords: [],
  heroClass: "neutral",
      class: "Neutral"
  },
  {
      id: 20135,

      name: "Hanuman the Wild",
      manaCost: 3,

      attack: 5,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Give your opponent 2 Bananas.",
    flavorText: "The divine monkey god shares his bounty, for better or worse.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      race: "beast",
      collectible: true,
                  battlecry: {
        type: "give_cards",


        requiresTarget: false,

      targetType: "none",
      cardCount: 2,

      cardId: 20136, // Banana
      giveToOpponent: true

       }
    },
  {
      id: 20136,

      name: "Bananas",
      manaCost: 1,

      type: "spell",
      rarity: "common",

      description: "Give a minion +1/+1.",
    flavorText: "Mukla's favorite food, and a great source of potassium!",
      keywords: [],

      heroClass: "neutral",
      class: "Neutral",

      spellEffect: {
        type: "buff",

        targetType: "any_minion",
      requiresTarget: true,

      buffAttack: 1,
      buffHealth: 1

       }
    },
  {
      id: 20137,

      name: "Ægir Greenwave",
      manaCost: 5,

      attack: 5,
      health: 4,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Give your weapon +1/+1.",
    flavorText: "He was suppose to be a captain of a pirate ship. Instead, he's a mech, which makes NO SENSE. He doesn't even have a parrot.",
      keywords: ["battlecry"],

      heroClass: "neutral",
      class: "Neutral",
      race: "einherjar",
      collectible: true,
                  battlecry: {
        type: "buff_weapon",


        requiresTarget: false,

      targetType: "none",
      buffAttack: 1,

      buffDurability: 1
    }
    },
  {
      id: 20138,

      name: "Skadi the Mighty",
      manaCost: 5,

      attack: 5,
      health: 5,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Give both players the power to ROCK! (with a Power Chord card)",
      flavorText: "He's looking for a drumset.",

      keywords: ["battlecry"],
      heroClass: "neutral",
      class: "Neutral",
                  battlecry: {
        type: "give_cards",


        requiresTarget: false,

      targetType: "none",
      cardCount: 1,

      giveToOpponent: true,
      randomCardFromSet: true

      // Special handling for Power Chord cards
    }
  }
      ];

// Export the iconic legendary cards
export default iconicLegendaryCards;