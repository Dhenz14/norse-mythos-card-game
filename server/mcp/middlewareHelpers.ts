/**
 * Middleware Helper Functions
 * 
 * This module provides utility functions to work with the Think Tools middleware
 * outside of the core middleware components.
 */

import ThinkToolsTemplateMiddleware from './ThinkToolsTemplateMiddleware';

/**
 * Process a string through the middleware to apply Think Tools formatting
 */
export async function processWithMiddleware(
  text: string, 
  options: { 
    skipFormatting?: boolean, 
    templateEnforcement?: boolean,
    debug?: boolean
  } = {}
): Promise<string> {
  const { skipFormatting = false, debug = false } = options;
  
  // If skipping formatting, return as is
  if (skipFormatting) {
    return text;
  }
  
  try {
    // Get middleware instance
    const middleware = ThinkToolsTemplateMiddleware.getInstance();
    
    // Apply the middleware as if this was a Think Tools command
    const processedText = middleware.applyMiddleware(text, true);
    
    if (debug) {
      console.log('Think Tools middleware processing completed');
    }
    
    return processedText;
  } catch (error) {
    console.error('Error in middleware processing:', error);
    // Return original if processing fails
    return text;
  }
}

/**
 * Check if a text string contains Think Tools trigger phrases
 */
export function isThinkToolsCommand(text: string): boolean {
  const lowerText = text.toLowerCase();
  const triggers = [
    'think tools',
    'sequential thinking',
    'step-by-step analysis',
    'use think tools',
    'apply think tools'
  ];
  
  return triggers.some(trigger => lowerText.includes(trigger));
}

export default {
  processWithMiddleware,
  isThinkToolsCommand
};