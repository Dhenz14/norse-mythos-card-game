/**
 * Root Cause Controller
 * 
 * This controller provides API endpoints for the integrated Root Cause Analysis system
 * that combines all debugging tools into a unified experience accessible from Replit Chat.
 */

import { Request, Response } from 'express';
import { RootCauseIntegrator } from '../mcp/RootCauseIntegrator';
import { AnalysisOptions } from '../mcp/RootCauseAnalyzer';

const rootCauseIntegrator = new RootCauseIntegrator();

/**
 * Analyze an issue with the full integrated toolset
 */
export const analyzeIssue = async (req: Request, res: Response) => {
  try {
    const { issue, options } = req.body;
    
    if (!issue || typeof issue !== 'string') {
      return res.status(400).json({ error: 'Issue description is required' });
    }
    
    // Perform comprehensive integrated analysis
    const result = await rootCauseIntegrator.analyzeIssue(issue, options || {});
    
    // Format the result for display in Replit chat
    const formattedResult = rootCauseIntegrator.formatResultForChat(result);
    
    return res.json({ result, formattedResult });
  } catch (error: any) {
    console.error('Error analyzing issue:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get the formatted result for Replit Chat
 */
export const getFormattedResult = async (req: Request, res: Response) => {
  try {
    const { result } = req.body;
    
    if (!result) {
      return res.status(400).json({ error: 'Analysis result is required' });
    }
    
    // Format the result for display
    const formattedResult = rootCauseIntegrator.formatResultForChat(result);
    
    return res.json({ formattedResult });
  } catch (error: any) {
    console.error('Error formatting result:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Generate Think Tools analysis for an issue
 */
export const thinkToolsAnalysis = async (req: Request, res: Response) => {
  try {
    const { issue } = req.body;
    
    if (!issue || typeof issue !== 'string') {
      return res.status(400).json({ error: 'Issue description is required' });
    }
    
    // Create a simplified options object focused on thinking
    const options: AnalysisOptions = {
      maxDepth: 3,
      includeCode: true,
      confidenceThreshold: 60
    };
    
    // Perform analysis with emphasis on sequential thinking
    const result = await rootCauseIntegrator.analyzeIssue(issue, options);
    
    // Format the result for display emphasizing the thinking steps
    const formattedResult = rootCauseIntegrator.formatResultForChat(result);
    
    return res.json({ result, formattedResult });
  } catch (error: any) {
    console.error('Error using think tools:', error);
    return res.status(500).json({ error: error.message });
  }
};