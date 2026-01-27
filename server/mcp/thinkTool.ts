// File: server/mcp/thinkTool.ts
import { Request, Response } from "express";

interface ThinkToolRequest {
  task: string;
  context?: {
    options?: string[];
    requirements?: Record<string, string>;
    tools?: Record<string, string[]>;
    [key: string]: any;
  };
}

interface ToolAnalysis {
  name: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  suitability: number;
  keyCards?: string[];
}

interface ThinkToolResponse {
  recommendedTools: string[];
  analysis: Record<string, ToolAnalysis>;
  reasoning: string;
}

// General purpose analysis tools for non-card game queries
const generalToolsDatabase = [
  {
    name: "Constraint Satisfaction",
    description: "Break down complex problems into specific constraints that must be satisfied",
    strengths: ["Helps identify conflicting requirements", "Provides clear criteria for success", "Reduces complex problems to rule sets"],
    weaknesses: ["May miss creative solutions that don't fit existing rules", "Can become overly rigid", "Complexity increases with many constraints"]
  },
  {
    name: "Counterfactual Reasoning",
    description: "Explore alternative scenarios by changing key assumptions",
    strengths: ["Reveals hidden dependencies", "Tests the robustness of solutions", "Uncovers edge cases and failure modes"],
    weaknesses: ["Can lead to analysis paralysis", "May consider unrealistic scenarios", "Requires careful boundary setting"]
  },
  {
    name: "System Dynamics",
    description: "Map how different elements in a system interact over time",
    strengths: ["Reveals feedback loops and emergent behaviors", "Identifies leverage points for intervention", "Good for complex systems with many interacting parts"],
    weaknesses: ["Requires quantifiable relationships", "Can be time-intensive to model properly", "May oversimplify complex human factors"]
  },
  {
    name: "Morphological Analysis",
    description: "Identify all possible combinations of solution components",
    strengths: ["Ensures all possible combinations are considered", "Helps discover novel approaches", "Systematic and thorough"],
    weaknesses: ["Can generate too many options to evaluate", "May include many impractical combinations", "Process can be time-consuming"]
  },
  {
    name: "First Principles Reasoning",
    description: "Break down problems to their most fundamental truths and rebuilding from there",
    strengths: ["Avoids assumption-based errors", "Creates robust foundational understanding", "Can lead to breakthrough insights"],
    weaknesses: ["Time-consuming", "May be difficult to identify true first principles", "Can miss practical shortcuts"]
  },
  {
    name: "Failure Mode Analysis",
    description: "Systematically identify what could go wrong and create mitigation strategies",
    strengths: ["Improves robustness of solutions", "Anticipates problems before they occur", "Focuses on critical vulnerabilities"],
    weaknesses: ["Can create excessive risk aversion", "May miss positive opportunities", "Difficult to identify all failure modes"]
  },
  {
    name: "Causal Loop Mapping",
    description: "Visualize how variables affect each other through causal relationships",
    strengths: ["Identifies reinforcing and balancing loops", "Reveals non-obvious connections", "Helps understand system stability"],
    weaknesses: ["Can be subjective in determining causality", "May oversimplify complex relationships", "Static representation of dynamic systems"]
  },
  {
    name: "Multi-Perspective Analysis",
    description: "Analyze a problem from different stakeholder or disciplinary viewpoints",
    strengths: ["Reduces bias in analysis", "Uncovers hidden requirements and constraints", "Helps build more holistic solutions"],
    weaknesses: ["Can be time-consuming", "May introduce conflicting priorities", "Requires diverse expertise"]
  },
  {
    name: "Decision Trees",
    description: "Map out decision points and their potential consequences",
    strengths: ["Clarifies options and their outcomes", "Helps quantify uncertainties", "Makes decision process explicit"],
    weaknesses: ["Can become unwieldy with many variables", "Depends on quality of probability estimates", "May oversimplify complex decisions"]
  },
  {
    name: "Pattern Recognition",
    description: "Identify recurring patterns to understand underlying principles",
    strengths: ["Leverages existing knowledge and analogies", "Can rapidly identify likely solutions", "Works well with experiential knowledge"],
    weaknesses: ["Vulnerable to false pattern recognition", "May miss novel approaches", "Can lead to overgeneralization"]
  }
];

interface NorseCardStrategy {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  suitableAgainst: string[];
  unsuitable: string[];
  keyCards?: string[];
}

// Norse card game strategy database
const norseCardStrategies: NorseCardStrategy[] = [
  { 
    name: 'Aggro Thor', 
    description: 'Fast-paced strategy aiming to deal damage quickly',
    strengths: ['Fast wins', 'Quick damage', 'Punishes slow control decks'],
    weaknesses: ['Runs out of steam', 'Weak to board clears', 'Limited comeback options'],
    suitableAgainst: ['Control decks', 'Slow decks', 'Greedy strategies'],
    unsuitable: ['Taunt-heavy decks', 'Healing-focused strategies', 'Efficient removal'],
    keyCards: ['Thor, God of Thunder', 'Lightning Strike', 'Thunder Hammer', 'Storm Giant', 'Mjolnir']
  },
  { 
    name: 'Control Odin', 
    description: 'Value-oriented control strategy for the late game',
    strengths: ['Late game power', 'Multiple answers', 'Resource generation'],
    weaknesses: ['Slow early game', 'Weak to combo', 'Resource-intensive'],
    suitableAgainst: ['Aggro decks', 'Midrange strategies', 'Board-based decks'],
    unsuitable: ['Combo decks', 'Infinite value engines', 'Other control decks'],
    keyCards: ['Odin, the Allfather', 'Gungnir', 'Wisdom of Ages', 'Valkyrie\'s Judgment', 'Raven Spy']
  },
  { 
    name: 'Combo Loki', 
    description: 'Assemble specific card combinations for powerful effects',
    strengths: ['Explosive potential', 'Can win from nowhere', 'Inevitability'],
    weaknesses: ['Disruption-sensitive', 'Weak to aggression', 'Draw dependent'],
    suitableAgainst: ['Slow decks', 'Predictable strategies', 'Low-pressure opponents'],
    unsuitable: ['Aggro decks', 'Disruption effects', 'Hand attack'],
    keyCards: ['Loki, God of Mischief', 'Shapeshifter', 'Illusion Master', 'Chaos Magic', 'Double Agent']
  },
  { 
    name: 'Midrange Heimdall', 
    description: 'Balanced approach with consistent performance across multiple matchups',
    strengths: ['Consistent performance', 'Handles multiple matchups well', 'Balanced strategy for all situations'],
    weaknesses: ['Jack of all trades, master of none', 'No extreme power spikes', 'Predictable'],
    suitableAgainst: ['Multiple deck types', 'Most common matchups', 'Both aggro and control'],
    unsuitable: ['Combo decks', 'Extremely polarized strategies'],
    keyCards: ['Heimdall, the Watchman', 'Gjallarhorn', 'Bifrost Guardian', 'Vigilant Sentry', 'Rainbow Bridge']
  },
  { 
    name: 'Fatigue Hel', 
    description: 'Exhaust opponent\'s resources and win in the late game',
    strengths: ['Inevitability', 'Resource extension', 'Card advantage'],
    weaknesses: ['Very slow', 'Weak to OTK combos', 'Struggle against value generation'],
    suitableAgainst: ['Control decks', 'Decks with finite resources', 'Slow strategies'],
    unsuitable: ['Combo decks', 'Infinite value engines', 'Fast aggro'],
    keyCards: ['Hel, Goddess of Death', 'Soul Drain', 'Fatigue Curse', 'Eternal Winter', 'Underworld Portal']
  },
  { 
    name: 'Tempo Tyr', 
    description: 'Maintain board control through efficient trades and resource use',
    strengths: ['Board control', 'Snowball potential', 'Efficiency'],
    weaknesses: ['Recovers poorly', 'Weak to board clears', 'Limited comeback mechanics'],
    suitableAgainst: ['Aggressive decks', 'Decks that need board presence', 'Slow starters'],
    unsuitable: ['Heavy control', 'Multiple board clears', 'Decks that don\'t contest board'],
    keyCards: ['Tyr, God of Justice', 'Swift Judgment', 'Honor Bound', 'War Banner', 'Battlefield Presence']
  },
  { 
    name: 'Ramp Freya', 
    description: 'Accelerate mana/resource gain to play powerful cards early',
    strengths: ['Big threats earlier than normal', 'Late game power', 'Value over time'],
    weaknesses: ['Early game vulnerability', 'Reliance on ramp cards', 'Clunky hands possible'],
    suitableAgainst: ['Slow decks', 'Decks without hard removal', 'Fair strategies'],
    unsuitable: ['Fast aggro', 'Combo decks', 'Tempo-oriented strategies'],
    keyCards: ['Freya, Goddess of Growth', 'Fertile Land', 'Mana Spring', 'Nature\'s Blessing', 'Giant Oak']
  },
  { 
    name: 'Token Freyja', 
    description: 'Swarm strategy that summons many small minions and buffs them for overwhelming board presence',
    strengths: ['Wide board presence', 'Swarm tactics', 'Summons many small minions'],
    weaknesses: ['Weak to AoE', 'Reliance on synergy', 'Resource exhaustion'],
    suitableAgainst: ['Slow control', 'Decks with single-target removal', 'Uninteractive strategies'],
    unsuitable: ['AoE-heavy decks', 'Decks that contest board early', 'Multiple board clears'],
    keyCards: ['Freyja, Goddess of Abundance', 'Fertility Rite', 'Golden Field', 'Harvest Season', 'Animal Companion']
  },
  { 
    name: 'Miracle Bragi', 
    description: 'Draw many cards in a single turn to enable powerful combos',
    strengths: ['Explosive turns', 'Flexibility', 'Card draw engine'],
    weaknesses: ['Setup dependent', 'Vulnerable to disruption', 'Skill intensive'],
    suitableAgainst: ['Slow decks', 'Strategies without disruption', 'Predictable decks'],
    unsuitable: ['Aggressive pressure', 'Disruptive effects', 'Hand attack'],
    keyCards: ['Bragi, God of Poetry', 'Inspired Verse', 'Knowledge Seeker', 'Bard\'s Tale', 'Epic Saga']
  },
  { 
    name: 'Highlander Heimdall', 
    description: 'No duplicate cards to enable powerful effects',
    strengths: ['Powerful unique effects', 'Flexibility', 'Unpredictability'],
    weaknesses: ['Inconsistency', 'Less synergy', 'Reliance on key cards'],
    suitableAgainst: ['Fair decks', 'Strategies that can\'t handle diverse threats', 'Slow decks'],
    unsuitable: ['Hyper-focused strategies', 'Very fast decks', 'Consistent gameplans'],
    keyCards: ['Heimdall, Watcher of Worlds', 'All-Seeing Eye', 'Nine Realms Anchor', 'Singularity', 'Realm Guardian']
  },
  { 
    name: 'Sacrifice Tyr', 
    description: 'Sacrifice your own resources for greater power',
    strengths: ['Efficient value', 'Powerful effects', 'Surprising power spikes'],
    weaknesses: ['Hurt yourself to win', 'Resource management challenges', 'Can backfire'],
    suitableAgainst: ['Value-oriented decks', 'Strategies without burst damage', 'Slow games'],
    unsuitable: ['Aggressive decks', 'Burn damage', 'Fast strategies'],
    keyCards: ['Tyr, the Sacrifice', 'Blood Offering', 'Martyrdom', 'Honorable Death', 'Rebirth Phoenix']
  },
  { 
    name: 'Ragnarok', 
    description: 'Trigger the end of the world effect for ultimate power',
    strengths: ['Game-ending power', 'Inevitability', 'Late-game dominance'],
    weaknesses: ['Setup requirement', 'Slow', 'Vulnerable until ready'],
    suitableAgainst: ['Control decks', 'Slow strategies', 'Decks without counters'],
    unsuitable: ['Fast aggro', 'Combo finishers', 'Disruptive strategies'],
    keyCards: ['Ragnarok', 'Twilight of the Gods', 'World Serpent', 'Fenrir', 'Surtr\'s Flame']
  },
  { 
    name: 'Berserker', 
    description: 'Allow your minions to take damage to increase their power',
    strengths: ['Snowball potential', 'Efficient trading', 'Punishes small damage'],
    weaknesses: ['Vulnerable to hard removal', 'Self-damage risk', 'Can be awkward to activate'],
    suitableAgainst: ['Ping effects', 'Small minion strategies', 'Incremental damage'],
    unsuitable: ['Hard removal', 'Transform effects', 'OTK strategies'],
    keyCards: ['Berserker Champion', 'Battle Rage', 'Blood Fury', 'War Cry', 'Enraged Warrior']
  }
];

import { ThinkToolsSearchEnhancer } from './thinkToolsSearchEnhancer';
import { SearchService } from '../services/searchService';

export const thinkTool = async (req: Request, res: Response) => {
  try {
    const { task, context } = req.body as ThinkToolRequest;

    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }

    const taskLower = task.toLowerCase();
    
    // Check if this query needs internet search enhancement
    const needsSearchEnhancement = 
      // User explicit requests for search
      taskLower.includes('search') || 
      taskLower.includes('find information') ||
      taskLower.includes('latest') ||
      taskLower.includes('recent') ||
      taskLower.includes('current') ||
      taskLower.includes('news') ||
      taskLower.includes('online') ||
      taskLower.includes('internet') ||
      
      // Current events, facts, or specific knowledge domains
      taskLower.includes('what is') ||
      taskLower.includes('who is') ||
      taskLower.includes('how to') ||
      
      // User explicitly asks for deep search
      taskLower.includes('deep search') ||
      taskLower.includes('research');
    
    // Determine if this is a card game related query or a general query
    const isCardGameQuery = 
      taskLower.includes('deck') || 
      taskLower.includes('card') || 
      taskLower.includes('minion') || 
      taskLower.includes('spell') || 
      taskLower.includes('strategy') ||
      taskLower.includes('norse') ||
      taskLower.includes('odin') ||
      taskLower.includes('thor') ||
      taskLower.includes('loki') ||
      taskLower.includes('aggro') ||
      taskLower.includes('control') ||
      taskLower.includes('combo') ||
      taskLower.includes('midrange') ||
      taskLower.includes('tempo');
    
    // Create the base result object
    const result: ThinkToolResponse = {
      recommendedTools: [],
      analysis: {},
      reasoning: ''
    };
    
    // Enhance with search if needed and if the feature is enabled
    let searchContext = '';
    if (needsSearchEnhancement && SearchService.isEnabled()) {
      console.log(`Think Tool: Enhancing query with internet search: "${task}"`);
      
      try {
        const enhancedResult = await ThinkToolsSearchEnhancer.enhanceWithSearch(task);
        
        if (enhancedResult.searchResults && enhancedResult.searchResults.results.length > 0) {
          searchContext = enhancedResult.contextualizationSummary || '';
          console.log(`Think Tool: Successfully enhanced query with ${enhancedResult.searchResults.results.length} search results`);
        } else if (enhancedResult.searchResults.error) {
          console.log(`Think Tool: Search enhancement failed: ${enhancedResult.searchResults.error}`);
        }
      } catch (searchError) {
        console.error('Think Tool: Error during search enhancement:', searchError);
      }
    }
    
    // HANDLE GENERAL PURPOSE QUERIES (NON-CARD GAME RELATED)
    if (!isCardGameQuery) {
      // For general queries, use the generalToolsDatabase instead
      const generalOptions = context?.options || generalToolsDatabase.map(tool => tool.name);
      
      // Initialize scores for each thinking tool based on query content
      generalOptions.forEach(toolName => {
        // Find the tool in our database
        const toolInfo = generalToolsDatabase.find(t => t.name === toolName);
        
        // If we don't have info, create a basic placeholder
        if (!toolInfo) {
          result.analysis[toolName] = {
            name: toolName,
            score: 0.5, // Default score
            strengths: ['Versatile approach'],
            weaknesses: ['Limited information available'],
            suitability: 0.5
          };
          return;
        }
        
        // Calculate score based on task content matching
        let score = 0.5; // Start with neutral score
        
        // Check for specific indicators in the task
        const toolNameLower = toolName.toLowerCase();
        const description = toolInfo.description.toLowerCase();
        
        // Significant boost if the tool is explicitly mentioned
        if (taskLower.includes(toolNameLower)) {
          score += 0.3;
        }
        
        // Check if description matches task
        if (taskLower.includes(description)) {
          score += 0.2;
        }
        
        // Key patterns for different thinking tools
        const patternBoosts = {
          "Constraint Satisfaction": [
            "constraints", "requirements", "rules", "boundaries", "limits", 
            "must satisfy", "criteria", "conditions"
          ],
          "Counterfactual Reasoning": [
            "what if", "alternative", "scenario", "different outcome", "instead of",
            "could have", "would happen if", "possibilities"
          ],
          "System Dynamics": [
            "system", "interaction", "feedback", "loop", "complex", "emergent", 
            "behavior", "dynamics", "over time", "evolve"
          ],
          "Morphological Analysis": [
            "combinations", "possibilities", "matrix", "dimensions", "parameters",
            "configurations", "options", "variations", "permutations"
          ],
          "First Principles Reasoning": [
            "fundamental", "basics", "core", "foundation", "from scratch", "first principles",
            "underlying", "axioms", "ground truth", "basic truth"
          ],
          "Failure Mode Analysis": [
            "fail", "risk", "wrong", "problem", "vulnerability", "weakness",
            "break", "error", "fault", "mitigate", "prevent"
          ],
          "Causal Loop Mapping": [
            "cause", "effect", "relationship", "influence", "impact",
            "leads to", "results in", "chain", "flow", "diagram"
          ],
          "Multi-Perspective Analysis": [
            "perspective", "viewpoint", "stakeholder", "angle", "lens",
            "different views", "opinions", "interdisciplinary", "holistic" 
          ],
          "Decision Trees": [
            "decision", "option", "branch", "choice", "outcome", "consequences",
            "if-then", "probability", "likelihood", "paths"
          ],
          "Pattern Recognition": [
            "pattern", "similar", "resemblance", "analogy", "recur", "match",
            "recognition", "repeat", "previous", "historical", "examples"
          ]
        };
        
        // Apply pattern boosts
        const relevantPatterns = patternBoosts[toolName as keyof typeof patternBoosts] || [];
        relevantPatterns.forEach((pattern: string) => {
          if (taskLower.includes(pattern)) {
            score += 0.15;
          }
        });
        
        // Check if strengths match task requirements
        toolInfo.strengths.forEach(strength => {
          const strengthLower = strength.toLowerCase();
          if (taskLower.includes(strengthLower)) {
            score += 0.1;
          }
        });
        
        // Check for weaknesses in the query context
        toolInfo.weaknesses.forEach(weakness => {
          const weaknessLower = weakness.toLowerCase();
          if (taskLower.includes(weaknessLower)) {
            score -= 0.1;
          }
        });
        
        // Task type analysis - boost tools that are especially good for specific kinds of tasks
        if (taskLower.includes("analyze") || taskLower.includes("understand")) {
          if (toolName === "System Dynamics" || toolName === "Causal Loop Mapping") {
            score += 0.2;
          }
        } else if (taskLower.includes("solve") || taskLower.includes("solution")) {
          if (toolName === "Constraint Satisfaction" || toolName === "First Principles Reasoning") {
            score += 0.2;
          }
        } else if (taskLower.includes("decide") || taskLower.includes("choice")) {
          if (toolName === "Decision Trees" || toolName === "Multi-Perspective Analysis") {
            score += 0.2;
          }
        } else if (taskLower.includes("predict") || taskLower.includes("future")) {
          if (toolName === "Counterfactual Reasoning" || toolName === "System Dynamics") {
            score += 0.2;
          }
        } else if (taskLower.includes("innovate") || taskLower.includes("create") || taskLower.includes("new")) {
          if (toolName === "Morphological Analysis" || toolName === "First Principles Reasoning") {
            score += 0.2;
          }
        } else if (taskLower.includes("risk") || taskLower.includes("secure") || taskLower.includes("safe")) {
          if (toolName === "Failure Mode Analysis" || toolName === "Counterfactual Reasoning") {
            score += 0.2;
          }
        }
        
        // Calculate suitability as a normalized score between 0 and 1
        const suitability = Math.max(0, Math.min(1, score));
        
        // Add to analysis
        result.analysis[toolName] = {
          name: toolName,
          score: Number(suitability.toFixed(2)),
          strengths: toolInfo.strengths,
          weaknesses: toolInfo.weaknesses,
          suitability: Number(suitability.toFixed(2))
        };
      });
      
      // Sort tools by score
      const sortedTools = Object.values(result.analysis)
        .sort((a, b) => b.score - a.score);
      
      // Set recommended tools (top 2-4 depending on scores)
      const significantThreshold = 0.6; // Minimum score to be considered significant
      const recommendedTools = sortedTools
        .filter(tool => tool.score >= significantThreshold)
        .slice(0, 4)
        .map(tool => tool.name);
      
      result.recommendedTools = recommendedTools.length > 0 
        ? recommendedTools 
        : sortedTools.slice(0, 3).map(t => t.name); // If no tool meets threshold, recommend top 3
      
      // Generate reasoning for the recommendation
      const topTool = sortedTools[0];
      const topToolInfo = generalToolsDatabase.find(t => t.name === topTool.name);
      
      // Create a more insightful reasoning section
      result.reasoning = `For analyzing "${task}", the following thinking tools would be most effective:\n\n`;
      
      // Add details for each recommended tool
      result.recommendedTools.forEach((toolName, index) => {
        const toolInfo = generalToolsDatabase.find(t => t.name === toolName);
        const toolAnalysis = result.analysis[toolName];
        
        if (toolInfo) {
          result.reasoning += `${index + 1}. **${toolName}** (Score: ${toolAnalysis.score.toFixed(2)}): ${toolInfo.description}\n`;
          result.reasoning += `   - Strength: ${toolInfo.strengths[0]}\n`;
          
          // Add special application insights for the top tool
          if (index === 0) {
            result.reasoning += `   - Application: This approach would work well for your task because it ${
              taskLower.includes("complex") ? "handles complexity through systematic decomposition" :
              taskLower.includes("alternatives") ? "explicitly explores multiple scenarios and alternatives" :
              taskLower.includes("risk") ? "identifies potential failure points and mitigations" :
              taskLower.includes("decision") ? "maps out decision points and consequences clearly" :
              "provides a structured framework for addressing your specific needs"
            }.\n`;
          }
        }
      });
      
      // Add implementation guidance
      result.reasoning += `\nImplementation Strategy:\n`;
      result.reasoning += `1. Begin with ${result.recommendedTools[0]} to establish a solid framework\n`;
      
      if (result.recommendedTools.length > 1) {
        result.reasoning += `2. Supplement with ${result.recommendedTools[1]} to address additional dimensions\n`;
      }
      
      if (result.recommendedTools.length > 2) {
        result.reasoning += `3. Use ${result.recommendedTools[2]} to refine and validate your approach\n`;
      }
      
      result.reasoning += `\nThis combination of approaches will provide a comprehensive analysis framework for your specific needs.`;
    } 
    // HANDLE CARD GAME RELATED QUERIES
    else {
      // Use provided options if available, otherwise consider all Norse card strategies
      const options = context?.options || norseCardStrategies.map(strategy => strategy.name);
      
      // Generate analysis for each available strategy
      options.forEach(strategyName => {
        // Find the strategy in our database
        const strategyInfo = norseCardStrategies.find(s => s.name === strategyName);
        
        // If we don't have info, create a basic placeholder
        if (!strategyInfo) {
          result.analysis[strategyName] = {
            name: strategyName,
            score: 0.5, // Default score
            strengths: ['Versatile strategy'],
            weaknesses: ['Limited information available'],
            suitability: 0.5
          };
          return;
        }
        
        // Calculate score based on task content matching
        let score = 0.5; // Start with neutral score
        
        // Special initial scoring for specific query patterns
        if (taskLower.includes('consistent') || taskLower.includes('multiple matchups') || taskLower.includes('different matchups')) {
          // For consistent deck queries, give Midrange Heimdall a head start
          if (strategyName === 'Midrange Heimdall') {
            score += 0.2;
          }
        }
        
        // Special scoring for token/swarm decks
        if (taskLower.includes('small minions') || taskLower.includes('swarm') || 
            taskLower.includes('many minions') || taskLower.includes('token')) {
          if (strategyName === 'Token Freyja') {
            score += 0.5; // Direct bonus for token deck when asking for tokens
          }
        }
        
        // Special scoring for Ragnarok/end of the world
        if (taskLower.includes('end of the world') || taskLower.includes('ragnarok') || 
            taskLower.includes('twilight of the gods') || taskLower.includes('world ender')) {
          if (strategyName === 'Ragnarok') {
            score += 0.5; // Direct bonus for Ragnarok deck when asking about world ending effects
          }
        }
        
        // Check for specific indicators in the task
        const strategyNameLower = strategyName.toLowerCase();
        const description = strategyInfo.description.toLowerCase();
        
        // Significant boost if the strategy or a related keyword is explicitly mentioned
        if (taskLower.includes(strategyNameLower)) {
          score += 0.2;
        }
        
        // Check if description matches task
        if (taskLower.includes(description)) {
          score += 0.1;
        }
        
        // Check if strengths match task requirements
        strategyInfo.strengths.forEach(strength => {
          const strengthLower = strength.toLowerCase();
          if (taskLower.includes(strengthLower)) {
            score += 0.1; // Increased from 0.05 to give more weight to strengths
          }
          
          // Special case handling for common request patterns
          if ((taskLower.includes('fast') || taskLower.includes('quick')) && 
              (strengthLower.includes('fast') || strengthLower.includes('quick') || 
               strengthLower.includes('punish') || strengthLower.includes('explosive'))) {
            score += 0.2;
          }
          
          if (taskLower.includes('control') && 
              (strengthLower.includes('control') || strengthLower.includes('value') || 
               strengthLower.includes('late game'))) {
            score += 0.2;
          }
          
          // Handle token/swarm specific requests
          if ((taskLower.includes('small minions') || taskLower.includes('swarm') || 
               taskLower.includes('many minions') || taskLower.includes('token')) && 
              (strengthLower.includes('wide board') || strengthLower.includes('small minion') || 
               strengthLower.includes('token') || strategyNameLower.includes('token'))) {
            score += 0.5; // Large bonus for token strategies when asking for tokens
          }
          
          // Handle consistent/multiple matchup requests - strongly favor midrange and flexible strategies
          if ((taskLower.includes('consistent') || taskLower.includes('versatile') || 
               taskLower.includes('multiple matchups') || taskLower.includes('different matchups'))) {
            
            // Check if the strategy has keywords indicating it's good for multiple matchups
            if (strengthLower.includes('consistent') || strengthLower.includes('flexible') || 
                strengthLower.includes('versatile') || strengthLower.includes('multiple') || 
                strengthLower.includes('handles') || strategyNameLower.includes('midrange')) {
              score += 0.4; // Higher bonus for this specific pattern
            }
            
            // Direct bonus for Midrange Heimdall when asking for consistent decks
            if (strategyName === 'Midrange Heimdall') {
              score += 0.3; // Additional bonus specifically for Midrange Heimdall
            }
          }
        });
        
        // Check if the task mentions countering something this strategy is good against
        strategyInfo.suitableAgainst.forEach(counter => {
          const counterLower = counter.toLowerCase();
          if (taskLower.includes(counterLower)) {
            score += 0.15; // Increased from 0.1 to give more weight to suitable matchups
          }
          
          // Special handling for common match-up requests
          if (taskLower.includes('against control') && counterLower.includes('control')) {
            score += 0.2;
          }
          
          if (taskLower.includes('against aggro') && counterLower.includes('aggro')) {
            score += 0.2;
          }
        });
        
        // Check for negatives (things this strategy is weak against)
        strategyInfo.weaknesses.forEach(weakness => {
          if (taskLower.includes(weakness.toLowerCase())) {
            score -= 0.1; // Increased from 0.05 to penalize weaknesses more
          }
        });
        
        strategyInfo.unsuitable.forEach(unsuitable => {
          if (taskLower.includes(unsuitable.toLowerCase())) {
            score -= 0.15; // Increased from 0.1 to penalize unsuitable matchups more
          }
        });
        
        // Calculate suitability as a normalized score between 0 and 1
        const suitability = Math.max(0, Math.min(1, score));
        
        // Add to analysis
        result.analysis[strategyName] = {
          name: strategyName,
          score: Number(suitability.toFixed(2)),
          strengths: strategyInfo.strengths,
          weaknesses: strategyInfo.weaknesses,
          suitability: Number(suitability.toFixed(2)),
          keyCards: strategyInfo.keyCards
        };
      });
      
      // Sort strategies by score
      const sortedStrategies = Object.values(result.analysis)
        .sort((a, b) => b.score - a.score);
      
      // Set recommended strategies (top 1-3 depending on scores)
      const significantThreshold = 0.55; // Minimum score to be considered significant
      const recommendedStrategies = sortedStrategies
        .filter(strategy => strategy.score >= significantThreshold)
        .slice(0, 3)
        .map(strategy => strategy.name);
      
      result.recommendedTools = recommendedStrategies.length > 0 
        ? recommendedStrategies 
        : [sortedStrategies[0].name]; // If no strategy meets threshold, recommend the best one
      
      // Generate reasoning for the recommendation
      const topStrategy = sortedStrategies[0];
      const topStrategyInfo = norseCardStrategies.find(s => s.name === topStrategy.name);
      
      if (recommendedStrategies.length === 1) {
        result.reasoning = `Based on analysis of the task "${task}", ${recommendedStrategies[0]} is recommended because it ${topStrategyInfo?.description || 'best matches the requirements'}. This strategy ${topStrategy.strengths[0].toLowerCase()} which directly addresses the core needs.`;
        
        if (topStrategy.keyCards && topStrategy.keyCards.length > 0) {
          result.reasoning += ` Key cards to consider: ${topStrategy.keyCards.join(', ')}.`;
        }
      } else if (recommendedStrategies.length > 1) {
        result.reasoning = `For the task "${task}", multiple approaches could work well:\n\n` +
          `- ${recommendedStrategies[0]} (Primary): ${topStrategyInfo?.description || 'Strongest overall match'}\n` +
          `- ${recommendedStrategies.slice(1).join(', ')}: Viable alternatives depending on your specific preferences and available cards.`;
        
        if (topStrategy.keyCards && topStrategy.keyCards.length > 0) {
          result.reasoning += `\n\nFor the primary strategy, focus on these key cards: ${topStrategy.keyCards.join(', ')}.`;
        }
      } else {
        result.reasoning = `No ideal strategy was identified for "${task}". Consider clarifying your requirements or exploring different strategies entirely.`;
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Think Tool Error:", error);
    res.status(500).json({ error: "Error processing think tool request" });
  }
};