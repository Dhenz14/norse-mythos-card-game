/**
 * Agent Middleware Integration
 * 
 * This module serves as an integration point for the Replit AI Agent,
 * automatically intercepting and processing messages that reference
 * Think Tools to apply proper formatting.
 */

import { isThinkToolsCommand, processWithThinkToolsMiddleware } from './thinkToolsIntegration';

// Interface for the agent message structure
interface AgentMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  metadata?: any;
}

/**
 * Process an agent message through the Think Tools middleware
 */
export async function processAgentMessage(message: AgentMessage): Promise<AgentMessage> {
  // Only process assistant messages
  if (message.role !== 'assistant') {
    return message;
  }
  
  // Check if message contains Think Tools trigger phrases
  if (isThinkToolsCommand(message.content)) {
    console.log(`Processing agent message (ID: ${message.id}) with Think Tools middleware`);
    
    try {
      // Apply middleware formatting
      const formattedContent = await processWithThinkToolsMiddleware(message.content);
      
      // Return a new message with formatted content
      return {
        ...message,
        content: formattedContent,
        metadata: {
          ...message.metadata,
          thinkToolsFormatted: true,
          formattingTimestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Error processing agent message:', error);
      return message;
    }
  }
  
  return message;
}

/**
 * Initialize the agent middleware
 */
export function initAgentMiddleware(): void {
  console.log('Initializing Agent middleware for Think Tools integration');
  
  // Wait for the document to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMessageInterceptor);
  } else {
    setupMessageInterceptor();
  }
}

/**
 * Set up message interception for agent responses
 */
function setupMessageInterceptor(): void {
  console.log('Setting up agent message interception');
  
  // Override the fetch API to intercept agent responses
  const originalFetch = window.fetch;
  // Use type assertion to handle URL compatibility
  window.fetch = async function(input: string | URL | Request, init?: RequestInit) {
    // Call the original fetch
    const response = await originalFetch(input, init);
    
    // Clone the response so we can read it multiple times
    const responseClone = response.clone();
    
    try {
      // Check if this is an agent API response
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof Request) {
        url = input.url;
      } else if (input instanceof URL) {
        url = input.toString();
      }
      if (url && (url.includes('/agent/') || url.includes('/api/chat'))) {
        // Process the response to apply Think Tools formatting
        const responseData = await responseClone.json();
        
        // Check if the response contains messages
        if (responseData && responseData.messages) {
          // Process each message
          for (let i = 0; i < responseData.messages.length; i++) {
            if (isThinkToolsCommand(responseData.messages[i].content)) {
              // Apply Think Tools middleware formatting
              const formattedMessage = await processAgentMessage(responseData.messages[i]);
              responseData.messages[i] = formattedMessage;
            }
          }
          
          // Create a new response with the processed data
          const modifiedResponse = new Response(JSON.stringify(responseData), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
          
          return modifiedResponse;
        }
      }
    } catch (error) {
      console.error('Error in agent message interception:', error);
    }
    
    // Return the original response if we couldn't process it
    return response;
  };
  
  console.log('Agent message interception set up successfully');
}

// Auto-initialize
initAgentMiddleware();

export default {
  processAgentMessage,
  initAgentMiddleware
};