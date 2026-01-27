/**
 * EnhancedResponseFormatter.ts
 * 
 * This module formats the output from EnhancedThinkTools
 * into a well-structured markdown response with visual indicators.
 * 
 * It now uses ThinkToolsTemplateMiddleware to ensure consistent formatting
 * and proper template structure for all Think Tools responses.
 */

import ThinkToolsTemplateMiddleware, { TemplateEnforcementLevel } from './ThinkToolsTemplateMiddleware';
import THINK_TOOLS_CONFIG from '../../client/src/config/thinkToolsConfig';

// Initialize logging for formatter operations
const LOG_PREFIX = '[EnhancedResponseFormatter]';
const logDebug = (message: string) => console.log(`${LOG_PREFIX} ${message}`);
const logError = (message: string) => console.error(`${LOG_PREFIX} Error: ${message}`);
const logWarning = (message: string) => console.warn(`${LOG_PREFIX} Warning: ${message}`);
const logSuccess = (message: string) => console.log(`${LOG_PREFIX} Success: ${message}`);

export default class EnhancedResponseFormatter {
  private middleware: ThinkToolsTemplateMiddleware;
  
  constructor() {
    // Get the singleton instance of the middleware
    this.middleware = ThinkToolsTemplateMiddleware.getInstance();
    
    // Configure the middleware for strict enforcement
    this.middleware.setOptions({
      enforcementLevel: TemplateEnforcementLevel.CORRECTION,
      logViolations: true,
      addMissingComponents: true
    });
    
    logSuccess('Enhanced Response Formatter initialized with template enforcement');
  }
  
  /**
   * Format a response from EnhancedThinkTools
   * This method now uses the template middleware to ensure proper formatting
   */
  public formatResponse(response: string, options: any = {}): string {
    try {
      // First apply our standard visual indicators (legacy support)
      let formattedResponse = this.addVisualIndicators(response);
      
      // Then pass through the middleware to enforce template compliance
      const isThinkToolsCommand = options.isThinkToolsCommand ?? 
        (response.includes('THINK TOOLS') || 
         response.includes('Step 1:') ||
         response.includes('Analysis:'));
      
      formattedResponse = this.middleware.applyMiddleware(formattedResponse, isThinkToolsCommand);
      
      // Add any tracking/debugging info if requested
      if (options.includeDebugInfo) {
        formattedResponse += `\n\n<!-- Think Tools response formatted at ${new Date().toISOString()} -->\n`;
      }
      
      logSuccess('Response formatted successfully with template compliance');
      return formattedResponse;
    } catch (error) {
      logError(`Error formatting response: ${error instanceof Error ? error.message : String(error)}`);
      // Fall back to basic formatting if middleware fails
      return this.addVisualIndicators(response);
    }
  }
  
  /**
   * Add visual indicators to a response
   * This is now a fallback method, the middleware is preferred
   */
  public addVisualIndicators(response: string): string {
    // Add the standard emoji indicators if not already present
    if (!response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}`)) {
      response = `${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}\n\n` + response;
    }
    
    // Add sequential thinking indicators if not present
    if (!response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}`)) {
      // Check if there's content that looks like sequential thinking steps
      if (response.includes('Step 1:') || response.includes('Step 2:')) {
        // Use a regular expression to match step content without the 's' flag
        const stepRegex = new RegExp('Step \\d+:[\\s\\S]*?(?=Step \\d+:|$)', 'g');
        const stepsSection = response.match(stepRegex);
        
        if (stepsSection) {
          // Insert sequential thinking headers
          response = response.replace(
            stepsSection[0],
            `${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}\n\n` + 
            stepsSection[0] + 
            `\n${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_END} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}\n\n`
          );
        }
      }
    }
    
    // Add think tool indicators if not present
    if (!response.includes(`${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_START} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}`)) {
      // Check if there's content that looks like analysis
      if (response.includes('Analysis:') || response.includes('Implementation Plan') || response.includes('Technical Implementation')) {
        // Find the analysis section using a regex without the 's' flag
        // Use a simpler regex approach without capturing groups
        const analysisRegex = /Analysis:[\s\S]*?(?=Implementation Strategy:|$)|Implementation Plan[\s\S]*?(?=Implementation Strategy:|$)|Technical Implementation[\s\S]*?(?=Implementation Strategy:|$)/;
        const analysisMatch = response.match(analysisRegex);
        
        if (analysisMatch) {
          // Insert think tool headers
          response = response.replace(
            analysisMatch[0],
            `${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_START} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}\n\n` + 
            analysisMatch[0] + 
            `\n\n${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_END} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}\n\n`
          );
        }
      }
    }
    
    return response;
  }
  
  /**
   * Format the strategy steps into a structured output
   */
  public formatSequentialSteps(steps: any[]): string {
    let output = `${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}\n\n`;
    
    steps.forEach((step, index) => {
      output += `Step ${index + 1}: ${step.title}\n`;
      
      // Convert paragraph content into bullet points
      const contentPoints = step.content.split('. ')
        .filter((point: string) => point.trim().length > 0)
        .map((point: string) => point.trim().endsWith('.') ? point.trim() : point.trim() + '.');
      
      contentPoints.forEach((point: string) => {
        output += `• ${point}\n`;
      });
      
      output += '\n';
    });
    
    output += `${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_END} ${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL}\n\n`;
    
    return output;
  }
  
  /**
   * Format the think tool analysis into a structured output
   */
  public formatThinkToolAnalysis(analysis: any): string {
    let output = `${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_START} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}\n\n`;
    
    // Format recommended options
    if (analysis.recommendedOptions) {
      analysis.recommendedOptions.forEach((option: any) => {
        output += `${option.name}\n`;
        
        // Add strengths
        if (option.strengths) {
          option.strengths.forEach((strength: string) => {
            output += `• ${strength}\n`;
          });
        }
        
        // Add weaknesses
        if (option.weaknesses) {
          option.weaknesses.forEach((weakness: string) => {
            output += `• ${weakness}\n`;
          });
        }
        
        output += '\n';
      });
    }
    
    // Format implementation plan
    if (analysis.implementationPlan) {
      output += 'Implementation Plan\n';
      
      analysis.implementationPlan.forEach((step: string) => {
        output += `• ${step}\n`;
      });
      
      output += '\n';
    }
    
    output += `${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${THINK_TOOLS_CONFIG.HEADERS.THINK_TOOL_END} ${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL}\n\n`;
    
    return output;
  }
  
  /**
   * Format the implementation strategy with checkmarks
   */
  public formatImplementationStrategy(strategy: string[]): string {
    let output = `${THINK_TOOLS_CONFIG.HEADERS.IMPLEMENTATION}\n`;
    
    strategy.forEach(item => {
      output += `${THINK_TOOLS_CONFIG.EMOJIS.COMPLETED} ${item}\n`;
    });
    
    output += `${THINK_TOOLS_CONFIG.EMOJIS.NEXT_STEP} Would you like more details on the next steps?\n\n`;
    
    return output;
  }
}