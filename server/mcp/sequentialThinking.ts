import { Request, Response } from 'express';

// Sequential Thinking Tool Types
export interface ThinkingStep {
  id: string;
  title: string;
  content: string;
  next?: string[];
}

export interface SequentialThinkingRequest {
  task: string;
  context?: {
    steps?: string[];
    customSteps?: ThinkingStep[];
  };
}

export interface SequentialThinkingResponse {
  steps: ThinkingStep[];
  reasoning: string;
}

// Norse Card Game Sequential Thinking Steps
const defaultThinkingSteps: ThinkingStep[] = [
  {
    id: 'analyze_goal',
    title: 'Analyze Goal',
    content: 'Define the specific goal of the deck or strategy. What is the primary win condition?',
    next: ['identify_meta', 'analyze_matchups']
  },
  {
    id: 'identify_meta',
    title: 'Identify Meta',
    content: 'Consider the current meta game. Which archetypes are dominant and which are fading?',
    next: ['analyze_matchups', 'select_core_cards']
  },
  {
    id: 'analyze_matchups',
    title: 'Analyze Matchups',
    content: 'Evaluate the expected matchups. Which decks will you face most often and how can you counter them?',
    next: ['select_core_cards', 'tech_choices']
  },
  {
    id: 'select_core_cards',
    title: 'Select Core Cards',
    content: 'Identify the essential cards that form the foundation of your strategy.',
    next: ['tech_choices', 'curve_considerations']
  },
  {
    id: 'tech_choices',
    title: 'Tech Choices',
    content: 'Select tech cards that address specific weaknesses or counter popular strategies.',
    next: ['curve_considerations', 'playstyle_adaptation']
  },
  {
    id: 'curve_considerations',
    title: 'Curve Considerations',
    content: 'Ensure your mana curve is appropriate for your strategy. Do you have enough early, mid, and late game options?',
    next: ['playstyle_adaptation', 'finalize_list']
  },
  {
    id: 'playstyle_adaptation',
    title: 'Playstyle Adaptation',
    content: 'Adapt your playstyle to maximize the deck\'s strengths. Are you the aggressor or defender in key matchups?',
    next: ['finalize_list']
  },
  {
    id: 'finalize_list',
    title: 'Finalize List',
    content: 'Review your final deck list and make any last adjustments before playing.',
    next: []
  }
];

// Helper function to generate a sequential thinking path
function generateThinkingPath(allSteps: ThinkingStep[], startStepId: string = 'analyze_goal', maxSteps: number = 5): ThinkingStep[] {
  const result: ThinkingStep[] = [];
  let currentStepId = startStepId;
  const visitedStepIds = new Set<string>();
  
  while (result.length < maxSteps && currentStepId) {
    // Find current step
    const currentStep = allSteps.find(step => step.id === currentStepId);
    if (!currentStep || visitedStepIds.has(currentStepId)) break;
    
    // Add to result and mark as visited
    result.push(currentStep);
    visitedStepIds.add(currentStepId);
    
    // Determine next step
    if (currentStep.next && currentStep.next.length > 0) {
      // Choose the next step that makes the most sense for progression
      // For simplicity, we'll just take the first available unvisited step
      currentStepId = currentStep.next.find(id => !visitedStepIds.has(id)) || '';
    } else {
      break;
    }
  }
  
  return result;
}

// Main API handler for sequential thinking
export const sequentialThinking = async (req: Request, res: Response) => {
  try {
    const { task, context } = req.body as SequentialThinkingRequest;
    
    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }
    
    // Determine which steps to use (default or custom)
    const thinkingSteps = context?.customSteps || defaultThinkingSteps;
    
    // Filter steps if specific ones were requested
    const filteredSteps = context?.steps 
      ? thinkingSteps.filter(step => context.steps!.includes(step.id))
      : thinkingSteps;
    
    if (filteredSteps.length === 0) {
      return res.status(400).json({ 
        error: "No valid thinking steps were found. Please provide valid step IDs." 
      });
    }
    
    // Generate a sensible sequence of steps for the task
    const stepSequence = generateThinkingPath(filteredSteps);
    
    // Provide reasoning for the sequence
    const reasoning = `For the task "${task}", I've identified a ${stepSequence.length}-step approach:\n\n` +
      `1. Start with ${stepSequence[0].title} to ${stepSequence[0].content.toLowerCase()}\n` +
      `2. Then ${stepSequence.length > 1 ? stepSequence[1].title : 'continue'} to ${stepSequence.length > 1 ? stepSequence[1].content.toLowerCase() : 'refine your strategy'}\n` +
      `3. ${stepSequence.length > 2 ? stepSequence[2].title + ' will help you ' + stepSequence[2].content.toLowerCase() : 'Continue iterating on your strategy'}\n` +
      `\nThis sequence provides a structured approach to planning your Norse card game strategy, emphasizing analysis and adaptation.`;
    
    // Prepare and send response
    const response: SequentialThinkingResponse = {
      steps: stepSequence,
      reasoning: reasoning
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error("Sequential Thinking Error:", error);
    res.status(500).json({ error: "Error processing sequential thinking request" });
  }
};