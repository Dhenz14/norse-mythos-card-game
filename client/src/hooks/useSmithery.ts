import { useState, useEffect, useCallback } from 'react';
import { 
  checkSmitheryStatus, 
  getSmitheryTools,
  processWithSequentialThinking,
  setMockFallback,
  setAdvancedMock,
  SmitheryStatus,
  SmitheryTool,
  SequentialThinkingResult
} from '../lib/smitheryUtils';

/**
 * Custom hook for interacting with Smithery Sequential Thinking
 */
export default function useSmithery() {
  const [status, setStatus] = useState<SmitheryStatus | null>(null);
  const [tools, setTools] = useState<SmitheryTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize the connection and fetch status
   */
  useEffect(() => {
    async function initializeSmithery() {
      try {
        const statusResult = await checkSmitheryStatus();
        setStatus(statusResult);
        
        if (statusResult.status === 'connected') {
          const toolsResult = await getSmitheryTools();
          setTools(toolsResult);
        }
      } catch (err) {
        console.error('Failed to initialize Smithery:', err);
        setError('Failed to connect to Smithery service');
      }
    }

    initializeSmithery();
  }, []);

  /**
   * Function to refresh status and tools
   */
  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      const statusResult = await checkSmitheryStatus();
      setStatus(statusResult);
      
      if (statusResult.status === 'connected') {
        const toolsResult = await getSmitheryTools();
        setTools(toolsResult);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh Smithery status');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Function to process a prompt with sequential thinking
   */
  const processPrompt = useCallback(async (
    prompt: string,
    options: {
      maxSteps?: number;
      temperature?: number;
    } = {}
  ): Promise<SequentialThinkingResult> => {
    setLoading(true);
    setError(null);
    
    try {
      if (!status || status.status !== 'connected') {
        throw new Error('Smithery service is not connected');
      }
      
      const result = await processWithSequentialThinking(prompt, options);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to process sequential thinking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [status]);

  /**
   * Update mock fallback setting
   */
  const updateMockFallback = useCallback(async (enabled: boolean) => {
    try {
      setLoading(true);
      await setMockFallback(enabled);
      await refreshStatus();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update mock fallback setting');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);
  
  /**
   * Update advanced mock setting
   */
  const updateAdvancedMock = useCallback(async (enabled: boolean) => {
    try {
      setLoading(true);
      await setAdvancedMock(enabled);
      await refreshStatus();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update advanced mock setting');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);
  
  return {
    status,
    tools,
    loading,
    error,
    refreshStatus,
    processPrompt,
    isConnected: status?.status === 'connected' && status?.apiConfigured,
    mockFallbackEnabled: status?.mockFallbackEnabled || false,
    advancedMockEnabled: status?.advancedMockEnabled || false,
    mockFallbackActive: status?.mockFallbackActive || false,
    usingAdvancedMock: status?.usingAdvancedMock || false,
    setMockFallback: updateMockFallback,
    setAdvancedMock: updateAdvancedMock
  };
}