/**
 * Central file to manage all card data in the Hearthstone clone
 * Aggregates cards from different mechanics and provides helper functions
 */
import { CardData, CardType, CardKeyword, HeroClass } from '../types';
import { discoverCards } from './discoverCards';
import { tradeableCards } from './tradeableCards';
import { inspireCards, inspireTokens } from './inspireCards';
import { dualClassCards } from './dualClassCards';
import { secretCards } from './secretCards';
import { adaptationOptions, adaptCards, adaptTokens } from './adaptCards';
import { recruitCards } from './recruitCards';
import { corruptCards } from './corruptCards';
import { getAllDiscoverPoolOptions } from './discoveryHelper';
import { questCards, questRewards, getAllQuestCards } from './questCards';
import { echoCards } from './echoCards';
import classMinions from './classMinions';
import legendaryCards from './legendaryCards';
import spellCards from './spellCards';
import { newSpellCards } from './newSpellCards';
import { mechanicCards, tokenCards as mechTokens } from './mechanicCards';
import { additionalSpellCards } from './additionalSpellCards';
import { additionalLegendaryCards } from './additionalLegendaryCards';
import { iconicLegendaryCards } from './iconicLegendaryCards';
import { expansionLegendaryCards } from './expansionLegendaryCards';
import { modernLegendaryCards } from './modernLegendaryCards';
import { finalLegendaryCards } from './finalLegendaryCards';
import { additionalClassMinions } from './additionalClassMinions';
import spellburstCards from './spellburstCards';
import rebornCards from './rebornCards';
import magneticCards from './magneticCards';
import frenzyCards from './frenzyCards';
import dormantCards from './dormantCards';
import outcastCards from './outcastCards';
import { allRushLifestealCards } from './rushLifestealCards';

// Import our new neutral card collections
import { neutralMinions } from './neutralMinions';
import { neutralSpellsAndTech } from './neutralSpellsAndTech';
import { specialEffectNeutrals } from './specialEffectNeutrals';

// Import Super Minions (hero-linked legendary minions)
import { heroSuperMinions } from './sets/superMinions/heroSuperMinions';

// Import the base card sets
import baseCards from './cards';

// Combining all the card collections
const allCards: CardData[] = [
   ...baseCards,
  ...discoverCards,
  ...tradeableCards,
  ...inspireCards,
  ...inspireTokens,
  ...dualClassCards,
  ...secretCards,
  ...adaptationOptions,
  ...adaptCards,
  ...adaptTokens,
  ...recruitCards,
  ...corruptCards,
  // Exclude discovery pool options as they're not full card objects
  ...questCards,
  ...questRewards,
  ...echoCards,
  ...classMinions,
  ...legendaryCards,
  ...spellCards,
  ...newSpellCards,
  ...mechanicCards,
  ...mechTokens,
  ...additionalSpellCards,
  ...additionalLegendaryCards,
  ...iconicLegendaryCards,
  ...expansionLegendaryCards,
  ...modernLegendaryCards,
  ...finalLegendaryCards,
  ...additionalClassMinions,
  ...spellburstCards,
  ...rebornCards,
  ...magneticCards,
  ...frenzyCards,
  ...dormantCards,
  ...outcastCards,
  ...allRushLifestealCards,
  // Add our new neutral card collections
  ...neutralMinions,
  ...neutralSpellsAndTech,
  ...specialEffectNeutrals,
  // Add Super Minions (hero-linked legendary minions with +2/+2 bonus)
  ...heroSuperMinions
];

// Find a card by ID
export const getCardById = (id: number): CardData | undefined => {
  return allCards.find(card => card.id === id);
};

// Filter cards by class
export const getCardsByClass = (className: HeroClass | 'neutral'): CardData[] => {
  return allCards.filter(card => {
    // Check for regular class cards
    if ('heroClass' in card && card.heroClass === className) {
      return true;
    }
    
    // Check for dual-class cards
    if (card.dualClassInfo && card.dualClassInfo.classes.includes(className as HeroClass)) {
      return true;
    }
    
    return false;
  });
};

// Filter cards by mechanic keyword
export const getCardsByKeyword = (keyword: CardKeyword): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes(keyword));
};

// Filter cards by type
export const getCardsByType = (type: CardType): CardData[] => {
  return allCards.filter(card => card.type === type);
};

// Get all tradeable cards
export const getTradeableCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('tradeable' as CardKeyword));
};

// Get all inspire cards
export const getInspireCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('inspire' as CardKeyword));
};

// Get all dual-class cards
export const getDualClassCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('dual_class' as CardKeyword));
};

// Get all discover cards
export const getDiscoverCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('discover' as CardKeyword));
};

// Get all quest cards
export const getQuestCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('quest' as CardKeyword));
};

// Get all echo cards
export const getEchoCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('echo' as CardKeyword));
};

// Get all class-specific minions
export const getClassMinions = (): CardData[] => {
  return classMinions;
};

// Get all legendary cards
export const getLegendaryCards = (): CardData[] => {
  return allCards.filter(card => card.rarity === 'legendary');
};

// Get all spell cards
export const getSpellCards = (): CardData[] => {
  return allCards.filter(card => card.type === 'spell');
};

// Get cards with battlecry and deathrattle effects
export const getMechanicCards = (): CardData[] => {
  return mechanicCards;
};

// Get all spellburst cards
export const getSpellburstCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('spellburst' as CardKeyword));
};

// Get all reborn cards
export const getRebornCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('reborn' as CardKeyword));
};

// Get all magnetic cards
export const getMagneticCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('magnetic' as CardKeyword));
};

// Get all frenzy cards
export const getFrenzyCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('frenzy' as CardKeyword));
};

// Get all dormant cards
export const getDormantCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('dormant' as CardKeyword));
};

// Get all outcast cards
export const getOutcastCards = (): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes('outcast' as CardKeyword));
};

export default allCards;