/**
 * Sequential Thinking Helper
 * 
 * This utility provides functions to directly call the Sequential Thinking API
 * from anywhere in the application, including the AI assistant.
 */

/**
 * Process a prompt with Sequential Thinking and return a formatted result
 * 
 * @param prompt The question or prompt to process
 * @param options Optional parameters like maxSteps and temperature
 * @returns A formatted string with the sequential thinking process
 */
export async function processWithSequentialThinking(
  prompt: string,
  options: {
    maxSteps?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  try {
    // Call the API
    const response = await fetch('/api/smithery/sequential-thinking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        maxSteps: options.maxSteps || 5,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to process with sequential thinking');
    }

    const result = await response.json();
    
    // Format the result
    return formatSequentialThinkingResult(result, prompt);
  } catch (error: any) {
    return `Error processing with Sequential Thinking: ${error.message}`;
  }
}

/**
 * Format the Sequential Thinking result as a readable string
 */
function formatSequentialThinkingResult(result: any, originalPrompt: string): string {
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
 * Direct interface for the AI to process a query with Sequential Thinking
 */
export async function aiSequentialThinking(prompt: string): Promise<string> {
  return processWithSequentialThinking(prompt);
}