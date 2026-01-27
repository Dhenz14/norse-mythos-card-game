/**
 * ThinkToolsTemplateMiddleware.ts
 * 
 * This middleware ensures that all Think Tools responses follow the proper format.
 * It intercepts responses before they're sent back to the client and enforces
 * the standard Think Tools template structure, including proper emoji markers
 * and section headers.
 */

import THINK_TOOLS_CONFIG from '../../client/src/config/thinkToolsConfig';
import ThinkToolsResponseLogger, { LogLevel } from './ThinkToolsResponseLogger';

/**
 * The format of a properly structured Think Tools response
 */
export interface TemplateVerificationResult {
  isValid: boolean;
  missingComponents: string[];
  formattedResponse?: string;
}

/**
 * Enforcement levels for template compliance
 */
export enum TemplateEnforcementLevel {
  NONE = 'none',           // No enforcement, pass through
  WARNING = 'warning',     // Log warnings but pass through
  CORRECTION = 'correction', // Automatically correct format issues
  STRICT = 'strict'        // Reject non-compliant responses
}

/**
 * Template verification and enforcement options
 */
export interface TemplateVerificationOptions {
  enforcementLevel: TemplateEnforcementLevel;
  logViolations: boolean;
  addMissingComponents: boolean;
}

export default class ThinkToolsTemplateMiddleware {
  private static instance: ThinkToolsTemplateMiddleware;
  private options: TemplateVerificationOptions;
  
