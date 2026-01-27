/**
 * Replit Root Cause Integration Component
 * 
 * This component provides integration with Replit chat for Root Cause Analysis.
 * It detects "Find The Root Cause" commands in the chat and executes the analysis.
 * It also works with "Use Think Tools" commands to provide seamless integration
 * between root cause analysis and Think Tools problem solving.
 * 
 * Features:
 * - Visual emoji cues during analysis process (🔍 → 🌳 → 🧩 → 🛠️)
 * - Sequential operation with Think Tools (Root Cause → Think Tools)
 * - Real-time progress updates
 */

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useThinkTools } from '../lib/thinkToolsIntegration';
import ReplitAIThinkToolsService from '../services/ReplitAIThinkToolsService';

interface ReplitRootCauseIntegrationProps {
  // Whether to use the full UI or a minimal version
  minimal?: boolean;
  // Optional callback when analysis is complete
  onAnalysisComplete?: (result: string) => void;
}

// Analysis progress stages with emoji indicators
enum AnalysisStage {
  Initial = "🔍 Identifying Issue",
  Investigation = "🧩 Investigating Patterns",
  RootCauseFound = "🌳 Locating Root Cause",
  FixGeneration = "🛠️ Generating Fix Recommendations",
  Complete = "✅ Analysis Complete"
}

