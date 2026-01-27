import { Request, Response } from 'express';

export interface DevMagicRequest {
  task: string;
  context?: {
    currentCode?: string;
    language?: string;
    errorMessage?: string;
  };
}

export interface DevMagicResponse {
  solution: string;
  explanation: string;
  codeSnippet?: string;
}

// Helper function to analyze common Norse card game development issues
function analyzeGameDevelopmentIssue(task: string, errorMessage?: string, currentCode?: string): DevMagicResponse {
  const taskLower = task.toLowerCase();
  
  // Check for card rendering issues
  if (taskLower.includes('render') || taskLower.includes('display') || taskLower.includes('visual')) {
    return {
      solution: 'Card Rendering Fix',
      explanation: 'Issues with card rendering are often related to DOM structure or CSS styling. Make sure card elements have proper dimensions and z-index values. Check for overflow issues in containers.',
      codeSnippet: `
// Ensure proper card container styling
.card-container {
  position: relative;
  width: 240px;
  height: 340px;
  perspective: 1000px; // For 3D effects
  transform-style: preserve-3d;
  z-index: 1;
}

// Handle hover state properly
.card-container:hover {
  z-index: 10; // Bring hovered cards to front
  transform: scale(1.1) translateY(-10px);
  transition: all 0.3s ease;
}
      `
    };
  }
  
  // Check for card effect implementation issues
  if (taskLower.includes('effect') || taskLower.includes('battlecry') || taskLower.includes('deathrattle')) {
    return {
      solution: 'Card Effect Implementation',
      explanation: 'Card effect issues are typically related to event handling or state management. Ensure effects are triggered at the correct moment and update the game state properly.',
      codeSnippet: `
// Proper battlecry implementation pattern
function handleBattlecry(state, cardInstance) {
  // 1. Validate targets if needed
  if (cardInstance.requiresTarget && !state.selectedTarget) {
    return { success: false, message: 'This card requires a target' };
  }
  
  // 2. Apply the effect
  switch (cardInstance.id) {
    case 'thunder_strike_01':
      // Apply 3 damage to all enemy minions
      state.opponent.board.forEach(minion => {
        minion.health -= 3;
        // Check for death
        if (minion.health <= 0) {
          triggerDeathrattle(state, minion);
        }
      });
      break;
    // Other card effects...
  }
  
  // 3. Return success
  return { success: true };
}
      `
    };
  }
  
  // Check for game state management issues
  if (taskLower.includes('state') || taskLower.includes('data') || taskLower.includes('store')) {
    return {
      solution: 'Game State Management',
      explanation: 'Game state issues often stem from mutating state directly instead of creating immutable updates. Use proper state management practices to avoid hard-to-track bugs.',
      codeSnippet: `
// Using Zustand for Norse card game state management
import create from 'zustand';

export const useGameStore = create((set) => ({
  // Game state
  playerHand: [],
  playerBoard: [],
  playerMana: 0,
  opponentBoard: [],
  opponentHand: [], // Count only
  opponentMana: 0,
  
  // Actions
  playCard: (cardId, targetId) => set(state => {
    // Find the card in hand
    const cardIndex = state.playerHand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return state; // Card not found
    
    const card = state.playerHand[cardIndex];
    
    // Check mana cost
    if (card.cost > state.playerMana) return state;
    
    // Create new hand without the card
    const newHand = [...state.playerHand];
    newHand.splice(cardIndex, 1);
    
    // Add card to board
    const newBoard = [...state.playerBoard, card];
    
    // Update mana
    const newMana = state.playerMana - card.cost;
    
    return {
      playerHand: newHand,
      playerBoard: newBoard,
      playerMana: newMana,
    };
  }),
  
  // Other game actions...
}));
      `
    };
  }
  
  // Default response for general issues
  return {
    solution: 'General Norse Card Game Development Best Practices',
    explanation: 'When developing card games, it\'s important to separate game logic from UI rendering. Use proper state management, handle events correctly, and ensure your code is testable.',
    codeSnippet: `
// Separation of concerns in card game development
// 1. Game rules and logic
const gameRules = {
  calculateDamage: (attacker, defender) => { /* ... */ },
  resolveEffects: (card, gameState) => { /* ... */ },
  checkWinCondition: (gameState) => { /* ... */ }
};

// 2. State management
const gameState = {
  players: { /* ... */ },
  board: { /* ... */ },
  turn: 0,
  // ...
};

// 3. UI rendering
function renderGameBoard(state) {
  // Draw board
}

function renderHand(playerHand) {
  // Draw hand
}

// 4. Event handling
function handleCardPlay(cardId, targetId) {
  // Update state
  // Check rules
  // Re-render
}
    `
  };
}

// Main API handler for dev magic
export const devMagic = async (req: Request, res: Response) => {
  try {
    const { task, context } = req.body as DevMagicRequest;
    
    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }
    
    // Extract context properties
    const currentCode = context?.currentCode || '';
    const errorMessage = context?.errorMessage || '';
    
    // Generate solution based on task and context
    const result = analyzeGameDevelopmentIssue(task, errorMessage, currentCode);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Dev Magic Error:", error);
    res.status(500).json({ error: "Error processing dev magic request" });
  }
};