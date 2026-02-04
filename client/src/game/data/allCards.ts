/**
 * allCards.ts - Legacy Compatibility Layer
 * 
 * DEPRECATED: This file is maintained for backward compatibility only.
 * New code should import directly from cardRegistry:
 *   import { cardRegistry, getCardById } from './cardRegistry';
 * 
 * This file now re-exports from cardRegistry as the single source of truth.
 * All 1370+ cards are managed in cardRegistry/sets/ with proper organization.
 * 
 * @see cardRegistry/index.ts for the canonical card data source
 */
import { CardData, CardType, HeroClass } from '../types';
import { cardRegistry } from './cardRegistry';

// Re-export cardRegistry as allCards for backward compatibility
const allCards: CardData[] = cardRegistry;

// ============================================================================
// UTILITY FUNCTIONS
// These functions operate on the canonical cardRegistry data.
// For new code, prefer importing utilities from utils/cards/cardUtils.ts
// ============================================================================

/**
 * Find a card by its unique ID
 * @param id - The card's unique identifier
 * @returns The card data or undefined if not found
 */
export const getCardById = (id: number): CardData | undefined => {
  return allCards.find(card => card.id === id);
};

/**
 * Filter cards by hero class
 * @param className - The hero class to filter by (or 'neutral')
 * @returns Array of cards belonging to that class
 */
export const getCardsByClass = (className: HeroClass | 'neutral'): CardData[] => {
  return allCards.filter(card => {
    // Check for regular class cards
    if ('heroClass' in card && card.heroClass === className) {
      return true;
    }
    
    // Check for dual-class cards
    if ('dualClassInfo' in card && card.dualClassInfo && (card.dualClassInfo as any).classes.includes(className as HeroClass)) {
      return true;
    }
    
    return false;
  });
};

/**
 * Filter cards by mechanic keyword
 * @param keyword - The keyword to search for (e.g., 'battlecry', 'deathrattle')
 * @returns Array of cards with that keyword
 */
export const getCardsByKeyword = (keyword: string): CardData[] => {
  return allCards.filter(card => card.keywords && card.keywords.includes(keyword));
};

/**
 * Filter cards by type
 * @param type - The card type (minion, spell, weapon, hero)
 * @returns Array of cards of that type
 */
export const getCardsByType = (type: CardType): CardData[] => {
  return allCards.filter(card => card.type === type);
};

// ============================================================================
// KEYWORD-SPECIFIC GETTERS
// Convenience functions for common keyword filters
// ============================================================================

export const getTradeableCards = (): CardData[] => getCardsByKeyword('tradeable');
export const getInspireCards = (): CardData[] => getCardsByKeyword('inspire');
export const getDualClassCards = (): CardData[] => getCardsByKeyword('dual_class');
export const getDiscoverCards = (): CardData[] => getCardsByKeyword('discover');
export const getQuestCards = (): CardData[] => getCardsByKeyword('quest');
export const getEchoCards = (): CardData[] => getCardsByKeyword('echo');
export const getSpellburstCards = (): CardData[] => getCardsByKeyword('spellburst');
export const getRebornCards = (): CardData[] => getCardsByKeyword('reborn');
export const getMagneticCards = (): CardData[] => getCardsByKeyword('magnetic');
export const getFrenzyCards = (): CardData[] => getCardsByKeyword('frenzy');
export const getDormantCards = (): CardData[] => getCardsByKeyword('dormant');
export const getOutcastCards = (): CardData[] => getCardsByKeyword('outcast');

// ============================================================================
// TYPE-SPECIFIC GETTERS
// Convenience functions for common type filters
// ============================================================================

export const getLegendaryCards = (): CardData[] => {
  return allCards.filter(card => card.rarity === 'legendary');
};

export const getSpellCards = (): CardData[] => getCardsByType('spell');

export const getMinionCards = (): CardData[] => getCardsByType('minion');

export const getWeaponCards = (): CardData[] => getCardsByType('weapon');

// ============================================================================
// DEPRECATED FUNCTIONS
// These exist for backward compatibility but return empty arrays
// or reference the main registry. They should not be used in new code.
// ============================================================================

/** @deprecated Use getCardsByClass instead */
export const getClassMinions = (): CardData[] => {
  return allCards.filter(card => 
    card.type === 'minion' && 
    'heroClass' in card && 
    card.heroClass !== 'neutral'
  );
};

/** @deprecated Use getCardsByKeyword('battlecry') or similar */
export const getMechanicCards = (): CardData[] => {
  return allCards.filter(card => 
    card.keywords && (
      card.keywords.includes('battlecry') || 
      card.keywords.includes('deathrattle') ||
      card.keywords.includes('combo')
    )
  );
};

export default allCards;
