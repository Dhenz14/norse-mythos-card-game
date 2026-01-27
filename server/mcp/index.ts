// File: server/mcp/index.ts
import { Router } from "express";
import { sequentialThinking } from "./sequentialThinking";
import { thinkTool } from "./thinkTool";
import { codeMCP } from "./code";
import { mermaidMCP } from "./mermaid";
import { devMagic } from "./devMagic";
import { assistantAnalyze, assistantRecommend, assistantCombined } from "./mcpAssistantIntegration";
import { combinedStrategy } from "./combinedStrategy";
import { handleTriggerCommand } from "./triggerCommand";
import { processEnhancedThinkToolsQuery } from "./ThinkToolsIntegration";
import { 
  ThinkToolsDiscoveryProtocol
} from "./ThinkToolsDiscoveryProtocol";
import { 
  processThinkToolsCommand
} from "./thinkToolsReplitIntegration";
import { initializeThinkToolsDiscovery } from "./ReplitChatThinkToolsIntegration";

// Create router
const mcpRouter = Router();

// Register routes
mcpRouter.post("/sequential-thinking", sequentialThinking);
mcpRouter.post("/think-tool", thinkTool);
mcpRouter.post("/code", codeMCP);
mcpRouter.post("/mermaid", mermaidMCP);
mcpRouter.post("/dev-magic", devMagic);
mcpRouter.post("/combined-strategy", combinedStrategy);

// Register AI Assistant integration routes
mcpRouter.post("/assistant/analyze", assistantAnalyze);
mcpRouter.post("/assistant/recommend", assistantRecommend);
mcpRouter.post("/assistant/combined", assistantCombined);

// Register trigger command handler
mcpRouter.post("/trigger-command", handleTriggerCommand);

// Think Tools Discovery Protocol endpoints
mcpRouter.post("/check-think-tools-command", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Missing message parameter' });
    }
    
    // Check if this is a Think Tools command using regex pattern
    const isCommand = /^use\s+think\s+tools/i.test(message.trim());
    
    res.status(200).json({
      isCommand
    });
  } catch (error: any) {
    console.error('Error checking Think Tools command:', error);
    res.status(500).json({ error: 'Failed to check Think Tools command' });
  }
});

mcpRouter.post("/process-think-tools-command", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Missing message parameter' });
    }
    
    // Process the command using the Think Tools Replit Integration
    const response = await processThinkToolsCommand(message);
    
    res.status(200).json({ response });
  } catch (error: any) {
    console.error('Error processing Think Tools command:', error);
    res.status(500).json({ error: 'Failed to process Think Tools command' });
  }
});

mcpRouter.post("/init-think-tools-discovery", async (req, res) => {
  try {
    await initializeThinkToolsDiscovery();
    res.status(200).json({ initialized: true });
  } catch (error: any) {
    console.error('Error initializing Think Tools Discovery:', error);
    res.status(500).json({ error: 'Failed to initialize Think Tools Discovery' });
  }
});

// Enhanced Think Tools endpoint
mcpRouter.post("/enhanced-think-tools", async (req, res) => {
  try {
    const { query, codebaseContext, allowToolExecution, previousResults } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required'
      });
    }
    
    const result = await processEnhancedThinkToolsQuery(query, {
      codebaseContext: codebaseContext !== false, // Default to true
      allowToolExecution: allowToolExecution === true, // Default to false
      previousResults
    });
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Enhanced Think Tools error:', error);
    res.status(500).json({
      error: 'Enhanced Think Tools analysis failed',
      details: error.message || 'Unknown error'
    });
  }
});

// Add route for direct processing of "Use Think Tools" commands for Replit Chat integration
mcpRouter.post("/replit-chat/process", async (req, res) => {
  try {
    const { command, query } = req.body;
    
    if (!command && !query) {
      return res.status(400).json({
        success: false,
        error: 'Either command or query parameter is required'
      });
    }
    
    // If command is provided, extract the query from it
    let processedQuery = query;
    if (command && !query) {
      const { isThinkToolsCommand, extractQueryFromCommand } = await import('./replitChatIntegration');
      
      if (!isThinkToolsCommand(command)) {
        return res.status(400).json({
          success: false,
          error: 'Not a valid Think Tools command'
        });
      }
      
      processedQuery = extractQueryFromCommand(command);
      
      if (!processedQuery) {
        return res.status(400).json({
          success: false,
          error: 'No query found in command. Please provide a question after "Use Think Tools"'
        });
      }
    }
    
    // Process the query using the enhanced Think Tools with search capability
    const { processGeneralQuestion } = await import('./replitChatIntegration');
    const result = await processGeneralQuestion(processedQuery);
    
    return res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error processing Replit Chat command:', error);
    return res.status(500).json({
      success: false,
      error: `Error processing command: ${error.message}`
    });
  }
});

// Export the router
export default mcpRouter;

// Re-export functions for direct use in Replit chat
export { 
  analyzeNorseCardStrategy, 
  getQuickDeckRecommendation,
  processGeneralQuestion,
  isThinkToolsCommand,
  extractQueryFromCommand
} from './replitChatIntegration';