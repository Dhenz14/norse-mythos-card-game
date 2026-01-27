/**
 * Search Routes
 * 
 * This module defines routes for the search functionality.
 */

import express from 'express';
import * as searchController from '../controllers/searchController';

const router = express.Router();

// Get search configuration
router.get('/config', searchController.getSearchConfig);

// Set search enabled/disabled
router.post('/enabled', searchController.setSearchEnabled);

// Set search engine
router.post('/engine', searchController.setSearchEngine);

// Set API key
router.post('/api-key', searchController.setApiKey);

// Test search
router.post('/test', searchController.testSearch);

export default router;