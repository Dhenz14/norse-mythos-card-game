import React, { useState, useEffect, useMemo } from 'react';
import { HeroClass, DeckInfo } from '../types';
import DeckBuilder from './DeckBuilder';
import SavedDecksList from './SavedDecksList';
import HeroSelection from './HeroSelection';
import { useGameStore } from '../stores/gameStore';
import useGame from '../../lib/stores/useGame';

// This component handles the game setup flow:
// 1. Hero selection - choose your class
// 2. Show saved decks list or deck builder (filtered by class)
// 3. Starting the game

const GameSetup: React.FC = () => {
  // Local state to track whether we're showing the deck list or deck builder
  const [showDeckBuilder, setShowDeckBuilder] = useState(false);
  
  // Get game store state and actions
  const { setupStage, selectedHero, setSelectedHero, setSelectedDeck, startGame, savedDecks } = useGame();
  
  // Reset showDeckBuilder when returning to hero selection (fixes stale state bug)
  useEffect(() => {
    if (setupStage === 'hero_selection') {
      setShowDeckBuilder(false);
    }
  }, [setupStage]);
  
  // Get last played deck from localStorage for quick-start feature
  const lastPlayedDeck = useMemo(() => {
    try {
      const lastDeckId = localStorage.getItem('lastPlayedDeckId');
      const lastHero = localStorage.getItem('lastPlayedHero') as HeroClass | null;
      if (lastDeckId && lastHero && savedDecks.length > 0) {
        const deck = savedDecks.find(d => String(d.id || d.name) === lastDeckId);
        if (deck) {
          return { deck, hero: lastHero };
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return null;
  }, [savedDecks]);
  
  // Handler for hero selection
  const handleHeroSelect = (heroClass: HeroClass) => {
    setSelectedHero(heroClass);
  };
  
  // Handler for deck selection and game start
  const handleDeckSelect = (deck: DeckInfo) => {
    const deckId = String(deck.id || deck.name);
    setSelectedDeck(deckId);
    
    // If no hero selected yet (shouldn't happen with new flow), use deck's heroClass
    const heroClass = selectedHero || (deck.heroClass as HeroClass) || "neutral" as HeroClass;
    if (!selectedHero) {
      setSelectedHero(heroClass);
    }
    
    // Save for quick-start feature
    try {
      localStorage.setItem('lastPlayedDeckId', deckId);
      localStorage.setItem('lastPlayedHero', heroClass);
    } catch (e) {
      // Ignore localStorage errors
    }
    
    startGame();
  };
  
  // Quick-start handler - play with last used deck
  const handleQuickStart = () => {
    if (lastPlayedDeck) {
      setSelectedHero(lastPlayedDeck.hero);
      handleDeckSelect(lastPlayedDeck.deck);
    }
  };
  
  // Handler to go back to deck list from deck builder
  const handleBackToDeckList = () => {
    setShowDeckBuilder(false);
  };
  
  // Handler to show deck builder
  const handleCreateNewDeck = () => {
    setShowDeckBuilder(true);
  };
  
  return (
    <div className="game-setup h-full flex items-center justify-center">
      <div className="deck-container h-full w-full">
        {setupStage === 'hero_selection' ? (
          <HeroSelection 
            onHeroSelect={handleHeroSelect} 
            lastPlayedDeck={lastPlayedDeck}
            onQuickStart={handleQuickStart}
          />
        ) : showDeckBuilder ? (
          <DeckBuilder 
            heroClass={selectedHero || undefined}
            onDeckSelected={handleDeckSelect}
            onBack={handleBackToDeckList}
          />
        ) : (
          <SavedDecksList 
            onSelectDeck={handleDeckSelect}
            onCreateNewDeck={handleCreateNewDeck}
          />
        )}
      </div>
    </div>
  );
};

export default GameSetup;