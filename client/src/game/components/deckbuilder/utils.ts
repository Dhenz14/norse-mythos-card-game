/**
 * deckBuilderUtils.ts
 * Pure utility functions for deck builder logic.
 * No React, no side effects - just data transformations.
 */

import type { CardData } from '../../types';
import { cryptoRng } from '../../utils/seededRng';
import {
  HERO_DECK_MAX_COPIES,
  HERO_DECK_MAX_MYTHIC_COPIES,
  HERO_DECK_SIZE,
  canAddCardToDeck as canAddHeroCardToDeck,
  countCardIds,
  filterCardsByHero,
  generateAutoFillCards as generateHeroAutoFillCards,
  getCardClass as getHeroCardClass,
  getMaxCopies as getHeroMaxCopies,
  isCardMythic as isHeroCardMythic,
  isClassCard as isHeroClassCard,
} from '../../deck/heroDeckRules';

export const DECK_SIZE = HERO_DECK_SIZE;
export const MAX_COPIES = HERO_DECK_MAX_COPIES;
export const MAX_MYTHIC_COPIES = HERO_DECK_MAX_MYTHIC_COPIES;

export type SortOption = 'cost' | 'name' | 'type';
export type FilterType = 'all' | 'minion' | 'spell' | 'weapon' | 'artifact' | 'armor' | 'pet';

export interface CardFilters {
  searchTerm: string;
  filterType: FilterType;
  sortBy: SortOption;
  minCost: number | null;
  maxCost: number | null;
}

export type CardCopyLimitProvider = (cardId: number) => number;

/**
 * Count occurrences of each card ID in a deck
 */
export function countCards(cardIds: number[]): Record<number, number> {
  return countCardIds(cardIds);
}

/**
 * Check if a card is mythic rarity (max 1 copy per deck)
 */
export function isCardMythic(card: CardData): boolean {
  return isHeroCardMythic(card);
}

/**
 * Get max allowed copies for a card
 */
export function getMaxCopies(card: CardData): number {
  return getHeroMaxCopies(card);
}

/**
 * Check if a card can be added to the deck
 */
export function canAddCardToDeck(
  cardId: number,
  deckCardIds: number[],
  card: CardData
): boolean {
  return canAddHeroCardToDeck(cardId, deckCardIds, card);
}

/**
 * Get the card's class (normalized to lowercase)
 */
export function getCardClass(card: CardData): string {
  return getHeroCardClass(card);
}

/**
 * Check if a card is a class card (not neutral)
 */
export function isClassCard(card: CardData): boolean {
  return isHeroClassCard(card);
}

/**
 * Filter cards by hero class (returns neutral + matching class cards)
 * Artifacts are further restricted to their specific heroId.
 */
export function filterCardsByClass(cards: CardData[], heroClass: string, heroId?: string): CardData[] {
  return filterCardsByHero(cards, heroClass, heroId);
}

/**
 * Apply search and filter criteria to cards
 */
export function filterCards(cards: CardData[], filters: CardFilters): CardData[] {
  let filtered = cards;

  // Search term filter
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(card =>
      card.name.toLowerCase().includes(term) ||
      (card.description || '').toLowerCase().includes(term)
    );
  }

  // Card type filter
  if (filters.filterType === 'pet') {
    filtered = filtered.filter(card => !!(card as any).petStage);
  } else if (filters.filterType !== 'all') {
    filtered = filtered.filter(card => card.type === filters.filterType);
  }

  // Mana cost range filter
  if (filters.minCost !== null) {
    filtered = filtered.filter(card => (card.manaCost ?? 0) >= filters.minCost!);
  }
  if (filters.maxCost !== null) {
    filtered = filtered.filter(card => (card.manaCost ?? 0) <= filters.maxCost!);
  }

  return filtered;
}

/**
 * Sort cards by the specified option
 */
export function sortCards(cards: CardData[], sortBy: SortOption): CardData[] {
  return [...cards].sort((a, b) => {
    switch (sortBy) {
      case 'cost':
        return (a.manaCost ?? 0) - (b.manaCost ?? 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });
}

/**
 * Filter and sort cards in one pass
 */
export function filterAndSortCards(cards: CardData[], filters: CardFilters): CardData[] {
  const filtered = filterCards(cards, filters);
  return sortCards(filtered, filters.sortBy);
}

/**
 * Get unique cards from deck IDs with counts, sorted by mana cost
 */
export function getDeckCardsWithCounts(
  deckCardIds: number[],
  cardRegistry: CardData[]
): { card: CardData; count: number }[] {
  const counts = countCards(deckCardIds);
  const uniqueIds = [...new Set(deckCardIds)];
  
  return uniqueIds
    .map(id => {
      const card = cardRegistry.find(c => Number(c.id) === id);
      return card ? { card, count: counts[id] } : null;
    })
    .filter((entry): entry is { card: CardData; count: number } => entry !== null)
    .sort((a, b) => (a.card.manaCost ?? 0) - (b.card.manaCost ?? 0));
}

/**
 * Auto-fill deck with random valid cards
 */
export function generateAutoFillCards(
  currentDeckIds: number[],
  validCards: CardData[],
  targetSize: number = DECK_SIZE,
  getOwnedCopies?: CardCopyLimitProvider
): number[] {
  return generateHeroAutoFillCards(currentDeckIds, validCards, targetSize, getOwnedCopies, cryptoRng);
}
