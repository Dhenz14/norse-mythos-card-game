/**
 * Think Tools Configuration
 * 
 * Central configuration for the Think Tools system, including
 * visual indicators, template patterns, and detection rules.
 */

import { ReasoningMode } from './reasoningModes';

export interface ThinkToolsConfig {
  EMOJIS: Record<string, string>;
  HEADERS: Record<string, string>;
  DETECTION_PATTERNS: Record<string, string[]>;
  TEMPLATES: Record<string, string>;
}

export const THINK_TOOLS_CONFIG: ThinkToolsConfig = {
  EMOJIS: {
    ACTIVATION: "🔄",
    SEQUENTIAL: "🔄",
    THINK_TOOL: "🛠️",
    PROBLEM_FRAMING: "📋",
    TREE_OF_THOUGHTS: "🌲",
    CONSTRAINT: "⚙️",
    COUNTERFACTUAL: "🔄",
    PATH_SELECTION: "🛤️"
  },
  
  HEADERS: {
    ACTIVATION: "THINK TOOLS ACTIVATED",
    SEQUENTIAL_START: "SEQUENTIAL THINKING ACTIVATED",
    SEQUENTIAL_END: "SEQUENTIAL THINKING COMPLETE",
    THINK_TOOL_START: "THINK TOOL ANALYSIS",
    THINK_TOOL_END: "THINK TOOL ANALYSIS COMPLETE",
    MORPHOLOGICAL_START: "MORPHOLOGICAL REASONING ACTIVATED",
    MORPHOLOGICAL_END: "MORPHOLOGICAL REASONING COMPLETE",
    PROBLEM_FRAMING: "PROBLEM FRAMING",
    SOLUTION_SPACE: "SOLUTION SPACE",
    CONSTRAINT_ANALYSIS: "CONSTRAINT ANALYSIS",
    COUNTERFACTUAL: "COUNTERFACTUAL EXPLORATION",
    PATH_SELECTION: "PATH SELECTION",
    TREE_OF_THOUGHTS_START: "TREE OF THOUGHTS REASONING ACTIVATED",
    TREE_OF_THOUGHTS_END: "TREE OF THOUGHTS REASONING COMPLETE",
    BACKWARD_CHAINING_START: "BACKWARD CHAINING ACTIVATED", 
    BACKWARD_CHAINING_END: "BACKWARD CHAINING COMPLETE",
    CONSTRAINT_SATISFACTION_START: "CONSTRAINT SATISFACTION ACTIVATED",
    CONSTRAINT_SATISFACTION_END: "CONSTRAINT SATISFACTION COMPLETE",
    COUNTERFACTUAL_START: "COUNTERFACTUAL REASONING ACTIVATED",
    COUNTERFACTUAL_END: "COUNTERFACTUAL REASONING COMPLETE"
  },
  
  DETECTION_PATTERNS: {
    [ReasoningMode.SEQUENTIAL]: ["step by step", "sequential", "step 1"],
    [ReasoningMode.TREE_OF_THOUGHTS]: ["branch", "tree", "possibilities", "alternatives"],
    [ReasoningMode.BACKWARD_CHAINING]: ["outcome", "goal", "backward", "work backward"],
    [ReasoningMode.CONSTRAINT_SATISFACTION]: ["constraints", "requirements", "must satisfy", "conditions"],
    [ReasoningMode.COUNTERFACTUAL]: ["what if", "alternative scenario", "instead of"],
    [ReasoningMode.MORPHOLOGICAL]: ["morphological", "integrate approaches", "combined analysis"]
  },
  
  TEMPLATES: {
    PROBLEM_FRAMING: `
📋 PROBLEM FRAMING
- Current state: [current]
- Desired outcome: [desired]
- Key constraints: [constraints]
`,
    
    SOLUTION_SPACE: `
🌲 SOLUTION SPACE
[content]
`,
    
    CONSTRAINT_ANALYSIS: `
⚙️ CONSTRAINT ANALYSIS
[content]
`,
    
    COUNTERFACTUAL: `
🔄 COUNTERFACTUAL EXPLORATION
[content]
`,
    
    PATH_SELECTION: `
🛤️ PATH SELECTION
[content]
`
  }
};