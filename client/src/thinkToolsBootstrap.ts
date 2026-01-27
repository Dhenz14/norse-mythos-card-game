/**
 * Think Tools Bootstrap
 * 
 * This module loads at application startup and ensures that the
 * Think Tools integration is available in every chat session.
 * It sets up the necessary event listeners and initializes
 * the Think Tools integration.
 * 
 * Now includes middleware integration for automatic template formatting
 * and consistent Think Tools output.
 */

import { THINK_TOOLS_CONFIG } from './config/thinkToolsConfig';
// Import our middleware components
import { initThinkToolsReplitIntegration, processWithThinkToolsMiddleware } from './replitBridge/thinkToolsIntegration';
import './replitBridge/agentMiddleware';

// Execute this code when the script is loaded
(function bootstrapThinkTools() {
  console.log('Bootstrapping Think Tools integration...');
  
  // Create a global object to store Think Tools state
  if (typeof window !== 'undefined') {
    (window as any).THINK_TOOLS = {
      initialized: false,
      config: THINK_TOOLS_CONFIG,
      
      // This function will be called by the Replit AI assistant
      isCommand: function(message: string): boolean {
        if (!message) return false;
        const normalizedMessage = message.toLowerCase().trim();
        
        return THINK_TOOLS_CONFIG.TRIGGER_PHRASES.some(phrase => 
          normalizedMessage.startsWith(phrase)
        );
      },
      
      // Format response with proper emoji indicators
      formatResponse: function(response: string): string {
        // If the response already has the standard format, return it as is
        if (response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION}`)) {
          return response;
        }
    
        // Otherwise, add the standard format
        let formattedResponse = `${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}\n\n`;
        
        // Check if there's content that looks like sequential thinking steps
        if (response.includes('Step 1:') || response.includes('Step 2:')) {
          formattedResponse += `${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}\n`;
          
          // Extract and format step sections using string operations
          const stepIndicators = ["Step 1:", "Step 2:", "Step 3:", "Step 4:", "Step 5:", "Step 6:", "Step 7:", "Step 8:", "Step 9:"];
          const stepMatches = [];
          
          for (let i = 0; i < stepIndicators.length; i++) {
            const currentStep = stepIndicators[i];
            const nextStep = stepIndicators[i + 1];
            
            if (response.includes(currentStep)) {
              const stepStart = response.indexOf(currentStep);
              let stepEnd;
              
              if (nextStep && response.includes(nextStep)) {
                stepEnd = response.indexOf(nextStep);
              } else {
                // Use the end of the string if no next step
                stepEnd = response.length;
              }
              
              if (stepEnd > stepStart) {
                stepMatches.push(response.substring(stepStart, stepEnd));
              }
            }
          }
          
          if (stepMatches.length > 0) {
            formattedResponse += stepMatches.join('\n');
          }
          
          formattedResponse += `\n${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_END} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}\n\n`;
        }
        
        // Add think tool section if there's content after the steps
        if (response.includes('Implement') || response.includes('Analysis')) {
          formattedResponse += `${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_START} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}\n`;
          
          // Use string operations instead of regex for better compatibility
          let toolContent = response;
          
          // Remove step sections using string operations
          const stepIndicators = ["Step 1:", "Step 2:", "Step 3:", "Step 4:", "Step 5:", "Step 6:", "Step 7:", "Step 8:", "Step 9:"];
          
          for (let i = 0; i < stepIndicators.length; i++) {
            const currentStep = stepIndicators[i];
            const nextStep = stepIndicators[i + 1];
            
            if (toolContent.includes(currentStep)) {
              const stepStart = toolContent.indexOf(currentStep);
              let stepEnd;
              
              if (nextStep && toolContent.includes(nextStep)) {
                stepEnd = toolContent.indexOf(nextStep);
              } else {
                // Try to find Implementation or Analysis
                const implIndex = toolContent.indexOf("Implementation");
                const analysisIndex = toolContent.indexOf("Analysis");
                
                if (implIndex !== -1 && (analysisIndex === -1 || implIndex < analysisIndex)) {
                  stepEnd = implIndex;
                } else if (analysisIndex !== -1) {
                  stepEnd = analysisIndex;
                } else {
                  // If no clear end marker, keep the rest
                  break;
                }
              }
              
              if (stepEnd > stepStart) {
                // Replace this step section with empty string
                toolContent = 
                  toolContent.substring(0, stepStart) + 
                  toolContent.substring(stepEnd);
              }
            }
          }
          
          formattedResponse += toolContent;
          
          if (!formattedResponse.includes(THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_END)) {
            formattedResponse += `\n${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_END} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}\n`;
          }
        }
        
        return formattedResponse;
      }
    };
    
    // Add this to ensure the Think Tools guide is loaded on each chat session
    const injectGuideReference = function() {
      // Create a hidden element with the Think Tools guide reference
      const guideElement = document.createElement('div');
      guideElement.id = 'think-tools-guide-reference';
      guideElement.style.display = 'none';
      guideElement.setAttribute('data-guide-path', 'docs/AI_THINK_TOOLS_GUIDE.md');
      guideElement.setAttribute('data-format-version', '1.0');
      document.body.appendChild(guideElement);
      
      console.log('Think Tools guide reference injected');
    };
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectGuideReference);
    } else {
      injectGuideReference();
    }
    
    console.log('Think Tools bootstrap completed');
  }
})();

export {};