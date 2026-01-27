/**
 * Enhanced Think Tools Routes
 */

import express from 'express';
import { processThinkToolsQuery, testMiddleware } from '../api/enhancedThinkTools';

const router = express.Router();

// Process a query with the Think Tools middleware
router.post('/process', processThinkToolsQuery);

// Test the middleware with a sample query
router.post('/test-middleware', testMiddleware);

export default router;