// File: server/mcp/triggerCommand.ts
import { Request, Response } from "express";
import axios from "axios";
import { EnhancedThinkTools } from './EnhancedThinkTools';
import EnhancedResponseFormatter from './EnhancedResponseFormatter';
import ThinkToolsContext from './ThinkToolsContext';

/**
 * This module provides a special trigger command handler for the Replit AI assistant
 * When the user types "Use Think Tools" followed by a strategy question, this handler
 * will run the enhanced Think Tools workflow and return formatted results with
 * codebase awareness and Replit tool integration.
 */

export interface TriggerCommandRequest {
  command: string;
  query: string;
  codebaseContext?: boolean;
  allowToolExecution?: boolean;
  previousResults?: any;
}

export interface TriggerCommandResponse {
  triggered: boolean;
  result?: string;
  error?: string;
}

/**
 * Handler for the "Use Think Tools" trigger command
 */
export const handleTriggerCommand = async (req: Request, res: Response) => {
  try {
    const { command, query, codebaseContext = true, allowToolExecution = false, previousResults } = req.body as TriggerCommandRequest;

    // Check if this is the trigger command
    const isTriggerCommand = 
      typeof command === 'string' && 
      command.toLowerCase() === 'use think tools';

    if (!isTriggerCommand) {
      return res.status(200).json({
        triggered: false,
        result: "Command not recognized. Use 'Use Think Tools' followed by your strategy question."
      });
    }

    if (!query || typeof query !== 'string') {
      return res.status(200).json({
        triggered: true,
        result: "Please provide a strategy question after 'Use Think Tools'."
      });
    }

    console.log(`Triggered Enhanced Think Tools for query: "${query}"`);
    
    // Always use the enhanced version for better results
    // The enhanced version includes codebase analysis and integration with Replit tools
    const useEnhanced = true;
    
    if (useEnhanced) {
      // Use the enhanced Think Tools with codebase awareness
      const thinkToolsContext = ThinkToolsContext.getInstance();
      const enhancedTools = new EnhancedThinkTools(thinkToolsContext);
      
      const result = await enhancedTools.analyzeQuery(query, {
        context: previousResults,
        allowToolExecution
      });
      
      // Format the enhanced response
      const responseFormatter = new EnhancedResponseFormatter();
      const markdown = responseFormatter.formatResponse(result);
      
      res.status(200).json({
        triggered: true,
        result: markdown
      });
    } else {
      // Use the standard Think Tools
      // Step 1: Sequential thinking analysis
      const sequentialResponse = await axios.post('http://localhost:5000/api/mcp/sequential-thinking', {
        task: query
      });
      
      const sequentialData = sequentialResponse.data;
      
      // Step 2: Enhanced think tool analysis based on sequential thinking results
      const stepTitles = sequentialData.steps.map((step: any) => step.title).join(", ");
      const enhancedQuery = `Based on this strategy analysis: ${query}. Key considerations: ${stepTitles}`;
      
      const thinkToolResponse = await axios.post('http://localhost:5000/api/mcp/think-tool', {
        task: enhancedQuery
      });
      
      const thinkToolData = thinkToolResponse.data;
      
      // Step 3: Format response as markdown
      const markdown = formatStrategyAnalysisMarkdown(sequentialData, thinkToolData, query);
      
      res.status(200).json({
        triggered: true,
        result: markdown
      });
    }
  } catch (error: any) {
    console.error('Error handling trigger command:', error);
    res.status(500).json({
      triggered: true,
      error: `Error processing strategy analysis: ${error.message}`
    });
  }
};

/**
 * Format the combined analysis results as markdown for easy display in chat
 * Uses the standard emoji indicators and formatting from THINK_TOOLS_VISUAL_INDICATORS.md
 */
function formatStrategyAnalysisMarkdown(
  sequentialData: any, 
  thinkToolData: any, 
  query: string
): string {
  // Create markdown output with official emoji format
  let markdown = `🔮 THINK TOOLS ACTIVATED 🔮\n\n`;
  
  // Part 1: Sequential Thinking with emoji format
  markdown += `⚡ SEQUENTIAL THINKING ACTIVATED ⚡\n`;
  
  sequentialData.steps.forEach((step: any, index: number) => {
    markdown += `Step ${index + 1}: ${step.title}\n`;
    
    // Convert paragraph content into bullet points
    const contentPoints = step.content.split('. ')
      .filter((point: string) => point.trim().length > 0)
      .map((point: string) => point.trim().endsWith('.') ? point.trim() : point.trim() + '.');
    
    contentPoints.forEach((point: string) => {
      markdown += `• ${point}\n`;
    });
    
    markdown += '\n';
  });
  
  markdown += `⚡ SEQUENTIAL THINKING COMPLETE ⚡\n\n`;
  
  // Part 2: Think Tool Analysis with emoji format
  markdown += `🌲 THINK TOOL ACTIVATED 🌲\n`;
  
  // Deck Recommendations
  const recommendedDecks = thinkToolData.recommendedTools;
  recommendedDecks.forEach((deckName: string) => {
    const deckInfo = thinkToolData.analysis[deckName];
    markdown += `${deckName}\n`;
    
    // Strengths as bullet points
    deckInfo.strengths.forEach((strength: string) => {
      markdown += `• ${strength}\n`;
    });
    
    // Weaknesses as bullet points
    deckInfo.weaknesses.forEach((weakness: string) => {
      markdown += `• ${weakness}\n`;
    });
    
    // Key cards if available
    if (deckInfo.keyCards && deckInfo.keyCards.length > 0) {
      markdown += `• Key Cards: ${deckInfo.keyCards.join(", ")}\n`;
    }
    
    markdown += '\n';
  });
  
  // Implementation Plan
  const primaryDeck = recommendedDecks[0];
  
  markdown += `Implementation Plan\n`;
  markdown += `• Build a core ${primaryDeck} deck focusing on key cards\n`;
  markdown += `• Add tech cards to counter common matchups\n`;
  markdown += `• Practice against major archetypes to learn the deck\n`;
  markdown += `• Refine based on meta shifts and performance results\n\n`;
  
  markdown += `🌲 THINK TOOL COMPLETE 🌲\n\n`;
  
  // Add implementation details with checkmarks
  markdown += `Implementation Strategy:\n`;
  markdown += `✓ Analyzed the meta environment and identified counter strategies\n`;
  markdown += `✓ Determined optimal deck choices based on strengths and weaknesses\n`;
  markdown += `✓ Identified key cards and tech choices for the recommended deck\n`;
  markdown += `→ Would you like more details on how to play this deck against specific matchups?\n\n`;
  
  return markdown;
}