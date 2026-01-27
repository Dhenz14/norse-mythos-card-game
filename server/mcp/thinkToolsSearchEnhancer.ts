/**
 * Think Tools Search Enhancer
 * 
 * This module enhances Think Tools with internet search capabilities.
 * It fetches information from search engines and integrates it with the Think Tools system.
 */

import { SearchService, SearchResponse } from '../services/searchService';
import { getSearchConfig } from '../config/searchConfig';

// Flag to enable/disable search enhancement
let searchEnhancerEnabled = false;

/**
 * Initialize the search enhancer
 */
function initialize(): void {
  const config = getSearchConfig();
  searchEnhancerEnabled = config.isEnabled;
  console.log(`Think Tools Search Enhancer initialized (enabled: ${searchEnhancerEnabled})`);
}

/**
 * Enable or disable the search enhancer
 */
function setEnabled(enabled: boolean): void {
  searchEnhancerEnabled = enabled;
}

/**
 * Check if search enhancement is enabled
 */
function isEnabled(): boolean {
  return searchEnhancerEnabled;
}

/**
 * Extract key information from search results
 */
function extractKeyInformation(searchResults: SearchResponse): string {
  if (!searchResults.results || searchResults.results.length === 0) {
    return 'No search results found.';
  }

  // Build a comprehensive summary from the search results
  let summary = `Based on ${searchResults.results.length} search results:\n\n`;
  
  searchResults.results.forEach((result, index) => {
    summary += `Source ${index + 1}: ${result.title}\n`;
    summary += `${result.snippet}\n\n`;
  });
  
  return summary;
}

/**
 * Contextualize search results into a coherent summary
 */
function contextualizeSearchResults(query: string, searchResults: SearchResponse): string {
  if (!searchResults.results || searchResults.results.length === 0) {
    return 'No relevant information found for this query.';
  }
  
  // Build a more focused summary
  let contextualization = `Information about "${query}":\n\n`;
  
  // Extract key points from each result
  const keyPoints = searchResults.results.map(result => result.snippet)
    .filter(snippet => snippet.length > 0);
  
  // Combine key points into a coherent summary
  if (keyPoints.length > 0) {
    contextualization += keyPoints.join('\n\n');
  } else {
    contextualization += 'No detailed information available.';
  }
  
  return contextualization;
}

/**
 * Enhance a Think Tools query with search data
 */
async function enhanceWithSearch(query: string): Promise<{
  originalQuery: string;
  searchResults: SearchResponse;
  keyInformation: string;
  contextualizationSummary: string;
}> {
  if (!searchEnhancerEnabled) {
    return {
      originalQuery: query,
      searchResults: {
        searchEngine: 'none',
        results: []
      },
      keyInformation: 'Search enhancement is disabled.',
      contextualizationSummary: 'Search enhancement is disabled.'
    };
  }
  
  try {
    console.log(`Enhancing query with search: "${query}"`);
    
    // Perform the search
    const searchResults = await SearchService.search(query);
    
    // Extract key information
    const keyInformation = extractKeyInformation(searchResults);
    
    // Contextualize the results
    const contextualizationSummary = contextualizeSearchResults(query, searchResults);
    
    return {
      originalQuery: query,
      searchResults,
      keyInformation,
      contextualizationSummary
    };
  } catch (error: any) {
    console.error('Error enhancing query with search:', error.message);
    
    return {
      originalQuery: query,
      searchResults: {
        searchEngine: 'error',
        results: [],
        error: error.message
      },
      keyInformation: `Error during search: ${error.message}`,
      contextualizationSummary: 'Unable to enhance query with search data due to an error.'
    };
  }
}

/**
 * Format enhanced search results for inclusion in Think Tools output
 */
function formatEnhancedResults(enhancedResults: {
  originalQuery: string;
  searchResults: SearchResponse;
  keyInformation: string;
  contextualizationSummary: string;
}): string {
  if (!enhancedResults.searchResults.results || enhancedResults.searchResults.results.length === 0) {
    return 'No search results available.';
  }
  
  let formattedOutput = '## Search Information\n\n';
  formattedOutput += enhancedResults.contextualizationSummary;
  
  formattedOutput += '\n\n## Sources\n\n';
  
  enhancedResults.searchResults.results.forEach((result, index) => {
    formattedOutput += `${index + 1}. [${result.title}](${result.url})\n`;
  });
  
  return formattedOutput;
}

/**
 * Determine if a query would benefit from search enhancement
 */
function shouldEnhanceWithSearch(query: string): boolean {
  if (!searchEnhancerEnabled) {
    return false;
  }
  
  // Skip search for very short queries
  if (query.length < 5) {
    return false;
  }
  
  // Keywords that indicate factual questions that would benefit from search
  const factualKeywords = [
    'who', 'what', 'when', 'where', 'why', 'how',
    'explain', 'define', 'find', 'search', 'information',
    'latest', 'recent', 'current', 'news', 'update',
    'history', 'facts', 'statistics', 'data'
  ];
  
  // Check if query contains any factual keywords
  const queryLower = query.toLowerCase();
  return factualKeywords.some(keyword => 
    queryLower.includes(` ${keyword} `) || 
    queryLower.startsWith(`${keyword} `) || 
    queryLower === keyword
  );
}

// Initialize the enhancer
initialize();

// Export the enhancer
export const ThinkToolsSearchEnhancer = {
  enhanceWithSearch,
  formatEnhancedResults,
  shouldEnhanceWithSearch,
  setEnabled,
  isEnabled
};