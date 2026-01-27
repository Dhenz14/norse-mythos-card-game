/**
 * Initialize Think Tools Discovery Protocol
 * 
 * This module initializes the Think Tools Discovery Protocol at server startup.
 * It should be imported and called early in the server bootstrap process.
 */

import { getThinkToolsDiscoveryProtocol } from './ThinkToolsDiscoveryProtocol';
import ThinkToolsResponseLogger, { LogLevel } from './ThinkToolsResponseLogger';

// Get logger instance
const logger = ThinkToolsResponseLogger.getInstance();

/**
 * Initialize the Think Tools Discovery Protocol
 */
export async function initializeDiscoveryProtocol(): Promise<void> {
  try {
    logger.log('Initializing Think Tools Discovery Protocol...', LogLevel.INFO);
    
    // Get the singleton instance
    const protocol = getThinkToolsDiscoveryProtocol();
    
    // Run the discovery to preload resources
    const resources = await protocol.discoverResources();
    
    logger.log(`Think Tools Discovery Protocol initialized successfully with ${
      resources.configFiles.length
    } config files and ${
      resources.triggerPhrases.length
    } trigger phrases`, LogLevel.SUCCESS);
    
    console.log('Think Tools Discovery Protocol initialized successfully');
  } catch (error) {
    logger.log(`Failed to initialize Think Tools Discovery Protocol: ${error}`, LogLevel.ERROR);
    console.error('Failed to initialize Think Tools Discovery Protocol:', error);
  }
}

// Export for use in server bootstrap
export default initializeDiscoveryProtocol;