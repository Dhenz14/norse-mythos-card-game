#!/usr/bin/env node

/**
 * Combined Strategy Analysis Script
 * 
 * This script combines the sequential thinking and think-tool APIs to:
 * 1. First, analyze a strategy using sequential thinking
 * 2. Then, convert those ideas into actionable deck suggestions
 * 
 * Usage:
 * node combinedStrategyScript.js "Your strategy question"
 */

const fetch = require('node-fetch');

async function runSequentialThinking(task) {
  console.log("Phase 1: Sequential Thinking Analysis\n");
  console.log(`Analyzing: "${task}"\n`);

  try {
    const response = await fetch('http://localhost:5000/api/mcp/sequential-thinking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task }),
    });

    if (!response.ok) {
      throw new Error(`Sequential thinking API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log("Sequential Analysis Results:");
    console.log("============================\n");
    
    // Format and display the sequential thinking steps
    data.steps.forEach((step, index) => {
      console.log(`Step ${index + 1}: ${step.title}`);
      console.log(`${step.content}\n`);
    });
    
    console.log("Reasoning:");
    console.log(data.reasoning);
    console.log("\n");
    
    return data;
  } catch (error) {
    console.error('Error in sequential thinking phase:', error);
    process.exit(1);
  }
}

async function runThinkTool(task, sequentialData) {
  console.log("\nPhase 2: Think Tool Analysis\n");
  console.log(`Converting analysis to actionable deck strategies...\n`);

  // Create an enhanced task by combining the original task with insights from sequential thinking
  const enhancedTask = `Based on this strategy analysis: ${task}. 
  Key considerations: ${sequentialData.steps.map(step => step.title).join(", ")}`;

  try {
    const response = await fetch('http://localhost:5000/api/mcp/think-tool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task: enhancedTask }),
    });

    if (!response.ok) {
      throw new Error(`Think tool API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log("Recommended Decks:");
    console.log("==================\n");
    
    // Display recommended decks
    data.recommendedTools.forEach(deck => {
      const analysis = data.analysis[deck];
      console.log(`> ${deck}`);
      console.log(`  Strengths: ${analysis.strengths.join(", ")}`);
      console.log(`  Weaknesses: ${analysis.weaknesses.join(", ")}`);
      console.log(`  Key Cards: ${analysis.keyCards.join(", ")}\n`);
    });
    
    console.log("Reasoning:");
    console.log(data.reasoning);
    
    return data;
  } catch (error) {
    console.error('Error in think tool phase:', error);
    process.exit(1);
  }
}

async function main() {
  // Get the task from command line arguments
  const task = process.argv.slice(2).join(" ");
  
  if (!task) {
    console.log("Please provide a strategy question as a command line argument.");
    console.log("Example: node combinedStrategyScript.js \"How to counter aggro Thor with a control deck\"");
    process.exit(1);
  }
  
  // Run the sequential thinking analysis
  const sequentialData = await runSequentialThinking(task);
  
  // Use the sequential thinking results to inform the think tool analysis
  const thinkToolData = await runThinkTool(task, sequentialData);
  
  console.log("\nCombined Strategy Analysis Complete!");
  console.log("====================================");
  console.log(`For your query: "${task}"`);
  console.log(`First consider the ${sequentialData.steps.length} analysis steps, then implement using the ${thinkToolData.recommendedTools.length} recommended deck(s).`);
}

main().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
});