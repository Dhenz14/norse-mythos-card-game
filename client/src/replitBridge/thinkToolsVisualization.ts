/**
 * Think Tools Visualization Integration
 * 
 * This module integrates Smithery visualization capabilities with the Think Tools
 * cascading reasoning system, providing automatic diagram generation for each
 * reasoning mode in the natural flow:
 * 
 * Sequential → Backward Chaining → Tree of Thoughts → Constraint Satisfaction → 
 * Counterfactual → Morphological
 * 
 * Each visualization is designed to enhance understanding of the specific
 * reasoning mode and its outputs.
 */

import { ReasoningMode } from './reasoningModes';
import { THINK_TOOLS_CONFIG } from './thinkToolsConfig';
import { ReasoningContext } from './reasoningContext';

/**
 * Generate a Mermaid diagram for the cascading reasoning flow
 */
export function generateReasoningFlowDiagram(currentMode?: ReasoningMode): string {
  // Define the flow with all reasoning modes and their emojis from config
  const modes = [
    { id: ReasoningMode.SEQUENTIAL, name: 'Sequential', emoji: THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL },
    { id: ReasoningMode.BACKWARD_CHAINING, name: 'Backward Chaining', emoji: THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL },
    { id: ReasoningMode.TREE_OF_THOUGHTS, name: 'Tree of Thoughts', emoji: THINK_TOOLS_CONFIG.EMOJIS.TREE_OF_THOUGHTS },
    { id: ReasoningMode.CONSTRAINT_SATISFACTION, name: 'Constraint Satisfaction', emoji: THINK_TOOLS_CONFIG.EMOJIS.CONSTRAINT },
    { id: ReasoningMode.COUNTERFACTUAL, name: 'Counterfactual', emoji: THINK_TOOLS_CONFIG.EMOJIS.COUNTERFACTUAL },
    { id: ReasoningMode.MORPHOLOGICAL, name: 'Morphological', emoji: THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL }
  ];
  
  // Build the Mermaid flowchart
  let diagram = '```mermaid\n';
  diagram += `flowchart LR\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef active fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:white,font-weight:bold\n`;
  diagram += `  classDef completed fill:#E8F5E9,stroke:#4CAF50,stroke-width:1px,color:#1B5E20\n`;
  diagram += `  classDef next fill:#BBDEFB,stroke:#2196F3,stroke-width:1px,color:#0D47A1\n`;
  diagram += `  classDef pending fill:#f5f5f5,stroke:#e0e0e0,stroke-width:1px,color:#9E9E9E\n\n`;
  
  // Add nodes for each reasoning mode
  modes.forEach(mode => {
    const modeId = mode.id.toLowerCase().replace(/_/g, '');
    diagram += `  ${modeId}["${mode.emoji} ${mode.name}"]\n`;
  });
  
  diagram += '\n  %% Connections between modes\n';
  
  // Connect each mode to the next
  for (let i = 0; i < modes.length - 1; i++) {
    const currentId = modes[i].id.toLowerCase().replace(/_/g, '');
    const nextId = modes[i+1].id.toLowerCase().replace(/_/g, '');
    diagram += `  ${currentId} --> ${nextId}\n`;
  }
  
  diagram += '\n  %% Styling\n';
  
  // Apply styling based on current mode
  if (currentMode) {
    const currentModeStr = currentMode.toString();
    const currentIndex = modes.findIndex(m => m.id === currentModeStr);
    
    // Style all nodes
    for (let i = 0; i < modes.length; i++) {
      const modeId = modes[i].id.toLowerCase().replace(/_/g, '');
      
      if (i < currentIndex) {
        // Completed modes
        diagram += `  class ${modeId} completed\n`;
      } else if (i === currentIndex) {
        // Current active mode
        diagram += `  class ${modeId} active\n`;
      } else if (i === currentIndex + 1) {
        // Next mode
        diagram += `  class ${modeId} next\n`;
      } else {
        // Future modes
        diagram += `  class ${modeId} pending\n`;
      }
    }
  } else {
    // If no current mode, mark all as pending
    modes.forEach(mode => {
      const modeId = mode.id.toLowerCase().replace(/_/g, '');
      diagram += `  class ${modeId} pending\n`;
    });
  }
  
  diagram += '```';
  return diagram;
}

