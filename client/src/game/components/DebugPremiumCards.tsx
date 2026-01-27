/**
 * DebugPremiumCards.tsx
 * 
 * This component is used for testing and debugging the new premium card rendering system.
 * It displays a variety of cards with different quality settings to showcase the
 * TripoSR-inspired advanced rendering features and StableDiffusion-inspired effects.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PremiumCard from './PremiumCard';
import useCardDatabase from '../hooks/useCardDatabase';
import { CardData } from '../types';

const DebugPremiumCards: React.FC = () => {
  const navigate = useNavigate();
  const cardDatabase = useCardDatabase();
  const [cards, setCards] = useState<CardData[]>([]);
  const [quality, setQuality] = useState<'normal' | 'premium' | 'golden' | 'diamond'>('premium');
  const [showAdvancedEffects, setShowAdvancedEffects] = useState(true);
  
  // Load some sample cards on mount
  useEffect(() => {
    // Sample from different card types and rarities
    const sampleCardIds = [
      // Common cards
      1000, // Neutral common
      2000, // Class common
      
      // Rare cards
      1100, // Neutral rare
      2100, // Class rare
      
      // Epic cards
      1200, // Neutral epic
      2200, // Class epic
      
      // Legendary cards
      1300, // Neutral legendary
      2300, // Class legendary
      
      // Different types
      3000, // Spell
      4000, // Weapon
      5000, // Hero card
    ];
    
    // Get all cards from the database
    const allCards = cardDatabase.getAllCards();
    
    // Use specific cards if available, otherwise use the first few cards from the database
    const fetchedCards = sampleCardIds
      .map(id => cardDatabase.getCardById(id))
      .filter(card => card !== undefined) as CardData[];
    
    // If we couldn't get the specific cards, just use the first few cards in the database
    if (fetchedCards.length < 5 && allCards.length > 0) {
      setCards(allCards.slice(0, 10));
    } else {
      setCards(fetchedCards);
    }
  }, [cardDatabase]);
  
  // Handle quality change
  const handleQualityChange = (newQuality: 'normal' | 'premium' | 'golden' | 'diamond') => {
    setQuality(newQuality);
  };
  
  // Handle card click
  const handleCardClick = (card: CardData) => {
    console.log('Card clicked:', card);
  };
  
  return (
    <div className="debug-premium-cards min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Premium Card Rendering Debug</h1>
          
          <button 
            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            onClick={() => navigate('/collection')}
          >
            Back to Collection
          </button>
        </div>
        
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Configuration</h2>
          
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <p className="font-medium">Card Quality:</p>
              <div className="flex gap-2">
                {(['normal', 'premium', 'golden', 'diamond'] as const).map(q => (
                  <button
                    key={q}
                    className={`px-3 py-1 rounded-md capitalize ${
                      quality === q 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => handleQualityChange(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">Advanced Effects:</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAdvancedEffects}
                  onChange={() => setShowAdvancedEffects(!showAdvancedEffects)}
                  className="w-5 h-5"
                />
                <span>Enable Advanced Effects</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {cards.map(card => (
            <motion.div
              key={card.id}
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <div className="w-56 h-80">
                <PremiumCard
                  card={card}
                  quality={quality}
                  scale={1.2}
                  showStats={true}
                  showText={true}
                  showFrame={true}
                  showEffects={showAdvancedEffects}
                  useAdvancedShaders={showAdvancedEffects}
                  useNoiseEffects={showAdvancedEffects}
                  usePremiumTransitions={showAdvancedEffects}
                  onClick={() => handleCardClick(card)}
                  interactive={true}
                />
              </div>
              <div className="mt-2 text-center">
                <p className="font-semibold">{card.name}</p>
                <p className="text-sm text-gray-400">ID: {card.id}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-gray-400">Loading cards...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPremiumCards;