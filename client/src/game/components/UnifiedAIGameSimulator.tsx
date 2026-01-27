/**
 * Unified AI Game Simulator
 * 
 * This component integrates both visual and text-based AI simulation modes
 * with Root Cause Analysis for automated bug detection.
 * 
 * It serves as a bridge between the existing AI simulation implementations,
 * providing a unified interface for running AI vs AI games.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameLog } from './GameLog';
import useGame from '../../lib/stores/useGame';
import { DeckInfo, CardInstance } from '../../game/types';
import './AIGameSimulator.css';

interface UnifiedAIGameSimulatorProps {
  player1DeckId: string;
  player2DeckId: string;
  simulationMode: 'visual' | 'text';
  speed: number;
  numberOfGames: number;
  issueDescription?: string;
  onSimulationComplete?: (results: {
    player1Wins: number;
    player2Wins: number;
    totalGames: number;
    averageTurns?: number;
  }) => void;
}

/**
 * Unified AI Game Simulator Component
 * Integrates visual and text-based simulation modes with RCA
 */
const UnifiedAIGameSimulator: React.FC<UnifiedAIGameSimulatorProps> = ({
  player1DeckId,
  player2DeckId,
  simulationMode,
  speed,
  numberOfGames,
  issueDescription,
  onSimulationComplete
}) => {
  // Game state and logs
  const [gameState, setGameState] = useState<any>(null);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Simulation control states
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [currentGameNumber, setCurrentGameNumber] = useState<number>(1);
  
  // Results tracking
  const [player1Wins, setPlayer1Wins] = useState<number>(0);
  const [player2Wins, setPlayer2Wins] = useState<number>(0);
  const [turnCounts, setTurnCounts] = useState<number[]>([]);
  
  // Timing and animation control
  const delayRef = useRef<number>(1000 / speed);
  const timerId = useRef<NodeJS.Timeout | null>(null);
  
  // Analysis system states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  // Game store access (for visual mode)
  const gameStore = useGame();
  
  // Update delay when speed changes
  useEffect(() => {
    delayRef.current = 1000 / speed;
  }, [speed]);
  
  // Initialize game on component mount
  useEffect(() => {
    const initializeGame = async () => {
      try {
        // Add initial log entry
        addLogEntry(`Initializing ${simulationMode} simulation...`);
        addLogEntry(`Player 1: ${player1DeckId}, Player 2: ${player2DeckId}`);
        
        // Load game state - can be from server API or local if we're using visual mode
        if (simulationMode === 'text') {
          // For text mode, we get the initial state from the server
          const response = await fetch('/api/simulation/initialize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              player1DeckId,
              player2DeckId,
              enableRootCauseAnalysis: !!issueDescription,
              issueDescription
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to initialize game simulation');
          }
          
          const data = await response.json();
          setGameState(data.gameState);
          addLogEntry('Game initialized successfully');
          addLogEntry('Starting simulation...');
          
          // Start the simulation loop after a short delay
          setTimeout(() => {
            runSimulationStep();
          }, 500);
        } else {
          // For visual mode, we initialize the game using the local game store
          // Note: This approach allows us to see the game visually with all card renders
          addLogEntry('Initializing visual game simulation...');
          
          // Get the decks - assume the gameStore has methods to set up a game
          // These method calls would need to match your actual game store implementation
          gameStore.setupGame({
            player1: {
              deckId: player1DeckId,
              isAI: true
            },
            player2: {
              deckId: player2DeckId,
              isAI: true
            }
          });
          
          addLogEntry('Game initialized successfully');
          addLogEntry('Starting visual simulation...');
          
          // Start the simulation loop after a short delay to let UI render
          setTimeout(() => {
            runSimulationStep();
          }, 1000);
        }
      } catch (err) {
        console.error('Error initializing game:', err);
        setError('Failed to initialize game simulation. Please try again.');
      }
    };
    
    initializeGame();
    
    // Cleanup function to clear any timers when component unmounts
    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, []);
  
  // Add entry to the log
  const addLogEntry = useCallback((entry: string) => {
    setLogEntries(prev => [...prev, entry]);
  }, []);
  
  // Pause/resume simulation
  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      if (prev) {
        // If resuming, start simulation again
        setTimeout(runSimulationStep, 100);
      }
      return !prev;
    });
  }, []);
  
  // Main simulation step
  const runSimulationStep = useCallback(async () => {
    // Don't proceed if paused or game is over
    if (isPaused || isGameOver) {
      return;
    }
    
    try {
      if (simulationMode === 'text') {
        // For text-based mode, we call the API to get the next state
        const response = await fetch('/api/simulation/step', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameState,
            enableRootCauseAnalysis: !!issueDescription
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to simulate game step');
        }
        
        const data = await response.json();
        
        // Update game state
        setGameState(data.gameState);
        
        // Add log entries
        data.logs.forEach((log: string) => {
          addLogEntry(log);
        });
        
        // Check if game is over
        if (data.gameOver) {
          handleGameOver(data.winner);
        } else {
          // Schedule next simulation step
          timerId.current = setTimeout(runSimulationStep, delayRef.current);
        }
      } else {
        // For visual mode, we use the game store to advance the game
        // Here we'll need to adapt to how your game store handles AI turns
        
        // This is a conceptual approach - adjust according to your actual implementation
        const result = gameStore.runAITurn();
        
        // If the turn resulted in a game-ending state
        if (result && result.gameOver) {
          handleGameOver(result.winner);
        } else {
          // Log the action that was taken
          if (result && result.action) {
            addLogEntry(`AI performed action: ${result.action}`);
          }
          
          // Schedule next simulation step
          timerId.current = setTimeout(runSimulationStep, delayRef.current);
        }
      }
    } catch (err) {
      console.error('Error in simulation step:', err);
      setError('An error occurred during simulation. Please try again.');
    }
  }, [gameState, isPaused, isGameOver, simulationMode, issueDescription]);
  
  // Handle game over state
  const handleGameOver = useCallback((gameWinner: string) => {
    setIsGameOver(true);
    setWinner(gameWinner);
    
    // Update win counts
    if (gameWinner === 'player1') {
      setPlayer1Wins(prev => prev + 1);
      addLogEntry(`Game ${currentGameNumber} complete: Player 1 wins!`);
    } else {
      setPlayer2Wins(prev => prev + 1);
      addLogEntry(`Game ${currentGameNumber} complete: Player 2 wins!`);
    }
    
    // Record turn count
    const gameTurns = gameState.currentTurn || 0;
    setTurnCounts(prev => [...prev, gameTurns]);
    
    // Check if we should start another game
    if (currentGameNumber < numberOfGames) {
      addLogEntry(`Starting next game (${currentGameNumber + 1}/${numberOfGames})...`);
      
      // Reset game state for next match
      setCurrentGameNumber(prev => prev + 1);
      setIsGameOver(false);
      setWinner(null);
      
      // Initialize next game after a short delay
      setTimeout(async () => {
        try {
          if (simulationMode === 'text') {
            // For text mode, initialize a new game from the server
            const response = await fetch('/api/simulation/initialize', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                player1DeckId,
                player2DeckId,
                enableRootCauseAnalysis: !!issueDescription,
                issueDescription
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to initialize next game');
            }
            
            const data = await response.json();
            setGameState(data.gameState);
            addLogEntry('New game initialized');
            
            // Start the next simulation
            setTimeout(runSimulationStep, 500);
          } else {
            // For visual mode, reset the game store
            gameStore.resetGame();
            gameStore.setupGame({
              player1: {
                deckId: player1DeckId,
                isAI: true
              },
              player2: {
                deckId: player2DeckId,
                isAI: true
              }
            });
            
            addLogEntry('New game initialized');
            
            // Start the next simulation
            setTimeout(runSimulationStep, 1000);
          }
        } catch (err) {
          console.error('Error initializing next game:', err);
          setError('Failed to start the next game. Please try again.');
        }
      }, 1500);
    } else {
      // All games completed
      const totalGames = player1Wins + player2Wins + 1; // Include current game
      const avgTurns = turnCounts.reduce((sum, turns) => sum + turns, 0) / totalGames;
      
      addLogEntry('----------------------------');
      addLogEntry(`All ${numberOfGames} games completed!`);
      addLogEntry(`Final Results - Player 1: ${player1Wins}, Player 2: ${player2Wins}`);
      addLogEntry(`Average game length: ${avgTurns.toFixed(1)} turns`);
      
      // Submit simulation results for analysis if root cause analysis is enabled
      if (issueDescription) {
        setIsAnalyzing(true);
        addLogEntry('Performing root cause analysis...');
        
        // We'd make an API call to analyze the simulation results
        fetch('/api/simulation/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            issueDescription,
            player1Wins,
            player2Wins,
            numberOfGames,
            logs: logEntries
          })
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to analyze simulation results');
            }
            return response.json();
          })
          .then(data => {
            setAnalysisResults(data);
            setIsAnalyzing(false);
            
            // Log analysis results
            addLogEntry('Root Cause Analysis Complete!');
            addLogEntry(`Identified issue: ${data.issue}`);
            addLogEntry(`Proposed solution: ${data.solution}`);
          })
          .catch(err => {
            console.error('Error in root cause analysis:', err);
            setIsAnalyzing(false);
            setError('Failed to complete root cause analysis.');
          });
      }
      
      // Call the provided completion callback if available
      if (onSimulationComplete) {
        onSimulationComplete({
          player1Wins,
          player2Wins,
          totalGames,
          averageTurns: avgTurns
        });
      }
    }
  }, [
    currentGameNumber, 
    numberOfGames, 
    gameState, 
    player1Wins, 
    player2Wins, 
    turnCounts, 
    onSimulationComplete, 
    issueDescription,
    player1DeckId,
    player2DeckId,
    simulationMode
  ]);
  
  // Render text-based simulation mode
  if (simulationMode === 'text') {
    return (
      <div className="ai-game-simulator-minimal">
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <div className="text-mode-header">
          <h3>
            Text Simulation: Game {currentGameNumber}/{numberOfGames} 
            {!isGameOver && !isAnalyzing && (
              <span className="text-sm text-gray-500 ml-2">
                {isPaused ? '(Paused)' : '(Running)'}
              </span>
            )}
            {isAnalyzing && <span className="text-sm text-blue-500 ml-2">(Analyzing...)</span>}
          </h3>
          
          <div className="flex space-x-2 mt-2">
            {!isGameOver && (
              <button 
                onClick={togglePause}
                className={`px-3 py-1 rounded text-sm ${
                  isPaused 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
            
            <button 
              onClick={() => {
                // Force skip to next game or end simulation
                if (currentGameNumber < numberOfGames) {
                  handleGameOver(Math.random() > 0.5 ? 'player1' : 'player2');
                } else if (onSimulationComplete) {
                  onSimulationComplete({
                    player1Wins,
                    player2Wins,
                    totalGames: player1Wins + player2Wins,
                    averageTurns: turnCounts.reduce((sum, t) => sum + t, 0) / turnCounts.length
                  });
                }
              }}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
            >
              {currentGameNumber < numberOfGames ? 'Skip to Next Game' : 'End Simulation'}
            </button>
          </div>
        </div>
        
        <GameLog 
          entries={logEntries} 
          maxHeight="400px"
          autoScroll={true}
          className="mt-4"
        />
        
        {/* Analysis Results Display */}
        {analysisResults && (
          <div className="mt-4 p-4 border rounded bg-blue-50">
            <h3 className="font-medium text-lg mb-2">Root Cause Analysis Results</h3>
            <div className="text-sm">
              <p className="mb-2"><strong>Issue:</strong> {analysisResults.issue}</p>
              <p className="mb-2"><strong>Solution:</strong> {analysisResults.solution}</p>
              {analysisResults.code && (
                <div className="mt-2">
                  <p className="font-medium">Suggested Code Fix:</p>
                  <pre className="bg-gray-900 text-green-400 p-2 rounded mt-1 overflow-x-auto">
                    {analysisResults.code}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Render visual simulation mode
  return (
    <div className="ai-game-simulator">
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <div className="simulator-header">
        <h2>
          Visual Simulation: Game {currentGameNumber}/{numberOfGames}
        </h2>
        
        <div className="simulator-controls">
          <div className="speed-controls">
            <label>Speed:</label>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={`speed-btn-${s}`}
                className={`${s === speed ? 'active' : ''}`}
                onClick={() => {
                  // No need to implement - this is handled by parent component
                  // Just here for UI consistency
                }}
              >
                {s}x
              </button>
            ))}
          </div>
          
          {!isGameOver && (
            <button 
              className={isPaused ? 'resume-button' : 'pause-button'}
              onClick={togglePause}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>
      </div>
      
      <div className="simulator-content">
        <div className="simulator-game">
          {/* This would render your actual game board using the game store state */}
          <div className="game-state">
            <div className="turn-indicator">
              <div className={`indicator ${gameState?.currentTurn % 2 === 0 ? 'player-turn' : 'opponent-turn'}`}>
                {gameState?.currentTurn % 2 === 0 ? 'Player 1 Turn' : 'Player 2 Turn'}
                {isPaused && <div className="paused-label">PAUSED</div>}
              </div>
            </div>
            
            {/* Player 2 (top) */}
            <div className="player">
              <div className="player-info">
                <h3>Player 2 - {player2DeckId}</h3>
                <div className="player-stats">
                  <div>Health: {gameState?.players?.opponent?.health || 30}</div>
                  <div>Mana: {gameState?.players?.opponent?.mana || 0}/{gameState?.players?.opponent?.maxMana || 0}</div>
                  <div>Cards: {gameState?.players?.opponent?.hand?.length || 0}</div>
                  <div>Deck: {gameState?.players?.opponent?.deck?.length || 0}</div>
                </div>
              </div>
              
              <div className="player-battlefield">
                <h4>Battlefield</h4>
                <div className="minions">
                  {/* This would be filled in with actual minions from the game state */}
                  <div className="empty-battlefield">No minions on the battlefield</div>
                </div>
              </div>
            </div>
            
            {/* Player 1 (bottom) */}
            <div className="player">
              <div className="player-battlefield">
                <h4>Battlefield</h4>
                <div className="minions">
                  {/* This would be filled in with actual minions from the game state */}
                  <div className="empty-battlefield">No minions on the battlefield</div>
                </div>
              </div>
              
              <div className="player-info">
                <h3>Player 1 - {player1DeckId}</h3>
                <div className="player-stats">
                  <div>Health: {gameState?.players?.player?.health || 30}</div>
                  <div>Mana: {gameState?.players?.player?.mana || 0}/{gameState?.players?.player?.maxMana || 0}</div>
                  <div>Cards: {gameState?.players?.player?.hand?.length || 0}</div>
                  <div>Deck: {gameState?.players?.player?.deck?.length || 0}</div>
                </div>
              </div>
            </div>
            
            {/* Game over overlay */}
            {isGameOver && (
              <div className="game-over-overlay">
                <div className="game-over-content">
                  <h2>Game {currentGameNumber} Complete!</h2>
                  <p>{winner === 'player1' ? 'Player 1' : 'Player 2'} Wins!</p>
                  
                  {currentGameNumber < numberOfGames ? (
                    <p>Starting next game shortly...</p>
                  ) : (
                    <div>
                      <p>All simulations complete!</p>
                      <p>Final Results: Player 1 ({player1Wins}) - Player 2 ({player2Wins})</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="simulator-log">
          <h3>Game Log</h3>
          <GameLog 
            entries={logEntries} 
            maxHeight="400px"
            autoScroll={true}
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedAIGameSimulator;