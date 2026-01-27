/**
 * Think Tools Replit Integration Module
 * 
 * This module provides integration between the Think Tools Discovery Protocol
 * and the Replit chat interface. It processes commands sent from Replit chat
 * and returns appropriate responses.
 */

import express, { Router, Request, Response } from 'express';
import { ThinkToolsDiscoveryProtocol } from './ThinkToolsDiscoveryProtocol';
import { formatEnhancedThinkToolsResponse } from './responseFormatter';

// Create a router instance
const router = Router();

// Store instance of the protocol
let discoveryProtocol: ThinkToolsDiscoveryProtocol | null = null;

/**
 * Initialize the Think Tools Discovery Protocol
 */
export function initializeThinkToolsDiscoveryProtocol() {
  if (!discoveryProtocol) {
    discoveryProtocol = new ThinkToolsDiscoveryProtocol();
    console.log('Think Tools Discovery Protocol initialized');
  }
  return discoveryProtocol;
}

/**
 * Process a Think Tools command
 * 
 * @param command The command to process
 * @returns The processed response
 */
export async function processThinkToolsCommand(command: string): Promise<string> {
  // Initialize the protocol if needed
  if (!discoveryProtocol) {
    initializeThinkToolsDiscoveryProtocol();
  }
  
  if (!discoveryProtocol) {
    return 'Error: Failed to initialize Think Tools Discovery Protocol';
  }
  
  // Check if this is a Think Tools command
  if (command.toLowerCase().includes('use think tools')) {
    try {
      // Get the formatted response
      const analysis = await discoveryProtocol.analyze(command);
      return formatEnhancedThinkToolsResponse(analysis);
    } catch (error: any) {
      console.error('Error processing Think Tools command:', error);
      return `Error: ${error.message || 'Unknown error processing Think Tools command'}`;
    }
  }
  
  // Not a Think Tools command
  return '';
}

// API endpoint to process Think Tools commands
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    const response = await processThinkToolsCommand(command);
    
    if (!response) {
      return res.status(404).json({ 
        error: 'Not a Think Tools command',
        details: 'This command is not supported by the Think Tools Discovery Protocol'
      });
    }
    
    res.json({ response });
  } catch (error: any) {
    console.error('Error in Think Tools Discovery API:', error);
    res.status(500).json({ 
      error: 'Think Tools Discovery Protocol error',
      details: error.message || 'Unknown error'
    });
  }
});

// API endpoint to get the discovery protocol status
router.get('/status', (req: Request, res: Response) => {
  const isInitialized = !!discoveryProtocol;
  
  res.json({
    status: isInitialized ? 'initialized' : 'not_initialized',
    version: '1.0.0'
  });
});

/**
 * Get the Think Tools Replit Integration router
 * 
 * @returns Express router instance
 */
export function getThinkToolsReplitIntegrationRouter(): Router {
  return router;
}

export default {
  initializeThinkToolsDiscoveryProtocol,
  processThinkToolsCommand,
  getThinkToolsReplitIntegrationRouter
};