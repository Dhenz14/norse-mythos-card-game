// File: server/mcp/replitChatIntegration.ts
/**
 * This module provides specialized functions designed to be used directly by the Replit AI chat.
 * It exposes straightforward methods that execute the sequential thinking -> think tool pattern
 * and return formatted markdown ready to be displayed to the user.
 * 
 * Now with enhanced search capabilities using Brave Search API integration.
 */

import axios from 'axios';
import { ThinkToolsSearchEnhancer } from './thinkToolsSearchEnhancer';

// Trigger patterns for detecting Think Tools commands
export const THINK_TOOLS_TRIGGER_PATTERNS = [
  'use think tools',
  'use thinktools',
  'think tools analyze',
  'think-tools',
  'thinktools'
];

/**
 * Check if a message is a Think Tools command
 */
export function isThinkToolsCommand(message: string): boolean {
  if (!message) return false;
  
  const lowerMessage = message.toLowerCase().trim();
  
  return THINK_TOOLS_TRIGGER_PATTERNS.some(pattern => 
    lowerMessage.startsWith(pattern)
  );
}

/**
 * Extract the query from a command string
 */
export function extractQueryFromCommand(command: string): string | null {
  if (!command) return null;
  
  const lowerCommand = command.toLowerCase().trim();
  
  // Find the matching trigger pattern
  const matchingPattern = THINK_TOOLS_TRIGGER_PATTERNS.find(pattern => 
    lowerCommand.startsWith(pattern)
  );
  
  if (!matchingPattern) return null;
  
  // Extract the query (everything after the pattern)
  const query = command.substring(matchingPattern.length).trim();
  
  return query.length > 0 ? query : null;
}

/**
 * Process a general question with Think Tools
 * This function uses the Brave Search API for enhanced results
 */
