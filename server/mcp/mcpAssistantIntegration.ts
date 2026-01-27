// File: server/mcp/mcpAssistantIntegration.ts
import { Request, Response } from "express";

/**
 * This module provides specialized endpoints that are optimized for direct integration 
 * with Replit's AI assistant. The responses are formatted specifically to be easily 
 * consumed and displayed by the chat interface.
 */

export interface AssistantIntegrationRequest {
  query: string;
  step?: 'analyze' | 'recommend' | 'combined';
  previousAnalysis?: any;
}

/**
 * Handles strategic analysis requests from Replit AI Assistant
 * This endpoint performs sequential thinking analysis and formats the result
 * for direct consumption within the chat interface
 */
export const assistantAnalyze = async (req: Request, res: Response) => {
  try {
    const { query } = req.body as AssistantIntegrationRequest;
    
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Call the sequential thinking endpoint
    const response = await fetch('http://localhost:5000/api/mcp/sequential-thinking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: query }),
    });

    if (!response.ok) {
      throw new Error(`Error from sequential thinking API: ${response.status}`);
    }

    const data = await response.json();
    
    // Format the response for the assistant chat interface
    const formattedResponse = {
      analysis: data,
      chatResponse: formatSequentialThinkingForChat(data, query)
    };

    res.status(200).json(formattedResponse);
  } catch (error) {
    console.error("Assistant Integration (Analyze) Error:", error);
    res.status(500).json({ 
      error: "Error processing analysis request",
      chatResponse: "I encountered an error while analyzing your strategy. Please try again with a different query."
    });
  }
};

/**
 * Handles deck recommendation requests from Replit AI Assistant
 * This endpoint uses the think tool to recommend decks based on a query
 * and formats the result for direct display in the chat interface
 */
export const assistantRecommend = async (req: Request, res: Response) => {
  try {
    const { query, previousAnalysis } = req.body as AssistantIntegrationRequest;
    
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Create an enhanced query if we have previous analysis
    let enhancedQuery = query;
    if (previousAnalysis && previousAnalysis.steps) {
      const stepTitles = previousAnalysis.steps.map((step: any) => step.title).join(", ");
      enhancedQuery = `Based on this strategy analysis: ${query}. Key considerations: ${stepTitles}`;
    }

    // Call the think tool endpoint
    const response = await fetch('http://localhost:5000/api/mcp/think-tool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: enhancedQuery }),
    });

    if (!response.ok) {
      throw new Error(`Error from think tool API: ${response.status}`);
    }

    const data = await response.json();
    
    // Format the response for the assistant chat interface
    const formattedResponse = {
      recommendations: data,
      chatResponse: formatThinkToolForChat(data, query)
    };

    res.status(200).json(formattedResponse);
  } catch (error) {
    console.error("Assistant Integration (Recommend) Error:", error);
    res.status(500).json({ 
      error: "Error processing recommendation request",
      chatResponse: "I encountered an error while generating deck recommendations. Please try again with a different query."
    });
  }
};

/**
 * Handles combined analysis and recommendation in a single request
 * This endpoint runs both sequential thinking and think tool in sequence
 * and combines their results into a comprehensive response for the chat interface
 */
export const assistantCombined = async (req: Request, res: Response) => {
  try {
    const { query } = req.body as AssistantIntegrationRequest;
    
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Step 1: Run sequential thinking
    const sequentialResponse = await fetch('http://localhost:5000/api/mcp/sequential-thinking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: query }),
    });

    if (!sequentialResponse.ok) {
      throw new Error(`Error from sequential thinking API: ${sequentialResponse.status}`);
    }

    const sequentialData = await sequentialResponse.json();

    // Step 2: Create enhanced query for think tool
    const stepTitles = sequentialData.steps.map((step: any) => step.title).join(", ");
    const enhancedQuery = `Based on this strategy analysis: ${query}. Key considerations: ${stepTitles}`;

    // Step 3: Run think tool
    const thinkToolResponse = await fetch('http://localhost:5000/api/mcp/think-tool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: enhancedQuery }),
    });

    if (!thinkToolResponse.ok) {
      throw new Error(`Error from think tool API: ${thinkToolResponse.status}`);
    }

    const thinkToolData = await thinkToolResponse.json();

    // Step 4: Combine and format results for the assistant
    const combinedResponse = {
      analysis: sequentialData,
      recommendations: thinkToolData,
      chatResponse: formatCombinedForChat(sequentialData, thinkToolData, query)
    };

    res.status(200).json(combinedResponse);
  } catch (error) {
    console.error("Assistant Integration (Combined) Error:", error);
    res.status(500).json({ 
      error: "Error processing combined analysis and recommendation request",
      chatResponse: "I encountered an error while analyzing your strategy. Please try again with a different query."
    });
  }
};

