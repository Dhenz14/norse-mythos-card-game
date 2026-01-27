/**
 * Think Tools Integration - Client-side implementation
 * 
 * This module ensures consistent handling of "Use Think Tools" commands
 * by providing a client-side hook that properly formats and displays
 * the analysis progress and results.
 */

import { useState, useEffect } from 'react';
import THINK_TOOLS_CONFIG from '../config/thinkToolsConfig';

// Types for the integration
export interface ThinkToolsRequest {
  query: string;
}

export interface ThinkToolsResponse {
  triggered: boolean;
  result?: string;
  error?: string;
}

export interface ThinkToolsProgress {
  step: string;
  isComplete: boolean;
  details?: string[];
}

/**
 * Hook for Think Tools integration
 * This hook provides a way to trigger Think Tools analysis
 * and track the progress of the analysis
 */
export function useThinkTools() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ThinkToolsProgress[]>([]);

  /**
   * Check if a message is a Think Tools command
   */
  const isThinkToolsCommand = (message: string): boolean => {
    if (!message) return false;
    const normalizedMessage = message.toLowerCase().trim();
    return normalizedMessage.startsWith('use think tool') || 
           normalizedMessage.startsWith('use think tools');
  };

  /**
   * Extract query from Think Tools command
   */
  const extractQuery = (message: string): string => {
    const triggerPhrases = ['use think tool', 'use think tools'];
    const normalizedMessage = message.toLowerCase().trim();
    
    for (const phrase of triggerPhrases) {
      if (normalizedMessage.startsWith(phrase)) {
        return message.substring(phrase.length).trim();
      }
    }
    
    return message; // Fallback - shouldn't reach here if isThinkToolsCommand is used first
  };

  /**
   * Format the Think Tools response with proper emoji indicators
   */
  const formatThinkToolsResponse = (response: string): string => {
    // If the response already has the standard format, return it as is
    if (response.includes('🔮 THINK TOOLS ACTIVATED 🔮')) {
      return response;
    }

    // Otherwise, add the standard format
    let formattedResponse = '🔮 THINK TOOLS ACTIVATED 🔮\n\n';
    
    // Check if there's content that looks like sequential thinking steps
    if (response.includes('Step 1:') || response.includes('Step 2:')) {
      formattedResponse += '⚡ SEQUENTIAL THINKING ACTIVATED ⚡\n';
      
      // Extract and format step sections
      const stepMatches = response.match(/Step \d+:.*?(?=Step \d+:|$)/gs);
      if (stepMatches) {
        formattedResponse += stepMatches.join('\n');
      }
      
      formattedResponse += '\n⚡ SEQUENTIAL THINKING COMPLETE ⚡\n\n';
    }
    
    // Add think tool section if there's content after the steps
    if (response.includes('Implement') || response.includes('Analysis')) {
      formattedResponse += '🌲 THINK TOOL ACTIVATED 🌲\n';
      
      // Extract content after steps
      const toolContent = response.replace(/Step \d+:.*?(?=Implementation|Analysis|$)/gs, '');
      formattedResponse += toolContent;
      
      if (!formattedResponse.includes('THINK TOOL COMPLETE')) {
        formattedResponse += '\n🌲 THINK TOOL COMPLETE 🌲\n';
      }
    }
    
    return formattedResponse;
  };

  /**
   * Update progress during analysis
   */
  const updateProgress = (step: string, isComplete: boolean = false, details?: string[]) => {
    setProgress(prev => {
      // Check if step already exists
      const stepIndex = prev.findIndex(p => p.step === step);
      
      if (stepIndex >= 0) {
        // Update existing step
        const updatedProgress = [...prev];
        updatedProgress[stepIndex] = { ...updatedProgress[stepIndex], isComplete, details };
        return updatedProgress;
      } else {
        // Add new step
        return [...prev, { step, isComplete, details }];
      }
    });
  };

  /**
   * Format progress for display
   */
  const formatProgress = (): string => {
    let progressText = '🔮 THINK TOOLS IN PROGRESS 🔮\n\n';
    
    progress.forEach((p, index) => {
      const icon = p.isComplete ? '✓' : '⏳';
      progressText += `${icon} ${p.step}\n`;
      
      if (p.details && p.details.length > 0) {
        p.details.forEach(detail => {
          progressText += `  • ${detail}\n`;
        });
      }
      
      progressText += '\n';
    });
    
    return progressText;
  };

  /**
   * Trigger Think Tools analysis
   */
  const triggerThinkTools = async (message: string): Promise<ThinkToolsResponse> => {
    if (!isThinkToolsCommand(message)) {
      return { triggered: false };
    }
    
    const query = extractQuery(message);
    
    if (!query) {
      return { 
        triggered: true, 
        error: "Please provide a question after 'Use Think Tools'. For example: Use Think Tools how to build an aggressive Thor deck" 
      };
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setProgress([]);
    
    // Add initial progress steps
    updateProgress('Initializing Think Tools analysis', false);
    
    try {
      // Show progress during API call
      updateProgress('Initializing Think Tools analysis', true);
      updateProgress('Parsing query', false);
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateProgress('Parsing query', true);
      updateProgress('Contacting Think Tools API', false);
      
      // Call the API
      const response = await fetch('/api/mcp/trigger-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'Use Think Tools',
          query: query
        })
      });
      
      updateProgress('Contacting Think Tools API', true);
      updateProgress('Processing response', false);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      updateProgress('Processing response', true);
      updateProgress('Formatting results', false);
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateProgress('Formatting results', true);
      
      if (!data.triggered) {
        return { triggered: false };
      }
      
      if (data.error) {
        setError(data.error);
        return { triggered: true, error: data.error };
      }
      
      // Format and set the result
      const formattedResult = formatThinkToolsResponse(data.result);
      setResult(formattedResult);
      
      return { triggered: true, result: formattedResult };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { triggered: true, error: errorMessage };
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Get the current state of Think Tools analysis
   */
  const getThinkToolsState = () => {
    return {
      isAnalyzing,
      result,
      error,
      progress: formatProgress()
    };
  };

  return {
    isThinkToolsCommand,
    triggerThinkTools,
    getThinkToolsState
  };
}

export default useThinkTools;