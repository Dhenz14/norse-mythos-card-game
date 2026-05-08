import type { CardData, HeroClass } from '../types';
import type { ArmySelection, ChessPieceHero } from '../types/ChessTypes';
import { isStarterEntitlementCardId } from '@shared/schemas/starterEntitlement';

export const HERO_DECK_SIZE = 30;
export const HERO_DECK_MAX_COPIES = 2;
export const HERO_DECK_MAX_MYTHIC_COPIES = 1;

export const HERO_DECK_PIECE_TYPES = ['queen', 'rook', 'bishop', 'knight'] as const;

export type PieceType = (typeof HERO_DECK_PIECE_TYPES)[number];

export type HeroDeck = {
  readonly pieceType: PieceType;
  readonly heroId: string;
  readonly heroClass: string;
  readonly cardIds: readonly number[];
};

export type HeroDecksByPiece = Record<PieceType, HeroDeck | null>;

export type HeroDeckLoadout = Record<PieceType, readonly number[]>;

export type DeckBuildMode = 'local-dev' | 'owned-collection';

export type AutoFillMode = 'random';

export type CardCopyLimitProvider = (cardId: number) => number;

export type CardLookup = (cardId: number) => CardData | undefined;

export type DeckValidationContext = {
  readonly pieceType: PieceType;
  readonly heroId?: string;
  readonly heroClass?: string;
  readonly getCardById: CardLookup;
  readonly getOwnedCopies?: CardCopyLimitProvider;
  readonly enforceOwnership?: boolean;
};

export type ReadyDeckValidation = {
  readonly kind: 'ready';
  readonly valid: true;
  readonly errors: readonly [];
  readonly deck: HeroDeck;
};

export type FailedDeckValidationKind =
  | 'missing'
  | 'piece_mismatch'
  | 'hero_mismatch'
  | 'class_mismatch'
  | 'incomplete'
  | 'invalid';

export type FailedDeckValidation = {
  readonly kind: FailedDeckValidationKind;
  readonly valid: false;
  readonly errors: readonly string[];
  readonly cardCount: number;
};

export type DeckValidationResult = ReadyDeckValidation | FailedDeckValidation;

export type HeroDeckStatus = {
  readonly kind: DeckValidationResult['kind'];
  readonly isReady: boolean;
  readonly cardCount: number;
  readonly errors: readonly string[];
};

export type WarbandLoadoutResult =
  | {
      readonly kind: 'ready';
      readonly army: ArmySelection;
      readonly deckCardIdsByPiece: HeroDeckLoadout;
      readonly deckCardIds: readonly number[];
    }
  | {
      readonly kind: 'invalid';
      readonly statuses: Record<PieceType, HeroDeckStatus>;
    };

type CardClassCarrier = {
  readonly class?: string;
  readonly heroClass?: string;
};

const isKnownPieceType = (value: string): value is PieceType =>
  HERO_DECK_PIECE_TYPES.some(pieceType => pieceType === value);

export function isPieceType(value: unknown): value is PieceType {
  return typeof value === 'string' && isKnownPieceType(value);
}

export function normalizeHeroClass(heroClass: string | undefined): string {
  return heroClass?.trim().toLowerCase() || 'neutral';
}

export function getCardClass(card: CardClassCarrier): string {
  return normalizeHeroClass(card.class ?? card.heroClass);
}

export function isClassCard(card: CardClassCarrier): boolean {
  return getCardClass(card) !== 'neutral';
}

export function isCardMythic(card: Pick<CardData, 'rarity'>): boolean {
  return card.rarity === 'mythic';
}

export function getMaxCopies(card: Pick<CardData, 'rarity'>): number {
  return isCardMythic(card) ? HERO_DECK_MAX_MYTHIC_COPIES : HERO_DECK_MAX_COPIES;
}

export function countCardIds(cardIds: readonly number[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const cardId of cardIds) {
    counts[cardId] = (counts[cardId] ?? 0) + 1;
  }
  return counts;
}

export function isCardValidForHeroClass(card: CardData, heroClass: string): boolean {
  const cardClass = getCardClass(card);
  const normalizedHeroClass = normalizeHeroClass(heroClass);
  return cardClass === 'neutral' || cardClass === normalizedHeroClass;
}

