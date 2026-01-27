import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeckInfo, HeroClass } from '../types';
import useGame from '../../lib/stores/useGame';
import { useGameStore } from '../stores/gameStore';
import { getHeroDataByClass } from '../data/heroes';
// DeckTester moved to archived_testing_waste - now using live game testing
import AIGameSimulator from './AIGameSimulator';
import { useNavigate } from 'react-router-dom';

interface SavedDecksListProps {
  onSelectDeck: (deck: DeckInfo) => void;
  onCreateNewDeck: () => void;
}

const SavedDecksList: React.FC<SavedDecksListProps> = ({ onSelectDeck, onCreateNewDeck }) => {
  const { savedDecks } = useGame();
  // DeckTester functionality moved to live game testing
  const [showAISimulator, setShowAISimulator] = useState(false);
  const [selectedDecks, setSelectedDecks] = useState<{deck1?: DeckInfo; deck2?: DeckInfo}>({});
  const navigate = useNavigate();

  // Ensure savedDecks is an array before processing
  const validDecks = Array.isArray(savedDecks) ? savedDecks : [];
  
  // Group decks by class
  const decksByClass = validDecks.reduce((groups, deck) => {
    // Make sure deck is an object and deck.class exists and is a string
    if (!deck || typeof deck !== 'object') {
      console.warn("Invalid deck found:", deck);
      return groups;
    }
    
    const className = deck.class || "Unknown";
    if (!groups[className]) {
      groups[className] = [];
    }
    groups[className].push(deck);
    return groups;
  }, {} as Record<string, DeckInfo[]>);

  return (
    <div className="saved-decks-container h-full flex flex-col bg-gray-900 text-white">
      <div className="deck-header bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white flex items-center space-x-2"
            onClick={() => navigate('/')}
            title="Return to Homepage"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </button>
          <h1 className="text-xl font-bold text-yellow-400">My Decks</h1>
        </div>
        <div className="flex space-x-3">
          <button
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md text-white"
            onClick={() => setShowAISimulator(true)}
            disabled={validDecks.length < 2}
            title={validDecks.length < 2 ? "You need at least 2 decks for AI play" : "Watch AI play a game with selected decks"}
          >
            AI Play
          </button>
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white"
            onClick={onCreateNewDeck}
          >
            Create New Deck
          </button>
        </div>
      </div>
      
      {/* Deck Tester Modal - functionality moved to live game testing */}
      
      {/* AI Game Simulator */}
      <AnimatePresence>
        {showAISimulator && selectedDecks.deck1 && selectedDecks.deck2 && (
          <AIGameSimulator 
            deck1={selectedDecks.deck1} 
            deck2={selectedDecks.deck2} 
            onBack={() => {
              setShowAISimulator(false);
              setSelectedDecks({});
            }} 
          />
        )}
      </AnimatePresence>
      
      {/* AI Deck Selection Modal */}
      <AnimatePresence>
        {showAISimulator && (!selectedDecks.deck1 || !selectedDecks.deck2) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-yellow-400">Select AI Decks</h2>
                <button 
                  onClick={() => {
                    setShowAISimulator(false);
                    setSelectedDecks({});
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold mb-2">AI Deck 1: {selectedDecks.deck1?.name || "Not Selected"}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {validDecks.slice(0, 6).map(deck => (
                      <button
                        key={deck.id}
                        className={`deck-select-item w-full text-left p-3 rounded cursor-pointer border ${
                          selectedDecks.deck1?.id === deck.id ? 'border-green-500 bg-green-900 bg-opacity-20' : 'border-gray-700 hover:border-blue-500'
                        }`}
                        onClick={() => setSelectedDecks(prev => ({ ...prev, deck1: deck }))}
                      >
                        <div className="font-semibold">{deck.name || "Unnamed"}</div>
                        <div className="text-sm text-gray-400">{deck.class || "Unknown"}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold mb-2">AI Deck 2: {selectedDecks.deck2?.name || "Not Selected"}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {validDecks.slice(0, 6).map(deck => (
                      <button
                        key={deck.id}
                        className={`deck-select-item w-full text-left p-3 rounded cursor-pointer border ${
                          selectedDecks.deck2?.id === deck.id ? 'border-green-500 bg-green-900 bg-opacity-20' : 'border-gray-700 hover:border-blue-500'
                        }`}
                        onClick={() => setSelectedDecks(prev => ({ ...prev, deck2: deck }))}
                      >
                        <div className="font-semibold">{deck.name || "Unnamed"}</div>
                        <div className="text-sm text-gray-400">{deck.class || "Unknown"}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAISimulator(false);
                      setSelectedDecks({});
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Continue with simulation if both decks are selected
                      if (selectedDecks.deck1 && selectedDecks.deck2) {
                        console.log('[AI Debug] START BUTTON CLICKED with decks:', {
                          deck1: selectedDecks.deck1.name, 
                          deck2: selectedDecks.deck2.name
                        });
                        
                        try {
                          // Get the resetGameState function from the game store
                          const { resetGameState } = useGameStore.getState();
                          
                          // First reset the game state completely to ensure a clean start
                          console.log('[AI Debug] Resetting game state before starting AI game');
                          resetGameState();
                          
                          // Store selected decks in localStorage
                          localStorage.setItem('aiDeck1', JSON.stringify(selectedDecks.deck1));
                          localStorage.setItem('aiDeck2', JSON.stringify(selectedDecks.deck2));
                          
                          // Close selection modal and start simulator directly
                          console.log('[AI Debug] Setting showAISimulator to true');
                          setShowAISimulator(true);
                        } catch (err) {
                          console.error('[AI Debug] Error starting AI game:', err);
                          // Still show the simulator even if there was an error
                          setShowAISimulator(true);
                        }
                      }
                    }}
                    disabled={!selectedDecks.deck1 || !selectedDecks.deck2}
                    className={`px-4 py-2 rounded-md text-white flex items-center ${
                      selectedDecks.deck1 && selectedDecks.deck2 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <span>Start AI Game</span>
                    {selectedDecks.deck1 && selectedDecks.deck2 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                    {(!selectedDecks.deck1 || !selectedDecks.deck2) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="deck-list-content deck-selection flex-1 overflow-y-auto p-6" style={{pointerEvents: 'auto'}}>
        {Object.keys(decksByClass).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="empty-decks-icon mb-4 w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No Saved Decks</h2>
            <p className="text-gray-400 mb-6">You haven't created any decks yet. Start by creating a new deck!</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-bold"
                onClick={onCreateNewDeck}
              >
                Create Your First Deck
              </button>
              <button
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold flex items-center justify-center space-x-2"
                onClick={() => navigate('/')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Return Home</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(decksByClass).map(([className, decks]) => (
              <div key={className} className="class-group mb-8">
                <h2 className="text-lg font-bold mb-4 text-blue-400">{className}</h2>
                <div className="decks-grid grid grid-cols-1 gap-4">
                  {decks.map(deck => {
                    if (!deck || typeof deck !== 'object') {
                      console.error("Invalid deck in class group:", className, deck);
                      return null;
                    }
                    
                    if (!deck.cards || typeof deck.cards !== 'object') {
                      console.error("Deck has invalid cards property:", deck);
                      return null;
                    }
                    
                    // Convert class name format to match hero data format
                    const heroClass = (deck.class || "neutral").toLowerCase() as HeroClass;
                    const heroData = getHeroDataByClass(heroClass);
                    const heroName = heroData ? heroData.name : (deck.class || "Unknown Class");
                    
                    // Safely calculate card count
                    let cardCount = 0;
                    try {
                      cardCount = Object.values(deck.cards).reduce((sum, count) => {
                        // Ensure count is a number
                        const numCount = typeof count === 'number' ? count : 0;
                        return sum + numCount;
                      }, 0);
                    } catch (e) {
                      console.error("Error calculating card count:", e, deck.cards);
                    }

                    return (
                      <motion.div
                        key={deck.id}
                        className="deck-card clickable-deck p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        style={{pointerEvents: 'auto'}}
                        onClick={() => onSelectDeck(deck)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{deck.name || "Unnamed Deck"}</h3>
                            <p className="text-sm text-gray-400">{heroName}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400">Cards:</span>
                            <p className={`font-bold ${cardCount === 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {cardCount}/30
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedDecksList;