/**
 * AI Game Simulation Panel
 * 
 * This component serves as the control panel for running AI simulations,
 * providing options to configure and run both visual and text-based simulations.
 */

import React, { useState, useEffect } from 'react';
import { DeckInfo } from '../game/types';
import UnifiedAIGameSimulator from '../game/components/UnifiedAIGameSimulator';

interface AIGameSimulationPanelProps {
  issue?: string; // Optional issue description for root cause analysis
}

/**
 * AI Game Simulation Panel
 * Provides controls and configuration options for AI game simulations
 */
export const AIGameSimulationPanel: React.FC<AIGameSimulationPanelProps> = ({ issue }) => {
  // Available decks for simulation
  const [availableDecks, setAvailableDecks] = useState<DeckInfo[]>([]);
  // Selected decks for player 1 and player 2
  const [player1Deck, setPlayer1Deck] = useState<string>('');
  const [player2Deck, setPlayer2Deck] = useState<string>('');
  // Simulation mode: 'visual' or 'text'
  const [simulationMode, setSimulationMode] = useState<'visual' | 'text'>('visual');
  // Number of games to simulate
  const [numberOfGames, setNumberOfGames] = useState<number>(1);
  // Simulation speed (1-5)
  const [simulationSpeed, setSimulationSpeed] = useState<number>(3);
  // State to track if simulation is running
  const [isRunning, setIsRunning] = useState<boolean>(false);
  // Results of simulation
  const [results, setResults] = useState<any>(null);
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Error message
  const [error, setError] = useState<string | null>(null);

  // Fetch available decks on component mount
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        // Fetch decks from API
        const response = await fetch('/api/decks');
        
        if (!response.ok) {
          throw new Error('Failed to fetch available decks');
        }
        
        const data = await response.json();
        setAvailableDecks(data.decks || []);
        
        // Set default decks if available
        if (data.decks && data.decks.length >= 2) {
          setPlayer1Deck(data.decks[0].id);
          setPlayer2Deck(data.decks[1].id);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching decks:', err);
        setError('Failed to load available decks. Using default decks.');
        
        // Set default decks for fallback
        const defaultDecks: DeckInfo[] = [
          { id: 'mage', name: 'Mage', class: 'Mage' },
          { id: 'warrior', name: 'Warrior', class: 'Warrior' },
          { id: 'priest', name: 'Priest', class: 'Priest' },
          { id: 'rogue', name: 'Rogue', class: 'Rogue' },
          { id: 'druid', name: 'Druid', class: 'Druid' },
          { id: 'hunter', name: 'Hunter', class: 'Hunter' },
          { id: 'warlock', name: 'Warlock', class: 'Warlock' },
          { id: 'paladin', name: 'Paladin', class: 'Paladin' },
          { id: 'shaman', name: 'Shaman', class: 'Shaman' }
        ];
        
        setAvailableDecks(defaultDecks);
        setPlayer1Deck('mage');
        setPlayer2Deck('warrior');
        setIsLoading(false);
      }
    };

    fetchDecks();
  }, []);

  // Start simulation
  const startSimulation = () => {
    if (!player1Deck || !player2Deck) {
      setError('Please select decks for both players');
      return;
    }
    
    setIsRunning(true);
    setError(null);
  };

  // Stop simulation
  const stopSimulation = () => {
    setIsRunning(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Simulation Configuration</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Player 1 Deck Selection */}
          <div>
            <label htmlFor="player1-deck" className="block font-medium mb-1">
              Player 1 Deck
            </label>
            <select
              id="player1-deck"
              value={player1Deck}
              onChange={(e) => setPlayer1Deck(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isRunning || isLoading}
            >
              <option value="">Select a deck</option>
              {availableDecks.map((deck) => (
                <option key={`p1-${deck.id}`} value={deck.id}>
                  {deck.name} ({deck.class})
                </option>
              ))}
            </select>
          </div>
          
          {/* Player 2 Deck Selection */}
          <div>
            <label htmlFor="player2-deck" className="block font-medium mb-1">
              Player 2 Deck
            </label>
            <select
              id="player2-deck"
              value={player2Deck}
              onChange={(e) => setPlayer2Deck(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isRunning || isLoading}
            >
              <option value="">Select a deck</option>
              {availableDecks.map((deck) => (
                <option key={`p2-${deck.id}`} value={deck.id}>
                  {deck.name} ({deck.class})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Simulation Mode */}
          <div>
            <label className="block font-medium mb-1">Simulation Mode</label>
            <div className="flex gap-2">
              <button
                className={`flex-1 py-2 px-3 rounded ${
                  simulationMode === 'visual' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setSimulationMode('visual')}
                disabled={isRunning}
              >
                Visual
              </button>
              <button
                className={`flex-1 py-2 px-3 rounded ${
                  simulationMode === 'text' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setSimulationMode('text')}
                disabled={isRunning}
              >
                Text-only
              </button>
            </div>
          </div>
          
          {/* Number of Games */}
          <div>
            <label htmlFor="num-games" className="block font-medium mb-1">
              Number of Games
            </label>
            <input
              id="num-games"
              type="number"
              min="1"
              max="100"
              value={numberOfGames}
              onChange={(e) => setNumberOfGames(parseInt(e.target.value) || 1)}
              className="w-full p-2 border rounded"
              disabled={isRunning || isLoading}
            />
          </div>
          
          {/* Simulation Speed */}
          <div>
            <label className="block font-medium mb-1">Speed</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((speed) => (
                <button
                  key={`speed-${speed}`}
                  className={`flex-1 py-2 px-2 rounded ${
                    simulationSpeed === speed 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setSimulationSpeed(speed)}
                  disabled={isRunning}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Start/Stop Button */}
        <div className="flex justify-end">
          {!isRunning ? (
            <button
              onClick={startSimulation}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
              disabled={isLoading || !player1Deck || !player2Deck}
            >
              Start Simulation
            </button>
          ) : (
            <button
              onClick={stopSimulation}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              Stop Simulation
            </button>
          )}
        </div>
      </div>
      
      {/* Simulation Component */}
      {isRunning && (
        <div className="mt-6 border-t pt-6">
          <UnifiedAIGameSimulator 
            player1DeckId={player1Deck}
            player2DeckId={player2Deck}
            simulationMode={simulationMode}
            speed={simulationSpeed}
            numberOfGames={numberOfGames}
            issueDescription={issue}
            onSimulationComplete={(results) => {
              setResults(results);
              setIsRunning(false);
            }}
          />
        </div>
      )}
      
      {/* Results Section */}
      {results && !isRunning && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">Simulation Results</h3>
          <div className="bg-gray-100 p-4 rounded">
            <p>Player 1 Wins: {results.player1Wins}</p>
            <p>Player 2 Wins: {results.player2Wins}</p>
            <p>Total Games: {results.totalGames}</p>
            {results.averageTurns && (
              <p>Average Game Length: {results.averageTurns.toFixed(1)} turns</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGameSimulationPanel;