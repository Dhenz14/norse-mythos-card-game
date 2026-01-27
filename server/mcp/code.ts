import { Request, Response } from 'express';

export interface CodeGenerationRequest {
  task: string;
  context?: {
    language?: string;
    codeType?: string;
    existingCode?: string;
    requirements?: string[];
  };
}

export interface CodeGenerationResponse {
  code: string;
  explanation: string;
  language: string;
}

// Sample code templates for different Norse card game tasks
const cardDefinitionTemplate = `
// Define a Norse mythology-themed card
export const myNorseCard = {
  id: 'my_norse_card_01',
  name: 'Rune of Protection',
  class: 'Neutral',
  cost: 3,
  attack: 0,
  health: 4,
  minion: true,
  collectible: true,
  rarity: 'Epic',
  effect: {
    type: 'battlecry',
    description: 'Give adjacent minions +0/+2 and "Can\'t be targeted by spells or hero powers"',
    action: (state, cardInstance) => {
      // Implementation would go here in a real application
      console.log('Rune of Protection battlecry activated');
    }
  },
  description: 'Battlecry: Give adjacent minions +0/+2 and "Can\'t be targeted by spells or hero powers"',
  flavor: 'Ancient runes of the elder gods provide powerful protection against magical attacks.'
};
`;

const cardEffectTemplate = `
// Effect implementation for a Norse mythology card
const frostGiantEffect = {
  type: 'ongoing',
  description: 'Costs (1) less for each point of damage your hero has taken',
  modifyCost: (state, cardInstance) => {
    const damageToHero = state.player.hero.maxHealth - state.player.hero.health;
    return Math.max(0, cardInstance.baseCost - damageToHero);
  }
};

export const frostGiant = {
  id: 'frost_giant_01',
  name: 'Frost Giant',
  class: 'Neutral',
  cost: 10,  // Base cost before discount
  attack: 8,
  health: 8,
  minion: true,
  collectible: true,
  rarity: 'Epic',
  effect: frostGiantEffect,
  description: 'Costs (1) less for each point of damage your hero has taken',
  flavor: 'The giants of Jotunheim grow stronger as Ragnarok approaches.'
};
`;

const deckBuildingTemplate = `
// Norse mythology-themed deck builder function
export function buildRagnarokDeck() {
  return [
    // Core survival cards
    'Shield Wall',          // Block early aggression
    'Healing Mead',         // Recover health
    'Valkyrie Protector',   // Taunt minion
    
    // Midgame control tools
    'Thunder Strike',       // AoE damage
    'Bifrost Bridge',       // Card draw
    'Rune of Binding',      // Freeze effect
    
    // Ragnarok win condition package
    'Fenrir',               // Key legendary minion
    'Jormangandr',          // Key legendary minion
    'Surtr the Destroyer',  // Key legendary minion
    'Ragnarok',             // Game-ending spell
    
    // Utility cards
    'Odin\'s Wisdom',       // Discover a spell
    'Tyr\'s Courage',       // Give a minion +3/+3
    
    // The remaining cards would be filled in based on the meta
  ];
}
`;

// Helper function to select the appropriate code template
function selectCodeTemplate(task: string, codeType?: string, language?: string): { code: string, explanation: string, language: string } {
  // Default to JavaScript/TypeScript
  const programmingLanguage = language || 'typescript';
  
  // Select template based on requested code type
  let template = '';
  let explanation = '';
  
  const taskLower = task.toLowerCase();
  
  if (codeType === 'cardDefinition' || taskLower.includes('card definition') || taskLower.includes('define a card')) {
    template = cardDefinitionTemplate;
    explanation = 'This code shows how to define a Norse mythology-themed card with properties like cost, attack, health, and special effects. The battlecry effect gives adjacent minions extra health and protection from spells.';
  } 
  else if (codeType === 'effectImplementation' || taskLower.includes('card effect') || taskLower.includes('implement effect')) {
    template = cardEffectTemplate;
    explanation = 'This code demonstrates how to implement a dynamic cost-reduction effect for a Frost Giant card inspired by Norse mythology. The cost decreases based on how much damage the player\'s hero has taken.';
  }
  else if (codeType === 'deckBuilding' || taskLower.includes('deck build') || taskLower.includes('create deck')) {
    template = deckBuildingTemplate;
    explanation = 'This code provides a function that builds a Ragnarok-themed deck, focusing on survival in the early game before unleashing powerful Norse mythology creatures to end the game.';
  }
  else {
    // Default to card definition if no specific match
    template = cardDefinitionTemplate;
    explanation = 'This code template shows a standard Norse mythology-themed card definition that you can customize for your specific needs.';
  }
  
  return {
    code: template,
    explanation,
    language: programmingLanguage
  };
}

// Main API handler for code generation
export const codeMCP = async (req: Request, res: Response) => {
  try {
    const { task, context } = req.body as CodeGenerationRequest;
    
    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }
    
    // Extract context properties with defaults
    const language = context?.language || 'typescript';
    const codeType = context?.codeType || '';
    const existingCode = context?.existingCode || '';
    
    // Generate appropriate code based on the task and context
    const result = selectCodeTemplate(task, codeType, language);
    
    // If there's existing code, add a note about integration
    if (existingCode) {
      result.explanation += '\n\nTo integrate with your existing code, you would need to adapt variable names and ensure the structure matches your current implementation.';
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Code Generation Error:", error);
    res.status(500).json({ error: "Error processing code generation request" });
  }
};