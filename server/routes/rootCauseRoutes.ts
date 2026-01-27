/**
 * Root Cause Analysis Routes
 * 
 * This module defines the API routes for the integrated Root Cause Analysis system
 * that combines all debugging tools into a unified experience accessible from Replit Chat.
 */

import express from 'express';
import { RootCauseIntegrator } from '../mcp/RootCauseIntegrator';
import { ThinkingPhase } from '../mcp/RootCauseIntegrator';
import * as rootCauseController from '../controllers/rootCauseController';

const router = express.Router();

/**
 * Process a comprehensive root cause analysis with integrated debugging tools
 * 
 * This endpoint combines multiple debugging approaches:
 * - Deep root cause detection
 * - Visual debugging
 * - Sequential thinking
 * - Memory/pattern analysis
 * - Fix validation
 * 
 * POST /api/rootcause-chat/analyze
 */
router.post('/analyze', rootCauseController.analyzeIssue);

/**
 * Use the Think Tools approach directly
 * 
 * POST /api/rootcause-chat/think
 */
router.post('/think', rootCauseController.thinkToolsAnalysis);

/**
 * Format an analysis result for Replit chat
 * 
 * POST /api/rootcause-chat/format
 */
router.post('/format', rootCauseController.getFormattedResult);

export default router;