/**
 * Example usage of the Norse Card Game Strategy Assistant
 * 
 * This demonstrates how to use the analyzeNorseCardStrategy function
 * directly within the Replit chat environment.
 */

// Function copied from aiAssistantFunction.js
async function analyzeNorseCardStrategy(query) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    // Step 1: Sequential thinking analysis
    console.log("Performing sequential thinking analysis...");
    const sequentialResponse = await fetch('http://localhost:5000/api/mcp/sequential-thinking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: query })
    });
    
    if (!sequentialResponse.ok) {
      throw new Error(`Sequential thinking API error: ${sequentialResponse.status}`);
    }
    
    const sequentialData = await sequentialResponse.json();
    
    // Step 2: Enhanced think tool analysis
    console.log("Generating deck recommendations...");
    const stepTitles = sequentialData.steps.map(step => step.title).join(", ");
    const enhancedQuery = `Based on this strategy analysis: ${query}. Key considerations: ${stepTitles}`;
    
    const thinkToolResponse = await fetch('http://localhost:5000/api/mcp/think-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: enhancedQuery })
    });
    
    if (!thinkToolResponse.ok) {
      throw new Error(`Think tool API error: ${thinkToolResponse.status}`);
    }
    
    const thinkToolData = await thinkToolResponse.json();
    
    // Step 3: Format combined output
    return formatStrategyAnalysisMarkdown(sequentialData, thinkToolData, query);
  } catch (error) {
    console.error('Error in Norse card strategy analysis:', error);
    return `**Error analyzing strategy**

I encountered an error while analyzing your strategy request: "${query}".
Please check if the server is running properly with npm run dev.`;
  }
}

function formatStrategyAnalysisMarkdown(sequentialData, thinkToolData, query) {
  // Create markdown output
  let markdown = `# Norse Card Game Strategy: ${query}\n\n`;
  
  // Part 1: Strategic Analysis
  markdown += `## Strategic Analysis\n\n`;
  
  sequentialData.steps.forEach((step, index) => {
    markdown += `### ${index + 1}. ${step.title}\n${step.content}\n\n`;
  });
  
  // Part 2: Deck Recommendations
  markdown += `## Deck Recommendations\n\n`;
  
  const recommendedDecks = thinkToolData.recommendedTools;
  recommendedDecks.forEach(deckName => {
    const deckInfo = thinkToolData.analysis[deckName];
    markdown += `### ${deckName}\n`;
    markdown += `**Strengths:** ${deckInfo.strengths.join(", ")}\n\n`;
    markdown += `**Weaknesses:** ${deckInfo.weaknesses.join(", ")}\n\n`;
    
    if (deckInfo.keyCards && deckInfo.keyCards.length > 0) {
      markdown += `**Key Cards:** ${deckInfo.keyCards.join(", ")}\n\n`;
    }
  });
  
  // Part 3: Implementation Plan
  const primaryDeck = recommendedDecks[0];
  const primaryDeckInfo = thinkToolData.analysis[primaryDeck];
  
  markdown += `## Implementation Plan\n\n`;
  markdown += `1. **Build Core:** Assemble the key cards for ${primaryDeck}\n`;
  markdown += `2. **Tech Cards:** Add counters for expected opponents\n`;
  markdown += `3. **Test:** Practice the deck against common matchups\n`;
  markdown += `4. **Refine:** Adjust based on performance and meta shifts\n\n`;
  
  if (primaryDeckInfo.keyCards && primaryDeckInfo.keyCards.length > 0) {
    markdown += `**Focus on these cards:** ${primaryDeckInfo.keyCards.join(", ")}\n\n`;
  }
  
  // Part 4: Reasoning
  markdown += `## Strategy Reasoning\n\n`;
  markdown += `${thinkToolData.reasoning}\n\n`;
  
  return markdown;
}

// Example usage with three different strategy questions
async function runExamples() {
  console.log("Running Norse Card Game Strategy Analysis examples...\n");
  
  const examples = [
    "How to build an aggressive Thor deck",
    "What's the best counter to Control Odin?",
    "I want a deck that can swarm the board with small minions"
  ];
  
  for (const example of examples) {
    console.log(`\n\nANALYZING: "${example}"\n`);
    console.log("=".repeat(50));
    const result = await analyzeNorseCardStrategy(example);
    console.log(result);
    console.log("=".repeat(50));
    console.log("\n");
  }
  
  console.log("All examples completed!");
}

// Run the examples
runExamples().catch(console.error);