export function isCardDeckCollectible(card: CardData): boolean {
  const cardId = Number(card.id);
  const isStarterEntitlement = Number.isInteger(cardId) && isStarterEntitlementCardId(cardId);
  return card.type !== 'hero' && (card.collectible !== false || isStarterEntitlement);
}

export function isCardValidForHero(card: CardData, heroClass: string, heroId?: string): boolean {
  if (!isCardDeckCollectible(card)) return false;
  if (!isCardValidForHeroClass(card, heroClass)) return false;
  if (card.type !== 'artifact') return true;
  if (!card.heroId || !heroId) return true;
  return card.heroId === heroId;
}

export function filterCardsByHero(cards: readonly CardData[], heroClass: string, heroId?: string): CardData[] {
  return cards.filter(card => isCardValidForHero(card, heroClass, heroId));
}

export function canAddCardToDeck(
  cardId: number,
  deckCardIds: readonly number[],
  card: CardData,
  ownedCopies?: number,
): boolean {
  if (deckCardIds.length >= HERO_DECK_SIZE) return false;

  const currentCount = countCardIds(deckCardIds)[cardId] ?? 0;
  const maxAllowed = getMaxCopies(card);
  const ownershipLimit = ownedCopies === undefined ? maxAllowed : Math.max(0, Math.floor(ownedCopies));

  return currentCount < Math.min(maxAllowed, ownershipLimit);
}

export function isHeroDeckForHero(
  deck: HeroDeck | null,
  pieceType: PieceType,
  heroId: string,
  heroClass: string,
): boolean {
  if (!deck) return false;
  return (
    deck.pieceType === pieceType &&
    deck.heroId === heroId &&
    normalizeHeroClass(deck.heroClass) === normalizeHeroClass(heroClass)
  );
}

export function isHeroDeckForSelection(deck: HeroDeck | null, pieceType: PieceType, hero: ChessPieceHero): boolean {
  return isHeroDeckForHero(deck, pieceType, hero.id, hero.heroClass);
}

function getFailedValidationKind(errors: readonly string[]): FailedDeckValidationKind {
  if (errors.some(error => error.startsWith('Deck belongs to piece'))) return 'piece_mismatch';
  if (errors.some(error => error.startsWith('Deck belongs to hero'))) return 'hero_mismatch';
  if (errors.some(error => error.startsWith('Deck class'))) return 'class_mismatch';
  if (errors.some(error => error.startsWith('Deck must contain exactly'))) return 'incomplete';
  return 'invalid';
}

export function validateHeroDeck(
  deck: HeroDeck | null,
  context: DeckValidationContext,
): DeckValidationResult {
  if (!deck) {
    return {
      kind: 'missing',
      valid: false,
      errors: ['No deck exists for this piece'],
      cardCount: 0,
    };
  }

  const errors: string[] = [];

  if (deck.pieceType !== context.pieceType) {
    errors.push(`Deck belongs to piece "${deck.pieceType}" but was requested for "${context.pieceType}"`);
  }

  if (!deck.heroId) {
    errors.push('No hero selected');
  } else if (context.heroId && deck.heroId !== context.heroId) {
    errors.push(`Deck belongs to hero "${deck.heroId}" but current hero is "${context.heroId}"`);
  }

  if (!deck.heroClass) {
    errors.push('No hero class specified');
  } else if (context.heroClass && normalizeHeroClass(deck.heroClass) !== normalizeHeroClass(context.heroClass)) {
    errors.push(`Deck class "${deck.heroClass}" does not match current hero class "${context.heroClass}"`);
  }

  if (deck.cardIds.length !== HERO_DECK_SIZE) {
    errors.push(`Deck must contain exactly ${HERO_DECK_SIZE} cards (has ${deck.cardIds.length})`);
  }

  const cardCounts = countCardIds(deck.cardIds);

  for (const [cardIdText, count] of Object.entries(cardCounts)) {
    const cardId = Number(cardIdText);
    const card = context.getCardById(cardId);

    if (!card) {
      errors.push(`Card with ID ${cardId} not found in registry`);
      continue;
    }

    const maxAllowed = getMaxCopies(card);
    if (count > maxAllowed) {
      const rarityNote = isCardMythic(card) ? ' (Mythic - max 1)' : '';
      errors.push(`Card "${card.name}"${rarityNote} has ${count} copies (max ${maxAllowed})`);
    }

    if (!isCardValidForHeroClass(card, deck.heroClass)) {
      errors.push(`Card "${card.name}" (${getCardClass(card)}) is not valid for ${deck.heroClass}`);
    }

    if (context.enforceOwnership) {
      const owned = context.getOwnedCopies?.(cardId) ?? 0;
      if (count > owned) {
        errors.push(`You own ${owned} copy(ies) of "${card.name}" but deck has ${count}`);
      }
    }
  }

  if (errors.length > 0) {
    return {
      kind: getFailedValidationKind(errors),
      valid: false,
      errors,
      cardCount: deck.cardIds.length,
    };
  }

  return {
    kind: 'ready',
    valid: true,
    errors: [],
    deck,
  };
}

