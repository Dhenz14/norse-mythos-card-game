/**
 * Think Tools Middleware
 * 
 * Central middleware for processing content with the Think Tools system.
 * Detects appropriate reasoning mode and applies the correct processor.
 * 
 * Now enhanced with Smithery-powered visualizations to improve understanding
 * of each reasoning mode through interactive diagrams.
 */

import { ReasoningContext } from './reasoningContext';
import { ReasoningMode } from './reasoningModes';
import { ProcessorRegistry } from './processorRegistry';
import { THINK_TOOLS_CONFIG } from './thinkToolsConfig';
import { createVisualizationEnhancedProcessor } from './visualizationProcessor';

/**
 * Middleware for processing content with Think Tools
 */
export class ThinkToolsMiddleware {
  /**
   * Process content with Think Tools
   */
  public processContent(content: string): string {
    // Check if "Use Think Tools" is present
    if (!content.toLowerCase().includes('use think tools')) {
      return content;
    }
    
    // Detect reasoning mode
    const mode = this.detectReasoningMode(content);
    
    // Create context with detected mode and store original content
    const context = new ReasoningContext(mode, content);
    
    // Get all registered processors
    const processors = ProcessorRegistry.getInstance().getProcessors();
    
    // Find appropriate processor
    for (const processor of processors) {
      if (processor.canProcess(content, context)) {
        try {
          // Wrap the processor with visualization enhancement
          const visualizationEnhancedProcessor = createVisualizationEnhancedProcessor(processor, mode);
          return visualizationEnhancedProcessor.process(content, context);
        } catch (error) {
          console.error(`Error processing with ${mode}:`, error);
          // Fall back to simple formatting if processing fails
          return this.fallbackFormatting(content, mode);
        }
      }
    }
    
    // If no processor can handle it, return original content
    return content;
  }
  
  /**
   * Detect the reasoning mode from content
   */
  private detectReasoningMode(content: string): ReasoningMode {
    const lowerContent = content.toLowerCase();
    
    // Check for explicit mode requests
    for (const mode of Object.values(ReasoningMode)) {
      const modeText = mode.toLowerCase().replace(/_/g, ' ');
      if (lowerContent.includes(`use think tools: ${modeText}`)) {
        return mode;
      }
    }
    
    // Check for patterns that suggest specific modes
    for (const [mode, patterns] of Object.entries(THINK_TOOLS_CONFIG.DETECTION_PATTERNS)) {
      if (patterns.some(pattern => lowerContent.includes(pattern))) {
        return mode as ReasoningMode;
      }
    }
    
    // Default to Sequential thinking
    return ReasoningMode.SEQUENTIAL;
  }
  
  /**
   * Fallback formatting if processor fails
   */
  private fallbackFormatting(content: string, mode: ReasoningMode): string {
    const modeText = mode.replace(/_/g, ' ');
    let result = `${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}\n\n`;
    result += `Error processing with ${modeText} reasoning. Falling back to basic formatting.\n\n`;
    result += content;
    return result;
  }
}