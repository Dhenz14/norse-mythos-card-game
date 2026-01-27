/**
 * Root Cause Analysis Service
 * 
 * This service handles the "Find The Root Cause" commands and manages
 * the deep recursive analysis of issues to find their root causes.
 */

import { RootCauseAnalyzer, AnalysisOptions, AnalysisResult } from './RootCauseAnalyzer';

export class RootCauseService {
  private static instance: RootCauseService;
  private analyzer: RootCauseAnalyzer;
  
  /**
   * Create a new instance of the Root Cause Service
   */
  private constructor() {
    this.analyzer = new RootCauseAnalyzer();
    console.log('Root Cause Service initialized');
  }
  
  /**
   * Get the singleton instance of the Root Cause Service
   */
  public static getInstance(): RootCauseService {
    if (!RootCauseService.instance) {
      RootCauseService.instance = new RootCauseService();
    }
    
    return RootCauseService.instance;
  }
  
  /**
   * Check if a command is a root cause analysis command
   */
  public isRootCauseCommand(command: string): boolean {
    // Normalize the command by converting to lowercase and removing extra whitespace
    const normalizedCommand = command.toLowerCase().trim();
    
    // Check if the command starts with "find the root cause"
    return normalizedCommand.startsWith('find the root cause');
  }
  
  /**
   * Process a root cause analysis command
   */
  public async processCommand(command: string): Promise<string> {
    try {
      // Extract the issue from the command
      const issue = this.extractIssueFromCommand(command);
      
      // Set analysis options
      const options: AnalysisOptions = {
        maxDepth: 5,
        confidenceThreshold: 60,
        includeCode: true
      };
      
      // First, check for workflow logs to gather more context
      let initialEvidence: string[] = [];
      try {
        // Try to capture some recent workflow logs for context
        const { execSync } = require('child_process');
        
        // Get recent express logs
        const expressLogs = execSync(
          'grep "\\[express\\]" ~/.pm2/logs/*out.log 2>/dev/null | tail -n 20 || echo ""',
          { encoding: 'utf-8' }
        );
        
        if (expressLogs && expressLogs.trim()) {
          initialEvidence.push(`Found express logs: ${expressLogs.split('\n').length} lines`);
        }
        
        // Check for patterns related to common issues
        if (expressLogs.includes('304')) {
          initialEvidence.push('Detected 304 (Not Modified) responses in logs');
        }
        
        if (expressLogs.includes('/api/cloudinary')) {
          initialEvidence.push('Detected Cloudinary API calls in logs');
        }
        
        // Count requests per second to check for request spikes
        const timestamps = expressLogs.match(/\d+:\d+:\d+ [AP]M \[express\]/g);
        if (timestamps && timestamps.length > 0) {
          initialEvidence.push(`Found ${timestamps.length} timestamped API requests`);
        }
      } catch (e) {
        // Continue even if log collection fails
        console.log('Failed to collect workflow logs:', e);
      }
      
      // Analyze the issue
      console.log(`Analyzing issue: "${issue}"`);
      const result = await this.analyzer.analyzeIssue(issue, options);
      
      // If we have initial evidence, add it to the first finding
      if (initialEvidence.length > 0 && result.investigationPath.length > 0) {
        result.investigationPath[0].evidence = [
          ...result.investigationPath[0].evidence,
          ...initialEvidence
        ];
      }
      
      // Format the result
      return this.analyzer.formatAnalysisResult(result);
    } catch (error) {
      console.error('Error processing root cause analysis command:', error);
      return `Error analyzing root cause: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  /**
   * Extract the issue from a command
   */
  private extractIssueFromCommand(command: string): string {
    // Remove the "find the root cause" prefix
    const withoutPrefix = command.replace(/^find\s+the\s+root\s+cause\s+/i, '').trim();
    
    // If there's nothing left, use a default message
    if (!withoutPrefix) {
      return 'Unknown issue to analyze';
    }
    
    // Remove "of" or "for" at the beginning if present
    return withoutPrefix.replace(/^(of|for)\s+/i, '').trim();
  }
}