/**
 * Search Service
 * 
 * This service provides internet search functionality for the Think Tools system.
 * It supports multiple search engines and fallback mechanisms.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { getSearchConfig, getApiKey, hasApiKey, isSearchConfigured, updateSearchConfig, SearchConfig } from '../config/searchConfig';

// Search result interface
export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

// Search response interface
export interface SearchResponse {
  searchEngine: string;
  results: SearchResult[];
  totalResults?: number;
  cached?: boolean;
  error?: string;
}

// In-memory cache for search results
const searchCache = new Map<string, SearchResponse>();

// Flag to enable/disable search
let searchEnabled = false;

/**
 * Initialize the Brave API key from environment variables
 */
function initializeBraveApiKey(): void {
  // Check if the environment variable exists
  const envApiKey = process.env.BRAVE_API_KEY;
  
  if (envApiKey && envApiKey.trim() !== '') {
    console.log('Loading Brave Search API key from environment variable');
    updateApiKey('brave', envApiKey);
  }
}

/**
 * Initialize the search service
 */
function initialize() {
  // Load environment-based API keys
  initializeBraveApiKey();
  
  // Get updated config after environment variables are loaded
  const config = getSearchConfig();
  searchEnabled = config.isEnabled;
  
  console.log(`Search Service initialized with engine: ${config.preferredEngine}`);
}

/**
 * Search using Google Custom Search API
 */
async function searchWithGoogle(query: string): Promise<SearchResponse> {
  try {
    const apiKey = getApiKey('google');
    const cx = getApiKey('googleCx');
    
    if (!apiKey || !cx) {
      throw new Error('Google Search API key or CX not configured');
    }
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: cx,
        q: query
      }
    });
    
    if (!response.data || !response.data.items) {
      return {
        searchEngine: 'google',
        results: [],
        error: 'No results found'
      };
    }
    
    const results: SearchResult[] = response.data.items.map((item: any) => ({
      title: item.title,
      snippet: item.snippet || '',
      url: item.link
    }));
    
    return {
      searchEngine: 'google',
      results,
      totalResults: response.data.searchInformation?.totalResults || results.length
    };
  } catch (error: any) {
    console.error('Google search error:', error.message);
    return {
      searchEngine: 'google',
      results: [],
      error: error.message
    };
  }
}

/**
 * Search using Bing Search API
 */
async function searchWithBing(query: string): Promise<SearchResponse> {
  try {
    const apiKey = getApiKey('bing');
    
    if (!apiKey) {
      throw new Error('Bing Search API key not configured');
    }
    
    const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
      params: {
        q: query,
        count: 10
      },
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey
      }
    });
    
    if (!response.data || !response.data.webPages || !response.data.webPages.value) {
      return {
        searchEngine: 'bing',
        results: [],
        error: 'No results found'
      };
    }
    
    const results: SearchResult[] = response.data.webPages.value.map((item: any) => ({
      title: item.name,
      snippet: item.snippet || '',
      url: item.url
    }));
    
    return {
      searchEngine: 'bing',
      results,
      totalResults: response.data.webPages.totalEstimatedMatches || results.length
    };
  } catch (error: any) {
    console.error('Bing search error:', error.message);
    return {
      searchEngine: 'bing',
      results: [],
      error: error.message
    };
  }
}

/**
 * Search using Brave Search API
 */
async function searchWithBrave(query: string): Promise<SearchResponse> {
  try {
    const apiKey = getApiKey('brave');
    
    if (!apiKey) {
      throw new Error('Brave Search API key not configured');
    }
    
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: {
        q: query,
        count: 10,
        offset: 0,
        safesearch: 'moderate'
      },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey
      }
    });
    
    if (!response.data || !response.data.web || !response.data.web.results) {
      return {
        searchEngine: 'brave',
        results: [],
        error: 'No results found'
      };
    }
    
    const results: SearchResult[] = response.data.web.results.map((item: any) => ({
      title: item.title,
      snippet: item.description || '',
      url: item.url
    }));
    
    return {
      searchEngine: 'brave',
      results,
      totalResults: response.data.web.totalResults || results.length
    };
  } catch (error: any) {
    console.error('Brave search error:', error.message);
    return {
      searchEngine: 'brave',
      results: [],
      error: error.message
    };
  }
}

/**
 * Search using Serper.dev API
 */
async function searchWithSerper(query: string): Promise<SearchResponse> {
  try {
    const apiKey = getApiKey('serper');
    
    if (!apiKey) {
      throw new Error('Serper.dev API key not configured');
    }
    
    const response = await axios.post(
      'https://api.serper.dev/search',
      {
        q: query,
        num: 10
      },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data || !response.data.organic) {
      return {
        searchEngine: 'serper',
        results: [],
        error: 'No results found'
      };
    }
    
    const results: SearchResult[] = response.data.organic.map((item: any) => ({
      title: item.title,
      snippet: item.snippet || '',
      url: item.link
    }));
    
    return {
      searchEngine: 'serper',
      results,
      totalResults: results.length
    };
  } catch (error: any) {
    console.error('Serper search error:', error.message);
    return {
      searchEngine: 'serper',
      results: [],
      error: error.message
    };
  }
}

