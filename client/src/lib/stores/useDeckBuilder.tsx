import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCardsByFilter } from '../../game/data/cards';

// Define the state structure
export interface DeckBuilderState {
  selectedClass: string;
  selectedDeck: { [cardId: number]: number }; // cardId -> count
  deckName: string;
  deckCode: string;
  
  // Actions
  setSelectedClass: (className: string) => void;
  addCardToDeck: (cardId: number) => void;
  removeCardFromDeck: (cardId: number) => void;
  setSelectedDeck: (deck: { [cardId: number]: number }) => void;
  setDeckName: (name: string) => void;
  setDeckCode: (code: string) => void;
  clearDeck: () => void;
  exportDeck: () => string;
  importDeck: (deckCode: string) => boolean;
  getDeckSize: () => number;
  isCardLimitReached: (cardId: number) => boolean;
  isDeckFull: () => boolean;
}

// Constants for deck building limits
const MAX_DECK_SIZE = 30;
const MAX_COPIES_COMMON = 2;
const MAX_COPIES_LEGENDARY = 1;

// Create the store with persistence
const useDeckBuilder = create<DeckBuilderState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedClass: 'Neutral',
      selectedDeck: {},
      deckName: 'New Deck',
      deckCode: '',
      
      // Set selected class
      setSelectedClass: (className) => {
        set({ 
          selectedClass: className,
          // Reset deck when changing class
          selectedDeck: {},
          deckName: `New ${className} Deck`,
          deckCode: ''
        });
      },
      
      // Add a card to the deck
      addCardToDeck: (cardId) => {
        const { selectedDeck, isCardLimitReached, isDeckFull } = get();
        
        // Don't add if deck is full or card limit reached
        if (isDeckFull() || isCardLimitReached(cardId)) {
          return;
        }
        
        const currentCount = selectedDeck[cardId] || 0;
        
        set({
          selectedDeck: {
            ...selectedDeck,
            [cardId]: currentCount + 1,
          },
        });
      },
      
      // Remove a card from the deck
      removeCardFromDeck: (cardId) => {
        const { selectedDeck } = get();
        const currentCount = selectedDeck[cardId] || 0;
        
        if (currentCount <= 1) {
          // Remove the card completely if it's the last copy
          const newDeck = { ...selectedDeck };
          delete newDeck[cardId];
          set({ selectedDeck: newDeck });
        } else {
          // Reduce the count otherwise
          set({
            selectedDeck: {
              ...selectedDeck,
              [cardId]: currentCount - 1,
            },
          });
        }
      },
      
      // Set the entire deck at once
      setSelectedDeck: (deck) => {
        set({ selectedDeck: deck });
      },
      
      // Set deck name
      setDeckName: (name) => {
        set({ deckName: name });
      },
      
      // Set deck code
      setDeckCode: (code) => {
        set({ deckCode: code });
      },
      
      // Clear the deck
      clearDeck: () => {
        set({
          selectedDeck: {},
          deckCode: '',
        });
      },
      
      // Export deck as code
      exportDeck: () => {
        const { selectedClass, selectedDeck, deckName } = get();
        
        // Very simple encoding for now - just JSON
        const deckData = {
          class: selectedClass,
          name: deckName,
          cards: selectedDeck,
        };
        
        // Encode as base64 string
        const deckString = btoa(JSON.stringify(deckData));
        set({ deckCode: deckString });
        
        return deckString;
      },
      
      // Import deck from code
      importDeck: (deckCode) => {
        try {
          // Decode the base64 string
          const deckDataString = atob(deckCode);
          const deckData = JSON.parse(deckDataString);
          
          // Validate the imported data
          if (!deckData.class || !deckData.cards) {
            return false;
          }
          
          // Update state with imported deck
          set({
            selectedClass: deckData.class,
            deckName: deckData.name || `Imported ${deckData.class} Deck`,
            selectedDeck: deckData.cards,
            deckCode,
          });
          
          return true;
        } catch (error) {
          console.error('Failed to import deck:', error);
          return false;
        }
      },
      
      // Get the current deck size
      getDeckSize: () => {
        const { selectedDeck } = get();
        return Object.values(selectedDeck).reduce(
          (total, count) => total + (count as number), 
          0
        );
      },
      
      // Check if the card limit is reached for a specific card
      isCardLimitReached: (cardId) => {
        const { selectedDeck } = get();
        const currentCount = selectedDeck[cardId] || 0;
        
        // Get card data to determine rarity
        const card = getCardsByFilter({ class: 'all' }).find(c => c.id === cardId);
        
        if (!card) {
          return true; // Card not found, don't allow adding
        }
        
        // Legendary cards are limited to 1 copy
        if (card.rarity === 'legendary' && currentCount >= MAX_COPIES_LEGENDARY) {
          return true;
        }
        
        // Other cards are limited to 2 copies
        return currentCount >= MAX_COPIES_COMMON;
      },
      
      // Check if the deck is full (30 cards)
      isDeckFull: () => {
        const { getDeckSize } = get();
        return getDeckSize() >= MAX_DECK_SIZE;
      },
    }),
    {
      name: 'hearthstone-deck-builder', // Local storage key
      partialize: (state) => ({ 
        selectedClass: state.selectedClass, 
        selectedDeck: state.selectedDeck,
        deckName: state.deckName,
        deckCode: state.deckCode,
      }),
    }
  )
);

export default useDeckBuilder;