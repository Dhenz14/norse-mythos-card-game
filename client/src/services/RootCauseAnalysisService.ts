/**
 * Root Cause Analysis Service
 * 
 * This service provides client-side access to the root cause analysis API.
 */

import axios from 'axios';

interface RootCauseAnalysisResponse {
  response: string;
}

interface RootCauseCommandCheckResponse {
  isRootCauseCommand: boolean;
}

/**
 * Service for interacting with the Root Cause Analysis API
 */
class RootCauseAnalysisService {
  private static instance: RootCauseAnalysisService;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance of the service
   */
  public static getInstance(): RootCauseAnalysisService {
    if (!RootCauseAnalysisService.instance) {
      RootCauseAnalysisService.instance = new RootCauseAnalysisService();
    }
    
    return RootCauseAnalysisService.instance;
  }
  
  /**
   * Process a root cause analysis command
   * 
   * @param command The command to process (e.g., "Find the root cause of excessive API calls")
   * @returns The analysis response
   */
  public async processCommand(command: string): Promise<string> {
    try {
      const response = await axios.post<RootCauseAnalysisResponse>('/api/rootcause/process', {
        command
      });
      
      return response.data.response;
    } catch (error) {
      console.error('Error processing root cause analysis command:', error);
      throw error;
    }
  }
  
  /**
   * Check if a command is a root cause analysis command
   * 
   * @param command The command to check
   * @returns Whether the command is a root cause analysis command
   */
  public async checkCommand(command: string): Promise<boolean> {
    try {
      const response = await axios.post<RootCauseCommandCheckResponse>('/api/rootcause/check', {
        command
      });
      
      return response.data.isRootCauseCommand;
    } catch (error) {
      console.error('Error checking root cause analysis command:', error);
      return false;
    }
  }
  
  /**
   * Create a formatted root cause analysis command for a given issue
   * 
   * @param issue The issue to analyze
   * @returns A properly formatted command
   */
  public createCommand(issue: string): string {
    // Remove "of" or "for" if they're at the beginning of the issue
    const cleanIssue = issue.replace(/^(of|for)\s+/i, '').trim();
    
    // Create the command
    return `Find the root cause of ${cleanIssue}`;
  }
}

export default RootCauseAnalysisService;