/**
 * Smithery Visualization Integration for Think Tools
 * 
 * This module provides utilities for generating Mermaid diagrams
 * for various reasoning modes in the Think Tools system. Integrates
 * with the existing Smithery service to render diagrams in the Replit chat.
 */

import { ReasoningMode } from './reasoningModes';
import { checkSmitheryStatus } from '../lib/smitheryUtils';

// Define types for visualization options
export interface VisualizationOptions {
  title?: string;
  showLabels?: boolean;
  theme?: 'default' | 'forest' | 'dark' | 'neutral';
  width?: number;
  height?: number;
}

/**
 * Check if Smithery visualization is available
 */
export async function isVisualizationAvailable(): Promise<boolean> {
  try {
    const status = await checkSmitheryStatus();
    return status.status === 'connected';
  } catch (error) {
    console.error('Error checking Smithery status:', error);
    return false;
  }
}

/**
 * Generate a Mermaid diagram for the cascading reasoning flow
 */
export function generateCascadingFlowDiagram(currentMode?: ReasoningMode, options: VisualizationOptions = {}): string {
  const { title = 'Think Tools Reasoning Flow', theme = 'default' } = options;
  
  // Define the flow with all reasoning modes
  const modes = [
    { id: 'sequential', name: 'Sequential', emoji: '🛠️' },
    { id: 'backward', name: 'Backward Chaining', emoji: '🔍' },
    { id: 'tree', name: 'Tree of Thoughts', emoji: '🌲' },
    { id: 'constraint', name: 'Constraint Satisfaction', emoji: '⚙️' },
    { id: 'counterfactual', name: 'Counterfactual', emoji: '🔀' },
    { id: 'morphological', name: 'Morphological', emoji: '🔄' }
  ];
  
  // Build the Mermaid flowchart
  let diagram = '```mermaid\n';
  diagram += `flowchart LR\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef active fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:white,font-weight:bold\n`;
  diagram += `  classDef inactive fill:#f5f5f5,stroke:#e0e0e0,stroke-width:1px,color:#333\n`;
  diagram += `  classDef next fill:#BBDEFB,stroke:#2196F3,stroke-width:1px,color:#0D47A1\n\n`;
  
  // Add nodes for each reasoning mode
  modes.forEach(mode => {
    diagram += `  ${mode.id}["${mode.emoji} ${mode.name}"]\n`;
  });
  
  diagram += '\n  %% Connections between modes\n';
  
  // Connect each mode to the next
  for (let i = 0; i < modes.length - 1; i++) {
    diagram += `  ${modes[i].id} --> ${modes[i+1].id}\n`;
  }
  
  diagram += '\n  %% Styling\n';
  
  // Apply styling based on current mode
  if (currentMode) {
    const currentIndex = modes.findIndex(m => 
      m.id === currentMode.toLowerCase().replace('_', ''));
    
    // Style all nodes
    for (let i = 0; i < modes.length; i++) {
      if (i < currentIndex) {
        // Completed modes
        diagram += `  class ${modes[i].id} inactive\n`;
      } else if (i === currentIndex) {
        // Current active mode
        diagram += `  class ${modes[i].id} active\n`;
      } else if (i === currentIndex + 1) {
        // Next mode
        diagram += `  class ${modes[i].id} next\n`;
      } else {
        // Future modes
        diagram += `  class ${modes[i].id} inactive\n`;
      }
    }
  } else {
    // If no current mode, mark all as inactive
    modes.forEach(mode => {
      diagram += `  class ${mode.id} inactive\n`;
    });
  }
  
  diagram += '```';
  return diagram;
}

/**
 * Generate a Tree of Thoughts diagram
 */
export function generateTreeOfThoughtsDiagram(
  root: string, 
  branches: Array<{ 
    id: string, 
    text: string, 
    children?: Array<{ id: string, text: string }> 
  }>,
  options: VisualizationOptions = {}
): string {
  const { title = 'Tree of Thoughts', theme = 'default' } = options;
  
  let diagram = '```mermaid\n';
  diagram += `flowchart TD\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef root fill:#E8F5E9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20,font-weight:bold\n`;
  diagram += `  classDef branch fill:#FFF8E1,stroke:#FFA000,stroke-width:1px,color:#FF6F00\n`;
  diagram += `  classDef leaf fill:#E3F2FD,stroke:#1976D2,stroke-width:1px,color:#0D47A1\n\n`;
  
  // Add root node
  diagram += `  root["🌱 ${root}"]\n\n`;
  
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
 * Generate a Constraint Satisfaction diagram
 */
export function generateConstraintSatisfactionDiagram(
  problem: string,
  constraints: string[],
  solutions: Array<{ text: string, satisfies: string[] }>,
  options: VisualizationOptions = {}
): string {
  const { title = 'Constraint Satisfaction', theme = 'default' } = options;
  
  let diagram = '```mermaid\n';
  diagram += `flowchart TD\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef problem fill:#FFEBEE,stroke:#F44336,stroke-width:2px,color:#B71C1C,font-weight:bold\n`;
  diagram += `  classDef constraint fill:#E0F7FA,stroke:#00BCD4,stroke-width:1px,color:#006064\n`;
  diagram += `  classDef solution fill:#E8F5E9,stroke:#4CAF50,stroke-width:1px,color:#1B5E20\n`;
  diagram += `  classDef satisfied fill:#C8E6C9,stroke:#4CAF50,stroke-width:2px,color:#1B5E20,font-weight:bold\n\n`;
  
  // Add problem node
  diagram += `  problem["❓ ${problem}"]\n\n`;
  
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
 * Generate a diagram for backward chaining reasoning
 */
export function generateBackwardChainingDiagram(
  goal: string,
  prerequisites: Array<{ 
    text: string, 
    fulfilled: boolean,
    subprerequisites?: Array<{ text: string, fulfilled: boolean }>
  }>,
  options: VisualizationOptions = {}
): string {
  const { title = 'Backward Chaining', theme = 'default' } = options;
  
  let diagram = '```mermaid\n';
  diagram += `flowchart RL\n`;
  diagram += `  %% Diagram configuration\n`;
  diagram += `  classDef goal fill:#F3E5F5,stroke:#9C27B0,stroke-width:2px,color:#4A148C,font-weight:bold\n`;
  diagram += `  classDef fulfilled fill:#E8F5E9,stroke:#4CAF50,stroke-width:1px,color:#1B5E20\n`;
  diagram += `  classDef unfulfilled fill:#FFEBEE,stroke:#F44336,stroke-width:1px,color:#B71C1C\n`;
  diagram += `  classDef subprereq fill:#E3F2FD,stroke:#1976D2,stroke-width:1px,color:#0D47A1\n\n`;
  
  // Add goal node
  diagram += `  goal["🎯 ${goal}"]\n\n`;
  
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
 * Integrate a visualization into a Think Tools response
 */
export function integrateVisualization(response: string, visualization: string): string {
  // If the response already has a Mermaid diagram, don't add another one
  if (response.includes('```mermaid')) {
    return response;
  }
  
  // Find where to insert the visualization
  const activationHeader = response.includes('THINK TOOLS ACTIVATION') ? 
    'THINK TOOLS ACTIVATION' : 'Think Tools Analysis';
  
  // Insert after the activation header
  const parts = response.split(activationHeader);
  if (parts.length < 2) {
    // If we can't find an appropriate place, append to the end
    return response + '\n\n' + visualization;
  }
  
  return parts[0] + activationHeader + parts[1].split('\n')[0] + '\n\n' + visualization + '\n\n' + parts[1].split('\n').slice(1).join('\n');
}