/**
 * Generate a Tree of Thoughts diagram based on a reasoning context
 */
export function generateTreeOfThoughtsVisualization(context: ReasoningContext): string {
  // Extract the relevant information from the context
  // In a real implementation, this would parse the context and extract the tree structure
  
  const problem = context.getOriginalContent() || 'Problem Analysis';
  
  // Example structure - in real implementation, this would be extracted from context
  const root = 'Problem: ' + problem.slice(0, 50) + (problem.length > 50 ? '...' : '');
  
  const branches = [
    {
      id: '1',
      text: 'Approach 1: Direct Solution',
      children: [
        { id: '1-1', text: 'Implementation A: Using existing components' },
        { id: '1-2', text: 'Implementation B: Building custom solution' }
      ]
    },
    {
      id: '2',
      text: 'Approach 2: Alternative Strategy',
      children: [
        { id: '2-1', text: 'Implementation C: Third-party integration' },
        { id: '2-2', text: 'Implementation D: Hybrid approach' }
      ]
    },
    {
      id: '3',
      text: 'Approach 3: Innovative Solution',
      children: [
        { id: '3-1', text: 'Implementation E: Novel architecture' }
      ]
    }
  ];
  
  // Build the Mermaid diagram
  let diagram = '```mermaid\n';
  diagram += `flowchart TD\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef root fill:#E8F5E9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20,font-weight:bold\n`;
  diagram += `  classDef branch fill:#FFF8E1,stroke:#FFA000,stroke-width:1px,color:#FF6F00\n`;
  diagram += `  classDef leaf fill:#E3F2FD,stroke:#1976D2,stroke-width:1px,color:#0D47A1\n\n`;
  
  // Add root node
  diagram += `  root["${THINK_TOOLS_CONFIG.EMOJIS.TREE_OF_THOUGHTS} ${root}"]\n\n`;
  
  // Add branches and connections
  branches.forEach(branch => {
    diagram += `  branch_${branch.id}["${branch.text}"]\n`;
    diagram += `  root --> branch_${branch.id}\n`;
    
    // Add children of this branch if any
    if (branch.children && branch.children.length > 0) {
      branch.children.forEach(child => {
        diagram += `  leaf_${child.id}["${child.text}"]\n`;
        diagram += `  branch_${branch.id} --> leaf_${child.id}\n`;
      });
      diagram += '\n';
    }
  });
  
  // Apply styling
  diagram += '\n  %% Styling\n';
  diagram += '  class root root\n';
  
  branches.forEach(branch => {
    diagram += `  class branch_${branch.id} branch\n`;
    
    if (branch.children && branch.children.length > 0) {
      branch.children.forEach(child => {
        diagram += `  class leaf_${child.id} leaf\n`;
      });
    }
  });
  
  diagram += '```';
  return diagram;
}

/**
 * Generate a Backward Chaining visualization based on a reasoning context
 */
