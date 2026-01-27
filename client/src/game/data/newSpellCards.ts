/**
 * New spell cards for Hearthstone clone
 * Collection of spells for all classes with various effects
 */
import { CardData } from '../types';

/**
 * Collection of new spell cards to be added
 */
export const newSpellCards: CardData[] = [
  {
    id: 50002,
    name: "Nature's Guidance",
    manaCost: 2,
    type: "spell",
    rarity: "common",
    description: "Choose One - Draw a card; or Return a friendly minion to your hand, it costs (2) less.",
    heroClass: "druid", 
    keywords: ["choose_one"],
    class: "Druid",
    collectible: true
  }
];