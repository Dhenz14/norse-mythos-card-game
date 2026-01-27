/**
 * ReplitAIThinkToolsService
 * 
 * This service acts as a bridge between the Replit AI chat interface
 * and the Think Tools system, ensuring proper formatting and display
 * of the analysis process and results.
 */

import useThinkTools from '../lib/thinkToolsIntegration';

export class ReplitAIThinkToolsService {
  private static instance: ReplitAIThinkToolsService;
  private thinkToolsHook: ReturnType<typeof useThinkTools> | null = null;
  
  /**
   * Initialize the Think Tools hook
   */
  public initialize(hook: ReturnType<typeof useThinkTools>): void {
    this.thinkToolsHook = hook;
    console.log('ReplitAIThinkToolsService initialized');
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ReplitAIThinkToolsService {
    if (!ReplitAIThinkToolsService.instance) {
      ReplitAIThinkToolsService.instance = new ReplitAIThinkToolsService();
    }
    return ReplitAIThinkToolsService.instance;
  }
  
  /**
   * Format a Think Tools command for display
   */
  public formatCommand(command: string): string {
    if (!this.thinkToolsHook || !this.thinkToolsHook.isThinkToolsCommand(command)) {
      return command;
    }
    
    return `🔮 PROCESSING: ${command}`;
  }
  
  /**
   * Process a Think Tools command
   */
  public async processCommand(command: string): Promise<string | null> {
    if (!this.thinkToolsHook || !this.thinkToolsHook.isThinkToolsCommand(command)) {
      return null;
    }
    
    const response = await this.thinkToolsHook.triggerThinkTools(command);
    
    if (!response.triggered) {
      return null;
    }
    
    if (response.error) {
      return `🔮 THINK TOOLS ERROR 🔮\n\n${response.error}`;
    }
    
    return response.result || null;
  }
  
  /**
   * Check if a message is a Think Tools command
   */
  public isThinkToolsCommand(message: string): boolean {
    return this.thinkToolsHook?.isThinkToolsCommand(message) || false;
  }
  
  /**
   * Get the current progress of Think Tools analysis
   */
  public getProgress(): string {
    return this.thinkToolsHook?.getThinkToolsState().progress || '';
  }
  
  /**
   * Register a handler for ThinkTools operations in the Replit AI chat
   * This patches the existing chat interface to properly handle Think Tools commands
   */
  public registerWithReplitAI(): void {
    // This would be implemented based on the specific Replit AI chat interface
    // As a placeholder, we'll add a global function that the Replit AI could call
    
    // @ts-ignore - Adding to window for Replit AI integration
    window.thinkToolsService = {
      isThinkToolsCommand: this.isThinkToolsCommand.bind(this),
      processCommand: this.processCommand.bind(this),
      formatCommand: this.formatCommand.bind(this),
      getProgress: this.getProgress.bind(this)
    };
    
    console.log('Think Tools service registered with Replit AI');
  }
}

export default ReplitAIThinkToolsService;