  private constructor() {
    this.options = {
      enforcementLevel: TemplateEnforcementLevel.CORRECTION,
      logViolations: true,
      addMissingComponents: true
    };
    console.log('Think Tools Template Middleware initialized');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ThinkToolsTemplateMiddleware {
    if (!ThinkToolsTemplateMiddleware.instance) {
      ThinkToolsTemplateMiddleware.instance = new ThinkToolsTemplateMiddleware();
    }
    return ThinkToolsTemplateMiddleware.instance;
  }
  
  /**
   * Set the enforcement options
   */
  public setOptions(options: Partial<TemplateVerificationOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }
  
  /**
   * Apply middleware to enforce template structure
   * This is the main entry point for the middleware
   */
  public applyMiddleware(response: string, isThinkToolsCommand: boolean): string {
    // Performance tracking
    const startTime = Date.now();
    
    // Skip processing for non-Think Tools commands
    if (!isThinkToolsCommand) {
      return response;
    }
    
    // Get logger instance
    const logger = ThinkToolsResponseLogger.getInstance();
    
    // Verify and possibly correct the template structure
    const result = this.verifyTemplateCompliance(response);
    
    // Record metrics about the response
    const structuralComponents = {
      hasThinkToolsHeader: response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION}`),
      hasSequentialThinking: response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START}`),
      hasThinkTool: response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_START}`),
      hasImplementationStrategy: response.includes(`${THINK_TOOLS_CONFIG.HEADERS.IMPLEMENTATION}`)
    };
    
    if (this.options.logViolations && !result.isValid) {
      logger.log(`Template non-compliance detected: Missing ${result.missingComponents.join(', ')}`, LogLevel.WARNING);
    }
    
    let finalResponse = response;
    let requiredCorrection = false;
    
    if (!result.isValid) {
      switch (this.options.enforcementLevel) {
        case TemplateEnforcementLevel.NONE:
          logger.log('Template enforcement level: NONE - No correction applied', LogLevel.INFO);
          break;
          
        case TemplateEnforcementLevel.WARNING:
          // Already logged above if logViolations is true
          logger.log('Template enforcement level: WARNING - No correction applied', LogLevel.INFO);
          break;
          
        case TemplateEnforcementLevel.CORRECTION:
          if (result.formattedResponse) {
            logger.log('Template format corrected automatically', LogLevel.SUCCESS);
            finalResponse = result.formattedResponse;
            requiredCorrection = true;
          }
          break;
          
        case TemplateEnforcementLevel.STRICT:
          if (!result.formattedResponse) {
            logger.log(`Template compliance check failed: Missing ${result.missingComponents.join(', ')}`, LogLevel.ERROR);
            throw new Error(`Think Tools template compliance failed: Missing ${result.missingComponents.join(', ')}`);
          }
          logger.log('Template strictly enforced and corrected', LogLevel.SUCCESS);
          finalResponse = result.formattedResponse;
          requiredCorrection = true;
          break;
      }
    } else {
      logger.log('Template is already compliant', LogLevel.SUCCESS);
    }
    
    // Record final metrics
    logger.recordResponseMetrics({
      isCompliant: result.isValid,
      missingComponents: result.missingComponents,
      requiredCorrection,
      responseLength: finalResponse.length,
      structuralComponents,
      processingTimeMs: Date.now() - startTime
    });
    
    return finalResponse;
  }
  
  /**
   * Verify that the response follows the proper template structure
   */
  public verifyTemplateCompliance(response: string): TemplateVerificationResult {
    const missingComponents: string[] = [];
    let isValid = true;
    
    // Check for main Think Tools activation header
    if (!response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}`)) {
      missingComponents.push('Think Tools activation header');
      isValid = false;
    }
    
    // Check for Sequential Thinking sections if there are steps
    if (response.includes('Step 1:') && 
        !response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}`)) {
      missingComponents.push('Sequential Thinking header');
      isValid = false;
    }
    
    if (response.includes('Step 1:') && 
        !response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_END} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}`)) {
      missingComponents.push('Sequential Thinking completion marker');
      isValid = false;
    }
    
    // Check for Think Tool sections if there's analysis
    const hasAnalysis = response.includes('Analysis:') || 
                       response.includes('Implementation Plan') || 
                       response.includes('Technical Implementation');
                       
    if (hasAnalysis && 
        !response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_START} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}`)) {
      missingComponents.push('Think Tool activation header');
      isValid = false;
    }
    
    if (hasAnalysis && 
        !response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_END} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}`)) {
      missingComponents.push('Think Tool completion marker');
      isValid = false;
    }
    
    // If valid, no need to generate a formatted response
    if (isValid) {
      return { isValid, missingComponents };
    }
    
    // Only attempt to format if requested
    if (!this.options.addMissingComponents) {
      return { isValid, missingComponents };
    }
    
    // Generate a properly formatted response
    const formattedResponse = this.formatResponse(response);
    
    return {
      isValid,
      missingComponents,
      formattedResponse
    };
  }
  
  /**
   * Format the response to comply with the template structure
   */
  private formatResponse(response: string): string {
    let formattedResponse = response;
    
    // If the response doesn't start with the Think Tools activation header, add it
    if (!formattedResponse.includes(`${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}`)) {
      formattedResponse = `${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}\n\n${formattedResponse}`;
    }
    
    // If there's sequential thinking content but no headers, add them
    if (formattedResponse.includes('Step 1:')) {
      // Extract step content (matches Step X: through to the next step or end)
      // Use a regex approach that handles multi-line steps correctly
      const stepMatches = formattedResponse.match(/Step \d+:[\s\S]*?(?=Step \d+:|$)/g);
      
      if (stepMatches) {
        const fullStepContent = stepMatches.join('\n');
        
        // Only add headers if they don't exist
        if (!formattedResponse.includes(`${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}`)) {
          // Replace the first step with the sequence header + step
          formattedResponse = formattedResponse.replace(
            stepMatches[0],
            `${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}\n\n${stepMatches[0]}`
          );
        }
        
        // Add the sequence completion marker after the last step if it's not already there
        if (!formattedResponse.includes(`${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_END} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}`)) {
          // Find where the last step ends
          const lastStepEndMatch = formattedResponse.indexOf(stepMatches[stepMatches.length - 1]) + stepMatches[stepMatches.length - 1].length;
          
          // Insert the completion marker
          formattedResponse = formattedResponse.substring(0, lastStepEndMatch) +
                        `\n\n${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_END} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}\n\n` +
                        formattedResponse.substring(lastStepEndMatch);
        }
      }
    }
    
    // If there's think tool content but no headers, add them
    const hasAnalysis = formattedResponse.includes('Analysis:') || 
                       formattedResponse.includes('Implementation Plan') || 
                       formattedResponse.includes('Technical Implementation');
    
    if (hasAnalysis) {
      // Find the analysis section using a simple regex approach without 's' flag
      const analysisRegex = /Analysis:[\s\S]*?(?=Implementation Strategy:|$)|Implementation Plan[\s\S]*?(?=Implementation Strategy:|$)|Technical Implementation[\s\S]*?(?=Implementation Strategy:|$)/;
      const analysisMatch = formattedResponse.match(analysisRegex);
      
      if (analysisMatch) {
        // Only add think tool header if it's not already there
        if (!formattedResponse.includes(`${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_START} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}`)) {
          // Replace the analysis section with header + analysis
          formattedResponse = formattedResponse.replace(
            analysisMatch[0],
            `${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_START} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}\n\n${analysisMatch[0]}`
          );
        }
        
        // Add the think tool completion marker if it's not already there
        if (!formattedResponse.includes(`${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_END} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}`)) {
          // Find where the analysis section ends
          const analysisEndMatch = formattedResponse.indexOf(analysisMatch[0]) + analysisMatch[0].length;
          
          // Insert the completion marker
          formattedResponse = formattedResponse.substring(0, analysisEndMatch) +
                        `\n\n${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_END} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}\n\n` +
                        formattedResponse.substring(analysisEndMatch);
        }
      }
    }
    
    // If there's implementation strategy content but no checkmarks, add them
    if (formattedResponse.includes('Implementation Strategy:')) {
      // Use a standard regex literal to avoid RegExp constructor issues
      const strategyRegex = /Implementation Strategy:[\s\S]*?(?=\n\n|$)/;
      const strategyMatch = formattedResponse.match(strategyRegex);
      
      if (strategyMatch) {
        // Split into lines and add checkmarks to each item if not already present
        const strategyLines = strategyMatch[0].split('\n');
        let updatedStrategy = strategyLines[0] + '\n'; // Keep the header as is
        
        for (let i = 1; i < strategyLines.length; i++) {
          const line = strategyLines[i].trim();
          if (line && !line.startsWith('✓') && !line.startsWith('→')) {
            if (i < strategyLines.length - 2) {
              updatedStrategy += `${THINK_TOOLS_CONFIG.EMOJIS.COMPLETED} ${line}\n`;
            } else {
              updatedStrategy += `${THINK_TOOLS_CONFIG.EMOJIS.NEXT_STEP} ${line}\n`;
            }
          } else {
            updatedStrategy += line + '\n';
          }
        }
        
        // Replace the original strategy with the updated one
        formattedResponse = formattedResponse.replace(strategyMatch[0], updatedStrategy.trim());
      }
    }
    
    return formattedResponse;
  }
}