import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardData, CollectionFilter, HeroClass, DeckInfo } from '../types';
import CollectionFilters from './CollectionFilters';
import CollectionCard from './CollectionCard';
import ErrorBoundaryCard from './ErrorBoundaryCard';
import DeckList from './DeckList';
import ManaCurve from './ManaCurve';
import CardDetailPopup from './CardDetailPopup';
import useDeckBuilder from '../../lib/stores/useDeckBuilder';
import useGame from '../../lib/stores/useGame';
import { useAudio } from '../../lib/stores/useAudio';
import heroes, { getHeroDataByClass } from '../data/heroes';
import { createClassDeck } from '../utils/cardUtils';

// Import card database - using the consolidated database that includes all cards
import { fullCardDatabase } from '../data/cardDatabase';

const DEFAULT_MAX_CARDS = 30;
const MAX_COPIES_NORMAL = 2;
const MAX_COPIES_LEGENDARY = 1;

interface DeckBuilderProps {
  heroClass?: HeroClass;
  onDeckSelected?: (deck: DeckInfo) => void;
  onBack?: () => void;
  neutralOnly?: boolean;
  maxCards?: number;
  onNeutralDeckComplete?: (cardIds: number[]) => void;
}

const DeckBuilder: React.FC<DeckBuilderProps> = ({ 
  heroClass, 
  onDeckSelected, 
  onBack,
  neutralOnly = false,
  maxCards = DEFAULT_MAX_CARDS,
  onNeutralDeckComplete
}) => {
  // Global deck state
  const { 
    selectedClass, 
    setSelectedClass,
    selectedDeck, 
    setSelectedDeck,
    deckName, 
    setDeckName,
    exportDeck,
    importDeck,
    clearDeck,
    getDeckSize
  } = useDeckBuilder();
  
  // Audio hooks
  const { playSoundEffect } = useAudio();
  
  // Local state for UI
  const [filters, setFilters] = useState<CollectionFilter>({
    manaCost: 'all',
    cardType: 'all',
    rarity: 'all',
    searchText: '',
    hideNeutral: false,
  });
  
  const [selectedCardDetails, setSelectedCardDetails] = useState<CardData | null>(null);
  const [detailPosition, setDetailPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  
  // Get class options from available cards and all defined heroes
  const classOptions = useMemo(() => {
    // First get classes from cards in the database
    const classes = new Set<string>();
    fullCardDatabase.forEach(card => {
      if (card.class && card.class !== 'Neutral') {
        classes.add(card.class);
      }
    });
    
    // Then add all hero classes from heroes.ts
    heroes.forEach(hero => {
      if (hero.class && hero.collectible) {
        // Convert from HeroClass to properly capitalized string
        const formattedClassName = hero.class.charAt(0).toUpperCase() + hero.class.slice(1);
        classes.add(formattedClassName);
      }
    });
    
    return ['Neutral', ...Array.from(classes)].sort();
  }, []);
  
  // Set the hero class if provided in props
  useEffect(() => {
    if (heroClass) {
      // Convert from HeroClass type to the class name format used in our database
      const formattedClassName = heroClass.charAt(0).toUpperCase() + heroClass.slice(1);
      setSelectedClass(formattedClassName);
    }
  }, [heroClass]);
  
  // Reset deck name when in neutralOnly mode (for Ragnarok Poker)
  useEffect(() => {
    if (neutralOnly) {
      setDeckName('My Neutral Deck');
      clearDeck();
    }
  }, [neutralOnly]);
  
  // Function to check if a card is neutral
  const isNeutralCard = (card: CardData): boolean => {
    // If class property is missing or undefined, assume neutral
    if (!card.class) return true;
    
    // Check different variants of "neutral" (case-insensitive)
    const classLower = card.class.toLowerCase();
    return classLower === 'neutral';
  };
  
  // Filter collection cards based on current filters and selected class
  const filteredCards = useMemo(() => {
    // For debugging - count neutral cards before filtering
    let neutralCount = 0;
    let nonNeutralCount = 0;
    let missingClassCount = 0;
    
    fullCardDatabase.forEach(card => {
      if (!card.collectible) return;
      
      if (!card.class) {
        missingClassCount++;
      } else if (isNeutralCard(card)) {
        neutralCount++;
      } else {
        nonNeutralCount++;
      }
    });
    
    console.log(`Neutral collectible cards: ${neutralCount}`);
    console.log(`Class-specific collectible cards: ${nonNeutralCount}`);
    console.log(`Cards missing class property: ${missingClassCount}`);
    
    // Debug: Log the specific cards missing class property
    if (missingClassCount > 0) {
      console.warn("!!!!! CARDS MISSING CLASS PROPERTY DETAILS !!!!!");
      console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      // Make sure we're using the exact same condition that counted the cards initially
      const cardsWithMissingClass = fullCardDatabase.filter(card => 
        card.collectible && !card.class
      );
      console.warn("Total cards missing class property:", cardsWithMissingClass.length);
      
      cardsWithMissingClass.forEach(card => {
        console.warn(`ID: ${card.id}, Name: ${card.name}, HeroClass: ${card.heroClass}, Type: ${card.type}, File: (unknown)`);
        // Print all card properties to help understand what's going on with this card
        console.warn("Full card data:", JSON.stringify(card, null, 2));
      });
      
      console.warn("-------- CHECKING TRANSFORM TYPE OBJECTS ---------");
      const transformObjects = fullCardDatabase.filter(card => 
        (card.spellEffect && card.spellEffect.type === "transform") ||
        (card.battlecry && card.battlecry.type === "transform")
      );
      transformObjects.forEach(card => {
        console.warn(`Found transform object:`, JSON.stringify(card, null, 2));
      });
      
      // Let's search through all cards and log more information about where they're coming from
      console.warn("------------ SEARCHING THROUGH ALL IMPORTED CARDS -------------");
      
      // Look for imported card modules
      const importedCardModules = [];
      for (const key in window) {
        if (key.includes('Card') || key.includes('card')) {
          console.warn(`Found possible card module: ${key}`);
          importedCardModules.push(key);
        }
      }
      
      // Count all cards from each module
      console.warn("-------- CHECKING DESTROY WEAPON EFFECT CARDS ---------");
      const destroyWeaponCards = fullCardDatabase.filter(card => 
        (card.spellEffect && card.spellEffect.type === 'destroy_weapon') ||
        (card.battlecry && card.battlecry.type === 'destroy_weapon')
      );
      destroyWeaponCards.forEach(card => {
        console.warn(`Found destroy_weapon effect card:`, JSON.stringify(card, null, 2));
      });
      
      console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }
    
    // First filter out any objects that aren't valid cards
    // The isCardEffect function helps detect transform and other effect objects
    return fullCardDatabase
      .filter(card => {
        // Filter out transform objects and effect objects
        if (!card) return false;
        
        // Skip transform effect objects that might be in the database
        if (card.type === 'transform' || 
            (card.position !== undefined && card.rotation !== undefined) ||
            (card.targetType !== undefined && card.requiresTarget !== undefined)) {
          console.warn('Found transform object:', JSON.stringify(card, null, 2));
          return false;
        }
        
        // Skip any card without an ID or name (which are required fields)
        if (!card.id || !card.name) {
          console.warn('Invalid card data found in database:', card);
          return false;
        }
        
        return true;
      })
      .filter(card => {
        // Check if the card is collectible
        if (!card.collectible) return false;
        
        // In neutralOnly mode, only show neutral cards
        if (neutralOnly) {
          if (!isNeutralCard(card)) return false;
        } else {
          // Hide neutral cards if the filter is enabled
          if (filters.hideNeutral && isNeutralCard(card)) {
            return false;
          }
          
          // Filter by class (if not neutral and not the selected class)
          if (card.class && !isNeutralCard(card) && card.class !== selectedClass) {
            return false;
          }
        }
      
      // Filter by mana cost
      if (filters.manaCost !== 'all') {
        if (filters.manaCost === 7) {
          if (card.manaCost < 7) return false;
        } else if (card.manaCost !== filters.manaCost) {
          return false;
        }
      }
      
      // Filter by card type
      if (filters.cardType !== 'all' && card.type !== filters.cardType) {
        return false;
      }
      
      // Filter by rarity
      if (filters.rarity !== 'all' && card.rarity !== filters.rarity) {
        return false;
      }
      
      // Filter by search text
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const nameMatch = card.name ? card.name.toLowerCase().includes(searchLower) : false;
        const descMatch = card.description ? card.description.toLowerCase().includes(searchLower) : false;
        const raceMatch = card.race ? card.race.toLowerCase().includes(searchLower) : false;
        const tribeMatch = card.tribe ? card.tribe.toLowerCase().includes(searchLower) : false;
        
        if (!nameMatch && !descMatch && !raceMatch && !tribeMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [fullCardDatabase, selectedClass, filters, neutralOnly]);
  
  // Count cards in the current deck
  const currentDeckSize = useMemo(() => {
    return Object.values(selectedDeck).reduce((total, count) => total + count, 0);
  }, [selectedDeck]);
  
  // Calculate mana curve for the current deck
  const manaCurve = useMemo(() => {
    const curve: { [key: number]: number } = {};
    
    Object.entries(selectedDeck).forEach(([cardId, count]) => {
      const card = fullCardDatabase.find(c => c.id === parseInt(cardId));
      if (card) {
        const manaCost = card.manaCost >= 7 ? 7 : card.manaCost;
        curve[manaCost] = (curve[manaCost] || 0) + count;
      }
    });
    
    return curve;
  }, [selectedDeck, fullCardDatabase]);
  
  // Handle adding card to deck
  const handleAddCard = (cardId: number) => {
    if (currentDeckSize >= maxCards) return;
    
    const card = fullCardDatabase.find(c => c.id === cardId);
    if (!card) return;
    
    const currentCount = selectedDeck[cardId] || 0;
    const maxCopies = card.rarity === 'legendary' ? MAX_COPIES_LEGENDARY : MAX_COPIES_NORMAL;
    
    if (currentCount < maxCopies) {
      playSoundEffect('card_draw');
      setSelectedDeck({
        ...selectedDeck,
        [cardId]: currentCount + 1
      });
    }
  };
  
  // Handle removing card from deck
  const handleRemoveCard = (cardId: number) => {
    const currentCount = selectedDeck[cardId];
    if (!currentCount) return;
    
    playSoundEffect('card_place');
    
    if (currentCount === 1) {
      // Remove the card entirely if only one copy
      const updatedDeck = { ...selectedDeck };
      delete updatedDeck[cardId];
      setSelectedDeck(updatedDeck);
    } else {
      // Reduce the count by 1
      setSelectedDeck({
        ...selectedDeck,
        [cardId]: currentCount - 1
      });
    }
  };
  
  // Handle filter updates
  const handleUpdateFilters = (newFilters: Partial<CollectionFilter>) => {
    setFilters({ ...filters, ...newFilters });
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      manaCost: 'all',
      cardType: 'all',
      rarity: 'all',
      searchText: '',
      hideNeutral: false,
    });
  };
  
  // Show card details popup
  const handleShowCardDetails = (card: CardData, event?: React.MouseEvent) => {
    setSelectedCardDetails(card);
    
    if (event) {
      setDetailPosition({ x: event.clientX, y: event.clientY });
    } else {
      setDetailPosition(undefined);
    }
  };
  
  // Close card details popup
  const handleCloseCardDetails = () => {
    setSelectedCardDetails(null);
  };
  
  return (
    <div className="deck-builder flex flex-col h-full bg-gray-900 text-white">
      {/* Header with deck info */}
      <div className="deck-header bg-gray-800 p-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-yellow-400">
            {neutralOnly ? 'Select 60 Neutral Cards' : 'Deck Builder'}
          </h1>
          
          {/* Class selector - Only show when NOT in neutralOnly mode */}
          {!neutralOnly && (
            <div className="class-selector">
              <select
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {classOptions.map(className => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hero selector - Only show for non-neutral classes and NOT in neutralOnly mode */}
          {!neutralOnly && selectedClass && selectedClass !== 'Neutral' && (
            <div className="hero-selector">
              <select
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                onChange={(e) => {
                  // This is just a visual selection, the actual hero class remains the same
                  playSoundEffect('card_place');
                }}
              >
                {/* Convert class name format to match hero data format */}
                {(() => {
                  // Ensure selectedClass exists before calling toLowerCase()
                  const heroClass = (selectedClass || "neutral").toLowerCase() as HeroClass;
                  const heroData = getHeroDataByClass(heroClass);
                  
                  if (!heroData) return null;
                  
                  return (
                    <>
                      <option value={heroData.id}>{heroData.name} (Default)</option>
                      {heroData.alternateHeroes?.map(hero => (
                        <option key={hero.id} value={hero.id}>
                          {hero.name}
                        </option>
                      ))}
                    </>
                  );
                })()}
              </select>
            </div>
          )}
          
          {/* Deck name input */}
          <div className="deck-name">
            <input
              type="text"
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white w-48"
              placeholder="Deck Name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Card counter */}
          <div className="card-counter text-sm">
            <span className={`font-bold ${currentDeckSize === maxCards ? 'text-green-400' : 'text-blue-400'}`}>
              {currentDeckSize}
            </span>
            <span className="text-gray-400">/{maxCards}</span>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <button 
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
              onClick={() => {
                const deckCode = exportDeck();
                navigator.clipboard.writeText(deckCode).then(() => {
                  alert(`Deck code copied to clipboard: ${deckCode}`);
                });
              }}
            >
              Export Deck
            </button>
            <button 
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white"
              onClick={() => {
                const deckCode = prompt('Enter deck code:');
                if (deckCode) {
                  const success = importDeck(deckCode);
                  if (!success) {
                    alert('Invalid deck code');
                  }
                }
              }}
            >
              Import Deck
            </button>
            <button 
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white"
              onClick={() => {
                // Check if deck has at least one card
                if (currentDeckSize === 0) {
                  alert("Cannot save an empty deck");
                  return;
                }
                
                if (!deckName || deckName.trim() === '') {
                  alert("Please give your deck a name before saving");
                  return;
                }
                
                // Get saveDeck function from the useGame store
                const { saveDeck } = useGame.getState();
                
                // Create deck info object
                const deckInfo = {
                  id: Date.now().toString(), // Generate a unique ID
                  name: deckName,
                  class: selectedClass,
                  cards: selectedDeck,
                  code: exportDeck()
                };
                
                // Save the deck
                saveDeck(deckInfo);
                alert(`Deck "${deckName}" saved successfully!`);
              }}
            >
              Save Deck
            </button>
            <button 
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white"
              onClick={() => clearDeck()}
            >
              Clear Deck
            </button>
            
            {/* Add Random Deck button */}
            <button 
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white ml-2"
              onClick={() => {
                // Clear existing deck
                clearDeck();
                
                if (neutralOnly) {
                  // Create a random neutral deck
                  const neutralCards = fullCardDatabase.filter(card => 
                    card.collectible && isNeutralCard(card)
                  );
                  
                  // Shuffle and pick cards
                  const shuffled = [...neutralCards].sort(() => Math.random() - 0.5);
                  const newDeck: { [cardId: number]: number } = {};
                  const cardCounts: { [cardId: number]: number } = {};
                  let totalCards = 0;
                  
                  for (const card of shuffled) {
                    if (totalCards >= maxCards) break;
                    if (!card || !card.id) continue;
                    
                    const cardId = card.id;
                    if (!cardCounts[cardId]) cardCounts[cardId] = 0;
                    
                    const isLegendary = card.rarity === 'legendary';
                    const maxCopiesAllowed = isLegendary ? 1 : 2;
                    
                    if (cardCounts[cardId] < maxCopiesAllowed) {
                      cardCounts[cardId]++;
                      newDeck[cardId] = (newDeck[cardId] || 0) + 1;
                      totalCards++;
                    }
                  }
                  
                  setSelectedDeck(newDeck);
                  playSoundEffect('card_draw');
                  setDeckName('Random Neutral Deck');
                } else {
                  // Don't create a random deck if no class is selected
                  if (!selectedClass || selectedClass === 'Neutral') {
                    alert('Please select a hero class first!');
                    return;
                  }
                  
                  // Create a random deck for the selected class
                  const randomCards = createClassDeck(selectedClass, maxCards);
                  
                  // Convert the array of cards to the deck format (cardId -> count)
                  const newDeck: { [cardId: number]: number } = {};
                  const cardCounts: { [cardId: number]: number } = {};
                  
                  randomCards.forEach((card: CardData) => {
                    if (!card || !card.id) return;
                    
                    const cardId = card.id;
                    if (!cardCounts[cardId]) cardCounts[cardId] = 0;
                    
                    const isLegendary = card.rarity === 'legendary';
                    const maxCopies = isLegendary ? 1 : 2;
                    
                    if (cardCounts[cardId] < maxCopies) {
                      cardCounts[cardId]++;
                      newDeck[cardId] = (newDeck[cardId] || 0) + 1;
                    }
                  });
                  
                  setSelectedDeck(newDeck);
                  playSoundEffect('card_draw');
                  setDeckName(`Random ${selectedClass} Deck`);
                }
              }}
            >
              Random Deck
            </button>
            
            {/* Add Start Game button */}
            {(onDeckSelected || onNeutralDeckComplete) && (
              <button 
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white ml-2"
                onClick={() => {
                  // Check if deck is complete
                  if (currentDeckSize < maxCards) {
                    alert(`Your deck must have ${maxCards} cards to start the game.`);
                    return;
                  }
                  
                  // If neutral deck callback is provided, use it
                  if (onNeutralDeckComplete) {
                    const cardIds: number[] = [];
                    Object.entries(selectedDeck).forEach(([cardIdStr, count]) => {
                      const cardId = parseInt(cardIdStr);
                      for (let i = 0; i < count; i++) {
                        cardIds.push(cardId);
                      }
                    });
                    onNeutralDeckComplete(cardIds);
                    return;
                  }
                  
                  // Create deck info object
                  const deckInfo = {
                    id: Date.now().toString(), // Generate a unique ID
                    name: deckName || "Custom Deck",
                    class: selectedClass,
                    cards: selectedDeck,
                    code: exportDeck()
                  };
                  
                  // Call the onDeckSelected callback with the deck info
                  if (onDeckSelected) onDeckSelected(deckInfo);
                }}
                disabled={currentDeckSize < maxCards}
              >
                Start Game
              </button>
            )}
            
            {/* Add Back button if provided */}
            {onBack && (
              <button 
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white ml-2"
                onClick={onBack}
              >
                Back
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Collection filters */}
      <CollectionFilters 
        filters={filters} 
        onUpdateFilters={handleUpdateFilters} 
        onClearFilters={handleClearFilters} 
      />
      
      {/* Main content area */}
      <div className="deck-content flex flex-1 overflow-hidden">
        {/* Card collection */}
        <div className="card-collection w-3/4 flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredCards.map((card) => (
            <ErrorBoundaryCard
              key={card.id ? card.id : `error-${Math.random()}`}
              card={card}
              count={card.id ? (selectedDeck[card.id] || 0) : 0}
              maxCount={card.rarity === 'legendary' ? MAX_COPIES_LEGENDARY : MAX_COPIES_NORMAL}
              onAdd={handleAddCard}
              canAdd={currentDeckSize < maxCards}
              showCardDetails={(card) => handleShowCardDetails(card)}
            />
          ))}
          
          {filteredCards.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="text-gray-500 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-400 mb-2">No cards found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
        
        {/* Deck sidebar */}
        <div className="deck-sidebar w-1/4 border-l border-gray-700 flex flex-col bg-gray-800">
          {/* Mana curve */}
          <ManaCurve manaCurve={manaCurve} maxCardCount={maxCards} />
          
          {/* Deck list */}
          <DeckList
            cards={selectedDeck}
            onRemoveCard={handleRemoveCard}
            availableCards={fullCardDatabase}
            currentDeckSize={currentDeckSize}
          />
        </div>
      </div>
      
      {/* Card detail popup */}
      {selectedCardDetails && (
        <CardDetailPopup
          card={selectedCardDetails}
          onClose={handleCloseCardDetails}
          position={detailPosition}
        />
      )}
    </div>
  );
};

export default DeckBuilder;