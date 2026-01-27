/**
 * ReasoningMode Enum
 * 
 * Defines the different reasoning methodologies supported by the Think Tools system.
 * These modes can be used individually or in a natural sequential flow.
 */

export enum ReasoningMode {
  SEQUENTIAL = 'SEQUENTIAL',
  TREE_OF_THOUGHTS = 'TREE_OF_THOUGHTS',
  BACKWARD_CHAINING = 'BACKWARD_CHAINING',
  CONSTRAINT_SATISFACTION = 'CONSTRAINT_SATISFACTION',
  COUNTERFACTUAL = 'COUNTERFACTUAL',
  MORPHOLOGICAL = 'MORPHOLOGICAL'
}

/**
 * Get a human-readable description of a reasoning mode
 */
export function getReasoningModeDescription(mode: ReasoningMode): string {
  const descriptions: Record<ReasoningMode, string> = {
    [ReasoningMode.SEQUENTIAL]: 
      "Step-by-step breakdown of complex problems into manageable stages",
    
    [ReasoningMode.TREE_OF_THOUGHTS]: 
      "Branch-based reasoning with multiple hypothesis exploration",
    
    [ReasoningMode.BACKWARD_CHAINING]: 
      "Start from the desired outcome and work backward to determine prerequisites",
    
    [ReasoningMode.CONSTRAINT_SATISFACTION]: 
      "Frame problems as constraint satisfaction and methodically test solutions",
    
    [ReasoningMode.COUNTERFACTUAL]: 
      "'What if' analysis that explores alternative approaches",
    
    [ReasoningMode.MORPHOLOGICAL]: 
      "Integrated analysis combining multiple reasoning approaches for comprehensive solutions"
  };
  
  return descriptions[mode] || "Unknown reasoning methodology";
}

/**
 * Get the natural order of reasoning modes for cascading analysis
 */
export function getNaturalReasoningFlow(): ReasoningMode[] {
  return [
    ReasoningMode.SEQUENTIAL,
    ReasoningMode.BACKWARD_CHAINING,
    ReasoningMode.TREE_OF_THOUGHTS,
    ReasoningMode.CONSTRAINT_SATISFACTION,
    ReasoningMode.COUNTERFACTUAL,
    ReasoningMode.MORPHOLOGICAL
  ];
}