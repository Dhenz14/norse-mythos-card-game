/**
 * Norse Card Game "Use Think Tools" Trigger Command
 * 
 * This function detects when a user inputs "Use Think Tools" followed by a
 * strategy question, and runs the combined sequential thinking and think tool workflow.
 * 
 * Usage in Replit AI chat:
 * ```
 * // When user says "Use Think Tools how to counter Control Odin"
 * await triggerThinkTools(userMessage);
 * ```
 */

import fetch from 'node-fetch';

async function triggerThinkTools(userMessage) {
  
  try {
    // Check if the message starts with the trigger phrase
    if (!userMessage || typeof userMessage !== 'string') {
      return null;
    }
    
    const triggerPhrase = 'use think tools';
    
    if (!userMessage.toLowerCase().startsWith(triggerPhrase)) {
      return null; // Not a trigger command
    }
    
    // Extract the query (everything after "Use Think Tools")
    const query = userMessage.substring(triggerPhrase.length).trim();
    
    if (!query) {
      return "Please provide a strategy question after 'Use Think Tools'. For example: Use Think Tools how to build an aggressive Thor deck";
    }
    
    console.log(`Detected Think Tools trigger with query: "${query}"`);
    
    // Call the trigger-command endpoint
    const response = await fetch('http://localhost:5000/api/mcp/trigger-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'Use Think Tools',
        query: query
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.triggered) {
      return null; // Not triggered
    }
    
    if (data.error) {
      return `Error: ${data.error}`;
    }
    
    return data.result;
  } catch (error) {
    console.error('Error triggering Think Tools:', error);
    return `Error: Could not process "Use Think Tools" command: ${error.message}`;
  }
}

// Example usage:
/*
// Direct from message
const userMessage = "Use Think Tools how to counter aggressive Thor decks";
const result = await triggerThinkTools(userMessage);
if (result) {
  console.log(result);
}

// From chat monitoring
function processUserMessage(message) {
  const result = await triggerThinkTools(message);
  if (result) {
    // This was a Think Tools command, display the result
    displayResult(result);
    return true;
  }
  // Not a Think Tools command, continue normal processing
  return false;
}
*/

export default triggerThinkTools;