const ReplitRootCauseIntegration: React.FC<ReplitRootCauseIntegrationProps> = ({
  minimal = false,
  onAnalysisComplete
}) => {
  // Base state
  const [isListening, setIsListening] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced state
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage | null>(null);
  const [lastIssue, setLastIssue] = useState<string | null>(null);
  const lastAnalysisRef = useRef<string | null>(null);
  
  // Integration with Think Tools
  const thinkTools = useThinkTools();
  
  // Listen for chat messages with commands
  useEffect(() => {
    if (!isListening) return;
    
    const messageHandler = async (event: MessageEvent) => {
      // Ensure the message is from Replit
      if (event.origin !== window.location.origin) return;
      
      try {
        // Parse the message data
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Check if this is a chat message
        if (data && data.type === 'chat' && data.message) {
          const message = data.message.toLowerCase();
          
          // Check for "Find The Root Cause" command (case insensitive)
          if (message.includes('find the root cause')) {
            // Extract the issue from the message
            const issueMatch = message.match(/find the root cause\s*(of|for)?\s*(.+)/i);
            if (issueMatch && issueMatch[2]) {
              const issue = issueMatch[2].trim();
              setLastIssue(issue);
              
              // Process the analysis with visual indicators
              await processRootCauseAnalysis(issue);
            }
          } 
          // Check for "Use Think Tools" command after a root cause analysis
          else if (message.includes('use think tools') && lastAnalysisRef.current) {
            // Send progress indicator
            sendProgressUpdate("🔮 Connecting Root Cause Analysis with Think Tools...");
            
            // Prepare the command using the last analysis
            const command = `Use Think Tools to solve the following issue based on root cause analysis: ${lastIssue}`;
            
            try {
              // Post the initial Think Tools processing message
              window.postMessage({
                type: 'chat-response',
                message: `🔮 THINK TOOLS PROCESSING 🔮\n\nInitiating sequential analysis based on root cause findings for: ${lastIssue}`
              }, window.location.origin);
              
              // Trigger the Think Tools processing
              const result = await thinkTools.triggerThinkTools(command);
              
              if (result.error) {
                window.postMessage({
                  type: 'chat-response',
                  message: `🔮 THINK TOOLS ERROR 🔮\n\n${result.error}`
                }, window.location.origin);
              } else if (result.result) {
                window.postMessage({
                  type: 'chat-response',
                  message: result.result
                }, window.location.origin);
              }
            } catch (error) {
              console.error('Error processing Think Tools command:', error);
              window.postMessage({
                type: 'chat-response',
                message: `🔮 THINK TOOLS ERROR 🔮\n\nFailed to process Think Tools command: ${error instanceof Error ? error.message : String(error)}`
              }, window.location.origin);
            }
          }
        }
      } catch (err) {
        console.error('Error processing chat message:', err);
      }
    };
    
    // Add event listener for messages
    window.addEventListener('message', messageHandler);
    
    // Cleanup
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [isListening, lastIssue, thinkTools]);
  
  /**
   * Send a progress update to the chat
   */
  const sendProgressUpdate = (message: string) => {
    window.postMessage({
      type: 'chat-response',
      message
    }, window.location.origin);
  };
  
  /**
   * Process a root cause analysis with visual progress indicators
   */
  const processRootCauseAnalysis = async (issue: string) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Create the command
      const command = `Find the root cause of ${issue}`;
      
      // Send initial progress update with emoji indicator
      setAnalysisStage(AnalysisStage.Initial);
      sendProgressUpdate(`${AnalysisStage.Initial} for "${issue}"`);
      
      // Artificial delay to show progress stages (for demo purposes)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Investigation stage
      setAnalysisStage(AnalysisStage.Investigation);
      sendProgressUpdate(`${AnalysisStage.Investigation} in "${issue}"`);
      
      // Artificial delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Root cause stage
      setAnalysisStage(AnalysisStage.RootCauseFound);
      sendProgressUpdate(`${AnalysisStage.RootCauseFound} of "${issue}"`);
      
      // Send the command to the server
      const response = await axios.post('/api/rootcause/process', { command });
      
      // Fix generation stage
      setAnalysisStage(AnalysisStage.FixGeneration);
      sendProgressUpdate(`${AnalysisStage.FixGeneration} for "${issue}"`);
      
      // Artificial delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Complete stage
      setAnalysisStage(AnalysisStage.Complete);
      sendProgressUpdate(`${AnalysisStage.Complete} for "${issue}"`);
      
      // Set the result
      const result = response.data.response;
      setLastAnalysis(result);
      lastAnalysisRef.current = result;
      
      // Notify parent component if callback is provided
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
      
      // Format the result with proper emoji structure
      const formattedResult = formatResultWithEmojis(result, issue);
      
      // Post the result back to the chat
      window.postMessage({
        type: 'chat-response',
        message: formattedResult
      }, window.location.origin);
      
      // Add follow-up instruction for sequential operation
      setTimeout(() => {
        sendProgressUpdate(`✨ Analysis complete! Type "Use Think Tools" to solve this issue based on the root cause findings.`);
      }, 1000);
      
    } catch (err) {
      const errorMessage = `Error analyzing issue: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      setAnalysisStage(null);
      
      // Post error back to chat
      window.postMessage({
        type: 'chat-response',
        message: `⚠️ ${errorMessage}`
      }, window.location.origin);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Format the result with proper emoji structure
   */
  const formatResultWithEmojis = (result: string, issue: string): string => {
    // If the result already has emojis, return it as is
    if (result.includes('🔍') || result.includes('🌳') || result.includes('🧩') || result.includes('🛠️')) {
      return result;
    }
    
    // Add emoji structure to the result
    let formattedResult = `# 🔍 Deep Root Cause Analysis for "${issue}"\n\n`;
    
    // Split into sections
    const sections = result.split(/\n#{2,3} /);
    
    if (sections.length > 1) {
      // Format each section with appropriate emojis
      sections.forEach((section, index) => {
        if (index === 0) return; // Skip the title section
        
        const sectionTitle = section.split('\n')[0];
        const sectionContent = section.slice(sectionTitle.length).trim();
        
        if (sectionTitle.toLowerCase().includes('root cause')) {
          formattedResult += `\n## 🌳 ${sectionTitle}\n${sectionContent}\n`;
        } else if (sectionTitle.toLowerCase().includes('investigation') || sectionTitle.toLowerCase().includes('analysis')) {
          formattedResult += `\n## 🧩 ${sectionTitle}\n${sectionContent}\n`;
        } else if (sectionTitle.toLowerCase().includes('recommend') || sectionTitle.toLowerCase().includes('solution') || sectionTitle.toLowerCase().includes('fix')) {
          formattedResult += `\n## 🛠️ ${sectionTitle}\n${sectionContent}\n`;
        } else {
          formattedResult += `\n## ${sectionTitle}\n${sectionContent}\n`;
        }
      });
    } else {
      // Simple formatting for unstructured results
      formattedResult += `\n## 🌳 Root Cause\n${result}\n`;
    }
    
    return formattedResult;
  };
  
  // Toggle listening state
  const toggleListening = () => {
    setIsListening(!isListening);
  };
  
  // If minimal mode, just return a status indicator
  if (minimal) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div 
          className={`p-2 rounded-full shadow cursor-pointer ${isListening ? 'bg-green-500' : 'bg-gray-400'}`}
          onClick={toggleListening}
          title={isListening ? 'Root Cause Analysis active' : 'Root Cause Analysis paused'}
        >
          <span className="sr-only">
            {isListening ? 'Root Cause Analysis active' : 'Root Cause Analysis paused'}
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-white" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
        </div>
      </div>
    );
  }
  
  // Full UI mode
  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Root Cause Analysis</h2>
        <button
          className={`px-3 py-1 rounded text-white ${isListening ? 'bg-green-500' : 'bg-gray-400'}`}
          onClick={toggleListening}
        >
          {isListening ? 'Listening' : 'Paused'}
        </button>
      </div>
      
      {isAnalyzing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
          {analysisStage ? (
            <div className="flex items-center">
              <span className="text-lg mr-2">{analysisStage.split(' ')[0]}</span>
              <span>{analysisStage.split(' ').slice(1).join(' ')}</span>
            </div>
          ) : (
            "Analyzing root cause..."
          )}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {lastAnalysis && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Last Analysis</h3>
          <div className="bg-gray-50 border border-gray-200 rounded p-4 mt-2 max-h-60 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-words text-sm text-gray-800">
              {lastAnalysis}
            </pre>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        Type "Find the root cause of [issue]" in the chat to trigger an analysis.
      </div>
    </div>
  );
};

export default ReplitRootCauseIntegration;