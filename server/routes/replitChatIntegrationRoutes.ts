/**
 * Replit Chat Integration Routes
 * 
 * This file defines the routes for integrating Think Tools with Replit Chat.
 * It allows users to trigger Think Tools analysis directly from the Replit Chat
 * interface using commands like "Use Think Tools [query]".
 */

import express from 'express';
import { processThinkToolsCommand } from '../mcp/thinkToolsReplitIntegration';

const router = express.Router();

// Process a Think Tools command from Replit Chat
router.post('/process-command', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'No command provided'
      });
    }
    
    const response = await processThinkToolsCommand(command);
    
    return res.json({
      success: true,
      response
    });
  } catch (error: any) {
    console.error('Error processing Think Tools command:', error);
    return res.status(500).json({
      success: false,
      error: `Error processing command: ${error.message}`
    });
  }
});

// Test endpoint for Replit Chat integration
router.post('/test', (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({
      success: false,
      error: 'No command provided'
    });
  }
  
  return res.json({
    success: true,
    message: `Received command: ${command}`,
    timestamp: new Date().toISOString()
  });
});

export default router;