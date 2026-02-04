/**
 * Utility functions for interacting with the Smithery Sequential Thinking API
 */

/**
 * Interface for sequential thinking results
 */
export interface SequentialThinkingResult {
  steps: Array<{
    thought: string;
    reasoning: string;
  }>;
  conclusion: string;
}

/**
 * Interface for Smithery service status
 */
export interface SmitheryStatus {
  status: 'connected' | 'disconnected';
  apiConfigured: boolean;
  mockFallbackEnabled?: boolean;
  mockFallbackActive?: boolean;
  advancedMockEnabled?: boolean;
  usingAdvancedMock?: boolean;
}

/**
 * Interface for Smithery tools
 */
export interface SmitheryTool {
  name: string;
  description: string;
}

/**
 * Check if the Smithery service is available
 */
export async function checkSmitheryStatus(): Promise<SmitheryStatus> {
  try {
    const response = await fetch('/api/smithery/status');
    if (!response.ok) {
      throw new Error('Failed to fetch Smithery status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking Smithery status:', error);
    return {
      status: 'disconnected',
      apiConfigured: false
    };
  }
}

/**
 * Get available Smithery tools
 */
export async function getSmitheryTools(): Promise<SmitheryTool[]> {
  try {
    const response = await fetch('/api/smithery/tools');
    if (!response.ok) {
      throw new Error('Failed to fetch Smithery tools');
    }
    const data = await response.json();
    return data.tools || [];
  } catch (error) {
    console.error('Error fetching Smithery tools:', error);
    return [];
  }
}

/**
 * Process a prompt with sequential thinking
 */
export async function processWithSequentialThinking(
  prompt: string,
  options: {
    maxSteps?: number;
    temperature?: number;
  } = {}
): Promise<SequentialThinkingResult> {
  try {
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
      throw new Error(errorData.details || 'Failed to process sequential thinking');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Sequential thinking error:', error);
    throw error;
  }
}

/**
 * A simple function to use Sequential Thinking and format the result as text
 */
/**
 * Configure Mock Fallback Setting
 */
export async function setMockFallback(enabled: boolean): Promise<{success: boolean}> {
  try {
    const response = await fetch('/api/smithery/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        useMockFallback: enabled
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to update mock fallback setting');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error updating mock fallback setting:', error);
    throw error;
  }
}

/**
 * Configure Advanced Mock Setting
 */
export async function setAdvancedMock(enabled: boolean): Promise<{success: boolean}> {
  try {
    const response = await fetch('/api/smithery/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        useAdvancedMock: enabled
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to update advanced mock setting');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error updating advanced mock setting:', error);
    throw error;
  }
}

export async function getSequentialThought(prompt: string): Promise<string> {
  try {
    // First check if Smithery is available
    const status = await checkSmitheryStatus();
    if (status.status !== 'connected' && !status.mockFallbackActive) {
      return "Smithery Sequential Thinking is not available at the moment. Please check the connection or enable mock mode.";
    }
    
    // Process the prompt
    const result = await processWithSequentialThinking(prompt);
    
    // Format the result as text
    let formattedResult = "## Sequential Thinking Process\n\n";
    
    // We're always using the enhanced Norse-themed implementation now
    formattedResult += "*Using advanced Norse-themed sequential thinking*\n\n";
    
    if (result.steps && result.steps.length > 0) {
      result.steps.forEach((step, index) => {
        formattedResult += `### Step ${index + 1}\n`;
        formattedResult += `**Thought:** ${step.thought}\n\n`;
        formattedResult += `**Reasoning:** ${step.reasoning}\n\n`;
      });
    }
    
    if (result.conclusion) {
      formattedResult += `### Conclusion\n${result.conclusion}\n`;
    }
    
    return formattedResult;
  } catch (error: any) {
    return `Error using Sequential Thinking: ${error.message || 'Unknown error'}`;
  }
}