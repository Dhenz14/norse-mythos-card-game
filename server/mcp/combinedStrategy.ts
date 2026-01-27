// File: server/mcp/combinedStrategy.ts
import { Request, Response } from "express";
import axios from "axios";

export interface CombinedStrategyRequest {
  task: string;
  context?: {
    options?: string[];
    requirements?: Record<string, string>;
  };
}

export interface CombinedStrategyResponse {
  sequentialAnalysis: {
    steps: Array<{
      id: string;
      title: string;
      content: string;
      next?: string[];
    }>;
    reasoning: string;
  };
  deckRecommendations: {
    recommendedTools: string[];
    analysis: Record<string, {
      name: string;
      score: number;
      strengths: string[];
      weaknesses: string[];
      suitability: number;
      keyCards?: string[];
    }>;
    reasoning: string;
  };
  actionPlan: string;
}

export const combinedStrategy = async (req: Request, res: Response) => {
  try {
    const { task, context } = req.body as CombinedStrategyRequest;

    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }

    // Step 1: Run sequential thinking analysis
    const sequentialResponse = await axios.post('http://localhost:5000/api/mcp/sequential-thinking', {
      task,
      context
    });

    const sequentialData = sequentialResponse.data;

    // Step 2: Create an enhanced task for the think tool
    const stepTitles = sequentialData.steps.map((step: any) => step.title).join(", ");
    const enhancedTask = `Based on this strategy analysis: ${task}. Key considerations: ${stepTitles}`;

    // Step 3: Run think tool with the enhanced task
    const thinkToolResponse = await axios.post('http://localhost:5000/api/mcp/think-tool', {
      task: enhancedTask,
      context
    });

    const thinkToolData = thinkToolResponse.data;

    // Step 4: Generate a combined action plan
    const actionPlan = generateActionPlan(task, sequentialData, thinkToolData);

    // Step 5: Return the combined response
    const result: CombinedStrategyResponse = {
      sequentialAnalysis: sequentialData,
      deckRecommendations: thinkToolData,
      actionPlan
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Combined Strategy Error:", error);
    res.status(500).json({ error: "Error processing combined strategy request" });
  }
};

/**
 * Generate a comprehensive action plan based on the sequential analysis and deck recommendations
 */
function generateActionPlan(
  task: string, 
  sequentialData: any, 
  thinkToolData: any
): string {
  const recommendedDecks = thinkToolData.recommendedTools;
  const primaryDeck = recommendedDecks[0];
  const primaryDeckAnalysis = thinkToolData.analysis[primaryDeck];
  
  // Build a structured action plan
  let plan = `## Strategic Action Plan: ${task}\n\n`;
  
  // Section 1: Analysis Framework
  plan += `### Analysis Framework\n`;
  sequentialData.steps.forEach((step: any, index: number) => {
    plan += `${index + 1}. **${step.title}**: ${step.content}\n`;
  });
  plan += `\n`;
  
  // Section 2: Deck Recommendations
  plan += `### Recommended Implementation\n`;
  plan += `Primary Strategy: **${primaryDeck}**\n\n`;
  plan += `* **Key Strengths**: ${primaryDeckAnalysis.strengths.join(", ")}\n`;
  plan += `* **Watch For**: ${primaryDeckAnalysis.weaknesses.join(", ")}\n`;
  plan += `* **Core Cards**: ${primaryDeckAnalysis.keyCards?.join(", ") || "No specific cards recommended"}\n\n`;
  
  if (recommendedDecks.length > 1) {
    plan += `Alternative Approaches: ${recommendedDecks.slice(1).join(", ")}\n\n`;
  }
  
  // Section 3: Implementation Steps
  plan += `### Implementation Checklist\n`;
  plan += `1. **Build Core**: Assemble the key cards for ${primaryDeck}\n`;
  plan += `2. **Tech Cards**: Add counters for expected opponents\n`;
  plan += `3. **Test**: Practice the deck against common matchups\n`;
  plan += `4. **Refine**: Adjust based on performance and meta shifts\n\n`;
  
  // Section 4: Strategic Considerations
  plan += `### Strategic Insights\n`;
  plan += thinkToolData.reasoning;
  
  return plan;
}