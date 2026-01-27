/**
 * Command-line interface for Sequential Thinking
 * 
 * This script allows the AI assistant to use Sequential Thinking
 * directly from the chat interface by processing prompts through
 * the command line.
 */

import fetch from 'node-fetch';

/**
 * Process a prompt with Sequential Thinking
 */
async function processSequentialThinking(prompt: string): Promise<string> {
  try {
    // Call our mock service directly since this is running on the server
    const { SmitheryMcpService } = await import('./smitheryMockService');
    
    const result = await SmitheryMcpService.sequentialThinking(prompt, {
      maxSteps: 5,
      temperature: 0.7
    });
    
    return formatResult(result, prompt);
  } catch (error: any) {
    return `Error processing with Sequential Thinking: ${error.message}`;
  }
}

/**
 * Format the result into a readable markdown string
 */
function formatResult(result: any, originalPrompt: string): string {
  let formatted = `# Sequential Thinking: "${originalPrompt}"\n\n`;

  if (result.steps && Array.isArray(result.steps)) {
    result.steps.forEach((step: any, index: number) => {
      formatted += `## Step ${index + 1}\n`;
      formatted += `**Thought:** ${step.thought || 'N/A'}\n\n`;
      formatted += `**Reasoning:** ${step.reasoning || 'N/A'}\n\n`;
    });
  } else {
    formatted += "*No steps were provided in the result.*\n\n";
  }

  if (result.conclusion) {
    formatted += `## Conclusion\n${result.conclusion}\n`;
  } else {
    formatted += "*No conclusion was provided in the result.*\n";
  }

  return formatted;
}

/**
 * Main function to process arguments and execute
 */
async function main() {
  // Get the prompt from command line arguments
  const args = process.argv.slice(2);
  const prompt = args.join(' ');
  
  if (!prompt) {
    console.error('Error: No prompt provided. Usage: node sequentialThinkingCli.js "Your prompt here"');
    process.exit(1);
  }
  
  // Process the prompt and print the result
  const result = await processSequentialThinking(prompt);
  console.log(result);
}

// Only run as a script
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

// Export for use in other scripts
export { processSequentialThinking };