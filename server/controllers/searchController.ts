/**
 * Search Controller
 * 
 * This controller handles configuration and management of the search
 * capabilities for the Think Tools system.
 */

import { Request, Response } from 'express';
import { SearchService } from '../services/searchService';
import { SearchConfig } from '../config/searchConfig';
import { ThinkToolsSearchEnhancer } from '../mcp/thinkToolsSearchEnhancer';

/**
 * Get the current search configuration
 */
export const getSearchConfig = (req: Request, res: Response) => {
  try {
    const config = SearchService.getConfig();
    const isSearchEnabled = SearchService.isEnabled();
    const isSearchFunctional = SearchService.isSearchFunctional();
    
    res.json({
      success: true,
      config,
      isSearchEnabled,
      isSearchFunctional
    });
  } catch (error: any) {
    console.error('Error getting search config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve search configuration',
      details: error.message
    });
  }
};

/**
 * Enable or disable search
 */
export const setSearchEnabled = (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter. "enabled" must be a boolean.'
      });
    }
    
    // Update the SearchService
    SearchService.setEnabled(enabled);
    
    // Update the ThinkToolsSearchEnhancer
    ThinkToolsSearchEnhancer.setEnabled(enabled);
    
    // Log the status change
    console.log(`Search is now ${enabled ? 'enabled' : 'disabled'}`);
    
    res.json({
      success: true,
      isSearchEnabled: SearchService.isEnabled()
    });
  } catch (error: any) {
    console.error('Error setting search enabled:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update search enabled status',
      details: error.message
    });
  }
};

/**
 * Set search engine preference
 */
export const setSearchEngine = (req: Request, res: Response) => {
  try {
    const { engine } = req.body;
    
    if (!engine || typeof engine !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter. "engine" must be a non-empty string.'
      });
    }
    
    // Valid engines
    const validEngines = ['google', 'bing', 'serper', 'brave', 'fallback'];
    
    if (!validEngines.includes(engine)) {
      return res.status(400).json({
        success: false,
        error: `Invalid search engine. Valid engines are: ${validEngines.join(', ')}`
      });
    }
    
    // Update the search service
    SearchService.setPreferredEngine(engine);
    
    res.json({
      success: true,
      preferredEngine: engine
    });
  } catch (error: any) {
    console.error('Error setting search engine:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update search engine preference',
      details: error.message
    });
  }
};

/**
 * Set API key for a specific search engine
 */
export const setApiKey = (req: Request, res: Response) => {
  try {
    const { engine, key } = req.body;
    
    if (!engine || typeof engine !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter. "engine" must be a non-empty string.'
      });
    }
    
    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter. "key" must be a non-empty string.'
      });
    }
    
    // Valid engine keys
    const validEngineKeys = ['google', 'googleCx', 'bing', 'serper', 'brave'];
    
    if (!validEngineKeys.includes(engine)) {
      return res.status(400).json({
        success: false,
        error: `Invalid engine for API key. Valid engines are: ${validEngineKeys.join(', ')}`
      });
    }
    
    // Update the search service
    SearchService.updateApiKey(engine, key);
    
    res.json({
      success: true,
      message: `API key for ${engine} updated successfully`
    });
  } catch (error: any) {
    console.error('Error setting API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update API key',
      details: error.message
    });
  }
};

/**
 * Test a search query
 */
export const testSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter. "query" must be a non-empty string.'
      });
    }
    
    // Check if search is enabled
    if (!SearchService.isEnabled()) {
      return res.json({
        success: true,
        enhancedWithSearch: false,
        error: 'Search is currently disabled. Enable it in the settings to use this feature.'
      });
    }
    
    // Test direct search first to check if search is working
    console.log(`Testing search with query: "${query}"`);
    const searchResults = await SearchService.search(query);
    
    // If no search results, return error
    if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
      return res.json({
        success: true,
        enhancedWithSearch: false,
        error: 'No search results found. Please check your API keys and try again.'
      });
    }
    
    // Test the end-to-end flow with ThinkToolsSearchEnhancer
    console.log(`Testing end-to-end search enhancement with ThinkToolsSearchEnhancer`);
    const enhancedResults = await ThinkToolsSearchEnhancer.enhanceWithSearch(query);
    
    res.json({
      success: true,
      enhancedWithSearch: true,
      searchResults,
      contextualizationSummary: enhancedResults.contextualizationSummary
    });
  } catch (error: any) {
    console.error('Error testing search:', error);
    res.status(500).json({
      success: false,
      error: 'Search test failed',
      details: error.message
    });
  }
};