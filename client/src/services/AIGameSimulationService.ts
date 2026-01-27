/**
 * AI Game Simulation Service
 * 
 * This service provides methods for running AI game simulations and connecting 
 * them with the Root Cause Analysis system. It serves as a bridge between
 * the visual and text-based simulation methods.
 */

import { DeckInfo, GameState } from '../game/types';
import { 
  SimulationMode, 
  SimulationOptions, 
  SimulationResult,
  SimulationStatus 
} from '../game/components/UnifiedAIGameSimulator';
import axios from 'axios';

interface SimulationRequest {
  deck1: DeckInfo;
  deck2: DeckInfo;
  options?: Partial<SimulationOptions>;
}

interface RootCauseSimulationResult {
  analysisId: string;
  result: SimulationResult;
  rootCauseAnalysis?: string;
}

/**
 * Service for managing AI Game Simulations
 */
class AIGameSimulationService {
  /**
   * Run a server-side AI game simulation with root cause analysis
   * This is primarily used for text-based analysis
   * 
   * @param deck1 First player's deck
   * @param deck2 Second player's deck
   * @param issue Optional issue description to analyze
   * @returns Promise with simulation and analysis results
   */
  public async runServerSimulation(
    deck1: DeckInfo,
    deck2: DeckInfo,
    issue?: string
  ): Promise<RootCauseSimulationResult> {
    try {
      // Prepare the request payload
      const payload: SimulationRequest & { issue?: string } = {
        deck1,
        deck2,
        options: {
          mode: SimulationMode.TEXT,
          logLevel: 'normal',
          enableRootCauseAnalysis: true
        }
      };

      // Add issue if provided
      if (issue) {
        payload.issue = issue;
      }

      // Send the request to the server
      const response = await axios.post('/api/simulation/run', payload);
      return response.data;
    } catch (error) {
      console.error('Error running server-side simulation:', error);
      throw error;
    }
  }

  /**
   * Analyze game state with root cause analysis
   * This can be used with either client or server-side simulations
   * 
   * @param gameState Current game state to analyze
   * @param issue Issue description to analyze
   * @returns Promise with analysis results
   */
  public async analyzeGameState(gameState: GameState, issue: string): Promise<string> {
    try {
      const response = await axios.post('/api/rootcause/analyze-gamestate', {
        gameState,
        issue
      });
      return response.data.analysis;
    } catch (error) {
      console.error('Error analyzing game state:', error);
      throw error;
    }
  }

  /**
   * Check if an issue is related to the AI game simulation system
   * Used to determine if the root cause analysis should use game simulation
   * 
   * @param issue Issue description to check
   * @returns Whether the issue is related to AI game simulation
   */
  public async isGameSimulationIssue(issue: string): Promise<boolean> {
    try {
      const response = await axios.post('/api/rootcause/check-simulation-issue', {
        issue
      });
      return response.data.isGameSimulationIssue;
    } catch (error) {
      console.error('Error checking if issue is related to game simulation:', error);
      return false;
    }
  }

  /**
   * Get a list of predefined test decks that can be used for AI simulation
   * These are specially crafted to test specific game mechanics or edge cases
   * 
   * @returns Promise with array of available test decks
   */
  public async getTestDecks(): Promise<DeckInfo[]> {
    try {
      const response = await axios.get('/api/simulation/test-decks');
      return response.data.decks;
    } catch (error) {
      console.error('Error fetching test decks:', error);
      
      // Return empty array in case of error
      return [];
    }
  }
}

// Export as singleton instance
export default new AIGameSimulationService();