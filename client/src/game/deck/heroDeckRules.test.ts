import { describe, expect, it } from 'vitest';
import type { CardData } from '../types';
import type { ArmySelection, ChessPieceHero } from '../types/ChessTypes';
import {
  buildWarbandLoadout,
  generateAutoFillCards,
  getHeroDeckStatus,
  HERO_DECK_PIECE_TYPES,
  HERO_DECK_SIZE,
  type HeroDeck,
  type PieceType,
} from './heroDeckRules';

function makeCard(id: number, heroClass = 'druid', rarity: CardData['rarity'] = 'common'): CardData {
  return {
    id,
    name: `Card ${id}`,
    type: 'minion',
    rarity,
    class: heroClass,
  } satisfies CardData;
}

function makeHero(id: string, heroClass = 'druid'): ChessPieceHero {
  return {
    id,
    name: id,
    heroClass,
    description: `${id} description`,
  };
}

function makeArmy(): ArmySelection {
  return {
    king: makeHero('king-hero', 'neutral'),
    queen: makeHero('queen-hero'),
    rook: makeHero('rook-hero'),
    bishop: makeHero('bishop-hero'),
    knight: makeHero('knight-hero'),
  };
}

function makeDeckCardIds(): number[] {
  return Array.from({ length: HERO_DECK_SIZE }, (_, index) => Math.floor(index / 2) + 1);
}

function makeDeck(pieceType: PieceType, heroId: string, cardIds = makeDeckCardIds()): HeroDeck {
  return {
    pieceType,
    heroId,
    heroClass: 'druid',
    cardIds,
  };
}

const registry = Array.from({ length: 20 }, (_, index) => makeCard(index + 1));
const getCardById = (cardId: number): CardData | undefined => registry.find(card => Number(card.id) === cardId);

describe('heroDeckRules', () => {
  it('marks a complete saved deck as a hero mismatch when the selected hero changed', () => {
    const status = getHeroDeckStatus(makeDeck('queen', 'old-queen'), {
      pieceType: 'queen',
      heroId: 'new-queen',
      heroClass: 'druid',
      getCardById,
    });

    expect(status.kind).toBe('hero_mismatch');
    expect(status.isReady).toBe(false);
    expect(status.cardCount).toBe(HERO_DECK_SIZE);
  });

  it('auto-fills without exceeding deck, rarity, or ownership limits', () => {
    const mythicCardId = 99;
    const validCards = [
      ...Array.from({ length: 15 }, (_, index) => makeCard(index + 1)),
      makeCard(mythicCardId, 'druid', 'mythic'),
    ];
    const currentDeckIds = [mythicCardId];
    const generated = generateAutoFillCards(
      currentDeckIds,
      validCards,
      HERO_DECK_SIZE,
      cardId => {
        if (cardId === 1) return 1;
        if (cardId === mythicCardId) return 1;
        return 2;
      },
      () => 0,
    );
    const finalDeckIds = [...currentDeckIds, ...generated];
    const counts = finalDeckIds.reduce<Record<number, number>>((accumulator, cardId) => {
      accumulator[cardId] = (accumulator[cardId] ?? 0) + 1;
      return accumulator;
    }, {});

    expect(finalDeckIds).toHaveLength(HERO_DECK_SIZE);
    expect(counts[1]).toBe(1);
    expect(counts[mythicCardId]).toBe(1);
    for (const cardId of Object.keys(counts).map(Number)) {
      const maxCopies = cardId === mythicCardId ? 1 : 2;
      expect(counts[cardId]).toBeLessThanOrEqual(maxCopies);
    }
  });

  it('builds a per-piece warband loadout only from decks matching the selected heroes', () => {
    const army = makeArmy();
    const readyDecks = Object.fromEntries(
      HERO_DECK_PIECE_TYPES.map(pieceType => [pieceType, makeDeck(pieceType, army[pieceType].id)]),
    ) as Record<PieceType, HeroDeck>;

    const ready = buildWarbandLoadout(army, readyDecks, { getCardById });

    expect(ready.kind).toBe('ready');
    if (ready.kind !== 'ready') return;
    expect(ready.deckCardIds).toHaveLength(HERO_DECK_SIZE * HERO_DECK_PIECE_TYPES.length);
    for (const pieceType of HERO_DECK_PIECE_TYPES) {
      expect(ready.deckCardIdsByPiece[pieceType]).toHaveLength(HERO_DECK_SIZE);
    }

    const invalid = buildWarbandLoadout(
      army,
      {
        ...readyDecks,
        rook: makeDeck('rook', 'different-rook'),
      },
      { getCardById },
    );

    expect(invalid.kind).toBe('invalid');
    if (invalid.kind !== 'invalid') return;
    expect(invalid.statuses.rook.kind).toBe('hero_mismatch');
  });
});
