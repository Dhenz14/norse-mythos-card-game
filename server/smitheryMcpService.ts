/**
 * Smithery MCP Service
 * 
 * This service manages the connection to the Smithery MCP (Model Context Protocol)
 * server for Sequential Thinking capabilities
 */

import WebSocket from 'ws';

// For Node.js environment, we need to provide WebSocket
// @ts-ignore - Using global WebSocket assignment for MCP Client compatibility
global.WebSocket = WebSocket;

// Get the API key from environment variables
const API_KEY = process.env.SMITHERY_API_KEY;

// Static variables
let client: any = null;
let connected: boolean = false;

// Function to dynamically import MCP SDK with proper ESM handling
async function getMcpClient() {
  try {
    // Import using dynamic import() for ESM compatibility
    const sdk = await import('@modelcontextprotocol/sdk');
    
    // If the SDK exports a default, use that, otherwise use the direct export
    if (sdk.default && sdk.default.Client) {
      return sdk.default.Client;
    } else if (sdk.Client) {
      return sdk.Client;
    } else {
      console.error('MCP SDK imported but Client class not found');
      return null;
    }
  } catch (error) {
    console.error('Failed to import MCP SDK:', error);
    return null;
  }
}

/**
 * Initialize the connection to the Smithery MCP server
 */
export async function initialize() {
  if (!API_KEY) {
    console.log('Smithery API key not found. Service disabled.');
    return;
  }

  try {
    const Client = await getMcpClient(); // Need to await the async function
    if (!Client) {
      throw new Error('Failed to load MCP Client class');
    }

    client = new Client({
      baseURL: 'wss://server.smithery.ai',
      apiKey: API_KEY,
    });

    await client.connect();
    connected = true;
    console.log('SmitheryMcpService: Connected successfully');
  } catch (error) {
    console.error('SmitheryMcpService: Failed to connect', error);
    connected = false;
    client = null;
  }
}

/**
 * Check if the service is connected
 */
export function isConnected() {
  return connected;
}

/**
 * List available tools
 */
export async function listTools() {
  if (!client || !connected) {
    console.error('SmitheryMcpService: Failed to list tools - Not connected');
    return [];
  }

  try {
    const tools = await client.listTools();
    return tools || [];
  } catch (error) {
    console.error('SmitheryMcpService: Failed to list tools', error);
    return [];
  }
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
  if (!client || !connected) {
    throw new Error('Not connected to Smithery MCP server');
  }

  try {
    // Call the sequential_thinking tool through the MCP protocol
    const result = await client.call(
      'sequential_thinking',
      {
        prompt,
        max_steps: options.maxSteps || 5,
        temperature: options.temperature || 0.7,
      }
    );

    return result;
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