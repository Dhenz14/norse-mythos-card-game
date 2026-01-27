/**
 * Simulation Routes
 * 
 * This module defines the API routes for the AI game simulation system.
 */

import express from 'express';
import * as simulationController from '../controllers/simulationController';

const router = express.Router();

/**
 * Run a server-side AI game simulation
 * 
 * This endpoint handles running a complete AI vs AI game simulation with the specified decks.
 * It can optionally perform root cause analysis if an issue is provided.
 * 
 * POST /api/simulation/run
 */
router.post('/run', simulationController.runSimulation);

/**
 * Get predefined test decks for simulation
 * 
 * This endpoint returns a list of test decks that can be used for simulations.
 * These decks are designed to test specific game mechanics or edge cases.
 * 
 * GET /api/simulation/test-decks
 */
router.get('/test-decks', simulationController.getTestDecks);

/**
 * Check if an issue is related to game simulation
 * 
 * This endpoint checks if an issue description suggests a game simulation problem.
 * 
 * POST /api/simulation/check-simulation-issue
 */
router.post('/check-simulation-issue', simulationController.checkSimulationIssue);

/**
 * Analyze game state with a specific issue
 * 
 * This endpoint analyzes a game state with a specific issue to find root causes.
 * 
 * POST /api/simulation/analyze-gamestate
 */
router.post('/analyze-gamestate', simulationController.analyzeGameState);

export default router;