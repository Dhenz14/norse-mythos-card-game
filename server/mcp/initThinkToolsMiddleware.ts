/**
 * initThinkToolsMiddleware.ts
 * 
 * This module initializes the Think Tools middleware system at application startup,
 * ensuring consistent template formatting across all Think Tools responses.
 */

import ThinkToolsTemplateMiddleware, { TemplateEnforcementLevel } from './ThinkToolsTemplateMiddleware';
import ThinkToolsResponseLogger, { LogLevel } from './ThinkToolsResponseLogger';
import EnhancedResponseFormatter from './EnhancedResponseFormatter';

/**
 * Initialize the Think Tools middleware system
 */
export function initThinkToolsMiddleware(): void {
  try {
    // Get instances of required components
    const middleware = ThinkToolsTemplateMiddleware.getInstance();
    const logger = ThinkToolsResponseLogger.getInstance();
    
    // Configure middleware with strict enforcement
    middleware.setOptions({
      enforcementLevel: TemplateEnforcementLevel.CORRECTION,
      logViolations: true,
      addMissingComponents: true
    });
    
    // Initialize formatter with middleware integration
    new EnhancedResponseFormatter();
    
    // Log successful initialization
    logger.log('Think Tools middleware system initialized successfully', LogLevel.SUCCESS);
    console.log('Think Tools middleware system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Think Tools middleware:', error);
  }
}

/**
 * Initialize the recovery mechanism for Think Tools formatting
 * This ensures that even if normal formatting fails, we have a fallback
 */
export function initThinkToolsRecoveryMechanism(): void {
  try {
    const logger = ThinkToolsResponseLogger.getInstance();
    
    // Setup global error handler for Think Tools response formatting
    process.on('uncaughtException', (error) => {
      if (error.message.includes('Think Tools') || error.stack?.includes('ThinkTools')) {
        logger.log(`Recovery mechanism caught Think Tools error: ${error.message}`, LogLevel.ERROR);
        console.error('Think Tools formatting error caught by recovery mechanism:', error.message);
        // Allow process to continue rather than crashing
      } else {
        // For non-Think Tools errors, re-throw to allow normal error handling
        throw error;
      }
    });
    
    logger.log('Think Tools recovery mechanism initialized', LogLevel.SUCCESS);
  } catch (error) {
    console.error('Failed to initialize Think Tools recovery mechanism:', error);
  }
}

/**
 * Get the cumulative compliance statistics for Think Tools responses
 */
export function getThinkToolsComplianceStats(): any {
  try {
    const logger = ThinkToolsResponseLogger.getInstance();
    return logger.getComplianceStats();
  } catch (error) {
    console.error('Failed to get Think Tools compliance stats:', error);
    return {
      error: 'Failed to get compliance statistics'
    };
  }
}

export default {
  initThinkToolsMiddleware,
  initThinkToolsRecoveryMechanism,
  getThinkToolsComplianceStats
};