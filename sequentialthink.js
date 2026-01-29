#!/usr/bin/env node

/**
 * Sequentialthink.js - Command line tool for using Smithery sequential thinking
 * 
 * Usage:
 * ./sequentialthink.js "What's the optimal strategy for building a deck with Norse mythology card synergies?"
 * 
 * Options:
 * --mock=true|false    Enable or disable mock mode 
 * --steps=NUMBER       Maximum number of thinking steps (default: 5)
 * --temp=NUMBER        Temperature for generation (0.0-1.0, default: 0.7)
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(chalk.red('Error: No prompt provided'));
  console.log('\nUsage:');
  console.log('  ./sequentialthink.js "Your question or prompt here"');
  console.log('\nOptions:');
  console.log('  --mock=true|false    Enable or disable mock mode');
  console.log('  --steps=NUMBER       Maximum number of thinking steps (default: 5)');
  console.log('  --temp=NUMBER        Temperature for generation (0.0-1.0, default: 0.7)');
  process.exit(1);
}

// Extract options
let prompt;
let mockMode = null;
let maxSteps = 5;
let temperature = 0.7;

for (const arg of args) {
  if (arg.startsWith('--mock=')) {
    const value = arg.split('=')[1].toLowerCase();
    mockMode = value === 'true';
  } else if (arg.startsWith('--steps=')) {
    maxSteps = parseInt(arg.split('=')[1], 10);
    if (isNaN(maxSteps) || maxSteps < 1) {
      maxSteps = 5;
    }
  } else if (arg.startsWith('--temp=')) {
    temperature = parseFloat(arg.split('=')[1]);
    if (isNaN(temperature) || temperature < 0 || temperature > 1) {
      temperature = 0.7;
    }
  } else if (!prompt) {
    prompt = arg;
  }
}

// First, check the status and mock mode
async function getServiceStatus() {
  try {
    const response = await fetch('http://localhost:5000/api/smithery/status');
    return await response.json();
  } catch (error) {
    console.error(chalk.red(`Error checking service status: ${error.message}`));
    return null;
  }
}

// Configure mock mode if needed
async function configureMockMode(enabled) {
  try {
    const response = await fetch('http://localhost:5000/api/smithery/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ useMockFallback: enabled })
    });
    return await response.json();
  } catch (error) {
    console.error(chalk.red(`Error configuring mock mode: ${error.message}`));
    return null;
  }
}

// Request sequential thinking
async function performSequentialThinking(prompt) {
  try {
    const queryParams = new URLSearchParams({ prompt });
    const response = await fetch(`http://localhost:5000/api/smithery/think?${queryParams}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }
    
    return await response.text();
  } catch (error) {
    console.error(chalk.red(`Error performing sequential thinking: ${error.message}`));
    return null;
  }
}

// Execute the main function
async function main() {
  try {
    // Check status
    const status = await getServiceStatus();
    
    if (!status) {
      console.error(chalk.red('Could not connect to the sequential thinking service.'));
      console.error(chalk.yellow('Make sure the server is running on port 5000.'));
      process.exit(1);
    }
    
    // Configure mock mode if specified
    if (mockMode !== null) {
      const configResult = await configureMockMode(mockMode);
      if (configResult && configResult.success) {
        console.log(chalk.green(`Mock mode ${configResult.mockFallbackEnabled ? 'enabled' : 'disabled'}`));
      }
    } else {
      // Display current status
      console.log(chalk.blue(`Service status: ${status.status}`));
      console.log(chalk.blue(`API configured: ${status.apiConfigured ? 'Yes' : 'No'}`));
      console.log(chalk.blue(`Mock fallback enabled: ${status.mockFallbackEnabled ? 'Yes' : 'No'}`));
      console.log(chalk.blue(`Using mock mode: ${status.mockFallbackActive ? 'Yes' : 'No'}`));
      console.log();
    }
    
    // Perform sequential thinking
    console.log(chalk.yellow('Processing prompt: ') + chalk.white(`"${prompt}"`));
    console.log();
    
    const result = await performSequentialThinking(prompt);
    
    if (result) {
      console.log(result);
    } else {
      console.error(chalk.red('Failed to get a response from the sequential thinking service.'));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`Unhandled error: ${error.message}`));
  process.exit(1);
});