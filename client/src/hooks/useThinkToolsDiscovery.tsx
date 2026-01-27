/**
 * Custom hook for integrating with the Think Tools Discovery Protocol
 * 
 * This hook provides client-side integration with the Think Tools Discovery Protocol,
 * allowing components to send Think Tools commands and receive formatted responses.
 */

import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Interface for the Think Tools hook response
 */
interface UseThinkToolsDiscoveryReturn {
  /**
   * Send a Think Tools command
   * 
   * @param command The command to send
   * @returns The formatted response
   */
  sendCommand: (command: string) => Promise<string>;
  
  /**
   * The formatted response from the Think Tools Discovery Protocol
   */
  response: string;
  
  /**
   * Whether a request is currently in progress
   */
  loading: boolean;
  
  /**
   * Error message if the request failed
   */
  error: string | null;
}

/**
 * Hook for using the Think Tools Discovery Protocol
 * 
 * @returns Functions and state for interacting with the Think Tools Discovery Protocol
 */
export function useThinkToolsDiscovery(): UseThinkToolsDiscoveryReturn {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Send a command to the Think Tools Discovery Protocol
   */
  const sendCommand = useCallback(async (command: string): Promise<string> => {
    // Reset state
    setLoading(true);
    setError(null);
    
    try {
      // Send request to API
      const result = await axios.post('/api/thinktools/process', { command });
      
      // Extract response
      const formattedResponse = result.data.response;
      
      // Update state
      setResponse(formattedResponse);
      setLoading(false);
      
      return formattedResponse;
    } catch (err: any) {
      // Handle error
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      
      return `Error: ${errorMessage}`;
    }
  }, []);
  
  return {
    sendCommand,
    response,
    loading,
    error
  };
}

export default useThinkToolsDiscovery;