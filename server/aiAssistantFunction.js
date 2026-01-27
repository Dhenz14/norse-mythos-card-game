/**
 * Norse Card Game Strategy Analysis Function
 * 
 * This function can be directly copied into Replit AI's execution environment
 * to provide strategy analysis capabilities within the chat interface.
 * 
 * To use this, the server must be running (npm run dev).
 */

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

// Example usage:
// analyzeNorseCardStrategy("How to counter Control Odin").then(console.log);