export function generateBackwardChainingVisualization(context: ReasoningContext): string {
  // Extract goal and prerequisites from context
  const content = context.getOriginalContent() || '';
  const goal = content.length > 50 ? content.slice(0, 50) + '...' : content;
  
  // Example prerequisites - in a real implementation these would be extracted from context
  const prerequisites = [
    {
      text: 'Database Integration',
      fulfilled: true,
      subprerequisites: [
        { text: 'Schema Design', fulfilled: true },
        { text: 'Migration System', fulfilled: true },
        { text: 'Data Access Layer', fulfilled: true }
      ]
    },
    {
      text: 'UI Components',
      fulfilled: false,
      subprerequisites: [
        { text: 'Base Controls', fulfilled: true },
        { text: 'Themed Elements', fulfilled: false },
        { text: 'Responsive Layout', fulfilled: false }
      ]
    },
    {
      text: 'Authentication System',
      fulfilled: false,
      subprerequisites: [
        { text: 'User Database', fulfilled: true },
        { text: 'Token Management', fulfilled: false }
      ]
    }
  ];
  
  // Build the Mermaid diagram
  let diagram = '```mermaid\n';
  diagram += `flowchart RL\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef goal fill:#F3E5F5,stroke:#9C27B0,stroke-width:2px,color:#4A148C,font-weight:bold\n`;
  diagram += `  classDef fulfilled fill:#E8F5E9,stroke:#4CAF50,stroke-width:1px,color:#1B5E20\n`;
  diagram += `  classDef unfulfilled fill:#FFEBEE,stroke:#F44336,stroke-width:1px,color:#B71C1C\n\n`;
  
  // Add goal node
  diagram += `  goal["${THINK_TOOLS_CONFIG.EMOJIS.THINK_TOOL} ${goal}"]\n\n`;
  
  // Add prerequisite nodes and connect to goal
  prerequisites.forEach((prereq, index) => {
    const fulfillmentIcon = prereq.fulfilled ? '✅' : '❌';
    diagram += `  prereq_${index}["${fulfillmentIcon} ${prereq.text}"]\n`;
    diagram += `  prereq_${index} --> goal\n`;
    
    // Add sub-prerequisites if any
    if (prereq.subprerequisites && prereq.subprerequisites.length > 0) {
      prereq.subprerequisites.forEach((subPrereq, subIndex) => {
        const subFulfillmentIcon = subPrereq.fulfilled ? '✅' : '❌';
        diagram += `  subprereq_${index}_${subIndex}["${subFulfillmentIcon} ${subPrereq.text}"]\n`;
        diagram += `  subprereq_${index}_${subIndex} --> prereq_${index}\n`;
      });
    }
  });
  
  // Apply styling
  diagram += '\n  %% Styling\n';
  diagram += '  class goal goal\n';
  
  prerequisites.forEach((prereq, index) => {
    diagram += `  class prereq_${index} ${prereq.fulfilled ? 'fulfilled' : 'unfulfilled'}\n`;
    
    // Style sub-prerequisites if any
    if (prereq.subprerequisites && prereq.subprerequisites.length > 0) {
      prereq.subprerequisites.forEach((subPrereq, subIndex) => {
        diagram += `  class subprereq_${index}_${subIndex} ${subPrereq.fulfilled ? 'fulfilled' : 'unfulfilled'}\n`;
      });
    }
  });
  
  diagram += '```';
  return diagram;
}

/**
 * Generate a Constraint Satisfaction visualization based on a reasoning context
 */
