# Deck Builder Code Audit

> Assessment of the current deck builder implementation against AAA-quality standards and recommendations for improvement.

---

## Current Architecture Overview

### Files Analyzed

| File | Lines | Purpose |
|------|-------|---------|
| `HeroDeckBuilder.tsx` | 555 | Main deck builder UI |
| `HeroSelection.tsx` | 186 | Hero class picker |
| `SavedDecksList.tsx` | 158 | Saved decks display |
| `heroDeckStore.ts` | 353 | Zustand state management |
| `deckUtils.ts` | 157 | Game deck operations |

---

## Audit Findings

### What's Working Well

1. **Store Separation** - `heroDeckStore.ts` follows proper Zustand patterns with clear actions and state
2. **Validation Logic** - Deck validation is centralized in the store
3. **Type Definitions** - Good use of TypeScript interfaces (`HeroDeck`, `PieceType`)
4. **Persistence** - localStorage integration is properly implemented

### Issues Identified

#### Issue 1: Monolithic Component (Critical)

**Problem:** `HeroDeckBuilder.tsx` is 555 lines with mixed concerns.

**Current State:**
```tsx
// Everything in one component
function HeroDeckBuilder() {
  // 10+ useState hooks
  // Filtering logic
  // Sorting logic
  // Card counting logic
  // Event handlers
  // 400+ lines of JSX
}
```

**Recommendation:** Split into smaller components:
- `CardFilters.tsx` - Search, type filter, mana filter
- `CardGrid.tsx` - Card collection display
- `DeckSidebar.tsx` - Current deck cards list
- `DeckHeader.tsx` - Hero info and save button
- `CardTile.tsx` - Individual card display

---

#### Issue 2: Business Logic in Components

**Problem:** Filtering, sorting, and counting logic is embedded in JSX component.

**Current (lines 71-121):**
```tsx
const validCards = useMemo(() => {
  return cardRegistry.filter(card => {
    // Card filtering logic embedded in component
  });
}, [normalizedHeroClass]);

const filteredAndSortedCards = useMemo(() => {
  // Sorting and filtering logic
});
```

**Recommendation:** Extract to utility functions:
```tsx
// utils/deckBuilderUtils.ts
export function filterCardsForClass(cards: CardData[], heroClass: string): CardData[]
export function filterBySearchTerm(cards: CardData[], term: string): CardData[]
export function sortCards(cards: CardData[], sortBy: SortOption): CardData[]
export function countCardsInDeck(cardIds: number[]): Record<number, number>
```

---

#### Issue 3: No Custom Hook

**Problem:** Component manages complex state without a dedicated hook.

**Recommendation:** Create `useDeckBuilder` hook:
```tsx
// hooks/useDeckBuilder.ts
export function useDeckBuilder(pieceType: PieceType, heroClass: string) {
  const { getDeck, setDeck, validateDeck } = useHeroDeckStore();
  
  const [deckCardIds, setDeckCardIds] = useState<number[]>([]);
  const [filters, setFilters] = useState<DeckFilters>({});
  
  const filteredCards = useMemo(() => 
    filterCards(cardRegistry, heroClass, filters), 
    [heroClass, filters]
  );
  
  const handleAddCard = useCallback((card: CardData) => {
    // Add card logic
  }, []);
  
  return {
    deckCardIds,
    filteredCards,
    filters,
    setFilters,
    addCard: handleAddCard,
    removeCard: handleRemoveCard,
    saveDeck: handleSave,
    clearDeck: handleClear,
    autoFill: handleAutoFill,
  };
}
```

---

#### Issue 4: Inline Styles & No Design Tokens

**Problem:** Uses inline Tailwind classes with no centralized tokens for the deck builder.

**Current:**
```tsx
<div className="w-[95vw] max-w-7xl h-[90vh] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border border-gray-700">
```

**Recommendation:** Create deck builder tokens:
```css
/* styles/deck-builder/tokens.css */
:root {
  --deck-builder-width: 95vw;
  --deck-builder-max-width: 1280px;
  --deck-builder-height: 90vh;
  --deck-builder-bg: linear-gradient(to bottom, var(--color-gray-900), var(--color-gray-800));
  --deck-builder-border: var(--color-gray-700);
  --deck-builder-radius: var(--radius-xl);
}
```

