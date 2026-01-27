/**
 * Think Tools Integration
 * 
 * This module connects all the enhanced Think Tools components together,
 * providing a unified interface for codebase-aware strategic analysis
 * with integration to Replit tools.
 * 
 * Now includes the template enforcement middleware and response logging systems
 * for consistent Think Tools output formatting.
 */

import { ThinkToolsContext } from './ThinkToolsContext';
import { ReplitToolsAdapter } from './ReplitToolsAdapter';
import { EnhancedThinkTools } from './EnhancedThinkTools';
import EnhancedResponseFormatter from './EnhancedResponseFormatter';
import ThinkToolsTemplateMiddleware from './ThinkToolsTemplateMiddleware';
import ThinkToolsResponseLogger, { LogLevel } from './ThinkToolsResponseLogger';
import { initThinkToolsMiddleware, initThinkToolsRecoveryMechanism } from './initThinkToolsMiddleware';

/**
 * Initialize the enhanced Think Tools system
 */
export function initializeThinkTools(): void {
  try {
    // Initialize the context provider
    console.log('Initializing Think Tools system...');
    
    // Initialize middleware for template formatting
    initThinkToolsMiddleware();
    
    // Initialize recovery mechanism for error handling
    initThinkToolsRecoveryMechanism();
    
    // Log successful initialization
    const logger = ThinkToolsResponseLogger.getInstance();
    logger.log('Enhanced Think Tools system fully initialized with template enforcement', LogLevel.SUCCESS);
    
    console.log('Enhanced Think Tools initialized successfully');
  } catch (error) {
    console.error('Error initializing Enhanced Think Tools:', error);
  }
}

/**
 * Process a Think Tools query with enhanced capabilities
 * Now with template formatting enforcement through middleware
 */
export async function processEnhancedThinkToolsQuery(
  query: string,
  options: {
    codebaseContext?: boolean;
    allowToolExecution?: boolean;
    previousResults?: any;
  } = {}
): Promise<string> {
  const startTime = Date.now();
  const logger = ThinkToolsResponseLogger.getInstance();
  
  try {
    // Get the ThinkToolsContext singleton instance
    const context = ThinkToolsContext.getInstance();
    
    // Create an enhanced tools instance with the context
    const enhancedToolsInstance = new EnhancedThinkTools(context);
    
    logger.log(`Processing Think Tools query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`, LogLevel.INFO);
    
    // Get raw analysis result
    const result = await enhancedToolsInstance.analyzeQuery(query, {
      context: options.previousResults,
      allowToolExecution: options.allowToolExecution
    });
    
    // Format response with our standard formatter
    const responseFormatter = new EnhancedResponseFormatter();
    const formattedResponse = responseFormatter.formatResponse(result);
    
    // Apply middleware for template enforcement
    const middleware = ThinkToolsTemplateMiddleware.getInstance();
    const finalResponse = middleware.applyMiddleware(formattedResponse, true);
    
    // Log performance metrics
    const processingTime = Date.now() - startTime;
    logger.log(`Think Tools query processed in ${processingTime}ms`, LogLevel.SUCCESS);
    
    return finalResponse;
  } catch (error: any) {
    // Log the error
    const errorTime = Date.now() - startTime;
    logger.log(`Error processing Think Tools query: ${error.message}`, LogLevel.ERROR);
    console.error('Error processing enhanced Think Tools query:', error);
    
    // Provide a formatted error response
    return `🔮 THINK TOOLS ERROR 🔮\n\nSorry, an error occurred while processing your query: ${error.message}`;
  }
}

/**
 * Search the codebase for cards matching a query
 */
export function searchCards(query: string): any[] {
  const context = ThinkToolsContext.getInstance();
  return context.searchCards(query);
}

/**
 * Get cards by class name
 */
export function getCardsByClass(className: string): any[] {
  const context = ThinkToolsContext.getInstance();
  return context.getCardsByClass(className);
}

/**
 * Get class distribution statistics
 */
export function getClassDistribution(): Record<string, number> {
  const context = ThinkToolsContext.getInstance();
  return context.getClassDistribution();
}

/**
 * Analyze card balance for a specific class
 */
export function analyzeClassBalance(className: string): any {
  const context = ThinkToolsContext.getInstance();
  return context.analyzeClassBalance(className);
}

/**
 * Get game mechanics
 */
export function getGameMechanics(): string[] {
  const context = ThinkToolsContext.getInstance();
  return context.getMechanics();
}

/**
 * Search the filesystem for relevant files
 */
export async function searchFilesystem(params: any): Promise<string[]> {
  const replitTools = new ReplitToolsAdapter();
  return replitTools.searchFilesystem(params);
}

/**
 * Execute a bash command
 */
export async function executeCommand(command: string): Promise<string> {
  const replitTools = new ReplitToolsAdapter();
  return replitTools.executeBashCommand(command);
}

/**
 * View file content
 */
export async function viewFile(filePath: string, viewRange?: [number, number]): Promise<string> {
  // This would use the str_replace_editor tool with 'view' command in a real implementation
  console.log(`Would view file: ${filePath} with range: ${viewRange}`);
  return `Content of ${filePath}`;
}

/**
 * Edit file content
 */
export async function editFile(filePath: string, oldStr: string, newStr: string): Promise<boolean> {
  const replitTools = new ReplitToolsAdapter();
  return replitTools.replaceInFile(filePath, oldStr, newStr);
}

export default {
  initializeThinkTools,
  processEnhancedThinkToolsQuery,
  searchCards,
  getCardsByClass,
  getClassDistribution,
  analyzeClassBalance,
  getGameMechanics,
  searchFilesystem,
  executeCommand,
  viewFile,
  editFile
};