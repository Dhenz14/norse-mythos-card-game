import { CardData } from '../../../../../types';

export { warriorCards } from './warrior';
export { mageCards } from './mage';
export { hunterCards } from './hunter';
export { paladinCards } from './paladin';
export { priestCards } from './priest';
export { rogueCards } from './rogue';
export { shamanCards } from './shaman';
export { warlockCards } from './warlock';
export { druidCards } from './druid';
export { demonhunterCards } from './demonhunter';
export { deathknightCards } from './deathknight';
export { necromancerCards } from './necromancer';

import { warriorCards } from './warrior';
import { mageCards } from './mage';
import { hunterCards } from './hunter';
import { paladinCards } from './paladin';
import { priestCards } from './priest';
import { rogueCards } from './rogue';
import { shamanCards } from './shaman';
import { warlockCards } from './warlock';
import { druidCards } from './druid';
import { demonhunterCards } from './demonhunter';
import { deathknightCards } from './deathknight';
import { necromancerCards } from './necromancer';

export const allClassCards: CardData[] = [
  ...warriorCards,
  ...mageCards,
  ...hunterCards,
  ...paladinCards,
  ...priestCards,
  ...rogueCards,
  ...shamanCards,
  ...warlockCards,
  ...druidCards,
  ...demonhunterCards,
  ...deathknightCards,
  ...necromancerCards
];
