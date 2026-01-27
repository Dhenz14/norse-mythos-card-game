import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { routes } from './lib/routes';
import AIGameSimulator from './game/components/AIGameSimulator';
import { DeckInfo } from './game/types';

/**
 * Wrapper component for AI Game Simulator to provide default decks
 * This allows us to use the simulator without needing to select decks first
 */
function AIGameSimulatorWrapper() {
  const [goBack, setGoBack] = useState(false);
  
  // Sample deck info for Demonhunter
  const defaultDeck1: DeckInfo = {
    id: 'default-demonhunter',
    name: 'Random Demonhunter Deck',
    class: 'Demonhunter',
    cards: {
      // Some starter cards that should exist
      '1001': 1, '1002': 1, '2001': 2, '2002': 2, '2003': 1, 
      '3001': 1, '3002': 1, '4001': 2, '4002': 2, '5001': 2
    }
  };
  
  // Sample deck info for Druid
  const defaultDeck2: DeckInfo = {
    id: 'default-druid',
    name: 'Random Druid Deck',
    class: 'Druid',
    cards: {
      // Some starter cards that should exist
      '1001': 1, '1003': 1, '2001': 2, '2002': 2, '2004': 1, 
      '3003': 1, '3004': 1, '4003': 2, '4004': 2, '5002': 2
    }
  };
  
  // Handle back button functionality
  const handleBack = () => {
    setGoBack(true);
  };
  
  // If back is clicked, navigate to home
  if (goBack) {
    return <Navigate to={routes.home} />;
  }
  
  // Render the AI Game Simulator with default decks
  return (
    <AIGameSimulator 
      deck1={defaultDeck1} 
      deck2={defaultDeck2} 
      onBack={handleBack}
    />
  );
}

export default AIGameSimulatorWrapper;