/**
 * Direct HTTP-based implementation of Smithery sequential thinking service
 * 
 * This implementation uses direct HTTP requests rather than the SDK 
 * to avoid module resolution issues.
 */

import fetch from 'node-fetch';

// Get the API key from environment variables
const API_KEY = process.env.SMITHERY_API_KEY;

// Connect to the real Smithery API endpoint
const MOCK_MODE = false;
// Use the MCP protocol server endpoint
const API_BASE_URL = 'https://server.smithery.ai';

// Status tracking
let connected = false;

/**
 * Initialize the connection to the Smithery API
 */
export async function initialize() {
  if (!API_KEY) {
    console.log('Smithery API key not found. Service disabled.');
    return;
  }

  // If in mock mode, skip the actual connection
  if (MOCK_MODE) {
    connected = true;
    console.log('Smithery Direct Service: Using mock mode (no actual API calls)');
    return;
  }

  try {
    // For MCP server, we'll assume it's available if we have an API key
    // We'll validate the connection when we actually make a call
    connected = true;
    console.log('Smithery Direct Service: Initialized with API key');
  } catch (error) {
    console.error('Smithery Direct Service: Failed to connect', error);
    connected = false;
  }
}

/**
 * Check if the service is connected
 */
export function isConnected() {
  return connected && !!API_KEY;
}

/**
 * List available tools
 */
export async function listTools() {
  if (!connected || !API_KEY) {
    console.error('Smithery Direct Service: Failed to list tools - Not connected');
    return [];
  }

  // If in mock mode, return mock tools
  if (MOCK_MODE) {
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

  try {
    // For the MCP server, we know it has sequential_thinking
    return [
      {
        name: 'sequential_thinking',
        description: 'Breaks down complex problems into step-by-step reasoning.'
      }
    ];
  } catch (error) {
    console.error('Smithery Direct Service: Failed to list tools', error);
    return [];
  }
}

/**
 * Generate mock reasoning text
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
 * Generate mock conclusion text
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

/**
 * Process a prompt with sequential thinking
 */
export async function sequentialThinking(
  prompt: string,
  options: {
    maxSteps?: number;
    temperature?: number;
    stream?: boolean;
  } = {}
) {
  if (!connected || !API_KEY) {
    throw new Error('Not connected to Smithery API');
  }

  // If in mock mode, return a mock response
  if (MOCK_MODE) {
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
        reasoning: generateMockReasoning(prompt, i)
      });
    }

    return {
      steps,
      conclusion: `Based on the analysis of "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}", we can conclude that ${generateMockConclusion(prompt)}`
    };
  }

  try {
    // MCP API: Call the sequential_thinking tool directly
    const response = await fetch(`${API_BASE_URL}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'sequential_thinking',
        params: {
          prompt,
          max_steps: options.maxSteps || 5,
          temperature: options.temperature || 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }

    const result = await response.json() as any;
    
    // Format the response to match our expected interface
    return {
      steps: result.steps || [],
      conclusion: result.conclusion || 'No conclusion provided.'
    };
  } catch (error) {
    console.error('Sequential thinking error:', error);
    throw error;
  }
}

// Export the service as an object
export const SmitheryMcpService = {
  initialize,
  isConnected,
  listTools,
  sequentialThinking
};