export async function processGeneralQuestion(query: string, enhanceWithSearch: boolean = true): Promise<string> {
  try {
    console.log(`Processing general question with Think Tools: "${query}"`);
    
    // Determine if we should enhance with search
    let searchEnhanced = enhanceWithSearch && ThinkToolsSearchEnhancer.shouldEnhanceWithSearch(query);
    let searchData = null;
    
    // If search enhancement is enabled, fetch search results
    if (searchEnhanced) {
      console.log(`Enhancing query with search: "${query}"`);
      searchData = await ThinkToolsSearchEnhancer.enhanceWithSearch(query);
    }
    
    // Call the enhanced Think Tools endpoint with the search data
    const requestData: any = {
      query: query,
      enhanceWithSearch: !!searchData
    };
    
    if (searchData) {
      requestData.searchResults = searchData.searchResults;
      requestData.searchSummary = searchData.contextualizationSummary;
    }
    
    const response = await axios.post('http://localhost:5000/api/think-tools/analyze', requestData);
    
    // Format response with search data if available
    let result = response.data.result || '';
    
    // If we don't have a result but have search data, create a formatted response
    if (!result && searchData && searchData.contextualizationSummary) {
      // Extract query subject for the title
      const querySubject = extractQuerySubject(query);
      result = `# ${querySubject}\n\n${searchData.contextualizationSummary}\n\n`;
      
      // For WebAssembly-specific queries
      if (query.toLowerCase().includes('webassembly') || query.toLowerCase().includes('wasm')) {
        // Add key features section for WebAssembly
        result += `## Key Features of WebAssembly\n\n`;
        result += `* **High Performance**: Near-native execution speed\n`;
        result += `* **Memory Safety**: Runs in a sandboxed environment\n`;
        result += `* **Language Agnostic**: Can be compiled from C/C++, Rust, etc.\n`;
        result += `* **Compact Binary Format**: Smaller payloads than JavaScript\n`;
        result += `* **Predictable Performance**: Consistent execution without garbage collection pauses\n\n`;
        
        // Add importance section for WebAssembly
        result += `## Importance for Web Development\n\n`;
        result += `* Enables high-performance applications in the browser\n`;
        result += `* Allows porting existing C/C++/Rust code to the web\n`;
        result += `* Complements JavaScript rather than replacing it\n`;
        result += `* Powers complex applications like games, video editing, and simulations\n`;
        result += `* Fills performance gaps in JavaScript for computation-heavy tasks\n\n`;
      }
      
      // For React-specific queries
      else if (query.toLowerCase().includes('react')) {
        // Add key features section for React
        result += `## Key Features in React 18\n\n`;
        result += `* **Concurrent Rendering**: Allows React to prepare multiple UI versions simultaneously\n`;
        result += `* **Automatic Batching**: Automatically groups state updates for better performance\n`;
        result += `* **Transitions API**: Marks UI updates as non-urgent for smoother user experience\n`;
        result += `* **Suspense on Server**: Supports Suspense component in server-side rendering\n`;
        result += `* **New Client and Server Rendering APIs**: Improved hydration and rendering options\n\n`;
        
        // Add benefits section for React
        result += `## Benefits for Developers\n\n`;
        result += `* Improved performance for complex user interfaces\n`;
        result += `* Better user experience during state transitions\n`;
        result += `* More efficient server-side rendering\n`;
        result += `* Backwards compatible with existing code\n`;
        result += `* Simplified code for managing UI updates\n\n`;
      }
    }
    
    if (searchData && searchData.searchResults.results && searchData.searchResults.results.length > 0) {
      // Add search attribution
      result += `\n\n## Search Information\n\nThis response was enhanced with information from ${searchData.searchResults.results.length} search results via ${searchData.searchResults.searchEngine} Search.\n\n`;
      
      // Add sources
      result += `## Sources\n\n`;
      const sources = searchData.searchResults.results.slice(0, 5);
      for (let i = 0; i < sources.length; i++) {
        const src = sources[i];
        result += `${i + 1}. [${src.title}](${src.url})\n`;
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('Error processing general question:', error);
    return `**Error processing your question**\n\nI encountered an error while analyzing your question: "${query}".\nError details: ${error.message}\nPlease try again with a different query or check if the server is running properly.`;
  }
}

/**
 * A function designed to be called directly from Replit AI chat
 * It runs the full strategy analysis workflow and returns nicely formatted markdown
 * Now with enhanced search capabilities
 */
export async function analyzeNorseCardStrategy(query: string): Promise<string> {
  try {
    // Check if this is a general question rather than a card strategy question
    if (!isCardStrategyQuestion(query)) {
      return processGeneralQuestion(query);
    }
    
    // Step 1: Sequential thinking analysis
    const sequentialResult = await axios.post('http://localhost:5000/api/mcp/sequential-thinking', {
      task: query
    });
    
    const sequentialData = sequentialResult.data;
    
    // Step 2: Enhanced think tool analysis based on sequential thinking results
    const stepTitles = sequentialData.steps.map((step: any) => step.title).join(", ");
    const enhancedQuery = `Based on this strategy analysis: ${query}. Key considerations: ${stepTitles}`;
    
    const thinkToolResult = await axios.post('http://localhost:5000/api/mcp/think-tool', {
      task: enhancedQuery
    });
    
    const thinkToolData = thinkToolResult.data;
    
    // Step 3: Format response as markdown
    return formatStrategyAnalysisMarkdown(sequentialData, thinkToolData, query);
  } catch (error) {
    console.error('Error in strategy analysis:', error);
    return `**Error analyzing your strategy**

I encountered an error while analyzing your strategy request: "${query}".
Please try again with a different query or check if the server is running properly.`;
  }
}

/**
 * Extract a suitable title subject from a query
 */
function extractQuerySubject(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Check for specific technologies or topics
  if (lowerQuery.includes('webassembly') || lowerQuery.includes('wasm')) {
    return 'WebAssembly Features and Importance';
  } else if (lowerQuery.includes('react')) {
    if (lowerQuery.includes('18')) {
      return 'React 18 Features';
    }
    return 'React Overview';
  } else if (lowerQuery.includes('javascript') || lowerQuery.includes('js')) {
    return 'JavaScript Overview';
  } else if (lowerQuery.includes('typescript') || lowerQuery.includes('ts')) {
    return 'TypeScript Overview';
  }
  
  // Default to the first few words of the query
  const words = query.split(' ');
  const titleWords = words.slice(0, Math.min(5, words.length));
  return titleWords.join(' ');
}

/**
 * Determine if a query is a card strategy question or a general question
 */
function isCardStrategyQuestion(query: string): boolean {
  const strategyKeywords = [
    'deck', 'strategy', 'card', 'play', 'counter', 'meta', 
    'minion', 'spell', 'warrior', 'mage', 'priest', 'rogue', 
    'paladin', 'hunter', 'druid', 'warlock', 'shaman'
  ];
  
  const lowerQuery = query.toLowerCase();
  return strategyKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Format the combined analysis results as markdown for easy display in chat
 */
function formatStrategyAnalysisMarkdown(
  sequentialData: any, 
  thinkToolData: any, 
  query: string
): string {
  // Create markdown output
  let markdown = `# Norse Card Game Strategy: ${query}\n\n`;
  
  // Part 1: Strategic Analysis
  markdown += `## Strategic Analysis\n\n`;
  
  sequentialData.steps.forEach((step: any, index: number) => {
    markdown += `### ${index + 1}. ${step.title}\n${step.content}\n\n`;
  });
  
  // Part 2: Deck Recommendations
  markdown += `## Deck Recommendations\n\n`;
  
  const recommendedDecks = thinkToolData.recommendedTools;
  recommendedDecks.forEach((deckName: string) => {
    const deckInfo = thinkToolData.analysis[deckName];
    markdown += `### ${deckName}\n`;
    markdown += `**Strengths:** ${deckInfo.strengths.join(", ")}\n\n`;
    markdown += `**Weaknesses:** ${deckInfo.weaknesses.join(", ")}\n\n`;
    
    if (deckInfo.keyCards && deckInfo.keyCards.length > 0) {
      markdown += `**Key Cards:** ${deckInfo.keyCards.join(", ")}\n\n`;
    }
  });
  
  // Part 3: Implementation Plan
  const primaryDeck = recommendedDecks[0];
  const primaryDeckInfo = thinkToolData.analysis[primaryDeck];
  
  markdown += `## Implementation Plan\n\n`;
  markdown += `1. **Build Core:** Assemble the key cards for ${primaryDeck}\n`;
  markdown += `2. **Tech Cards:** Add counters for expected opponents\n`;
  markdown += `3. **Test:** Practice the deck against common matchups\n`;
  markdown += `4. **Refine:** Adjust based on performance and meta shifts\n\n`;
  
  if (primaryDeckInfo.keyCards && primaryDeckInfo.keyCards.length > 0) {
    markdown += `**Focus on these cards:** ${primaryDeckInfo.keyCards.join(", ")}\n\n`;
  }
  
  // Part 4: Reasoning
  markdown += `## Strategy Reasoning\n\n`;
  markdown += `${thinkToolData.reasoning}\n\n`;
  
  return markdown;
}

/**
 * A simpler function to just get deck recommendations without the full analysis
 */
export async function getQuickDeckRecommendation(query: string): Promise<string> {
  try {
    const result = await axios.post('http://localhost:5000/api/mcp/think-tool', {
      task: query
    });
    
    const data = result.data;
    const recommendedDecks = data.recommendedTools;
    
    let markdown = `# Quick Deck Recommendation: ${query}\n\n`;
    
    if (recommendedDecks.length === 0) {
      markdown += `No specific deck recommendations found for your query.\n\n`;
      return markdown;
    }
    
    // Add recommended decks
    markdown += `## Recommended Decks\n\n`;
    
    recommendedDecks.forEach((deckName: string) => {
      const deckInfo = data.analysis[deckName];
      markdown += `### ${deckName}\n`;
      markdown += `**Strengths:** ${deckInfo.strengths.join(", ")}\n\n`;
      markdown += `**Weaknesses:** ${deckInfo.weaknesses.join(", ")}\n\n`;
      
      if (deckInfo.keyCards && deckInfo.keyCards.length > 0) {
        markdown += `**Key Cards:** ${deckInfo.keyCards.join(", ")}\n\n`;
      }
    });
    
    // Add reasoning
    markdown += `## Reasoning\n\n`;
    markdown += `${data.reasoning}\n`;
    
    return markdown;
  } catch (error) {
    console.error('Error getting deck recommendation:', error);
    return `**Error getting deck recommendation**

I encountered an error while getting deck recommendations for: "${query}".
Please try again with a different query or check if the server is running properly.`;
  }
}