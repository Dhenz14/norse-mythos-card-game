/**
 * Demo of the "Use Think Tools" trigger command
 * 
 * This script simulates a chat conversation where the user enters various messages,
 * including some that trigger the "Use Think Tools" command.
 * 
 * To run: node server/demo-trigger-command.js
 */

import triggerThinkTools from './triggerThinkTools.js';
import chalk from 'chalk';

// Simulate a chat conversation
async function simulateChat() {
  console.clear();
  console.log(chalk.bold.blue('=== Norse Card Game Strategy Assistant Demo ==='));
  console.log(chalk.gray('This demonstrates how the "Use Think Tools" trigger works.\n'));
  
  // Define some test messages
  const messages = [
    "Hello, I need help with my deck",
    "Use Think Tools how to counter Control Odin",
    "What are the best cards for an Aggro deck?",
    "Use Think Tools I want a deck with lots of small minions",
    "Thanks for the help!"
  ];
  
  // Process each message
  for (const message of messages) {
    // Display the user message
    console.log(chalk.green('User:'), message);
    
    // Check if this is a trigger command
    const result = await triggerThinkTools(message);
    
    if (result) {
      // This was a trigger command, display the result
      console.log(chalk.blue('\nAssistant (using Think Tools):\n'));
      
      // Show a condensed version for demo purposes
      const condensed = condenseLongResult(result);
      console.log(chalk.white(condensed));
    } else {
      // Not a trigger command, show a generic response
      console.log(chalk.blue('\nAssistant:\n'));
      console.log(chalk.white(getGenericResponse(message)));
    }
    
    console.log(chalk.gray('\n' + '-'.repeat(70) + '\n'));
    
    // Small delay between messages for readability
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(chalk.bold.blue('=== Demo Complete ==='));
  console.log(chalk.gray('The "Use Think Tools" trigger successfully detected and processed commands.'));
}

// Helper function to condense long results for demo purposes
function condenseLongResult(result) {
  const lines = result.split('\n');
  let condensed = '';
  
  // Get the title
  const title = lines[0];
  condensed += title + '\n\n';
  
  // Get the sections
  const sections = lines.filter(line => line.startsWith('##'));
  condensed += sections.join('\n') + '\n\n';
  
  // Add a note about the full content
  condensed += '[Full analysis available in actual usage]\n';
  
  return condensed;
}

// Generate a generic response for non-trigger messages
function getGenericResponse(message) {
  const responses = [
    "I understand you're looking for help with your Norse card game strategy. If you'd like detailed analysis, try using the phrase 'Use Think Tools' followed by your question.",
    "I can provide general advice, but for in-depth strategy analysis using sequential thinking and deck recommendations, try saying 'Use Think Tools' followed by your specific question.",
    "That's interesting! If you want me to perform a full strategy analysis, just say 'Use Think Tools' followed by your question.",
    "Thanks for your message. Remember, you can get comprehensive strategic analysis by saying 'Use Think Tools' and then your question."
  ];
  
  // Select a random response
  return responses[Math.floor(Math.random() * responses.length)];
}

// Run the demo
simulateChat().catch(console.error);