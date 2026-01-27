/**
 * Root Cause Analysis Routes
 * 
 * This module provides API routes for the Root Cause Analysis feature.
 * It handles processing analysis requests and retrieving analysis history.
 * 
 * This consolidated version integrates multiple debugging tools:
 * - Root Cause Analysis for deep problem investigation
 * - Visual Debugging for interface element inspection
 * - Think Tools for sequential reasoning
 * - Memory System for historical analysis
 * - Fix Validation for solution verification
 */

import express from 'express';
import { EnhancedRootCauseAnalyzer } from '../mcp/EnhancedRootCauseAnalyzer';
import RootCauseDBService from '../services/RootCauseDBService';
import RootCauseMemoryManager from '../services/RootCauseMemoryManager';
import PatternMatcher from '../mcp/PatternMatcher';
import { RootCauseIntegrator } from '../mcp/RootCauseIntegrator';

const router = express.Router();
const rootCauseAnalyzer = new EnhancedRootCauseAnalyzer();
const rootCauseIntegrator = new RootCauseIntegrator();

/**
 * Process a root cause analysis request
 * 
 * POST /api/rootcause/process
 */
router.post('/process', async (req, res) => {
  try {
    const { issue } = req.body;
    
    if (!issue || typeof issue !== 'string') {
      return res.status(400).json({ error: 'Issue description is required' });
    }
    
    // Perform analysis with the standard analyzer
    const result = await rootCauseAnalyzer.analyzeRootCause(issue);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error processing root cause analysis:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Process an integrated comprehensive analysis request
 * 
 * POST /api/rootcause/integrated-analysis
 */
router.post('/integrated-analysis', async (req, res) => {
  try {
    const { issue, options } = req.body;
    
    if (!issue || typeof issue !== 'string') {
      return res.status(400).json({ error: 'Issue description is required' });
    }
    
    // Perform comprehensive integrated analysis
    const result = await rootCauseIntegrator.analyzeIssue(issue, options || {});
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error processing integrated root cause analysis:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Format an analysis result for Replit chat
 * 
 * POST /api/rootcause/format-for-chat
 */
router.post('/format-for-chat', async (req, res) => {
  try {
    const { result } = req.body;
    
    if (!result) {
      return res.status(400).json({ error: 'Analysis result is required' });
    }
    
    // Format the result for display in chat
    const formattedResult = rootCauseIntegrator.formatResultForChat(result);
    
    return res.json({ formattedResult });
  } catch (error: any) {
    console.error('Error formatting result for chat:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get recent analyses
 * 
 * GET /api/rootcause/recent
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const analyses = await RootCauseDBService.getRecentAnalyses(limit);
    
    return res.json(analyses);
  } catch (error: any) {
    console.error('Error getting recent analyses:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get analysis by ID
 * 
 * GET /api/rootcause/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Analysis ID is required' });
    }
    
    const analysis = await RootCauseDBService.getAnalysisById(id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Get relationships for this analysis
    const relationships = await RootCauseDBService.getRelationships(id);
    
    return res.json({
      ...analysis,
      relationships
    });
  } catch (error: any) {
    console.error('Error getting analysis by ID:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Search for analyses
 * 
 * GET /api/rootcause/search
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const analyses = await RootCauseDBService.searchAnalyses(query);
    
    return res.json(analyses);
  } catch (error: any) {
    console.error('Error searching analyses:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Get patterns
 * 
 * GET /api/rootcause/patterns
 */
router.get('/patterns', async (req, res) => {
  try {
    const patterns = await RootCauseDBService.getPatterns();
    
    return res.json(patterns);
  } catch (error: any) {
    console.error('Error getting patterns:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;