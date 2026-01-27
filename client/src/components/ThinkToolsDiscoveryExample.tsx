/**
 * Think Tools Discovery Example
 * 
 * This component demonstrates how to use the Think Tools Discovery Protocol
 * in a React component. It provides a simple interface for entering Think Tools
 * commands and displays the results.
 */

import React, { useState } from 'react';
import { useThinkToolsDiscovery } from '../hooks/useThinkToolsDiscovery';

interface ThinkToolsDiscoveryExampleProps {
  initialMessage?: string;
}

/**
 * ThinkToolsDiscoveryExample component
 */
const ThinkToolsDiscoveryExample: React.FC<ThinkToolsDiscoveryExampleProps> = ({
  initialMessage = ''
}) => {
  // State
  const [message, setMessage] = useState<string>(initialMessage);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [displayResult, setDisplayResult] = useState<string | null>(null);
  
  // Use the Think Tools Discovery hook
  const {
    isAnalyzing,
    result,
    error,
    checkCommand,
    processCommand
  } = useThinkToolsDiscovery();
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }
    
    setIsProcessing(true);
    setDisplayResult(null);
    
    try {
      // Check if the message is a Think Tools command
      const isCommand = await checkCommand(message);
      
      if (!isCommand) {
        setDisplayResult('Not a Think Tools command. Message must start with "Use Think Tools".');
        setIsProcessing(false);
        return;
      }
      
      // Process the command
      const result = await processCommand(message);
      setDisplayResult(result);
    } catch (error: any) {
      setDisplayResult(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Think Tools Discovery Example</h2>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-2">
          <label htmlFor="message" className="block mb-1">
            Enter a Think Tools command:
          </label>
          <input
            type="text"
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Use Think Tools what's the best strategy for a control deck?"
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button
          type="submit"
          disabled={isProcessing || !message.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Submit'}
        </button>
      </form>
      
      {displayResult && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="bg-white p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
            {displayResult}
          </pre>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default ThinkToolsDiscoveryExample;