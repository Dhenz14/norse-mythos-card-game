/**
 * Custom hook for using the Root Cause Analysis feature
 * 
 * This hook provides an easy way to interact with the Root Cause Analysis service.
 */

import { useState, useCallback } from 'react';
import RootCauseAnalysisService from '../services/RootCauseAnalysisService';

interface UseRootCauseAnalysisOptions {
  // Whether to auto-focus on input after reset
  autoFocus?: boolean;
  // Additional callback when analysis is complete
  onAnalysisComplete?: (result: string) => void;
}

interface UseRootCauseAnalysisReturn {
  // The issue to analyze
  issue: string;
  // Set the issue to analyze
  setIssue: (issue: string) => void;
  // The analysis result
  result: string | null;
  // Whether analysis is in progress
  isAnalyzing: boolean;
  // Any error that occurred
  error: Error | null;
  // Submit the issue for analysis
  submitAnalysis: () => Promise<void>;
  // Reset the form
  reset: () => void;
  // Whether the current input is a valid issue
  isValidIssue: boolean;
}

/**
 * Custom hook for using the Root Cause Analysis feature
 */
export function useRootCauseAnalysis(options: UseRootCauseAnalysisOptions = {}): UseRootCauseAnalysisReturn {
  const [issue, setIssue] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get the service instance
  const service = RootCauseAnalysisService.getInstance();
  
  // Check if the issue is valid
  const isValidIssue = issue.trim().length > 0;
  
  // Submit the issue for analysis
  const submitAnalysis = useCallback(async () => {
    if (!isValidIssue) {
      setError(new Error('Please enter an issue to analyze'));
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Create the command
      const command = service.createCommand(issue);
      
      // Submit the command
      const analysisResult = await service.processCommand(command);
      
      // Set the result
      setResult(analysisResult);
      
      // Call the callback if provided
      if (options.onAnalysisComplete) {
        options.onAnalysisComplete(analysisResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  }, [issue, isValidIssue, service, options.onAnalysisComplete]);
  
  // Reset the form
  const reset = useCallback(() => {
    setIssue('');
    setResult(null);
    setError(null);
  }, []);
  
  return {
    issue,
    setIssue,
    result,
    isAnalyzing,
    error,
    submitAnalysis,
    reset,
    isValidIssue
  };
}

export default useRootCauseAnalysis;