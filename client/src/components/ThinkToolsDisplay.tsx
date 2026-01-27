import React, { useEffect, useState } from 'react';
import { useThinkTools } from '../lib/thinkToolsIntegration';

interface ThinkToolsDisplayProps {
  message: string;
  onProcessed: (result: string | null) => void;
}

/**
 * ThinkToolsDisplay Component
 * 
 * This component intercepts chat messages, checks if they're Think Tools commands,
 * and displays the analysis progress and results with proper formatting.
 */
const ThinkToolsDisplay: React.FC<ThinkToolsDisplayProps> = ({ message, onProcessed }) => {
  const { isThinkToolsCommand, triggerThinkTools, getThinkToolsState } = useThinkTools();
  const [showProgress, setShowProgress] = useState(false);
  
  useEffect(() => {
    let isActive = true;
    
    const processMessage = async () => {
      if (isThinkToolsCommand(message)) {
        setShowProgress(true);
        
        // Add a small delay to ensure the progress is displayed
        const progressInterval = setInterval(() => {
          if (isActive) {
            // Force re-render to show updated progress
            setShowProgress(prev => prev);
          }
        }, 200);
        
        const response = await triggerThinkTools(message);
        
        clearInterval(progressInterval);
        
        if (isActive) {
          setShowProgress(false);
          
          if (response.triggered) {
            if (response.error) {
              onProcessed(`🔮 Think Tools Error: ${response.error}`);
            } else if (response.result) {
              onProcessed(response.result);
            }
          } else {
            onProcessed(null);
          }
        }
      } else {
        onProcessed(null);
      }
    };
    
    processMessage();
    
    return () => {
      isActive = false;
    };
  }, [message, isThinkToolsCommand, triggerThinkTools, onProcessed]);
  
  if (!isThinkToolsCommand(message) || !showProgress) {
    return null;
  }
  
  const { progress } = getThinkToolsState();
  
  return (
    <div className="think-tools-progress">
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        fontFamily: 'monospace',
        backgroundColor: '#1e1e1e',
        color: '#e0e0e0',
        padding: '10px',
        borderRadius: '4px',
        margin: '10px 0'
      }}>
        {progress}
      </pre>
    </div>
  );
};

export default ThinkToolsDisplay;