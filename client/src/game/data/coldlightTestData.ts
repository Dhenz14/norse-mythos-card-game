import { CardData } from '../types';

// Define Coldlight Seer card with a buff_tribe battlecry effect
export const coldlightSeer: CardData = {
  id: 91001,
  name: "Coldlight Seer",
  description: "Battlecry: Give ALL your other Murlocs +2 Health.",
  flavorText: "The Coldlight murlocs live in the darkest depths of the sea, and have developed the ability to see using phosphorescent light.",
  type: "minion",
  rarity: "rare",
  manaCost: 3,
  attack: 2,
  health: 3,
  race: "Murloc",
  battlecry: {
    type: "buff_tribe",
    tribe: "Murloc",
    buffs: {
      health: 2
    },
    targetType: "friendly_minion"
  },
  class: "Neutral",
  collectible: true
};

// Define a few murloc minions to use with Coldlight Seer
export const murlocTidehunter: CardData = {
  id: 91002,
  name: "Sea Sprite Hunter",
  description: "Battlecry: Summon a 1/1 Murloc Scout.",
  flavorText: "He's tried to get his Murloc Scout to wear pants, but the scout insists that he 'likes the freedom'.",
  type: "minion",
  rarity: "common",
  manaCost: 2,
  attack: 2,
  health: 1,
  race: "Murloc",
  class: "Neutral",
  collectible: true
};

export const murlocScout: CardData = {
  id: 91003,
  name: "Sea Sprite Scout",
  description: "",
  type: "minion",
  rarity: "common",
  manaCost: 1,
  attack: 1,
  health: 1,
  race: "Murloc",
  class: "Neutral",
  collectible: false
};

export const bluegillWarrior: CardData = {
  id: 91004,
  name: "Bluegill Warrior",
  description: "Charge",
  flavorText: "He's from the tropical region of Stranglethorn Vale (He's a tourist).",
  type: "minion",
  rarity: "common",
  manaCost: 2,
  attack: 2,
  health: 1,
  race: "Murloc",
  keywords: ["charge"],
  class: "Neutral",
  collectible: true
};

// Non-murloc minion to test tribe filtering
export const riverCrocolisk: CardData = {
  id: 91005,
  name: "Sobek's Spawn",
  description: "",
  flavorText: "Floated down the river eating gnomes, but mostly just rocks and wood.",
  type: "minion",
  rarity: "common",
  manaCost: 2,
  attack: 2,
  health: 3,
  race: "Beast",
  class: "Neutral",
  collectible: true
};

// Export all test cards
export const testCards = [
  coldlightSeer, 
  murlocTidehunter, 
  murlocScout, 
  bluegillWarrior,
  riverCrocolisk
];