export function generateConstraintSatisfactionVisualization(context: ReasoningContext): string {
  // Extract problem and constraints from context
  const content = context.getOriginalContent() || '';
  const problem = content.length > 50 ? content.slice(0, 50) + '...' : content;
  
  // Example constraints and solutions - would be extracted from context in real implementation
  const constraints = [
    'Must maintain backward compatibility',
    'Must handle high traffic loads',
    'Must have comprehensive test coverage',
    'Must meet accessibility standards'
  ];
  
  const solutions = [
    {
      text: 'Solution A: Enhanced current implementation',
      satisfies: [
        'Must maintain backward compatibility',
        'Must handle high traffic loads'
      ]
    },
    {
      text: 'Solution B: Complete redesign with legacy adapter',
      satisfies: [
        'Must maintain backward compatibility',
        'Must handle high traffic loads',
        'Must have comprehensive test coverage',
        'Must meet accessibility standards'
      ]
    },
    {
      text: 'Solution C: Hybrid approach with partial refactoring',
      satisfies: [
        'Must maintain backward compatibility',
        'Must meet accessibility standards'
      ]
    }
  ];
  
  // Build the Mermaid diagram
  let diagram = '```mermaid\n';
  diagram += `flowchart TD\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef problem fill:#FFEBEE,stroke:#F44336,stroke-width:2px,color:#B71C1C,font-weight:bold\n`;
  diagram += `  classDef constraint fill:#E0F7FA,stroke:#00BCD4,stroke-width:1px,color:#006064\n`;
  diagram += `  classDef solution fill:#E8F5E9,stroke:#4CAF50,stroke-width:1px,color:#1B5E20\n`;
  diagram += `  classDef satisfied fill:#C8E6C9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20,font-weight:bold\n\n`;
  
  // Add problem node
  diagram += `  problem["${THINK_TOOLS_CONFIG.EMOJIS.CONSTRAINT} ${problem}"]\n\n`;
  
  // Add constraint nodes
  constraints.forEach((constraint, index) => {
    diagram += `  constraint_${index}["🔒 ${constraint}"]\n`;
    diagram += `  problem --> constraint_${index}\n`;
  });
  
  diagram += '\n';
  
  // Add solution nodes and connections to constraints they satisfy
  solutions.forEach((solution, sIndex) => {
    diagram += `  solution_${sIndex}["✅ ${solution.text}"]\n`;
    
    // Connect solutions to the constraints they satisfy
    solution.satisfies.forEach(constraintText => {
      const cIndex = constraints.findIndex(c => c === constraintText);
      if (cIndex >= 0) {
        diagram += `  constraint_${cIndex} --> solution_${sIndex}\n`;
      }
    });
  });
  
  // Apply styling
  diagram += '\n  %% Styling\n';
  diagram += '  class problem problem\n';
  
  constraints.forEach((_, index) => {
    diagram += `  class constraint_${index} constraint\n`;
  });
  
  solutions.forEach((solution, index) => {
    if (solution.satisfies.length === constraints.length) {
      // If this solution satisfies all constraints, give it special styling
      diagram += `  class solution_${index} satisfied\n`;
    } else {
      diagram += `  class solution_${index} solution\n`;
    }
  });
  
  diagram += '```';
  return diagram;
}

/**
 * Generate a Counterfactual Reasoning visualization based on a reasoning context
 */
export function generateCounterfactualVisualization(context: ReasoningContext): string {
  // Extract base scenario from context
  const content = context.getOriginalContent() || '';
  const baseScenario = content.length > 50 ? content.slice(0, 50) + '...' : content;
  
  // Example counterfactual scenarios - would be extracted from context in real implementation
  const scenarios = [
    {
      condition: 'If we use a NoSQL database instead',
      outcome: 'Better scalability but less consistency guarantee',
      probability: 'high'
    },
    {
      condition: 'If we implement server-side rendering',
      outcome: 'Improved initial load time but increased server load',
      probability: 'medium'
    },
    {
      condition: 'If we switch to a microservices architecture',
      outcome: 'Better service isolation but increased operational complexity',
      probability: 'medium'
    },
    {
      condition: 'If we adopt a new UI framework',
      outcome: 'Modern features but significant retraining and migration costs',
      probability: 'low'
    }
  ];
  
  // Build the Mermaid diagram
  let diagram = '```mermaid\n';
  diagram += `flowchart TD\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef base fill:#E8F5E9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20,font-weight:bold\n`;
  diagram += `  classDef highProb fill:#E3F2FD,stroke:#1976D2,stroke-width:1px,color:#0D47A1\n`;
  diagram += `  classDef mediumProb fill:#FFF8E1,stroke:#FFA000,stroke-width:1px,color:#FF6F00\n`;
  diagram += `  classDef lowProb fill:#FFEBEE,stroke:#F44336,stroke-width:1px,color:#B71C1C\n\n`;
  
  // Add base scenario node
  diagram += `  base["${THINK_TOOLS_CONFIG.EMOJIS.COUNTERFACTUAL} Base: ${baseScenario}"]\n\n`;
  
  // Add counterfactual scenarios
  scenarios.forEach((scenario, index) => {
    diagram += `  cf_${index}["What if: ${scenario.condition}"]\n`;
    diagram += `  cf_${index}_outcome["Outcome: ${scenario.outcome}"]\n`;
    diagram += `  base --> cf_${index}\n`;
    diagram += `  cf_${index} --> cf_${index}_outcome\n`;
  });
  
  // Apply styling
  diagram += '\n  %% Styling\n';
  diagram += '  class base base\n';
  
  scenarios.forEach((scenario, index) => {
    let probabilityClass = '';
    switch (scenario.probability) {
      case 'high':
        probabilityClass = 'highProb';
        break;
      case 'medium':
        probabilityClass = 'mediumProb';
        break;
      case 'low':
        probabilityClass = 'lowProb';
        break;
      default:
        probabilityClass = 'mediumProb';
    }
    
    diagram += `  class cf_${index} ${probabilityClass}\n`;
    diagram += `  class cf_${index}_outcome ${probabilityClass}\n`;
  });
  
  diagram += '```';
  return diagram;
}

