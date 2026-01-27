/**
 * Think Tools Discovery Protocol API Endpoints
 * 
 * This module provides Express endpoints for the Think Tools Discovery Protocol,
 * allowing the client-side integration to communicate with the server-side protocol.
 */

import { Router } from 'express';
import { 
  getThinkToolsDiscoveryProtocol, 
  isThinkToolsCommand, 
  processThinkToolsQuery 
} from '../mcp/ThinkToolsDiscoveryProtocol';
import { initializeThinkToolsDiscovery } from '../mcp/ReplitChatThinkToolsIntegration';
import ThinkToolsResponseLogger, { LogLevel } from '../mcp/ThinkToolsResponseLogger';

// Initialize logger
const logger = ThinkToolsResponseLogger.getInstance();

// Create router
const router = Router();

/**
 * Initialize Think Tools Discovery
 * POST /api/mcp/init-think-tools-discovery
 */
router.post('/init-think-tools-discovery', async (req, res) => {
  try {
    await initializeThinkToolsDiscovery();
    res.status(200).json({ initialized: true });
  } catch (error) {
    logger.log(`Error initializing Think Tools Discovery: ${error}`, LogLevel.ERROR);
    res.status(500).json({ error: 'Failed to initialize Think Tools Discovery' });
  }
});

/**
 * Check if a message is a Think Tools command
 * POST /api/mcp/check-think-tools-command
 */
router.post('/check-think-tools-command', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Missing message parameter' });
    }
    
    const isCommand = isThinkToolsCommand(message);
    
    // If it's a command, also get the discovered resources for context
    let resources = null;
    if (isCommand) {
      const protocol = getThinkToolsDiscoveryProtocol();
      resources = await protocol.discoverResources();
      logger.log(`Identified Think Tools command: "${message}"`, LogLevel.INFO);
    }
    
    res.status(200).json({
      isCommand,
      resources
    });
  } catch (error) {
    logger.log(`Error checking Think Tools command: ${error}`, LogLevel.ERROR);
    res.status(500).json({ error: 'Failed to check Think Tools command' });
  }
});

/**
 * Process a Think Tools command
 * POST /api/mcp/process-think-tools-command
 */
router.post('/process-think-tools-command', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Missing message parameter' });
    }
    
    // Verify it's a Think Tools command
    if (!isThinkToolsCommand(message)) {
      return res.status(400).json({ error: 'Not a Think Tools command' });
    }
    
    logger.log(`Processing Think Tools command: "${message}"`, LogLevel.INFO);
    
    // Process the query
    const response = await processThinkToolsQuery(message);
    
    logger.log('Think Tools response generated successfully', LogLevel.SUCCESS);
    
    res.status(200).json({ response });
  } catch (error) {
    logger.log(`Error processing Think Tools command: ${error}`, LogLevel.ERROR);
    res.status(500).json({ error: 'Failed to process Think Tools command' });
  }
});

export default router;