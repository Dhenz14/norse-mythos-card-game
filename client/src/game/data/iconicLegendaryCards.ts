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
      id: 95101,

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
      id: 95102,

      name: "Jormungandr, Echo Serpent",
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
  id: 95103,
  
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
      id: 95104,

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
  id: 95105,
  
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
  id: 95106,
  
  name: "Triton, Flying Star",
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
  id: 95107,
  
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
  id: 95108,
  
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
      id: 95109,

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
      summonCardId: 95111 // Surtr's Creation

       }
    },
  {
      id: 95110,

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

      summonCardId: 95111 // Surtr's Creation
    }
    },
  {
  id: 95111,
  
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
  id: 95112,
  
  name: "Archlich of Niflheim",
  manaCost: 8,
  
  attack: 6,
  health: 8,
  
  type: "minion",
  rarity: "legendary",
  
  description: "At the end of each turn, summon all friendly minions that died this turn.",
  flavorText: "The archlich could not resist the call of Niflheim. Unfortunately, his bones made clunking sounds all the way up the frozen steps.",
  keywords: [],
  
  heroClass: "neutral", // Special handling in game logic for end-of-turn resurrection
  class: "Neutral",
      collectible: true
  },
  {
  id: 95113,
  
  name: "Ladon, Chromatic Drake",
  manaCost: 8,
  
  attack: 6,
  health: 8,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever you draw a card, add a copy of it to your hand.",
  flavorText: "The hundred-headed dragon guards the golden apples. Each head has its own opinion on lunch.",
  keywords: [],
  
  heroClass: "neutral",
  race: "dragon",
  
  
  // Special handling in game logic for card copying
  class: "Neutral",
      collectible: true
  },
  {
      id: 95114,

      name: "Typhon, Dragon Lord",
      manaCost: 9,

      attack: 8,
      health: 8,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: Add 2 random spells from your opponent's class to your hand.",
      flavorText: "Father of all monsters, Typhon claims dominion over all dragons. The gods themselves once fled from his wrath.",

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
      id: 95115,

      name: "Skoll, Frost Wyrm",
      manaCost: 7,

      attack: 6,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Taunt. Deathrattle: If you're holding a Dragon, deal 3 damage to all minions.",
      flavorText: "The wolf who chases the sun will one day swallow it whole.",

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
      id: 95116,

      name: "Chaos Elemental",
      manaCost: 8,

      attack: 8,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Deal 8 damage to all minions.",
    flavorText: "Born from the primordial chaos, its death brings destruction to all around it.",
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
      id: 95117,

      name: "Orthrus, Two-Headed",
      manaCost: 7,

      attack: 7,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: The next spell you cast this turn costs Health instead of Mana.",
    flavorText: "The two-headed hound guards the gates with eternal vigilance. Each head argues about who's in charge.",
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
  id: 95118,
  
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
      id: 95119,

      name: "Twin Titan Kronos",
      manaCost: 7,

      attack: 4,
      health: 6,

      type: "minion",
      rarity: "legendary",

      description: "Battlecry: If your C'Thun has at least 10 Attack, summon a copy of this minion.",
    flavorText: "Time splits when the titan king demands it. One becomes two, and two become eternity.",
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
      id: 95120,

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
      id: 95121,

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

      summonCardId: 95122 // Atiesh
    }
    },
  {
  id: 95122,
  
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
  id: 95123,
  
  name: "Poseidon's Shark",
  manaCost: 4,
  
  attack: 5,
  health: 4,
  
  type: "minion",
  rarity: "legendary",
  
  description: "Whenever this attacks, both players draw until they have 3 cards.",
  flavorText: "The sea god's favored predator circles the battlefield, drawing fortune for all who witness its hunt.",
  
  keywords: [],
  heroClass: "neutral", // Special handling in game logic for card drawing
  class: "Neutral",
      collectible: true
  },
  {
      id: 95124,

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
      id: 95125,

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

      summonCardId: 95126 // The Storm Guardian
    }
    },
  {
  id: 95126,
  
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
      id: 95127,

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

      summonCardId: 95128 // Whelp
    }
    },
  {
  id: 95128,
  
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
  id: 95129,
  
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
  id: 95130,
  
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
  id: 95131,
  
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
      id: 95132,

      name: "The Nemean Beast",
      manaCost: 6,

      attack: 9,
      health: 7,

      type: "minion",
      rarity: "legendary",

      description: "Deathrattle: Summon a 3/3 Finkle Einhorn for your opponent.",
      flavorText: "Descended from the legendary Nemean Lion, its hide is impervious but its appetite knows no bounds.",

      keywords: ["deathrattle"],
      heroClass: "neutral",
      class: "Neutral",

      race: "beast",
      collectible: true,

      deathrattle: {
        type: "summon",

        targetType: "none",
    summonCardId: 95133, // Finkle Einhorn
      // Special handling for summoning for opponent will be in deathrattle code
      condition: "summon_for_opponent"

       }
    },
  {
  id: 95133,
  
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
      id: 95134,

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

      cardId: 95135, // Banana
      giveToOpponent: true

       }
    },
  {
      id: 95135,

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
      id: 95136,

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
      id: 95137,

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