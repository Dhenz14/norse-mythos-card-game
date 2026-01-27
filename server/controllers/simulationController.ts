/**
 * Simulation Controller
 * 
 * This controller handles all AI game simulation requests, including:
 * - Running server-side AI game simulations for testing
 * - Integrating with Root Cause Analysis to detect issues
 * - Providing test decks and simulation configuration options
 */

import { Request, Response } from 'express';
import RootCauseAnalysisService from '../services/RootCauseAnalysisService';
import { testDecks } from '../data/testDecks';
import SimulationEngine from '../services/SimulationEngine';

/**
 * Run a server-side AI game simulation
 */
export const runSimulation = async (req: Request, res: Response) => {
  try {
    const { deck1, deck2, options, issue } = req.body;

    // Validate the request
    if (!deck1 || !deck2) {
      return res.status(400).json({
        error: 'Missing required parameters: deck1 and deck2 are required'
      });
    }

    // Create the simulation engine
    const simulationEngine = new SimulationEngine();

    // Run the simulation
    const result = await simulationEngine.runSimulation(deck1, deck2, options);

    // If an issue is provided, perform root cause analysis
    let rootCauseAnalysis = null;
    let analysisId = null;

    if (issue && result.finalState) {
      // Generate a root cause analysis based on the simulation result
      const analysisResult = await RootCauseAnalysisService.analyzeGameStateWithIssue(
        result.finalState,
        issue
      );

      rootCauseAnalysis = analysisResult.analysis;
      analysisId = analysisResult.analysisId;

      // Log that we performed analysis
      console.log(
        `Performed root cause analysis for issue: "${issue.substring(0, 50)}..." with ID: ${analysisId}`
      );
    }

    // Return the simulation results along with any analysis
    return res.json({
      result,
      rootCauseAnalysis,
      analysisId
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error running simulation'
    });
  }
};

/**
 * Get test decks for simulation
 */
export const getTestDecks = (req: Request, res: Response) => {
  try {
    // Return predefined test decks
    return res.json({
      decks: testDecks
    });
  } catch (error) {
    console.error('Error getting test decks:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error getting test decks'
    });
  }
};

/**
 * Check if an issue is related to game simulation
 */
export const checkSimulationIssue = async (req: Request, res: Response) => {
  try {
    const { issue } = req.body;

    if (!issue) {
      return res.status(400).json({
        error: 'Missing required parameter: issue'
      });
    }

    // Check if the issue description suggests a game simulation problem
    const isGameSimulationIssue = await RootCauseAnalysisService.isGameSimulationIssue(issue);

    return res.json({
      isGameSimulationIssue
    });
  } catch (error) {
    console.error('Error checking if issue is related to game simulation:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error checking issue'
    });
  }
};

/**
 * Analyze game state with a specific issue
 */
export const analyzeGameState = async (req: Request, res: Response) => {
  try {
    const { gameState, issue } = req.body;

    if (!gameState || !issue) {
      return res.status(400).json({
        error: 'Missing required parameters: gameState and issue'
      });
    }

    // Analyze the game state
    const result = await RootCauseAnalysisService.analyzeGameStateWithIssue(
      gameState,
      issue
    );

    return res.json({
      analysisId: result.analysisId,
      analysis: result.analysis
    });
  } catch (error) {
    console.error('Error analyzing game state:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error analyzing game state'
    });
  }
};