/**
 * Death Knight Hero Cards
 * 
 * Migrated from client/src/game/data/heroCards.ts on 2026-02-02
 * Contains hero transformation cards from Knights of the Frozen Throne expansion
 * These cards replace your current hero and hero power when played
 * 
 * ID Range: 10501-10603
 */
import { CardData, HeroPower } from '../../../../../types';

const deathstalkerHeroPower: HeroPower = {
  name: "Build-a-Beast",
  description: "Craft a custom Zombeast.",
  cost: 2,
  used: false,
  class: "hunter"
};

const frostLichHeroPower: HeroPower = {
  name: "Icy Touch",
  description: "Deal 1 damage. If this kills a minion, summon a Water Elemental.",
  cost: 2,
  used: false,
  class: "mage"
};

const scourgelordHeroPower: HeroPower = {
  name: "Bladestorm",
  description: "Deal 1 damage to all minions.",
  cost: 2,
  used: false,
  class: "warrior"
};

const lightforgedHeroPower: HeroPower = {
  name: "The Four Horsemen",
  description: "Summon a 2/2 Horseman. If you have all 4, destroy the enemy hero.",
  cost: 2,
  used: false,
  class: "paladin"
};

export const deathKnightHeroCards: CardData[] = [
  {
    id: 10501,
    name: "Deathstalker Rexxar",
    manaCost: 6,
    description: "Battlecry: Deal 2 damage to all enemy minions.",
    flavorText: "The eternal hunter becomes one with death itself.",
    rarity: "legendary",
    type: "hero",
    class: "Hunter",
    set: "core",
    collectible: true,
    heroPower: deathstalkerHeroPower
  },
  {
    id: 10502,
    name: "Frost Lich Jaina",
    manaCost: 9,
    description: "Battlecry: Summon a 3/6 Water Elemental. Your Elementals have Lifesteal this game.",
    flavorText: "The ice queen rises, commanding the chill of death.",
    rarity: "legendary",
    type: "hero",
    class: "Mage",
    set: "core",
    collectible: true,
    heroPower: frostLichHeroPower
  },
  {
    id: 10503,
    name: "Scourgelord Garrosh",
    manaCost: 8,
    description: "Battlecry: Equip a 4/3 Shadowmourne that also damages adjacent minions.",
    flavorText: "The warchief embraces the power of the Scourge.",
    rarity: "legendary",
    type: "hero",
    class: "Warrior",
    set: "core",
    collectible: true,
    heroPower: scourgelordHeroPower
  },
  {
    id: 10504,
    name: "Uther of the Ebon Blade",
    manaCost: 9,
    description: "Battlecry: Equip a 5/3 Lifesteal weapon.",
    flavorText: "The paladin falls, reborn as a champion of darkness.",
    rarity: "legendary",
    type: "hero",
    class: "Paladin",
    set: "core",
    collectible: true,
    heroPower: lightforgedHeroPower
  }
];

export const deathKnightHeroTokens: CardData[] = [
  {
    id: 10601,
    name: "Shadowmourne",
    manaCost: 8,
    attack: 4,
    durability: 3,
    description: "Also damages minions adjacent to whomever your hero attacks.",
    flavorText: "Forged from the souls of the innocent.",
    rarity: "legendary",
    type: "weapon",
    keywords: [],
    class: "Warrior",
    set: "core",
    collectible: false
  },
  {
    id: 10602,
    name: "Grave Vengeance",
    manaCost: 9,
    attack: 5,
    durability: 3,
    description: "Wielded by Uther of the Ebon Blade.",
    flavorText: "A blade cursed with the power to drain life.",
    rarity: "legendary",
    type: "weapon",
    keywords: ["lifesteal"],
    class: "Paladin",
    set: "core",
    collectible: false
  },
  {
    id: 10603,
    name: "Horseman",
    manaCost: 2,
    attack: 2,
    health: 2,
    description: "Summoned by Uther of the Ebon Blade's hero power.",
    flavorText: "One of the Four Horsemen of the Apocalypse.",
    rarity: "legendary",
    type: "minion",
    keywords: [],
    class: "Paladin",
    set: "core",
    collectible: false
  }
];

export const allDeathKnightHeroCards: CardData[] = [
  ...deathKnightHeroCards,
  ...deathKnightHeroTokens
];