export function getHeroDeckStatus(
  deck: HeroDeck | null,
  context: DeckValidationContext,
): HeroDeckStatus {
  const result = validateHeroDeck(deck, context);
  if (result.valid) {
    return {
      kind: 'ready',
      isReady: true,
      cardCount: result.deck.cardIds.length,
      errors: [],
    };
  }

  return {
    kind: result.kind,
    isReady: false,
    cardCount: result.cardCount,
    errors: result.errors,
  };
}

function getHeroForPiece(army: ArmySelection, pieceType: PieceType): ChessPieceHero {
  return army[pieceType];
}

function emptyHeroDeckLoadout(): HeroDeckLoadout {
  return {
    queen: [],
    rook: [],
    bishop: [],
    knight: [],
  };
}

export function buildWarbandLoadout(
  army: ArmySelection,
  decks: HeroDecksByPiece,
  context: Omit<DeckValidationContext, 'pieceType' | 'heroId' | 'heroClass'>,
): WarbandLoadoutResult {
  const statuses = {} as Record<PieceType, HeroDeckStatus>;
  const deckCardIdsByPiece = emptyHeroDeckLoadout();
  const flatDeckCardIds: number[] = [];

  for (const pieceType of HERO_DECK_PIECE_TYPES) {
    const hero = getHeroForPiece(army, pieceType);
    const deck = decks[pieceType];
    const status = getHeroDeckStatus(deck, {
      ...context,
      pieceType,
      heroId: hero.id,
      heroClass: hero.heroClass,
    });

    statuses[pieceType] = status;

    if (!status.isReady || !deck) continue;

    const cardIds = [...deck.cardIds];
    deckCardIdsByPiece[pieceType] = cardIds;
    flatDeckCardIds.push(...cardIds);
  }

  const isReady = HERO_DECK_PIECE_TYPES.every(pieceType => statuses[pieceType].isReady);
  if (!isReady) {
    return { kind: 'invalid', statuses };
  }

  return {
    kind: 'ready',
    army,
    deckCardIdsByPiece,
    deckCardIds: flatDeckCardIds,
  };
}

function shuffleCards(cards: readonly CardData[], rng: () => number): CardData[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateAutoFillCards(
  currentDeckIds: readonly number[],
  validCards: readonly CardData[],
  targetSize: number = HERO_DECK_SIZE,
  getOwnedCopies?: CardCopyLimitProvider,
  rng: () => number = Math.random,
): number[] {
  const remaining = targetSize - currentDeckIds.length;
  if (remaining <= 0) return [];

  const currentCounts = countCardIds(currentDeckIds);
  const newCards: number[] = [];
  const shuffled = shuffleCards(validCards, rng);

  for (const card of shuffled) {
    if (newCards.length >= remaining) break;

    const cardId = Number(card.id);
    if (!Number.isInteger(cardId)) continue;

    const currentCount = currentCounts[cardId] ?? 0;
    const ownedCopies = getOwnedCopies?.(cardId) ?? getMaxCopies(card);
    const maxAllowed = Math.min(getMaxCopies(card), Math.max(0, Math.floor(ownedCopies)));

    if (currentCount >= maxAllowed) continue;

    const toAdd = Math.min(maxAllowed - currentCount, remaining - newCards.length);
    for (let i = 0; i < toAdd; i++) {
      newCards.push(cardId);
      currentCounts[cardId] = (currentCounts[cardId] ?? 0) + 1;
    }
  }

  return newCards;
}

export function getDeckBuildMode(enforceOwnership: boolean): DeckBuildMode {
  return enforceOwnership ? 'owned-collection' : 'local-dev';
}

export function toHeroClassString(heroClass: HeroClass | string): string {
  return normalizeHeroClass(heroClass);
}