/**
 * Fallback search method using web scraping
 * This is a basic implementation that may not work on all sites
 * and should only be used as a last resort fallback.
 */
async function searchWithFallback(query: string): Promise<SearchResponse> {
  try {
    // Encode the query for use in URL
    const encodedQuery = encodeURIComponent(query);
    
    // Make a request to a search engine
    const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodedQuery}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.data) {
      return {
        searchEngine: 'fallback',
        results: [],
        error: 'No results found'
      };
    }
    
    // Parse the HTML
    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];
    
    // Extract search results
    $('.result').each((i, el) => {
      if (i < 10) { // Limit to 10 results
        const titleEl = $(el).find('.result__title a');
        const snippetEl = $(el).find('.result__snippet');
        
        const title = titleEl.text().trim();
        const snippet = snippetEl.text().trim();
        const url = titleEl.attr('href') || '';
        
        if (title && url) {
          results.push({
            title,
            snippet,
            url
          });
        }
      }
    });
    
    return {
      searchEngine: 'fallback',
      results,
      totalResults: results.length
    };
  } catch (error: any) {
    console.error('Fallback search error:', error.message);
    return {
      searchEngine: 'fallback',
      results: [],
      error: error.message
    };
  }
}

/**
 * Main search function that uses the preferred engine and falls back if needed
 */
async function search(query: string): Promise<SearchResponse> {
  // Check if search is enabled
  if (!searchEnabled) {
    return {
      searchEngine: 'none',
      results: [],
      error: 'Search is disabled'
    };
  }
  
  // Check if the result is in cache
  const config = getSearchConfig();
  const cacheKey = `${config.preferredEngine}:${query}`;
  
  if (config.cacheEnabled && searchCache.has(cacheKey)) {
    const cachedResult = searchCache.get(cacheKey)!;
    return {
      ...cachedResult,
      cached: true
    };
  }
  
  // Determine which search engine to use
  const preferredEngine = config.preferredEngine;
  let searchResponse: SearchResponse;
  
  try {
    switch (preferredEngine) {
      case 'google':
        searchResponse = await searchWithGoogle(query);
        break;
      case 'bing':
        searchResponse = await searchWithBing(query);
        break;
      case 'serper':
        searchResponse = await searchWithSerper(query);
        break;
      case 'brave':
        searchResponse = await searchWithBrave(query);
        break;
      case 'fallback':
        searchResponse = await searchWithFallback(query);
        break;
      default:
        // Default to Google
        searchResponse = await searchWithGoogle(query);
    }
    
    // If no results, try fallback methods
    if (searchResponse.results.length === 0 && preferredEngine !== 'fallback') {
      console.log(`No results found with ${preferredEngine}, trying fallback method...`);
      searchResponse = await searchWithFallback(query);
    }
    
    // Cache the result if caching is enabled
    if (config.cacheEnabled && searchResponse.results.length > 0) {
      searchCache.set(cacheKey, searchResponse);
    }
    
    return searchResponse;
  } catch (error: any) {
    console.error('Search error:', error.message);
    
    // If preferred engine failed, try fallback
    if (preferredEngine !== 'fallback') {
      console.log('Trying fallback search method...');
      return searchWithFallback(query);
    }
    
    return {
      searchEngine: preferredEngine,
      results: [],
      error: error.message
    };
  }
}

/**
 * Clear the search cache
 */
function clearCache(): void {
  searchCache.clear();
}

/**
 * Enable or disable search
 */
function setEnabled(enabled: boolean): void {
  searchEnabled = enabled;
  
  // Update the config
  const config = getSearchConfig();
  config.isEnabled = enabled;
  updateSearchConfig(config);
}

/**
 * Check if search is enabled
 */
function isEnabled(): boolean {
  return searchEnabled;
}

/**
 * Check if search is functional (has API keys configured)
 */
function isSearchFunctional(): boolean {
  return isSearchConfigured();
}

/**
 * Set the preferred search engine
 */
function setPreferredEngine(engine: string): void {
  const config = getSearchConfig();
  config.preferredEngine = engine;
  updateSearchConfig(config);
}

/**
 * Update an API key for a specific engine
 */
function updateApiKey(engine: string, key: string): void {
  const config = getSearchConfig();
  
  if (engine === 'google' || engine === 'googleCx' || engine === 'bing' || engine === 'serper' || engine === 'brave') {
    config.apiKeys[engine] = key;
    updateSearchConfig(config);
  }
}

// Initialize the service
initialize();

/**
 * Get the current search configuration
 */
function getConfig(): SearchConfig {
  return getSearchConfig();
}

// Export the service
export const SearchService = {
  search,
  clearCache,
  setEnabled,
  isEnabled,
  isSearchFunctional,
  setPreferredEngine,
  updateApiKey,
  getConfig
};