/**
 * Replit Chat Think Tools Integration
 * 
 * This module integrates the Think Tools Discovery Protocol with Replit Chat,
 * ensuring that any "Use Think Tools" command is processed using the correct
 * infrastructure with proper formatting.
 */

import { ThinkToolsDiscoveryProtocol } from './ThinkToolsDiscoveryProtocol';
import { initializeThinkToolsDiscoveryProtocol, processThinkToolsCommand } from './thinkToolsReplitIntegration';
import ThinkToolsResponseLogger, { LogLevel } from './ThinkToolsResponseLogger';

// Initialize logger
const logger = ThinkToolsResponseLogger.getInstance();

/**
 * Intercept and process Think Tools commands from Replit Chat
 * 
 * This function should be integrated with the Replit Chat message processing pipeline
 * to intercept Think Tools commands before they're processed by the standard system.
 */
export async function interceptThinkToolsCommand(message: string): Promise<{ 
  isThinkToolsCommand: boolean; 
  response?: string;
}> {
  // Check if this is a Think Tools command using regex pattern
  const isCommand = /^use\s+think\s+tools/i.test(message.trim());
  
  // Early return if not a Think Tools command
  if (!isCommand) {
    return { isThinkToolsCommand: false };
  }
  
  try {
    logger.log(`Intercepted Think Tools command: "${message}"`, LogLevel.INFO);
    
    // Process the command using our integration
    const response = await processThinkToolsCommand(message);
    
    logger.log('Think Tools response generated successfully', LogLevel.SUCCESS);
    
    // Return the formatted response
    return {
      isThinkToolsCommand: true,
      response
    };
  } catch (error) {
    logger.log(`Error processing Think Tools command: ${error}`, LogLevel.ERROR);
    
    // Return error state so regular processing can take over
    return { isThinkToolsCommand: false };
  }
}

/**
 * Initialize the Think Tools Discovery Protocol
 * 
 * This should be called during server startup to ensure the protocol
 * is ready to handle requests immediately.
 */
export async function initializeThinkToolsDiscovery(): Promise<void> {
  try {
    // Initialize the protocol
    const protocol = initializeThinkToolsDiscoveryProtocol();
    
    logger.log('Think Tools Discovery Protocol initialized successfully', LogLevel.SUCCESS);
  } catch (error) {
    logger.log(`Failed to initialize Think Tools Discovery Protocol: ${error}`, LogLevel.ERROR);
  }
}

export default {
  interceptThinkToolsCommand,
  initializeThinkToolsDiscovery
};