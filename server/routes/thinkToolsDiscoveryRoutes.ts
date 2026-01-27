/**
 * Think Tools Discovery Protocol API Routes
 * 
 * This module provides API routes for the Think Tools Discovery Protocol.
 */

import express from 'express';
import { getThinkToolsReplitIntegrationRouter } from '../mcp/thinkToolsReplitIntegration';

const router = express.Router();

// Use the integration router
router.use('/', getThinkToolsReplitIntegrationRouter());

export default router;