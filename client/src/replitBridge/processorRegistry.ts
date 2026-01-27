/**
 * Processor Registry
 * 
 * Singleton registry that manages all reasoning processors in the Think Tools system.
 * Provides a centralized way to register and retrieve processors.
 */

import { IReasoningProcessor, SequentialProcessor, TreeOfThoughtsProcessor, BackwardChainingProcessor, ConstraintSatisfactionProcessor, CounterfactualProcessor, MorphologicalProcessor } from './reasoningProcessor';
import { CascadingReasoningProcessor } from './cascadingReasoningProcessor';
import { ReasoningMode } from './reasoningModes';

export class ProcessorRegistry {
  private static instance: ProcessorRegistry;
  private processors: IReasoningProcessor[] = [];
  private processorMap: Record<ReasoningMode, IReasoningProcessor> = {} as Record<ReasoningMode, IReasoningProcessor>;
  
  private constructor() {
    // Create processor instances
    const sequentialProcessor = new SequentialProcessor();
    const treeProcessor = new TreeOfThoughtsProcessor();
    const backwardProcessor = new BackwardChainingProcessor();
    const constraintProcessor = new ConstraintSatisfactionProcessor();
    const counterfactualProcessor = new CounterfactualProcessor();
    const morphologicalProcessor = new MorphologicalProcessor();
    
    // Add processors to map
    this.processorMap[ReasoningMode.SEQUENTIAL] = sequentialProcessor;
    this.processorMap[ReasoningMode.TREE_OF_THOUGHTS] = treeProcessor;
    this.processorMap[ReasoningMode.BACKWARD_CHAINING] = backwardProcessor;
    this.processorMap[ReasoningMode.CONSTRAINT_SATISFACTION] = constraintProcessor;
    this.processorMap[ReasoningMode.COUNTERFACTUAL] = counterfactualProcessor;
    this.processorMap[ReasoningMode.MORPHOLOGICAL] = morphologicalProcessor;
    
    // Create cascading processor that uses all individual processors
    const cascadingProcessor = new CascadingReasoningProcessor(this.processorMap);
    
    // Register cascading processor first (higher priority)
    this.processors.push(cascadingProcessor);
    
    // Register individual processors
    this.processors.push(sequentialProcessor);
    this.processors.push(treeProcessor);
    this.processors.push(backwardProcessor);
    this.processors.push(constraintProcessor);
    this.processors.push(counterfactualProcessor);
    this.processors.push(morphologicalProcessor);
  }
  
  /**
   * Get the singleton instance of the processor registry
   */
  public static getInstance(): ProcessorRegistry {
    if (!ProcessorRegistry.instance) {
      ProcessorRegistry.instance = new ProcessorRegistry();
    }
    return ProcessorRegistry.instance;
  }
  
  /**
   * Register a new processor
   */
  public registerProcessor(processor: IReasoningProcessor): void {
    this.processors.push(processor);
  }
  
  /**
   * Get all registered processors
   */
  public getProcessors(): IReasoningProcessor[] {
    return this.processors;
  }
  
  /**
   * Get a processor for a specific mode
   */
  public getProcessorForMode(mode: ReasoningMode): IReasoningProcessor | undefined {
    return this.processorMap[mode];
  }
}