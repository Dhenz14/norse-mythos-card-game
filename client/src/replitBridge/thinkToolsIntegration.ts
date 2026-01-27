/**
 * Think Tools Replit Integration
 * 
 * This module provides integration between the Think Tools middleware
 * and the Replit UI, detecting when "Use Think Tools" is mentioned
 * and automatically applying the template formatting.
 */

import { ThinkToolsMiddleware } from './thinkToolsMiddleware';
import { ReasoningMode } from './reasoningModes';

/**
 * Initialize Think Tools Replit integration
 */
export function initThinkToolsReplitIntegration(): void {
  console.log('Think Tools Replit integration initialized');
  
  // Listen for DOM changes to intercept responses
  setupResponseInterception();
}

/**
 * Process content with Think Tools middleware
 */
export async function processWithThinkToolsMiddleware(content: string): Promise<string> {
  const middleware = new ThinkToolsMiddleware();
  // Added a small delay to simulate processing time and make the transition smoother
  await new Promise(resolve => setTimeout(resolve, 100));
  return middleware.processContent(content);
}

/**
 * Setup interception of responses
 */
function setupResponseInterception(): void {
  // This would be implemented based on the specific UI integration needs
  // For example, listening for new messages in the chat and formatting them
  
  console.log('Response interception setup complete');
}

/**
 * Check if a message contains a Think Tools command
 */
export function isThinkToolsCommand(message: string): boolean {
  return message.toLowerCase().includes('use think tools');
}

/**
 * Get the reasoning mode from a message
 */
export function getReasoningModeFromMessage(message: string): ReasoningMode | null {
  const lowerMessage = message.toLowerCase();
  
  // Check for explicit mode requests
  for (const mode of Object.values(ReasoningMode)) {
    const modeText = mode.toLowerCase().replace(/_/g, ' ');
    if (lowerMessage.includes(`use think tools: ${modeText}`)) {
      return mode;
    }
  }
  
  // If just "Use Think Tools" is mentioned without a specific mode,
  // return null to indicate the cascading processor should be used
  if (lowerMessage.includes('use think tools')) {
    return null;
  }
  
  // Not a Think Tools command
  return null;
}