/**
 * Generate a Morphological Analysis visualization based on a reasoning context
 */
export function generateMorphologicalVisualization(context: ReasoningContext): string {
  // Extract problem from context
  const content = context.getOriginalContent() || '';
  const problem = content.length > 50 ? content.slice(0, 50) + '...' : content;
  
  // Example dimensions and options - would be extracted from context in real implementation
  const dimensions = [
    {
      name: 'Technology Stack',
      options: ['MERN', 'LAMP', 'JAMstack', 'Custom']
    },
    {
      name: 'Data Storage',
      options: ['SQL', 'NoSQL', 'Hybrid', 'Serverless']
    },
    {
      name: 'Deployment Model',
      options: ['Self-hosted', 'Cloud (PaaS)', 'Serverless', 'Containerized']
    },
    {
      name: 'Authentication',
      options: ['JWT', 'OAuth', 'Session-based', 'Passwordless']
    }
  ];
  
  // Selected combination
  const selectedOptions = {
    'Technology Stack': 'MERN',
    'Data Storage': 'Hybrid',
    'Deployment Model': 'Containerized',
    'Authentication': 'OAuth'
  };
  
  // Build the Mermaid diagram
  let diagram = '```mermaid\n';
  diagram += `%%{init: {'theme': 'neutral', 'themeVariables': { 'fontSize': '16px'}}}%%\n`;
  diagram += `flowchart TD\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef problem fill:#E8F5E9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20,font-weight:bold\n`;
  diagram += `  classDef dimension fill:#E3F2FD,stroke:#1976D2,stroke-width:1px,color:#0D47A1\n`;
  diagram += `  classDef option fill:#f5f5f5,stroke:#9E9E9E,stroke-width:1px,color:#212121\n`;
  diagram += `  classDef selected fill:#C8E6C9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20,font-weight:bold\n\n`;
  
  // Add root problem node
  diagram += `  problem["${THINK_TOOLS_CONFIG.EMOJIS.SEQUENTIAL} ${problem}"]\n\n`;
  
  // Add dimensions and their options
  dimensions.forEach((dimension, dIndex) => {
    // Add dimension node
    diagram += `  dim_${dIndex}["${dimension.name}"]\n`;
    diagram += `  problem --> dim_${dIndex}\n`;
    
    // Add options for this dimension
    dimension.options.forEach((option, oIndex) => {
      diagram += `  opt_${dIndex}_${oIndex}["${option}"]\n`;
      diagram += `  dim_${dIndex} --> opt_${dIndex}_${oIndex}\n`;
    });
    
    diagram += '\n';
  });
  
  // Apply styling
  diagram += '\n  %% Styling\n';
  diagram += '  class problem problem\n';
  
  dimensions.forEach((dimension, dIndex) => {
    diagram += `  class dim_${dIndex} dimension\n`;
    
    // Style options, highlighting selected ones
    dimension.options.forEach((option, oIndex) => {
      if (selectedOptions[dimension.name] === option) {
        diagram += `  class opt_${dIndex}_${oIndex} selected\n`;
      } else {
        diagram += `  class opt_${dIndex}_${oIndex} option\n`;
      }
    });
  });
  
  diagram += '```';
  return diagram;
}

