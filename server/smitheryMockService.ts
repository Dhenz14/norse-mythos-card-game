/**
 * Smithery Mock Service
 * 
 * This service provides a mock implementation of Smithery MCP service
 * for development and testing purposes when the actual MCP service is unavailable.
 */

// Mock status - can be changed for testing
let connected = true;

/**
 * Initialize the mock connection
 */
export async function initialize() {
  console.log('Smithery Mock Service initialized');
  connected = true;
  return true;
}

/**
 * Check if the mock service is connected
 */
export function isConnected() {
  return connected;
}

/**
 * List available mock tools
 */
export async function listTools() {
  if (!connected) {
    console.error('SmitheryMockService: Failed to list tools - Not connected');
    return [];
  }

  return [
    {
      name: 'sequential_thinking',
      description: 'Breaks down complex problems into step-by-step reasoning.'
    },
    {
      name: 'card_analysis',
      description: 'Analyzes card properties and potential game strategies.'
    },
    {
      name: 'deck_optimization',
      description: 'Suggests improvements for deck composition and synergy.'
    }
  ];
}

/**
 * Mock sequential thinking process
 */
export async function sequentialThinking(
  prompt: string,
  options: {
    maxSteps?: number;
    temperature?: number;
    stream?: boolean;
  } = {}
) {
  if (!connected) {
    throw new Error('Not connected to Smithery Mock server');
  }

  // Add a small delay to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate a mock response based on the prompt
  const maxSteps = options.maxSteps || 5;
  const steps = [];
  
  // Create mock steps - between 2 and maxSteps
  const numSteps = Math.min(Math.max(2, Math.floor(prompt.length / 20)), maxSteps);
  
  for (let i = 0; i < numSteps; i++) {
    steps.push({
      thought: `Step ${i + 1} analysis of "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"`,
      reasoning: `For step ${i + 1}, we need to consider the following aspects: ${generateMockReasoning(prompt, i)}`
    });
  }

  return {
    steps,
    conclusion: `Based on the analysis of "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}", we can conclude that ${generateMockConclusion(prompt)}`
  };
}

/**
 * Helper function to generate mock reasoning text
 */
function generateMockReasoning(prompt: string, stepIndex: number): string {
  const reasoning = [
    "First, we need to understand the core elements of the problem.",
    "We should analyze the game mechanics that apply in this scenario.",
    "Looking at the card synergies and possible interactions is essential.",
    "Now we need to consider the statistical probability of drawing specific cards.",
    "Finally, we should evaluate the strategic implications on future turns."
  ];
  
  return reasoning[stepIndex % reasoning.length] + ` This relates to "${prompt.substring(0, 15)}${prompt.length > 15 ? '...' : ''}" because it's a key factor in Norse mythology-themed card games.`;
}

/**
 * Helper function to generate mock conclusion text
 */
function generateMockConclusion(prompt: string): string {
  const conclusions = [
    "this strategy has both strengths and weaknesses that should be considered based on your opponent's deck.",
    "the optimal approach depends on analyzing the specific game context and available cards.",
    "success requires balancing aggressive plays with defensive positioning.",
    "understanding the synergies between Norse mythology-themed cards is crucial for maximizing effectiveness."
  ];
  
  const randomIndex = Math.floor(Math.random() * conclusions.length);
  return conclusions[randomIndex];
}

// Export the service as an object
export const SmitheryMcpService = {
  initialize,
  isConnected,
  listTools,
  sequentialThinking
};