/**
 * Format sequential thinking results for chat display
 */
function formatSequentialThinkingForChat(data: any, query: string): string {
  let response = `# Strategic Analysis: ${query}\n\n`;
  
  // Add the steps
  response += `## Key Analysis Steps\n`;
  data.steps.forEach((step: any, index: number) => {
    response += `### ${index + 1}. ${step.title}\n${step.content}\n\n`;
  });
  
  // Add reasoning
  response += `## Strategic Reasoning\n${data.reasoning}\n\n`;
  
  // Add prompt for next action
  response += `Would you like me to recommend specific decks based on this analysis?`;
  
  return response;
}

/**
 * Format think tool results for chat display
 */
function formatThinkToolForChat(data: any, query: string): string {
  const recommendedDecks = data.recommendedTools;
  
  let response = `# Deck Recommendations: ${query}\n\n`;

  // Add recommended decks section
  response += `## Recommended Strategies\n`;
  recommendedDecks.forEach((deckName: string) => {
    const deckInfo = data.analysis[deckName];
    response += `### ${deckName}\n`;
    response += `**Strengths:** ${deckInfo.strengths.join(", ")}\n`;
    response += `**Weaknesses:** ${deckInfo.weaknesses.join(", ")}\n`;
    if (deckInfo.keyCards) {
      response += `**Key Cards:** ${deckInfo.keyCards.join(", ")}\n`;
    }
    response += `\n`;
  });
  
  // Add reasoning
  response += `## Recommendation Reasoning\n${data.reasoning}\n\n`;
  
  // Add next steps
  response += `Would you like me to provide a more detailed analysis on one of these decks?`;
  
  return response;
}

/**
 * Format combined analysis and recommendations for chat display
 */
function formatCombinedForChat(sequentialData: any, thinkToolData: any, query: string): string {
  let response = `# Complete Strategy Guide: ${query}\n\n`;
  
  // Part 1: Strategic Analysis
  response += `## Strategic Analysis\n`;
  sequentialData.steps.forEach((step: any, index: number) => {
    response += `### ${index + 1}. ${step.title}\n${step.content}\n\n`;
  });
  
  // Part 2: Deck Recommendations
  response += `## Recommended Decks\n`;
  
  thinkToolData.recommendedTools.forEach((deckName: string) => {
    const deckInfo = thinkToolData.analysis[deckName];
    response += `### ${deckName}\n`;
    response += `**Strengths:** ${deckInfo.strengths.join(", ")}\n`;
    response += `**Weaknesses:** ${deckInfo.weaknesses.join(", ")}\n`;
    if (deckInfo.keyCards) {
      response += `**Key Cards:** ${deckInfo.keyCards.join(", ")}\n`;
    }
    response += `\n`;
  });
  
  // Part 3: Implementation Plan
  const primaryDeck = thinkToolData.recommendedTools[0];
  const primaryDeckInfo = thinkToolData.analysis[primaryDeck];
  
  response += `## Implementation Plan\n`;
  response += `1. **Build Core:** Assemble the key cards for ${primaryDeck}\n`;
  response += `2. **Tech Cards:** Add counters for expected opponents\n`;
  response += `3. **Test:** Practice the deck against common matchups\n`;
  response += `4. **Refine:** Adjust based on performance and meta shifts\n\n`;
  
  // Add key cards highlight
  if (primaryDeckInfo.keyCards) {
    response += `**Focus on these cards:** ${primaryDeckInfo.keyCards.join(", ")}\n\n`;
  }
  
  // Add reasoning and next steps
  response += `## Reasoning\n${thinkToolData.reasoning}\n\n`;
  response += `Is there a specific aspect of this strategy you'd like me to elaborate on?`;
  
  return response;
}