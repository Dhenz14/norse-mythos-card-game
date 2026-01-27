/**
 * Smithery Think Tool Service
 * 
 * This service provides integration with the Think Tool MCP server
 * for strategic deck building and card combination analysis.
 */

import { Request, Response } from "express";
import fetch from 'node-fetch';

// Type definitions
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
}

interface ThinkToolResponse {
  recommendedTools: string[];
  analysis: Record<string, ToolAnalysis>;
  reasoning: string;
}

// Configuration
const API_KEY = process.env.SMITHERY_API_KEY;
const USE_MOCK = true; // Always use mock implementation for now

/**
 * Analyze a task with the Think Tool
 */
export async function thinkToolAnalysis(
  task: string,
  context?: {
    options?: string[];
    requirements?: Record<string, string>;
    tools?: Record<string, string[]>;
    [key: string]: any;
  }
): Promise<ThinkToolResponse> {
  // Always use our local MCP server implementation
  return callLocalMcpServer(task, context);
}

/**
 * Call our local MCP server implementation
 */
async function callLocalMcpServer(task: string, context?: any): Promise<ThinkToolResponse> {
  try {
    console.log(`Smithery Think Tool Service: Analyzing task "${task}"`);
    
    const requestData: ThinkToolRequest = {
      task,
      context: context || {}
    };
    
    const response = await fetch('http://localhost:5000/api/mcp/think-tool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    
    const result = await response.json() as ThinkToolResponse;
    return result;
  } catch (error) {
    console.error('Smithery Think Tool Service: Error calling local MCP server', error);
    
    // Fallback to basic response if MCP server is unavailable
    return {
      recommendedTools: ['Midrange Heimdall'],
      analysis: {
        'Midrange Heimdall': {
          name: 'Midrange Heimdall',
          score: 0.8,
          strengths: ['Balanced approach', 'Consistent performance', 'Good against various decks'],
          weaknesses: ['Not specialized', 'Can be outpaced by aggro', 'May lack late game power'],
          suitability: 0.8
        }
      },
      reasoning: `Unable to perform detailed analysis for "${task}". Midrange Heimdall is recommended as a generally balanced strategy that works well in most situations.`
    };
  }
}

// Export the service as an object
export const SmitheryThinkToolService = {
  thinkToolAnalysis
};