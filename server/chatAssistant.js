/**
 * Norse Card Game Strategy Chat Assistant
 * 
 * This script provides a conversational interface for Norse card game strategy analysis.
 * It uses sequential thinking for analysis, then the think tool for actionable recommendations.
 * 
 * Usage directly in Replit:
 * 1. Start the server with `npm run dev`
 * 2. In a separate terminal, run: `node server/chatAssistant.js`
 * 3. Type your strategy question and press Enter
 * 4. The assistant will analyze and provide recommendations
 */

const readline = require('readline');
const fetch = require('node-fetch');
const chalk = require('chalk');

// Create interface for reading from stdin and writing to stdout
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for formatting
const colors = {
  title: chalk.bold.blue,
  section: chalk.bold.green,
  subsection: chalk.cyan,
  highlight: chalk.yellow,
  important: chalk.bold.red,
  normal: chalk.white,
  dim: chalk.gray
};

/**
 * Display welcome message
 */
function showWelcome() {
  console.clear();
  console.log(colors.title('⚔️  NORSE MYTHOLOGY CARD GAME STRATEGY ASSISTANT ⚔️'));
  console.log(colors.normal('-'.repeat(60)));
  console.log(colors.normal('Ask a question about deck building, countering strategies,'));
  console.log(colors.normal('or how to optimize your gameplay with Norse mythology cards.'));
  console.log(colors.normal('Type "exit" to quit.'));
  console.log(colors.normal('-'.repeat(60)));
}

/**
 * Perform sequential thinking analysis on a user query
 */
async function runSequentialThinking(query) {
  try {
    console.log(colors.section('\n🔍 ANALYZING YOUR QUESTION...'));
    
    const response = await fetch('http://localhost:5000/api/mcp/sequential-thinking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: query }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(colors.important('Error in sequential thinking:'), error);
    return null;
  }
}

/**
 * Get deck recommendations based on analysis
 */
async function runThinkTool(query, sequentialData) {
  try {
    console.log(colors.section('\n💡 GENERATING RECOMMENDATIONS...'));
    
    // Enhance the query with analysis insights if available
    let enhancedQuery = query;
    if (sequentialData && sequentialData.steps) {
      const steps = sequentialData.steps.map(step => step.title).join(", ");
      enhancedQuery = `Based on this strategy analysis: ${query}. Key considerations: ${steps}`;
    }
    
    const response = await fetch('http://localhost:5000/api/mcp/think-tool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: enhancedQuery }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(colors.important('Error in think tool:'), error);
    return null;
  }
}

/**
 * Display sequential thinking results
 */
function displaySequentialThinking(data) {
  console.log(colors.section('\n📋 STRATEGIC ANALYSIS FRAMEWORK'));
  
  data.steps.forEach((step, index) => {
    console.log(colors.subsection(`\nStep ${index + 1}: ${step.title}`));
    console.log(colors.normal(step.content));
  });
  
  console.log(colors.subsection('\nReasoning:'));
  console.log(colors.normal(data.reasoning));
}

/**
 * Display deck recommendations
 */
function displayRecommendations(data, query) {
  console.log(colors.section('\n🎯 RECOMMENDED DECKS'));
  
  // Display recommended decks
  data.recommendedTools.forEach(deckName => {
    const deckInfo = data.analysis[deckName];
    console.log(colors.subsection(`\n${deckName}`));
    console.log(colors.highlight('Strengths:'));
    deckInfo.strengths.forEach(strength => console.log(`  • ${colors.normal(strength)}`));
    
    console.log(colors.highlight('Weaknesses:'));
    deckInfo.weaknesses.forEach(weakness => console.log(`  • ${colors.normal(weakness)}`));
    
    if (deckInfo.keyCards && deckInfo.keyCards.length > 0) {
      console.log(colors.highlight('Key Cards:'));
      console.log(`  ${colors.normal(deckInfo.keyCards.join(', '))}`);
    }
  });
  
  console.log(colors.subsection('\nReasoning:'));
  console.log(colors.normal(data.reasoning));
}

/**
 * Generate and display an implementation plan
 */
function displayImplementationPlan(sequentialData, thinkToolData, query) {
  // Get the primary recommended deck
  const primaryDeck = thinkToolData.recommendedTools[0];
  const deckInfo = thinkToolData.analysis[primaryDeck];
  
  console.log(colors.section('\n🛠️  IMPLEMENTATION PLAN'));
  console.log(colors.normal(`For your query: "${query}"`));
  
  console.log(colors.subsection('\nBuild Strategy:'));
  console.log(colors.normal(`1. Build core elements of ${primaryDeck} deck`));
  console.log(colors.normal('2. Add tech cards to counter common threats'));
  console.log(colors.normal('3. Test against key matchups to refine strategy'));
  console.log(colors.normal('4. Adjust based on meta shifts and performance'));
  
  console.log(colors.subsection('\nKey Cards to Acquire:'));
  if (deckInfo.keyCards && deckInfo.keyCards.length > 0) {
    deckInfo.keyCards.forEach(card => console.log(`  • ${colors.normal(card)}`));
  } else {
    console.log(colors.normal('  No specific cards recommended'));
  }
  
  console.log(colors.subsection('\nAnalysis Highlights:'));
  sequentialData.steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${colors.highlight(step.title)}`);
  });
}

/**
 * Main assistant function
 */
async function runAssistant() {
  showWelcome();
  
  // Start the conversation loop
  rl.question(colors.highlight('\nWhat strategy would you like to analyze? '), async (query) => {
    // Handle exit command
    if (query.toLowerCase() === 'exit') {
      console.log(colors.normal('\nThank you for using the Norse Card Game Strategy Assistant!'));
      rl.close();
      return;
    }
    
    console.log(colors.dim('\nProcessing your request... This may take a moment.'));
    
    // Step 1: Run sequential thinking
    const sequentialData = await runSequentialThinking(query);
    if (!sequentialData) {
      console.log(colors.important('\nFailed to analyze your query. Please try again.'));
      return runAssistant();
    }
    
    // Step 2: Display sequential thinking results
    displaySequentialThinking(sequentialData);
    
    // Step 3: Run think tool
    const thinkToolData = await runThinkTool(query, sequentialData);
    if (!thinkToolData) {
      console.log(colors.important('\nFailed to generate recommendations. Please try again.'));
      return runAssistant();
    }
    
    // Step 4: Display think tool results
    displayRecommendations(thinkToolData, query);
    
    // Step 5: Generate and display implementation plan
    displayImplementationPlan(sequentialData, thinkToolData, query);
    
    // Continue the conversation
    console.log(colors.normal('\n-'.repeat(60)));
    rl.question(colors.highlight('\nWould you like to analyze another strategy? (Y/n) '), (answer) => {
      if (answer.toLowerCase() === 'n' || answer.toLowerCase() === 'no') {
        console.log(colors.normal('\nThank you for using the Norse Card Game Strategy Assistant!'));
        rl.close();
      } else {
        // Start over
        console.clear();
        runAssistant();
      }
    });
  });
}

// Run the assistant
runAssistant();