/**
 * Generate the appropriate visualization for a specific reasoning mode
 */
export function generateVisualizationForMode(mode: ReasoningMode, context: ReasoningContext): string {
  switch (mode) {
    case ReasoningMode.SEQUENTIAL:
      return generateReasoningFlowDiagram(mode);
    case ReasoningMode.BACKWARD_CHAINING:
      return generateBackwardChainingVisualization(context);
    case ReasoningMode.TREE_OF_THOUGHTS:
      return generateTreeOfThoughtsVisualization(context);
    case ReasoningMode.CONSTRAINT_SATISFACTION:
      return generateConstraintSatisfactionVisualization(context);
    case ReasoningMode.COUNTERFACTUAL:
      return generateCounterfactualVisualization(context);
    case ReasoningMode.MORPHOLOGICAL:
      return generateMorphologicalVisualization(context);
    default:
      return generateReasoningFlowDiagram();
  }
}

/**
 * Insert the appropriate visualization into a response based on reasoning mode
 */
export function enhanceResponseWithVisualization(
  response: string, 
  mode: ReasoningMode, 
  context: ReasoningContext
): string {
  // Generate the appropriate visualization
  const visualization = generateVisualizationForMode(mode, context);
  
  // If the response already has a Mermaid diagram, don't add another one
  if (response.includes('```mermaid')) {
    return response;
  }
  
  // Find the header for this reasoning mode
  let headerToFind = '';
  switch (mode) {
    case ReasoningMode.SEQUENTIAL:
      headerToFind = THINK_TOOLS_CONFIG.HEADERS.SEQUENTIAL_START;
      break;
    case ReasoningMode.BACKWARD_CHAINING:
      headerToFind = THINK_TOOLS_CONFIG.HEADERS.BACKWARD_CHAINING_START;
      break;
    case ReasoningMode.TREE_OF_THOUGHTS:
      headerToFind = THINK_TOOLS_CONFIG.HEADERS.TREE_OF_THOUGHTS_START;
      break;
    case ReasoningMode.CONSTRAINT_SATISFACTION:
      headerToFind = THINK_TOOLS_CONFIG.HEADERS.CONSTRAINT_SATISFACTION_START;
      break;
    case ReasoningMode.COUNTERFACTUAL:
      headerToFind = THINK_TOOLS_CONFIG.HEADERS.COUNTERFACTUAL_START;
      break;
    case ReasoningMode.MORPHOLOGICAL:
      headerToFind = THINK_TOOLS_CONFIG.HEADERS.MORPHOLOGICAL_START;
      break;
    default:
      headerToFind = THINK_TOOLS_CONFIG.HEADERS.ACTIVATION;
  }
  
  // Try to insert after the header
  const headerIndex = response.indexOf(headerToFind);
  if (headerIndex !== -1) {
    // Find the end of the line containing the header
    const endOfLine = response.indexOf('\n', headerIndex);
    if (endOfLine !== -1) {
      // Insert after the header line
      return response.slice(0, endOfLine + 1) + 
             '\n' + visualization + '\n\n' + 
             response.slice(endOfLine + 1);
    }
  }
  
  // If we couldn't find the header or the end of the line,
  // insert at the beginning after the activation header
  const activationHeader = THINK_TOOLS_CONFIG.HEADERS.ACTIVATION;
  const activationIndex = response.indexOf(activationHeader);
  
  if (activationIndex !== -1) {
    const endOfActivationLine = response.indexOf('\n', activationIndex);
    if (endOfActivationLine !== -1) {
      return response.slice(0, endOfActivationLine + 1) + 
             '\n' + visualization + '\n\n' + 
             response.slice(endOfActivationLine + 1);
    }
  }
  
  // If all else fails, append to the end
  return response + '\n\n' + visualization;
}