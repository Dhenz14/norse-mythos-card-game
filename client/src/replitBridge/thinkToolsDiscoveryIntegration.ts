/**
 * Think Tools Discovery Protocol Integration for Replit Chat
 * 
 * This module provides integration between the Think Tools Discovery Protocol
 * and the Replit chat interface. It intercepts chat messages and processes
 * Think Tools commands.
 */

import axios from 'axios';

/**
 * Check if a message is a Think Tools command
 * 
 * @param message The message to check
 * @returns True if the message is a Think Tools command
 */
export function isThinkToolsCommand(message: string): boolean {
  return /^use\s+think\s+tools/i.test(message.trim());
}

/**
 * Process a Think Tools command
 * 
 * @param command The command to process
 * @returns The processed response
 */
export async function processThinkToolsCommand(command: string): Promise<string> {
  try {
    // Send request to API
    const response = await axios.post('/api/thinktools/process', { command });
    
    // Return the formatted response
    return response.data.response || 'No response from Think Tools Discovery Protocol';
  } catch (error: any) {
    console.error('Error processing Think Tools command:', error);
    
    // Create a user-friendly error message
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    return `Error processing Think Tools command: ${errorMessage}`;
  }
}

/**
 * Intercept and process Replit chat messages
 * 
 * @param chatMessageHandler The original chat message handler
 * @returns A new handler that processes Think Tools commands
 */
export function interceptChatMessages(
  chatMessageHandler: (message: string) => Promise<void>
): (message: string) => Promise<void> {
  return async (message: string) => {
    // Check if this is a Think Tools command
    if (isThinkToolsCommand(message)) {
      try {
        // Process the command
        const response = await processThinkToolsCommand(message);
        
        // Send the response to the chat
        await chatMessageHandler(response);
      } catch (error) {
        console.error('Error intercepting chat message:', error);
        await chatMessageHandler('Error processing Think Tools command. Please try again.');
      }
    } else {
      // Not a Think Tools command, pass through to original handler
      await chatMessageHandler(message);
    }
  };
}

export default {
  isThinkToolsCommand,
  processThinkToolsCommand,
  interceptChatMessages
};