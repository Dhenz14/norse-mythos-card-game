/**
 * Yggdrasil Golem Cards
 * 
 * Migrated from client/src/game/data/jadeGolemCards.ts on 2026-02-02
 * Contains the Yggdrasil Golem mechanic cards that summon increasingly larger golems
 * for each one summoned during the game
 * 
 * ID Range: 85001001-85101
 */
import { CardData } from '../../../../../types';

export const yggdrasilGolemCards: CardData[] = [
  {
    id: 85001001,
    name: "Summon Yggdrasil Golem",
    manaCost: 0,
    description: "Summon a Yggdrasil Golem.",
    flavorText: "From the roots of the World Tree, a guardian emerges.",
    type: "spell",
    rarity: "common",
    spellEffect: { type: "summon_jade_golem" },
    collectible: true,
    class: "Neutral",
    set: "core"
  },
  {
    id: 85001002,
    name: "Shuffle 3 Copies",
    manaCost: 0,
    description: "Shuffle 3 copies of this card into your deck.",
    flavorText: "The seeds of Yggdrasil multiply endlessly.",
    type: "spell",
    rarity: "common",
    spellEffect: { type: "shuffle_copies", count: 3, targetCardId: 85001 },
    class: "Neutral",
    set: "core",
    collectible: true
  },
  {
    id: 85005,
    name: "Jade Swarmer",
    manaCost: 2,
    attack: 1,
    health: 1,
    description: "Stealth. Deathrattle: Summon a Yggdrasil Golem.",
    flavorText: "The jade serpent strikes from the shadows of Yggdrasil.",
    type: "minion",
    rarity: "common",
    class: "Rogue",
    keywords: ["stealth", "deathrattle", "jade_golem"],
    deathrattle: {
      type: "summon_jade_golem"
    },
    set: "core",
    collectible: true
  }
];

export const yggdrasilGolemTokens: CardData[] = [
  {
    id: 85101,
    name: "Yggdrasil Golem",
    manaCost: 1,
    attack: 1,
    health: 1,
    description: "Summoned by Yggdrasil Golem effects. Grows larger with each Yggdrasil Golem summoned.",
    flavorText: "A living fragment of the World Tree, growing ever stronger.",
    type: "minion",
    rarity: "common",
    class: "Neutral",
    keywords: [],
    set: "core",
    collectible: false
  }
];

export const allYggdrasilGolemCards: CardData[] = [
  ...yggdrasilGolemCards,
  ...yggdrasilGolemTokens
];