---

#### Issue 5: Rarity Colors Hardcoded

**Problem:** Rarity colors defined as constants inside component (lines 24-38).

**Current:**
```tsx
const RARITY_COLORS: Record<string, string> = {
  free: 'text-gray-300 border-gray-400',
  common: 'text-gray-100 border-gray-300',
  rare: 'text-blue-400 border-blue-500',
  // ...
};
```

**Recommendation:** Move to centralized tokens:
```css
/* tokens.css */
:root {
  --rarity-free-color: var(--color-gray-300);
  --rarity-common-color: var(--color-gray-100);
  --rarity-rare-color: var(--color-blue-400);
  --rarity-epic-color: var(--color-purple-400);
  --rarity-legendary-color: var(--color-orange-400);
}
```

---

#### Issue 6: Mixed Store Responsibilities

**Problem:** Two deck stores with overlapping concerns.
- `heroDeckStore.ts` - Hero decks for chess pieces
- `sharedDeckStore.ts` - Shared deck management

**Recommendation:** Consolidate or clearly document the distinction between stores.

---

## Recommended File Structure

```
client/src/game/deckBuilder/
├── index.ts                    # Public exports
├── types/
│   └── deckBuilder.types.ts    # All TypeScript types
├── stores/
│   └── deckBuilderStore.ts     # Unified store
├── hooks/
│   ├── useDeckBuilder.ts       # Main deck building logic
│   ├── useCardFilters.ts       # Filter/search state
│   └── useDeckValidation.ts    # Validation logic
├── utils/
│   ├── cardFilters.ts          # Pure filter functions
│   ├── cardSorting.ts          # Pure sort functions
│   └── deckValidation.ts       # Pure validation functions
├── components/
│   ├── DeckBuilder.tsx         # Main container (<100 lines)
│   ├── DeckHeader.tsx          # Hero info + actions
│   ├── CardFilters/
│   │   ├── SearchInput.tsx
│   │   ├── TypeFilter.tsx
│   │   └── ManaFilter.tsx
│   ├── CardGrid/
│   │   ├── CardGrid.tsx
│   │   └── CardTile.tsx
│   ├── DeckSidebar/
│   │   ├── DeckSidebar.tsx
│   │   └── DeckCard.tsx
│   └── index.ts
└── styles/
    ├── tokens.css              # Deck builder design tokens
    ├── card-tile.css           # Card display styles
    ├── filters.css             # Filter component styles
    └── index.css               # Import aggregator
```

---

## Priority Action Items

### High Priority (Immediate)

1. **Extract `useDeckBuilder` hook** - Decouple logic from presentation
2. **Split `HeroDeckBuilder.tsx`** - Break into 4-5 smaller components
3. **Create deck builder tokens** - Centralize all style variables

### Medium Priority (Next Sprint)

4. **Create pure utility functions** - Move filtering/sorting to utils
5. **Add CSS modules** - Scope styles to components
6. **Document store responsibilities** - Clarify heroDeckStore vs sharedDeckStore

### Low Priority (Future)

7. **Add motion/animation system** - Spring-based transitions
8. **Implement hero moments** - Satisfying deck completion animation
9. **Add keyboard shortcuts** - Power user features

---

## Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| Max component lines | 555 | <200 |
| Logic in components | High | Minimal |
| Design token usage | 0% | 100% |
| Test coverage | Unknown | >80% |
| Accessibility score | Unknown | WCAG AA |

---

## Summary

The deck builder has solid foundations with good store patterns, but needs refactoring to achieve AAA quality. The main issues are:

1. **Monolithic component** that should be split
2. **Business logic in JSX** that should be in hooks/utils
3. **No design tokens** for consistent styling
4. **Missing separation** between presentation and logic

Following the recommendations in `DESIGN_PHILOSOPHY.md` will transform this into a maintainable, scalable feature.
