import React, { useState, useEffect } from 'react';
import { CardData, DiscoveryState, CardType, CardRarity, HeroClass } from '../types';
import { Card } from './Card';
import { createCardInstance } from '../utils/cards/cardUtils';
import { filterCards } from '../utils/discoveryUtils';
import { useAudio } from '../../lib/stores/useAudio';

interface DiscoveryModalProps {
  discoveryState: DiscoveryState;
  onCardSelect: (card: CardData | null) => void;
}

export const DiscoveryModal: React.FC<DiscoveryModalProps> = ({
  discoveryState,
  onCardSelect
}) => {
  const { playSoundEffect } = useAudio();
  
  console.log('[DiscoveryModal] Rendering with discoveryState:', discoveryState);
  console.log('[DiscoveryModal] active:', discoveryState?.active, 'options:', discoveryState?.options?.length);
  
  // Guard against invalid discovery state - handle case where game is over
  // but discovery UI is attempting to render
  if (!discoveryState || !discoveryState.options || !discoveryState.active) {
    console.error("DiscoveryModal: Invalid discovery state provided", discoveryState);
    // Auto-close the modal to avoid freezing the UI
    setTimeout(() => onCardSelect(null), 100);
    return null;
  }
  
  console.log('[DiscoveryModal] Valid discovery state, rendering', discoveryState.options.length, 'options');
  
  // Initialize filters from discovery state
  const [cardType, setCardType] = useState<CardType | 'any'>(
    discoveryState.filters?.type || 'any'
  );
  const [cardRarity, setCardRarity] = useState<CardRarity | 'any'>(
    discoveryState.filters?.rarity || 'any'
  );
  const [manaCost, setManaCost] = useState<number | 'any'>(
    discoveryState.filters?.manaCost || 'any'
  );
  
  // Initialize filtered options
  const [filteredOptions, setFilteredOptions] = useState<CardData[]>(discoveryState.options);
  
  // Apply filters when they change
  useEffect(() => {
    if (!discoveryState.allOptions) {
      return;
    }
    
    const filtered = filterCards(discoveryState.allOptions, {
      type: cardType,
      rarity: cardRarity,
      manaCost: manaCost
    });
    
    setFilteredOptions(filtered.length > 0 ? filtered : discoveryState.options);
  }, [cardType, cardRarity, manaCost, discoveryState.allOptions]);
  
  const handleCardClick = (card: CardData) => {
    console.log("DiscoveryModal: Card selected:", card.name);
    // Play sound effect when a card is selected
    playSoundEffect('spell_cast');
    onCardSelect(card);
  };
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCardType(e.target.value as CardType | 'any');
  };
  
  const handleRarityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCardRarity(e.target.value as CardRarity | 'any');
  };
  
  const handleManaCostChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setManaCost(value === 'any' ? 'any' : parseInt(value));
  };
  
  const resetFilters = () => {
    setCardType('any');
    setCardRarity('any');
    setManaCost('any');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-4xl w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">Discover a Card</h2>
          <p className="text-gray-300 mt-2">Choose one of these cards to add to your hand</p>
        </div>
        
        {/* Filter controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1 text-sm">Card Type</label>
            <select 
              value={cardType} 
              onChange={handleTypeChange}
              className="bg-gray-800 text-white p-2 rounded border border-gray-600 min-w-[120px]"
            >
              <option value="any">Any Type</option>
              <option value="minion">Minion</option>
              <option value="spell">Spell</option>
              <option value="weapon">Weapon</option>
              <option value="secret">Secret</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1 text-sm">Rarity</label>
            <select 
              value={cardRarity} 
              onChange={handleRarityChange}
              className="bg-gray-800 text-white p-2 rounded border border-gray-600 min-w-[120px]"
            >
              <option value="any">Any Rarity</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-gray-300 mb-1 text-sm">Mana Cost</label>
            <select 
              value={manaCost === 'any' ? 'any' : manaCost.toString()} 
              onChange={handleManaCostChange}
              className="bg-gray-800 text-white p-2 rounded border border-gray-600 min-w-[120px]"
            >
              <option value="any">Any Cost</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((cost) => (
                <option key={cost} value={cost.toString()}>{cost} Mana</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={resetFilters}
              className="bg-red-700 hover:bg-red-600 text-white px-3 py-2 rounded"
            >
              Reset Filters
            </button>
          </div>
        </div>
        
        {/* Display number of results */}
        <div className="text-center mb-4 text-gray-300">
          <p>
            {filteredOptions.length} {filteredOptions.length === 1 ? 'card' : 'cards'} found
            {filteredOptions.length === 0 && (
              <span className="block text-yellow-500 mt-1">
                No cards match your filters. Try different criteria.
              </span>
            )}
          </p>
        </div>
        
        {/* Card options */}
        <div className="flex flex-wrap justify-center gap-6 my-8">
          {filteredOptions.map((card) => {
            // Convert CardData to CardInstance for rendering
            const cardInstance = createCardInstance({
              ...card,
              // Ensure the id is string to avoid collision with actual cards
              id: card.id
            });
            
            return (
              <div 
                key={card.id} 
                className="transform transition-transform hover:scale-110 hover:drop-shadow-xl"
                style={{ position: 'relative' }} // Add relative positioning
              >
                {/* Card component - only this component has the onClick handler */}
                <Card 
                  card={card} // Pass CardData directly instead of CardInstance to avoid type issues
                  isInHand={false}
                  isPlayable={true}
                  scale={1.1} // Make the card slightly larger
                  onClick={() => {
                    console.log("DiscoveryModal: Card selected:", card.name);
                    handleCardClick(card);
                  }}
                />
                
                <div className="mt-4 text-center">
                  <button 
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md transition-colors"
                    onClick={(e) => {
                      e.stopPropagation(); // Stop event bubbling
                      console.log("DiscoveryModal: Card selected via button:", card.name);
                      handleCardClick(card);
                    }}
                  >
                    Select
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center">
          <button 
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            onClick={() => {
              // Play a different sound when skipping
              playSoundEffect('error');
              onCardSelect(null); // Skip the discovery
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};