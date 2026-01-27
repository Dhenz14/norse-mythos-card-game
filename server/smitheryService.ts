import fetch from 'node-fetch';

/**
 * Service for interacting with the Smithery AI sequential thinking API
 */
export class SmitheryService {
  private static apiKey: string | undefined = process.env.SMITHERY_API_KEY;
  private static baseUrl: string = 'https://smithery.ai/server/api';

  /**
   * Checks if the Smithery service is properly configured
   */
  static isConfigured(): boolean {
    return !!SmitheryService.apiKey;
  }
  
  /**
   * Makes an authenticated request to the Smithery AI API
   */
  static async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!SmitheryService.isConfigured()) {
      throw new Error('Smithery AI service is not configured. API key is missing.');
    }

    const url = `${SmitheryService.baseUrl}${endpoint}`;
    
    const headers = {
      'Authorization': `Bearer ${SmitheryService.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Smithery AI API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Smithery AI API request failed:', error);
      throw error;
    }
  }

  /**
   * Queries the sequential thinking server
   * @param prompt The prompt to process
   * @param options Additional options for the request
   */
  static async querySequentialThinking(prompt: string, options: {
    maxSteps?: number;
    temperature?: number;
    stream?: boolean;
  } = {}): Promise<any> {
    const { maxSteps = 5, temperature = 0.7, stream = false } = options;
    
    return await SmitheryService.makeRequest('/sequential-thinking', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        max_steps: maxSteps,
        temperature,
        stream
      })
    });
  }

  /**
   * Gets the status of the Smithery AI service
   */
  static async getStatus(): Promise<any> {
    try {
      return await SmitheryService.makeRequest('/status');
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }
}