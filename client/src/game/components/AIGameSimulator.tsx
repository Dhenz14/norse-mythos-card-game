import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { findCardById } from '../utils/cardUtils';
import { DeckInfo, CardInstance } from '../types';
import GameLog, { GameLog as GameLogComponent } from './GameLog';
import './AIGameSimulator.css';
import { evaluatePlayOptions } from '../ai/aiUtils';

// Debug helper to log card details safely
const safeLogCard = (card: any) => {
  if (!card) return 'null';
  try {
    return {
      id: card.id || 'unknown',
      name: card.name || 'unnamed',
      type: card.type || 'unknown',
      manaCost: card.manaCost || 0,
      attack: card.attack || 0,
      health: card.health || 0
    };
  } catch (e) {
    return 'Error logging card';
  }
};

interface AIGameSimulatorProps {
  deck1: DeckInfo;
  deck2: DeckInfo;
  onBack: () => void;
}

const AIGameSimulator: React.FC<AIGameSimulatorProps> = ({ deck1, deck2, onBack }) => {
  // Game state
  const { gameState, setGameState, resetGameState, endTurn, playCard, attackWithMinion } = useGameStore();
  const { players, setPlayers } = useGameStore();

  // Local state for simulation
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [turnNumber, setTurnNumber] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);
  const [gameLog, setGameLog] = useState<string[]>([]);
  
  // Control speed of the simulation
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  
  // Refs to avoid closure issues
  const playersRef = useRef(players);
  const gameStateRef = useRef(gameState);
  const lastAiThinkingStateChange = useRef(Date.now());
  
  // Update refs when state changes
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Track when aiThinking state changes
  useEffect(() => {
    lastAiThinkingStateChange.current = Date.now();
    console.log(`[AI DEBUG] AI Thinking state changed to: ${aiThinking ? 'THINKING' : 'NOT THINKING'} at ${new Date().toISOString()}`);
    
    // Critical section: If thinking just completed, check if we need to trigger first turn
    if (!aiThinking && gameStarted && !isPaused && !isLoading && !gameOver) {
      // Get latest game state
      const currentState = useGameStore.getState().gameState;
      
      // Check if we need to force start the first turn after mulligan phase
      if (currentState?.gamePhase === 'play' && turnNumber <= 1) {
        console.log('[AI Debug] AI thinking finished, checking if first turn needs to be started');
        
        // Add a small delay to ensure state is fully updated
        setTimeout(() => {
          const freshState = useGameStore.getState().gameState;
          console.log('[AI Debug] Checking for first turn start:', {
            currentTurn: freshState?.currentTurn,
            gamePhase: freshState?.gamePhase,
            turnNumber
          });
          
          // If conditions are right, trigger the first AI turn
          if (freshState?.gamePhase === 'play' && !gameOver && !isPaused) {
            console.log('[AI Debug] First turn detected, starting AI turn immediately');
            // Trigger first AI turn
            if (freshState.currentTurn) {
              const currentPlayer = freshState.currentTurn as 'player' | 'opponent';
              runAITurn(currentPlayer);
            } else {
              console.log('[AI Debug] No current turn found, defaulting to player');
              runAITurn('player');
            }
          }
        }, 300);
      }
    }
  }, [aiThinking, gameStarted, isPaused, isLoading, gameOver, turnNumber]);

  // Detect turn transitions and trigger AI turns automatically
  useEffect(() => {
    // Only proceed if the game has started and isn't paused, loading, or over
    if (!gameStarted || isPaused || isLoading || gameOver || aiThinking) {
      return;
    }
    
    // Check if we need to trigger an AI turn based on the current game state
    console.log('[AI Debug] Turn transition check. Current turn:', gameState?.currentTurn, 'Phase:', gameState?.gamePhase);
    
    // If we're in play phase and not currently thinking, start the AI turn
    if (gameState?.gamePhase === 'play' && !aiThinking) {
      const currentPlayer = gameState.currentTurn;
      console.log(`[AI Debug] Detected active turn for ${currentPlayer} - triggering AI turn`);
      
      // Small delay to avoid potential race conditions
      setTimeout(() => {
        // Double check we're still in a valid state
        if (!isPaused && !gameOver && !aiThinking) {
          console.log(`[AI Debug] Starting AI turn for ${currentPlayer}`);
          runAITurn(currentPlayer);
        }
      }, 300);
    }
  }, [gameState?.currentTurn, gameState?.gamePhase, gameStarted, isPaused, isLoading, gameOver, aiThinking]);
  
  // Initialize game with the selected decks
  useEffect(() => {
    const initializeGame = async () => {
      // Initial setup
      setIsLoading(true);
      setAiThinking(false); // Make sure AI isn't thinking at start
      setGameLog([]); // Clear any existing logs
      
      try {
        console.log('[AI Debug] Initializing AI game with fresh state');
        
        // Reset game state first
        resetGameState();
        
        // Validate and ensure decks have cards
        if (!deck1?.cards || Object.keys(deck1.cards).length === 0) {
          throw new Error("Player 1's deck has no cards");
        }
        
        if (!deck2?.cards || Object.keys(deck2.cards).length === 0) {
          throw new Error("Player 2's deck has no cards");
        }
        
        console.log('[AI Debug] Starting AI game with:');
        console.log('[AI Debug] Deck 1:', deck1.name, deck1.class, Object.keys(deck1.cards).length, 'cards');
        console.log('[AI Debug] Deck 2:', deck2.name, deck2.class, Object.keys(deck2.cards).length, 'cards');
        
        // Set up players with the selected decks
        const updatedPlayers = {
          player: {
            id: 'player',
            health: 30,
            mana: {
              current: 1, // First player starts with 1 mana
              max: 1,
              overload: 0,
              overloadNext: 0
            },
            deck: [...Object.keys(deck1.cards)].map(cardId => ({
              id: parseInt(cardId),
              count: deck1.cards[cardId] || 0
            })).filter(item => !isNaN(item.id) && item.count > 0),
            hand: [],
            graveyard: [],
            battlefield: [],
            hero: { id: 'hero1', name: deck1.class || 'Mage', health: 30 },
            secrets: [],
            fatigue: 0,
            deckSize: Object.values(deck1.cards).reduce((acc, val) => acc + val, 0)
          },
          opponent: {
            id: 'opponent',
            health: 30,
            mana: {
              current: 0, // Second player starts with 0 mana
              max: 0,
              overload: 0,
              overloadNext: 0
            },
            deck: [...Object.keys(deck2.cards)].map(cardId => ({
              id: parseInt(cardId),
              count: deck2.cards[cardId] || 0
            })).filter(item => !isNaN(item.id) && item.count > 0),
            hand: [],
            graveyard: [],
            battlefield: [],
            hero: { id: 'hero2', name: deck2.class || 'Warrior', health: 30 },
            secrets: [],
            fatigue: 0,
            deckSize: Object.values(deck2.cards).reduce((acc, val) => acc + val, 0)
          }
        };
        
        console.log('[AI Debug] Created player objects with deck sizes:', {
          player1DeckSize: updatedPlayers.player.deckSize,
          player2DeckSize: updatedPlayers.opponent.deckSize
        });
        
        // Draw 3 starting cards for each player (simple mulligan)
        const player1StartingHand: CardInstance[] = [];
        const player2StartingHand: CardInstance[] = [];
        
        // Get valid card IDs from each deck
        const validCardIds1 = [...Object.keys(deck1.cards)].filter(id => 
          deck1.cards[parseInt(id)] > 0 && !isNaN(parseInt(id))
        );
        
        const validCardIds2 = [...Object.keys(deck2.cards)].filter(id => 
          deck2.cards[parseInt(id)] > 0 && !isNaN(parseInt(id))
        );
        
        console.log('[AI Debug] Valid card IDs for drawing:',
          'Deck 1:', validCardIds1.length, 'cards',
          'Deck 2:', validCardIds2.length, 'cards');
        
        // Draw 3 cards for each player
        for (let i = 0; i < 3; i++) {
          // Player 1 card
          if (validCardIds1.length > 0) {
            const randomIndex1 = Math.floor(Math.random() * validCardIds1.length);
            const cardId1 = validCardIds1[randomIndex1];
            
            // Remove the card from available draw pool
            validCardIds1.splice(randomIndex1, 1);
            
            const card1 = findCardById(parseInt(cardId1));
            if (card1) {
              console.log(`[AI Debug] Player 1 draws ${card1.name} (ID: ${card1.id})`);
              player1StartingHand.push({
                instanceId: `p1-${i}`,
                card: card1,
                isPlayed: false,
                canAttack: false,
                isSummoningSick: true,
                attacksPerformed: 0,
                currentHealth: card1.health
              });
            } else {
              console.log(`[AI Debug] Failed to find card with ID ${cardId1} for Player 1`);
            }
          } else {
            console.log('[AI Debug] Player 1 has no more cards to draw for initial hand');
          }
          
          // Player 2 card
          if (validCardIds2.length > 0) {
            const randomIndex2 = Math.floor(Math.random() * validCardIds2.length);
            const cardId2 = validCardIds2[randomIndex2];
            
            // Remove the card from available draw pool
            validCardIds2.splice(randomIndex2, 1);
            
            const card2 = findCardById(parseInt(cardId2));
            if (card2) {
              console.log(`[AI Debug] Player 2 draws ${card2.name} (ID: ${card2.id})`);
              player2StartingHand.push({
                instanceId: `p2-${i}`,
                card: card2,
                isPlayed: false,
                canAttack: false,
                isSummoningSick: true,
                attacksPerformed: 0,
                currentHealth: card2.health
              });
            } else {
              console.log(`[AI Debug] Failed to find card with ID ${cardId2} for Player 2`);
            }
          } else {
            console.log('[AI Debug] Player 2 has no more cards to draw for initial hand');
          }
        }
        
        // Give second player an extra card (the coin)
        const coinCard = {
          id: 10000,
          name: "The Coin",
          description: "Gain 1 Mana Crystal this turn only.",
          type: "spell",
          manaCost: 0,
          class: "Neutral",
          rarity: "common",
          collectible: false,
          spellEffect: {
            type: "gain_mana",
            value: 1
          }
        };
        
        player2StartingHand.push({
          instanceId: 'p2-coin',
          card: coinCard,
          isPlayed: false,
          canAttack: false,
          isSummoningSick: true,
          attacksPerformed: 0
        });
        
        console.log('[AI Debug] Added The Coin to Player 2\'s hand');
        
        // Update player hands
        updatedPlayers.player.hand = player1StartingHand;
        updatedPlayers.opponent.hand = player2StartingHand;
        
        // Update deck size to reflect drawn cards
        updatedPlayers.player.deckSize -= player1StartingHand.length;
        updatedPlayers.opponent.deckSize -= (player2StartingHand.length - 1); // -1 because The Coin doesn't come from deck
        
        console.log('[AI Debug] Updated deck sizes after initial draw:', {
          player1: updatedPlayers.player.deckSize,
          player2: updatedPlayers.opponent.deckSize
        });
        
        // Set up initial game state
        const initialGameState = {
          currentTurn: 'player', // First player goes first
          turnNumber: 1,
          gamePhase: 'play', // Start in play phase (skip mulligan for simplicity)
          players: updatedPlayers,
          selectedCards: {},
          discoverCards: [],
        };
        
        // Update the game state with our initial state
        setGameState(initialGameState);
        setPlayers(updatedPlayers);
        
        console.log('[AI Debug] Initial game state set with players:', updatedPlayers);
        console.log('[AI Debug] Player refs updated:', playersRef.current === updatedPlayers);
        
        // Game is now initialized and ready to go
        console.log('[AI Debug] Setting up initial state complete, will start game shortly');
        setIsLoading(false);
        
        // Start the game after a brief delay (to ensure state is properly set)
        setTimeout(() => {
          console.log('[AI Debug] Game initialized and ready for first turn');
          setGameStarted(true);
        }, 300);
      } catch (error) {
        console.error('Error initializing AI game:', error);
        setGameLog(prev => [...prev, `Error initializing game: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        setIsLoading(false);
      }
    };
    
    // Call initialize on mount
    initializeGame();
    
    // Clean up by resetting states when component unmounts
    return () => {
      setGameStarted(false);
      setGameOver(false);
      setAiThinking(false);
    };
  }, [deck1, deck2, resetGameState, setGameState, setPlayers]);
 
  // Main AI turn function
  const runAITurn = async (currentPlayer: 'player' | 'opponent') => {
    // If AI is already thinking, don't start another turn
    if (aiThinking || isPaused || gameOver) {
      console.log(`[AI Debug] Cannot run AI turn - AI already thinking: ${aiThinking}, Paused: ${isPaused}, Game over: ${gameOver}`);
      return;
    }
    
    // Mark AI as thinking - this will prevent other turns from starting
    setAiThinking(true);
    console.log('[AI THINKING STATE] Setting AI thinking state to TRUE to start turn');
    
    // Set a guaranteed timeout that will reset aiThinking to false no matter what
    // This serves as a failsafe if any error prevents the normal reset
    const safetyTimerId = setTimeout(() => {
      if (aiThinking) {
        console.error('[AI Debug] SAFETY TIMEOUT: AI thinking state was stuck for 15 seconds, forcibly resetting');
        setAiThinking(false);
        console.log('[AI THINKING STATE] Setting AI thinking state back to FALSE via safety timeout');
      }
    }, 15000);
    
    try {
      // Access latest game state using ref to avoid closure issues
      const currentGameState = gameStateRef.current;
      const currentPlayers = playersRef.current;
      
      if (!currentGameState || !currentPlayers) {
        console.error('[AI Debug] Game state or players missing in runAITurn');
        console.error('[AI Debug] Game state:', currentGameState);
        console.error('[AI Debug] Players:', currentPlayers);
        setAiThinking(false);
        console.log('[AI THINKING STATE] Setting AI thinking state back to FALSE due to missing state');
        clearTimeout(safetyTimerId); // Clear safety timer
        return;
      }
      
      // Safety check for players object structure
      if (!currentGameState.players || !currentGameState.players[currentPlayer]) {
        console.error('[AI Debug] Invalid players structure in game state:', currentGameState.players);
        setAiThinking(false);
        console.log('[AI THINKING STATE] Setting AI thinking state back to FALSE due to invalid player structure');
        clearTimeout(safetyTimerId);
        return;
      }
      
      const playerName = currentPlayer === 'player' ? 'Player 1' : 'Player 2';
      
      // Safe access to player properties with fallbacks
      const currentMana = currentGameState.players[currentPlayer]?.mana || {current: 0, max: 0};
      const handSize = currentGameState.players[currentPlayer]?.hand?.length || 0;
      const deckSize = currentGameState.players[currentPlayer]?.deckSize || 0;
      
      console.log(`[AI Turn] ${playerName}'s turn (${currentPlayer}) starting...`);
      console.log(`[AI Debug] Current mana: ${currentMana.current}/${currentMana.max}, Hand size: ${handSize}, Deck size: ${deckSize}`);
      
      // Safely access health values for both players
      const playerHealth = currentGameState.players.player?.health || 0;
      const opponentHealth = currentGameState.players.opponent?.health || 0;
      console.log(`[AI Debug] Player health: ${playerHealth}, Opponent health: ${opponentHealth}`);
      
      // Safely access battlefield lengths
      const playerBattlefieldSize = currentGameState.players.player?.battlefield?.length || 0;
      const opponentBattlefieldSize = currentGameState.players.opponent?.battlefield?.length || 0;
      console.log(`[AI Debug] Player battlefield: ${playerBattlefieldSize} minions, Opponent battlefield: ${opponentBattlefieldSize} minions`);
      
      // Get previous state for comparison
      const preTurnState = { ...currentGameState };
      
      // Record number of cards in hand for the next player (to detect Burns)
      const nextPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
      const nextPlayerName = nextPlayer === 'player' ? 'Player 1' : 'Player 2';
      const preTurnNextPlayerHandCount = currentGameState.players[nextPlayer]?.hand?.length || 0;
      
      setGameLog(prev => [...prev, `Turn ${turnNumber}: ${playerName}'s turn starts (${currentMana.current}/${currentMana.max} mana, ${handSize} cards)`]);
      
      // Wait a moment before taking actions
      await new Promise(resolve => setTimeout(resolve, simulationSpeed * 500));
      
      // 1. PLAY CARDS PHASE
      // Get fresh state before evaluating play options
      const freshState = useGameStore.getState().gameState;
      
      // Validate fresh state
      if (!freshState || !freshState.players || !freshState.players[currentPlayer]) {
        console.error('[AI Debug] Invalid game state before play phase:', freshState);
        setGameLog(prev => [...prev, `Error: Invalid game state for ${playerName}.`]);
        
        clearTimeout(safetyTimerId);
        setAiThinking(false);
        return;
      }
      
      const handSizeNow = freshState.players[currentPlayer]?.hand?.length || 0;
      console.log(`[AI Debug] Starting play phase evaluation. Hand size: ${handSizeNow}`);
      
      // Check player's mana - critical for determining playable cards
      const playerCurrentMana = freshState.players[currentPlayer]?.mana?.current || 0;
      const playerMaxMana = freshState.players[currentPlayer]?.mana?.max || 0;
      
      console.log(`[AI Debug] Current player mana: ${playerCurrentMana}/${playerMaxMana}`);
      
      // Log hand contents safely
      if (freshState.players[currentPlayer]?.hand?.length > 0) {
        console.log(`[AI Debug] Hand contents:`, freshState.players[currentPlayer].hand.map(card => 
          `${card.card?.name || 'Unnamed'} (${card.card?.manaCost || 0} mana)`
        ));
      } else {
        console.log(`[AI Debug] Player has no cards in hand`);
      }
      
      // Check if player has any cards they can actually play with current mana
      const hasPlayableCards = freshState.players[currentPlayer]?.hand?.some(
        card => (card.card?.manaCost || 999) <= playerCurrentMana
      ) || false;
      
      console.log(`[AI Debug] Has playable cards with ${playerCurrentMana} mana: ${hasPlayableCards}`);
      
      // If player has no playable cards, we can skip evaluation and just end turn
      if (!hasPlayableCards) {
        console.log(`[AI Debug] No cards playable with current mana (${playerCurrentMana}). Will skip to end turn.`);
        setGameLog(prev => [...prev, `${playerName} has no playable cards with ${playerCurrentMana} mana.`]);
        
        // Skip to end turn phase
        console.log(`[AI Debug] FAST TURN END: No playable cards with current mana`);
        
        // Wait a moment for visualization and then end turn
        await new Promise(resolve => setTimeout(resolve, simulationSpeed * 300));
        setGameLog(prev => [...prev, `${playerName} ends their turn.`]);
        
        // End the turn immediately
        endTurn();
        setTurnNumber(prev => prev + 1);
        
        // Exit the AI turn function early
        clearTimeout(safetyTimerId);
        setAiThinking(false);
        return;
      }
      
      try {
        // Evaluate play options and handle potential errors
        const playOptions = evaluatePlayOptions(freshState, currentPlayer === 'player' ? 0 : 1);
        console.log(`[AI Debug] Found ${playOptions.length} possible play options`);
        
        // Check if hand is full (9 cards like Hearthstone)
        if (freshState.players[currentPlayer]?.hand?.length >= 9) {
          console.log(`[AI Debug] HAND IS FULL! Any new cards drawn will be burned`);
          setGameLog(prev => [...prev, `${playerName}'s hand is full (9 cards). New cards will be burned.`]);
        }
        
        if (playOptions.length > 0) {
          // Sort options by score (highest first)
          playOptions.sort((a, b) => b.score - a.score);
          
          // Log all possible options for debugging (safely)
          playOptions.forEach((option, index) => {
            const cardName = option.card?.name || 'Unnamed Card';
            const cardCost = option.card?.manaCost || 0;
            console.log(`[AI Debug] Play option ${index + 1}: ${cardName} (${cardCost} mana) - Score: ${option.score}`);
            
            if (option.target) {
              const targetName = option.target.name || (option.target.type === 'hero' ? 'Hero' : 'Unknown target');
              console.log(`[AI Debug]   → Target: ${targetName}`);
            }
          });
          
          // Check if the best option is actually playable (e.g. has enough mana)
          const bestPlay = playOptions[0];
          const playerMana = freshState.players[currentPlayer]?.mana?.current || 0;
          const cardCost = bestPlay.card?.manaCost || 0;
          
          // Double-check if any playable cards exist with current mana
          const hasAnyPlayableCards = freshState.players[currentPlayer]?.hand?.some(
            card => (card.card?.manaCost || 999) <= playerMana
          ) || false;
          
          if (!hasAnyPlayableCards) {
            console.log(`[AI Debug] No cards playable with current mana (${playerMana}). Will skip to end turn.`);
            setGameLog(prev => [...prev, `${playerName} has no playable cards with ${playerMana} mana.`]);
            
            // Skip to end turn phase
            console.log(`[AI Debug] FAST TURN END: No playable cards with current mana`);
            
            // Wait a moment for visualization and then end turn
            await new Promise(resolve => setTimeout(resolve, simulationSpeed * 300));
            setGameLog(prev => [...prev, `${playerName} ends their turn.`]);
            
            // End the turn immediately
            endTurn();
            setTurnNumber(prev => prev + 1);
            
            // Exit the AI turn function early
            clearTimeout(safetyTimerId);
            setAiThinking(false);
            return;
          }
          
          // Validate all required properties exist for the card to be played
          if (bestPlay.card && bestPlay.cardInstance?.instanceId && playerMana >= cardCost) {
            const cardName = bestPlay.card.name || 'Unnamed Card';
            console.log(`[AI Debug] PLAYING CARD: ${cardName} (${cardCost} mana, ID: ${bestPlay.cardInstance.instanceId})`);
            console.log(`[AI Debug] Card details:`, safeLogCard(bestPlay.card));
            
            let targetDesc = bestPlay.target ? 
              (bestPlay.target.type === 'hero' ? 'opponent hero' : `${bestPlay.target.name || 'unknown minion'}`) : 
              'no target';
              
            setGameLog(prev => [...prev, `${playerName} plays ${cardName} (${cardCost} mana)${
              bestPlay.target ? ` targeting ${targetDesc}` : ''
            }`]);
            
            try {
              // Double check that the card instance ID exists in the hand before playing
              const cardExists = freshState.players[currentPlayer]?.hand?.some(
                card => card.instanceId === bestPlay.cardInstance?.instanceId
              );
              
              if (cardExists) {
                // Play the card using the game store action
                if (bestPlay.target) {
                  // Play card with target
                  playCard(bestPlay.cardInstance.instanceId, bestPlay.target.instanceId, 
                    bestPlay.target.type === 'hero' ? 'hero' : 'minion');
                  console.log(`[AI Debug] Card played with target: ${bestPlay.target.instanceId}`);
                } else {
                  // Play card without target
                  playCard(bestPlay.cardInstance.instanceId);
                  console.log(`[AI Debug] Card played without target`);
                }
                
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, simulationSpeed * 600));
                
                // Get updated state after playing
                const afterPlayState = useGameStore.getState().gameState;
                const newHandSize = afterPlayState.players[currentPlayer]?.hand?.length || 0;
                const newBattlefieldSize = afterPlayState.players[currentPlayer]?.battlefield?.length || 0;
                console.log(`[AI Debug] After playing card - Hand size: ${newHandSize}, Battlefield: ${newBattlefieldSize} minions`);
              } else {
                console.error(`[AI Debug] Card with ID ${bestPlay.cardInstance?.instanceId} not found in player's hand!`);
                setGameLog(prev => [...prev, `Card ID ${bestPlay.cardInstance?.instanceId} not found in ${playerName}'s hand.`]);
              }
            } catch (error) {
              console.error('[AI Debug] Error playing card:', error);
              setGameLog(prev => [...prev, `Error playing card: ${error instanceof Error ? error.message : 'Unknown error'}`]);
              
              // Even if there's an error, we should still move on to attack phase
              console.log(`[AI Debug] Moving to attack phase despite card play error`);
            }
          } else {
            // Log if we can't play the best card due to mana constraints
            if (playerMana < cardCost) {
              const cardName = bestPlay.card?.name || 'Unnamed Card';
              console.log(`[AI Debug] Best play ${cardName} costs ${cardCost} mana, but player only has ${playerMana} mana`);
              setGameLog(prev => [...prev, `${playerName} can't play ${cardName} (not enough mana).`]);
            } else {
              console.log(`[AI Debug] Best play cannot be executed due to other constraints:`, {
                hasCard: !!bestPlay.card,
                hasInstanceId: !!bestPlay.cardInstance?.instanceId,
                playerMana,
                cardCost
              });
              setGameLog(prev => [...prev, `${playerName} can't play their best option.`]);
            }
            
            // Try to find any playable card
            const playableOptions = playOptions.filter(option => 
              option.card?.manaCost <= playerMana && option.cardInstance?.instanceId
            );
            
            if (playableOptions.length > 0) {
              // Take the highest scoring playable card
              const playableOption = playableOptions[0];
              const cardName = playableOption.card?.name || 'Unnamed Card';
              
              console.log(`[AI Debug] Attempting to play alternative card: ${cardName}`);
              console.log(`[AI Debug] Alternative card details:`, safeLogCard(playableOption.card));
              
              try {
                // Double check that the card instance ID exists in the hand
                const cardExists = freshState.players[currentPlayer]?.hand?.some(
                  card => card.instanceId === playableOption.cardInstance?.instanceId
                );
                
                if (cardExists) {
                  // Play the alternative card
                  if (playableOption.target) {
                    playCard(playableOption.cardInstance.instanceId, playableOption.target.instanceId,
                      playableOption.target.type === 'hero' ? 'hero' : 'minion');
                  } else {
                    playCard(playableOption.cardInstance.instanceId);
                  }
                  
                  setGameLog(prev => [...prev, `${playerName} plays ${cardName} instead.`]);
                  await new Promise(resolve => setTimeout(resolve, simulationSpeed * 600));
                } else {
                  console.error(`[AI Debug] Alternative card with ID ${playableOption.cardInstance?.instanceId} not found in player's hand!`);
                  setGameLog(prev => [...prev, `Alternative card not found in ${playerName}'s hand.`]);
                }
              } catch (error) {
                console.error('[AI Debug] Error playing alternative card:', error);
                setGameLog(prev => [...prev, `Error playing alternative card: ${error instanceof Error ? error.message : 'Unknown error'}`]);
              }
            } else {
              console.log(`[AI Debug] No playable cards found with current mana (${playerMana}).`);
              setGameLog(prev => [...prev, `${playerName} has no playable cards with ${playerMana} mana.`]);
            }
          }
        } else {
          console.log(`[AI Debug] No valid plays available for ${playerName}`);
          setGameLog(prev => [...prev, `${playerName} has no valid plays this turn.`]);
        }
      } catch (error) {
        console.error('[AI Debug] Error in card play phase:', error);
        setGameLog(prev => [...prev, `Error during card play phase: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
      
      // 2. ATTACK PHASE
      // Wait a moment before starting attacks
      await new Promise(resolve => setTimeout(resolve, simulationSpeed * 300));
      
      // Get fresh state before attacks
      const updatedState = useGameStore.getState().gameState;
      
      // Validate updated state
      if (!updatedState || !updatedState.players || !updatedState.players[currentPlayer]) {
        console.error('[AI Debug] Invalid game state before attack phase:', updatedState);
        setGameLog(prev => [...prev, `Error: Invalid game state for attack phase.`]);
        
        // We'll still try to end the turn
        console.log(`[AI Debug] Attempting to end turn despite state error`);
        endTurn();
        setTurnNumber(prev => prev + 1);
        
        clearTimeout(safetyTimerId);
        setAiThinking(false);
        return;
      }
      
      // Safely log battlefield
      try {
        const battlefield = updatedState.players[currentPlayer]?.battlefield || [];
        
        console.log(`[AI Debug] Entering attack phase. Current player's battlefield:`, 
          battlefield.map(m => ({
            name: m.card?.name || 'Unknown',
            attack: m.card?.attack || 0,
            health: m.currentHealth || m.card?.health || 0,
            canAttack: m.canAttack !== false,
            isSummoningSick: !!m.isSummoningSick,
            instanceId: m.instanceId || 'no-id'
          }))
        );
        
        // Find minions that can attack (not summoning sick and can attack)
        const attackingMinions = (battlefield || []).filter(
          minion => !minion.isSummoningSick && minion.canAttack !== false && (minion.card?.attack || 0) > 0
        );
        
        console.log(`[AI Debug] Found ${attackingMinions.length} minions that can attack:`, 
          attackingMinions.map(m => m.card?.name || 'Unknown')
        );
        
        // If there are minions that can attack, have them attack
        if (attackingMinions.length > 0) {
          // Get enemy state
          const enemyPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
          const enemyMinions = updatedState.players[enemyPlayer]?.battlefield || [];
          
          console.log(`[AI Debug] Enemy has ${enemyMinions.length} minions on battlefield`);
          
          setGameLog(prev => [...prev, `${playerName} has ${attackingMinions.length} minions ready to attack.`]);
          
          // For each attacking minion, pick a target and attack
          for (const minion of attackingMinions) {
            // Safety check for minion
            if (!minion || !minion.instanceId) {
              console.error('[AI Debug] Invalid minion for attack:', minion);
              continue;
            }
            
            // Verify the minion is still on the battlefield and can attack
            const currentState = useGameStore.getState().gameState;
            const minionsOnField = currentState.players[currentPlayer]?.battlefield || [];
            const minionStillExists = minionsOnField.some(m => 
              m.instanceId === minion.instanceId && m.canAttack !== false && !m.isSummoningSick
            );
            
            if (!minionStillExists) {
              console.log(`[AI Debug] Minion ${minion.card?.name || 'Unknown'} is no longer available to attack`);
              continue;
            }
            
            try {
              // Simple target selection:
              // 1. If enemy has minions, attack the one with highest attack power
              // 2. If no enemy minions, attack enemy hero
              if (enemyMinions.length > 0) {
                // Sort enemy minions by threat (attack power)
                const sortedEnemyMinions = [...enemyMinions].sort((a, b) => 
                  (b.card?.attack || 0) - (a.card?.attack || 0)
                );
                
                // Verify we have at least one valid enemy minion
                if (sortedEnemyMinions.length === 0 || !sortedEnemyMinions[0] || !sortedEnemyMinions[0].instanceId) {
                  console.error('[AI Debug] No valid enemy minions to attack');
                  continue;
                }
                
                const targetMinion = sortedEnemyMinions[0];
                console.log(`[AI Debug] Minion ${minion.card?.name || 'Unknown'} attacking enemy minion ${targetMinion.card?.name || 'Unknown'}`);
                
                setGameLog(prev => [...prev, `${minion.card?.name || 'Minion'} attacks ${targetMinion.card?.name || 'Enemy minion'}.`]);
                
                try {
                  // Attack with our minion
                  attackWithMinion(minion.instanceId, targetMinion.instanceId);
                  
                  // Wait for attack animation
                  await new Promise(resolve => setTimeout(resolve, simulationSpeed * 400));
                } catch (error) {
                  console.error('[AI Debug] AI attack processing error:', error);
                  setGameLog(prev => [...prev, `Error during attack: ${error instanceof Error ? error.message : 'Unknown error'}`]);
                }
              } else {
                // No enemy minions, attack face
                const enemyHeroId = enemyPlayer === 'player' ? 'hero1' : 'hero2';
                console.log(`[AI Debug] Minion ${minion.card?.name || 'Unknown'} attacking enemy hero (${enemyHeroId})`);
                
                setGameLog(prev => [...prev, `${minion.card?.name || 'Minion'} attacks enemy hero.`]);
                
                try {
                  // Attack enemy hero
                  attackWithMinion(minion.instanceId, enemyHeroId);
                  
                  // Wait for attack animation
                  await new Promise(resolve => setTimeout(resolve, simulationSpeed * 400));
                } catch (error) {
                  console.error('[AI Debug] AI attack processing error:', error);
                  setGameLog(prev => [...prev, `Error during hero attack: ${error instanceof Error ? error.message : 'Unknown error'}`]);
                }
              }
              
              // Check if game has ended after this attack
              const currentState = useGameStore.getState().gameState;
              if (currentState.players.player?.health <= 0 || currentState.players.opponent?.health <= 0) {
                console.log('[AI Debug] Game over detected during attack phase');
                
                const winner = currentState.players.player?.health <= 0 ? 'opponent' : 'player';
                const winnerName = winner === 'player' ? 'Player 1' : 'Player 2';
                
                setWinner(winnerName);
                setGameOver(true);
                setGameLog(prev => [...prev, `Game over - ${winnerName} wins!`]);
                console.log(`[AI Debug] Game over! ${winnerName} wins!`);
                
                clearTimeout(safetyTimerId);
                setAiThinking(false);
                console.log('[AI THINKING STATE] Setting AI thinking state back to FALSE after game over');
                return;
              }
            } catch (error) {
              console.error('[AI Debug] Error during attack process:', error);
              setGameLog(prev => [...prev, `Attack error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
            }
          }
        } else {
          console.log(`[AI Debug] No minions that can attack this turn`);
          setGameLog(prev => [...prev, `${playerName} has no minions that can attack.`]);
        }
      } catch (error) {
        console.error('[AI Debug] Error in attack phase:', error);
        setGameLog(prev => [...prev, `Error during attack phase: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
      
      // 3. END TURN PHASE
      // Check for game over conditions
      const finalState = useGameStore.getState().gameState;
      
      // Safely check health values
      const playerFinalHealth = finalState.players?.player?.health || 0;
      const opponentFinalHealth = finalState.players?.opponent?.health || 0;
      
      if (playerFinalHealth <= 0 || opponentFinalHealth <= 0) {
        const winner = playerFinalHealth <= 0 ? 'opponent' : 'player';
        const winnerName = winner === 'player' ? 'Player 1' : 'Player 2';
        
        setWinner(winnerName);
        setGameOver(true);
        setGameLog(prev => [...prev, `Game over - ${winnerName} wins!`]);
        console.log(`[AI Debug] Game over! ${winnerName} wins!`);
        
        clearTimeout(safetyTimerId);
        setAiThinking(false);
        console.log('[AI THINKING STATE] Setting AI thinking state back to FALSE after game over');
        return;
      }
      
      // Check for card burning due to full hand
      const postTurnState = useGameStore.getState().gameState;
      
      // Safely get hand size
      const nextPlayerHandSize = postTurnState.players?.[nextPlayer]?.hand?.length || 0;
      
      // If next player's hand is now full (10 cards), it means they're at risk of burning cards
      if (nextPlayerHandSize === 10) {
        console.log(`[AI Debug] ${nextPlayerName}'s hand is now full (10/10)`);
        setGameLog(prev => [...prev, `${nextPlayerName}'s hand is now full (10 cards).`]);
      } else if (nextPlayerHandSize > preTurnNextPlayerHandCount) {
        // Log the fact that cards were drawn
        const cardsDrawn = nextPlayerHandSize - preTurnNextPlayerHandCount;
        console.log(`[AI Debug] ${nextPlayerName} drew ${cardsDrawn} card(s)`);
        setGameLog(prev => [...prev, `${nextPlayerName} drew ${cardsDrawn} card(s).`]);
      }
      
      // Finally, end the turn
      console.log(`[AI Debug] ${playerName} ending turn`);
      setGameLog(prev => [...prev, `${playerName} ends their turn.`]);
      endTurn();
      setTurnNumber(prev => prev + 1);
      
      // AI turn is complete, release the thinking flag
      clearTimeout(safetyTimerId);
      setAiThinking(false);
      console.log('[AI THINKING STATE] Setting AI thinking state back to FALSE after completing turn');
    } catch (error) {
      console.error('[AI Debug] Unexpected error in AI turn:', error);
      setGameLog(prev => [...prev, `Error during AI turn: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      
      // Try to end the turn even if an error occurred
      try {
        console.log('[AI Debug] Attempting to end turn after error');
        endTurn();
        setTurnNumber(prev => prev + 1);
      } catch (endTurnError) {
        console.error('[AI Debug] Could not end turn after error:', endTurnError);
      }
      
      clearTimeout(safetyTimerId);
      setAiThinking(false); // Make sure to release the AI thinking lock
      console.log('[AI THINKING STATE] Setting AI thinking state back to FALSE after error');
    }
  };

  // Toggle pause/resume functionality
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };
  
  // Handle speed control
  const setSpeed = (speed: number) => {
    setSimulationSpeed(speed);
  };
  
  // Render
  return (
    <div className="ai-game-simulator">
      <div className="simulator-header">
        <h2>AI Game Simulation</h2>
        <div className="simulator-controls">
          <div className="speed-controls">
            <label>Speed:</label>
            <button
              className={simulationSpeed === 0.5 ? 'active' : ''}
              onClick={() => setSpeed(0.5)}
            >
              Slow
            </button>
            <button
              className={simulationSpeed === 1 ? 'active' : ''}
              onClick={() => setSpeed(1)}
            >
              Normal
            </button>
            <button
              className={simulationSpeed === 2 ? 'active' : ''}
              onClick={() => setSpeed(2)}
            >
              Fast
            </button>
          </div>
          
          <button onClick={togglePause} className={isPaused ? 'resume-button' : 'pause-button'}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          
          <button onClick={onBack} className="back-button">
            Back to Deck Selection
          </button>
        </div>
      </div>
      
      <div className="simulator-content">
        <div className="simulator-game">
          {isLoading ? (
            <div className="loading-indicator">
              Initializing game, please wait...
            </div>
          ) : gameOver ? (
            <div className="game-over">
              <h3>Game Over!</h3>
              <p>{winner} has won the game!</p>
              <button onClick={onBack}>Back to Deck Selection</button>
            </div>
          ) : (
            <div className="game-status">
              <div className="player-info">
                <div className="player">
                  <h4>Player 1: {deck1?.name || 'Random Deck'} ({deck1?.class || 'Unknown'})</h4>
                  <p>Health: {gameState?.players?.player?.health || 0}</p>
                  <p>Mana: {gameState?.players?.player?.mana?.current || 0}/{gameState?.players?.player?.mana?.max || 0}</p>
                  <p>Hand: {gameState?.players?.player?.hand?.length || 0} cards</p>
                  <p>Deck: {gameState?.players?.player?.deckSize || 0} cards</p>
                  <p>Minions: {gameState?.players?.player?.battlefield?.length || 0}</p>
                </div>
                
                <div className="turn-indicator">
                  <div className={`turn-arrow ${gameState?.currentTurn === 'player' ? 'left' : 'right'}`}>
                    {gameState?.currentTurn === 'player' ? '←' : '→'}
                  </div>
                  <div className={`ai-thinking ${aiThinking ? 'active' : ''}`}>
                    {aiThinking ? 'AI thinking...' : 'Waiting for next action'}
                  </div>
                </div>
                
                <div className="player">
                  <h4>Player 2: {deck2?.name || 'Random Deck'} ({deck2?.class || 'Unknown'})</h4>
                  <p>Health: {gameState?.players?.opponent?.health || 0}</p>
                  <p>Mana: {gameState?.players?.opponent?.mana?.current || 0}/{gameState?.players?.opponent?.mana?.max || 0}</p>
                  <p>Hand: {gameState?.players?.opponent?.hand?.length || 0} cards</p>
                  <p>Deck: {gameState?.players?.opponent?.deckSize || 0} cards</p>
                  <p>Minions: {gameState?.players?.opponent?.battlefield?.length || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="simulator-log">
          <h3>Game Log</h3>
          <GameLogComponent entries={gameLog} />
        </div>
      </div>
    </div>
  );
};

export default AIGameSimulator;