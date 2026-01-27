/**
 * Visualization Processor
 * 
 * This processor integrates with the cascading reasoning system to automatically
 * add Smithery-powered visualizations to Think Tools responses.
 */

import { IReasoningProcessor } from './reasoningProcessor';
import { ReasoningContext } from './reasoningContext';
import { ReasoningMode } from './reasoningModes';
import { THINK_TOOLS_CONFIG } from './thinkToolsConfig';
import { enhanceResponseWithVisualization } from './thinkToolsVisualization';

/**
 * Visualization Processor - a decorator for other processors
 * This follows the Decorator pattern to wrap existing processors and add visualization
 */
export class VisualizationProcessor implements IReasoningProcessor {
  private wrappedProcessor: IReasoningProcessor;
  private mode: ReasoningMode;
  
  constructor(processor: IReasoningProcessor, mode: ReasoningMode) {
    this.wrappedProcessor = processor;
    this.mode = mode;
  }
  
  canProcess(content: string, context: ReasoningContext): boolean {
    // Delegate to the wrapped processor
    return this.wrappedProcessor.canProcess(content, context);
  }
  
  process(content: string, context: ReasoningContext): string {
    // First, let the wrapped processor do its work
    const processedContent = this.wrappedProcessor.process(content, context);
    
    // Then enhance the response with a visualization
    return enhanceResponseWithVisualization(
      processedContent,
      this.mode,
      context
    );
  }
}

/**
 * Factory function to create visualization-enhanced processors
 */
export function createVisualizationEnhancedProcessor(
  processor: IReasoningProcessor, 
  mode: ReasoningMode
): IReasoningProcessor {
  return new VisualizationProcessor(processor, mode);
}