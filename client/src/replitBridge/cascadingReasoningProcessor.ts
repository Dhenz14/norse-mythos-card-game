/**
 * Cascading Reasoning Processor
 * 
 * This processor implements a natural flow between different reasoning methodologies,
 * automatically progressing from one to the next after completion.
 * 
 * The natural flow progression is:
 * 1. Sequential Thinking - Break down the problem
 * 2. Backward Chaining - Work from goal to prerequisites
 * 3. Tree of Thoughts - Explore multiple solution paths
 * 4. Constraint Satisfaction - Test against requirements
 * 5. Counterfactual Reasoning - "What if" analysis
 * 6. Morphological Reasoning - Comprehensive synthesis
 * 
 * Now enhanced with Smithery-powered visualizations to improve understanding
 * of each reasoning mode through interactive diagrams.
 */

import { IReasoningProcessor } from './reasoningProcessor';
import { ReasoningContext } from './reasoningContext';
import { ReasoningMode } from './reasoningModes';
import { THINK_TOOLS_CONFIG } from './thinkToolsConfig';
import { generateReasoningFlowDiagram } from './thinkToolsVisualization';

export class CascadingReasoningProcessor implements IReasoningProcessor {
  private processors: Record<ReasoningMode, IReasoningProcessor>;
  
  constructor(processors: Record<ReasoningMode, IReasoningProcessor>) {
    this.processors = processors;
  }
  
  canProcess(content: string, context: ReasoningContext): boolean {
    // Trigger this processor when "Use Think Tools" is mentioned without a specific mode
    return content.toLowerCase().includes('use think tools') &&
      !Object.values(ReasoningMode).some(mode => 
        content.toLowerCase().includes(`use think tools: ${mode.toLowerCase()}`));
  }
  
  process(content: string, context: ReasoningContext): string {
    // The natural order of reasoning modes
    const reasoningFlow: ReasoningMode[] = [
      ReasoningMode.SEQUENTIAL,
      ReasoningMode.BACKWARD_CHAINING,
      ReasoningMode.TREE_OF_THOUGHTS,
      ReasoningMode.CONSTRAINT_SATISFACTION,
      ReasoningMode.COUNTERFACTUAL,
      ReasoningMode.MORPHOLOGICAL
    ];
    
    // Start with activation header
    let result = `${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}\n\n`;
    
    // Add the reasoning flow visualization diagram
    result += generateReasoningFlowDiagram() + '\n\n';
    
    // Process with each reasoning mode in sequence
    reasoningFlow.forEach((mode, index) => {
      // Create a context for this specific reasoning mode
      const modeContext = new ReasoningContext(mode);
      
      // Get the processor for this mode
      const processor = this.processors[mode as keyof typeof this.processors];
      if (!processor) {
        result += `[Error: No processor found for ${String(mode)} reasoning]\n\n`;
        return;
      }
      
      // Get the appropriate emoji for this mode
      const modeEmoji = this.getEmojiForMode(mode);
      
      // Add the header for this reasoning mode
      result += `${modeEmoji} ${mode.replace('_', ' ')} ACTIVATED ${modeEmoji}\n\n`;
      
      try {
        // Process the content with this reasoning mode
        // We remove headers and footers to avoid nesting them
        const modeResult = this.processWithMode(processor, content, modeContext);
        result += this.extractMainContent(modeResult);
      } catch (error: any) {
        result += `[Error processing with ${mode}: ${error?.message || 'Unknown error'}]\n\n`;
      }
      
      // Add the completion footer for this mode
      result += `\n${modeEmoji} ${mode.replace('_', ' ')} COMPLETE ${modeEmoji}\n\n`;
      
      // Add a separator between modes (except after the last one)
      if (index < reasoningFlow.length - 1) {
        result += `${'='.repeat(50)}\n\n`;
      }
    });
    
    // Add the final completion footer
    result += `${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} INTEGRATED REASONING COMPLETE ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}\n`;
    
    return result;
  }
  
  private processWithMode(
    processor: IReasoningProcessor,
    content: string,
    context: ReasoningContext
  ): string {
    return processor.process(content, context);
  }
  
  private extractMainContent(processedContent: string): string {
    // Remove standard headers and footers to avoid nesting them
    let content = processedContent;
    
    // Remove activation header
    const activationHeader = `${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} ${THINK_TOOLS_CONFIG.HEADERS.ACTIVATION} ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}`;
    content = content.replace(activationHeader, '');
    
    // Remove mode-specific headers and footers
    Object.values(ReasoningMode).forEach(mode => {
      const modeText = mode.replace('_', ' ');
      const startPattern = new RegExp(`.*${modeText}\\s+ACTIVATED.*\\n`, 'i');
      const endPattern = new RegExp(`.*${modeText}\\s+COMPLETE.*\\n`, 'i');
      
      content = content.replace(startPattern, '');
      content = content.replace(endPattern, '');
    });
    
    // Remove completion footer
    const completionFooter = `${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION} INTEGRATED REASONING COMPLETE ${THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION}`;
    content = content.replace(completionFooter, '');
    
    return content.trim();
  }
  
  private getEmojiForMode(mode: ReasoningMode): string {
    const emojiMap: Record<ReasoningMode, string> = {
      [ReasoningMode.SEQUENTIAL]: THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL,
      [ReasoningMode.BACKWARD_CHAINING]: "🔄",
      [ReasoningMode.TREE_OF_THOUGHTS]: THINK_TOOLS_CONFIG.EMOJIS.TREE_OF_THOUGHTS,
      [ReasoningMode.CONSTRAINT_SATISFACTION]: THINK_TOOLS_CONFIG.EMOJIS.CONSTRAINT,
      [ReasoningMode.COUNTERFACTUAL]: THINK_TOOLS_CONFIG.EMOJIS.COUNTERFACTUAL,
      [ReasoningMode.MORPHOLOGICAL]: THINK_TOOLS_CONFIG.EMOJIS.ACTIVATION
    };
    
    return emojiMap[mode] || "🔄";
  }
}