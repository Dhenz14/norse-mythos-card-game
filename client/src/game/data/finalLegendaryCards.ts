/**
 * Final batch of legendary cards for Hearthstone clone
 * Powerful and unique cards from various Hearthstone expansions
 */
import { CardData } from '../types';

/**
 * Collection of final legendary cards
 * Includes some of the most impactful legendary cards from Hearthstone
 */
export const finalLegendaryCards: CardData[] = [
  {
    id: 20611,
    name: "Fenrir",
    manaCost: 9,
    attack: 8,
    health: 8,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy all enemy minions with 5 or less Attack. Deathrattle: If destroyed by a spell or Hero Power, summon a 12/12 Fenrir, the Worldbreaker.",
    flavorText: "Bound by chains of fate, his howl heralds the end of all things.",
    keywords: ["battlecry", "deathrattle"],
    heroClass: "neutral", 
    class: "Neutral", 
    race: "beast",
    collectible: true,
    battlecry: {
      type: "destroy",
      targetType: "enemy_minions_with_condition",
      condition: "attack_less_than",
      conditionValue: 6
    },
    deathrattle: {
      type: "conditional_summon",
      targetType: "none",
      condition: "killed_by_spell_or_hero_power",
      summonCardId: 20612
    }
  },
  {
    id: 20612,
    name: "Fenrir, the Worldbreaker",
    manaCost: 12,
    attack: 12,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "Can't be targeted by spells or Hero Powers.",
    flavorText: "The chains have broken, and with them, the fate of the world.",
    keywords: [],
    heroClass: "neutral", 
    class: "Neutral", 
    race: "beast",
    collectible: false,
    cantBeTargetedBySpells: true
  },
  {
    id: 20601,
    name: "Talos, Doom Construct",
    manaCost: 10,
    attack: 10,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Deathrattle: If you have no cards in your deck, hand, and battlefield, destroy the enemy hero.",
    flavorText: "The scientific community was shocked when Dr. Boom's latest creation analyzed its purpose in the world and decided that that purpose was to ANNIHILATE ALL LIVING THINGS.",
    keywords: ["deathrattle"],
    heroClass: "neutral", 
    class: "Neutral", 
    race: "automaton",
    collectible: true,
    deathrattle: {
      type: "destroy",
      targetType: "enemy_hero",
      condition: "empty_deck_hand_board"
    }
  },
  {
    id: 20602,
    name: "Fenrir, Soul Flayer",
    manaCost: 10,
    attack: 9,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Deathrattle: Shuffle a Corrupted Blood into each player's deck.",
    flavorText: "The only thing Hakkar likes more than souls is moist towelettes.",
    keywords: ["deathrattle"],
    heroClass: "neutral", 
    class: "Neutral",
    collectible: true,
    deathrattle: {
      type: "shuffle_card",
      targetType: "both_decks",
      condition: "corrupted_blood",
      value: 1
    }
  },
  {
    id: 20603,
    name: "King Fafnir",
    manaCost: 8,
    attack: 5,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Swap decks with your opponent. Give them a Ransom spell to swap back.",
    flavorText: "Kobolds have a complex social hierarchy based on who has the shiniest stuff.",
    keywords: ["battlecry"],
    heroClass: "neutral", 
    class: "Neutral",
    collectible: true,
    battlecry: {
      type: "swap_decks",
      requiresTarget: false,
      targetType: "none",
      giveRansom: true
    }
  },
  {
    id: 20604,
    name: "Icarus, Sky Pirate",
    manaCost: 7,
    attack: 4,
    health: 6,
    type: "minion",
    rarity: "legendary",
    description: "Charge. Costs (1) less for each friendly Pirate.",
    flavorText: "What's more boss than riding a parrot with a jawbone for a shoulderpad while wielding a giant hook-lance-thing and wearing a pirate hat? NOTHING.",
    keywords: ["charge"],
    heroClass: "neutral", 
    class: "Neutral",
    race: "einherjar",
    collectible: true,
    costModifier: {
      type: "friendly_minion_count",
      value: -1,
      condition: "pirate_only"
    }
  },
  {
    id: 20605,
    name: "Ran's Champion",
    manaCost: 4,
    attack: 2,
    health: 4,
    type: "minion",
    rarity: "legendary",
    description: "Charge. Has +1 Attack for each other Murloc on the battlefield.",
    flavorText: "He's a legend among murlocs. He leads raids on coastal towns. He knows all the fishing spots. He's Ran's Champion!",
    keywords: ["charge"],
    heroClass: "neutral", 
    class: "Neutral",
    race: "naga",
    collectible: true,
    dynamicAttack: {
      type: "minion_count",
      value: 1,
      condition: "other_murlocs"
    }
  },
  {
    id: 20606,
    name: "Daedalus the Inventor",
    manaCost: 3,
    attack: 3,
    health: 3,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Transform another random minion into a 5/5 Minotaur or a 1/1 Mouse.",
    flavorText: "The legendary craftsman's inventions are unpredictable at best.",
    keywords: ["battlecry"],
    heroClass: "neutral", 
    class: "Neutral",
    collectible: true,
    battlecry: {
      type: "transform_random",
      requiresTarget: false,
      targetType: "random_minion",
      transformOptions: ["devilsaur", "squirrel"]
    }
  },
  {
    id: 20607,
    name: "Njörðr the Fisher",
    manaCost: 2,
    attack: 0,
    health: 4,
    type: "minion",
    rarity: "legendary",
    description: "At the start of your turn, you have a 50% chance to draw an extra card.",
    flavorText: "The Norse god of the sea and fishing, his catch is always legendary.",
    keywords: [],
    heroClass: "neutral",
    class: "Neutral",
    collectible: true
    // Special handling for 50% chance to draw
  },
  {
    id: 20608,
    name: "Ares, the Impaler",
    manaCost: 4,
    attack: 4,
    health: 4,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: If you have at least 4 other minions, deal 4 damage.",
    flavorText: "The Crowd Favorite. The Ogre Poker. The Grand Tournament Champion. The Impaler.",
    keywords: ["battlecry"],
    heroClass: "neutral", 
    class: "Neutral",
    collectible: true,
    battlecry: {
      type: "damage",
      requiresTarget: true,
      targetType: "any",
      value: 4,
      condition: "minion_count",
      conditionValue: 4
    }
  },
  {
    id: 20609,
    name: "The Primordial Dark",
    manaCost: 4,
    attack: 20,
    health: 20,
    type: "minion",
    rarity: "legendary",
    description: "Starts dormant. Battlecry: Shuffle 3 Candles into the enemy deck. When drawn, this awakens.",
    flavorText: "It stirs beneath the dark places of the world. It does not sleep. It does not forgive.",
    keywords: ["battlecry", "dormant"],
    heroClass: "neutral", 
    class: "Neutral",
    collectible: true,
    battlecry: {
      type: "shuffle_card",
      requiresTarget: false,
      targetType: "enemy_deck",
      cardName: "Darkness Candle",
      value: 3
    }
  },
  {
    id: 20400,
    name: "The Binding One",
    manaCost: 10,
    attack: 12,
    health: 12,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Destroy all other minions. Steal your opponent's deck.",
    flavorText: "You may imprison only five minions, but you may imprison a whole deck.",
    keywords: ["battlecry"],
    heroClass: "neutral", 
    class: "Neutral",
    collectible: true,
    battlecry: {
      type: "destroy_and_steal",
      requiresTarget: false,
      targetType: "all_other_minions"
      // Special handling for deck stealing
    }
  },
  {
    id: 20401,
    name: "Ares, Blood Sworn",
    manaCost: 2,
    attack: 2,
    health: 2,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Shuffle 'The First Seal' into your deck.",
    flavorText: "Unlike a blood oath written in ink, his is most definitely written in blood.",
    keywords: ["battlecry"],
    heroClass: "neutral", 
    class: "Neutral",
    collectible: true,
    battlecry: {
      type: "shuffle_card",
      requiresTarget: false,
      targetType: "none",
      cardName: "The First Seal"
      // Special handling for Astalor progression cards
    }
  },
  {
    id: 20402,
    name: "Bragi, Battle Conductor",
    manaCost: 5,
    attack: 5,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "After you play a minion, give your minions +1 Attack and deal 1 damage to all enemies this turn.",
    flavorText: "The band's been booked at the Darkmoon Faire for a 30-night residency. And also death. Forever.",
    keywords: [],
    heroClass: "warrior", 
    // Special handling for band manager effect
    class: "Warrior",
    collectible: true
  },
  {
    id: 20403,
    name: "Hel, the Accused",
    manaCost: 5,
    attack: 5,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: For the rest of the game, after a friendly minion dies, deal 2 damage to a random enemy minion.",
    flavorText: "She's been accused of many things: betrayal, murder, crimes of fashion, but worst of all, having a predictable writing arc.",
    keywords: ["battlecry"],
    heroClass: "hunter", 
    class: "Hunter",
    collectible: true,
    battlecry: {
      type: "persistent_effect",
      requiresTarget: false,
      targetType: "none",
      triggerCondition: "friendly_death",
      effectType: "random_damage",
      damage: 2,
      targetType2: "random_enemy_minion"
    }
  },
  {
    id: 20404,
    name: "Sleipnir, the Immortal",
    manaCost: 7,
    attack: 7,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Rush, Divine Shield. Can't be targeted by spells or Hero Powers.",
    flavorText: "I can't see it. Can you see it? I can't see it.",
    keywords: ["rush", "divine_shield"],
    heroClass: "paladin", 
    race: "beast",
    class: "Paladin",
    collectible: true,
    cantBeTargetedBySpells: true
  },
  {
    id: 20405,
    name: "Flint Firearm",
    manaCost: 6,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "After you cast a spell, deal 2 damage to a random enemy.",
    flavorText: "After you cast a spell, he says 'Flint FIRE arm' and shoots at a random enemy.",
    keywords: [],
    heroClass: "mage", 
    // Special handling for spell trigger effect
    class: "Mage",
    collectible: true
  },
  {
    id: 20406,
    name: "Toy Captain Tarim",
    manaCost: 6,
    attack: 3,
    health: 7,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Set all other minions' Attack and Health to 3.",
    flavorText: "The original Captain Tarim was too dangerous for action figures. Captain Plushy Toy is much more kid-friendly.",
    keywords: ["battlecry"],
    heroClass: "paladin", 
    class: "Paladin",
    collectible: true,
    battlecry: {
      type: "set_stats",
      requiresTarget: false,
      targetType: "all_other_minions",
      setAttack: 3,
      setHealth: 3
    }
  },
  {
    id: 20407,
    name: "Zok Fogsnout",
    manaCost: 5,
    attack: 4,
    health: 5,
    type: "minion",
    rarity: "legendary",
    description: "Battlecry: Add a Mass Polymorph to your hand. It costs (1).",
    flavorText: "She's always preferred 'herd' shaman tactics over the more traditional approach.",
    keywords: ["battlecry"],
    heroClass: "shaman", 
    class: "Shaman",
    collectible: true,
    battlecry: {
      type: "add_card",
      requiresTarget: false,
      targetType: "none",
      cardName: "Mass Polymorph",
      costReduction: 1
    }
  },
  {
    id: 20408,
    name: "Gaia, Stone Mother",
    manaCost: 8,
    attack: 5,
    health: 10,
    type: "minion",
    rarity: "legendary",
    description: "Taunt. At the end of your turn, summon a 2/3 Elemental with Taunt.",
    flavorText: "She's the mother of all stone elementals, but she's never taken a single one of them for granite.",
    keywords: ["taunt"],
    heroClass: "shaman", 
    race: "elemental",
    // Special handling for end of turn summoning
    class: "Shaman",
    collectible: true
  },
  {
    id: 20409,
    name: "Mass Polymorph",
    manaCost: 7,
    type: "spell",
    rarity: "rare",
    description: "Transform all minions into 1/1 Sheep.",
    flavorText: "One minute you're a fearsome army, the next minute you're counting sheep.",
    keywords: [],
    heroClass: "shaman", 
    class: "Shaman",
    collectible: false,
    spellEffect: {
      type: "transform_all",
      targetType: "all_minions",
      summonCardId: 14010 // Sheep token
    }
  },
  {
    id: 20410,
    name: "The First Seal",
    manaCost: 3,
    type: "spell",
    rarity: "legendary",
    description: "Draw a card. Shuffle 'The Second Seal' into your deck.",
    flavorText: "Breaking the first seal isn't so bad. It's the later ones you need to worry about.",
    keywords: [],
    heroClass: "neutral", 
    class: "Neutral",
    collectible: false,
    spellEffect: {
      type: "draw_and_shuffle",
      value: 1,
      shuffleCardName: "The Second Seal"
    }
  }
];

export default finalLegendaryCards;