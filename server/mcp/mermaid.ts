import { Request, Response } from 'express';

export interface MermaidRequest {
  task: string;
  context?: {
    diagramType?: string;
    existingDiagram?: string;
  };
}

export interface MermaidResponse {
  diagram: string;
  explanation: string;
}

// Sample Mermaid diagrams for Norse card game workflows
const deckBuildingWorkflow = `
flowchart TD
  A[Define Deck Goal] --> B[Identify Key Cards]
  B --> C[Fill in Curve]
  C --> D[Test Deck]
  D --> E{Does it work?}
  E -->|Yes| F[Refine & Optimize]
  E -->|No| G[Identify Problems]
  G --> B
  F --> H[Share Deck]
`;

const cardInteractionFlow = `
flowchart LR
  A[Card Played] --> B{Has Battlecry?}
  B -->|Yes| C[Trigger Battlecry]
  B -->|No| D[Place on Board]
  C --> D
  D --> E{Has Aura?}
  E -->|Yes| F[Apply Aura Effect]
  E -->|No| G[End Turn]
  F --> G
`;

const gameStateMachine = `
stateDiagram-v2
  [*] --> PlayerTurn
  PlayerTurn --> OpponentTurn: End Turn
  OpponentTurn --> PlayerTurn: End Turn
  PlayerTurn --> GameOver: Player Life <= 0
  OpponentTurn --> GameOver: Opponent Life <= 0
  GameOver --> [*]
`;

// Helper function to select the appropriate diagram type
function selectDiagramTemplate(task: string, diagramType?: string): { diagram: string, explanation: string } {
  let diagram = '';
  let explanation = '';
  
  const taskLower = task.toLowerCase();
  
  if (diagramType === 'deckBuilding' || taskLower.includes('deck building') || taskLower.includes('build deck')) {
    diagram = deckBuildingWorkflow;
    explanation = 'This flowchart illustrates the iterative process of building a deck in a Norse mythology card game, from defining goals through testing and optimization.';
  } 
  else if (diagramType === 'cardInteraction' || taskLower.includes('card interaction') || taskLower.includes('effect trigger')) {
    diagram = cardInteractionFlow;
    explanation = 'This diagram shows the flow of actions when a card is played, including battlecry and aura effect resolution.';
  }
  else if (diagramType === 'gameState' || taskLower.includes('game state') || taskLower.includes('turn sequence')) {
    diagram = gameStateMachine;
    explanation = 'This state diagram depicts the basic game loop in a Norse mythology card game, alternating between player and opponent turns until a win condition is met.';
  }
  else {
    // Default to deck building if no specific match
    diagram = deckBuildingWorkflow;
    explanation = 'This flowchart shows a standard deck building process that you can adapt for different deck archetypes in your Norse mythology card game.';
  }
  
  return {
    diagram,
    explanation
  };
}

// Main API handler for Mermaid diagram generation
export const mermaidMCP = async (req: Request, res: Response) => {
  try {
    const { task, context } = req.body as MermaidRequest;
    
    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }
    
    // Extract context properties with defaults
    const diagramType = context?.diagramType || '';
    const existingDiagram = context?.existingDiagram || '';
    
    // Generate appropriate diagram based on the task and context
    const result = selectDiagramTemplate(task, diagramType);
    
    // If there's an existing diagram, add a note about integration
    if (existingDiagram) {
      result.explanation += '\n\nTo integrate with your existing diagram, you could add connections between the relevant components or adapt the flow to match your specific implementation.';
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Mermaid Generation Error:", error);
    res.status(500).json({ error: "Error processing Mermaid diagram generation request" });
  }
};